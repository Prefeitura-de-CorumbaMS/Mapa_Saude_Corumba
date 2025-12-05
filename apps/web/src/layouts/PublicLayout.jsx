import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import { useState, useEffect } from 'react'

const { Header, Content } = Layout

export default function PublicLayout() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Layout style={{ minHeight: '100vh', height: '100vh' }}>
      <Header style={{
        background: '#1F3473',
        color: '#40A1E6',
        fontSize: isMobile ? '14px' : '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 40px',
        height: isMobile ? '56px' : '64px',
        lineHeight: isMobile ? '56px' : '64px',
      }}>
        <img 
          src="http://localhost:3001/uploads/logo__horizontal_monocromatica.png" 
          alt="Logo Prefeitura" 
          style={{ 
            height: isMobile ? '28px' : '40px',
            maxWidth: isMobile ? '80px' : 'none',
            objectFit: 'contain'
          }} 
        />
        <span style={{ 
          color: 'white',
          fontSize: isMobile ? '12px' : '20px',
          whiteSpace: 'nowrap',
          flex: isMobile ? 1 : 'initial',
          textAlign: 'center',
          margin: isMobile ? '0 8px' : '0'
        }}>
          MAPA DA SAÚDE
        </span>
        <img 
          src="http://localhost:3001/uploads/arte__horizontal_monocromatica.png" 
          alt="Arte Horizontal" 
          style={{ 
            height: isMobile ? '40px' : '60px',
            maxWidth: isMobile ? '80px' : 'none',
            objectFit: 'contain'
          }} 
        />
      </Header>
      <Content style={{ height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
