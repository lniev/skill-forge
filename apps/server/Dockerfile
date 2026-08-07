FROM node:20-slim AS base

# Install build tools for native modules (bcrypt / better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy monorepo workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json turbo.json ./

# Copy workspace packages
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Install dependencies (including devDependencies for tsx and build)
RUN pnpm install --frozen-lockfile

# Build the server workspace
RUN pnpm --filter @skill-platform/server build

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
