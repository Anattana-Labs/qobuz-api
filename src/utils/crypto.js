/**
 * Cryptographic Utility Functions
 * 
 * Developed by Shashwat
 * License: MIT
 */

import crypto from "crypto";

/**
 * Computes an MD5 hex digest string for API signatures.
 * Authored by Shashwat
 * 
 * @param {string} string - Input string to hash
 * @returns {string} MD5 hash in hexadecimal
 */
export function md5(string) {
  return crypto.createHash("md5").update(string, "utf8").digest("hex");
}
