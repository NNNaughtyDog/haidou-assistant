#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_SHA:?RELEASE_SHA is required}"

archive="/tmp/haidou-${RELEASE_SHA}.tar.gz"
release_root="/var/www/haidou-assistant/releases"
release_dir="${release_root}/${RELEASE_SHA}"
nginx_conf_source="/tmp/haidou-assistant.conf"
nginx_conf_target="/etc/nginx/conf.d/haidou-assistant.conf"

install_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y nginx certbot python3-certbot-nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nginx certbot python3-certbot-nginx
  else
    echo "Unsupported package manager; install nginx, certbot and the nginx certbot plugin first." >&2
    exit 1
  fi
}

if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  install_packages
fi

test -f "$archive"
test -f "$nginx_conf_source"

install -d -m 755 "$release_dir"
tar -xzf "$archive" -C "$release_dir"
ln -sfn "$release_dir" /var/www/haidou-assistant/current

install -m 644 "$nginx_conf_source" "$nginx_conf_target"
nginx -t
systemctl enable --now nginx
systemctl reload nginx

certbot --nginx \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  --redirect \
  -d aicollie.cn \
  -d www.aicollie.cn

systemctl enable --now certbot.timer 2>/dev/null || true
nginx -t
systemctl reload nginx

rm -f -- "$archive" "$nginx_conf_source"
