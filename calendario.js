// calendario.js — StockFlow Pro v9.2.0
// Responsabilidades:
//   agendarSnapshot() — debounce 2.5s, coleta TODOS os dados editáveis e salva
//   mostrarChipBackup() — aviso visual animado após cada backup automático
//   iniciarCalendario() — botão no header + popup de grid de meses

import { darFeedback } from './utils.js';
import { mostrarConfirmacao } from './confirm.js';
import {
    STORAGE_KEYS,
    carregarSnapshot,
    listarDatasComSnapshot,
    salvarSnapshot,
} from './storage.js';

let popupEl       = null;
let mesAtual      = new Date();
let callbackRestaurar = null;

// ── Chip visual de backup automático ─────────────────────────────────────────
// Criado e destruído dinamicamente; nunca se acumula.
function mostrarChipBackup() {
    // Remove chip anterior se ainda visível (não empilha)
    const prev = document.getElementById('autosave-chip');
    if (prev) prev.remove();

    const chip = document.createElement('div');
    chip.id = 'autosave-chip';
    chip.setAttribute('aria-live', 'polite');
    chip.setAttribute('role', 'status');
    chip.innerHTML = '<span class="chip-icon">💾</span><span class="chip-text">Backup salvo</span>';
    document.body.appendChild(chip);

    // Força reflow para a animação de entrada disparar
    chip.getBoundingClientRect();
    chip.classList.add('chip-visible');

    // Sai após 2.8 s
    setTimeout(() => {
        chip.classList.remove('chip-visible');
        chip.addEventListener('transitionend', () => chip.remove(), { once: true });
        // Fallback caso transitionend não dispare
        setTimeout(() => { if (chip.parentNode) chip.remove(); }, 500);
    }, 2800);
}

// ── Debounce para auto-snapshot ──────────────────────────────────────────────
// Coleta TODOS os dados editáveis do localStorage e salva em um único objeto.
let _snapTimer = null;
export function agendarSnapshot() {
    if (_snapTimer) clearTimeout(_snapTimer);
    _snapTimer = setTimeout(() => {
        try {
            const payload = {
                estoque:     JSON.parse(localStorage.getItem(STORAGE_KEYS.dados)       || '[]'),
                ocultos:     JSON.parse(localStorage.getItem(STORAGE_KEYS.ocultos)     || '[]'),
                meus:        JSON.parse(localStorage.getItem(STORAGE_KEYS.meus)        || '[]'),
                lfItens:     JSON.parse(localStorage.getItem(STORAGE_KEYS.lfItens)     || '[]'),
                lfOrcamento: parseFloat(localStorage.getItem(STORAGE_KEYS.lfOrcamento) || '3200'),
                lfHistorico: JSON.parse(localStorage.getItem(STORAGE_KEYS.lfHistorico) || '{}'),
            };
            salvarSnapshot(payload);
            mostrarChipBackup();
        } catch (e) {
            console.warn('[Snapshot] Erro ao salvar backup:', e);
        }
    }, 2500);
}

// ── Inicialização ─────────────────────────────────────────────────────────────
export function iniciarCalendario(onRestore) {
    callbackRestaurar = onRestore;

    const btn = document.getElementById('btn-calendario');
    if (!btn) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        darFeedback();
        if (popupEl && popupEl.style.display !== 'none') {
            fecharCalendario();
        } else {
            mesAtual = new Date();
            abrirCalendario(btn);
        }
    });

    // Fecha ao clicar fora do popup
    document.addEventListener('click', e => {
        if (
            popupEl &&
            popupEl.style.display !== 'none' &&
            !popupEl.contains(e.target) &&
            !e.target.closest('#btn-calendario')
        ) {
            fecharCalendario();
        }
    }, true);
}

// ── Abrir / fechar ────────────────────────────────────────────────────────────
function abrirCalendario(anchor) {
    if (!popupEl) {
        popupEl = document.createElement('div');
        popupEl.id = 'calendario-popup';
        popupEl.className = 'calendario-popup';
        document.body.appendChild(popupEl);
    }
    renderCalendario();
    popupEl.style.display = 'block';

    // Posiciona abaixo do botão, ajusta se sair da tela
    const rect = anchor.getBoundingClientRect();
    const popW = 272;
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;
    popupEl.style.top  = (rect.bottom + 8 + window.scrollY) + 'px';
    popupEl.style.left = left + 'px';
}

export function fecharCalendario() {
    if (popupEl) popupEl.style.display = 'none';
}

// ── Render do grid mensal ─────────────────────────────────────────────────────
function renderCalendario() {
    const datas   = listarDatasComSnapshot();
    const ano     = mesAtual.getFullYear();
    const mes     = mesAtual.getMonth();
    const hojeStr = fmt(new Date());
    const primDia = new Date(ano, mes, 1).getDay();
    const ndias   = new Date(ano, mes + 1, 0).getDate();

    const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const SEMS  = ['D','S','T','Q','Q','S','S'];

    let html = `
      <div class="cal-header">
        <button class="cal-nav" id="cal-prev" aria-label="Mês anterior">&#8249;</button>
        <span class="cal-title">${MESES[mes]} ${ano}</span>
        <button class="cal-nav" id="cal-next" aria-label="Próximo mês">&#8250;</button>
      </div>
      <div class="cal-dow-row">${SEMS.map(s => `<span>${s}</span>`).join('')}</div>
      <div class="cal-grid">`;

    for (let i = 0; i < primDia; i++) html += `<span class="cal-cell cal-empty"></span>`;

    for (let d = 1; d <= ndias; d++) {
        const ds  = fmt(new Date(ano, mes, d));
        const tem = datas.includes(ds);
        const eh  = ds === hojeStr;
        html += `<span class="cal-cell${eh ? ' cal-hoje' : ''}${tem ? ' cal-tem-dado' : ''}" data-d="${ds}">${d}${tem ? '<i></i>' : ''}</span>`;
    }

    html += `</div>`;
    html += datas.length === 0
        ? `<p class="cal-hint">Os dados serão salvos automaticamente ao editar.</p>`
        : `<p class="cal-hint">${datas.length} dia(s) com backup</p>`;

    popupEl.innerHTML = html;

    // Navegação entre meses
    popupEl.querySelector('#cal-prev').addEventListener('click', e => {
        e.stopPropagation();
        darFeedback();
        mesAtual = new Date(ano, mes - 1, 1);
        renderCalendario();
    });
    popupEl.querySelector('#cal-next').addEventListener('click', e => {
        e.stopPropagation();
        darFeedback();
        mesAtual = new Date(ano, mes + 1, 1);
        renderCalendario();
    });

    // Clique em dia com backup → confirma restauração
    popupEl.querySelectorAll('.cal-tem-dado').forEach(el => {
        el.addEventListener('click', e => {
            e.stopPropagation();
            const data = el.dataset.d;
            const snap = carregarSnapshot(data);
            if (!snap) return;
            darFeedback();

            // Resumo do que será restaurado
            const nEst = Array.isArray(snap.estoque) ? snap.estoque.length : 0;
            const nLF  = Array.isArray(snap.lfItens) ? snap.lfItens.length : 0;
            const nComp = Array.isArray(snap.estoque) ? snap.estoque.filter(i => i.c).length : 0;
            mostrarConfirmacao(
                `Restaurar backup de ${data}?\n\n` +
                `📦 ${nEst} itens no estoque\n` +
                `🛒 ${nComp} na lista de compras\n` +
                `🛍 ${nLF} na Lista Fácil`,
                () => {
                    if (callbackRestaurar) callbackRestaurar(snap, data);
                    fecharCalendario();
                }
            );
        });
    });
}

function fmt(d) {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
