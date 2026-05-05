// MapLibre style — naturlig geografi, ingen text, mörk bakgrund.
// Källor laddas från relativa paths (statiska GeoJSON i public/data/).
//
// Färgschema:
//   bakgrund (hav)   #0b1d2c   djup-marinblå
//   land (mask)      #162636   matt skiffer
//   hillshade        Esri World Hillshade, mörkfärgad via raster-color
//   sjöar/floder     #3a78a6   blå
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
    // Höjdrelief — Esri World Hillshade (gratis, ingen token).
    // Tile-format är {z}/{y}/{x} (Esri ArcGIS-konvention).
    hillshade: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 13,
      attribution: 'Hillshade: Esri',
    },
  },
  layers: [
    // Bakgrundsfärg = djupa havet
    {
      id: 'sea',
      type: 'background',
      paint: { 'background-color': '#0b1d2c' },
    },
    // Land — mörk skiffer som bas
    {
      id: 'land-fill',
      type: 'fill',
      source: 'land',
      paint: {
        'fill-color': '#162636',
        'fill-opacity': 1,
      },
    },
    // Höjdrelief ovanpå land. raster-color mappar Esri:s gråskala
    // till en mörkblå-grå palett så det smälter in i mörka temat.
    // Subtil opacity så terrängen syns men inte tar över.
    {
      id: 'hillshade-raster',
      type: 'raster',
      source: 'hillshade',
      minzoom: 4,
      paint: {
        'raster-opacity': 0.55,
        'raster-saturation': -0.3,
        'raster-contrast': 0.15,
        'raster-brightness-min': 0.0,
        'raster-brightness-max': 0.55,
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
          12, 2.6,
        ],
        'line-opacity': 0.9,
      },
    },
    // Vattendrag Europa-tillägg (mindre vattendrag)
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
          12, 2.2,
        ],
        'line-opacity': 0.75,
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
          12, 1.4,
        ],
        'line-opacity': 0.55,
      },
    },
  ],
}
