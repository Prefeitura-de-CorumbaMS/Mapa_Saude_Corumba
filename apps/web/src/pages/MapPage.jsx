import { useState } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet'
import { Spin, Tag, Divider, Empty, Button, Modal, Badge, Alert } from 'antd'
import {
  EnvironmentOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import L from 'leaflet'
import { useGetUnidadesQuery, useGetUnidadeMedicosQuery } from '../store/slices/apiSlice'
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
  const [selectedUnidade, setSelectedUnidade] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [medicosModalVisible, setMedicosModalVisible] = useState(false)

  const { data, isLoading, isError, error } = useGetUnidadesQuery()
  const { data: medicosData, isLoading: medicosLoading } = useGetUnidadeMedicosQuery(
    selectedUnidade?.id,
    { skip: !selectedUnidade }
  )

  console.log('GetUnidades Query Result:', { data, isLoading, isError, error });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" message="Carregando unidades..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
        <Alert
          message="Erro ao Carregar Dados das Unidades"
          description={
            <>
              <p>Não foi possível buscar os dados das unidades de saúde. Verifique se o servidor da API (backend) está rodando corretamente na porta 3001.</p>
              <strong>Detalhes do erro:</strong>
              <pre style={{ 
                marginTop: '10px',
                color: 'red', 
                textAlign: 'left', 
                background: '#fff0f0', 
                padding: '10px', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {JSON.stringify(error, null, 2)}
              </pre>
            </>
          }
          type="error"
          showIcon
        />
      </div>
    )
  }

  const unidades = data?.data || []
  const medicos = medicosData?.data || []

  console.log('Unidades para renderizar no mapa:', unidades);
  if (unidades.length === 0) {
    console.warn('Nenhuma unidade encontrada para exibir no mapa.');
  }

  const handleMarkerClick = (unidade) => {
    setSelectedUnidade(unidade)
    setSidebarCollapsed(false)
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'

  const sidebarWidth = 400
  const sidebarLeft = sidebarCollapsed ? -sidebarWidth + 40 : 0

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex' }}>
      {/* Sidebar */}
      <div
        style={{
          position: 'absolute',
          left: `${sidebarLeft}px`,
          top: 0,
          bottom: 0,
          width: `${sidebarWidth}px`,
          backgroundColor: 'white',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          transition: 'left 0.3s ease-in-out',
          zIndex: 1000,
          display: 'flex',
        }}
      >
        {/* Conteúdo do Sidebar */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {selectedUnidade ? (
            <div style={{ height: '100%' }}>
              {/* Imagem da Unidade */}
              {selectedUnidade.imagem_url ? (
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundImage: `url(${apiBaseUrl}${selectedUnidade.imagem_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <EnvironmentOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                </div>
              )}

              {/* Conteúdo */}
              <div style={{ padding: '24px' }}>
                {/* Nome da Unidade */}
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  marginBottom: '8px',
                  lineHeight: 1.3,
                }}>
                  {selectedUnidade.nome}
                </h2>

                {/* Endereço */}
                {selectedUnidade.endereco && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '24px',
                    color: '#666',
                  }}>
                    <EnvironmentOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                    <span style={{ flex: 1 }}>{selectedUnidade.endereco}</span>
                  </div>
                )}

                <Divider />

                {/* Especialidades */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <MedicineBoxOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    Especialidades Atendidas
                  </h3>
                  {selectedUnidade.especialidades && selectedUnidade.especialidades.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedUnidade.especialidades.map((esp) => (
                        <Tag key={esp.id} color="blue">
                          {esp.nome}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Nenhuma especialidade cadastrada"
                      style={{ margin: '16px 0' }}
                    />
                  )}
                </div>

                <Divider />

                {/* Botão Ver Médicos */}
                <div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UserOutlined />}
                    onClick={() => setMedicosModalVisible(true)}
                    block
                    style={{
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                  >
                    Ver Médicos que Atendem
                    {!medicosLoading && medicos.length > 0 && (
                      <Badge
                        count={medicos.length}
                        style={{
                          backgroundColor: '#fff',
                          color: '#1890ff',
                          marginLeft: '12px',
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <InfoCircleOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '24px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>
                  Bem-vindo ao Mapa da Saúde
                </h2>
                <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginTop: '16px' }}>
                  Explore as unidades de saúde de Corumbá.
                  <br />
                  Clique em um ponto no mapa para ver os detalhes, como endereço, especialidades e médicos.
                </p>
                {unidades.length === 0 && !isLoading && (
                  <Alert 
                    message="Nenhuma unidade de saúde encontrada para exibir no mapa."
                    type="warning"
                    showIcon
                    style={{ marginTop: '24px', textAlign: 'left' }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botão de Toggle */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
        }}>
          <Button
            type="primary"
            icon={sidebarCollapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              height: '80px',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, height: '100%' }}>
        <MapContainer
          center={CORUMBA_CONFIG.center}
          zoom={CORUMBA_CONFIG.zoom}
          maxBounds={CORUMBA_CONFIG.bounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {unidades.map((unidade) => {
            if (!unidade.latitude || !unidade.longitude) {
              console.error('Unidade sem coordenadas:', unidade);
              return null;
            }
            return (
              <Marker
                key={unidade.id}
                position={[parseFloat(unidade.latitude), parseFloat(unidade.longitude)]}
                eventHandlers={{
                  click: () => handleMarkerClick(unidade),
                }}
              />
            )
          })}
        </MapContainer>
      </div>

      {/* Modal de Médicos */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>Médicos que Atendem</span>
          </div>
        }
        open={medicosModalVisible}
        onCancel={() => setMedicosModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setMedicosModalVisible(false)}>
            Fechar
          </Button>,
        ]}
        width={600}
      >
        {selectedUnidade && (
          <div>
            <div style={{
              backgroundColor: '#f0f7ff',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              borderLeft: '4px solid #1890ff',
            }}>
              <div style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                {selectedUnidade.nome}
              </div>
              {selectedUnidade.endereco && (
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <EnvironmentOutlined style={{ marginRight: '6px' }} />
                  {selectedUnidade.endereco}
                </div>
              )}
            </div>

            {medicosLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#666' }}>
                  Carregando médicos...
                </div>
              </div>
            ) : medicos.length > 0 ? (
              <div>
                <div style={{
                  marginBottom: '12px',
                  fontSize: '14px',
                  color: '#666',
                  fontWeight: '500',
                }}>
                  {medicos.length} {medicos.length === 1 ? 'médico encontrado' : 'médicos encontrados'}
                </div>
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  paddingRight: '8px',
                }}>
                  {medicos.map((medico, index) => (
                    <div
                      key={medico.id}
                      style={{
                        padding: '16px',
                        marginBottom: '12px',
                        backgroundColor: '#fafafa',
                        borderRadius: '8px',

                        border: '1px solid #e8e8e8',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f7ff'
                        e.currentTarget.style.borderColor = '#1890ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa'
                        e.currentTarget.style.borderColor = '#e8e8e8'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}>
                        <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#262626' }}>
                          {medico.nome}
                        </div>
                      </div>
                      {medico.especialidades && medico.especialidades.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginTop: '8px',
                        }}>
                          {medico.especialidades.map(esp => (
                            <Tag
                              key={esp.id}
                              color="blue"
                              icon={<MedicineBoxOutlined />}
                              style={{ margin: 0, fontSize: '12px' }}
                            >
                              {esp.nome}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhum médico cadastrado para esta unidade"
                style={{ padding: '40px 0' }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
