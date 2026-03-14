#!/bin/sh
set -eu

API_BASE_URL_VALUE="${VUE_APP_API_URL:-${VUE_APP_API_BASE_URL:-/api}}"
ESCAPED_API_BASE_URL=$(printf '%s' "$API_BASE_URL_VALUE" | sed 's/[\"\\]/\\&/g')

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = Object.assign({}, window.__APP_CONFIG__ || {}, {
  VUE_APP_API_URL: "$ESCAPED_API_BASE_URL",
  VUE_APP_API_BASE_URL: "$ESCAPED_API_BASE_URL"
});
EOF
