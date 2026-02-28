# Changelog — StockFlow Pro

## v9.4.0 — 28/02/2026 — Correcoes de Bugs

### Bugs criticos corrigidos

**[CRITICO] mostrarAlertaElegante disparava callback destrutivo anterior**
- toast.js usava window.acaoConfirmacao = null, que nao afetava a variavel de escopo de modulo privada em confirm.js.
- Fix: mostrarAlertaElegante migrada para confirm.js. toast.js simplificado.

**[CRITICO] Dependencia circular utils -> toast -> utils -> confirm resolvida**
- utils.js agora importa mostrarAlertaElegante de confirm.js, nao de toast.js.

**[MAJOR] FOUC — flash do tema escuro ao carregar com tema salvo**
- Script inline no head aplica classe ao html antes do primeiro render.
- aplicarTema() limpa as classes do html apos aplica-las ao body.

**[MAJOR] Trocas de aba nao faziam scroll para o topo — corrigido em navegacao.js**

### Melhorias de tema
- Arctic Silver: btn-star escurecido para #C07000 (contraste 4.6:1 sobre branco).
- Modal inputs: classe .modal-input com tokens de tema corretos.
- 18 inline styles migrados para classes CSS puras.

### Aba Massa
- Migracao automatica da chave de storage legada massaMasterBase -> massaMasterBase_v1.

### Outros
- sw.js: cache stockflow-v9-4.
- confirm.js: botoes usam className (.perigo/.sucesso/.alerta) nao style.backgroundColor.

---

## v9.3.0 — 28/02/2026
### Novas funcionalidades
- **Aba Massa Master** — calculadora proporcional de receita de pizza.
  - Receita base editável (açúcar, sal, fermento, óleo, água) por 1 kg de trigo.
  - Resultados em tempo real ao digitar a quantidade de trigo.
  - Botão "Copiar Receita" envia o texto formatado para o clipboard.
  - Botão "Padrão" restaura os valores de fábrica.
  - Base salva automaticamente no localStorage (chave `massaMasterBase_v1`).
- Atalho PWA "Massa Master" adicionado ao manifest.json.

### Correções de bugs
- **Bug crítico de temas** — `TEMA_ALIAS` mapeava `'escuro': ''`, fazendo `findIndex` retornar `-1` e o ciclo de 4 temas nunca avançar. Removida a entrada desnecessária.
- **dropdown.js** — primeiro option exibia "ITENS" (inconsistente com o HTML que usa "Todos").
- **eventos.js** — `alternarTodos()` adicionou null-guard para o elemento checkbox antes de acessar `.checked`.
- **inline styles** — todos os `style="..."` nos botões dos modais foram migrados para classes CSS puras, permitindo adaptação correta a todos os 4 temas.
- **sw.js** — cache atualizado para `stockflow-v9-3`, `massa.js` adicionado à lista de assets para uso offline.

---

## v9.2.0 — Apple Edition
- Design System com 4 temas: Dark Premium, Midnight OLED, Arctic Silver, Deep Forest.
- CSS Design Tokens completos via Custom Properties.
- Inner Glows, glassmorphism, Inter font, border radius system.
- Backup completo com 6 campos (estoque, ocultos, meus, lfItens, lfOrcamento, lfHistorico).
- Chip visual animado a cada backup automático.

## v9.1.0
- Auto Save com debounce de 2,5s.
- Snapshots diários com histórico de 60 dias.
- Popup calendário para restauração de backups por data.
- Correções: alerta.js null-guard, swipe, modal.

## v9.0.0
- Glass morphism, Gauge circular SVG, Sparklines.
- visualViewport API para iOS.
- Spring physics no swipe.
- Compartilhamento nativo + PWA completo.
