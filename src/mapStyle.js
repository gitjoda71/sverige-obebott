// MapLibre style — naturlig geografi, ingen text, mörk bakgrund.
// Källor laddas från relativa paths (statiska GeoJSON i public/data/).
//
// Färgschema:
//   bakgrund (hav)   #0b1d2c   djup-marinblå
//   land (mask)      #1a2a38   matt skiffer (skapar kontrast mot vatten)
//   sjöar/floder     #4a86b3   blå
//   glaciär          #b8d4e3   ljus is

import { BASE } from './paths.js'

export const mapStyle = {
  version: 8,
  sources: {
    land: {
      type: 'geojson',
      data: `${BASE}data/land.geojson`,
    },
    coastline: {
      type: 'geojson',
      data: `${BASE}data/coastline.geojson`,
    },
    lakes: {
      type: 'geojson',
      data: `${BASE}data/lakes.geojson`,
    },
    lakes_europe: {
      type: 'geojson',
      data: `${BASE}data/lakes_europe.geojson`,
    },
    rivers: {
      type: 'geojson',
      data: `${BASE}data/rivers.geojson`,
      lineMetrics: true,
    },
    rivers_europe: {
      type: 'geojson',
      data: `${BASE}data/rivers_europe.geojson`,
      lineMetrics: true,
    },
    glaciated: {
      type: 'geojson',
      data: `${BASE}data/glaciated.geojson`,
    },
  },
  layers: [
    // Bakgrundsfärg = djupa havet
    {
      id: 'sea',
      type: 'background',
      paint: { 'background-color': '#0b1d2c' },
    },
    // Land (Natural Earth ne_10m_land) — mörk skiffer
    {
      id: 'land-fill',
      type: 'fill',
      source: 'land',
      paint: {
        'fill-color': '#162636',
        'fill-opacity': 1,
      },
    },
    // Sjöar (stora, från ne_10m_lakes)
    {
      id: 'lakes-fill',
      type: 'fill',
      source: 'lakes',
      paint: {
        'fill-color': '#3a78a6',
        'fill-opacity': 0.95,
      },
    },
    // Sjöar Europa-tillägg (mindre sjöar med högre detalj)
    {
      id: 'lakes-europe-fill',
      type: 'fill',
      source: 'lakes_europe',
      paint: {
        'fill-color': '#3a78a6',
        'fill-opacity': 0.95,
      },
    },
    // Glaciärer
    {
      id: 'glacier-fill',
      type: 'fill',
      source: 'glaciated',
      paint: {
        'fill-color': '#b8d4e3',
        'fill-opacity': 0.85,
      },
    },
    // Vattendrag - huvudfloder
    {
      id: 'rivers-line',
      type: 'line',
      source: 'rivers',
      paint: {
        'line-color': '#4a86b3',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          3, 0.4,
          6, 1.0,
          9, 1.8,
        ],
        'line-opacity': 0.85,
      },
    },
    // Vattendrag Europa-tillägg
    {
      id: 'rivers-europe-line',
      type: 'line',
      source: 'rivers_europe',
      paint: {
        'line-color': '#4a86b3',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          3, 0.3,
          6, 0.8,
          9, 1.4,
        ],
        'line-opacity': 0.7,
      },
    },
    // Kustlinje — subtil rim runt landmassan
    {
      id: 'coastline-line',
      type: 'line',
      source: 'coastline',
      paint: {
        'line-color': '#7fb1d6',
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          3, 0.3,
          6, 0.6,
          9, 1.0,
        ],
        'line-opacity': 0.55,
      },
    },
  ],
}
