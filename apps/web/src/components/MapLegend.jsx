import { useMemo } from 'react'
import { Card } from 'antd'
import { PictureOutlined } from '@ant-design/icons'

// Helper para obter URL completa da imagem
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
  return `${apiBaseUrl}${url}`
}

export default function MapLegend({ unidades, iconesData }) {
  // Extrair ícones únicos que estão sendo usados pelas unidades
  const iconesEmUso = useMemo(() => {
    if (!unidades || !iconesData?.data) return []

    // Obter URLs únicas de ícones das unidades
    const iconesUsados = new Set(
      unidades
        .filter(u => u.icone_url && u.icone_url.trim() !== '')
        .map(u => u.icone_url)
    )

    // Filtrar apenas os ícones que estão sendo usados
    const iconesOrdenados = iconesData.data
      .filter(icone => iconesUsados.has(icone.url))
      .sort((a, b) => a.ordem - b.ordem)

    return iconesOrdenados
  }, [unidades, iconesData])

  // Se não houver ícones em uso, não renderizar a legenda
  if (iconesEmUso.length === 0) return null

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
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        minWidth: '180px',
        maxWidth: '220px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      bodyStyle={{
        padding: '12px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {iconesEmUso.map(icone => (
          <div
            key={icone.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
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
            <span style={{ fontSize: '13px', color: '#333' }}>
              {icone.nome}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
