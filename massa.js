// massa.js — StockFlow Pro v9.4.0
// Calculadora de Receita de Massa de Pizza
// CORREÇÃO v9.4.0: migração do storage key legado 'massaMasterBase' para 'massaMasterBase_v1'.

import { darFeedback }         from './utils.js';
import { mostrarToast }        from './toast.js';
import { copiarParaClipboard } from './utils.js';

// Chave nova (namespace StockFlow). Legado: 'massaMasterBase' (app standalone original).
const STORAGE_KEY = 'massaMasterBase_v1';
const STORAGE_KEY_LEGADO = 'massaMasterBase';

const DEFAULTS = { acucar: 50, sal: 25, fermento: 2.5, oleo: 50, agua: 500 };

// ── Carregar / salvar ─────────────────────────────────────────────────────────
function loadBase() {
    try {
        // Tenta chave nova primeiro
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const d = JSON.parse(saved);
            return {
                acucar:   parseFloat(d.acucar)   || DEFAULTS.acucar,
                sal:      parseFloat(d.sal)       || DEFAULTS.sal,
                fermento: parseFloat(d.fermento)  || DEFAULTS.fermento,
                oleo:     parseFloat(d.oleo)      || DEFAULTS.oleo,
                agua:     parseFloat(d.agua)      || DEFAULTS.agua,
            };
        }
        // MIGRAÇÃO: tenta chave legada do app standalone
        const legado = localStorage.getItem(STORAGE_KEY_LEGADO);
        if (legado) {
            const d = JSON.parse(legado);
            const migrado = {
                acucar:   parseFloat(d.acucar)   || DEFAULTS.acucar,
                sal:      parseFloat(d.sal)       || DEFAULTS.sal,
                fermento: parseFloat(d.fermento)  || DEFAULTS.fermento,
                oleo:     parseFloat(d.oleo)      || DEFAULTS.oleo,
                agua:     parseFloat(d.agua)      || DEFAULTS.agua,
            };
            // Salva na nova chave e remove a legada
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrado));
            localStorage.removeItem(STORAGE_KEY_LEGADO);
            return migrado;
        }
    } catch (e) { /* usa defaults */ }
    return { ...DEFAULTS };
}

function saveBase(base) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(base)); } catch (e) {}
}

// Formata: máx 1 casa decimal, sem ".0" desnecessário
function fmt(n) {
    if (isNaN(n) || n < 0) return '0';
    return Number(n.toFixed(1)).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

// ── Módulo principal ──────────────────────────────────────────────────────────
export function iniciarMassa() {
    const trigoInput   = document.getElementById('massa-trigoInput');
    const btnToggle    = document.getElementById('massa-btnToggleEdit');
    const editPanel    = document.getElementById('massa-editPanel');
    const editAcucar   = document.getElementById('massa-editAcucar');
    const editSal      = document.getElementById('massa-editSal');
    const editFermento = document.getElementById('massa-editFermento');
    const editOleo     = document.getElementById('massa-editOleo');
    const editAgua     = document.getElementById('massa-editAgua');
    const resAcucar    = document.getElementById('massa-res-acucar');
    const resSal       = document.getElementById('massa-res-sal');
    const resFermento  = document.getElementById('massa-res-fermento');
    const resOleo      = document.getElementById('massa-res-oleo');
    const resAgua      = document.getElementById('massa-res-agua');
    const btnCopy      = document.getElementById('massa-btnCopy');
    const btnReset     = document.getElementById('massa-btnReset');

    if (!trigoInput) return;

    // Carrega base (com migração automática se necessário)
    const base = loadBase();
    editAcucar.value   = base.acucar;
    editSal.value      = base.sal;
    editFermento.value = base.fermento;
    editOleo.value     = base.oleo;
    editAgua.value     = base.agua;

    // ── Core ──────────────────────────────────────────────────────────────────
    function getRatios() {
        return {
            acucar:   parseFloat(editAcucar.value)   || 0,
            sal:      parseFloat(editSal.value)       || 0,
            fermento: parseFloat(editFermento.value)  || 0,
            oleo:     parseFloat(editOleo.value)      || 0,
            agua:     parseFloat(editAgua.value)      || 0,
        };
    }

    function updateResults() {
        const trigo = parseFloat((trigoInput.value || '0').replace(',', '.')) || 0;
        const r = getRatios();
        resAcucar.textContent   = fmt(trigo * r.acucar);
        resSal.textContent      = fmt(trigo * r.sal);
        resFermento.textContent = fmt(trigo * r.fermento);
        resOleo.textContent     = fmt(trigo * r.oleo);
        resAgua.textContent     = fmt(trigo * r.agua);
    }

    function handleBaseChange() {
        saveBase(getRatios());
        updateResults();
    }

    // ── Eventos ───────────────────────────────────────────────────────────────
    trigoInput.addEventListener('input', updateResults);

    [editAcucar, editSal, editFermento, editOleo, editAgua].forEach(inp => {
        inp.addEventListener('input', handleBaseChange);
    });

    btnToggle.addEventListener('click', () => {
        darFeedback();
        const hidden = editPanel.classList.toggle('massa-hidden');
        btnToggle.innerHTML = hidden
            ? '<span class="massa-btn-icon">⚙️</span> Editar receita base (por 1kg)'
            : '<span class="massa-btn-icon">🔽</span> Ocultar edição';
    });

    btnCopy.addEventListener('click', () => {
        const trigo = parseFloat((trigoInput.value || '0').replace(',', '.')) || 0;
        if (trigo <= 0) {
            mostrarToast('Digite a quantidade de trigo primeiro.');
            return;
        }
        darFeedback();
        const texto =
            `🍕 Receita para ${trigoInput.value}kg de Trigo:\n\n` +
            `• Açúcar:      ${resAcucar.textContent}g\n` +
            `• Sal:         ${resSal.textContent}g\n` +
            `• Fermento:    ${resFermento.textContent}g\n` +
            `• Óleo:        ${resOleo.textContent}g\n` +
            `• Água gelada: ${resAgua.textContent}ml`;
        copiarParaClipboard(texto);
    });

    btnReset.addEventListener('click', () => {
        darFeedback();
        editAcucar.value   = DEFAULTS.acucar;
        editSal.value      = DEFAULTS.sal;
        editFermento.value = DEFAULTS.fermento;
        editOleo.value     = DEFAULTS.oleo;
        editAgua.value     = DEFAULTS.agua;
        handleBaseChange();
        mostrarToast('Receita base restaurada para os padrões.');
    });

    document.addEventListener('tabChanged', e => {
        if (e.detail.tab === 'massa') updateResults();
    });

    updateResults();
}
