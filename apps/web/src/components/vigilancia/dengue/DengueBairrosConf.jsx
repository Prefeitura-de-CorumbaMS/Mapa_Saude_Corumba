import { Card } from 'antd';
import { Bar } from 'react-chartjs-2';

export default function DengueBairrosConf({ bairrosData }) {
  if (!bairrosData || bairrosData.length === 0) return null;

  const dados = {
    labels: bairrosData.map(b => b.bairro),
    datasets: [{
      label: 'Confirmados',
      data: bairrosData.map(b => b.casos),
      backgroundColor: '#DC2626',
      borderRadius: 4,
    }],
  };

  const opcoes = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <Card style={{
      marginBottom: '24px',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1F3473',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        🔴 Confirmados por Bairro
      </h2>
      <p style={{
        fontSize: '12px',
        color: '#9CA3AF',
        marginBottom: '16px',
      }}>
        Bairros com casos laboratorialmente confirmados
      </p>
      <Bar data={dados} options={opcoes} />
    </Card>
  );
}
