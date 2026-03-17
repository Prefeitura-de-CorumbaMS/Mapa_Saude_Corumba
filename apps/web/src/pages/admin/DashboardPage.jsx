import { Card, Row, Col, Statistic, Table, Tag, Typography, Skeleton, Tooltip, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  EnvironmentOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  DatabaseOutlined,
  PictureOutlined,
  CompassOutlined,
  EyeOutlined,
  UserOutlined,
  SearchOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import {
  useGetUnidadesQuery,
  useGetMedicosQuery,
  useGetEspecialidadesQuery,
  useGetBairrosQuery,
  useGetIconesQuery,
  useGetStagingQuery,
  useGetLastUpdateQuery,
  useGetAnalyticsStatsQuery,
  useGetAuditLogsQuery,
} from '../../store/slices/apiSlice'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const { Title, Text } = Typography

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const OPERACAO_MAP = { INSERT: ['Criado', 'green'], UPDATE: ['Atualizado', 'blue'], DELETE: ['Excluído', 'red'] }
const TABELA_MAP = {
  PROD_Unidade_Saude: 'Unidade',
  PROD_Medico: 'Médico',
  PROD_Especialidade: 'Especialidade',
  PROD_Bairro: 'Bairro',
  PROD_Icone: 'Ícone',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const isSuperadmin = user?.role === 'superadmin'

  const { data: unidadesData,     isLoading: lUnidades      } = useGetUnidadesQuery({ limit: 1 })
  const { data: medicosData,      isLoading: lMedicos       } = useGetMedicosQuery({ limit: 1 })
  const { data: especialidades,   isLoading: lEspecialidades} = useGetEspecialidadesQuery()
  const { data: bairrosData,      isLoading: lBairros       } = useGetBairrosQuery({ ativo: true })
  const { data: iconesData,       isLoading: lIcones        } = useGetIconesQuery({ ativo: true })
  const { data: stagingData,      isLoading: lStaging       } = useGetStagingQuery({ status: 'pendente', limit: 1 })
  const { data: lastUpdateData                               } = useGetLastUpdateQuery()
  const { data: analyticsData,    isLoading: lAnalytics     } = useGetAnalyticsStatsQuery()
  const { data: auditData,        isLoading: lAudit         } = useGetAuditLogsQuery({ limit: 8 }, { skip: !isSuperadmin })

  const stats = analyticsData?.data
  const stagingPendente = stagingData?.pagination?.total ?? 0

  // ── Cards de cadastro ──────────────────────────────────────────────────────
  const cadastros = [
    {
      title: 'Unidades de Saúde',
      value: unidadesData?.pagination?.total ?? 0,
      icon: <EnvironmentOutlined />,
      color: '#1890ff',
      loading: lUnidades,
      link: '/admin/unidades',
    },
    {
      title: 'Médicos',
      value: medicosData?.pagination?.total ?? 0,
      icon: <MedicineBoxOutlined />,
      color: '#52c41a',
      loading: lMedicos,
      link: '/admin/medicos',
    },
    {
      title: 'Especialidades',
      value: especialidades?.data?.length ?? 0,
      icon: <TeamOutlined />,
      color: '#722ed1',
      loading: lEspecialidades,
      link: '/admin/especialidades',
    },
    {
      title: 'Bairros',
      value: bairrosData?.data?.length ?? 0,
      icon: <CompassOutlined />,
      color: '#fa8c16',
      loading: lBairros,
      link: '/admin/bairros',
    },
    {
      title: 'Ícones',
      value: iconesData?.data?.length ?? 0,
      icon: <PictureOutlined />,
      color: '#13c2c2',
      loading: lIcones,
      link: '/admin/icones',
    },
    {
      title: 'Staging Pendente',
      value: stagingPendente,
      icon: stagingPendente > 0 ? <WarningOutlined /> : <CheckCircleOutlined />,
      color: stagingPendente > 0 ? '#ff4d4f' : '#8c8c8c',
      loading: lStaging,
      link: '/admin/staging',
    },
  ]

  // ── Colunas tabela auditoria ───────────────────────────────────────────────
  const auditCols = [
    {
      title: 'Tabela',
      dataIndex: 'tabela',
      key: 'tabela',
      width: 110,
      render: (t) => TABELA_MAP[t] || t,
    },
    {
      title: 'Ação',
      dataIndex: 'operacao',
      key: 'operacao',
      width: 105,
      render: (op) => {
        const [label, color] = OPERACAO_MAP[op] || [op, 'default']
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: 'Usuário',
      key: 'user',
      width: 110,
      render: (_, r) => r.user?.username || <Text type="secondary">sistema</Text>,
    },
    {
      title: 'Quando',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts) => (
        <Tooltip title={dayjs(ts).format('DD/MM/YYYY HH:mm:ss')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(ts).fromNow()}</Text>
        </Tooltip>
      ),
    },
  ]

  // ── Colunas tabela top unidades ────────────────────────────────────────────
  const unidadesCols = [
    {
      title: '#',
      key: 'rank',
      width: 36,
      render: (_, __, i) => (
        <Text style={{ color: i < 3 ? '#faad14' : '#bfbfbf', fontWeight: 600 }}>{i + 1}</Text>
      ),
    },
    {
      title: 'Unidade',
      dataIndex: 'unidade_nome',
      key: 'unidade_nome',
      ellipsis: true,
    },
    {
      title: 'Visitas',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      width: 70,
      render: (v) => <Text strong>{v}</Text>,
    },
  ]

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
          {getGreeting()}, {user?.username || 'Admin'}!
        </Title>
        <Text type="secondary">
          {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
          {lastUpdateData?.data?.lastUpdate && (
            <>
              {' · '}Dados atualizados{' '}
              <Tooltip title={dayjs(lastUpdateData.data.lastUpdate).format('DD/MM/YYYY HH:mm')}>
                <Text type="secondary">{dayjs(lastUpdateData.data.lastUpdate).fromNow()}</Text>
              </Tooltip>
            </>
          )}
        </Text>
      </div>

      {/* ── Cadastros ─────────────────────────────────────────────────────── */}
      <Text style={{ fontSize: 11, letterSpacing: 1, fontWeight: 600, color: '#8c8c8c' }}>
        CADASTROS
      </Text>
      <Row gutter={[14, 14]} style={{ marginTop: 8, marginBottom: 28 }}>
        {cadastros.map((item) => (
          <Col xs={12} sm={8} md={4} key={item.title}>
            <Card
              hoverable
              onClick={() => navigate(item.link)}
              style={{ cursor: 'pointer' }}
              styles={{ body: { padding: '16px 18px' } }}
            >
              {item.loading ? (
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              ) : (
                <Statistic
                  title={<span style={{ fontSize: 12 }}>{item.title}</span>}
                  value={item.value}
                  prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                  valueStyle={{ fontSize: 26, fontWeight: 700 }}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Analytics ─────────────────────────────────────────────────────── */}
      <Text style={{ fontSize: 11, letterSpacing: 1, fontWeight: 600, color: '#8c8c8c' }}>
        ANALYTICS DO MAPA PÚBLICO
      </Text>
      <Row gutter={[14, 14]} style={{ marginTop: 8, marginBottom: 28 }}>
        {[
          { title: 'Visitas Hoje',             value: stats?.visitas?.hoje,            icon: <EyeOutlined />,    color: '#1890ff' },
          { title: 'Visitas Este Mês',          value: stats?.visitas?.mes,             icon: <EyeOutlined />,    color: '#52c41a' },
          { title: 'Visitantes Únicos (mês)',   value: stats?.visitantes_unicos?.mes,   icon: <UserOutlined />,   color: '#722ed1' },
          { title: 'Buscas Realizadas (mês)',   value: stats?.buscas?.mes,              icon: <SearchOutlined />, color: '#fa8c16' },
        ].map((item) => (
          <Col xs={12} sm={12} md={6} key={item.title}>
            <Card styles={{ body: { padding: '16px 18px' } }}>
              {lAnalytics ? (
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              ) : (
                <Statistic
                  title={<span style={{ fontSize: 12 }}>{item.title}</span>}
                  value={item.value ?? '—'}
                  prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                  valueStyle={{ fontSize: 26, fontWeight: 700 }}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Tabelas ───────────────────────────────────────────────────────── */}
      <Row gutter={[14, 14]}>

        {/* Top 5 unidades */}
        <Col xs={24} lg={isSuperadmin ? 12 : 24}>
          <Card
            title={<span><EnvironmentOutlined style={{ marginRight: 6 }} />Top 5 Unidades Mais Acessadas (mês)</span>}
            extra={<Button type="link" size="small" onClick={() => navigate('/admin/analytics')}>Ver mais <RightOutlined /></Button>}
            styles={{ body: { padding: '0 0 4px' } }}
          >
            <Table
              columns={unidadesCols}
              dataSource={(stats?.unidades_top || []).slice(0, 5)}
              rowKey={(r) => r.unidade_id ?? r.unidade_nome}
              pagination={false}
              size="small"
              loading={lAnalytics}
              locale={{ emptyText: 'Nenhum acesso registrado ainda' }}
            />
          </Card>
        </Col>

        {/* Atividade recente — somente superadmin */}
        {isSuperadmin && (
          <Col xs={24} lg={12}>
            <Card
              title={<span><ClockCircleOutlined style={{ marginRight: 6 }} />Atividade Recente</span>}
              extra={<Button type="link" size="small" onClick={() => navigate('/admin/audit')}>Ver tudo <RightOutlined /></Button>}
              styles={{ body: { padding: '0 0 4px' } }}
            >
              <Table
                columns={auditCols}
                dataSource={auditData?.data || []}
                rowKey="id"
                pagination={false}
                size="small"
                loading={lAudit}
                locale={{ emptyText: 'Sem atividade recente' }}
              />
            </Card>
          </Col>
        )}

      </Row>
    </div>
  )
}

