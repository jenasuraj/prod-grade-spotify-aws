import { useEffect } from 'react';
import StatusBadge from '../../components/health/StatusBadge';
import Button from '../../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchHealth } from '../../store/health/healthThunks';
import { APP_NAME } from '../../utils/helpers';

export default function HealthPage() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((s) => s.health);
  useEffect(() => {
    void dispatch(fetchHealth());
  }, [dispatch]);

  return (
    <section className="flex min-h-screen items-center justify-center p-4">
      <title>{APP_NAME}</title>
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        {data && <StatusBadge label="Database" status={data.db} />}
        {data && <StatusBadge label="Redis" status={data.redis} />}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={() => void dispatch(fetchHealth())} disabled={loading} className="w-full">
          {loading ? 'Checking…' : 'Check again'}
        </Button>
      </div>
    </section>
  );
}
