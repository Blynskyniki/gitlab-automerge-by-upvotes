FROM node:15-alpine

WORKDIR /usr/src/app
RUN apk -U upgrade; apk --update add nano; rm -rf /var/cache/apk/*

RUN mkdir packages
COPY ["./dist", "./packages/"]
COPY ["./node_modules", "./packages/"]

ENV NODE_PATH /usr/src/app/packages
ENTRYPOINT ["node","--enable-source-maps", "/usr/src/app/packages/index.js"]
