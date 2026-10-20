#!/usr/bin/env bash
# Gera docs/Relatorio_de_Bugs.pdf e docs/img/capa-relatorio.png a partir dos HTML desta pasta.
#
# Uso: docs/relatorio/gerar.sh
# Requer um Chrome ou Chromium recente (rodapé com número de página usa @page margin boxes,
# Chrome 131+). Para escolher o binário: CHROME=/caminho/do/chrome docs/relatorio/gerar.sh
# As fontes Inter e JetBrains Mono vêm do Google Fonts, então a geração precisa de rede.
set -euo pipefail

cd "$(dirname "$0")"
chrome=${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)}
[ -n "$chrome" ] || { echo "Chrome/Chromium não encontrado; defina CHROME" >&2; exit 1; }

opcoes=(--headless --disable-gpu --hide-scrollbars --virtual-time-budget=10000)

"$chrome" "${opcoes[@]}" --window-size=1920,1080 \
  --screenshot="$PWD/../img/capa-relatorio.png" "file://$PWD/capa.html"

"$chrome" "${opcoes[@]}" --no-pdf-header-footer \
  --print-to-pdf="$PWD/../Relatorio_de_Bugs.pdf" "file://$PWD/relatorio.html"
