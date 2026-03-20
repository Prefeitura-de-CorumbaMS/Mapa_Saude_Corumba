import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  InputNumber,
  Input,
  Tag,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Popconfirm,
  DatePicker,
  Typography,
  Collapse,
  Badge,
  Segmented,
  List,
  Form,
} from 'antd'
import {
  DatabaseOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import {
  useGetDengueByAnoQuery,
  useUpdateDengueBairroMutation,
  useDeleteDengueBairroMutation,
  useUpdateDengueSEMutation,
  useDeleteDengueSEMutation,
} from '../../store/slices/apiSlice'

const { Option } = Select
const { Text, Title } = Typography

export default function VigilanciaGerenciamentoPage() {
  // Estados de filtros
  const [filtroAno, setFiltroAno] = useState(2026)
  const [filtroSE, setFiltroSE] = useState(null)
  const [filtroBairro, setFiltroBairro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('bairros') // 'bairros', 'se', 'perfil'
  const [modoVisualizacao, setModoVisualizacao] = useState('tabela') // 'tabela' ou 'agrupado'

  // Dados
  const { data: dadosVigilancia, isLoading, refetch } = useGetDengueByAnoQuery({ ano: filtroAno })

  // Mutations
  const [updateBairro] = useUpdateDengueBairroMutation()
  const [deleteBairro] = useDeleteDengueBairroMutation()
  const [updateSE] = useUpdateDengueSEMutation()
  const [deleteSE] = useDeleteDengueSEMutation()

  // Estados locais
  const [dadosFiltrados, setDadosFiltrados] = useState([])
  const [editingKey, setEditingKey] = useState('')
  const [editingData, setEditingData] = useState({})

  // Modal de edição
  const [modalEditarVisivel, setModalEditarVisivel] = useState(false)
  const [registroEditando, setRegistroEditando] = useState(null)
  const [form] = Form.useForm()

  // Processar dados quando mudar
  useEffect(() => {
    if (!dadosVigilancia?.data) return

    let dados = []

    if (filtroTipo === 'bairros' && dadosVigilancia.data.bairros) {
      dados = dadosVigilancia.data.bairros
    } else if (filtroTipo === 'se' && dadosVigilancia.data.semanas) {
      dados = dadosVigilancia.data.semanas
    }

    // Aplicar filtros
    if (filtroSE) {
      dados = dados.filter(d => d.semana_epidemiologica === filtroSE)
    }

    if (filtroBairro) {
      dados = dados.filter(d =>
        d.bairro?.toLowerCase().includes(filtroBairro.toLowerCase())
      )
    }

    setDadosFiltrados(dados)
  }, [dadosVigilancia, filtroSE, filtroBairro, filtroTipo])

  // Edição com Modal
  const abrirModalEdicao = (record) => {
    setRegistroEditando(record)
    form.setFieldsValue({
      bairro: record.bairro,
      semana_epidemiologica: record.semana_epidemiologica,
      notificados: record.notificados,
      confirmados: record.confirmados,
    })
    setModalEditarVisivel(true)
  }

  const fecharModalEdicao = () => {
    setModalEditarVisivel(false)
    setRegistroEditando(null)
    form.resetFields()
  }

  const salvarEdicao = async () => {
    try {
      const values = await form.validateFields()

      if (!registroEditando) return

      const dadosAtualizados = {
        id: registroEditando.id,
        bairro: values.bairro,
        semana_epidemiologica: values.semana_epidemiologica,
        notificados: values.notificados,
        confirmados: values.confirmados,
        ano: registroEditando.ano,
      }

      await updateBairro(dadosAtualizados).unwrap()

      message.success('Dados atualizados com sucesso!')
      fecharModalEdicao()
      refetch()
    } catch (error) {
      if (error.errorFields) {
        message.error('Por favor, preencha todos os campos obrigatórios')
      } else {
        message.error('Erro ao atualizar dados: ' + (error.data?.error || error.message))
        console.error(error)
      }
    }
  }

  const handleDelete = async (id) => {
    try {
      if (filtroTipo === 'bairros') {
        await deleteBairro({ id }).unwrap()
      } else {
        await deleteSE({ id }).unwrap()
      }
      message.success('Registro excluído com sucesso!')
      refetch()
    } catch (error) {
      message.error('Erro ao excluir registro: ' + (error.data?.error || error.message))
      console.error(error)
    }
  }

  // Exportar para CSV
  const exportarCSV = () => {
    let csvContent = ''

    if (modoVisualizacao === 'agrupado') {
      // CSV agrupado por SE
      const rows = []
      rows.push(['SE', 'Bairro', 'Ano', 'Notificados', 'Confirmados'])

      dadosAgrupados.forEach(grupo => {
        grupo.bairros.forEach(bairro => {
          rows.push([
            grupo.se,
            bairro.bairro,
            filtroAno,
            bairro.notificados,
            bairro.confirmados
          ])
        })
        // Linha de subtotal
        rows.push([
          `SE ${grupo.se} - TOTAL`,
          '',
          '',
          grupo.totais.notificados,
          grupo.totais.confirmados
        ])
        rows.push(['']) // Linha vazia
      })

      csvContent = rows.map(row => row.join(',')).join('\n')

    } else {
      // CSV normal
      const headers = filtroTipo === 'bairros'
        ? ['Bairro', 'SE', 'Ano', 'Notificados', 'Confirmados']
        : ['SE', 'Ano', 'Notificados', 'Confirmados', 'Óbitos']

      const rows = dadosFiltrados.map(d =>
        filtroTipo === 'bairros'
          ? [d.bairro, d.semana_epidemiologica, filtroAno, d.notificados, d.confirmados]
          : [d.semana_epidemiologica, filtroAno, d.casos_notificados, d.casos_confirmados, d.obitos]
      )

      csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vigilancia_dengue_${filtroAno}_${modoVisualizacao}.csv`
    link.click()

    message.success('CSV exportado com sucesso!')
  }

  // Colunas para tabela de bairros
  const colunasBairros = [
    {
      title: 'Bairro',
      dataIndex: 'bairro',
      key: 'bairro',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.bairro.localeCompare(b.bairro),
      editable: true,
    },
    {
      title: 'SE',
      dataIndex: 'semana_epidemiologica',
      key: 'se',
      width: 80,
      sorter: (a, b) => a.semana_epidemiologica - b.semana_epidemiologica,
      editable: true,
    },
    {
      title: 'Notificados',
      dataIndex: 'notificados',
      key: 'notificados',
      width: 120,
      editable: true,
      render: (val) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Confirmados',
      dataIndex: 'confirmados',
      key: 'confirmados',
      width: 120,
      editable: true,
      render: (val) => <Tag color="green">{val}</Tag>,
    },
    {
      title: 'Ano',
      dataIndex: 'ano',
      key: 'ano',
      width: 80,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => abrirModalEdicao(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja excluir?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // Colunas para tabela de SEs
  const colunasSE = [
    {
      title: 'SE',
      dataIndex: 'semana_epidemiologica',
      key: 'se',
      width: 80,
      sorter: (a, b) => a.semana_epidemiologica - b.semana_epidemiologica,
    },
    {
      title: 'Notificados',
      dataIndex: 'casos_notificados',
      key: 'notificados',
      width: 120,
      render: (val) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Confirmados',
      dataIndex: 'casos_confirmados',
      key: 'confirmados',
      width: 120,
      render: (val) => <Tag color="green">{val}</Tag>,
    },
    {
      title: 'Tipo 1',
      dataIndex: 'sorotipo_tipo1',
      key: 'tipo1',
      width: 80,
    },
    {
      title: 'Tipo 2',
      dataIndex: 'sorotipo_tipo2',
      key: 'tipo2',
      width: 80,
    },
    {
      title: 'Tipo 3',
      dataIndex: 'sorotipo_tipo3',
      key: 'tipo3',
      width: 80,
    },
    {
      title: 'Tipo 4',
      dataIndex: 'sorotipo_tipo4',
      key: 'tipo4',
      width: 80,
    },
    {
      title: 'Óbitos',
      dataIndex: 'obitos',
      key: 'obitos',
      width: 80,
      render: (val) => <Tag color="red">{val}</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja excluir?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // Estatísticas
  const calcularEstatisticas = () => {
    if (!dadosFiltrados.length) return { total: 0, notificados: 0, confirmados: 0 }

    if (filtroTipo === 'bairros') {
      return {
        total: dadosFiltrados.length,
        notificados: dadosFiltrados.reduce((sum, d) => sum + (d.notificados || 0), 0),
        confirmados: dadosFiltrados.reduce((sum, d) => sum + (d.confirmados || 0), 0),
      }
    } else {
      return {
        total: dadosFiltrados.length,
        notificados: dadosFiltrados.reduce((sum, d) => sum + (d.casos_notificados || 0), 0),
        confirmados: dadosFiltrados.reduce((sum, d) => sum + (d.casos_confirmados || 0), 0),
      }
    }
  }

  const stats = calcularEstatisticas()

  // Agrupar dados por SE para visualização agrupada
  const agruparPorSE = () => {
    if (!dadosVigilancia?.data?.bairros) return []

    const grupos = {}

    dadosVigilancia.data.bairros.forEach(item => {
      const se = item.semana_epidemiologica

      if (!grupos[se]) {
        grupos[se] = {
          se,
          bairros: [],
          totais: {
            notificados: 0,
            confirmados: 0,
            descartados: 0,
          }
        }
      }

      // Só adiciona bairros com dados (não zerados)
      if (item.notificados > 0 || item.confirmados > 0) {
        grupos[se].bairros.push(item)
        grupos[se].totais.notificados += item.notificados || 0
        grupos[se].totais.confirmados += item.confirmados || 0
      }
    })

    // Converter para array e ordenar por SE
    return Object.values(grupos)
      .filter(grupo => {
        // Aplicar filtro de SE se existir
        if (filtroSE && grupo.se !== filtroSE) return false
        // Aplicar filtro de bairro se existir
        if (filtroBairro) {
          return grupo.bairros.some(b =>
            b.bairro?.toLowerCase().includes(filtroBairro.toLowerCase())
          )
        }
        return true
      })
      .sort((a, b) => a.se - b.se)
  }

  const dadosAgrupados = agruparPorSE()

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DatabaseOutlined /> Gerenciar Dados de Vigilância
      </Title>

      {/* Estatísticas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Registros"
              value={stats.total}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Notificados"
              value={stats.notificados}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Confirmados"
              value={stats.confirmados}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card title={<><FilterOutlined /> Filtros</>} style={{ marginBottom: 16 }}>
        <Space wrap>
          <div>
            <Text strong>Modo de Visualização:</Text>
            <br />
            <Segmented
              value={modoVisualizacao}
              onChange={setModoVisualizacao}
              options={[
                {
                  label: 'Tabela',
                  value: 'tabela',
                  icon: <UnorderedListOutlined />,
                },
                {
                  label: 'Agrupado por SE',
                  value: 'agrupado',
                  icon: <AppstoreOutlined />,
                },
              ]}
            />
          </div>

          <div>
            <Text strong>Tipo de Dados:</Text>
            <br />
            <Select
              value={filtroTipo}
              onChange={setFiltroTipo}
              style={{ width: 200 }}
              disabled={modoVisualizacao === 'agrupado'}
            >
              <Option value="bairros">Dados por Bairro</Option>
              <Option value="se">Dados por SE</Option>
            </Select>
          </div>

          <div>
            <Text strong>Ano:</Text>
            <br />
            <InputNumber
              min={2020}
              max={2030}
              value={filtroAno}
              onChange={setFiltroAno}
              style={{ width: 100 }}
            />
          </div>

          <div>
            <Text strong>Semana Epidemiológica:</Text>
            <br />
            <Select
              placeholder="Todas"
              allowClear
              value={filtroSE}
              onChange={setFiltroSE}
              style={{ width: 150 }}
            >
              {Array.from({ length: 53 }, (_, i) => i + 1).map(se => (
                <Option key={se} value={se}>SE {se}</Option>
              ))}
            </Select>
          </div>

          {filtroTipo === 'bairros' && (
            <div>
              <Text strong>Bairro:</Text>
              <br />
              <Input
                placeholder="Filtrar por bairro"
                value={filtroBairro}
                onChange={(e) => setFiltroBairro(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={refetch}
            >
              Atualizar
            </Button>
          </div>
        </Space>
      </Card>

      {/* Ações */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={exportarCSV}
          >
            Exportar CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
          >
            Exportar PDF
          </Button>
        </Space>
      </Card>

      {/* Visualização em Tabela */}
      {modoVisualizacao === 'tabela' && (
        <Card>
          <Table
            dataSource={dadosFiltrados}
            columns={filtroTipo === 'bairros' ? colunasBairros : colunasSE}
            rowKey="id"
            loading={isLoading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} registros`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 'max-content', y: 500 }}
            size="small"
            bordered
          />
        </Card>
      )}

      {/* Visualização Agrupada por SE */}
      {modoVisualizacao === 'agrupado' && (
        <Card title={`📅 Dados Agrupados por Semana Epidemiológica - ${filtroAno}`}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>Carregando...</Text>
            </div>
          ) : dadosAgrupados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">Nenhum dado encontrado</Text>
            </div>
          ) : (
            <Collapse
              accordion={false}
              style={{ marginTop: 16 }}
              items={dadosAgrupados.map(grupo => ({
                key: grupo.se,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Text strong style={{ fontSize: '16px', minWidth: '80px' }}>
                      SE {String(grupo.se).padStart(2, '0')}
                    </Text>
                    <Space size="large">
                      <div>
                        <Tag color="blue" style={{ minWidth: '100px', textAlign: 'center' }}>
                          📊 {grupo.totais.notificados} notificados
                        </Tag>
                      </div>
                      <div>
                        <Tag color="green" style={{ minWidth: '100px', textAlign: 'center' }}>
                          ✅ {grupo.totais.confirmados} confirmados
                        </Tag>
                      </div>
                      <div>
                        <Badge count={grupo.bairros.length} showZero style={{ backgroundColor: '#52c41a' }}>
                          <Tag>🏘️ Bairros</Tag>
                        </Badge>
                      </div>
                    </Space>
                  </div>
                ),
                children: (
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                      Bairros com casos registrados:
                    </Text>
                    <List
                      size="small"
                      bordered
                      dataSource={grupo.bairros.sort((a, b) => b.notificados - a.notificados)}
                      renderItem={(bairro) => (
                        <List.Item
                          actions={[
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => {
                                // Encontrar o registro completo
                                const registro = dadosVigilancia.data.bairros.find(
                                  b => b.id === bairro.id
                                )
                                if (registro) abrirModalEdicao(registro)
                              }}
                            >
                              Editar
                            </Button>,
                            <Popconfirm
                              key="delete"
                              title="Tem certeza que deseja excluir?"
                              onConfirm={() => handleDelete(bairro.id)}
                              okText="Sim"
                              cancelText="Não"
                            >
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                Excluir
                              </Button>
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <Text strong>{bairro.bairro}</Text>
                              </Space>
                            }
                            description={
                              <Space size="middle">
                                <Tag color="blue">
                                  📊 Notificados: <strong>{bairro.notificados}</strong>
                                </Tag>
                                <Tag color="green">
                                  ✅ Confirmados: <strong>{bairro.confirmados}</strong>
                                </Tag>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ),
              }))}
            />
          )}
        </Card>
      )}

      {/* Modal de Edição */}
      <Modal
        title="✏️ Editar Dados de Vigilância"
        open={modalEditarVisivel}
        onOk={salvarEdicao}
        onCancel={fecharModalEdicao}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="bairro"
                label="Bairro"
                rules={[{ required: true, message: 'Por favor, informe o bairro' }]}
              >
                <Input placeholder="Nome do bairro" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="semana_epidemiologica"
                label="Semana Epidemiológica"
                rules={[
                  { required: true, message: 'Informe a SE' },
                  { type: 'number', min: 1, max: 53, message: 'SE deve ser entre 1 e 53' }
                ]}
              >
                <InputNumber
                  placeholder="1-53"
                  style={{ width: '100%' }}
                  min={1}
                  max={53}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="notificados"
                label="Casos Notificados"
                rules={[
                  { required: true, message: 'Informe os notificados' },
                  { type: 'number', min: 0, message: 'Deve ser maior ou igual a 0' }
                ]}
              >
                <InputNumber
                  placeholder="0"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="confirmados"
                label="Casos Confirmados"
                rules={[
                  { required: true, message: 'Informe os confirmados' },
                  { type: 'number', min: 0, message: 'Deve ser maior ou igual a 0' }
                ]}
              >
                <InputNumber
                  placeholder="0"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          {registroEditando && (
            <div style={{
              padding: '12px',
              background: '#f0f0f0',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <strong>Registro:</strong> ID {registroEditando.id} · Ano {registroEditando.ano}
              </Text>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}
