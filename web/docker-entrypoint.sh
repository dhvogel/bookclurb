#!/bin/sh
set -e

# Get port from Cloud Run environment variable, default to 8080
PORT=${PORT:-8080}

# Generate config.js from environment variable
INVITE_SERVICE_URL=${REACT_APP_INVITE_SERVICE_URL:-http://localhost:8080}

echo "window.__RUNTIME_CONFIG__ = { inviteServiceURL: \"$INVITE_SERVICE_URL\" };" > /usr/share/nginx/html/config.js

# Generate nginx config with dynamic port
cat > /etc/nginx/conf.d/nginx.conf <<EOF
server {
  listen ${PORT};

  location / {
    root   /usr/share/nginx/html;
    index  index.html index.htm;
    try_files \$uri \$uri/ /index.html;
  }

  error_page   500 502 503 504  /50x.html;

  location = /50x.html {
    root   /usr/share/nginx/html;
  }
}
EOF

# Verify nginx config is valid
nginx -t || {
  echo "❌ Nginx configuration test failed"
  exit 1
}

exec "$@"

