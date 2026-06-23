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
COPY apps/web apps/web
RUN npm run build --workspace @ismart/web

FROM node:22-alpine AS runtime
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["npm", "run", "start"]
