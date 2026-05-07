// Synkar map view med URL hash så vyer kan delas/bookmarkas.
// Format: #z=8.2/62.50/17.40  (zoom/lat/lon, samma som maplibre/mapbox standard)

export function parseHash(hash = window.location.hash) {
  if (!hash || hash.length < 2) return null
  const m = hash.replace(/^#/, '').match(/^(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
  if (!m) return null
  const zoom = parseFloat(m[1])
  const lat = parseFloat(m[2])
  const lon = parseFloat(m[3])
  if (Number.isNaN(zoom) || Number.isNaN(lat) || Number.isNaN(lon)) return null
  return { zoom, center: [lon, lat] }
}

export function formatHash(zoom, lat, lon) {
  // Skala precision med zoom — närmare in = fler decimaler
  const z = zoom.toFixed(2)
  const decimals = Math.max(2, Math.min(5, Math.floor(zoom / 3) + 2))
  return `#${z}/${lat.toFixed(decimals)}/${lon.toFixed(decimals)}`
}

export function attachHashSync(map) {
  let isUpdatingFromHash = false

  const update = () => {
    if (isUpdatingFromHash) return
    const c = map.getCenter()
    const next = formatHash(map.getZoom(), c.lat, c.lng)
    // replaceState för att inte spamma history
    if (next !== window.location.hash) {
      window.history.replaceState(null, '', next)
    }
  }

  map.on('moveend', update)
  map.on('zoomend', update)

  const onPopState = () => {
    const parsed = parseHash()
    if (!parsed) return
    isUpdatingFromHash = true
    map.jumpTo({ zoom: parsed.zoom, center: parsed.center })
    setTimeout(() => { isUpdatingFromHash = false }, 50)
  }
  window.addEventListener('hashchange', onPopState)

  return () => {
    map.off('moveend', update)
    map.off('zoomend', update)
    window.removeEventListener('hashchange', onPopState)
  }
}
