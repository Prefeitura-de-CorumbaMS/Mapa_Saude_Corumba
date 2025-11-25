import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Header, Content } = Layout

export default function PublicLayout() {
  return (
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      <Header style={{
        background: '#1890ff',
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center'
      }}>
        SIGLS - Mapa de Saúde de Corumbá
      </Header>
      <Content style={{ height: 'calc(100vh - 64px)' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
