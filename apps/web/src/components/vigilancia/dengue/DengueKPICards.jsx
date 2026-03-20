import { Card, Row, Col, Badge } from 'antd';
import CountUp from 'react-countup';
import {
  FileTextOutlined,
  ExperimentOutlined,
  DotChartOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

export default function DengueKPICards({ data }) {
  if (!data) return null;

  const seFormatada = String(data.semana_epidemiologica).padStart(2, '0');
  const sublabelAcumulado = `Total até a SE ${seFormatada}`;

  const cards = [
    {
      icon: <FileTextOutlined style={{ fontSize: '32px' }} />,
      label: 'CASOS NOTIFICADOS',
      sublabel: sublabelAcumulado,
      labelStyle: { textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' },
      value: data.kpis.casos_notificados,
      color: '#1F3473',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
    },
    {
      icon: <ExperimentOutlined style={{ fontSize: '32px' }} />,
      label: 'CASOS CONFIRMADOS',
      sublabel: sublabelAcumulado,
      labelStyle: { textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' },
      value: data.kpis.casos_confirmados,
      color: '#F97316',
      bgColor: '#FFF7ED',
      borderColor: '#FED7AA',
    },
    {
      icon: <DotChartOutlined style={{ fontSize: '32px' }} />,
      label: 'SOROTIPO TIPO-3',
      sublabel: sublabelAcumulado,
      labelStyle: { textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' },
      value: data.kpis.sorotipo_tipo3,
      color: '#9333EA',
      bgColor: '#FAF5FF',
      borderColor: '#E9D5FF',
    },
    {
      icon: <MedicineBoxOutlined style={{ fontSize: '32px' }} />,
      label: 'ISOLAMENTO VIRAL',
      sublabel: sublabelAcumulado,
      labelStyle: { textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' },
      value: data.kpis.isolamentos_virais,
      color: '#14B8A6',
      bgColor: '#F0FDFA',
      borderColor: '#99F6E4',
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '32px' }} />,
      label: 'ÓBITOS',
      sublabel: data.kpis.obitos === 0 ? 'Nenhum registrado' : sublabelAcumulado,
      labelStyle: { textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' },
      value: data.kpis.obitos,
      color: '#16A34A',
      bgColor: '#F0FDF4',
      borderColor: '#BBF7D0',
    },
  ];

  return (
    <Row gutter={[16, 16]} justify="center" style={{ margin: '0 8px 24px 8px' }}>
      {cards.map((card, index) => (
        <Col xs={24} sm={12} md={12} lg={Math.floor(24 / 5)} xl={Math.floor(24 / 5)} key={index}>
          <Badge.Ribbon
            text={`SE ${data.semana_epidemiologica.toString().padStart(2, '0')}`}
            color={card.color}
            style={{ fontSize: '10px', fontWeight: '600' }}
          >
            <Card
              style={{
                border: `2px solid ${card.borderColor}`,
                borderRadius: '12px',
                backgroundColor: card.bgColor,
                height: '180px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
              styles={{
                body: {
                  padding: '20px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }
              }}
            >
              <div style={{
                color: card.color,
                opacity: 0.7,
                marginBottom: '12px',
              }}>
                {card.icon}
              </div>

              <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: card.color,
                  lineHeight: 1,
                  marginBottom: '8px',
                }}>
                  <CountUp
                    end={card.value}
                    duration={2.5}
                    separator=""
                    useEasing={true}
                  />
                </div>

                <div style={{
                  ...card.labelStyle,
                  color: card.color,
                  marginBottom: '4px',
                }}>
                  {card.label}
                </div>

                <div style={{
                  fontSize: '10px',
                  color: '#6B7280',
                  minHeight: '14px',
                }}>
                  {card.sublabel || ''}
                </div>
              </div>
            </Card>
          </Badge.Ribbon>
        </Col>
      ))}
    </Row>
  );
}
