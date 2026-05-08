// MapLibre style — naturlig geografi från OpenStreetMap via PMTiles.
// Ingen text, mörk bakgrund, hav-blå som rotfärg.
//
// Datakälla: PMTiles på GitHub Release. Layers (source-layers):
//   landmass   polygons  — landytor (osmdata.openstreetmap.de land-polygons)
//   water      polygons  — sjöar, dammar, vikar (OSM natural=water/bay/strait)
//   waterway   lines     — bäckar, floder, kanaler (OSM waterway=*)
//   wetland    polygons  — våtmark (OSM natural=wetland)
//   glacier    polygons  — glaciär (OSM natural=glacier)
//   landcover  polygons  — skog/hed/sten/sand (OSM natural=wood,scrub,bare_rock,…)
//   coastline  lines     — kustlinje-rim (OSM w/natural=coastline)
//   islands    polygons  — namngivna öar (OSM place=island/islet) — ej ritad
//
// Färgschema:
//   bakgrund (hav)   #0b1d2c   djup-marinblå
//   land             #162636   matt skiffer
//   landcover        #1a2c3d   en aning ljusare än land för diskret textur
//   wetland          #1f3848   blågrå
//   sjöar/vikar      #3a78a6   blå
//   vattendrag       #4a86b3   blå-line
//   glaciär          #b8d4e3   ljus is
//   coastline-rim    #7fb1d6   ljus rim, låg opacity

import { TILES_URL } from './paths.js'

// Hjälpfunktion för zoom-interpolerade line-bredder
const lineWidth = (z3, z6, z10, z14, z19) => [
  'interpolate', ['linear'], ['zoom'],
  3, z3,
  6, z6,
  10, z10,
  14, z14,
  19, z19,
]

export const mapStyle = {
  version: 8,
  sources: {
    nature: {
      type: 'vector',
      url: `pmtiles://${TILES_URL}`,
      attribution: '© OpenStreetMap contributors',
    },
    // Höjdrelief — Esri World Hillshade. Inga tokens, inga ortnamn,
    // bara skuggning från SRTM/ASTER.
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
    // 1. Bakgrund = djupa havet
    {
      id: 'sea-background',
      type: 'background',
      paint: { 'background-color': '#0b1d2c' },
    },

    // 2. Land — varje liten ö i skärgården är en egen polygon
    {
      id: 'landmass-fill',
      type: 'fill',
      source: 'nature',
      'source-layer': 'landmass',
      paint: {
        'fill-color': '#162636',
        'fill-antialias': true,
      },
    },

    // 3. Höjdrelief ovanpå land. raster-color skulle krävt webgl2 så
    //    vi modulerar via opacity/saturation för mörk-tema-passing.
    {
      id: 'hillshade-raster',
      type: 'raster',
      source: 'hillshade',
      minzoom: 4,
      maxzoom: 14,
      paint: {
        'raster-opacity': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.45,
          10, 0.55,
          14, 0.35,
        ],
        'raster-saturation': -0.3,
        'raster-contrast': 0.15,
        'raster-brightness-min': 0.0,
        'raster-brightness-max': 0.55,
      },
    },

    // 4. Landcover (skog, hed, klippa, sand) — subtil ton ovanpå land
    {
      id: 'landcover-fill',
      type: 'fill',
      source: 'nature',
      'source-layer': 'landcover',
      minzoom: 6,
      paint: {
        'fill-color': [
          'match',
          ['get', 'natural'],
          'wood', '#162e25',
          'scrub', '#1a2a22',
          'heath', '#1d2a25',
          'grassland', '#1d2c2a',
          'bare_rock', '#22303d',
          'scree', '#202b35',
          'sand', '#3a3424',
          'beach', '#3a3424',
          'fell', '#1f2c33',
          'cliff', '#2a3540',
          'rock', '#22303d',
          'stone', '#22303d',
          /* default */ '#1a2c3d',
        ],
        'fill-opacity': [
          'interpolate', ['linear'], ['zoom'],
          6, 0.0,
          8, 0.35,
          12, 0.55,
          16, 0.7,
        ],
      },
    },

    // 5. Våtmark — blågrå mellanting, lite mer synlig vid hög zoom
    {
      id: 'wetland-fill',
      type: 'fill',
      source: 'nature',
      'source-layer': 'wetland',
      paint: {
        'fill-color': '#1f3848',
        'fill-opacity': [
          'interpolate', ['linear'], ['zoom'],
          5, 0.55,
          10, 0.7,
          14, 0.85,
        ],
      },
    },

    // 6. Vatten-polygoner — sjöar, dammar, reservoarer.
    //
    // Filtrera bort hav, havsarmar, vikar och sund. Dessa är stora
    // polygoner som överlappar havsbakgrunden och syns som blå "fält"
    // ovanpå skärgården. Havet är redan bakgrundsfärgen.
    {
      id: 'water-fill',
      type: 'fill',
      source: 'nature',
      'source-layer': 'water',
      filter: [
        'all',
        // Tag-baserade exkluderingar
        ['!', ['in', ['coalesce', ['get', 'natural'], ''], ['literal', ['bay', 'strait', 'cape']]]],
        ['!', ['in', ['coalesce', ['get', 'water'], ''], ['literal', ['sea', 'ocean', 'fjord', 'bay', 'strait', 'gulf']]]],
        ['!', ['in', ['coalesce', ['get', 'place'], ''], ['literal', ['sea', 'ocean']]]],
        ['!=', ['coalesce', ['get', 'boundary'], ''], 'maritime'],
        // Name-blacklist — kända hav/havsarmar runt Sverige som ofta
        // mappas som natural=water utan annan tag att hänga oss på.
        ['!', ['in', ['coalesce', ['get', 'name'], ''], ['literal', [
          'Bottenhavet', 'Bottniska viken', 'Bottenviken',
          'Bothnian Sea', 'Bothnian Bay', 'Gulf of Bothnia', 'Sea of Bothnia',
          'Östersjön', 'Baltic Sea', 'Östra Östersjön', 'Västra Östersjön',
          'Skagerrak', 'Kattegatt', 'Kattegat',
          'Öresund', 'The Sound', 'Øresund',
          'Ålands hav', 'Sea of Åland', 'Åland Sea',
          'Nordsjön', 'North Sea',
          'Hanöbukten', 'Bay of Hanö',
          'Egentliga Östersjön',
        ]]]],
        ['!', ['in', ['coalesce', ['get', 'name:sv'], ''], ['literal', [
          'Bottenhavet', 'Bottniska viken', 'Bottenviken',
          'Östersjön', 'Skagerrak', 'Kattegatt', 'Öresund',
          'Ålands hav', 'Nordsjön', 'Hanöbukten',
        ]]]],
      ],
      paint: {
        'fill-color': '#3a78a6',
        'fill-opacity': [
          'interpolate', ['linear'], ['zoom'],
          3, 0.85,
          10, 0.95,
        ],
      },
    },

    // 7. Glaciär ovanpå allt vatten, mest i Lapplands fjälltrakter
    {
      id: 'glacier-fill',
      type: 'fill',
      source: 'nature',
      'source-layer': 'glacier',
      paint: {
        'fill-color': '#b8d4e3',
        'fill-opacity': 0.85,
      },
    },

    // 8. Vattendrag-linjer — bäckar/floder. Tunna och fler vid hög zoom.
    {
      id: 'waterway-line-major',
      type: 'line',
      source: 'nature',
      'source-layer': 'waterway',
      filter: ['in', ['get', 'waterway'], ['literal', ['river', 'canal']]],
      paint: {
        'line-color': '#4a86b3',
        'line-width': lineWidth(0.4, 1.0, 1.8, 3.0, 6.0),
        'line-opacity': 0.95,
      },
    },
    {
      id: 'waterway-line-minor',
      type: 'line',
      source: 'nature',
      'source-layer': 'waterway',
      filter: ['in', ['get', 'waterway'], ['literal', ['stream', 'brook', 'tidal_channel', 'drain', 'ditch']]],
      minzoom: 9,
      paint: {
        'line-color': '#4a86b3',
        'line-width': lineWidth(0.0, 0.0, 0.6, 1.4, 3.0),
        'line-opacity': [
          'interpolate', ['linear'], ['zoom'],
          9, 0.5,
          14, 0.85,
        ],
      },
    },

    // 9. Kustlinje-rim — subtilt highlight längs alla strandkanter,
    //    blir starkare vid hög zoom så vikarna framträder.
    {
      id: 'coastline-line',
      type: 'line',
      source: 'nature',
      'source-layer': 'coastline',
      paint: {
        'line-color': '#7fb1d6',
        'line-width': lineWidth(0.3, 0.5, 0.8, 1.2, 1.6),
        'line-opacity': [
          'interpolate', ['linear'], ['zoom'],
          3, 0.35,
          8, 0.5,
          14, 0.65,
        ],
      },
    },
  ],
}
