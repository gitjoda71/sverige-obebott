// Vite injicerar BASE_URL — gör att appen funkar både på rot-domän och underpath.
export const BASE = import.meta.env.BASE_URL

// PMTiles-asset hostas SAME-ORIGIN via GitHub Pages (laddas ner från Release
// under deploy:n). Anledning: Azure Blob-redirect:en på Releases CDN saknar
// Access-Control-Allow-Origin → browser blockar range-requests cross-origin.
//
// VITE_TILES_URL kan overrida lokalt — peka mot lokal pmtiles eller direktlänk
// (för dev kan absolut http://localhost:8080/sweden-natur.pmtiles funka).
export const TILES_URL =
  import.meta.env.VITE_TILES_URL || `${BASE}sweden-natur.pmtiles`
