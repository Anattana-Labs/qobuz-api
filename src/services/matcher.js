/**
 * Audio Track Matching Engine
 * 
 * Accurately aligns YouTube Music search items with Qobuz audio tracks based
 * on strict title equality, artist similarity scoring, and duration tolerances.
 * 
 * Developed by Shashwat
 * License: MIT
 */

import { normalizeForMatch, stringSimilarity } from "../utils/string.js";

/**
 * Finds the highest quality track match from Qobuz candidates.
 * 
 * Scoring & heuristics designed by Shashwat:
 * 1. Exact normalized title match requirement.
 * 2. Artist fuzzy similarity and containment checks.
 * 3. Strict duration discrepancy window (maximum 3 seconds tolerance).
 * 
 * @param {object} ytMeta - YouTube Music track metadata
 * @param {Array} candidates - Array of Qobuz candidate tracks
 * @returns {object|null} Matched Qobuz track or null
 */
export function findBestTrackMatch(ytMeta, candidates) {
  if (!candidates || candidates.length === 0) return null;

  const targetTitle = normalizeForMatch(ytMeta.title);
  const targetArtist = normalizeForMatch(ytMeta.artist);

  let bestMatch = null;
  let highestScore = -1;

  for (const track of candidates) {
    const qTitle = normalizeForMatch(track.title || "");
    const qArtist = normalizeForMatch(track.performer?.name || track.artist?.name || "");
    const qDuration = track.duration || 0;

    // 1. Exact Title Match Check
    const isTitleExact = targetTitle === qTitle;
    if (!isTitleExact) {
      continue;
    }

    // 2. Strict Artist Match Check
    let artistSim = 0;
    if (targetArtist && qArtist) {
      artistSim = stringSimilarity(targetArtist, qArtist);
      const isArtistContained = targetArtist.includes(qArtist) || qArtist.includes(targetArtist);

      // If artists have no similarity and neither contains the other, reject
      if (artistSim < 0.4 && !isArtistContained) {
        continue;
      }
    }

    // 3. Strict Duration Match Check (tolerance: 1-3 seconds)
    let durationScore = 1.0;
    if (ytMeta.duration > 0 && qDuration > 0) {
      const diff = Math.abs(ytMeta.duration - qDuration);
      if (diff > 3) {
        // Discard if duration differs by more than 3 seconds
        continue;
      }
      durationScore = diff === 0 ? 1.0 : 1.0 - diff * 0.05;
    }

    const totalScore = 0.5 + artistSim * 0.35 + durationScore * 0.15;

    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestMatch = {
        track,
        score: totalScore,
      };
    }
  }

  return bestMatch ? bestMatch.track : null;
}
