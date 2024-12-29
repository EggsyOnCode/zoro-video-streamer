FROM node:alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm config rm proxy
RUN npm config rm https-proxy
RUN set HTTP_PROXY=null
RUN set HTTPS_PROXY=null
RUN npm config list  

RUN npm install
RUN npm install -g @nestjs/cli

COPY . .

RUN npm run build user-acc-mgmt-service


FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/user-acc-mgmt-service/main"]