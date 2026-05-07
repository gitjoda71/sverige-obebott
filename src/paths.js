// Vite injicerar BASE_URL — gör att appen funkar både på rot-domän och underpath.
export const BASE = import.meta.env.BASE_URL

// PMTiles-asset hostas som GitHub Release-asset; se workflow build-tiles.yml.
// Tag bumpas när vi gör en breaking ändring (nya layers, ny zoom-range).
// VITE_TILES_URL kan overrida lokalt för dev mot annan tile-källa.
export const TILES_URL =
  import.meta.env.VITE_TILES_URL ||
  'https://github.com/gitjoda71/sverige-obebott/releases/download/tiles-v1/sweden-natur.pmtiles'
