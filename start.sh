#!/usr/bin/env bash
set -euo pipefail
site_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
for dependency in python3 node; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    printf '本地预览需要 Python 3 和 Node.js。\n' >&2
    exit 1
  fi
done
node "$site_dir/scripts/build-site.mjs"
node "$site_dir/scripts/watch-site.mjs" &
watch_pid=$!
cleanup() { kill "$watch_pid" 2>/dev/null || true; }
trap cleanup EXIT
printf 'Vorlinx 官网本地预览：http://localhost:2611\n保存源码或替换截图后自动生成，刷新浏览器即可。\n按 Ctrl+C 停止服务。\n'
python3 -m http.server 2611 --bind 127.0.0.1 --directory "$site_dir"
