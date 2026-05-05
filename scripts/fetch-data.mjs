// Hämtar Natural Earth 1:10m physical-shapefiles, packar upp,
// klipper till Sverige-bbox, konverterar till GeoJSON.
//
// Sverige-bbox (något generös för att inkludera havsremsan):
//   lon: 10.0 → 24.5, lat: 54.5 → 69.5
//
// Output: ../public/data/{coastline,lakes,lakes_europe,rivers,rivers_europe,glaciated}.geojson

import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import AdmZip from 'adm-zip'
import mapshaper from 'mapshaper'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const cacheDir = resolve(root, 'data-cache')
const outDir = resolve(root, 'public', 'data')

const BBOX = [10.0, 54.5, 24.5, 69.5] // [west, south, east, north]
const BASE = 'https://naciscdn.org/naturalearth/10m/physical'

const LAYERS = [
  { name: 'coastline',     file: 'ne_10m_coastline' },
  { name: 'lakes',         file: 'ne_10m_lakes' },
  { name: 'lakes_europe',  file: 'ne_10m_lakes_europe' },
  { name: 'rivers',        file: 'ne_10m_rivers_lake_centerlines' },
  { name: 'rivers_europe', file: 'ne_10m_rivers_europe' },
  { name: 'glaciated',     file: 'ne_10m_glaciated_areas' },
]

async function downloadIfMissing(url, dest) {
  if (existsSync(dest)) {
    console.log('  cache hit:', dest.split(/[\\/]/).pop())
    return
  }
  console.log('  GET', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch failed ${res.status} ${url}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

async function unzip(zipPath, outPath) {
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(outPath, true)
}

async function runMapshaper(cmd) {
  // Använd mapshaper Node-API i stället för CLI
  await mapshaper.runCommands(cmd)
}

async function main() {
  await mkdir(cacheDir, { recursive: true })
  await mkdir(outDir, { recursive: true })

  for (const layer of LAYERS) {
    console.log('\n[' + layer.name + ']')
    const zipPath = resolve(cacheDir, layer.file + '.zip')
    const extractDir = resolve(cacheDir, layer.file)
    const shpPath = resolve(extractDir, layer.file + '.shp')
    const outPath = resolve(outDir, layer.name + '.geojson')

    await downloadIfMissing(`${BASE}/${layer.file}.zip`, zipPath)

    if (!existsSync(shpPath)) {
      await mkdir(extractDir, { recursive: true })
      await unzip(zipPath, extractDir)
    }

    // mapshaper: läs shapefile, klipp till bbox, skriv GeoJSON
    const bboxStr = BBOX.join(',')
    const cmd = `-i "${shpPath}" -clip bbox=${bboxStr} -simplify 5% keep-shapes -o "${outPath}" format=geojson precision=0.0001`
    await runMapshaper(cmd)

    // Liten storleksrapport
    const buf = await readFile(outPath)
    console.log('  →', outPath.split(/[\\/]/).slice(-3).join('/'), `(${(buf.length/1024).toFixed(1)} KB)`)
  }

  console.log('\n✓ klar')
}

main().catch((e) => { console.error(e); process.exit(1) })
