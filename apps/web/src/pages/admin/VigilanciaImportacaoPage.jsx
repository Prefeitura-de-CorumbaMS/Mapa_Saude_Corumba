import { useState } from 'react'
import {
  Card,
  Tabs,
  InputNumber,
  Input,
  Button,
  Table,
  Alert,
  Progress,
  message,
  Modal,
  Typography,
  Divider,
  Space,
  Tag,
} from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  TeamOutlined,
  LineChartOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { parseNotificados, parsePerfil, parseKPIs, validarDados } from '../../utils/vigilanciaParser'
import { useImportarVigilanciaMutation } from '../../store/slices/apiSlice'

const { TextArea } = Input
const { Text, Title } = Typography

export default function VigilanciaImportacaoPage() {
  // Estados
  const [tipo, setTipo] = useState('notificados')
  const [ano, setAno] = useState(2026)
  const [seInicial, setSeInicial] = useState(1)
  const [seFinal, setSeFinal] = useState(10)
  const [dadosBrutos, setDadosBrutos] = useState('')
  const [dadosParsed, setDadosParsed] = useState(null)
  const [validacao, setValidacao] = useState(null)
  const [etapa, setEtapa] = useState('entrada') // 'entrada', 'preview', 'importando', 'concluido'
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 })

  // RTK Query mutation
  const [importarVigilancia, { isLoading: importando }] = useImportarVigilanciaMutation()

  // Handler para analisar dados
  const handleAnalisar = () => {
    try {
      let parsed

      if (tipo === 'notificados') {
        parsed = parseNotificados(dadosBrutos, seInicial, seFinal)
      } else if (tipo === 'perfil') {
        parsed = parsePerfil(dadosBrutos)
      } else if (tipo === 'kpis') {
        parsed = parseKPIs(dadosBrutos)
      }

      // Validar dados parseados
      const validacaoResult = validarDados(parsed, tipo, [])

      setDadosParsed(parsed)
      setValidacao(validacaoResult)
      setEtapa('preview')

      if (validacaoResult.valido) {
        message.success(`${validacaoResult.estatisticas.total} registros parseados com sucesso!`)
      } else {
        message.warning(`Dados parseados, mas há ${validacaoResult.erros.length} erros para corrigir`)
      }

    } catch (error) {
      message.error(`Erro ao parsear dados: ${error.message}`)
      console.error(error)
    }
  }

  // Handler para importar
  const handleImportar = async () => {
    if (!validacao?.valido) {
      Modal.error({
        title: 'Dados inválidos',
        content: 'Corrija os erros antes de importar.',
      })
      return
    }

    try {
      setEtapa('importando')
      setProgresso({ atual: 0, total: dadosParsed.length })

      const result = await importarVigilancia({
        tipo,
        ano,
        dados: dadosParsed,
      }).unwrap()

      setProgresso({ atual: dadosParsed.length, total: dadosParsed.length })
      setEtapa('concluido')

      let mensagemSucesso = 'Importação concluída!'

      if (tipo === 'notificados') {
        mensagemSucesso = `Importação concluída! ${result.semanas_processadas} SEs e ${result.bairros_inseridos} registros de bairro importados.`
      } else if (tipo === 'perfil') {
        mensagemSucesso = `Importação concluída! ${result.perfis_inseridos} registros de perfil importados.`
      } else if (tipo === 'kpis') {
        mensagemSucesso = `Importação concluída! ${result.semanas_atualizadas} SEs atualizadas.`
      }

      message.success(mensagemSucesso)

    } catch (error) {
      setEtapa('preview')
      Modal.error({
        title: 'Erro na importação',
        content: error.data?.error || 'Erro desconhecido ao importar dados',
      })
      console.error(error)
    }
  }

  // Handler para voltar
  const handleVoltar = () => {
    setEtapa('entrada')
    setDadosParsed(null)
    setValidacao(null)
  }

  // Handler para limpar
  const handleLimpar = () => {
    setDadosBrutos('')
    setDadosParsed(null)
    setValidacao(null)
    setEtapa('entrada')
    setProgresso({ atual: 0, total: 0 })
  }

  // Handler para editar célula
  const handleCellEdit = (index, field, value) => {
    const newData = [...dadosParsed]
    newData[index] = { ...newData[index], [field]: value }
    setDadosParsed(newData)

    // Revalidar dados após edição
    const validacaoResult = validarDados(newData, tipo, [])
    setValidacao(validacaoResult)
  }

  // Handler para remover linha
  const handleRemoveRow = (index) => {
    const newData = dadosParsed.filter((_, i) => i !== index)
    setDadosParsed(newData)

    // Revalidar dados após remoção
    const validacaoResult = validarDados(newData, tipo, [])
    setValidacao(validacaoResult)
    message.success('Registro removido')
  }

  // Componente de célula editável
  const EditableCell = ({ value, index, field, isNumber = true }) => {
    const [editing, setEditing] = useState(false)
    const [tempValue, setTempValue] = useState(value)

    const handleSave = () => {
      handleCellEdit(index, field, isNumber ? (tempValue || 0) : tempValue)
      setEditing(false)
    }

    if (editing) {
      return isNumber ? (
        <InputNumber
          value={tempValue}
          onChange={setTempValue}
          onPressEnter={handleSave}
          onBlur={handleSave}
          autoFocus
          min={0}
          style={{ width: '100%' }}
        />
      ) : (
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onPressEnter={handleSave}
          onBlur={handleSave}
          autoFocus
          style={{ width: '100%' }}
        />
      )
    }

    return (
      <div
        onClick={() => {
          setTempValue(value)
          setEditing(true)
        }}
        style={{
          cursor: 'pointer',
          padding: '4px 8px',
          minHeight: '22px',
          borderRadius: '4px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {value ?? '-'}
      </div>
    )
  }

  // Colunas da tabela de preview
  const colunas = {
    notificados: [
      {
        title: 'Bairro',
        dataIndex: 'bairro',
        key: 'bairro',
        width: 200,
        fixed: 'left',
        render: (value, record, index) => (
          <EditableCell value={value} index={index} field="bairro" isNumber={false} />
        ),
      },
      {
        title: 'SE',
        dataIndex: 'se',
        key: 'se',
        width: 80,
        fixed: 'left',
        render: (value, record, index) => (
          <EditableCell value={value} index={index} field="se" />
        ),
      },
      {
        title: 'Notificados',
        dataIndex: 'notificados',
        key: 'notificados',
        width: 120,
        render: (value, record, index) => (
          <EditableCell value={value} index={index} field="notificados" />
        ),
      },
      {
        title: 'Confirmados',
        dataIndex: 'confirmados',
        key: 'confirmados',
        width: 120,
        render: (value, record, index) => (
          <EditableCell value={value} index={index} field="confirmados" />
        ),
      },
      {
        title: 'Descartados',
        dataIndex: 'descartados',
        key: 'descartados',
        width: 120,
        render: (value, record, index) => (
          <EditableCell value={value} index={index} field="descartados" />
        ),
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 80,
        fixed: 'right',
        render: (_, record, index) => (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Remover registro?',
                content: `Deseja remover o registro: ${record.bairro} - SE ${record.se}?`,
                okText: 'Sim, remover',
                cancelText: 'Cancelar',
                okType: 'danger',
                onOk: () => handleRemoveRow(index),
              })
            }}
          />
        ),
      },
    ],
    perfil: [
      { title: 'SE', dataIndex: 'se', key: 'se', width: 80 },
      { title: 'Faixa Etária', dataIndex: 'faixa_etaria', key: 'faixa_etaria', width: 150 },
      { title: 'Sexo', dataIndex: 'sexo', key: 'sexo', width: 80 },
      { title: 'Casos', dataIndex: 'casos', key: 'casos', width: 100 },
    ],
    kpis: [
      { title: 'SE', dataIndex: 'se', key: 'se', width: 80 },
      { title: 'Notificados', dataIndex: 'notificados', key: 'notificados', width: 100 },
      { title: 'Confirmados', dataIndex: 'confirmados', key: 'confirmados', width: 100 },
      { title: 'Tipo 1', dataIndex: 'tipo1', key: 'tipo1', width: 80 },
      { title: 'Tipo 2', dataIndex: 'tipo2', key: 'tipo2', width: 80 },
      { title: 'Tipo 3', dataIndex: 'tipo3', key: 'tipo3', width: 80 },
      { title: 'Tipo 4', dataIndex: 'tipo4', key: 'tipo4', width: 80 },
      { title: 'Isolamentos', dataIndex: 'isolamentos', key: 'isolamentos', width: 100 },
      { title: 'Óbitos', dataIndex: 'obitos', key: 'obitos', width: 80 },
    ],
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <UploadOutlined /> Importar Dados de Vigilância
      </Title>

      <Card>
        {/* ETAPA 1: ENTRADA */}
        {etapa === 'entrada' && (
          <Tabs
            activeKey={tipo}
            onChange={(key) => {
              setTipo(key)
              setDadosBrutos('')
              setDadosParsed(null)
              setValidacao(null)
            }}
            items={[
              {
                key: 'notificados',
                label: (
                  <span>
                    <BarChartOutlined /> Notificados
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                      message="Importar Dados de Notificados"
                      description="Cole aqui a matriz SE × Bairro da aba NOTIFICADOS do Excel. Cada linha deve conter: Bairro, seguido dos valores de notificados, confirmados e descartados para cada SE."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    {/* Seleção de ano e SE */}
                    <div>
                      <Space size="middle">
                        <div>
                          <Text strong>Ano:</Text>
                          <br />
                          <InputNumber
                            min={2020}
                            max={2030}
                            value={ano}
                            onChange={(val) => setAno(val)}
                            style={{ width: 100 }}
                          />
                        </div>
                        <div>
                          <Text strong>SE Inicial:</Text>
                          <br />
                          <InputNumber
                            min={1}
                            max={53}
                            value={seInicial}
                            onChange={(val) => setSeInicial(val)}
                            style={{ width: 100 }}
                          />
                        </div>
                        <div>
                          <Text strong>SE Final:</Text>
                          <br />
                          <InputNumber
                            min={1}
                            max={53}
                            value={seFinal}
                            onChange={(val) => setSeFinal(val)}
                            style={{ width: 100 }}
                          />
                        </div>
                      </Space>
                    </div>

                    <Divider />

                    {/* Área de entrada */}
                    <div>
                      <Text strong>
                        <FileTextOutlined /> Cole os dados aqui (Ctrl+C/Ctrl+V do Excel):
                      </Text>
                      <Alert
                        message="Dica"
                        description="Selecione as células no Excel (incluindo cabeçalhos) e cole diretamente aqui."
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        style={{ marginTop: 8, marginBottom: 12 }}
                      />

                      <TextArea
                        rows={15}
                        value={dadosBrutos}
                        onChange={(e) => setDadosBrutos(e.target.value)}
                        placeholder="Cole aqui os dados copiados do Excel..."
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <Button onClick={handleLimpar}>Limpar</Button>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={handleAnalisar}
                        disabled={!dadosBrutos.trim()}
                      >
                        Analisar Dados
                      </Button>
                    </div>
                  </Space>
                ),
              },
              {
                key: 'perfil',
                label: (
                  <span>
                    <TeamOutlined /> Perfil Demográfico
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                      message="Importar Perfil Demográfico"
                      description="Cole aqui os dados de faixa etária e sexo. Cada linha deve conter: SE, Faixa Etária, Sexo, Casos."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    {/* Seleção de ano */}
                    <div>
                      <Text strong>Ano:</Text>
                      <br />
                      <InputNumber
                        min={2020}
                        max={2030}
                        value={ano}
                        onChange={(val) => setAno(val)}
                        style={{ width: 100 }}
                      />
                    </div>

                    <Divider />

                    {/* Área de entrada */}
                    <div>
                      <Text strong>
                        <FileTextOutlined /> Cole os dados aqui (Ctrl+C/Ctrl+V do Excel):
                      </Text>
                      <Alert
                        message="Dica"
                        description="Selecione as células no Excel (incluindo cabeçalhos) e cole diretamente aqui."
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        style={{ marginTop: 8, marginBottom: 12 }}
                      />

                      <TextArea
                        rows={15}
                        value={dadosBrutos}
                        onChange={(e) => setDadosBrutos(e.target.value)}
                        placeholder="Cole aqui os dados copiados do Excel..."
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <Button onClick={handleLimpar}>Limpar</Button>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={handleAnalisar}
                        disabled={!dadosBrutos.trim()}
                      >
                        Analisar Dados
                      </Button>
                    </div>
                  </Space>
                ),
              },
              {
                key: 'kpis',
                label: (
                  <span>
                    <LineChartOutlined /> KPIs da SE
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                      message="Importar KPIs da SE"
                      description="Cole aqui os KPIs de cada SE. Cada linha deve conter: SE, Notificados, Confirmados, Tipo 1, Tipo 2, Tipo 3, Tipo 4, Isolamentos, Óbitos."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    {/* Seleção de ano */}
                    <div>
                      <Text strong>Ano:</Text>
                      <br />
                      <InputNumber
                        min={2020}
                        max={2030}
                        value={ano}
                        onChange={(val) => setAno(val)}
                        style={{ width: 100 }}
                      />
                    </div>

                    <Divider />

                    {/* Área de entrada */}
                    <div>
                      <Text strong>
                        <FileTextOutlined /> Cole os dados aqui (Ctrl+C/Ctrl+V do Excel):
                      </Text>
                      <Alert
                        message="Dica"
                        description="Selecione as células no Excel (incluindo cabeçalhos) e cole diretamente aqui."
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        style={{ marginTop: 8, marginBottom: 12 }}
                      />

                      <TextArea
                        rows={15}
                        value={dadosBrutos}
                        onChange={(e) => setDadosBrutos(e.target.value)}
                        placeholder="Cole aqui os dados copiados do Excel..."
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <Button onClick={handleLimpar}>Limpar</Button>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={handleAnalisar}
                        disabled={!dadosBrutos.trim()}
                      >
                        Analisar Dados
                      </Button>
                    </div>
                  </Space>
                ),
              },
            ]}
          />
        )}

        {/* ETAPA 2: PREVIEW */}
        {etapa === 'preview' && dadosParsed && validacao && (
          <>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Estatísticas */}
              <div>
                <Title level={4}>📊 Preview dos Dados</Title>

                <Space wrap style={{ marginBottom: 16 }}>
                  <Tag color="blue" icon={<CheckCircleOutlined />}>
                    {validacao.estatisticas.total} registros
                  </Tag>
                  {validacao.estatisticas.sesUnicas && (
                    <Tag color="cyan">
                      {validacao.estatisticas.sesUnicas} SEs únicas
                    </Tag>
                  )}
                  {validacao.estatisticas.bairrosUnicos && (
                    <Tag color="purple">
                      {validacao.estatisticas.bairrosUnicos} bairros únicos
                    </Tag>
                  )}
                </Space>

                {/* Resumo por SE para notificados */}
                {tipo === 'notificados' && dadosParsed && dadosParsed.length > 0 && (
                  <Card size="small" style={{ marginTop: 16, marginBottom: 16 }} title="📈 Resumo por Semana Epidemiológica">
                    <Space wrap>
                      {(() => {
                        const resumoPorSE = {}
                        dadosParsed.forEach(item => {
                          if (!resumoPorSE[item.se]) {
                            resumoPorSE[item.se] = { notificados: 0, confirmados: 0, descartados: 0 }
                          }
                          resumoPorSE[item.se].notificados += item.notificados || 0
                          resumoPorSE[item.se].confirmados += item.confirmados || 0
                          resumoPorSE[item.se].descartados += item.descartados || 0
                        })
                        return Object.entries(resumoPorSE)
                          .sort((a, b) => Number(a[0]) - Number(b[0]))
                          .map(([se, totais]) => (
                            <Card key={se} size="small" style={{ minWidth: 200 }}>
                              <Text strong>SE {se}</Text>
                              <div style={{ fontSize: '12px', marginTop: 8 }}>
                                <div>📊 Notif: <Text strong>{totais.notificados}</Text></div>
                                <div>✅ Conf: <Text strong>{totais.confirmados}</Text></div>
                                <div>❌ Desc: <Text strong>{totais.descartados}</Text></div>
                              </div>
                            </Card>
                          ))
                      })()}
                    </Space>
                  </Card>
                )}

                {/* Erros */}
                {validacao.erros.length > 0 && (
                  <Alert
                    message="Erros encontrados"
                    description={
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validacao.erros.map((erro, idx) => (
                          <li key={idx}>{erro}</li>
                        ))}
                      </ul>
                    }
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                {/* Avisos */}
                {validacao.avisos.length > 0 && (
                  <Alert
                    message="Avisos"
                    description={
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validacao.avisos.map((aviso, idx) => (
                          <li key={idx}>{aviso}</li>
                        ))}
                      </ul>
                    }
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: 16 }}
                  />
                )}
              </div>

              {/* Info sobre edição */}
              {tipo === 'notificados' && (
                <Alert
                  message="✏️ Tabela Editável - Faça correções antes de importar"
                  description={
                    <div>
                      <p style={{ margin: '8px 0' }}>
                        <strong>Clique em qualquer célula</strong> para editar os valores:
                      </p>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        <li><strong>Bairro:</strong> Clique para corrigir o nome</li>
                        <li><strong>SE:</strong> Clique para corrigir a semana epidemiológica</li>
                        <li><strong>Valores numéricos:</strong> Clique para ajustar notificados, confirmados ou descartados</li>
                        <li><strong>Remover:</strong> Use o botão 🗑️ para excluir registros incorretos</li>
                      </ul>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                        💡 As alterações são salvas automaticamente e os totais são recalculados.
                      </p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Tabela de preview */}
              <Table
                dataSource={dadosParsed}
                columns={colunas[tipo]}
                rowKey={(record, index) => `${record.bairro || ''}-${record.se || index}-${index}`}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Total: ${total} registros`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                scroll={{ x: 'max-content', y: 500 }}
                size="small"
                bordered
                summary={() => {
                  if (tipo === 'notificados' && dadosParsed.length > 0) {
                    const totalNotif = dadosParsed.reduce((sum, item) => sum + (item.notificados || 0), 0)
                    const totalConf = dadosParsed.reduce((sum, item) => sum + (item.confirmados || 0), 0)
                    const totalDesc = dadosParsed.reduce((sum, item) => sum + (item.descartados || 0), 0)

                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                          <Table.Summary.Cell index={0} colSpan={2}>
                            <Text strong>TOTAL GERAL</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <Text strong style={{ color: '#1890ff' }}>{totalNotif}</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <Text strong style={{ color: '#52c41a' }}>{totalConf}</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <Text strong style={{ color: '#ff4d4f' }}>{totalDesc}</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} />
                        </Table.Summary.Row>
                      </Table.Summary>
                    )
                  }
                  return null
                }}
              />

              {/* Botões */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <Button onClick={handleVoltar}>← Voltar</Button>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleImportar}
                  disabled={!validacao.valido}
                  loading={importando}
                >
                  Importar Dados
                </Button>
              </div>
            </Space>
          </>
        )}

        {/* ETAPA 3: IMPORTANDO */}
        {etapa === 'importando' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4}>🔄 Importando dados...</Title>
            <Progress
              percent={progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0}
              status="active"
              style={{ maxWidth: 500, margin: '0 auto' }}
            />
            <Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
              Processando {progresso.atual}/{progresso.total} registros
            </Text>
          </div>
        )}

        {/* ETAPA 4: CONCLUÍDO */}
        {etapa === 'concluido' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={3}>Importação Concluída com Sucesso!</Title>
            <Text type="secondary">
              Os dados foram importados e o dashboard foi atualizado.
            </Text>
            <div style={{ marginTop: 24 }}>
              <Button type="primary" onClick={handleLimpar}>
                Nova Importação
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
