#!/usr/bin/env bash
set -euo pipefail

site_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  printf '需要 Python 3 才能启动本地预览。\n' >&2
  exit 1
fi

printf 'Vorlinx 官网本地预览：http://localhost:2611\n按 Ctrl+C 停止服务。\n'
exec python3 -m http.server 2611 --bind 127.0.0.1 --directory "$site_dir"
