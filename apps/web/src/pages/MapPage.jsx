import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from 'react-leaflet'
import { Spin, Tag, Divider, Empty, Button, Modal, Badge, Alert, Select, Card } from 'antd'
import {
  EnvironmentOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  WhatsAppOutlined,
  GlobalOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import L from 'leaflet'
import { useGetUnidadesQuery, useGetUnidadeMedicosQuery, useGetBairrosQuery, useGetEspecialidadesQuery, useGetLastUpdateQuery, useGetIconesQuery } from '../store/slices/apiSlice'
import MapLegend from '../components/MapLegend'
import 'leaflet/dist/leaflet.css'

// Custom Marker component to handle zoom on click
const CustomMarker = ({ unidade, onClick, customIcon, isSelected }) => {
  const map = useMap()

  const handleClick = () => {
    // Zoom to the marker position
    map.setView([unidade.latitude, unidade.longitude], 18) // Zoom level 18 for close zoom
    onClick(unidade)
  }

  // Aumentar o tamanho do ícone se estiver selecionado
  const iconSize = isSelected ? [48, 72] : [25, 41]
  const iconAnchor = isSelected ? [24, 72] : [12, 41]
  const shadowSize = isSelected ? [80, 80] : [41, 41]

  const icon = customIcon ? (
    isSelected ? L.icon({
      iconUrl: customIcon.options.iconUrl,
      iconSize: [48, 72],
      iconAnchor: [24, 72],
      popupAnchor: [0, -72],
    }) : customIcon
  ) : L.icon({
    iconUrl: '/marker-icon.png',
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: [1, -34],
    shadowUrl: '/marker-shadow.png',
    shadowSize: shadowSize,
  })

  return (
    <Marker
      position={[unidade.latitude, unidade.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    />
  )
}

// Component to reset map view when going back to search
const MapViewController = ({ selectedUnidade }) => {
  const map = useMap()

  useEffect(() => {
    // When selectedUnidade becomes null (user clicked back button), reset map view
    if (!selectedUnidade) {
      map.flyTo(CORUMBA_CONFIG.center, CORUMBA_CONFIG.zoom, {
        duration: 1.5, // Animation duration in seconds
      })
    }
  }, [selectedUnidade, map])

  return null
}

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CORUMBA_CONFIG = {
  center: [-19.008, -57.651],
  zoom: 13,
  bounds: [
    [-22.0, -60.5], // Southwest
    [-16.0, -56.0], // Northeast
  ],
}

// Função auxiliar para obter ícone da rede social
const getRedeSocialIcon = (nomeRede) => {
  switch (nomeRede) {
    case 'Facebook':
      return <FacebookOutlined />
    case 'Instagram':
      return <InstagramOutlined />
    case 'Twitter':
      return <GlobalOutlined />
    case 'LinkedIn':
      return <LinkOutlined />
    case 'YouTube':
      return <GlobalOutlined />
    case 'TikTok':
      return <GlobalOutlined />
    case 'Website':
      return <GlobalOutlined />
    default:
      return <LinkOutlined />
  }
}

export default function MapPage() {
  const [selectedUnidade, setSelectedUnidade] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [medicosModalVisible, setMedicosModalVisible] = useState(false)
  const [selectedEspecialidade, setSelectedEspecialidade] = useState(null)
  const [especialidadeModalVisible, setEspecialidadeModalVisible] = useState(false)

  // Estados de busca
  const [searchType, setSearchType] = useState(null) // 'bairro', 'unidade', 'especialidade'
  const [searchValue, setSearchValue] = useState(null)

  const { data, isLoading, isError, error } = useGetUnidadesQuery(undefined, {
    refetchOnMountOrArgChange: 30, // Refetch se dados tiverem mais de 30 segundos
  })
  const { data: medicosData, isLoading: medicosLoading } = useGetUnidadeMedicosQuery(
    selectedUnidade?.id,
    { skip: !selectedUnidade }
  )
  const { data: bairrosData } = useGetBairrosQuery()
  const { data: especialidadesData } = useGetEspecialidadesQuery()
  const { data: lastUpdateData } = useGetLastUpdateQuery()
  const { data: iconesData } = useGetIconesQuery({ ativo: 'true' }, {
    refetchOnMountOrArgChange: 30, // Refetch ícones também
  })

  // Extrair dados antes dos early returns
  const unidades = data?.data || []
  const medicos = medicosData?.data || []
  const bairros = bairrosData?.data?.map(b => b.nome).sort() || []
  const especialidades = especialidadesData?.data || []
  const lastUpdate = lastUpdateData?.data?.lastUpdate || null

  // Formatar data da última atualização
  const formatarDataAtualizacao = () => {
    if (lastUpdate) {
      const data = new Date(lastUpdate)

      const dia = String(data.getDate()).padStart(2, '0')
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const ano = data.getFullYear()
      const hora = String(data.getHours()).padStart(2, '0')
      const minuto = String(data.getMinutes()).padStart(2, '0')

      return `${dia}/${mes}/${ano}, ${hora}:${minuto}`
    }
    return 'N/A'
  }

  // Função para formatar endereço completo
  const formatarEnderecoCompleto = (unidade) => {
    const partes = []
    if (unidade.endereco) partes.push(unidade.endereco)
    if (unidade.bairro) partes.push(unidade.bairro)
    if (partes.length > 0) partes.push('Corumbá - MS')
    return partes.join(' - ')
  }

  // Filtrar unidades baseado na busca
  const filteredUnidades = useMemo(() => {
    if (!searchType || !searchValue) {
      return unidades
    }

    return unidades.filter(unidade => {
      if (searchType === 'bairro') {
        return unidade.bairro === searchValue
      } else if (searchType === 'unidade') {
        return unidade.id === searchValue
      } else if (searchType === 'especialidade') {
        return unidade.especialidades?.some(esp => esp.id === searchValue)
      }
      return true
    })
  }, [unidades, searchType, searchValue])

  // Handler para reset da busca
  const handleResetSearch = () => {
    setSearchType(null)
    setSearchValue(null)
  }

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
    <>
      <style>{`
        .custom-select .ant-select-selection-placeholder {
          color: #333 !important;
          font-weight: 500;
        }
        .custom-select .ant-select-clear {
          background: #fff !important;
          opacity: 1 !important;
          font-size: 16px !important;
          color: #ff4d4f !important;
          border-radius: 50%;
          margin-right: 4px;
        }
        .custom-select .ant-select-clear:hover {
          color: #ff7875 !important;
          background: #fff1f0 !important;
        }
      `}</style>
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
                {/* Botão Voltar */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#fafafa'
                }}>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => setSelectedUnidade(null)}
                    size="large"
                    style={{
                      fontWeight: '500'
                    }}
                  >
                    Voltar para Busca
                  </Button>
                </div>

                {/* Imagem da Unidade */}
                {selectedUnidade.imagem_url ? (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundImage: `url(${apiBaseUrl}${encodeURI(selectedUnidade.imagem_url)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#f0f0f0', // Fallback color
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
                  {(selectedUnidade.endereco || selectedUnidade.bairro) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                      color: '#666',
                    }}>
                      <EnvironmentOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <span style={{ flex: 1 }}>{formatarEnderecoCompleto(selectedUnidade)}</span>
                    </div>
                  )}

                  {/* Telefone */}
                  {selectedUnidade.telefone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <PhoneOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <span style={{ flex: 1 }}>{selectedUnidade.telefone}</span>
                    </div>
                  )}

                  {/* Horário de Atendimento */}
                  {selectedUnidade.horario_atendimento && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <ClockCircleOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <span style={{ flex: 1, whiteSpace: 'pre-line' }}>{selectedUnidade.horario_atendimento}</span>
                    </div>
                  )}

                  {/* Enfermeiro Responsável */}
                  {selectedUnidade.enfermeiro_responsavel && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      color: '#666',
                    }}>
                      <UserOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Enfermeiro(a) Responsável</div>
                        <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>{selectedUnidade.enfermeiro_responsavel}</div>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {selectedUnidade.whatsapp && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '24px',
                      gap: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        color: '#666',
                        flex: 1,
                      }}>
                        <WhatsAppOutlined style={{ marginRight: '8px', marginTop: '4px', fontSize: '16px', color: '#25D366' }} />
                        <span style={{ flex: 1 }}>{selectedUnidade.whatsapp}</span>
                      </div>
                      <Button
                        type="primary"
                        icon={<WhatsAppOutlined />}
                        size="small"
                        style={{
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                        }}
                        onClick={() => {
                          const cleanNumber = selectedUnidade.whatsapp.replace(/\D/g, '')
                          window.open(`https://wa.me/55${cleanNumber}`, '_blank')
                        }}
                      >
                        Abrir WhatsApp
                      </Button>
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
                          <Tag
                            key={esp.id}
                            color="blue"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedEspecialidade(esp)
                              setEspecialidadeModalVisible(true)
                            }}
                          >
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

                  {/* Redes Sociais */}
                  {selectedUnidade.redes_sociais && selectedUnidade.redes_sociais.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <GlobalOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Redes Sociais
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {selectedUnidade.redes_sociais.map((rede) => (
                          <a
                            key={rede.id}
                            href={rede.url_perfil}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              backgroundColor: '#f0f7ff',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: '#1890ff',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.3s',
                              border: '1px solid #d6e4ff',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e6f7ff'
                              e.currentTarget.style.borderColor = '#1890ff'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f7ff'
                              e.currentTarget.style.borderColor = '#d6e4ff'
                            }}
                          >
                            {getRedeSocialIcon(rede.nome_rede)}
                            <span>{rede.nome_rede}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

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
                  <img
                    src="/uploads/Logo-da-Prefeitura-de-Corumba-MS.png"
                    alt="Prefeitura de Corumbá"
                    style={{
                      maxWidth: '180px',
                      height: 'auto',
                      marginBottom: '24px'
                    }}
                  />
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>
                    Bem-vindo ao Mapa da Saúde
                  </h2>
                  <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginTop: '16px', marginBottom: '24px' }}>
                    Explore as unidades de saúde de Corumbá.
                    <br />
                    Clique em um ponto no mapa para ver os detalhes.
                  </p>

                  {/* Componente de Busca */}
                  <Card
                    style={{
                      marginTop: '24px',
                      textAlign: 'left',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        fontWeight: 'bold',
                        color: '#1890ff'
                      }}>
                        <SearchOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
                        O que você precisa encontrar?
                      </div>

                      <Select
                        placeholder="Selecione o tipo de busca"
                        className="custom-select"
                        style={{
                          width: '100%',
                          marginBottom: '12px',
                        }}
                        value={searchType}
                        onChange={(value) => {
                          setSearchType(value)
                          setSearchValue(null)
                        }}
                        allowClear
                        onClear={handleResetSearch}
                        size="large"
                      >
                        <Select.Option value="bairro">Buscar por Bairro</Select.Option>
                        <Select.Option value="unidade">Buscar por Unidade</Select.Option>
                        <Select.Option value="especialidade">Buscar por Especialidade</Select.Option>
                      </Select>

                      {searchType === 'bairro' && (
                        <Select
                          placeholder="Selecione um bairro"
                          className="custom-select"
                          style={{ width: '100%' }}
                          value={searchValue}
                          onChange={setSearchValue}
                          showSearch
                          allowClear
                          size="large"
                          filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {bairros.map((bairro) => (
                            <Select.Option key={bairro} value={bairro}>
                              {bairro}
                            </Select.Option>
                          ))}
                        </Select>
                      )}

                      {searchType === 'unidade' && (
                        <Select
                          placeholder="Selecione uma unidade"
                          className="custom-select"
                          style={{ width: '100%' }}
                          value={searchValue}
                          onChange={setSearchValue}
                          showSearch
                          allowClear
                          size="large"
                          filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {unidades.map((unidade) => (
                            <Select.Option key={unidade.id} value={unidade.id}>
                              {unidade.nome}
                            </Select.Option>
                          ))}
                        </Select>
                      )}

                      {searchType === 'especialidade' && (
                        <Select
                          placeholder="Selecione uma especialidade"
                          className="custom-select"
                          style={{ width: '100%' }}
                          value={searchValue}
                          onChange={setSearchValue}
                          showSearch
                          allowClear
                          size="large"
                          filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {especialidades.map((especialidade) => (
                            <Select.Option key={especialidade.id} value={especialidade.id}>
                              {especialidade.nome}
                            </Select.Option>
                          ))}
                        </Select>
                      )}
                    </div>

                    {searchValue && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#f0f7ff',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}>
                        <strong>Resultados:</strong> {filteredUnidades.length} unidade(s) encontrada(s)
                      </div>
                    )}
                  </Card>

                  {/* Rodapé com informações da fonte de dados */}
                  <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    fontSize: '11px',
                    color: '#666',
                    textAlign: 'center',
                    lineHeight: 1.5,
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      Fonte de dados: <strong>Secretaria Municipal de Saúde de Corumbá</strong>
                    </div>
                    <div>
                      Dados cadastrados e atualizados pela equipe de saúde
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#888' }}>
                      Última atualização: {formatarDataAtualizacao()}
                    </div>
                  </div>

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
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <MapContainer
            center={CORUMBA_CONFIG.center}
            zoom={CORUMBA_CONFIG.zoom}
            maxBounds={CORUMBA_CONFIG.bounds}
            maxBoundsViscosity={1.0}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <ZoomControl position="topright" />
            <MapViewController selectedUnidade={selectedUnidade} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredUnidades.map((unidade) => {
              if (!unidade.latitude || !unidade.longitude) {
                console.error('Unidade sem coordenadas:', unidade);
                return null;
              }

              // Criar ícone customizado se a unidade tiver um icone_url válido
              let customIcon = null;
              if (unidade.icone_url && unidade.icone_url.trim() !== '') {
                try {
                  customIcon = L.icon({
                    iconUrl: unidade.icone_url,
                    iconSize: [32, 48],
                    iconAnchor: [16, 48],
                    popupAnchor: [0, -48],
                  });
                } catch (error) {
                  console.error('Erro ao criar ícone para unidade:', unidade.nome, error);
                }
              }

              const isSelected = selectedUnidade?.id === unidade.id

              return (
                <CustomMarker
                  key={unidade.id}
                  unidade={unidade}
                  onClick={handleMarkerClick}
                  customIcon={customIcon}
                  isSelected={isSelected}
                />
              )
            })}
          </MapContainer>

          {/* Legenda do Mapa */}
          <MapLegend unidades={filteredUnidades} iconesData={iconesData} />
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
                {(selectedUnidade.endereco || selectedUnidade.bairro) && (
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <EnvironmentOutlined style={{ marginRight: '6px' }} />
                    {formatarEnderecoCompleto(selectedUnidade)}
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

        {/* Modal de Médicos por Especialidade */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MedicineBoxOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              <span>Médicos - {selectedEspecialidade?.nome}</span>
            </div>
          }
          open={especialidadeModalVisible}
          onCancel={() => {
            setEspecialidadeModalVisible(false)
            setSelectedEspecialidade(null)
          }}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => {
                setEspecialidadeModalVisible(false)
                setSelectedEspecialidade(null)
              }}
            >
              Fechar
            </Button>,
          ]}
          width={600}
        >
          {selectedUnidade && selectedEspecialidade && (
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
                {(selectedUnidade.endereco || selectedUnidade.bairro) && (
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    <EnvironmentOutlined style={{ marginRight: '6px' }} />
                    {formatarEnderecoCompleto(selectedUnidade)}
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
              ) : (() => {
                // Filtrar médicos que têm a especialidade selecionada
                const medicosFiltrados = medicos.filter(medico =>
                  medico.especialidades?.some(esp => esp.id === selectedEspecialidade.id)
                )

                return medicosFiltrados.length > 0 ? (
                  <div>
                    <div style={{
                      marginBottom: '12px',
                      fontSize: '14px',
                      color: '#666',
                      fontWeight: '500',
                    }}>
                      {medicosFiltrados.length} {medicosFiltrados.length === 1 ? 'médico encontrado' : 'médicos encontrados'}
                    </div>
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      paddingRight: '8px',
                    }}>
                      {medicosFiltrados.map((medico) => (
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
                                  color={esp.id === selectedEspecialidade.id ? 'blue' : 'default'}
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
                    description={`Nenhum médico encontrado para a especialidade "${selectedEspecialidade.nome}"`}
                    style={{ padding: '40px 0' }}
                  />
                )
              })()}
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}
