import { Card, Row, Col, Divider } from 'antd';

export default function DengueFooter() {
  return (
    <Card
      style={{
        background: '#1F3473',
        border: 'none',
      }}
    >
      <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
        <Col xs={12} sm={6}>
          <p style={{
            color: '#93C5FD',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 4px 0',
          }}>
            Estado
          </p>
          <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>
            Mato Grosso do Sul
          </p>
        </Col>

        <Col xs={12} sm={6}>
          <p style={{
            color: '#93C5FD',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 4px 0',
          }}>
            Município
          </p>
          <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>
            Prefeitura Municipal de Corumbá
          </p>
        </Col>

        <Col xs={12} sm={6}>
          <p style={{
            color: '#93C5FD',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 4px 0',
          }}>
            Órgão
          </p>
          <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>
            Secretaria Municipal de Saúde
          </p>
          <p style={{ color: '#93C5FD', fontSize: '11px', margin: '2px 0 0 0' }}>
            Gerência de Vigilância em Saúde
          </p>
        </Col>

        <Col xs={12} sm={6}>
          <p style={{
            color: '#93C5FD',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 4px 0',
          }}>
            CIEVS Fronteira
          </p>
          <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>
            (67) 99144-0207
          </p>
          <p style={{
            color: '#93C5FD',
            fontSize: '11px',
            margin: '2px 0 0 0',
            wordBreak: 'break-all',
          }}>
            cievsfronteiracorumba@gmail.com
          </p>
        </Col>
      </Row>

      <Divider style={{ borderColor: '#2a4a9e', margin: '16px 0' }} />

      <p style={{
        color: '#93C5FD',
        fontSize: '11px',
        textAlign: 'center',
        margin: 0,
      }}>
        Fonte: SINAN, 2026 · Boletim Epidemiológico Dengue SE 09 · Dados sujeitos a revisão
      </p>
    </Card>
  );
}
