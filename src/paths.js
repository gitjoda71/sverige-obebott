// Vite injicerar BASE_URL — gör att appen funkar både på rot-domän och underpath.
export const BASE = import.meta.env.BASE_URL

// PMTiles-asset hostas SAME-ORIGIN via GitHub Pages (laddas ner från Release
// under deploy:n). Anledning: Azure Blob-redirect:en på Releases CDN saknar
// Access-Control-Allow-Origin → browser blockar range-requests cross-origin.
//
// VITE_TILES_URL / VITE_CONTOURS_URL kan overrida lokalt.
export const TILES_URL =
  import.meta.env.VITE_TILES_URL || `${BASE}sweden-natur.pmtiles`

export const CONTOURS_URL =
  import.meta.env.VITE_CONTOURS_URL || `${BASE}sweden-contours.pmtiles`
