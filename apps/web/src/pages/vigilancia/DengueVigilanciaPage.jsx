import { useState, useEffect } from 'react';
import { Spin, Alert, Select, Card, Space, Typography, Tooltip, Segmented } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  useGetDengueByAnoQuery,
  useGetDengueBySEQuery,
  useGetDengueSerieQuery,
  useGetDenguePerfilQuery,
  useGetDengueBairrosQuery,
  useGetDengueCasosSEQuery,
  useGetDengueCasosSerieQuery,
  useGetDengueCasosPerfilQuery,
  useGetDengueCasosBairrosQuery,
} from '../../store/slices/apiSlice';
import { getPeriodoFormatado, getPeriodoCurto, EXPLICACAO_SE } from '../../utils/calendarioEpidemiologico';

const { Text } = Typography;
const { Option } = Select;
import DengueHeader from '../../components/vigilancia/dengue/DengueHeader';
import DengueKPICards from '../../components/vigilancia/dengue/DengueKPICards';
import DengueSerieHistorica from '../../components/vigilancia/dengue/DengueSerieHistorica';
import DenguePerfil from '../../components/vigilancia/dengue/DenguePerfil';
import DengueBairrosNotif from '../../components/vigilancia/dengue/DengueBairrosNotif';
import DengueBairrosConf from '../../components/vigilancia/dengue/DengueBairrosConf';
import DengueSorotipo from '../../components/vigilancia/dengue/DengueSorotipo';
import DengueDefinicao from '../../components/vigilancia/dengue/DengueDefinicao';
import DengueFooter from '../../components/vigilancia/dengue/DengueFooter';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export default function DengueVigilanciaPage() {
  const anoAtual = 2026;
  const [seSelecionada, setSESelecionada] = useState(null);
  const [sesDisponiveis, setSEsDisponiveis] = useState([]);
  const [usarCasos, setUsarCasos] = useState(false); // Inicia com dados agregados

  // Buscar todas as SEs do ano para preencher o seletor
  const { data: dadosAno, isLoading: loadingAno } = useGetDengueByAnoQuery({ ano: anoAtual });

  // Definir a SE selecionada automaticamente (última disponível)
  useEffect(() => {
    if (dadosAno?.data) {
      // Usar APENAS as SEs da tabela VIGILANCIA_Dengue_SE (dados oficiais)
      // Ignora casos "órfãos" sem SE correspondente na tabela principal
      if (dadosAno.data.semanas && dadosAno.data.semanas.length > 0) {
        const ses = dadosAno.data.semanas
          .map(s => s.semana_epidemiologica)
          .sort((a, b) => b - a); // Ordem decrescente (mais recente primeiro)

        setSEsDisponiveis(ses);

        // Se não há SE selecionada, selecionar a última
        if (!seSelecionada) {
          setSESelecionada(ses[0]); // Última SE (maior número)
        }
      }
    }
  }, [dadosAno, seSelecionada]);

  // Buscar dados agregados tradicionais
  const { data: dadosSEAgregado, isLoading: loadingSEAgregado, error: errorSEAgregado } = useGetDengueBySEQuery(
    { ano: anoAtual, se: seSelecionada },
    { skip: !seSelecionada || usarCasos }
  );
  const { data: dadosSerieAgregado, isLoading: loadingSerieAgregado } = useGetDengueSerieQuery(
    { ano: anoAtual, se_inicio: 1, se_fim: seSelecionada },
    { skip: !seSelecionada || usarCasos }
  );
  const { data: dadosPerfilAgregado, isLoading: loadingPerfilAgregado } = useGetDenguePerfilQuery(
    { ano: anoAtual, se: seSelecionada },
    { skip: !seSelecionada || usarCasos }
  );
  const { data: dadosBairrosNotifAgregado, isLoading: loadingBairrosNotifAgregado } = useGetDengueBairrosQuery(
    { ano: anoAtual, se: seSelecionada, tipo: 'notificados' },
    { skip: !seSelecionada || usarCasos }
  );
  const { data: dadosBairrosConfAgregado, isLoading: loadingBairrosConfAgregado } = useGetDengueBairrosQuery(
    { ano: anoAtual, se: seSelecionada, tipo: 'confirmados' },
    { skip: !seSelecionada || usarCasos }
  );

  // Buscar dados de casos individuais
  const { data: dadosSECasos, isLoading: loadingSECasos, error: errorSECasos } = useGetDengueCasosSEQuery(
    { ano: anoAtual, se: seSelecionada },
    { skip: !seSelecionada || !usarCasos }
  );
  const { data: dadosSerieCasos, isLoading: loadingSerieCasos } = useGetDengueCasosSerieQuery(
    { ano: anoAtual, se_inicio: 1, se_fim: seSelecionada },
    { skip: !seSelecionada || !usarCasos }
  );
  const { data: dadosPerfilCasos, isLoading: loadingPerfilCasos } = useGetDengueCasosPerfilQuery(
    { ano: anoAtual, se: seSelecionada },
    { skip: !seSelecionada || !usarCasos }
  );
  const { data: dadosBairrosNotifCasos, isLoading: loadingBairrosNotifCasos } = useGetDengueCasosBairrosQuery(
    { ano: anoAtual, se: seSelecionada, tipo: 'notificados' },
    { skip: !seSelecionada || !usarCasos }
  );
  const { data: dadosBairrosConfCasos, isLoading: loadingBairrosConfCasos } = useGetDengueCasosBairrosQuery(
    { ano: anoAtual, se: seSelecionada, tipo: 'confirmados' },
    { skip: !seSelecionada || !usarCasos }
  );

  // Selecionar dados com base no toggle
  const dadosSE = usarCasos ? dadosSECasos : dadosSEAgregado;
  const dadosSerie = usarCasos ? dadosSerieCasos : dadosSerieAgregado;
  const dadosPerfil = usarCasos ? dadosPerfilCasos : dadosPerfilAgregado;
  const dadosBairrosNotif = usarCasos ? dadosBairrosNotifCasos : dadosBairrosNotifAgregado;
  const dadosBairrosConf = usarCasos ? dadosBairrosConfCasos : dadosBairrosConfAgregado;

  const loadingSE = usarCasos ? loadingSECasos : loadingSEAgregado;
  const loadingSerie = usarCasos ? loadingSerieCasos : loadingSerieAgregado;
  const loadingPerfil = usarCasos ? loadingPerfilCasos : loadingPerfilAgregado;
  const loadingBairrosNotif = usarCasos ? loadingBairrosNotifCasos : loadingBairrosNotifAgregado;
  const loadingBairrosConf = usarCasos ? loadingBairrosConfCasos : loadingBairrosConfAgregado;

  const errorSE = usarCasos ? errorSECasos : errorSEAgregado;

  const isLoading = loadingAno || loadingSE || loadingSerie || loadingPerfil || loadingBairrosNotif || loadingBairrosConf;

  if (isLoading || !dadosSE?.data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Carregando dados de dengue..." />
      </div>
    );
  }

  if (errorSE) {
    return (
      <Alert
        type="error"
        message="Erro ao carregar dados"
        description="Não foi possível carregar os dados de vigilância de dengue."
        showIcon
      />
    );
  }

  const se = dadosSE.data;
  const serie = dadosSerie?.data || [];
  const perfil = dadosPerfil?.data || null;
  const bairrosNotif = dadosBairrosNotif?.data || [];
  const bairrosConf = dadosBairrosConf?.data || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F1F5F9',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0',
      }}>
        {/* Seletor de Semana Epidemiológica */}
        {sesDisponiveis.length > 0 && (
          <Card
            style={{
              margin: '0 16px 16px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space align="center">
                <Text style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                  📅 Selecione a Semana Epidemiológica:
                </Text>
                <Tooltip
                  title={
                    <div style={{ maxWidth: '400px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        {EXPLICACAO_SE.titulo}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        {EXPLICACAO_SE.texto}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '8px' }}>
                        <strong>Regras:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                          {EXPLICACAO_SE.regras.map((regra, idx) => (
                            <li key={idx}>{regra}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                        {EXPLICACAO_SE.exemplo}
                      </div>
                    </div>
                  }
                  overlayStyle={{ maxWidth: '450px' }}
                >
                  <InfoCircleOutlined style={{ color: '#fff', cursor: 'pointer', fontSize: '16px' }} />
                </Tooltip>
              </Space>
              <Select
                value={seSelecionada}
                onChange={setSESelecionada}
                style={{ width: '100%' }}
                size="large"
                placeholder="Selecione uma SE"
                optionLabelProp="label"
              >
                {sesDisponiveis.map(se => (
                  <Option
                    key={se}
                    value={se}
                    label={`SE ${String(se).padStart(2, '0')} / ${anoAtual}`}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        SE {String(se).padStart(2, '0')} / {anoAtual}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        📆 {getPeriodoFormatado(se, anoAtual)}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
              {seSelecionada && (
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                    📆 Período: {getPeriodoFormatado(seSelecionada, anoAtual)}
                  </Text>
                </div>
              )}

              {/* Seletor de fonte de dados */}
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Text style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                    📊 Fonte de dados:
                  </Text>
                  <Space style={{ width: '100%' }} size="middle">
                    <button
                      onClick={() => setUsarCasos(false)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '13px',
                        transition: 'all 0.3s',
                        background: !usarCasos ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.8)',
                        color: !usarCasos ? '#fff' : '#374151',
                        boxShadow: !usarCasos ? '0 4px 12px rgba(59, 130, 246, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                        transform: !usarCasos ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      📋 Dados Agregados
                    </button>
                    <button
                      onClick={() => setUsarCasos(true)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '13px',
                        transition: 'all 0.3s',
                        background: usarCasos ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.8)',
                        color: usarCasos ? '#fff' : '#374151',
                        boxShadow: usarCasos ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                        transform: usarCasos ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      👤 Casos Individuais
                    </button>
                  </Space>
                </Space>
              </div>

              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                💡 Última atualização: SE {String(sesDisponiveis[0]).padStart(2, '0')} ({getPeriodoCurto(sesDisponiveis[0], anoAtual)})
              </Text>
            </Space>
          </Card>
        )}

        <DengueHeader data={se} />
        <DengueKPICards data={se} />
        <DengueSerieHistorica serieData={serie} />
        <DenguePerfil perfilData={perfil} />
        <DengueBairrosNotif bairrosData={bairrosNotif} />
        <DengueBairrosConf bairrosData={bairrosConf} />
        <DengueSorotipo data={se} />
        <DengueDefinicao />
        <DengueFooter />
      </div>
    </div>
  );
}
