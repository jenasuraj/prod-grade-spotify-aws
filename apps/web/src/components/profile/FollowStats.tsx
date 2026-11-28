import { Users } from 'lucide-react';
import { Link } from 'react-router';
import type { FollowsResponse, Person } from '../../types/profile';
import { artworkFor, getInitials } from '../../utils/helpers';

interface FollowStatsProps {
  follows: FollowsResponse;
}

interface PeopleProps {
  label: string;
  count: number;
  people: Person[];
  emptyText: string;
}

const People = ({ label, count, people, emptyText }: PeopleProps) => (
  <div className="rounded-3xl border border-white/[0.06] bg-ink-900/60 p-6">
    <p className="flex items-baseline gap-2">
      <span className="font-display text-3xl font-semibold text-white tabular-nums">{count}</span>
      <span className="text-sm text-slate-400">{label}</span>
    </p>
    {people.length ? (
      <ul className="mt-5 space-y-1">
        {people.map(({ name, displayName }) => (
          <li key={name}>
            <Link
              to={`/${name}`}
              className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/[0.04]"
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br text-sm font-semibold text-white ${artworkFor(name)}`}
              >
                {getInitials(displayName ?? name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-white">{displayName ?? name}</span>
                <span className="block truncate text-xs text-slate-500">@{name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
        <Users className="size-4" /> {emptyText}
      </p>
    )}
  </div>
);

export default function FollowStats({ follows }: FollowStatsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <People
        label="Following"
        count={follows.followingCount}
        people={follows.following}
        emptyText="Not following anyone yet."
      />
      <People
        label="Followers"
        count={follows.followerCount}
        people={follows.followers}
        emptyText="No followers yet."
      />
    </div>
  );
}
