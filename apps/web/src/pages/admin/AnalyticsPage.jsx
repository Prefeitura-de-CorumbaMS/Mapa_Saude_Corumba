import { Card, Row, Col, Statistic, Table, Typography, Spin, Alert } from 'antd'
import {
  EyeOutlined,
  UserOutlined,
  SearchOutlined,
  PictureOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useGetAnalyticsStatsQuery } from '../../store/slices/apiSlice'

const { Title, Text } = Typography

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAnalyticsStatsQuery(undefined, {
    pollingInterval: 60000, // Atualiza automaticamente a cada 60 segundos
  })

  const stats = data?.data

  if (isError) {
    return (
      <Alert
        type="error"
        message="Erro ao carregar dados de analytics"
        description="Verifique se o servidor está ativo e tente novamente."
        showIcon
      />
    )
  }

  const colunasUnidades = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <Text strong style={{ color: index < 3 ? '#faad14' : '#999' }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: 'Unidade de Saúde',
      dataIndex: 'unidade_nome',
      key: 'unidade_nome',
      ellipsis: true,
    },
    {
      title: 'Visualizações (mês)',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      width: 180,
      render: (val) => <Text strong>{val}</Text>,
    },
  ]

  const colunasBuscas = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      render: (_, __, index) => (
        <Text strong style={{ color: index < 3 ? '#faad14' : '#999' }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: 'Termo buscado',
      dataIndex: 'termo',
      key: 'termo',
      ellipsis: true,
    },
    {
      title: 'Buscas (mês)',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      width: 150,
      render: (val) => <Text strong>{val}</Text>,
    },
  ]

  return (
    <Spin spinning={isLoading}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Analytics</Title>
        <Text
          type="secondary"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={refetch}
        >
          <ReloadOutlined spin={isFetching} />
          {isFetching ? 'Atualizando...' : 'Atualiza a cada 60s'}
        </Text>
      </div>

      {/* ─── Visitas ─── */}
      <Title level={5} style={{ marginBottom: 12, color: '#8c8c8c', fontWeight: 400 }}>
        ACESSOS AO MAPA
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Visitas Hoje"
              value={stats?.visitas?.hoje ?? '—'}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Visitas Este Mês"
              value={stats?.visitas?.mes ?? '—'}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Visitas Este Ano"
              value={stats?.visitas?.ano ?? '—'}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Visitantes Únicos (mês)"
              value={stats?.visitantes_unicos?.mes ?? '—'}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Engajamento ─── */}
      <Title level={5} style={{ marginBottom: 12, color: '#8c8c8c', fontWeight: 400 }}>
        ENGAJAMENTO
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Buscas Realizadas Hoje"
              value={stats?.buscas?.hoje ?? '—'}
              prefix={<SearchOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Buscas Este Mês"
              value={stats?.buscas?.mes ?? '—'}
              prefix={<SearchOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Legenda Aberta Hoje"
              value={stats?.legenda?.hoje ?? '—'}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Legenda Aberta (mês)"
              value={stats?.legenda?.mes ?? '—'}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ─── Tabelas ─── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                Top 10 Unidades Mais Acessadas (mês)
              </span>
            }
          >
            <Table
              columns={colunasUnidades}
              dataSource={stats?.unidades_top || []}
              rowKey={(r) => r.unidade_id || r.unidade_nome}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Nenhum dado ainda' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <SearchOutlined style={{ marginRight: 8 }} />
                Top 10 Termos Mais Buscados (mês)
              </span>
            }
          >
            <Table
              columns={colunasBuscas}
              dataSource={stats?.buscas?.top || []}
              rowKey={(r) => r.termo}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Nenhum dado ainda' }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}
