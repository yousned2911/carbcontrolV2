'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  lat: number
  lng: number
}

export default function MiniMap({ lat, lng }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      className="h-[200px] w-full rounded-lg"
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[lat, lng]}
        radius={6}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.7 }}
      >
        <Popup>Current location</Popup>
      </CircleMarker>
    </MapContainer>
  )
}
