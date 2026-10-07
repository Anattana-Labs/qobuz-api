/**
 * HTTP Request Handler & Route Controller
 * 
 * Handles API endpoints, CORS headers, YouTube Music resolution,
 * Qobuz track alignment, and lossless stream URL dispatching.
 * 
 * Developed by Shashwat
 * License: MIT
 */

import { STREAM_FORMATS } from "../config.js";
import { extractVideoId } from "../utils/string.js";
import { fetchYouTubeMetadata } from "../services/youtube.js";
import { QobuzClient } from "../services/qobuz.js";
import { findBestTrackMatch } from "../services/matcher.js";

/**
 * Main HTTP request processing pipeline.
 * Engineered by Shashwat
 * 
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 */
export async function handleRequest(req, res) {
  // CORS Headers configured by Shashwat
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // Health check endpoint
  if (parsedUrl.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "flac-server",
        author: "Shashwat",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  const videoIdInput =
    parsedUrl.searchParams.get("id") ||
    parsedUrl.searchParams.get("videoId") ||
    parsedUrl.searchParams.get("url");
  const videoId = extractVideoId(videoIdInput);

  if (!videoId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "error",
          message:
            "Missing or invalid YouTube video ID/URL. Usage: /?id={videoId} or /?url={youtubeUrl}",
        },
        null,
        2
      )
    );
    return;
  }

  try {
    const ytMeta = await fetchYouTubeMetadata(videoId);

    const qobuz = new QobuzClient();
    const searchQuery = `${ytMeta.artist} ${ytMeta.title}`;
    let candidates = [];

    try {
      candidates = await qobuz.searchTracks(searchQuery, 10);
    } catch {
      // primary search error handled by fallback
    }

    if (!candidates || candidates.length === 0) {
      try {
        candidates = await qobuz.searchTracks(ytMeta.title, 10);
      } catch {
        // title search error handled by fallback
      }
    }

    let matchedTrack =
      candidates && candidates.length > 0
        ? findBestTrackMatch(ytMeta, candidates)
        : null;

    if (!matchedTrack) {
      const fallbackCandidates =
        (await qobuz.searchTracksFallback(searchQuery)) || [];
      let fbCandidates = fallbackCandidates;

      if (!fbCandidates || fbCandidates.length === 0) {
        fbCandidates = (await qobuz.searchTracksFallback(ytMeta.title)) || [];
      }

      if (fbCandidates && fbCandidates.length > 0) {
        const fbMatch = findBestTrackMatch(ytMeta, fbCandidates);
        if (fbMatch) {
          matchedTrack = fbMatch;
          candidates = fbCandidates;
        } else if (!candidates || candidates.length === 0) {
          candidates = fbCandidates;
        }
      }
    }

    const rawResults = (candidates || []).map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.performer?.name || t.artist?.name || "Unknown",
      album: t.album?.title || "Unknown Album",
      duration: t.duration || 0,
    }));

    if (!matchedTrack) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          {
            status: "error",
            message: "No exact/strict matching track found on Qobuz catalog.",
            ytmusic: ytMeta,
            raw_results: rawResults,
          },
          null,
          2
        )
      );
      return;
    }

    const streamResults = await Promise.all(
      STREAM_FORMATS.map(async (fmt) => {
        const streamInfo = await qobuz.getStreamUrl(matchedTrack.id, fmt.id);
        return { key: fmt.key, label: fmt.label, data: streamInfo };
      })
    );

    const streams = {};
    const errors = {};

    for (const r of streamResults) {
      if (r.data && !r.data.error) {
        const { error, ...streamData } = r.data;
        streams[r.key] = {
          label: r.label,
          ...streamData,
        };
      } else if (r.data && r.data.error) {
        errors[r.key] = {
          label: r.label,
          status: r.data.status,
          message: r.data.message,
          code: r.data.code,
        };
      }
    }

    if (Object.keys(streams).length === 0) {
      const fallbackStream = await qobuz.getStreamUrlFallback(matchedTrack.id);
      if (fallbackStream && !fallbackStream.error) {
        const { error, ...streamData } = fallbackStream;
        streams["flac_hires_192"] = {
          label: "FLAC 24-Bit / up to 192 kHz (Hi-Res Max)",
          ...streamData,
        };
        delete errors["flac_hires_192"];
      }
    }

    const responsePayload = {
      status: Object.keys(streams).length > 0 ? "success" : "partial_error",
      ytmusic: {
        videoId: ytMeta.videoId,
        title: ytMeta.title,
        artist: ytMeta.artist,
        duration: ytMeta.duration,
      },
      matched_track: {
        id: matchedTrack.id,
        title: matchedTrack.title,
        artist:
          matchedTrack.performer?.name ||
          matchedTrack.artist?.name ||
          "Unknown",
        album: matchedTrack.album?.title || "Unknown Album",
        duration: matchedTrack.duration,
        hires: matchedTrack.hires || false,
        maximum_bit_depth: matchedTrack.maximum_bit_depth || 16,
        maximum_sampling_rate: matchedTrack.maximum_sampling_rate || 44.1,
      },
      streams,
      raw_results: rawResults,
      ...(Object.keys(errors).length > 0 ? { stream_errors: errors } : {}),
    };

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    });
    res.end(JSON.stringify(responsePayload, null, 2));
  } catch (err) {
    console.error("[Server Controller] Processing error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "error",
          message:
            err.message || "An unexpected error occurred while processing request.",
        },
        null,
        2
      )
    );
  }
}
