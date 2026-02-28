// storage.js — StockFlow Pro v9.2.0
// Snapshot cobre TODOS os dados editáveis:
//   estoque    → array de itens { n, q, u, c, min, max }
//                 c:true = marcado para comprar | min/max = limites de alerta
//   ocultos    → itens removidos da lista padrão pelo usuário
//   meus       → itens favoritos adicionados pelo usuário
//   lfItens    → array da Lista Fácil { lfId, nome, preco, qtd }
//   lfOrcamento→ orçamento numérico da Lista Fácil
//   lfHistorico→ histórico de preços por produto (alimenta sparklines)

export const STORAGE_KEYS = {
    dados:        'estoqueDados_v4_categorias',
    ocultos:      'itensOcultosPadrao_v4',
    meus:         'meusItensPadrao_v4',
    tema:         'temaEstoque',
    lupaPos:      'lupaPosicao_v1',
    dicaSwipe:    'dicaSwipeMostrada',
    ultimaVersao: 'stockflow_ultima_versao',
    lfItens:      'listaFacil_itens_v1',
    lfOrcamento:  'listaFacil_orcamento_v1',
    lfHistorico:  'listaFacil_historico_v1',
    snapshots:    'stockflow_snapshots_v1',
};

// ── Estoque ─────────────────────────────────────────────────────────────────
export function salvarDados(d)       { localStorage.setItem(STORAGE_KEYS.dados, JSON.stringify(d)); }
export function carregarDados()      { const s = localStorage.getItem(STORAGE_KEYS.dados); return s ? JSON.parse(s) : null; }

// ── Configurações de lista ───────────────────────────────────────────────────
export function salvarOcultos(o)     { localStorage.setItem(STORAGE_KEYS.ocultos, JSON.stringify(o)); }
export function carregarOcultos()    { return JSON.parse(localStorage.getItem(STORAGE_KEYS.ocultos) || '[]'); }
export function salvarMeus(m)        { localStorage.setItem(STORAGE_KEYS.meus, JSON.stringify(m)); }
export function carregarMeus()       { return JSON.parse(localStorage.getItem(STORAGE_KEYS.meus) || '[]'); }

// ── UI / Tema ────────────────────────────────────────────────────────────────
export function salvarTema(modo)       { localStorage.setItem(STORAGE_KEYS.tema, modo); }
export function carregarTema()         { return localStorage.getItem(STORAGE_KEYS.tema); }
export function salvarPosicaoLupa(p)   { localStorage.setItem(STORAGE_KEYS.lupaPos, JSON.stringify(p)); }
export function carregarPosicaoLupa()  { const p = localStorage.getItem(STORAGE_KEYS.lupaPos); return p ? JSON.parse(p) : null; }
export function marcarDicaSwipeVista() { localStorage.setItem(STORAGE_KEYS.dicaSwipe, 'true'); }
export function dicaSwipeFoiVista()    { return !!localStorage.getItem(STORAGE_KEYS.dicaSwipe); }
export function salvarUltimaVersao(v)  { localStorage.setItem(STORAGE_KEYS.ultimaVersao, v); }
export function carregarUltimaVersao() { return localStorage.getItem(STORAGE_KEYS.ultimaVersao); }

// ── Lista Fácil ──────────────────────────────────────────────────────────────
export function salvarItensLF(itens)   { localStorage.setItem(STORAGE_KEYS.lfItens, JSON.stringify(itens)); }
export function carregarItensLF()      { const s = localStorage.getItem(STORAGE_KEYS.lfItens); return s ? JSON.parse(s) : null; }
export function salvarOrcamentoLF(v)   { localStorage.setItem(STORAGE_KEYS.lfOrcamento, String(v)); }
export function carregarOrcamentoLF()  { const v = localStorage.getItem(STORAGE_KEYS.lfOrcamento); return v ? (parseFloat(v) || 3200) : 3200; }

// ── Histórico de preços (sparklines) ─────────────────────────────────────────
const MAX_HIST = 6;
export function registrarPrecoHistorico(nomeItem, preco) {
    if (!nomeItem || preco <= 0) return;
    let h = {};
    try { h = JSON.parse(localStorage.getItem(STORAGE_KEYS.lfHistorico) || '{}'); } catch (e) { h = {}; }
    const k = nomeItem.toLowerCase().trim();
    if (!h[k]) h[k] = [];
    const hoje = new Date().toLocaleDateString('pt-BR');
    const last = h[k][h[k].length - 1];
    if (last && last.d === hoje && last.v === preco) return;
    h[k].push({ d: hoje, v: preco });
    if (h[k].length > MAX_HIST) h[k] = h[k].slice(-MAX_HIST);
    localStorage.setItem(STORAGE_KEYS.lfHistorico, JSON.stringify(h));
}
export function carregarHistoricoItem(nomeItem) {
    try {
        const h = JSON.parse(localStorage.getItem(STORAGE_KEYS.lfHistorico) || '{}');
        return h[nomeItem.toLowerCase().trim()] || [];
    } catch (e) { return []; }
}

// ── Sistema de Snapshots (backup completo) ────────────────────────────────────
// Aceita um objeto com TODOS os campos editáveis do app.
// Campos restauráveis:
//   estoque     — array de itens do estoque (inclui c/min/max por item)
//   ocultos     — itens ocultos da lista padrão
//   meus        — favoritos do usuário
//   lfItens     — itens da Lista Fácil
//   lfOrcamento — orçamento da Lista Fácil
//   lfHistorico — histórico de preços (objeto { chave: [{d,v},...] })
const MAX_SNAPSHOTS = 60;

export function salvarSnapshot(payload) {
    let snaps = {};
    try { snaps = JSON.parse(localStorage.getItem(STORAGE_KEYS.snapshots) || '{}'); } catch (e) { snaps = {}; }

    const hoje = new Date().toLocaleDateString('pt-BR');
    snaps[hoje] = {
        ts:          Date.now(),
        estoque:     Array.isArray(payload.estoque)      ? payload.estoque      : [],
        ocultos:     Array.isArray(payload.ocultos)      ? payload.ocultos      : [],
        meus:        Array.isArray(payload.meus)         ? payload.meus         : [],
        lfItens:     Array.isArray(payload.lfItens)      ? payload.lfItens      : [],
        lfOrcamento: (typeof payload.lfOrcamento === 'number') ? payload.lfOrcamento : 3200,
        lfHistorico: (payload.lfHistorico && typeof payload.lfHistorico === 'object') ? payload.lfHistorico : {},
    };

    // Mantém apenas os últimos MAX_SNAPSHOTS dias
    const chaves = Object.keys(snaps).sort((a, b) => snaps[a].ts - snaps[b].ts);
    if (chaves.length > MAX_SNAPSHOTS) {
        chaves.slice(0, chaves.length - MAX_SNAPSHOTS).forEach(k => delete snaps[k]);
    }

    localStorage.setItem(STORAGE_KEYS.snapshots, JSON.stringify(snaps));
}

export function carregarSnapshot(dataStr) {
    try {
        const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.snapshots) || '{}');
        return s[dataStr] || null;
    } catch (e) { return null; }
}

export function listarDatasComSnapshot() {
    try { return Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEYS.snapshots) || '{}')); }
    catch (e) { return []; }
}
