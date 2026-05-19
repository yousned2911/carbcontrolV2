'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import L from 'leaflet'

type Props = {
  onSave: (geojson: Record<string, unknown>) => void
}

function DrawControl({ onSave: onSaveProp }: { onSave: (g: Record<string, unknown>) => void }) {
  const map = useMap()
  const drawnItemsRef = useRef(new L.FeatureGroup())

  useEffect(() => {
    const drawnItems = drawnItemsRef.current
    map.addLayer(drawnItems)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DrawControlConstructor = (L.Control as any).Draw
    const drawControl = new DrawControlConstructor({
      edit: { featureGroup: drawnItems },
      draw: {
        polygon: {},
        circle: {},
        rectangle: false,
        polyline: false,
        marker: false,
        circlemarker: false,
      },
    })
    map.addControl(drawControl)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers()
      drawnItems.addLayer(e.layer)
      const geojson = e.layer.toGeoJSON()
      onSaveProp(geojson as unknown as Record<string, unknown>)
    })

    map.on(L.Draw.Event.EDITED, () => {
      const layers = drawnItems.toGeoJSON() as GeoJSON.FeatureCollection
      if (layers.features.length > 0) {
        onSaveProp(layers.features[0] as unknown as Record<string, unknown>)
      }
    })

    map.on(L.Draw.Event.DELETED, () => {
      onSaveProp({} as Record<string, unknown>)
    })

    return () => {
      map.removeControl(drawControl)
      map.removeLayer(drawnItems)
    }
  }, [map, onSaveProp])

  return null
}

export default function GeofenceEditor({ onSave }: Props) {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[31.7917, -7.0926]}
        zoom={6}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          <DrawControl onSave={onSave} />
        </FeatureGroup>
      </MapContainer>
    </div>
  )
}
