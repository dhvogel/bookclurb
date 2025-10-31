#!/bin/sh
set -e

# Generate config.js from environment variable
INVITE_SERVICE_URL=${REACT_APP_INVITE_SERVICE_URL:-http://localhost:8080}

echo "window.__RUNTIME_CONFIG__ = { inviteServiceURL: \"$INVITE_SERVICE_URL\" };" > /usr/share/nginx/html/config.js

exec "$@"

