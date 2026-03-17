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
        padding: isMobile ? '6px 8px' : '0 40px',
        height: isMobile ? '56px' : '64px',
        lineHeight: isMobile ? 'normal' : '64px',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'row',
          alignItems: 'center',
          gap: isMobile ? '6px' : '20px',
          justifyContent: isMobile ? 'flex-start' : 'flex-start',
          minWidth: 0,
          flex: isMobile ? '0 0 auto' : 'initial',
        }}>
          <a
            href="https://corumba.ms.gov.br/"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <img
              src="/uploads/logo__horizontal_monocromatica.png"
              alt="Logo Prefeitura"
              style={{
                height: isMobile ? '22px' : '40px',
                maxWidth: isMobile ? '70px' : 'none',
                objectFit: 'contain',
                transition: 'opacity 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            />
          </a>
          {!isMobile && (
            <a
              href="https://corumba.esaude.genesiscloud.tec.br/publico/saude-transparente"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <img
                src="/uploads/icones/img_saude_transparente.svg"
                alt="Saúde Transparente"
                style={{
                  height: '40px',
                  objectFit: 'contain',
                  transition: 'opacity 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              />
            </a>
          )}
        </div>
        <span style={{
          color: 'white',
          fontSize: isMobile ? '11px' : '20px',
          whiteSpace: 'nowrap',
          flex: isMobile ? '1' : 'initial',
          textAlign: 'center',
          margin: isMobile ? '0 6px' : '0',
          lineHeight: isMobile ? '1.2' : 'normal',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          MAPA DA SAÚDE
        </span>
        {isMobile ? (
          <a
            href="https://corumba.esaude.genesiscloud.tec.br/publico/saude-transparente"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <img
              src="/uploads/icones/img_saude_transparente.svg"
              alt="Saúde Transparente"
              style={{
                height: '32px',
                maxWidth: '80px',
                objectFit: 'contain',
                flex: '0 0 auto',
              }}
            />
          </a>
        ) : (
          <img
            src="/uploads/arte__horizontal_monocromatica.png"
            alt="Arte Horizontal"
            style={{
              height: '60px',
              objectFit: 'contain',
            }}
          />
        )}
      </Header>
      <Content style={{ height: isMobile ? 'calc(100vh - 56px)' : 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
