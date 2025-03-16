FROM node:22.14.0-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --chown=node:node . .
RUN npm i --omit=dev && npm cache clean --force

RUN chown -R node:node /app
USER node

CMD ["node", "."]
