# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the build with a static server
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/nginx.conf

# Install envsubst
RUN apk add --no-cache gettext

EXPOSE 8080

CMD envsubst '$PORT' < /etc/nginx/conf.d/nginx.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'