# Stage 1: Build the React/Vite app
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY ./frontend .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
