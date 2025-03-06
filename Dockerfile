FROM node:22.14.0-alpine
WORKDIR /app

RUN chown -R node:node /app
USER node

COPY --chown=node:node package*.json ./
RUN npm i --omit=dev && npm cache clean --force

COPY --chown=node:node . .

CMD [ "node", "." ]
