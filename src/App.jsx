import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle } from './mapStyle.js'
import { parseHash, attachHashSync } from './useUrlHash.js'
import { CONTOURS_URL } from './paths.js'
import './App.css'

// Registrera pmtiles://-protokollet en gång globalt så MapLibre kan
// läsa range-requests från statiska PMTiles-filer.
if (!maplibregl.getProtocol?.('pmtiles')) {
  const pmtilesProtocol = new Protocol()
  maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile)
}

const SWEDEN_BBOX = [
  [10.0, 54.5],  // SW
  [24.5, 69.5],  // NE
]
const INITIAL_CENTER = [16.5, 62.5]
const INITIAL_ZOOM = 4.2

// Topografi-lägen — cyklas via knapp/T-tangent.
// 'shade'    : bara hillshade (default)
// 'contours' : bara höjdkurvor
// 'both'     : båda samtidigt
const TOPO_MODES = ['shade', 'contours', 'both']
const TOPO_LABELS = { shade: 'Skugga', contours: 'Kurvor', both: 'Båda' }
const TOPO_HASH_KEY = 'topo'

function readInitialTopoMode() {
  // Läs ev. ?topo=contours från query, fallback shade
  try {
    const u = new URL(window.location.href)
    const v = u.searchParams.get(TOPO_HASH_KEY)
    if (TOPO_MODES.includes(v)) return v
  } catch { /* ignore */ }
  return 'shade'
}

function applyTopoMode(map, mode, hasContours) {
  if (!map.getStyle()) return
  const setVis = (id, visible) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
  }
  const showShade = mode === 'shade' || mode === 'both'
  const showContours = (mode === 'contours' || mode === 'both') && hasContours
  setVis('hillshade-raster', showShade)
  setVis('contour-line-minor', showContours)
  setVis('contour-line-index', showContours)
}

function App() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [errors, setErrors] = useState([])
  const [introVisible, setIntroVisible] = useState(true)
  const [topoMode, setTopoMode] = useState(readInitialTopoMode)
  const [hasContours, setHasContours] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialvärde: URL-hash > Sverige-bbox-fit
    const fromHash = parseHash()
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: fromHash?.center ?? INITIAL_CENTER,
      zoom: fromHash?.zoom ?? INITIAL_ZOOM,
      maxBounds: [
        [-2, 50],
        [38, 73],
      ],
      minZoom: 3.5,
      maxZoom: 19,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-left')

    map.on('error', (e) => {
      const msg = e?.error?.message || String(e?.error || 'unknown error')
      console.error('[maplibre]', msg, e)
      setErrors((prev) => prev.includes(msg) ? prev : [...prev, msg])
    })

    map.on('load', () => {
      // Bara fit-bounds om vi inte hade en hash att starta från
      if (!fromHash) {
        map.fitBounds(SWEDEN_BBOX, { padding: 40, duration: 0 })
      }

      // Pre-flight check på contours-asseten. Saknas den (build-contours
      // har inte körts än), ta bort source + layers så MapLibre inte
      // pollar 404 i loop. setHasContours uppdaterar UI:n.
      fetch(CONTOURS_URL, { method: 'HEAD' })
        .then((r) => {
          const ok = r.ok
          if (!ok) {
            ['contour-line-minor', 'contour-line-index'].forEach((id) => {
              if (map.getLayer(id)) map.removeLayer(id)
            })
            if (map.getSource('contours')) map.removeSource('contours')
          }
          setHasContours(ok)
          // Applicera initial topo-mode efter source/layer-städning
          applyTopoMode(map, topoMode, ok)
        })
        .catch(() => {
          ['contour-line-minor', 'contour-line-index'].forEach((id) => {
            if (map.getLayer(id)) map.removeLayer(id)
          })
          if (map.getSource('contours')) map.removeSource('contours')
          setHasContours(false)
          applyTopoMode(map, topoMode, false)
        })
    })

    // Fade ut intro vid första interaktion
    const fadeIntro = () => setIntroVisible(false)
    map.once('movestart', fadeIntro)
    map.once('zoomstart', fadeIntro)

    // Auto-fade efter 12 s om användaren inte rört kartan
    const timeoutId = setTimeout(() => setIntroVisible(false), 12000)

    // URL-hash sync
    const detachHash = attachHashSync(map)

    // Tangent-shortcuts
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
      if (e.key === 'r' || e.key === 'R') {
        map.fitBounds(SWEDEN_BBOX, { padding: 40, duration: 800 })
      } else if (e.key === 't' || e.key === 'T') {
        setTopoMode((m) => TOPO_MODES[(TOPO_MODES.indexOf(m) + 1) % TOPO_MODES.length])
      } else if (e.key === '?') {
        setIntroVisible((v) => !v)
      } else if (e.key === 'Escape') {
        setIntroVisible(false)
      }
    }
    window.addEventListener('keydown', onKey)

    // Topo-toggle keyboard event handler refererar topoMode-state via closure;
    // setState gör att effect:en re-attachar inte. Vi uppdaterar via en ref
    // som synkar setTopoMode-anrop nedan.

    mapRef.current = map
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('keydown', onKey)
      detachHash()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Synkronisera topoMode till layer-visibility + URL-query.
  useEffect(() => {
    const map = mapRef.current
    if (map && map.isStyleLoaded()) {
      applyTopoMode(map, topoMode, hasContours)
    } else if (map) {
      map.once('idle', () => applyTopoMode(map, topoMode, hasContours))
    }
    try {
      const u = new URL(window.location.href)
      if (topoMode === 'shade') {
        u.searchParams.delete(TOPO_HASH_KEY)
      } else {
        u.searchParams.set(TOPO_HASH_KEY, topoMode)
      }
      const next = u.pathname + (u.search ? u.search : '') + u.hash
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(null, '', next)
      }
    } catch { /* ignore */ }
  }, [topoMode, hasContours])

  const cycleTopo = () => {
    setTopoMode((m) => {
      const i = TOPO_MODES.indexOf(m)
      let next = TOPO_MODES[(i + 1) % TOPO_MODES.length]
      // Skipp 'contours' och 'both' om kurvor saknas
      if (!hasContours && (next === 'contours' || next === 'both')) {
        next = 'shade'
      }
      return next
    })
  }

  return (
    <div className="app">
      <div ref={containerRef} className="map" />
      <div className={`intro ${introVisible ? '' : 'intro--hidden'}`}>
        <button
          className="intro-close"
          onClick={() => setIntroVisible(false)}
          aria-label="Stäng intro"
        >×</button>
        <h1>Sverige obebott</h1>
        <p>
          Kustlinje, sjöar och vattendrag — så som de skulle se ut idag om
          människan aldrig hade satt sin fot här. Inga städer, vägar eller
          gränser. Bara naturen.
        </p>
        <p className="intro-shortcuts">
          <kbd>scroll</kbd> zoom · <kbd>drag</kbd> panorera · <kbd>R</kbd> återställ vy · <kbd>T</kbd> topografi
        </p>
      </div>
      {!introVisible && (
        <button
          className="intro-toggle"
          onClick={() => setIntroVisible(true)}
          aria-label="Visa intro"
          title="Visa intro (?)"
        >ⓘ</button>
      )}
      <button
        className="topo-toggle"
        onClick={cycleTopo}
        aria-label="Växla topografi-läge"
        title={hasContours ? 'Topografi: skugga / kurvor / båda (T)' : 'Topografi: skugga (kurvor laddar...)'}
      >
        <span className="topo-toggle-label">Topo</span>
        <span className="topo-toggle-mode">{TOPO_LABELS[topoMode]}</span>
      </button>
      <div className="attribution">
        Vektordata: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> bidragsgivare (ODbL)
        &nbsp;·&nbsp; Höjdrelief: <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri World Hillshade</a>
        &nbsp;·&nbsp; Tiles: <a href="https://protomaps.com/" target="_blank" rel="noreferrer">PMTiles</a>
      </div>
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((msg, i) => <div key={i}>⚠ {msg}</div>)}
        </div>
      )}
    </div>
  )
}

export default App
