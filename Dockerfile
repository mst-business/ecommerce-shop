# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --frozen-lockfile || yarn install --frozen-lockfile

# Copy rest of the app
COPY . .


# Build Next.js app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
