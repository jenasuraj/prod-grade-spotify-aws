# Spotify

TypeScript monorepo (npm workspaces).

| Path        | What                                           |
| ----------- | ---------------------------------------------- |
| `apps/api`  | NestJS 12 API, Prisma 7 ORM, PostgreSQL, Redis |
| `apps/web`  | React 19 + Vite                                |
| `packages/` | Shared packages (add as needed)                |

Tooling: Jest (both apps), ESLint + Prettier (root config), Docker Compose for Postgres.

## Getting started

```bash
npm install                      # installs all workspaces, generates Prisma client
cp apps/api/.env.example apps/api/.env
npm run db:up                    # start Postgres and Redis in Docker
npm run db:migrate               # apply Prisma migrations
npm run dev                      # api on :3000, web on :5173
```

## Scripts (run from root)

| Script                            | Description                     |
| --------------------------------- | ------------------------------- |
| `npm run dev`                     | Run api and web together        |
| `npm run build`                   | Build all workspaces            |
| `npm test` / `npm run test:e2e`   | Jest unit tests / API e2e tests |
| `npm run lint` / `lint:fix`       | ESLint                          |
| `npm run format` / `format:check` | Prettier                        |
| `npm run typecheck`               | `tsc` in every workspace        |
| `npm run db:up` / `db:down`       | Start / stop Postgres + Redis   |
| `npm run db:migrate`              | `prisma migrate dev`            |
| `npm run db:generate`             | Regenerate Prisma client        |
| `npm run db:studio`               | Open Prisma Studio              |

Run a script in one workspace with `-w`, e.g. `npm run test:watch -w web`.

## Deploying

The API reads every connection from a single URL, so in the cloud you only set these env vars:

| Variable       | Example                                               |
| -------------- | ----------------------------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `REDIS_URL`    | `rediss://default:pass@host:6379`                     |
| `WEB_ORIGIN`   | `https://your-frontend.com` (CORS)                    |
| `PORT`         | usually set by the platform                           |

On each release, run `npm run db:deploy` with `DATABASE_URL` pointing at the cloud database (it applies committed migrations without generating new ones). `GET /api/health` returns 200 when Postgres and Redis are reachable and 503 otherwise, which you can use as the platform's health check.
