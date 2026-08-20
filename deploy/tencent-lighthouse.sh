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

install_certbot_nginx_plugin() {
  if certbot plugins 2>/dev/null | grep -qE '^[[:space:]]*\* nginx'; then
    return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -y python3-certbot-nginx
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y python3-certbot-nginx || dnf install -y python2-certbot-nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y python2-certbot-nginx || yum install -y python-certbot-nginx
  fi

  certbot plugins | grep -qE '^[[:space:]]*\* nginx'
}

if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  install_packages
fi

install_certbot_nginx_plugin

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
  -d hex.aicollie.cn \
  -d aicollie.cn \
  -d www.aicollie.cn

systemctl enable --now certbot.timer 2>/dev/null || true
printf '%s\n' '17 3 * * * root certbot renew --quiet --deploy-hook "systemctl reload nginx"' > /etc/cron.d/haidou-certbot-renew
chmod 644 /etc/cron.d/haidou-certbot-renew
nginx -t
systemctl reload nginx

rm -f -- "$archive" "$nginx_conf_source"
