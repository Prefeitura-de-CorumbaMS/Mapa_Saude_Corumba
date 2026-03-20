import { useState } from 'react'
import {
  Card,
  Radio,
  Select,
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

  // Colunas da tabela de preview
  const colunas = {
    notificados: [
      { title: 'Bairro', dataIndex: 'bairro', key: 'bairro', width: 200 },
      { title: 'SE', dataIndex: 'se', key: 'se', width: 80 },
      { title: 'Notificados', dataIndex: 'notificados', key: 'notificados', width: 120 },
      { title: 'Confirmados', dataIndex: 'confirmados', key: 'confirmados', width: 120 },
      { title: 'Descartados', dataIndex: 'descartados', key: 'descartados', width: 120 },
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
          <>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Seleção de tipo */}
              <div>
                <Text strong>Tipo de Dados:</Text>
                <Radio.Group
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  style={{ marginTop: 8, display: 'block' }}
                >
                  <Space direction="vertical">
                    <Radio value="notificados">
                      <Text>NOTIFICADOS</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        (Aba NOTIFICADOS - Matriz SE × Bairro)
                      </Text>
                    </Radio>
                    <Radio value="perfil">
                      <Text>PERFIL DEMOGRÁFICO</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        (Faixa etária e sexo)
                      </Text>
                    </Radio>
                    <Radio value="kpis">
                      <Text>KPIs da SE</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        (Sorotipos, óbitos, isolamentos)
                      </Text>
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

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

                  {tipo === 'notificados' && (
                    <>
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
                    </>
                  )}
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
                  description="Selecione as células no Excel (incluindo cabeçalhos) e cole diretamente aqui. Use Ctrl+C para copiar e Ctrl+V para colar."
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
          </>
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

              {/* Tabela de preview */}
              <Table
                dataSource={dadosParsed.slice(0, 100)}
                columns={colunas[tipo]}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
                size="small"
                bordered
              />

              {dadosParsed.length > 100 && (
                <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                  Mostrando primeiros 100 registros de {dadosParsed.length}
                </Text>
              )}

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
