import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Spin } from 'antd'
import L from 'leaflet'
import { useGetUnidadesQuery } from '../store/slices/apiSlice'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CORUMBA_CONFIG = {
  center: [-19.008, -57.651],
  zoom: 12,
  bounds: [
    [-22.0, -60.5], // Southwest
    [-16.0, -56.0], // Northeast
  ],
}

export default function MapPage() {
  const { data, isLoading } = useGetUnidadesQuery({ ativo: 'true' })
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    )
  }
  
  const unidades = data?.data || []
  
  return (
    <MapContainer
      center={CORUMBA_CONFIG.center}
      zoom={CORUMBA_CONFIG.zoom}
      maxBounds={CORUMBA_CONFIG.bounds}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {unidades.map((unidade) => (
        <Marker
          key={unidade.id}
          position={[parseFloat(unidade.latitude), parseFloat(unidade.longitude)]}
        >
          <Popup>
            <div>
              <h3>{unidade.nome}</h3>
              {unidade.endereco && <p>{unidade.endereco}</p>}
              {unidade.especialidades && unidade.especialidades.length > 0 && (
                <div>
                  <strong>Especialidades:</strong>
                  <ul>
                    {unidade.especialidades.map((esp) => (
                      <li key={esp.id}>{esp.nome}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
