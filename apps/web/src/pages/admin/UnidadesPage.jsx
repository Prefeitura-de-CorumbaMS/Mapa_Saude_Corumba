import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, Select,
  message, Popconfirm, Typography, Divider, Card, List, Alert, Upload
} from 'antd'
import {
  EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  MedicineBoxOutlined, UserOutlined, CloseOutlined, WhatsAppOutlined, PhoneOutlined,
  FacebookOutlined, InstagramOutlined, GlobalOutlined, LinkOutlined, DownOutlined, UpOutlined,
  UploadOutlined, PictureOutlined,
} from '@ant-design/icons'
import {
  useGetUnidadesQuery,
  useGetMedicosQuery,
  useCreateUnidadeMutation,
  useUpdateUnidadeMutation,
  useDeleteUnidadeMutation,
  useGetUnidadeMedicosQuery,
  useGetUnidadeRedesSociaisQuery,
  useCreateUnidadeRedeSocialMutation,
  useUpdateUnidadeRedeSocialMutation,
  useDeleteUnidadeRedeSocialMutation,
  useUploadUnidadeImagemMutation,
  useDeleteUnidadeImagemMutation,
  useUploadIconeMutation,
  useGetBairrosQuery,
} from '../../store/slices/apiSlice'

const { Title, Text } = Typography
const { TextArea } = Input

// Lista de redes sociais disponíveis
const REDES_SOCIAIS_OPTIONS = [
  { value: 'Facebook', label: 'Facebook', icon: <FacebookOutlined /> },
  { value: 'Instagram', label: 'Instagram', icon: <InstagramOutlined /> },
  { value: 'Twitter', label: 'Twitter', icon: <GlobalOutlined /> },
  { value: 'LinkedIn', label: 'LinkedIn', icon: <LinkOutlined /> },
  { value: 'YouTube', label: 'YouTube', icon: <GlobalOutlined /> },
  { value: 'TikTok', label: 'TikTok', icon: <GlobalOutlined /> },
  { value: 'Website', label: 'Website', icon: <GlobalOutlined /> },
  { value: 'Outro', label: 'Outro', icon: <LinkOutlined /> },
]

export default function UnidadesPage() {
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState(null)
  const [selectedMedicos, setSelectedMedicos] = useState([])
  const [redesSociais, setRedesSociais] = useState([])
  const [novaRedeSocial, setNovaRedeSocial] = useState({ nome_rede: '', url_perfil: '' })
  const [isMedicosListExpanded, setIsMedicosListExpanded] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [form] = Form.useForm()

  // API hooks
  const { data, isLoading } = useGetUnidadesQuery({ page, limit: 20 })
  const { data: medicosData } = useGetMedicosQuery({ ativo: 'true', limit: 1000 })
  const { data: bairrosData } = useGetBairrosQuery({ ativo: true })
  const [createUnidade, { isLoading: creating }] = useCreateUnidadeMutation()
  const [updateUnidade, { isLoading: updating }] = useUpdateUnidadeMutation()
  const [deleteUnidade] = useDeleteUnidadeMutation()
  const [uploadUnidadeImagem] = useUploadUnidadeImagemMutation()
  const [uploadIcone] = useUploadIconeMutation()

  // Fetch unit medicos when editing
  const { data: unidadeMedicosData } = useGetUnidadeMedicosQuery(editingUnidade?.id, {
    skip: !editingUnidade
  })

  // Fetch unit redes sociais when editing
  const { data: unidadeRedesSociaisData } = useGetUnidadeRedesSociaisQuery(editingUnidade?.id, {
    skip: !editingUnidade
  })

  const [createRedeSocial, { isLoading: creatingRede }] = useCreateUnidadeRedeSocialMutation()
  const [updateRedeSocial, { isLoading: updatingRede }] = useUpdateUnidadeRedeSocialMutation()
  const [deleteRedeSocial] = useDeleteUnidadeRedeSocialMutation()

  const medicos = medicosData?.data || []
  const bairros = bairrosData?.data?.map(b => b.nome).sort() || []

  // Handle upload de imagem
  const handleUploadImagem = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('imagem', file)

    try {
      const result = await uploadUnidadeImagem(formData).unwrap()
      setImageUrl(result.data.url)
      message.success('Imagem enviada com sucesso!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
    return false
  }

  // Handle upload de ícone
  const handleUploadIcone = async (file) => {
    setUploadingIcon(true)
    const formData = new FormData()
    formData.append('icone', file)

    try {
      const result = await uploadIcone(formData).unwrap()
      setSelectedIcon(result.data.url)
      message.success('Ícone enviado com sucesso!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao enviar ícone')
    } finally {
      setUploadingIcon(false)
    }
    return false
  }

  // Handle create new unit
  const handleCreate = () => {
    setEditingUnidade(null)
    setSelectedMedicos([])
    setRedesSociais([])
    setIsMedicosListExpanded(false)
    setImageUrl(null)
    setSelectedIcon(null)
    form.resetFields()
    form.setFieldsValue({ ativo: true })
    setIsModalOpen(true)
  }

  // Handle edit unit
  const handleEdit = async (unidade) => {
    setEditingUnidade(unidade)
    setIsMedicosListExpanded(false)

    // Set image and icon if available
    setImageUrl(unidade.imagem_url || null)
    setSelectedIcon(unidade.icone_url || null)

    // Set basic form fields
    form.setFieldsValue({
      nome: unidade.nome,
      endereco: unidade.endereco,
      bairro: unidade.bairro,
      latitude: parseFloat(unidade.latitude),
      longitude: parseFloat(unidade.longitude),
      telefone: unidade.telefone,
      whatsapp: unidade.whatsapp,
      enfermeiro_responsavel: unidade.enfermeiro_responsavel,
      horario_atendimento: unidade.horario_atendimento,
      ativo: unidade.ativo,
    })

    setIsModalOpen(true)
  }

  // Update selected medicos and redes sociais when unit data arrives
  useEffect(() => {
    if (editingUnidade && unidadeMedicosData?.data) {
      const medicoIds = unidadeMedicosData.data.map(m => m.id)
      setSelectedMedicos(medicoIds)
      form.setFieldsValue({ medicos: medicoIds })
    }

    if (editingUnidade && unidadeRedesSociaisData?.data) {
      setRedesSociais(unidadeRedesSociaisData.data)
    }
  }, [editingUnidade, unidadeMedicosData, unidadeRedesSociaisData, form])

  // Handle delete unit
  const handleDelete = async (id) => {
    try {
      await deleteUnidade(id).unwrap()
      message.success('Unidade excluída com sucesso!')
    } catch (error) {
      message.error('Erro ao excluir unidade: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal submit
  const handleSubmit = async (values) => {
    try {
      const payload = {
        nome: values.nome,
        endereco: values.endereco || null,
        bairro: values.bairro || null,
        latitude: values.latitude,
        longitude: values.longitude,
        telefone: values.telefone || null,
        whatsapp: values.whatsapp || null,
        enfermeiro_responsavel: values.enfermeiro_responsavel || null,
        horario_atendimento: values.horario_atendimento || null,
        ativo: values.ativo ?? true,
        medicos: selectedMedicos,
        imagem_url: imageUrl || null,
        icone_url: selectedIcon || null,
        // Especialidades serão calculadas automaticamente no backend baseado nos médicos
      }

      let unidadeId

      if (editingUnidade) {
        // Update existing unit
        await updateUnidade({ id: editingUnidade.id, ...payload }).unwrap()
        unidadeId = editingUnidade.id

        // Gerenciar redes sociais para unidade existente
        // Comparar com redes sociais existentes e fazer create/delete conforme necessário
        const redesSociaisExistentes = unidadeRedesSociaisData?.data || []

        // Deletar redes sociais que foram removidas
        for (const redeExistente of redesSociaisExistentes) {
          const aindaExiste = redesSociais.some(r => r.id === redeExistente.id)
          if (!aindaExiste) {
            await deleteRedeSocial({ id: unidadeId, redeId: redeExistente.id }).unwrap()
          }
        }

        // Criar novas redes sociais
        for (const rede of redesSociais) {
          // Se o id for um timestamp (gerado localmente), é uma nova rede social
          if (!redesSociaisExistentes.some(r => r.id === rede.id)) {
            await createRedeSocial({
              id: unidadeId,
              nome_rede: rede.nome_rede,
              url_perfil: rede.url_perfil,
            }).unwrap()
          }
        }

        message.success('Unidade atualizada com sucesso!')
      } else {
        // Create new unit - generate id_origem
        const id_origem = `manual_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
        const novaUnidade = await createUnidade({ ...payload, id_origem }).unwrap()
        unidadeId = novaUnidade.data.id

        // Salvar redes sociais para nova unidade
        for (const rede of redesSociais) {
          await createRedeSocial({
            id: unidadeId,
            nome_rede: rede.nome_rede,
            url_perfil: rede.url_perfil,
          }).unwrap()
        }

        message.success('Unidade criada com sucesso!')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingUnidade(null)
      setSelectedMedicos([])
      setRedesSociais([])
      setIsMedicosListExpanded(false)
      setImageUrl(null)
      setSelectedIcon(null)
    } catch (error) {
      message.error('Erro ao salvar unidade: ' + (error.data?.error || error.message))
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingUnidade(null)
    setSelectedMedicos([])
    setRedesSociais([])
    setIsMedicosListExpanded(false)
    setImageUrl(null)
    setSelectedIcon(null)
    setNovaRedeSocial({ nome_rede: '', url_perfil: '' })
  }

  // Handle adding medico to team
  const handleAddMedico = (medicoId) => {
    if (!selectedMedicos.includes(medicoId)) {
      const newSelected = [...selectedMedicos, medicoId]
      setSelectedMedicos(newSelected)
      form.setFieldsValue({ medicos: newSelected })
    }
  }

  // Handle removing medico from team
  const handleRemoveMedico = (medicoId) => {
    const newSelected = selectedMedicos.filter(id => id !== medicoId)
    setSelectedMedicos(newSelected)
    form.setFieldsValue({ medicos: newSelected })
  }

  // Handle adding rede social
  const handleAddRedeSocial = () => {
    if (!novaRedeSocial.nome_rede || !novaRedeSocial.url_perfil) {
      message.error('Preencha todos os campos da rede social')
      return
    }

    if (redesSociais.length >= 3) {
      message.error('Limite máximo de 3 redes sociais por unidade')
      return
    }

    setRedesSociais([...redesSociais, {
      nome_rede: novaRedeSocial.nome_rede,
      url_perfil: novaRedeSocial.url_perfil,
      id: Date.now()
    }])
    setNovaRedeSocial({ nome_rede: '', url_perfil: '' })
    message.success('Rede social adicionada')
  }

  // Handle updating rede social
  const handleUpdateRedeSocial = async (redeId, values) => {
    try {
      if (!editingUnidade) {
        // Para nova unidade, atualizar localmente
        setRedesSociais(redesSociais.map(rede =>
          rede.id === redeId ? { ...rede, ...values } : rede
        ))
        message.success('Rede social atualizada')
        return
      }

      // Para unidade existente, atualizar na API
      await updateRedeSocial({
        id: editingUnidade.id,
        redeId,
        nome_rede: values.nome_rede,
        url_perfil: values.url_perfil,
      }).unwrap()

      message.success('Rede social atualizada')
    } catch (error) {
      message.error('Erro ao atualizar rede social: ' + (error.data?.error || error.message))
    }
  }

  // Handle removing rede social
  const handleRemoveRedeSocial = async (redeId) => {
    try {
      if (!editingUnidade) {
        // Para nova unidade, remover localmente
        setRedesSociais(redesSociais.filter(rede => rede.id !== redeId))
        message.success('Rede social removida')
        return
      }

      // Para unidade existente, remover da API
      await deleteRedeSocial({
        id: editingUnidade.id,
        redeId,
      }).unwrap()

      message.success('Rede social removida')
    } catch (error) {
      message.error('Erro ao remover rede social: ' + (error.data?.error || error.message))
    }
  }

  // Get selected medicos with full data
  const getSelectedMedicosData = () => {
    return selectedMedicos
      .map(id => medicos.find(m => m.id === id))
      .filter(Boolean)
  }

  // Get available medicos (not yet selected)
  const getAvailableMedicos = () => {
    return medicos.filter(m => !selectedMedicos.includes(m.id))
  }

  // Get icon for social network
  const getRedeSocialIcon = (nomeRede) => {
    const rede = REDES_SOCIAIS_OPTIONS.find(r => r.value === nomeRede)
    return rede ? rede.icon : <LinkOutlined />
  }

  // Calculate especialidades offered based on selected medicos
  const getEspecialidadesOferecidas = () => {
    const selectedMedicosData = getSelectedMedicosData()
    const especialidadesSet = new Set()

    selectedMedicosData.forEach(medico => {
      if (medico.especialidades && medico.especialidades.length > 0) {
        medico.especialidades.forEach(esp => {
          especialidadesSet.add(JSON.stringify({ id: esp.id, nome: esp.nome }))
        })
      }
    })

    return Array.from(especialidadesSet).map(esp => JSON.parse(esp))
  }

  // Table columns
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      width: '25%',
      render: (text) => <Text strong>{text}</Text>
    },
    { title: 'Endereço', dataIndex: 'endereco', key: 'endereco', width: '25%' },
    {
      title: 'Especialidades',
      dataIndex: 'especialidades',
      key: 'especialidades',
      width: '20%',
      render: (especialidades) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {especialidades && especialidades.length > 0 ? (
            especialidades.slice(0, 3).map(esp => (
              <Tag key={esp.id} color="blue" style={{ margin: 0 }}>
                {esp.nome}
              </Tag>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
          {especialidades && especialidades.length > 3 && (
            <Tag color="default">+{especialidades.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      render: (ativo) => <Tag color={ativo ? 'green' : 'red'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Confirmar exclusão"
            description={`Tem certeza que deseja excluir ${record.nome}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <EnvironmentOutlined style={{ marginRight: '12px' }} />
          Unidades de Saúde
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Nova Unidade
        </Button>
      </div>

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

      {/* Create/Edit Modal */}
      <Modal
        title={editingUnidade ? 'Editar Unidade' : 'Nova Unidade'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ ativo: true }}
        >
          <Divider orientation="left">
            <Text strong><EnvironmentOutlined /> Informações Básicas</Text>
          </Divider>

          <Form.Item
            label="Nome da Unidade"
            name="nome"
            rules={[{ required: true, message: 'Por favor, insira o nome da unidade' }]}
          >
            <Input placeholder="Digite o nome da unidade" />
          </Form.Item>

          <Form.Item label="Endereço" name="endereco">
            <Input placeholder="Digite o endereço completo" />
          </Form.Item>

          <Form.Item label="Bairro" name="bairro">
            <Select
              placeholder="Selecione o bairro"
              showSearch
              allowClear
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
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item
              label="Latitude"
              name="latitude"
              rules={[{ required: true, message: 'Latitude obrigatória' }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                placeholder="-19.0078"
                step={0.000001}
                precision={8}
                style={{ width: 200 }}
              />
            </Form.Item>

            <Form.Item
              label="Longitude"
              name="longitude"
              rules={[{ required: true, message: 'Longitude obrigatória' }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                placeholder="-57.6547"
                step={0.000001}
                precision={8}
                style={{ width: 200 }}
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="ativo"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
            </Form.Item>
          </Space>

          <Form.Item label="Telefone" name="telefone">
            <Input placeholder="(67) 3234-5678" />
          </Form.Item>

          <Form.Item label="WhatsApp" name="whatsapp">
            <Input
              placeholder="(67) 99999-9999"
              addonAfter={
                <Button
                  type="link"
                  icon={<WhatsAppOutlined />}
                  size="small"
                  onClick={() => {
                    const whatsapp = form.getFieldValue('whatsapp');
                    if (whatsapp) {
                      const cleanNumber = whatsapp.replace(/\D/g, '');
                      window.open(`https://wa.me/55${cleanNumber}`, '_blank');
                    } else {
                      message.warning('Por favor, insira um número de WhatsApp primeiro');
                    }
                  }}
                >
                  Abrir WhatsApp
                </Button>
              }
            />
          </Form.Item>

          <Form.Item label="Enfermeiro(a) Responsável" name="enfermeiro_responsavel">
            <Input placeholder="Nome do(a) enfermeiro(a) responsável" />
          </Form.Item>

          <Form.Item label="Horário de Atendimento" name="horario_atendimento">
            <TextArea
              rows={2}
              placeholder="Ex: Segunda a Sexta: 7h às 17h"
            />
          </Form.Item>

          <Divider orientation="left">
            <Text strong><PictureOutlined /> Mídia</Text>
          </Divider>

          {/* Upload de Imagem */}
          <Form.Item label="Imagem da Unidade">
            <Space direction="vertical" style={{ width: '100%' }}>
              {imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => setImageUrl(null)}
                  >
                    Remover imagem
                  </Button>
                </div>
              )}
              <Upload
                beforeUpload={handleUploadImagem}
                maxCount={1}
                accept="image/*"
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {uploading ? 'Enviando...' : imageUrl ? 'Trocar Imagem' : 'Fazer Upload da Imagem'}
                </Button>
              </Upload>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Formatos aceitos: JPG, PNG (máx. 5MB)
              </div>
            </Space>
          </Form.Item>

          {/* Seleção de Ícone */}
          <Form.Item label="Ícone do Marcador no Mapa">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                Escolha um dos ícones padrão ou adicione um novo:
              </div>
              <Space size="large" wrap>
                {[
                  { url: '/uploads/icon_mod_UBS.png', label: 'UBS' },
                  { url: '/uploads/icon_mod_Pronto_Atendimento.png', label: 'Pronto Atendimento' },
                  { url: '/uploads/icon_mod_Doacao.png', label: 'Hemonúcleo' },
                  { url: '/uploads/Icone_Academia_da_Saúde.png', label: 'Academia de Saúde' },
                  { url: '/uploads/icone_centros_especializados.png', label: 'Centros Especializados' },
                ].map((icon) => (
                  <div
                    key={icon.url}
                    onClick={() => setSelectedIcon(icon.url)}
                    style={{
                      border: selectedIcon === icon.url ? '3px solid #1890ff' : '2px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      backgroundColor: selectedIcon === icon.url ? '#e6f7ff' : 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100px',
                      height: '100px',
                      gap: '8px',
                    }}
                  >
                    <img
                      src={icon.url}
                      alt={icon.label}
                      style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '11px', color: '#666', textAlign: 'center', fontWeight: selectedIcon === icon.url ? 'bold' : 'normal' }}>
                      {icon.label}
                    </span>
                  </div>
                ))}
                <Upload
                  beforeUpload={handleUploadIcone}
                  maxCount={1}
                  accept="image/svg+xml,image/png"
                  showUploadList={false}
                >
                  <Button
                    type="dashed"
                    icon={<UploadOutlined />}
                    loading={uploadingIcon}
                    style={{ width: '100px', height: '100px' }}
                  >
                    {uploadingIcon ? 'Enviando...' : 'Adicionar'}
                  </Button>
                </Upload>
              </Space>
              {selectedIcon && (
                <div style={{ marginTop: 8 }}>
                  <strong>Ícone selecionado:</strong>{' '}
                  <span style={{ fontSize: '12px', color: '#666' }}>{selectedIcon}</span>
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#999' }}>
                Formatos aceitos para novos ícones: SVG, PNG (máx. 500KB)
              </div>
            </Space>
          </Form.Item>

          <Divider orientation="left">
            <Text strong><UserOutlined /> Equipe Médica</Text>
          </Divider>

          <Form.Item label="Adicionar Médico" style={{ marginBottom: 12 }}>
            <Select
              placeholder="Buscar e selecionar médico..."
              style={{ width: '100%' }}
              showSearch
              value={null}
              onChange={handleAddMedico}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={getAvailableMedicos().map(medico => ({
                label: `${medico.nome} - ${medico.especialidades?.map(e => e.nome).join(', ') || 'Sem especialidade'}`,
                value: medico.id,
              }))}
            />
          </Form.Item>

          {/* Hidden field to store selected medicos */}
          <Form.Item name="medicos" hidden>
            <Input />
          </Form.Item>

          {/* Selected Doctors List */}
          {getSelectedMedicosData().length > 0 && (
            <>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Médicos Selecionados ({getSelectedMedicosData().length})</Text>
                    <Button
                      type="text"
                      size="small"
                      icon={isMedicosListExpanded ? <UpOutlined /> : <DownOutlined />}
                      onClick={() => setIsMedicosListExpanded(!isMedicosListExpanded)}
                    >
                      {isMedicosListExpanded ? 'Recolher' : 'Expandir'}
                    </Button>
                  </div>
                }
                style={{ marginBottom: 16 }}
              >
                {isMedicosListExpanded && (
                  <List
                    dataSource={getSelectedMedicosData()}
                    renderItem={(medico) => (
                      <List.Item
                        key={medico.id}
                        actions={[
                          <Button
                            key="remove"
                            type="text"
                            danger
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => handleRemoveMedico(medico.id)}
                          >
                            Remover
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text strong>{medico.nome}</Text>}
                          description={
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {medico.especialidades && medico.especialidades.length > 0 ? (
                                medico.especialidades.map(esp => (
                                  <Tag key={esp.id} color="blue">
                                    {esp.nome}
                                  </Tag>
                                ))
                              ) : (
                                <Text type="secondary">Sem especialidades cadastradas</Text>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              {/* Especialidades Oferecidas (calculadas automaticamente) */}
              <Card
                size="small"
                title={
                  <div>
                    <MedicineBoxOutlined style={{ marginRight: 8 }} />
                    <Text strong>Especialidades Oferecidas (Automático)</Text>
                  </div>
                }
                style={{ marginBottom: 24, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    As especialidades oferecidas são calculadas automaticamente baseadas na equipe médica selecionada acima.
                  </Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {getEspecialidadesOferecidas().length > 0 ? (
                    getEspecialidadesOferecidas().map(esp => (
                      <Tag key={esp.id} color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {esp.nome}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">
                      Nenhuma especialidade (selecione médicos com especialidades cadastradas)
                    </Text>
                  )}
                </div>
              </Card>
            </>
          )}

          <Divider orientation="left">
            <Text strong><GlobalOutlined /> Redes Sociais</Text>
          </Divider>

          {/* Redes Sociais Section */}
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Adicione até 3 redes sociais para esta unidade (opcional)
            </Text>

            {/* Lista de Redes Sociais */}
            {redesSociais.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <List
                  size="small"
                  dataSource={redesSociais}
                  renderItem={(rede) => (
                    <List.Item
                      actions={[
                        <Button
                          key="edit"
                          type="link"
                          size="small"
                          onClick={() => {
                            message.info('Funcionalidade de edição será implementada em breve')
                          }}
                        >
                          Editar
                        </Button>,
                        <Button
                          key="remove"
                          type="text"
                          danger
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={() => handleRemoveRedeSocial(rede.id)}
                        >
                          Remover
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getRedeSocialIcon(rede.nome_rede)}
                        title={<Text strong>{rede.nome_rede}</Text>}
                        description={
                          <a
                            href={rede.url_perfil}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1890ff' }}
                          >
                            {rede.url_perfil}
                          </a>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Form para adicionar nova rede social */}
            {redesSociais.length < 3 && (
              <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <Space style={{ width: '100%' }}>
                  <Select
                    placeholder="Rede social"
                    style={{ width: 140 }}
                    value={novaRedeSocial.nome_rede}
                    onChange={(value) => setNovaRedeSocial({ ...novaRedeSocial, nome_rede: value })}
                    options={REDES_SOCIAIS_OPTIONS.filter(rede =>
                      !redesSociais.some(r => r.nome_rede === rede.value)
                    )}
                  />
                  <Input
                    placeholder="https://..."
                    style={{ width: 200 }}
                    value={novaRedeSocial.url_perfil}
                    onChange={(e) => setNovaRedeSocial({ ...novaRedeSocial, url_perfil: e.target.value })}
                    onPressEnter={handleAddRedeSocial}
                  />
                  <Button type="primary" onClick={handleAddRedeSocial}>
                    Adicionar
                  </Button>
                </Space>
              </Card>
            )}

            {redesSociais.length >= 3 && (
              <Alert
                message="Limite atingido"
                description="Você pode adicionar no máximo 3 redes sociais por unidade."
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || updating}
                icon={editingUnidade ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingUnidade ? 'Atualizar' : 'Criar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
