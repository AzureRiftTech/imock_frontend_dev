# Stage 1: Build (Next.js)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Bake public env vars into the bundle at build time
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG NEXT_PUBLIC_RAPIDAPI_HOST
ENV NEXT_PUBLIC_RAPIDAPI_HOST=$NEXT_PUBLIC_RAPIDAPI_HOST

ARG NEXT_PUBLIC_RAPIDAPI_KEY
ENV NEXT_PUBLIC_RAPIDAPI_KEY=$NEXT_PUBLIC_RAPIDAPI_KEY

RUN npm run build

# Stage 2: Run (standalone output)
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone server + required files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
