import { Card, Row, Col } from 'antd';
import { Bar, Doughnut } from 'react-chartjs-2';

export default function DenguePerfil({ perfilData }) {
  if (!perfilData) return null;

  const { faixa_etaria, sexo } = perfilData;

  // Verificar se os dados estão completos
  if (!faixa_etaria || !faixa_etaria.valores || faixa_etaria.valores.length === 0) {
    return null;
  }
  if (!sexo || (sexo.feminino === undefined && sexo.masculino === undefined)) {
    return null;
  }

  const dadosFaixa = {
    labels: faixa_etaria.labels,
    datasets: [{
      label: 'Casos',
      data: faixa_etaria.valores,
      backgroundColor: '#1F3473',
      borderRadius: 4,
    }],
  };

  const opcoesFaixa = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  const total = sexo.feminino + sexo.masculino;
  const pctFem = Math.round((sexo.feminino / total) * 100);
  const pctMas = Math.round((sexo.masculino / total) * 100);

  const dadosSexo = {
    labels: [
      `Feminino: ${sexo.feminino} (${pctFem}%)`,
      `Masculino: ${sexo.masculino} (${pctMas}%)`
    ],
    datasets: [{
      data: [sexo.feminino, sexo.masculino],
      backgroundColor: ['#40A1E6', '#1F3473'],
      borderWidth: 0,
    }],
  };

  const opcoesSexo = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  // Encontrar faixas mais afetadas
  const maxCasos = Math.max(...faixa_etaria.valores);
  const faixasMaisAfetadas = faixa_etaria.labels.filter((_, index) =>
    faixa_etaria.valores[index] === maxCasos
  );

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
        👤 Perfil dos Casos Confirmados
      </h2>

      <Row gutter={[16, 16]}>
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
              Distribuição por Faixa Etária
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginBottom: '16px',
            }}>
              Faixas mais afetadas: <strong>{faixasMaisAfetadas.join(', ')}</strong> ({maxCasos} casos cada)
            </p>
            <Bar data={dadosFaixa} options={opcoesFaixa} />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#4B5563',
              marginBottom: '16px',
              alignSelf: 'flex-start',
              width: '100%',
            }}>
              Distribuição por Sexo
            </h3>
            <div style={{
              width: '250px',
              height: '250px',
              position: 'relative',
            }}>
              <Doughnut data={dadosSexo} options={opcoesSexo} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#40A1E6',
                }}>
                  {pctFem}%
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6B7280',
                }}>
                  Feminino
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
