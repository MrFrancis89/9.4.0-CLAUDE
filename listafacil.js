// listafacil.js — StockFlow Pro Lista Fácil v2.5.0
// Features v9.0.0: gauge circular SVG, sparklines de preço, visualViewport fix,
// native share, spring-physics swipe, price history, table layout fixo.

import { mostrarToast } from './toast.js';
import { mostrarConfirmacao } from './confirm.js';
import { darFeedback } from './utils.js';
import {
    salvarItensLF, carregarItensLF,
    salvarOrcamentoLF, carregarOrcamentoLF,
    registrarPrecoHistorico, carregarHistoricoItem
} from './storage.js';

export function iniciarListaFacil() {
    const VERSAO_LF = 'v2.5.0';

    // ===== DOM =====
    const tbody         = document.getElementById('lf-tableBody');
    const budgetInline  = document.getElementById('lf-budgetInlineInput');
    const footerBudget  = document.getElementById('lf-footerBudget');
    const footerGasto   = document.getElementById('lf-footerGasto');
    const footerSaldo   = document.getElementById('lf-footerSaldo');
    const fabAdd        = document.getElementById('lf-fabAddItem');
    const versaoEl      = document.getElementById('lf-versaoTitulo');
    const showClLink    = document.getElementById('lf-showChangelog');
    const zerarPrecos   = document.getElementById('lf-zerarPrecosBtn');
    const zerarQtds     = document.getElementById('lf-zerarQuantidadesBtn');
    const zerarItens    = document.getElementById('lf-zerarItensBtn');
    const tabBtns       = document.querySelectorAll('#listafacil-section .lf-tab-btn');
    const tabContents   = document.querySelectorAll('#listafacil-section .lf-tab-content');
    const compP1        = document.getElementById('lf-comp_p1');
    const compQ1        = document.getElementById('lf-comp_q1');
    const compU1        = document.getElementById('lf-comp_u1');
    const compP2        = document.getElementById('lf-comp_p2');
    const compQ2        = document.getElementById('lf-comp_q2');
    const compU2        = document.getElementById('lf-comp_u2');
    const btnComparar   = document.getElementById('lf-btnComparar');
    const resultadoDiv  = document.getElementById('lf-comparadorResultado');
    const calcModal     = document.getElementById('lf-calcModal');
    const calcDisplay   = document.getElementById('lf-calc-display');
    const calcTitle     = document.getElementById('lf-calc-title');
    const closeCalc     = document.getElementById('lf-closeCalc');
    const changelogModal    = document.getElementById('lf-changelogModal');
    const closeChangelog    = document.getElementById('lf-closeChangelog');
    const closeChangelogBtn = document.getElementById('lf-closeChangelogBtn');
    const swipeBg       = document.getElementById('lf-swipe-bg');
    const shareBtn      = document.getElementById('lf-shareBtn');
    const gaugeRing     = document.getElementById('lf-gaugeRing');

    // ===== ESTADO =====
    let itens = [];
    let orcamento = 3200.00;
    let orcamentoAntes = 3200.00;
    let lfCounter = 0;
    let currentPrecoInput = null;
    let calcExpression = '';
    let swipeStartX, swipeStartY, swipeCurrentX;
    let isSwiping = false;
    let swipedRow = null;
    const SWIPE_WIDTH = 80;
    let swipeDocListenerAdded = false;

    // ===== AMOSTRAS =====
    const amostras = [
        { nome: 'Manjericão',       preco: 2.89,  qtd: 4 },
        { nome: 'Mostarda Cepeta',  preco: 17.80, qtd: 2 },
        { nome: 'Água Sani',        preco: 1.69,  qtd: 2 },
        { nome: 'Detergente 500ml', preco: 2.89,  qtd: 3 },
        { nome: 'Coca-Cola 1L',     preco: 5.00,  qtd: 6 },
        { nome: 'São Geraldo 1L',   preco: 4.50,  qtd: 6 },
    ];

    // ===== UTILS MOEDA =====
    function fmtM(v) {
        if (isNaN(v)) v = 0;
        return 'R$\u00a0' + v.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }
    function fmtInput(v) {
        return v.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }
    function parseM(s) {
        if (!s) return 0;
        return parseFloat(String(s).replace(/[R$\u00a0\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    }
    function fmtQtd(q) {
        if (q === null || q === undefined || isNaN(q)) return '0';
        return q % 1 === 0 ? String(Math.round(q)) : q.toFixed(1);
    }

    // ===== PERSISTÊNCIA =====
    function salvar() { salvarItensLF(itens); salvarOrcamentoLF(orcamento); }
    function gerarId() { return 'lf_' + (++lfCounter) + '_' + Date.now(); }

    function carregar() {
        const salvo = carregarItensLF();
        if (salvo) {
            try {
                itens = salvo.map(i => ({
                    lfId:  i.lfId  || gerarId(),
                    nome:  i.nome  || 'Item',
                    preco: typeof i.preco === 'number' ? i.preco : 0,
                    qtd:   typeof i.qtd   === 'number' ? i.qtd   : 0,
                }));
            } catch(e) { itens = amostras.map(a => ({ lfId: gerarId(), ...a })); }
        } else {
            itens = amostras.map(a => ({ lfId: gerarId(), ...a }));
        }
        ordenar();
        orcamento = carregarOrcamentoLF();
        orcamentoAntes = orcamento;
        if (budgetInline) budgetInline.value = fmtInput(orcamento);
    }

    // ===== ORDENAÇÃO E TOTAIS =====
    function ordenar() { itens.sort((a,b) => a.nome.localeCompare(b.nome,'pt',{sensitivity:'base'})); }
    function total() { return itens.reduce((acc,i) => acc + (i.preco * i.qtd), 0); }

    function atualizarTotais() {
        const gasto = total();
        const saldo = orcamento - gasto;
        if (footerBudget) footerBudget.innerText = fmtM(orcamento);
        if (footerGasto)  footerGasto.innerText  = fmtM(gasto);
        if (footerSaldo)  { footerSaldo.innerText = fmtM(saldo); footerSaldo.style.color = saldo >= 0 ? 'var(--btn-green)' : 'var(--btn-red)'; }
        atualizarGauge(gasto, orcamento);
    }

    function atualizarTotalLinha(tr, item) {
        const td = tr.querySelector('.lf-total-cell');
        if (td) td.innerText = fmtM(item.preco * item.qtd);
    }

    // ===== GAUGE CIRCULAR SVG =====
    function atualizarGauge(gasto, orcamento) {
        if (!gaugeRing) return;
        const pct   = orcamento > 0 ? Math.min(gasto / orcamento, 1) : 0;
        const R      = 46;
        const circum = 2 * Math.PI * R;
        const offset = circum * (1 - pct);
        let color = 'var(--btn-blue)';
        let filterColor = '0,122,255';
        if (pct >= 0.85) { color = 'var(--gauge-red)';    filterColor = '255,69,58'; }
        else if (pct >= 0.65) { color = 'var(--gauge-yellow)'; filterColor = '255,159,10'; }
        else if (pct > 0)    { color = 'var(--gauge-green)'; filterColor = '50,215,75'; }

        // Atualiza SVG dinamicamente
        gaugeRing.innerHTML = `
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <!-- Track -->
            <circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>
            <!-- Progress -->
            <circle cx="60" cy="60" r="${R}" fill="none"
              stroke="${color}" stroke-width="10"
              stroke-dasharray="${circum}" stroke-dashoffset="${offset}"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
              filter="url(#glow)"
              style="transition: stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1), stroke 0.4s"/>
            <!-- Texto centro -->
            <text x="60" y="55" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="9" font-family="-apple-system,sans-serif" font-weight="500" letter-spacing="1">GASTO</text>
            <text x="60" y="72" text-anchor="middle" fill="white" font-size="14" font-family="-apple-system,sans-serif" font-weight="700">${(pct*100).toFixed(0)}%</text>
          </svg>`;

        gaugeRing.style.filter = `drop-shadow(0 0 12px rgba(${filterColor},0.50))`;

        // Atualiza classe do saldo
        const saldoEl = document.getElementById('lf-gaugeSaldo');
        if (saldoEl) {
            const saldo = orcamento - gasto;
            saldoEl.innerText = fmtM(saldo);
            saldoEl.className = 'lf-gauge-num-value ' + (saldo >= 0 ? (pct < 0.65 ? 'saldo-ok' : 'saldo-mid') : 'saldo-bad');
        }
        const gastoEl = document.getElementById('lf-gaugeGasto');
        if (gastoEl) gastoEl.innerText = fmtM(gasto);
        // orçamento exibido via budgetInlineInput
    }

    // ===== SPARKLINE SVG =====
    function criarSparkline(nomeItem, precoAtual) {
        const hist = carregarHistoricoItem(nomeItem);
        // Inclui o preço atual se ainda não estiver
        const pontos = [...hist.map(h => h.v), precoAtual].filter(v => v > 0);
        if (pontos.length < 2) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'lf-sparkline-wrapper';

        const W = 56, H = 18;
        const min_ = Math.min(...pontos);
        const max_ = Math.max(...pontos);
        const range = max_ - min_ || 1;
        const xs = pontos.map((_,i) => (i/(pontos.length-1)) * W);
        const ys = pontos.map(v => H - ((v - min_) / range * (H-4)) - 2);
        const path = xs.map((x,i) => `${i===0?'M':'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');

        // Tendência
        const last  = pontos[pontos.length-1];
        const prev  = pontos[pontos.length-2];
        let trendClass = 'lf-trend-flat', trendLabel = '—';
        if (last > prev)  { trendClass = 'lf-trend-up';   trendLabel = `▲ +${((last-prev)/prev*100).toFixed(0)}%`; }
        if (last < prev)  { trendClass = 'lf-trend-down'; trendLabel = `▼ ${((prev-last)/prev*100).toFixed(0)}%`; }

        const color = trendClass === 'lf-trend-up' ? '#FF453A' : trendClass === 'lf-trend-down' ? '#32D74B' : '#98989D';

        const svg = document.createElement('svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.className = 'lf-sparkline';
        svg.innerHTML = `
          <path d="${path}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${xs[xs.length-1].toFixed(1)}" cy="${ys[ys.length-1].toFixed(1)}" r="2.5" fill="${color}"/>`;

        const trend = document.createElement('div');
        trend.className = `lf-sparkline-trend ${trendClass}`;
        trend.textContent = trendLabel;

        wrapper.appendChild(svg);
        wrapper.appendChild(trend);
        return wrapper;
    }

    // ===== RENDERIZAÇÃO =====
    function renderizar() {
        tbody.innerHTML = '';
        ordenar();
        itens.forEach((item, rowIdx) => {
            const tr = document.createElement('tr');
            tr.dataset.lfId = item.lfId;
            tr.style.animationDelay = `${rowIdx * 28}ms`;

            // ── Nome
            const tdNome = document.createElement('td');
            tdNome.className = 'lf-col-prod';
            const nomeInput = document.createElement('input');
            nomeInput.type = 'text';
            nomeInput.className = 'lf-nome-editavel';
            nomeInput.value = item.nome;
            nomeInput.setAttribute('autocomplete','off');
            nomeInput.setAttribute('autocorrect','off');
            nomeInput.setAttribute('spellcheck','false');
            nomeInput.addEventListener('focus', function() {
                darFeedback();
                fixarViewport(this);
            });
            nomeInput.addEventListener('blur', function() {
                const v = this.value.trim();
                if (!v) { this.value = item.nome; return; }
                if (v !== item.nome) { item.nome = v; salvar(); renderizar(); }
            });
            nomeInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nomeInput.blur(); } });
            tdNome.appendChild(nomeInput);

            // ── Preço + sparkline
            const tdPreco = document.createElement('td');
            tdPreco.className = 'lf-col-preco';
            const sparkWrap = criarSparkline(item.nome, item.preco);

            const inputPreco = document.createElement('input');
            inputPreco.type = 'text';
            inputPreco.value = item.preco > 0 ? item.preco.toFixed(2).replace('.', ',') : '0,00';
            inputPreco.className = 'lf-preco-input';
            inputPreco.readOnly = true;
            inputPreco.setAttribute('aria-label', 'Preço — toque para editar');
            inputPreco.addEventListener('click', function() {
                darFeedback();
                currentPrecoInput = this;
                calcExpression = this.value.replace(/\./g,'').replace(',','.') || '0';
                calcDisplay.innerText = calcExpression.replace('.', ',');
                calcTitle.innerText = `🧮 ${item.nome}`;
                calcModal.style.display = 'flex';
            });
            tdPreco.appendChild(inputPreco);
            if (sparkWrap) tdPreco.appendChild(sparkWrap);

            // ── Quantidade
            const tdQtd = document.createElement('td');
            tdQtd.className = 'lf-col-qtd';
            const inputQtd = document.createElement('input');
            inputQtd.type = 'text';
            inputQtd.inputMode = 'numeric';   // teclado numérico iOS
            inputQtd.pattern = '[0-9]*';       // iOS numeric pad
            inputQtd.value = fmtQtd(item.qtd); // inteiro limpo: '0','1','4'...
            inputQtd.className = 'lf-qtd-input';
            inputQtd.setAttribute('aria-label', 'Quantidade');
            inputQtd.addEventListener('focus', function() {
                darFeedback();
                fixarViewport(this);
                // Seleciona tudo ao focar para fácil substituição
                setTimeout(() => this.select(), 10);
            });
            inputQtd.addEventListener('input', function() {
                // Aceita apenas inteiros e decimais com vírgula
                let raw = this.value.replace(',', '.');
                let v = parseFloat(raw);
                if (isNaN(v) || v < 0) v = 0;
                item.qtd = v;
                salvar();
                atualizarTotalLinha(tr, item);
                atualizarTotais();
            });
            inputQtd.addEventListener('blur', function() {
                // Força display limpo: inteiro sem decimal
                this.value = fmtQtd(item.qtd);
            });
            tdQtd.appendChild(inputQtd);

            // ── Total
            const tdTotal = document.createElement('td');
            tdTotal.className = 'lf-col-total lf-total-cell';
            tdTotal.innerText = fmtM(item.preco * item.qtd);

            tr.appendChild(tdNome);
            tr.appendChild(tdPreco);
            tr.appendChild(tdQtd);
            tr.appendChild(tdTotal);
            tbody.appendChild(tr);
        });

        atualizarTotais();
        iniciarSwipe();
    }

    // ===== VISUALVIEWPORT FIX (iOS keyboard) =====
    function fixarViewport(inputEl) {
        if (!window.visualViewport) return;
        const handler = () => {
            const vv = window.visualViewport;
            const offset = window.innerHeight - vv.height;
            if (offset < 50) return;
            const rect = inputEl.getBoundingClientRect();
            const bottomGap = vv.height - rect.bottom;
            if (bottomGap < 80) {
                const scrollBy = 80 - bottomGap;
                window.scrollBy({ top: scrollBy, behavior: 'smooth' });
            }
        };
        window.visualViewport.addEventListener('resize', handler, { once: true });
    }

    // ===== SWIPE (spring physics) =====
    function iniciarSwipe() {
        swipeBg.innerHTML = `<button class="lf-swipe-btn">🗑 Apagar</button>`;
        const rows = document.querySelectorAll('#lf-tableBody tr');

        function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
        function getY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

        // CORREÇÃO: flag isScrolling — uma vez que o gesto é vertical, nunca vira swipe
        let isScrolling = false;
        // Limiar mínimo antes de classificar o gesto (evita jitter)
        const DIRECTION_THRESHOLD = 8;
        // Limiar horizontal mínimo para considerar swipe real
        const SWIPE_THRESHOLD = 20;

        rows.forEach(row => {
            row.addEventListener('touchstart', e => {
                const el = e.target;
                if (el.tagName === 'INPUT') return;
                if (swipedRow && swipedRow !== row) fecharSwipe(swipedRow);
                swipeStartX    = getX(e);
                swipeStartY    = getY(e);
                isSwiping      = false;
                isScrolling    = false;          // reset a cada toque
                swipeCurrentX  = swipedRow === row ? -SWIPE_WIDTH : 0;
                row.style.transition = 'none';
            }, { passive: true });

            row.addEventListener('touchmove', e => {
                const dx = getX(e) - swipeStartX;
                const dy = getY(e) - swipeStartY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                // Aguarda até ter movimento suficiente para classificar o gesto
                if (!isSwiping && !isScrolling) {
                    if (absDx < DIRECTION_THRESHOLD && absDy < DIRECTION_THRESHOLD) return;
                    if (absDy >= absDx) {
                        // Gesto predominantemente vertical → scroll normal, nunca vira swipe
                        isScrolling = true;
                        return;
                    }
                    // Gesto predominantemente horizontal E acima do limiar de swipe
                    if (absDx >= SWIPE_THRESHOLD) {
                        isSwiping = true;
                    }
                }

                if (isScrolling) return;   // scroll detectado: ignora completamente

                if (isSwiping) {
                    if (e.cancelable) e.preventDefault();  // bloqueia scroll só quando é swipe
                    if (document.activeElement) document.activeElement.blur();
                    swipeBg.style.display = 'flex';
                    swipeBg.style.top    = row.offsetTop + 'px';
                    swipeBg.style.height = row.offsetHeight + 'px';
                    let mx = Math.max(-SWIPE_WIDTH, Math.min(0, swipeCurrentX + dx));
                    row.style.transform = `translateX(${mx}px)`;
                }
            }, { passive: false });

            row.addEventListener('touchend', e => {
                if (!isSwiping) return;
                const dx = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - swipeStartX;
                const fin = swipeCurrentX + dx;
                row.classList.add('swipe-spring');
                row.style.transition = 'transform 0.38s cubic-bezier(0.175,0.885,0.32,1.275)';
                if (fin < -36) {
                    row.style.transform = `translateX(-${SWIPE_WIDTH}px)`;
                    swipedRow = row;
                } else {
                    fecharSwipe(row);
                }
                setTimeout(() => row.classList.remove('swipe-spring'), 400);
            });
        });

        if (!swipeDocListenerAdded) {
            document.addEventListener('touchstart', e => {
                if (swipedRow && !swipedRow.contains(e.target) && !e.target.closest('.lf-swipe-btn')) {
                    fecharSwipe(swipedRow);
                }
            }, { passive: true });
            swipeDocListenerAdded = true;
        }

        document.querySelectorAll('.lf-swipe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!swipedRow) return;
                const lfId = swipedRow.dataset.lfId;
                const item = itens.find(i => i.lfId === lfId);
                if (!item) return;
                darFeedback();
                mostrarConfirmacao(`Remover "${item.nome}"?`, () => {
                    itens = itens.filter(i => i.lfId !== lfId);
                    salvar();
                    renderizar();
                    mostrarToast('Item removido');
                });
                fecharSwipe(swipedRow);
            });
        });
    }

    function fecharSwipe(row) {
        if (!row) return;
        row.style.transition = 'transform 0.32s cubic-bezier(0.175,0.885,0.32,1.275)';
        row.style.transform  = 'translateX(0px)';
        setTimeout(() => {
            if (!swipedRow || swipedRow === row) {
                swipeBg.style.display = 'none';
                if (swipedRow === row) swipedRow = null;
            }
        }, 320);
    }

    // ===== CALCULADORA =====
    document.querySelectorAll('#lf-calcModal [data-lf-calc]').forEach(btn => {
        btn.addEventListener('click', () => {
            darFeedback();
            const val = btn.dataset.lfCalc;
            if (val === 'C') {
                calcExpression = '';
            } else if (val === 'BACK') {
                calcExpression = calcExpression.slice(0, -1);
            } else if (val === 'OK') {
                if (currentPrecoInput) {
                    try {
                        let expr = calcExpression.replace(/,/g,'.').replace(/×/g,'*').replace(/÷/g,'/');
                        let res = Function('"use strict";return ('+expr+')')();
                        if (!isFinite(res) || res < 0) throw new Error();
                        res = Math.round(res * 100) / 100;
                        currentPrecoInput.value = res.toFixed(2).replace('.', ',');
                        const lfId = currentPrecoInput.closest('tr')?.dataset.lfId;
                        if (lfId) {
                            const item = itens.find(i => i.lfId === lfId);
                            if (item) {
                                // Haptic forte na confirmação
                                if (navigator.vibrate) navigator.vibrate([10, 5, 10]);
                                item.preco = res;
                                registrarPrecoHistorico(item.nome, res); // histórico
                                salvar();
                                atualizarTotalLinha(currentPrecoInput.closest('tr'), item);
                                atualizarTotais();
                            }
                        }
                    } catch(er) {
                        calcDisplay.innerText = 'Erro';
                        if (navigator.vibrate) navigator.vibrate([50]);
                        setTimeout(() => { calcDisplay.innerText = calcExpression.replace('.', ',') || '0'; }, 800);
                        return;
                    }
                }
                calcModal.style.display = 'none';
                currentPrecoInput = null;
            } else {
                if (val === ',') {
                    if (!calcExpression.includes('.')) calcExpression += '.';
                } else if ((calcExpression === '' || calcExpression === '0') && !isNaN(val) && val !== '') {
                    calcExpression = val;
                } else {
                    calcExpression += val;
                }
            }
            calcDisplay.innerText = calcExpression.replace('.', ',') || '0';
        });
    });

    closeCalc.addEventListener('click', () => { calcModal.style.display='none'; currentPrecoInput=null; });
    calcModal.addEventListener('click', e => { if(e.target===calcModal){calcModal.style.display='none';currentPrecoInput=null;} });

    // ===== COMPARADOR =====
    [compP1, compP2].forEach(inp => {
        inp.addEventListener('click', function() {
            darFeedback();
            currentPrecoInput = this;
            calcExpression = this.value.replace(/\./g,'').replace(',','.') || '0';
            calcDisplay.innerText = calcExpression.replace('.', ',');
            calcTitle.innerText = 'Calculadora';
            calcModal.style.display = 'flex';
        });
    });
    function normUnit(q, u) { return (u==='kg'||u==='l') ? q*1000 : q; }

    btnComparar.addEventListener('click', () => {
        darFeedback();
        const p1=parseM(compP1.value), q1=parseM(compQ1.value), u1=compU1.value;
        const p2=parseM(compP2.value), q2=parseM(compQ2.value), u2=compU2.value;
        if(!p1||!q1||!p2||!q2){ mostrarToast('Preencha todos os campos'); return; }
        const u1n=p1/normUnit(q1,u1), u2n=p2/normUnit(q2,u2);
        if(Math.abs(u1n-u2n)<0.001){
            resultadoDiv.innerHTML='<div class="lf-winner-title">Preços iguais!</div>';
            resultadoDiv.style.display='block'; return;
        }
        const venc = u1n<u2n ? 'Produto 1' : 'Produto 2';
        const eco  = u1n<u2n ? (u2n-u1n)/u2n*100 : (u1n-u2n)/u1n*100;
        resultadoDiv.innerHTML = `
            <div class="lf-winner-title">${venc} é mais barato!</div>
            <div style="color:var(--text-soft);margin:6px 0;font-size:.8rem">Economia de</div>
            <div class="lf-economy-badge">${eco.toFixed(1)}%</div>`;
        resultadoDiv.style.display = 'block';
        if (navigator.vibrate) navigator.vibrate([10, 5, 10]);
    });

    // ===== AÇÕES RÁPIDAS =====
    zerarPrecos.addEventListener('click', () => {
        darFeedback();
        mostrarConfirmacao('Definir todos os preços como R$ 0,00?', () => {
            itens.forEach(i => i.preco = 0); salvar(); renderizar(); mostrarToast('Preços zerados');
        });
    });
    zerarQtds.addEventListener('click', () => {
        darFeedback();
        mostrarConfirmacao('Zerar todas as quantidades?', () => {
            itens.forEach(i => i.qtd = 0); salvar(); renderizar(); mostrarToast('Quantidades zeradas');
        });
    });
    zerarItens.addEventListener('click', () => {
        darFeedback();
        mostrarConfirmacao('Zerar preços e quantidades de todos os itens?', () => {
            itens.forEach(i => { i.preco=0; i.qtd=0; }); salvar(); renderizar(); mostrarToast('Itens zerados');
        });
    });

    // ===== ORÇAMENTO inline no gauge =====
    if (budgetInline) {
        budgetInline.addEventListener('focus', function() { orcamentoAntes=orcamento; this.value=''; });
        budgetInline.addEventListener('input', function() { this.value=this.value.replace(/[^\d,]/g,''); });
        budgetInline.addEventListener('blur', function() {
            const val = this.value.trim();
            if (!val) { this.value = fmtInput(orcamento); return; }
            const novo = parseM(val);
            if (novo === orcamento) { this.value = fmtInput(orcamento); return; }
            const self = this;
            // AbortController garante que listeners antigos sejam removidos
            // antes de registrar os novos — evita acumulação após N cancelamentos.
            if (budgetInline._abortCtrl) budgetInline._abortCtrl.abort();
            budgetInline._abortCtrl = new AbortController();
            const signal = budgetInline._abortCtrl.signal;
            mostrarConfirmacao(`Alterar orçamento para ${fmtM(novo)}?`, () => {
                orcamento = novo; salvar(); atualizarTotais(); self.value = fmtInput(novo);
            });
            document.getElementById('modal-btn-cancel').addEventListener('click', () => {
                self.value = fmtInput(orcamento);
            }, { signal });
            document.getElementById('modal-btn-confirm').addEventListener('click', () => {
                self.value = fmtInput(novo);
            }, { signal });
        });
    }

    // ===== NATIVE SHARE =====
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            darFeedback();
            const linhas = itens.map(i => `${i.nome}: ${fmtM(i.preco * i.qtd)} (${fmtQtd(i.qtd)}x ${fmtM(i.preco)})`).join('\n');
            const texto = `*Lista Fácil — StockFlow Pro*\n\n${linhas}\n\n_Total: ${fmtM(total())} | Orçamento: ${fmtM(orcamento)}_`;

            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Lista Fácil', text: texto });
                    mostrarToast('Lista compartilhada!');
                    return;
                } catch(e) { /* fallback */ }
            }
            // Fallback: cópia para clipboard
            try {
                await navigator.clipboard.writeText(texto);
                mostrarToast('Lista copiada!');
            } catch(e) {
                window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
            }
        });
    }

    // ===== FAB =====
    fabAdd.addEventListener('click', () => {
        darFeedback();
        if (navigator.vibrate) navigator.vibrate([8, 4, 8]);
        itens.push({ lfId: gerarId(), nome: 'Novo item', preco: 0, qtd: 1 });
        salvar(); renderizar(); mostrarToast('Item adicionado');
        setTimeout(() => {
            const ultima = tbody.querySelector('tr:last-child .lf-nome-editavel');
            if (ultima) { ultima.focus(); ultima.select(); }
        }, 100);
    });

    // ===== ABAS INTERNAS =====
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            darFeedback();
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById('lf-tab-' + btn.dataset.lfTab).classList.add('active');
        });
    });

    // ===== CHANGELOG =====
    if (versaoEl) versaoEl.innerText = VERSAO_LF;
    if (showClLink) showClLink.innerText = `📋 ${VERSAO_LF} · Novidades`;
    showClLink.addEventListener('click', () => { darFeedback(); changelogModal.style.display='flex'; });
    closeChangelog.addEventListener('click', () => changelogModal.style.display='none');
    closeChangelogBtn.addEventListener('click', () => changelogModal.style.display='none');
    changelogModal.addEventListener('click', e => { if(e.target===changelogModal) changelogModal.style.display='none'; });

    // ===== FAB visibility via tabChanged =====
    document.addEventListener('tabChanged', e => {
        fabAdd.style.display = e.detail.tab === 'listafacil' ? 'flex' : 'none';
    });

    // ===== INIT =====
    carregar();
    renderizar();
}
