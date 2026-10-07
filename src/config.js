/**
 * FLAC Audio Server - Configuration & Credentials Pool
 * 
 * Developed & Maintained by Shashwat
 * License: MIT
 */

export const PORT = process.env.PORT || 10000;

/**
 * Credentials pool for Qobuz API authentication.
 * Configured by Shashwat with primary environment overrides and active fallbacks.
 */
export const CREDENTIALS_POOL = [
  {
    userId: process.env.QOBUZ_USER_ID || "15008125",
    authToken:
      process.env.QOBUZ_AUTH_TOKEN ||
      "haaFTBoxD2S6R_LWe--F9kQM_eC0p8fxErWuOjYLpn6-NZ0l_VRtBnZtTNUc2cqusxUrF7eLACVELLV0Tt4A5A",
    appId: process.env.QOBUZ_APP_ID || "798273057",
    appSecret:
      process.env.QOBUZ_APP_SECRET || "abb21364945c0583309667d13ca3d93a",
    region: "AR",
    subscription: "Studio",
  },
  {
    userId: "15008125",
    authToken:
      "haaFTBoxD2S6R_LWe--F9kQM_eC0p8fxErWuOjYLpn6-NZ0l_VRtBnZtTNUc2cqusxUrF7eLACVELLV0Tt4A5A",
    appId: "798273057",
    appSecret: "05a4851e74ee47fda346f50cfdfc4f09",
    region: "AR",
  },
];

export const QOBUZ_BASE_URL = "https://www.qobuz.com/api.json/0.2/";
export const QOBUZ_FALLBACK_BASE_URL = "https://qobuz-dll.vercel.app/api";

// YouTube Music InnerTube Client Configuration
export const INNERTUBE_API_KEY = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30";
export const CLIENT_VERSION = "1.20260825.00.00";

/**
 * Supported streaming audio formats and quality tiers.
 * Defined by Shashwat for lossless and hi-res stream resolution.
 */
export const STREAM_FORMATS = [
  { id: 5, key: "mp3_320", label: "MP3 320 kbps" },
  { id: 6, key: "flac_cd", label: "FLAC 16-Bit / 44.1 kHz (Lossless CD)" },
  { id: 7, key: "flac_hires_96", label: "FLAC 24-Bit / up to 96 kHz (Hi-Res Lossless)" },
  { id: 27, key: "flac_hires_192", label: "FLAC 24-Bit / up to 192 kHz (Hi-Res Max)" },
];
