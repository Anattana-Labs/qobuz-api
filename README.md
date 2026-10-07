# Qobuz FLAC Audio API & Stream Matcher

[![GitHub Repository](https://img.shields.io/badge/GitHub-Anattana--Labs%2Fqobuz--api-blue?logo=github)](https://github.com/Anattana-Labs/qobuz-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Author](https://img.shields.io/badge/Author-Shashwat-orange.svg)](https://github.com/Anattana-Labs/qobuz-api)

> Qobuz API is a lossless audio streaming microservice built for the Muzo App. It seamlessly bridges YouTube Music with Qobuz's studio-grade catalog, using strict heuristic matching to resolve tracks into authenticated Hi-Res FLAC streams (16-bit/44.1kHz up to 24-bit/192kHz) for audiophile-grade playback directly inside the Muzo App.

Repository: [https://github.com/Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api)

---

## 🎵 What is this?

**`qobuz-api`** serves as the audio resolution and stream-extraction backbone for the **Muzo App**:

1. **Seamless Muzo App Integration**: When a user queues or plays a track in the Muzo App via YouTube or YouTube Music, the app dispatches the video ID or URL to this microservice.
2. **Qobuz Hi-Res Upgrade**: Instead of settling for standard compressed YouTube audio (Opus ~160kbps), this API queries Qobuz's lossless catalog, applies strict heuristic matching, and retrieves authenticated direct FLAC stream URLs.
3. **Audiophile Playback**: Muzo App feeds the resolved Hi-Res FLAC stream directly into its playback pipeline, delivering pristine CD-quality and 24-bit studio sound.

## 📑 Documentation Index

- [Architecture Guide](ARCHITECTURE.md) - Deep-dive into design, request flow, and heuristics.
- [Engineering Guidelines](ENGINEERING.md) - Code conventions, patterns, error handling, and security.
- [Agent Instructions](AGENTS.md) - Operational guidelines and context for AI coding agents.
- [API Reference](API.md) - Detailed request and response specification.
- [License](LICENSE) - MIT License.

---

## ⚡ Highlights

- **Multi-File Modular Structure**: Clean separation of concerns across config, routes, services, and utils.
- **YouTube Music Metadata Extraction**: Direct InnerTube `/next` client integration with an automatic oEmbed fallback.
- **Multi-Tier Audio Resolution**: Fetches MP3 320kbps, 16-Bit CD FLAC, 24-Bit / 96kHz Hi-Res FLAC, and 24-Bit / 192kHz Hi-Res Max.
- **Strict Heuristic Matcher**: Prevents false matches using title normalization, Jaccard artist word similarity, and strict duration tolerance (±3s).
- **High-Availability Fallbacks**: Automatic failover between credential pools and fallback upstream endpoints.
- **CORS & Zero External Framework Overhead**: Lightweight native HTTP server running on standard Node.js runtime.

---

## 📁 Repository Structure

```
├── AGENTS.md               # AI Agent operating guidelines
├── API.md                  # Comprehensive API documentation
├── ARCHITECTURE.md         # System design and architecture document
├── ENGINEERING.md          # Engineering standards, testing, and practices
├── LICENSE                 # MIT License (Shashwat)
├── package.json            # Project manifest & metadata
├── README.md               # Project overview
├── server.js               # Microservice entry point
└── src/
    ├── config.js           # Environment config, credential pool & audio format tiers
    ├── routes/
    │   └── handler.js      # HTTP routing, CORS headers & response dispatching
    ├── services/
    │   ├── matcher.js      # Heuristic track matching engine
    │   ├── qobuz.js        # Qobuz API client & fallback stream resolver
    │   └── youtube.js      # InnerTube & oEmbed metadata extractor
    └── utils/
        ├── crypto.js       # MD5 API signature generator
        └── string.js       # Sanitization, Jaccard similarity & duration parser
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
git clone https://github.com/Anattana-Labs/qobuz-api.git
cd qobuz-api
npm install
```

### Running Locally

```bash
# Start server
npm start

# Development mode (Node watch mode)
npm run dev
```

The server listens on `http://0.0.0.0:10000` by default.

---

## 🔧 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Listening port for the HTTP server | `10000` |
| `QOBUZ_USER_ID` | Qobuz account User ID | Default pool account |
| `QOBUZ_AUTH_TOKEN`| Qobuz User Authentication Token | Default pool token |
| `QOBUZ_APP_ID` | Qobuz Developer Application ID | Default app ID |
| `QOBUZ_APP_SECRET`| Qobuz Developer Application Secret | Default app secret |

---

## 📡 API Overview

### Match & Resolve Stream

```http
GET /?id=<YOUTUBE_VIDEO_ID>
GET /?url=<YOUTUBE_VIDEO_URL>
```

**Parameters:**
- `id` (or `videoId`): 11-character YouTube video ID (e.g. `dQw4w9WgXcQ`).
- `url`: Full or short YouTube / YouTube Music URL.

**Response (HTTP 200):**
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
    "flac_hires_96": {
      "label": "FLAC 24-Bit / up to 96 kHz (Hi-Res Lossless)",
      "format_id": 7,
      "mime_type": "audio/flac",
      "bit_depth": 24,
      "sampling_rate": 96,
      "url": "https://..."
    }
  }
}
```

### Health Check

```http
GET /health
```

**Response (HTTP 200):**
```json
{
  "status": "healthy",
  "service": "flac-server",
  "author": "Shashwat",
  "timestamp": "2026-10-07T08:41:01.918Z"
}
```

---

## 👤 Author

Developed and maintained by **Shashwat**  
Organization: [Anattana Labs](https://github.com/Anattana-Labs)  
Repository: [https://github.com/Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
