FROM node:22-alpine

WORKDIR /app

# Install openssl (required for Prisma on Alpine) and build tools for native modules
RUN apk add --no-cache openssl python3 make g++

# Copy everything
COPY . .

# Install all dependencies (this also triggers postinstall which builds shared and generates Prisma client)
RUN npm install

EXPOSE 3001 5173 5174

# Default command, will be overridden by docker-compose
CMD ["npm", "run", "dev:api"]
