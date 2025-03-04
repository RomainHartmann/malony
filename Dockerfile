FROM node:22.14.0-alpine
WORKDIR /app

RUN chown -R node:node /app
USER node

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

CMD [ "node", "." ]
