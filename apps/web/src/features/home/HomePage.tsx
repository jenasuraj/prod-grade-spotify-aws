import { useEffect, useState } from 'react';
import PageLoader from '../../components/ui/PageLoader';
import Splash from '../../components/ui/Splash';
import { useAppSelector } from '../../store';
import HealthPage from '../health/HealthPage';

export const SPLASH_IMAGE =
  'https://s3-alpha.figma.com/hub/file/2734964093/9f5edc36-eb4d-414a-8447-10514f2bc224-cover.png';

export const SPLASH_MS = 2000;

// Logged-in users see the splash for 2s each time they land on '/'; guests go straight in
export default function HomePage() {
  const status = useAppSelector((s) => s.auth.status);
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    if (status !== 'authenticated') return;
    const timeout = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated' && !splashDone) return <Splash src={SPLASH_IMAGE} alt="Loading" />;
  return <HealthPage />;
}
