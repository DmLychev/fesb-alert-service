ARG NODE_VERSION=24.14.0-alpine
FROM node:${NODE_VERSION} AS builder
LABEL authors="dlychev"

WORKDIR /app
COPY ./app/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY ./app ./
RUN npm run build


FROM node:${NODE_VERSION} AS runner
LABEL authors="dlychev"
ENV NODE_ENV=production

WORKDIR /app
COPY --link --from=builder /app/dist ./dist
RUN --mount=type=cache,target=/root/.npm npm install serve@^14.2.6 --omit=dev
USER node
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]


FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY ./app/package*.json ./
RUN npm install
COPY ./app ./
RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]