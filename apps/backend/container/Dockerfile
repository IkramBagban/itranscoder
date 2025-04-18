FROM node:22-alpine

RUN apk update
RUN apk upgrade
RUN apk add ffmpeg

WORKDIR /usr/src/app

COPY ./package.json ./package.json
COPY ./constants.js ./constants.js


RUN npm install

COPY ./index.js ./index.js


CMD ["npm", "start"]