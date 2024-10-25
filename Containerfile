FROM docker.io/library/node:22-alpine as builder

WORKDIR /app

COPY ./ ./

RUN npm install

RUN npm run build

# Run a second install to get function bins
RUN npm install

ENTRYPOINT ["npx"]
