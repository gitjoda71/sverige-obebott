# Sverige obebott

En karta över Sverige som om landet aldrig hade befolkats — bara naturlig
geografi: kustlinje, sjöar, vattendrag och (kommer) höjdkurvor. Inga städer,
vägar, gränser, byggnader eller ortnamn.

## Stack

- **Vite + React 19** — frontend
- **MapLibre GL JS** — vektorkarta, ingen leverantörs-token
- **Natural Earth 1:10m** — vektordata, public domain (förfiltrerad till
  Sverige-bbox vid build-tid)

## Köra lokalt

```bash
cd "c:\0-dropbox\Dropbox\1oels dokument\Antigravity\Lantmäteriet\sweden-natur"
npm install
npm run prepare-data   # hämtar + klipper Natural Earth (~1 min, cachas)
npm run dev
```

`npm run prepare-data` laddar ned Natural Earth shapefiles från `naciscdn.org`,
klipper till Sverige-bbox `[10.0, 54.5, 24.5, 69.5]` och skriver GeoJSON till
`public/data/`. Cache i `data-cache/` så återkörning är snabb.

## Datakällor

| Skikt | Källa | Licens |
|---|---|---|
| Kustlinje | Natural Earth `ne_10m_coastline` | Public domain |
| Sjöar | Natural Earth `ne_10m_lakes` + `ne_10m_lakes_europe` | Public domain |
| Vattendrag | Natural Earth `ne_10m_rivers_lake_centerlines` + `ne_10m_rivers_europe` | Public domain |
| Glaciärer | Natural Earth `ne_10m_glaciated_areas` | Public domain |

Kommande v2: byts ut mot **Lantmäteriet Topografi 50 Hydrografi** (CC0) och
**Lantmäteriet Höjddata Grid 1** för höjd. Se [ROADMAP](../ROADMAP.md).

## Deploy

GitHub Pages via `.github/workflows/deploy.yml`. Vid push till `main` byggs
appen med `VITE_BASE_PATH=/<repo-namn>/` och publiceras automatiskt.

## Licens
Källkod: MIT. Data: respektive ursprungslicens (se ovan).
