module.exports = {
    ubuntu: `FROM ubuntu:trusty

MAINTAINER PKG_AUTHOR

RUN apt-get update && apt-get -y install curl && curl -sL https://deb.nodesource.com/setup | sudo bash - && apt-get -y install python build-essential nodejs

# Install Nodemon
RUN npm install -g nodemon

# Add package.json
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /src && cp -a /tmp/node_modules /src/

# Define working directory
WORKDIR /src
ADD . /src

EXPOSE 8080

CMD ["nodemon", "/src/index.js"]
`,
    default: `FROM node:9

MAINTAINER PKG_AUTHOR

RUN mkdir -p /app
RUN mkdir -p /src

WORKDIR /src
COPY package.json /app
RUN npm install
RUN npm install -g nodemon
COPY . /app

EXPOSE 8080

CMD ["nodemon", "/src/index.js"]
`
};