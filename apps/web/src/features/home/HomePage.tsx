import PageLoader from '../../components/ui/PageLoader';
import { useAppSelector } from '../../store';
import HealthPage from '../health/HealthPage';

export default function HomePage() {
  const status = useAppSelector((s) => s.auth.status);
  if (status === 'loading') return <PageLoader />;
  return <HealthPage />;
}
