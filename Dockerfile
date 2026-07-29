FROM mcr.microsoft.com/mssql/server:2022-latest AS mssql
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
 && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
 && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/ubuntu/22.04/mssql-server-2022 jammy main" > /etc/apt/sources.list.d/mssql-server-2022.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends mssql-server-fts \
 && rm -rf /var/lib/apt/lists/*
USER mssql

FROM node:22-alpine AS bootstrap

WORKDIR /app
# openssl is needed at runtime (Prisma SQL Server TLS); python3/make/g++ build native modules
# like bcrypt during `npm rebuild --build-from-source` below.
RUN apk add --no-cache openssl python3 make g++

# Install only the workspaces the API runtime needs (api + shared).
# --ignore-scripts skips the root postinstall (which expects source files we haven't copied yet);
# we rebuild native deps and run the build steps explicitly below.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --ignore-scripts

# Bring shared source + tsconfig in so its build can resolve.
COPY packages/shared ./packages/shared
RUN npm run build -w @apexgear/shared

# Copy API source, schema/migrations, and the committed demo snapshot.
COPY apps/api ./apps/api
COPY apps/api/scripts/crawler/output/demo-data.json /app/apps/api/scripts/crawler/output/demo-data.json
# bcrypt is a native binding; rebuild it now that the build toolchain is available.
RUN npm rebuild bcrypt --build-from-source
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

# Bootstrap entrypoint: migrate -> seed 6 demo accounts -> restore snapshot, then exit.
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/api-entrypoint \
 && chmod +x /usr/local/bin/api-entrypoint

WORKDIR /app/apps/api
ENTRYPOINT ["api-entrypoint"]
