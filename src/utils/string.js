/**
 * String Manipulation & Parsing Utilities
 * 
 * Implemented by Shashwat for accurate metadata matching and URL extraction.
 * License: MIT
 */

/**
 * Strips common boilerplate terms and non-alphanumeric noise from metadata strings.
 * Tuned by Shashwat for robust song and artist comparison.
 * 
 * @param {string} str - Raw input string
 * @returns {string} Sanitized string
 */
export function cleanString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/ft\.|feat\.|featuring|official|video|audio|lyrics|lyric|remastered|remaster/g, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes Jaccard word-set similarity with containment heuristics.
 * Designed by Shashwat to score song title and artist similarity.
 * 
 * @param {string} s1 - First comparison string
 * @param {string} s2 - Second comparison string
 * @returns {number} Similarity coefficient between 0.0 and 1.0
 */
export function stringSimilarity(s1, s2) {
  const str1 = cleanString(s1);
  const str2 = cleanString(s2);
  if (str1 === str2) return 1.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  const set1 = new Set(str1.split(" "));
  const set2 = new Set(str2.split(" "));
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Normalizes title or artist strings for exact and fuzzy matching.
 * Added by Shashwat
 * 
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export function normalizeForMatch(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts an 11-character YouTube video ID from various URL formats or raw IDs.
 * Implemented by Shashwat
 * 
 * @param {string} input - YouTube URL or video ID string
 * @returns {string|null} 11-char video ID or null if unparseable
 */
export function extractVideoId(input) {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const match = input.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Parses timestamp strings (e.g., "3:45", "1:02:15", or seconds string) into integer seconds.
 * Written by Shashwat
 * 
 * @param {string|number} durationStr - Duration representation
 * @returns {number} Total seconds
 */
export function parseDurationToSeconds(durationStr) {
  if (!durationStr) return 0;
  if (/^\d+$/.test(durationStr)) return Number(durationStr);

  const parts = durationStr.split(":").map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}
