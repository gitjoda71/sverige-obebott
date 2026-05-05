import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle } from './mapStyle.js'
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxBounds: [
        [-2, 50],
        [38, 73],
      ],
      minZoom: 3.5,
      maxZoom: 9,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      map.fitBounds(SWEDEN_BBOX, { padding: 40, duration: 0 })
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="app">
      <div ref={containerRef} className="map" />
      <div className="intro">
        <h1>Sverige obebott</h1>
        <p>
          Kustlinje, sjöar och vattendrag — så som de skulle se ut idag om
          människan aldrig hade satt sin fot här. Inga städer, vägar eller
          gränser. Bara naturen.
        </p>
      </div>
      <div className="attribution">
        Vektordata: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a> · public domain
      </div>
    </div>
  )
}

export default App
