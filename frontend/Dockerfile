FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run the dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
