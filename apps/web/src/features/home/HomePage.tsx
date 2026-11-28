import { Link } from 'react-router';
import PageLoader from '../../components/ui/PageLoader';
import { useAppSelector } from '../../store';
import HealthPage from '../health/HealthPage';
import SearchResults from '../search/SearchResults';

// Shows search results while there's text in the navbar search field
export default function HomePage() {
  const status = useAppSelector((s) => s.auth.status);
  const q = useAppSelector((s) => s.search.term).trim();
  if (status === 'loading') return <PageLoader />;
  if (!q) return <HealthPage />;
  if (status === 'unauthenticated')
    return (
      <p className="py-20 text-center text-zinc-400">
        <Link to="/login" className="font-semibold text-white underline">
          Log in
        </Link>{' '}
        to search songs.
      </p>
    );
  return <SearchResults q={q} />;
}
