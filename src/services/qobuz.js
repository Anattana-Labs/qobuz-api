/**
 * Qobuz Lossless Audio Client & Multi-Tier Stream Resolver
 * 
 * Supports credential rotation, request signing (MD5 signature),
 * and high-availability fallback APIs.
 * 
 * Developed by Shashwat
 * License: MIT
 */

import { CREDENTIALS_POOL, QOBUZ_BASE_URL, QOBUZ_FALLBACK_BASE_URL } from "../config.js";
import { md5 } from "../utils/crypto.js";

export class QobuzClient {
  /**
   * Initializes client with configured credential pool.
   * Authored by Shashwat
   * 
   * @param {Array} credentialsPool 
   */
  constructor(credentialsPool = CREDENTIALS_POOL) {
    this.pool = credentialsPool;
  }

  /**
   * Searches Qobuz catalog for tracks using rotated credentials with fallback.
   * Implemented by Shashwat
   * 
   * @param {string} query 
   * @param {number} limit 
   * @returns {Promise<Array>} Array of matching track objects
   */
  async searchTracks(query, limit = 10) {
    let lastError = null;

    for (const cred of this.pool) {
      try {
        const url = `${QOBUZ_BASE_URL}track/search?query=${encodeURIComponent(query)}&limit=${limit}&app_id=${cred.appId}`;
        const res = await fetch(url, {
          headers: {
            "X-App-Id": cred.appId,
            "X-User-Auth-Token": cred.authToken,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        });

        if (res.ok) {
          const data = await res.json();
          return data?.tracks?.items || [];
        }
        lastError = new Error(`Qobuz search API failed with HTTP ${res.status}`);
      } catch (err) {
        lastError = err;
      }
    }

    // Secondary fallback search proxy configured by Shashwat
    try {
      const fallbackItems = await this.searchTracksFallback(query);
      if (fallbackItems && fallbackItems.length > 0) {
        return fallbackItems;
      }
    } catch (fbErr) {
      console.error("[Qobuz Client] Fallback search error:", fbErr.message || fbErr);
    }

    throw lastError || new Error("Failed to search tracks across all credentials");
  }

  /**
   * Fallback search provider for high reliability.
   * Added by Shashwat
   * 
   * @param {string} query 
   * @returns {Promise<Array>}
   */
  async searchTracksFallback(query) {
    try {
      const url = `${QOBUZ_FALLBACK_BASE_URL}/get-music?q=${encodeURIComponent(query)}&offset=0`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
          Referer: "https://qobuz-dll.vercel.app/",
          Accept: "application/json, text/plain, */*",
        },
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        return data?.data?.tracks?.items || data?.tracks?.items || [];
      }
    } catch (err) {
      console.error("[Qobuz Client] searchTracksFallback error:", err.message || err);
    }
    return [];
  }

  /**
   * Generates signed stream URL for a given track and format tier.
   * Implements HMAC/MD5 request signing according to Qobuz API spec.
   * Engineered by Shashwat
   * 
   * @param {string|number} trackId 
   * @param {number} formatId 
   * @returns {Promise<object>} Stream details or error descriptor
   */
  async getStreamUrl(trackId, formatId) {
    let lastResponse = null;

    for (const cred of this.pool) {
      const unix = Date.now() / 1000;
      const rSigRaw = `trackgetFileUrlformat_id${formatId}intentstreamtrack_id${trackId}${unix}${cred.appSecret}`;
      const rSigHashed = md5(rSigRaw);

      const url = `${QOBUZ_BASE_URL}track/getFileUrl?request_ts=${unix}&request_sig=${rSigHashed}&track_id=${trackId}&format_id=${formatId}&intent=stream`;

      try {
        const res = await fetch(url, {
          headers: {
            "X-App-Id": cred.appId,
            "X-User-Auth-Token": cred.authToken,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data && data.url) {
          return {
            error: false,
            format_id: data.format_id || formatId,
            mime_type: data.mime_type || (data.format_id === 5 ? "audio/mpeg" : "audio/flac"),
            bit_depth: data.bit_depth || null,
            sampling_rate: data.sampling_rate || null,
            url: data.url,
          };
        }

        lastResponse = {
          error: true,
          status: res.status,
          message: data?.message || res.statusText || "Failed to fetch stream URL",
          code: data?.code || null,
        };
      } catch (err) {
        lastResponse = {
          error: true,
          status: 500,
          message: err.message || "Network error",
          code: null,
        };
      }
    }

    // Hi-Res Max (Format 27) fallback check
    if (formatId === 27) {
      const fallback = await this.getStreamUrlFallback(trackId);
      if (fallback && !fallback.error) {
        return fallback;
      }
    }

    return (
      lastResponse || {
        error: true,
        status: 500,
        message: "All fallback credentials failed",
        code: null,
      }
    );
  }

  /**
   * Fallback stream resolution for 24-Bit / 192kHz Hi-Res FLAC streams.
   * Integrated by Shashwat
   * 
   * @param {string|number} trackId 
   * @returns {Promise<object>}
   */
  async getStreamUrlFallback(trackId) {
    try {
      const url = `${QOBUZ_FALLBACK_BASE_URL}/download-music?track_id=${trackId}&quality=27`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
          Referer: "https://qobuz-dll.vercel.app/",
          Accept: "application/json, text/plain, */*",
        },
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success && data.data?.url) {
          return {
            error: false,
            format_id: 27,
            mime_type: "audio/flac",
            bit_depth: 24,
            sampling_rate: 192,
            url: data.data.url,
          };
        }
      }
    } catch (err) {
      console.error("[Qobuz Client] getStreamUrlFallback error:", err.message || err);
    }

    return {
      error: true,
      status: 500,
      message: "Fallback API failed to provide stream URL",
      code: null,
    };
  }
}
