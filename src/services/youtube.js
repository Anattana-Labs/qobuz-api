/**
 * YouTube Music Metadata Service
 * 
 * Extracts rich song, artist, album, and duration metadata via YouTube Music InnerTube
 * with graceful fallback to oEmbed.
 * 
 * Developed by Shashwat
 * License: MIT
 */

import { INNERTUBE_API_KEY, CLIENT_VERSION } from "../config.js";
import { parseDurationToSeconds } from "../utils/string.js";

/**
 * Builds the InnerTube `/next` request payload for music tracking.
 * Crafted by Shashwat
 * 
 * @param {string} videoId 
 * @returns {object} InnerTube request body
 */
export function buildNextBody(videoId) {
  return {
    videoId,
    isAudioOnly: true,
    tunerSettingValue: "AUTOMIX_SETTING_NORMAL",
    watchEndpointMusicSupportedConfigs: {
      watchEndpointMusicConfig: {
        musicVideoType: "MUSIC_VIDEO_TYPE_ATV",
      },
    },
    context: {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: CLIENT_VERSION,
        hl: "en",
        gl: "US",
        platform: "DESKTOP",
      },
      user: { lockedSafetyMode: false },
      request: { useSsl: true },
    },
  };
}

/**
 * Deep search utility for recursively extracting keys from nested JSON structures.
 * Added by Shashwat
 * 
 * @param {any} node - Current node in the JSON graph
 * @param {string} key - Target key to collect
 * @param {Array} results - Accumulator array
 * @returns {Array} All matching elements
 */
export function findAll(node, key, results = []) {
  if (!node || typeof node !== "object") return results;

  if (Array.isArray(node)) {
    for (const item of node) findAll(item, key, results);
    return results;
  }

  if (node[key]) results.push(node[key]);

  for (const k of Object.keys(node)) {
    if (k === key) continue;
    findAll(node[k], key, results);
  }

  return results;
}

/**
 * Parses artist runs and album data from YouTube Music byline nodes.
 * Authored by Shashwat
 * 
 * @param {Array} runs 
 * @returns {{ artists: Array<{name: string, browseId: string}>, album: {name: string, browseId: string}|null }}
 */
export function extractRunsInfo(runs) {
  const artists = [];
  let album = null;

  for (const run of runs || []) {
    const browseId = run.navigationEndpoint?.browseEndpoint?.browseId;
    if (!browseId) continue;

    const pageType =
      run.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
        ?.browseEndpointContextMusicConfig?.pageType;

    if (pageType === "MUSIC_PAGE_TYPE_ARTIST" || browseId.startsWith("UC")) {
      artists.push({ name: run.text, browseId });
    } else if (pageType === "MUSIC_PAGE_TYPE_ALBUM" || browseId.startsWith("MPRE")) {
      album = { name: run.text, browseId };
    }
  }

  return { artists, album };
}

/**
 * Fetches comprehensive metadata for a YouTube Music video ID.
 * Implements primary InnerTube extraction and fallback to oEmbed.
 * Engineered by Shashwat
 * 
 * @param {string} videoId - 11 character YouTube video ID
 * @returns {Promise<object>} Track metadata
 */
export async function fetchYouTubeMetadata(videoId) {
  try {
    const upstream = await fetch(
      `https://music.youtube.com/youtubei/v1/next?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://music.youtube.com",
          Referer: `https://music.youtube.com/watch?v=${videoId}`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(buildNextBody(videoId)),
      }
    );

    if (upstream.ok) {
      const data = await upstream.json();
      const allRenderers = findAll(data, "playlistPanelVideoRenderer");
      const currentIndex = allRenderers.findIndex((r) => r.videoId === videoId);

      if (currentIndex !== -1) {
        const current = allRenderers[currentIndex];
        const title = current.title?.runs?.[0]?.text || "";
        const runs = current.longBylineText?.runs || current.shortBylineText?.runs || [];
        const { artists, album } = extractRunsInfo(runs);
        const durationText = current.lengthText?.runs?.[0]?.text || "";
        const duration = parseDurationToSeconds(durationText);

        const artistNames = artists.map((a) => a.name);
        const primaryArtist = artistNames[0] || (runs[0]?.text || "");

        return {
          videoId,
          title,
          artist: primaryArtist,
          artists: artistNames,
          album: album?.name || null,
          duration,
          durationText,
          thumbnails: current.thumbnail?.thumbnails || [],
        };
      }
    }
  } catch (err) {
    console.error("[YouTube Service] InnerTube /next error:", err.message || err);
  }

  // Fallback to oEmbed endpoint if /next didn't succeed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      let rawTitle = data.title || "";
      let rawAuthor = data.author_name || "";

      rawAuthor = rawAuthor.replace(/\s*-\s*Topic$/i, "").trim();

      let artist = rawAuthor;
      let title = rawTitle;
      if (rawTitle.includes(" - ")) {
        const parts = rawTitle.split(" - ");
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }

      return {
        videoId,
        title,
        artist,
        artists: [artist],
        album: null,
        duration: 0,
      };
    }
  } catch (err) {
    console.error("[YouTube Service] oEmbed fallback error:", err.message || err);
  }

  throw new Error("Failed to fetch YouTube Music metadata for video ID: " + videoId);
}
