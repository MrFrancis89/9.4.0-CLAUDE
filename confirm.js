// confirm.js — StockFlow Pro v9.4.0
// Responsabilidades:
//   - Modal de confirmação com callback tipado (perigo / sucesso)
//   - mostrarAlertaElegante: alerta sem callback (antes em toast.js — BUG FIX v9.4.0)
//   - Ouve evento 'modal:alert' de utils.js para exibir alertas sem dependência circular
//
// GRAFO DE DEPENDÊNCIAS (sem circular):
//   confirm.js → utils.js → toast.js
//   utils.js → [evento DOM] → confirm.js  (desacoplado, sem import)

import { darFeedback } from './utils.js';

let acaoConfirmacao = null;

// ── Confirmação com callback ──────────────────────────────────────────────────
export function mostrarConfirmacao(msg, callback, tipoBotao = 'perigo') {
    darFeedback();
    _abrirModal(msg, true, tipoBotao);
    acaoConfirmacao = callback;
}

// ── Alerta simples (sem callback) ─────────────────────────────────────────────
// BUG FIX v9.4.0: antes em toast.js usava window.acaoConfirmacao = null, que
// não afetava a variável de escopo de módulo — o callback anterior disparava ao clicar OK.
export function mostrarAlertaElegante(msg) {
    _abrirModal(msg, false, 'alerta');
    acaoConfirmacao = null; // módulo correto — callback realmente zerado
}

// ── API interna ───────────────────────────────────────────────────────────────
function _abrirModal(msg, mostrarCancelar, tipoBotao) {
    document.getElementById('modal-text').innerText = msg;
    const btnCancel  = document.getElementById('modal-btn-cancel');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    btnCancel.style.display  = mostrarCancelar ? 'block' : 'none';
    btnCancel.innerText      = 'Cancelar';
    btnConfirm.style.display = 'block';
    btnConfirm.innerText     = mostrarCancelar ? 'Confirmar' : 'OK';
    // Classe CSS determina a cor — sem style.backgroundColor (BUG FIX)
    btnConfirm.className     = 'modal-btn-confirmar ' + tipoBotao;
    document.getElementById('modal-confirm').style.display = 'flex';
}

export function fecharModal() {
    document.getElementById('modal-confirm').style.display = 'none';
    acaoConfirmacao = null;
}

export function configurarListenersConfirm() {
    document.getElementById('modal-btn-confirm').addEventListener('click', () => {
        darFeedback();
        if (typeof acaoConfirmacao === 'function') acaoConfirmacao();
        fecharModal();
    });
    document.getElementById('modal-btn-cancel').addEventListener('click', () => {
        darFeedback();
        fecharModal();
    });

    // Ouve evento de utils.js (copiarFallback) sem criar import circular
    document.addEventListener('modal:alert', e => {
        mostrarAlertaElegante(e.detail?.msg || 'Erro.');
    });
}
