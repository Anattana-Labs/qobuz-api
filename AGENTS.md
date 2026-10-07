# AI Agent Guidelines & Context

> **Project:** Qobuz FLAC Audio API (`qobuz-api`)  
> **Repository:** [https://github.com/Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api)  
> **Lead Developer & Maintainer:** Shashwat  
> **License:** MIT

---

## 1. Persona & Context

When working on this repository, you are collaborating on a performance-critical audio resolution microservice maintained by **Shashwat**. This service maps YouTube Music tracks to Qobuz lossless audio streams for bot and audio streaming clients.

---

## 2. File Organization & Boundaries

Any modifications must strictly adhere to the established multi-file architecture:

- `server.js`: Only responsible for spinning up the HTTP server listener and displaying the startup banner. Do not put business logic here.
- `src/config.js`: All credentials, ports, endpoints, API keys, and quality format constants belong here.
- `src/routes/handler.js`: Handles HTTP routing, query extraction, CORS headers, and final payload construction.
- `src/services/youtube.js`: All YouTube Music / InnerTube / oEmbed logic belongs here.
- `src/services/qobuz.js`: All Qobuz catalog queries, credential rotation, and stream URL requests belong here.
- `src/services/matcher.js`: All heuristic alignment logic belongs here.
- `src/utils/`: Pure utility functions (`crypto.js` for MD5, `string.js` for text cleaning, similarity, parsing).

---

## 3. Critical Invariants

1. **Strict Matching Heuristics**:
   - Never loosen the matching threshold such that mismatched songs are served.
   - Exact title match is required.
   - Artist Jaccard similarity must be `>= 0.4` (or containment).
   - Duration difference between YouTube and Qobuz must be `<= 3` seconds.
2. **Minimal Dependencies**:
   - Do not introduce large frameworks like Express, Fastify, or Axios. The service is intentionally lightweight and operates on Node 18+ standard libraries.
3. **Attribution Integrity**:
   - Maintain author attribution comments to Shashwat across all modules and documentation.
4. **Resilient Fallback Chains**:
   - Always ensure fallback search and fallback stream URLs remain functional.

---

## 4. Quick Reference Commands

- Verify syntax across project:
  ```bash
  node --check server.js src/**/*.js
  ```
- Run integration check:
  ```bash
  node -e "import('./src/routes/handler.js').then(m => console.log('Handler loads OK'))"
  ```
