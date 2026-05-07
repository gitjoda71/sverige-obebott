# ROADMAP — Sverige obebott

Senast uppdaterad: 2026-05-07

## Status

| Fas | Beskrivning | Status |
|---|---|---|
| M0 | Vite + React + MapLibre MVP, Natural Earth GeoJSON | ✅ klar |
| M1 | Höjdrelief via Esri World Hillshade | ✅ klar |
| M2 | URL-hash, intro fade, shortcuts (polish) | ✅ klar |
| **M3** | **OSM-baserad PMTiles-pipeline, maxZoom 19, 1:10k-detalj** | 🚧 **pågår** |
| M4 | Per-layer styling-tuning, skärgårds-detalj-pass | 📋 planerad |
| M5 | Lantmäteriet Topografi 50 Hydrografi (CC0) som tilläggslager | 💭 idé |
| M6 | Höjdkurvor från Lantmäteriet Höjddata Grid 1 | 💭 idé |

## M3 — vad som är gjort

- ✅ GitHub Actions workflow `.github/workflows/build-tiles.yml` som:
  - Laddar Geofabrik Sweden PBF (~1.4 GB)
  - Filtrerar bort allt utom natur via `osmium tags-filter`
  - Exporterar 7 OSM-baserade lager + 1 land-polygons-lager till
    GeoJSONSeq
  - Klipper land-polygons till Sverige-bbox `[10.0, 54.5, 24.5, 69.5]`
  - Kör `tippecanoe` med 8 layers, max-zoom 14, drop-densest-as-needed
  - Konverterar till PMTiles via `pmtiles convert`
  - Laddar upp som GitHub Release-asset (`tiles-v1`)
  - Triggas manuellt + 1 ggn/månad via cron
- ✅ Frontend uppdaterad: `pmtiles` npm-paket, `Protocol.tile` registrerad,
  `maxZoom: 19`, vector source från PMTiles, source-layers per natur-typ
- ✅ Style:n behåller nuvarande mörka palett (#0b1d2c hav, #162636 land,
  #3a78a6 sjöar, #b8d4e3 glaciär, #7fb1d6 kustlinje-rim)
- ✅ Hillshade behållen som raster ovanpå land-fyllning
- ✅ Attribution uppdaterad till OSM ODbL
- ✅ README skriven om till PMTiles-pipelinen
- ✅ Skala-control tillagd (bottom-left)

## M3 — kvar

- 🚧 Första körningen av build-tiles-workflow:n med faktisk tile-output
  uppladdad som `tiles-v1` Release
- 🚧 Live-deploy med PMTiles-URL — verifiera 1:10k-detalj på t.ex.
  Stockholms skärgård, Bohuskusten, Höga kusten

## M4 — planerade förbättringar

- Per-layer styling-tuning vid hög zoom (zoom 14–19)
  - Sjöar: djupare blå när polygonen är stor, ljusare när liten
  - Vattendrag: olika line-width per typ (river vs stream vs ditch)
  - Landcover: subtila ton-skillnader för wood/scrub/bare_rock
- Inverse-mask av icke-Sverige (gör norska/finska data nästan transparent
  så fokus stannar på Sverige)
- Eventuellt: zoom-baserad färgpalett (mörkare nattvy vid låg zoom,
  ljusare topografisk vid hög zoom)

## Tekniska beslut tagna

- **Datakälla:** OSM via Geofabrik (inte protomaps planet-extract). Egen
  filtrerad pipeline ger ren "bara natur"-data utan att behöva filtrera
  bort roads/places i style.
- **Land-polygons:** osmdata.openstreetmap.de `land-polygons-split-4326`
  istället för water-polygons, så bakgrund = hav och alla landytor är
  egna polygoner. Bättre för skärgårds-rendering.
- **Tile-format:** PMTiles ovanpå mbtiles. Statisk hostning via GitHub
  Release CDN. Inga server-tile-stack behövs.
- **Max zoom-pyramid:** 14 i tile-pyramiden, 19 i klienten via overzoom.
  Vektor-overzoom är förlustfritt — bara linjer blir tjockare.
- **Hostning:** GitHub Release-asset (2 GB-gräns/asset). Om PMTiles >2 GB
  behöver vi flytta till Cloudflare R2 (kräver konto).
