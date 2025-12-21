FROM mcr.microsoft.com/playwright:v1.44.0-focal

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies only
RUN npm install --production

# Copy application files
COPY . .

EXPOSE 9000

# Note: Chromium and dependencies are already included in the base image
# No need to install them again

CMD ["npm", "start"]

