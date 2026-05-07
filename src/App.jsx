import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle } from './mapStyle.js'
import { parseHash, attachHashSync } from './useUrlHash.js'
import './App.css'

const SWEDEN_BBOX = [
  [10.0, 54.5],  // SW
  [24.5, 69.5],  // NE
]
const INITIAL_CENTER = [16.5, 62.5]
const INITIAL_ZOOM = 4.2

function App() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [errors, setErrors] = useState([])
  const [introVisible, setIntroVisible] = useState(true)

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
      maxZoom: 12,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

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
      } else if (e.key === '?') {
        setIntroVisible((v) => !v)
      } else if (e.key === 'Escape') {
        setIntroVisible(false)
      }
    }
    window.addEventListener('keydown', onKey)

    mapRef.current = map
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('keydown', onKey)
      detachHash()
      map.remove()
      mapRef.current = null
    }
  }, [])

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
          <kbd>scroll</kbd> zoom · <kbd>drag</kbd> panorera · <kbd>R</kbd> återställ vy
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
      <div className="attribution">
        Vektordata: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a> · public domain
        &nbsp;·&nbsp; Höjdrelief: <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri World Hillshade</a>
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
