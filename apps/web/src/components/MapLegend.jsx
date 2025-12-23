import { useState, useEffect, useMemo, useRef } from 'react'
import { Card } from 'antd'
import { PictureOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'

// Helper para obter URL completa da imagem
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // Em desenvolvimento, usar proxy do Vite (paths relativos)
  // Em produção, VITE_API_URL terá o domínio completo
  const apiBaseUrl = ''
  return `${apiBaseUrl}${url}`
}

// Hook para detectar se é mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export default function MapLegend({ iconesData, onIconClick, selectedIconUrl, unidades }) {
  const isMobile = useIsMobile()
  const [isExpanded, setIsExpanded] = useState(false)
  const legendRef = useRef(null)

  // Detectar cliques fora da legenda para recolhê-la
  useEffect(() => {
    if (!isMobile || !isExpanded) return

    const handleClickOutside = (event) => {
      if (legendRef.current && !legendRef.current.contains(event.target)) {
        setIsExpanded(false)
      }
    }

    // Adicionar listener após um pequeno delay para evitar fechar imediatamente ao abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMobile, isExpanded])

  const handleIconClick = (iconeUrl) => {
    if (onIconClick) {
      onIconClick(iconeUrl)
      // Recolher legenda no mobile após clicar
      if (isMobile) {
        setIsExpanded(false)
      }
    }
  }

  // Mostrar apenas os ícones que estão sendo usados pelas unidades
  const iconesEmUso = useMemo(() => {
    if (!iconesData?.data || !Array.isArray(iconesData.data)) return []
    if (!unidades || !Array.isArray(unidades)) return []

    // Coletar URLs de ícones únicos das unidades
    const iconesUsados = new Set(
      unidades
        .map(u => u.icone_url)
        .filter(url => url && url.trim() !== '')
    )

    // Filtrar apenas os ícones que estão sendo usados e ordenar por ordem
    return iconesData.data
      .filter(icone => iconesUsados.has(icone.url))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  }, [iconesData, unidades])

  // Se não houver ícones, não renderizar a legenda
  if (!iconesEmUso || iconesEmUso.length === 0) return null

  // No mobile, renderizar versão compacta
  if (isMobile) {
    return (
      <div
        ref={legendRef}
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 400,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'white',
          maxWidth: 'calc(100vw - 20px)',
        }}
      >
        {/* Header sempre visível */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            cursor: 'pointer',
            backgroundColor: '#fafafa',
            borderBottom: isExpanded ? '1px solid #f0f0f0' : 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <PictureOutlined style={{ fontSize: '16px' }} />
            <span>Legenda</span>
          </div>
          {isExpanded ? (
            <UpOutlined style={{ fontSize: '12px', color: '#999' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px', color: '#999' }} />
          )}
        </div>

        {/* Conteúdo expansível */}
        {isExpanded && (
          <div style={{ 
            padding: '12px 16px',
            maxHeight: 'calc(100vh - 120px)', // Altura máxima considerando header e margens
            overflowY: 'auto', // Barra de rolagem vertical
            overflowX: 'hidden',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {iconesEmUso.map(icone => {
                const isSelected = selectedIconUrl === icone.url
                return (
                  <div
                    key={icone.id}
                    onClick={() => handleIconClick(icone.url)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                      border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={getFullImageUrl(icone.url)}
                      alt={icone.nome}
                      style={{
                        width: '24px',
                        height: '36px',
                        objectFit: 'contain',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#333', fontWeight: isSelected ? 600 : 400 }}>
                      {icone.nome}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop: versão sempre expandida (comportamento original)
  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PictureOutlined />
          <span>Legenda</span>
        </div>
      }
      size="small"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 400,
        minWidth: '200px',
        maxWidth: '240px',
        maxHeight: 'calc(100vh - 100px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      styles={{
        body: {
          padding: '12px',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {iconesEmUso.map(icone => {
          const isSelected = selectedIconUrl === icone.url
          return (
            <div
              key={icone.id}
              onClick={() => handleIconClick(icone.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <img
                src={getFullImageUrl(icone.url)}
                alt={icone.nome}
                style={{
                  width: '24px',
                  height: '36px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: '#333', fontWeight: isSelected ? 600 : 400 }}>
                {icone.nome}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
