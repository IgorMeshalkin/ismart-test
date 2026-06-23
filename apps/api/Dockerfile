FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/transcriber/package.json apps/transcriber/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

FROM deps AS build
WORKDIR /app
COPY tsconfig.base.json ./
COPY libs libs
COPY apps/api apps/api
RUN npm run build --workspace @ismart/api

FROM node:22-alpine AS runtime
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/apps/api/src/main.js"]
