import { Card, Row, Col } from 'antd';
import { Bar, Line } from 'react-chartjs-2';

export default function DengueSerieHistorica({ serieData }) {
  if (!serieData || serieData.length === 0) return null;

  const labels = serieData.map(item => `SE ${item.semana}`);
  const notificados = serieData.map(item => item.notificados);
  const confirmados = serieData.map(item => item.confirmados);

  const opcoesBase = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
      },
    },
  };

  const dadosNotificados = {
    labels,
    datasets: [{
      label: 'Notificados',
      data: notificados,
      backgroundColor: '#F59E0B',
      borderRadius: 6,
    }],
  };

  const dadosConfirmados = {
    labels,
    datasets: [{
      label: 'Confirmados',
      data: confirmados,
      backgroundColor: '#DC2626',
      borderRadius: 6,
    }],
  };

  const dadosComparativo = {
    labels,
    datasets: [
      {
        label: 'Notificados',
        data: notificados,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#F59E0B',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Confirmados',
        data: confirmados,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220,38,38,0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#DC2626',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const opcoesComparativo = {
    ...opcoesBase,
    maintainAspectRatio: false,
    plugins: {
      ...opcoesBase.plugins,
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  const picoNotif = Math.max(...notificados);
  const seNotif = serieData.find(item => item.notificados === picoNotif)?.semana;
  const picoConf = Math.max(...confirmados);
  const seConf = serieData.find(item => item.confirmados === picoConf)?.semana;

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1F3473',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        📈 Série Histórica por Semana Epidemiológica
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} md={12}>
          <Card style={{
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#4B5563',
              marginBottom: '4px',
            }}>
              Casos Notificados
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginBottom: '16px',
            }}>
              Pico: SE {seNotif} com <strong>{picoNotif}</strong> notificações
            </p>
            <Bar data={dadosNotificados} options={opcoesBase} />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#4B5563',
              marginBottom: '4px',
            }}>
              Casos Confirmados
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginBottom: '16px',
            }}>
              Pico: SE {seConf} com <strong>{picoConf}</strong> confirmações
            </p>
            <Bar data={dadosConfirmados} options={opcoesBase} />
          </Card>
        </Col>
      </Row>

      <Card style={{
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#4B5563',
          marginBottom: '16px',
        }}>
          Evolução Comparativa — Notificados vs. Confirmados
        </h3>
        <div style={{ height: '300px' }}>
          <Line data={dadosComparativo} options={opcoesComparativo} />
        </div>
      </Card>
    </div>
  );
}
