# API Specification & Reference

> **Project:** Qobuz FLAC Audio API (`qobuz-api`)  
> **Repository:** [https://github.com/Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api)  
> **Author:** Shashwat  
> **License:** MIT

---

## Base URL

```http
http://localhost:10000
```
*(Port can be customized using the `PORT` environment variable)*

---

## Endpoints

### 1. Resolve Audio Stream

Matches a YouTube Music track to a Qobuz lossless stream.

- **Method:** `GET`
- **Path:** `/`
- **CORS:** `Access-Control-Allow-Origin: *`

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | Conditionally | 11-character YouTube video ID (e.g. `dQw4w9WgXcQ`). |
| `videoId`| `string` | Conditionally | Alias for `id`. |
| `url` | `string` | Conditionally | Full YouTube URL (e.g. `https://music.youtube.com/watch?v=...` or `https://youtu.be/...`). |

*Note: At least one of `id`, `videoId`, or `url` must be provided.*

#### Responses

##### HTTP 200 OK — Successful Match
```json
{
  "status": "success",
  "ytmusic": {
    "videoId": "dQw4w9WgXcQ",
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "duration": 213
  },
  "matched_track": {
    "id": 1234567,
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "album": "Whenever You Need Somebody",
    "duration": 213,
    "hires": true,
    "maximum_bit_depth": 24,
    "maximum_sampling_rate": 96.0
  },
  "streams": {
    "mp3_320": {
      "label": "MP3 320 kbps",
      "format_id": 5,
      "mime_type": "audio/mpeg",
      "bit_depth": null,
      "sampling_rate": null,
      "url": "https://streaming-qobuz..."
    },
    "flac_cd": {
      "label": "FLAC 16-Bit / 44.1 kHz (Lossless CD)",
      "format_id": 6,
      "mime_type": "audio/flac",
      "bit_depth": 16,
      "sampling_rate": 44.1,
      "url": "https://streaming-qobuz..."
    },
    "flac_hires_96": {
      "label": "FLAC 24-Bit / up to 96 kHz (Hi-Res Lossless)",
      "format_id": 7,
      "mime_type": "audio/flac",
      "bit_depth": 24,
      "sampling_rate": 96,
      "url": "https://streaming-qobuz..."
    },
    "flac_hires_192": {
      "label": "FLAC 24-Bit / up to 192 kHz (Hi-Res Max)",
      "format_id": 27,
      "mime_type": "audio/flac",
      "bit_depth": 24,
      "sampling_rate": 192,
      "url": "https://streaming-qobuz..."
    }
  },
  "raw_results": [
    {
      "id": 1234567,
      "title": "Never Gonna Give You Up",
      "artist": "Rick Astley",
      "album": "Whenever You Need Somebody",
      "duration": 213
    }
  ]
}
```

##### HTTP 400 Bad Request — Missing Identifier
```json
{
  "status": "error",
  "message": "Missing or invalid YouTube video ID/URL. Usage: /?id={videoId} or /?url={youtubeUrl}"
}
```

##### HTTP 404 Not Found — No Qobuz Match
```json
{
  "status": "error",
  "message": "No exact/strict matching track found on Qobuz catalog.",
  "ytmusic": {
    "videoId": "abc123xyz00",
    "title": "Unknown Indie Track",
    "artist": "Indie Band",
    "duration": 180
  },
  "raw_results": []
}
```

---

### 2. Health Check

Verifies server liveness and service metadata.

- **Method:** `GET`
- **Path:** `/health`
- **CORS:** `Access-Control-Allow-Origin: *`

#### Response (HTTP 200 OK)
```json
{
  "status": "healthy",
  "service": "flac-server",
  "author": "Shashwat",
  "timestamp": "2026-10-07T08:41:01.918Z"
}
```
