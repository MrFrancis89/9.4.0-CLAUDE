// alerta.js — StockFlow Pro v9.1.0
import { mostrarToast } from './toast.js';
import { salvarDados, STORAGE_KEYS } from './storage.js';
import { coletarDadosDaTabela } from './tabela.js';
import { alternarCheck } from './eventos.js';

let itemAlertaAtual = null;

export function abrirModalAlerta(elemento) {
    let tr;
    if (elemento.tagName === 'TR') {
        tr = elemento;
    } else {
        tr = elemento.closest('tr');
    }
    if (!tr) return;
    itemAlertaAtual = tr;
    let min = tr.dataset.min ? parseFloat(tr.dataset.min) : '';
    let max = tr.dataset.max ? parseFloat(tr.dataset.max) : '';
    document.getElementById('alerta-min').value = min !== '' ? min : '';
    document.getElementById('alerta-max').value = max !== '' ? max : '';
    document.getElementById('modal-alerta').style.display = 'flex';
}

export function fecharModalAlerta() {
    document.getElementById('modal-alerta').style.display = 'none';
    itemAlertaAtual = null;
}

export function salvarAlerta() {
    if (!itemAlertaAtual) return;
    let min = document.getElementById('alerta-min').value;
    let max = document.getElementById('alerta-max').value;
    min = min !== '' ? parseFloat(min) : null;
    max = max !== '' ? parseFloat(max) : null;

    itemAlertaAtual.dataset.min = min !== null ? min : '';
    itemAlertaAtual.dataset.max = max !== null ? max : '';

    const dados = coletarDadosDaTabela();
    salvarDados(dados);
    verificarAlertas();
    fecharModalAlerta();
}

export function verificarAlertas() {
    let dados = [];
    try {
        dados = JSON.parse(localStorage.getItem(STORAGE_KEYS.dados) || "[]");
    } catch(e) { return; }

    dados.forEach(item => {
        if (!item || !item.n) return;
        let qtd = parseFloat((item.q || '').replace(',', '.')) || 0;

        if (item.min !== null && item.min !== undefined && item.min !== '' && qtd < parseFloat(item.min)) {
            mostrarToast(`Estoque baixo: ${item.n}`);
            document.querySelectorAll("#lista-itens-container tr:not(.categoria-header-row)").forEach(r => {
                const nomEl = r.querySelector('.nome-prod');
                if (!nomEl) return;
                const nome = nomEl.innerText.trim();
                if (nome === item.n) {
                    const chk = r.querySelector('input[type="checkbox"]');
                    if (chk && !chk.checked) {
                        chk.checked = true;
                        alternarCheck(chk);
                    }
                }
            });
        }

        if (item.max !== null && item.max !== undefined && item.max !== '' && qtd > parseFloat(item.max)) {
            mostrarToast(`Estoque excessivo: ${item.n}`);
        }
    });
}
