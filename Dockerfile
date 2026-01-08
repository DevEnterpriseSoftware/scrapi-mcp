FROM node:25-alpine AS builder

COPY . /app
WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install
RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

FROM node:25-alpine AS release

RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production
ENV TRANSPORT=http
ENV PORT=5000

WORKDIR /app

RUN npm ci --ignore-scripts --omit-dev

USER nodeuser

EXPOSE 5000
ENTRYPOINT ["node", "dist/index.js"]
