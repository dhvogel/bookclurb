# Stage 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies needed for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript React app
RUN npm run build

# Verify that the blogs directory was copied to the build folder
RUN test -d /app/build/blogs || (echo "Error: blogs directory not found in build" && exit 1)

# Stage 2: Serve the build with a static server
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf

# Copy and set up entrypoint script to generate config.js and nginx config at runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]