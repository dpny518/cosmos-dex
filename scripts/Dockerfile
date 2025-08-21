FROM node:18-alpine

RUN apk add --no-cache \
    curl \
    jq \
    bash

# Install CosmJS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Install Cosmos SDK CLI tools
RUN curl -L https://github.com/cosmos/gaia/releases/download/v15.2.0/gaiad-v15.2.0-linux-amd64 -o /usr/local/bin/gaiad && \
    chmod +x /usr/local/bin/gaiad

COPY . .

CMD ["bash"]