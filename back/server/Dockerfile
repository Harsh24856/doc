FROM node:20-alpine

# Install system dependencies for pdf-poppler
RUN apk add --no-cache \
    poppler-utils \
    poppler-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]