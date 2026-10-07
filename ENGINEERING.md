# Engineering Guidelines

> **Project:** Qobuz FLAC Audio API (`qobuz-api`)  
> **Repository:** [https://github.com/Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api)  
> **Author & Maintainer:** Shashwat  
> **License:** MIT

---

## 1. Core Engineering Principles

1. **Minimal External Dependencies**: Use native Node.js standard library APIs (`http`, `crypto`, `URL`) and modern JavaScript features (native `fetch`, ESM, `Promise.all`). Avoid bloated web framework dependencies (Express, Fastify, etc.) unless strictly necessary.
2. **Defensive Programming & High Availability**: External upstream APIs (YouTube InnerTube, Qobuz endpoints) are inherently prone to changes, rate limiting, and network fluctuations. Every external call must be guarded by try-catch blocks and backed by designated fallbacks.
3. **Deterministic Stream Matching**: Never return an incorrect track to the user. A clean HTTP 404 response is strictly preferable to playing the wrong song.
4. **Explicit Attribution & Documentation**: All major additions, configuration pools, and matching heuristics must be documented with clear JSDoc annotations and attribution to Shashwat.

---

## 2. Code Conventions & Standards

### 2.1 Module System
- Use pure **ECMAScript Modules (ESM)**.
- All file imports must specify explicit extensions:
  ```javascript
  // Correct
  import { PORT } from "./src/config.js";
  import { cleanString } from "../utils/string.js";

  // Incorrect
  import { PORT } from "./src/config";
  const { PORT } = require("./src/config");
  ```

### 2.2 Asynchronous Execution
- Always use `async/await` syntax rather than nested `.then()` callbacks.
- When resolving independent network operations (e.g., retrieving four audio format tiers simultaneously), use `Promise.all` or `Promise.allSettled` to avoid head-of-line blocking.

### 2.3 Error Handling Pattern
- Functions that interface with external networks must capture errors and return sanitized fallback structures or descriptors rather than crashing the Node.js event loop:
  ```javascript
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[Service] Call failed:`, err.message || err);
    return null; // Or fallback structure
  }
  ```

### 2.4 JSDoc Documentation
Every exported function and class must include concise JSDoc comments specifying parameters, return types, and architectural purpose.

---

## 3. Configuration & Credential Management

- Default credentials are maintained in `src/config.js` with primary fallback rotation.
- Credentials must support runtime overrides via environment variables:
  ```bash
  PORT=8080
  QOBUZ_USER_ID=...
  QOBUZ_AUTH_TOKEN=...
  QOBUZ_APP_ID=...
  QOBUZ_APP_SECRET=...
  ```
- **Security Rule:** Never commit personal, production-billing, or private user credentials to public repositories. Keep production tokens in environment variables or vault secret managers.

---

## 4. Verification & Testing

Before proposing or deploying modifications, verify the following:

1. **Syntax Verification:**
   ```bash
   node --check server.js src/**/*.js
   ```
2. **Integration Verification:**
   ```bash
   node -e "
   import('./src/routes/handler.js').then(async (m) => {
     const req = { url: '/health', method: 'GET', headers: { host: 'localhost' } };
     const res = { setHeader: () => {}, writeHead: (s) => console.log('Status:', s), end: (b) => console.log('Body:', b) };
     await m.handleRequest(req, res);
   });"
   ```
3. **Endpoint Live Validation:**
   ```bash
   npm start
   # In another terminal:
   curl -s "http://localhost:10000/health"
   curl -s "http://localhost:10000/?id=dQw4w9WgXcQ"
   ```

---

## 5. Contributing Workflow

1. Fork the repository [Anattana-Labs/qobuz-api](https://github.com/Anattana-Labs/qobuz-api).
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Follow the code formatting and architectural guidelines in this document.
4. Ensure all syntax checks pass cleanly.
5. Submit a Pull Request with a clear description of the modifications.
