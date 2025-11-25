import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, InputNumber, message, Space, Upload, Image, Alert } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  useGetStagingQuery,
  useEnrichStagingMutation,
  useValidateStagingMutation,
  useUploadUnidadeImagemMutation,
  useDeleteUnidadeImagemMutation,
} from '../../store/slices/apiSlice'

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Coordenadas padrão de Corumbá-MS
const DEFAULT_CENTER = [-19.0089, -57.6531]
const DEFAULT_ZOOM = 13

// Componente para capturar cliques no mapa
function LocationMarker({ position, setPosition, form }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      // Atualizar os campos do formulário
      form.setFieldsValue({
        latitude_manual: lat,
        longitude_manual: lng,
      })
    },
  })

  return position ? <Marker position={position} /> : null
}

export default function StagingPage() {
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [mapPosition, setMapPosition] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageFilename, setImageFilename] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useGetStagingQuery({ page, limit: 20 })
  const [enrichStaging] = useEnrichStagingMutation()
  const [validateStaging] = useValidateStagingMutation()
  const [uploadImage] = useUploadUnidadeImagemMutation()
  const [deleteImage] = useDeleteUnidadeImagemMutation()

  const statusColors = {
    pendente: 'orange',
    validado: 'green',
    erro: 'red',
    ignorado: 'gray',
  }

  const handleEnrich = (record) => {
    setSelectedRecord(record)

    // Resetar estado do mapa e imagem
    const lat = record.latitude_manual
    const lng = record.longitude_manual

    if (lat && lng) {
      setMapPosition([parseFloat(lat), parseFloat(lng)])
    } else {
      setMapPosition(null)
    }

    if (record.imagem_url) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const baseUrl = apiUrl.replace('/api', '')
      setImageUrl(baseUrl + record.imagem_url)
      // Extrair filename do URL
      const filename = record.imagem_url.split('/').pop()
      setImageFilename(filename)
    } else {
      setImageUrl(null)
      setImageFilename(null)
    }

    form.setFieldsValue({
      nome_familiar: record.nome_familiar,
      endereco_manual: record.endereco_manual,
      latitude_manual: record.latitude_manual,
      longitude_manual: record.longitude_manual,
      observacoes: record.observacoes,
    })
    setModalVisible(true)
  }

  const handleUploadImage = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('imagem', file)

    try {
      const result = await uploadImage(formData).unwrap()
      setImageFilename(result.data.filename)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const baseUrl = apiUrl.replace('/api', '')
      setImageUrl(baseUrl + result.data.url)

      message.success('Imagem enviada com sucesso!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }

    return false // Prevenir upload automático
  }

  const handleDeleteImage = async () => {
    if (!imageFilename) return

    try {
      await deleteImage(imageFilename).unwrap()
      setImageUrl(null)
      setImageFilename(null)
      message.success('Imagem removida com sucesso!')
    } catch (error) {
      message.error('Erro ao remover imagem')
    }
  }

  const handleSaveEnrichment = async (values) => {
    try {
      // Incluir URL da imagem se houver
      const dataToSave = {
        ...values,
        imagem_url: imageUrl ? imageUrl.replace(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001', '') : null,
      }

      const result = await enrichStaging({ id: selectedRecord.id, ...dataToSave }).unwrap()

      // Mostrar quantos registros foram atualizados
      if (result.records_updated) {
        message.success(`${result.records_updated} registros da mesma unidade foram enriquecidos!`)
      } else {
        message.success('Registro enriquecido com sucesso!')
      }

      setModalVisible(false)
      setMapPosition(null)
      setImageUrl(null)
      setImageFilename(null)
    } catch (error) {
      message.error('Erro ao enriquecer registro')
    }
  }

  const handleValidate = async (id) => {
    try {
      const result = await validateStaging(id).unwrap()

      // Mostrar mensagem detalhada sobre o agrupamento
      if (result.records_grouped > 1) {
        message.success(
          `${result.records_grouped} registros agrupados e validados! ` +
          `${result.medicos_count} médicos e ${result.especialidades_count} especialidades processadas.`,
          5 // Duração de 5 segundos
        )
      } else {
        message.success('Registro validado e promovido para produção!')
      }
    } catch (error) {
      message.error(error.data?.error || 'Erro ao validar registro')
    }
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setMapPosition(null)
    setImageUrl(null)
    setImageFilename(null)
    form.resetFields()
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'ID Origem', dataIndex: 'id_origem', key: 'id_origem', width: 120 },
    { title: 'Unidade', dataIndex: 'nome_unidade_bruto', key: 'nome_unidade_bruto' },
    { title: 'Médico', dataIndex: 'nome_medico_bruto', key: 'nome_medico_bruto' },
    { title: 'Especialidade', dataIndex: 'nome_especialidade_bruto', key: 'nome_especialidade_bruto' },
    {
      title: 'Status',
      dataIndex: 'status_processamento',
      key: 'status_processamento',
      width: 120,
      render: (status) => <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEnrich(record)}>Enriquecer</Button>
          {record.status_processamento === 'pendente' && (
            <Button size="small" type="primary" onClick={() => handleValidate(record.id)}>
              Validar
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h1>Gerenciamento de Staging</h1>
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination?.total || 0,
          onChange: setPage,
        }}
      />

      <Modal
        title={`Enriquecer Registro #${selectedRecord?.id || ''}`}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <Alert
          message="Dica: Clique no mapa para definir a localização"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} onFinish={handleSaveEnrichment} layout="vertical">
          {/* Informações originais */}
          <div style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <strong>Dados originais:</strong>
            <div>Unidade: {selectedRecord?.nome_unidade_bruto}</div>
            <div>Médico: {selectedRecord?.nome_medico_bruto}</div>
            <div>Especialidade: {selectedRecord?.nome_especialidade_bruto}</div>
          </div>

          <Form.Item name="nome_familiar" label="Nome Familiar (para exibição)">
            <Input placeholder="Ex: UBS Central, Hospital Municipal, etc." />
          </Form.Item>

          <Form.Item name="endereco_manual" label="Endereço">
            <Input placeholder="Endereço completo da unidade" />
          </Form.Item>

          {/* Mapa Interativo */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: 500
            }}>
              Localização no Mapa *
            </label>
            <div style={{ height: '300px', marginBottom: 16 }}>
              <MapContainer
                center={mapPosition || DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%' }}
                key={mapPosition ? `${mapPosition[0]}-${mapPosition[1]}` : 'default'}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                  position={mapPosition}
                  setPosition={setMapPosition}
                  form={form}
                />
              </MapContainer>
            </div>
          </div>

          {/* Campos de latitude e longitude (auto-preenchidos pelo mapa) */}
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="latitude_manual"
              label="Latitude"
              rules={[{ required: true, message: 'Clique no mapa para definir' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={0.000001}
                precision={8}
                disabled
              />
            </Form.Item>
            <Form.Item
              name="longitude_manual"
              label="Longitude"
              rules={[{ required: true, message: 'Clique no mapa para definir' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={0.000001}
                precision={8}
                disabled
              />
            </Form.Item>
          </Space>

          {/* Upload de Imagem */}
          <Form.Item label="Imagem da Unidade">
            <Space direction="vertical" style={{ width: '100%' }}>
              {imageUrl && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteImage}
                    style={{ marginTop: 8 }}
                  >
                    Remover Imagem
                  </Button>
                </div>
              )}
              {!imageUrl && (
                <Upload
                  beforeUpload={handleUploadImage}
                  maxCount={1}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {uploading ? 'Enviando...' : 'Escolher Imagem'}
                  </Button>
                </Upload>
              )}
              <div style={{ fontSize: '12px', color: '#999' }}>
                Formatos aceitos: JPG, PNG, WEBP (máx. 2MB)
              </div>
            </Space>
          </Form.Item>

          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={3} placeholder="Observações ou informações adicionais" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Salvar</Button>
              <Button onClick={handleModalClose}>Cancelar</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
