/**
 * FLAC Audio Stream Server
 * YouTube Music Video ID -> Qobuz Lossless Audio Stream Matcher
 * 
 * Developed by: Shashwat
 * License: MIT
 */

import http from "http";
import { PORT } from "./src/config.js";
import { handleRequest } from "./src/routes/handler.js";

const server = http.createServer(handleRequest);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`=========================================`);
  console.log(` FLAC Audio Server by Shashwat`);
  console.log(` Running on port: ${PORT} (http://0.0.0.0:${PORT})`);
  console.log(` Health check:    http://localhost:${PORT}/health`);
  console.log(` Status:          Online & Ready`);
  console.log(`=========================================`);
});
