# Sverige obebott

En karta över Sverige som om landet aldrig hade befolkats — bara naturlig
geografi: kustlinje, sjöar, vattendrag, våtmark, glaciärer, skog, klippor.
Inga städer, vägar, gränser, byggnader eller ortnamn.

Live: <https://gitjoda71.github.io/sverige-obebott/>

## Stack

- **Vite + React 19** — frontend
- **MapLibre GL JS 5** — vektorkarta, ingen leverantörs-token
- **PMTiles** (`pmtiles://`-protokoll) — statisk hostning av vector tiles
- **OpenStreetMap** via Geofabrik Sweden + osmdata.openstreetmap.de
  (ODbL, attribution krävs)

Mål: 1:10k-detalj på kustlinjen, maxZoom 19, alla ~30 000 öar i
skärgården synliga. Tile-pyramiden går till zoom 14, klienten overzoom:ar
till 19.

## Köra lokalt

```powershell
cd "c:\0-dropbox\Dropbox\1oels dokument\Antigravity\Lantmäteriet\sweden-natur"
npm install
npm run dev
```

Frontend hämtar PMTiles same-origin från `${BASE}sweden-natur.pmtiles`.
I produktion laddar deploy.yml ner PMTiles från GitHub Release `tiles-v2`
till `public/` före `npm run build`, så filen följer med Pages-deployen
och servas same-origin (kringgår Azure-Blob-CORS-blockering på Release-
CDN:s slutdestination).

För lokal dev: peka `VITE_TILES_URL` mot en lokal/extern tile-källa,
eller ladda ner Release-asseten manuellt:

```powershell
gh release download tiles-v2 --pattern 'sweden-natur.pmtiles' --output public/sweden-natur.pmtiles
npm run dev
```

## Bygga om vector-tiles

Tile-pipelinen körs i GitHub Actions, inte lokalt:

```powershell
cd "c:\0-dropbox\Dropbox\1oels dokument\Antigravity\Lantmäteriet\sweden-natur"
gh workflow run build-tiles.yml -f release_tag=tiles-v1 -f max_zoom=14
```

Workflow:n laddar Geofabrik Sweden (~1.4 GB) + osmdata land-polygons,
filtrerar med `osmium tags-filter`, exporterar med `osmium export`,
kör `tippecanoe` med 8 layers och `pmtiles convert`. Output laddas upp
som Release-asset `sweden-natur.pmtiles`.

Pipeline schemaläggs 1:a varje månad så data hålls fräsch.

## Datakällor

| Skikt | Källa | Licens |
|---|---|---|
| Landmassa | OSM coastline → polygonized via osmdata.openstreetmap.de `land-polygons-split-4326` | ODbL |
| Kustlinje (linjer) | OSM `natural=coastline` via Geofabrik Sweden | ODbL |
| Sjöar/vatten | OSM `natural=water/bay/strait`, `landuse=reservoir/basin` | ODbL |
| Vattendrag | OSM `waterway=river,stream,canal,drain,ditch,brook,tidal_channel` | ODbL |
| Våtmark | OSM `natural=wetland` | ODbL |
| Glaciärer | OSM `natural=glacier` | ODbL |
| Landcover | OSM `natural=wood,scrub,heath,grassland,bare_rock,scree,sand,beach,fell,cliff,rock,stone` | ODbL |
| Höjdrelief | Esri World Hillshade (raster) | Esri TOU — fri för icke-kommersiell |

OSM-data filtreras hårt: inga roads, buildings, boundaries, places utöver
islands, eller `landuse=residential/industrial`. `name`-tags exporteras
inte — det finns ingen text att rendera.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml`. Vid push till `main`
byggs appen med `VITE_BASE_PATH=/<repo-namn>/` och publiceras automatiskt.

PMTiles-asset hostas separat på Releases och nås via CORS-aktiverat
GitHub Releases CDN.

## Licens

- Källkod: MIT
- OSM-data: © OpenStreetMap-bidragsgivare, ODbL — attribution i appen
- Esri Hillshade: respektive Esri-licens
