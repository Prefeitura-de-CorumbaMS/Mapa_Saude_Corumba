import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Header, Content } = Layout

export default function PublicLayout() {
  return (
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      <Header style={{
        background: '#1F3473', // Azul Escuro da Prefeitura
        color: '#40A1E6', // Azul Claro da Prefeitura
        fontSize: '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        <img src="http://localhost:3001/uploads/logo__horizontal_monocromatica.png" alt="Logo Prefeitura" style={{ height: '40px' }} />
        MAPA DA SAÚDE
        <img src="http://localhost:3001/uploads/arte__horizontal_monocromatica.png" alt="Arte Horizontal" style={{ height: '40px' }} />
      </Header>
      <Content style={{ height: 'calc(100vh - 64px)' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
