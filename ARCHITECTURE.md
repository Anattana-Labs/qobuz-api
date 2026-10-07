# Architecture Specification

> **Project:** Qobuz FLAC Audio API (`qobuz-api`)  
> **Repository:** [https://github.com/Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api)  
> **Architect & Lead Developer:** Shashwat  
> **License:** MIT

---

## 1. System Overview

`qobuz-api` is a lightweight, high-throughput microservice that bridges YouTube Music playback items with Qobuz's lossless and high-resolution catalog. The server receives a YouTube video identifier or URL, parses canonical track metadata, aligns the track against Qobuz using multi-layered heuristic scoring, generates authenticated stream URLs across all supported audio quality tiers, and returns a consolidated JSON payload.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    Client(["HTTP Client / Muzo Bot"]) -->|GET /?id={videoId}| Server["server.js (HTTP Server)"]
    Server --> Route["src/routes/handler.js (handleRequest)"]

    subgraph Phase1 ["Phase 1: Input & Metadata Extraction"]
        Route --> Extractor["src/utils/string.js (extractVideoId)"]
        Extractor --> YTService["src/services/youtube.js (fetchYouTubeMetadata)"]
        YTService -->|Primary| InnerTube["YouTube Music InnerTube /next API"]
        YTService -.->|Fallback| oEmbed["YouTube oEmbed API"]
    end

    subgraph Phase2 ["Phase 2: Qobuz Search & Candidate Retrieval"]
        YTService --> QobuzClient["src/services/qobuz.js (QobuzClient)"]
        QobuzClient -->|Credential Rotation| QobuzSearch["Qobuz API: /track/search"]
        QobuzSearch -.->|Fallback Proxy| QobuzProxy["Qobuz Fallback API"]
    end

    subgraph Phase3 ["Phase 3: Heuristic Alignment"]
        QobuzClient --> Matcher["src/services/matcher.js (findBestTrackMatch)"]
        Matcher -->|1. Exact Title| TitleCheck{"Exact Title Match?"}
        TitleCheck -- Yes --> ArtistCheck{"Artist Jaccard Sim >= 0.4?"}
        TitleCheck -- No --> RejectCandidate["Drop Candidate"]
        ArtistCheck -- Yes --> DurationCheck{"Abs(Delta Duration) <= 3s?"}
        ArtistCheck -- No --> RejectCandidate
        DurationCheck -- Yes --> Score["Compute Weighted Score"]
        DurationCheck -- No --> RejectCandidate
    end

    subgraph Phase4 ["Phase 4: Stream Resolution"]
        Matcher --> StreamResolver["Qobuz Stream Resolution (Promise.all)"]
        StreamResolver -->|Signed URL / Format 5,6,7,27| QobuzGetFileUrl["Qobuz API: /track/getFileUrl"]
        StreamResolver -.->|Hi-Res 192kHz Fallback| StreamFallback["Qobuz DLL Fallback Stream"]
    end

    StreamResolver --> ResponsePayload["JSON Response (HTTP 200)"]
    ResponsePayload --> Client
```

---

## 3. Subsystem Breakdown

### 3.1 HTTP Server & Route Controller
- **Location:** `server.js` and `src/routes/handler.js`
- **Role:** Handles incoming HTTP connections, applies permissive CORS headers, routes requests (`/health` vs audio resolution `/`), validates query parameters, orchestrates downstream service calls, and serializes responses.

### 3.2 YouTube Metadata Extraction Service
- **Location:** `src/services/youtube.js`
- **Role:**
  1. Constructs an audio-only `WEB_REMIX` context payload targeting YouTube Music's `/youtubei/v1/next` endpoint.
  2. Traverses the response AST via recursive key collection (`findAll`) to extract `playlistPanelVideoRenderer` objects.
  3. Parses artist byline runs, album browse endpoints, and formatted duration text.
  4. Automatically falls back to the YouTube `oEmbed` endpoint if InnerTube encounters rate limits, geo-blocks, or parsing failures.

### 3.3 Qobuz Client & Credential Pool
- **Location:** `src/services/qobuz.js`
- **Role:**
  - Maintains a rotating credential pool defined in `src/config.js` (`userId`, `authToken`, `appId`, `appSecret`).
  - Generates MD5 signature hashes for request authorization:
    $$\text{MD5}(\text{"trackgetFileUrlformat\_id"} + \text{formatId} + \text{"intentstreamtrack\_id"} + \text{trackId} + \text{timestamp} + \text{appSecret})$$
  - Dispatches parallel stream requests across four distinct quality tiers.
  - Implements external fallback proxy integration for catalog search and 24-bit/192kHz stream extraction when primary credentials expire.

### 3.4 Heuristic Matcher Engine
- **Location:** `src/services/matcher.js` and `src/utils/string.js`
- **Role:**
  Prevents erroneous track matches through a 3-tier filtration and scoring process designed by Shashwat:
  1. **Exact Normalized Title:** Strips remaster tags, feat markers, and punctuation. Candidate track must match the query title exactly.
  2. **Artist Jaccard Word Similarity:** Requires a minimum similarity threshold of `0.4` or direct word containment.
  3. **Duration Tolerance Window:** Rejects candidates whose duration deviates by more than `3` seconds from the YouTube source duration.
  4. **Scoring Formulation:**
     $$\text{Score} = 0.5 + (0.35 \times \text{Sim}_{\text{artist}}) + (0.15 \times \text{Score}_{\text{duration}})$$

---

## 4. Supported Audio Stream Formats

| Format ID | Key | Specifications | Bit Depth | Sample Rate |
| :---: | :--- | :--- | :---: | :---: |
| `5` | `mp3_320` | Lossy MP3 | 16-Bit | 44.1 kHz |
| `6` | `flac_cd` | Lossless CD Quality FLAC | 16-Bit | 44.1 kHz |
| `7` | `flac_hires_96` | Hi-Res Lossless FLAC | 24-Bit | Up to 96 kHz |
| `27` | `flac_hires_192` | Hi-Res Max FLAC | 24-Bit | Up to 192 kHz |

---

## 5. Resilience & Fault Tolerance

1. **Credential Pool Cycling:** If one credential receives HTTP 401/403/429, the client iteratively tries the next credentials in `CREDENTIALS_POOL`.
2. **Double Fallback Search:** If artist + title search yields zero items, the client executes a title-only search, followed by proxy fallback search.
3. **Stream Degradation Handling:** If one format tier fails (e.g., Hi-Res unavailable for older recordings), available tiers still succeed, returning a `partial_error` status with available streams and detailed `stream_errors`.
