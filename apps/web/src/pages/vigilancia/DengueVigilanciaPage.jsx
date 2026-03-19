import { Spin, Alert } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  useGetDengueBySEQuery,
  useGetDengueSerieQuery,
  useGetDenguePerfilQuery,
  useGetDengueBairrosQuery,
} from '../../store/slices/apiSlice';
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
  Tooltip,
  Legend,
  Filler
);

export default function DengueVigilanciaPage() {
  // Buscar dados da SE 09/2026
  const { data: dadosSE, isLoading: loadingSE, error: errorSE } = useGetDengueBySEQuery({ ano: 2026, se: 9 });
  const { data: dadosSerie, isLoading: loadingSerie } = useGetDengueSerieQuery({ ano: 2026, se_inicio: 1, se_fim: 9 });
  const { data: dadosPerfil, isLoading: loadingPerfil } = useGetDenguePerfilQuery({ ano: 2026, se: 9 });
  const { data: dadosBairrosNotif, isLoading: loadingBairrosNotif } = useGetDengueBairrosQuery({ ano: 2026, se: 9, tipo: 'notificados' });
  const { data: dadosBairrosConf, isLoading: loadingBairrosConf } = useGetDengueBairrosQuery({ ano: 2026, se: 9, tipo: 'confirmados' });

  const isLoading = loadingSE || loadingSerie || loadingPerfil || loadingBairrosNotif || loadingBairrosConf;

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
