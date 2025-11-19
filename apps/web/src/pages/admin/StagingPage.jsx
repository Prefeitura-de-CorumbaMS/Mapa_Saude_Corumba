import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, InputNumber, message, Space } from 'antd'
import { useGetStagingQuery, useEnrichStagingMutation, useValidateStagingMutation } from '../../store/slices/apiSlice'

export default function StagingPage() {
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  
  const { data, isLoading } = useGetStagingQuery({ page, limit: 20 })
  const [enrichStaging] = useEnrichStagingMutation()
  const [validateStaging] = useValidateStagingMutation()
  
  const statusColors = {
    pendente: 'orange',
    validado: 'green',
    erro: 'red',
    ignorado: 'gray',
  }
  
  const handleEnrich = (record) => {
    setSelectedRecord(record)
    form.setFieldsValue({
      nome_familiar: record.nome_familiar,
      endereco_manual: record.endereco_manual,
      latitude_manual: record.latitude_manual,
      longitude_manual: record.longitude_manual,
      observacoes: record.observacoes,
    })
    setModalVisible(true)
  }
  
  const handleSaveEnrichment = async (values) => {
    try {
      await enrichStaging({ id: selectedRecord.id, ...values }).unwrap()
      message.success('Registro enriquecido com sucesso!')
      setModalVisible(false)
    } catch (error) {
      message.error('Erro ao enriquecer registro')
    }
  }
  
  const handleValidate = async (id) => {
    try {
      await validateStaging(id).unwrap()
      message.success('Registro validado e promovido para produção!')
    } catch (error) {
      message.error(error.data?.error || 'Erro ao validar registro')
    }
  }
  
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'ID Origem', dataIndex: 'id_origem', key: 'id_origem' },
    { title: 'Unidade', dataIndex: 'nome_unidade_bruto', key: 'nome_unidade_bruto' },
    { title: 'Médico', dataIndex: 'nome_medico_bruto', key: 'nome_medico_bruto' },
    { 
      title: 'Status', 
      dataIndex: 'status_processamento', 
      key: 'status_processamento',
      render: (status) => <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
    },
    {
      title: 'Ações',
      key: 'actions',
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
        title="Enriquecer Registro"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSaveEnrichment} layout="vertical">
          <Form.Item name="nome_familiar" label="Nome Familiar">
            <Input />
          </Form.Item>
          <Form.Item name="endereco_manual" label="Endereço">
            <Input />
          </Form.Item>
          <Form.Item name="latitude_manual" label="Latitude" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} step={0.000001} />
          </Form.Item>
          <Form.Item name="longitude_manual" label="Longitude" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} step={0.000001} />
          </Form.Item>
          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Salvar</Button>
              <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
