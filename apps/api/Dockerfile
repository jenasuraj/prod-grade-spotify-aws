# Build from the repo root so the shared package-lock.json is available:
#   docker build -f apps/api/Dockerfile -t spotify-api .
# Runtime needs only DATABASE_URL, REDIS_URL, WEB_ORIGIN and PORT.

FROM node:24-alpine AS base
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/

FROM base AS build
RUN npm ci -w api --include-workspace-root --ignore-scripts
COPY apps/api apps/api
# prisma.config.ts requires DATABASE_URL to be set; generate never connects, so any value works
RUN cd apps/api && DATABASE_URL=postgresql://build@localhost/build npx prisma generate && npx nest build

FROM base AS prod-deps
# @prisma/client lists the prisma CLI and typescript as optional peers, and npm keeps them because
# they're in the lockfile; --legacy-peer-deps leaves them (and the CLI's ~250 MB of deps) out
RUN npm ci -w api --omit=dev --ignore-scripts --legacy-peer-deps

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/package.json ./
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]