// main.js — StockFlow Pro v9.4.0
import { produtosPadrao } from './produtos.js';
import {
    STORAGE_KEYS, carregarDados, salvarDados,
    carregarOcultos, salvarOcultos,
    carregarMeus, salvarMeus,
    carregarTema, salvarTema,
    carregarPosicaoLupa, salvarPosicaoLupa,
    dicaSwipeFoiVista, marcarDicaSwipeVista,
    carregarUltimaVersao, salvarUltimaVersao,
    salvarItensLF, salvarOrcamentoLF
} from './storage.js';
import { renderizarListaCompleta, salvarEAtualizar } from './ui.js';
import { coletarDadosDaTabela } from './tabela.js';
import { atualizarPainelCompras, gerarTextoCompras } from './compras.js';
import { darFeedback, obterDataAtual, obterDataAmanha, copiarParaClipboard } from './utils.js';
import { mostrarToast } from './toast.js';
import { mostrarConfirmacao, configurarListenersConfirm, fecharModal } from './confirm.js';
import { abrirCalculadora, fecharCalculadora, calcDigito, calcSalvar, getInputCalculadoraAtual } from './calculadora.js';
import { ativarModoTeclado } from './teclado.js';
import { abrirModalAlerta, fecharModalAlerta, salvarAlerta, verificarAlertas } from './alerta.js';
import { parseAndUpdateQuantity } from './parser.js';
import { initSwipe } from './swipe.js';
import { iniciarNavegacao } from './navegacao.js';
import { alternarCheck, alternarTodos } from './eventos.js';
import { atualizarDropdown } from './dropdown.js';
import { iniciarListaFacil } from './listafacil.js';
import { iniciarCalendario, agendarSnapshot } from './calendario.js';
import { iniciarMassa } from './massa.js';

const VERSAO_ATUAL = "v9.4.0";

const releaseNotes = {
    "v9.4.0": `StockFlow Pro v9.4.0 — Correção de Temas\n\nCorregido o sistema de 4 temas:\n- Tema Arctic (Claro): imagem de fundo agora quase invisível (opacity 0.05 → contraste correto).\n- Todos os temas: opacity da imagem de fundo com transição suave ao trocar de tema.\n- html { transition } adicionado — sem flash nas bordas ao trocar de tema.\n- btn-danger e btn-star corrigidos no tema Arctic.\n- massa.js: imports duplicados mesclados; darFeedback duplo no botão Copiar removido.\n- listafacil.js: AbortController evita acumulação de listeners no modal de orçamento.\n- Versão: v9.3.0 → v9.4.0`,
    "v9.4.0": `StockFlow Pro v9.4.0 — Correções de Bugs\n\n- [CRÍTICO] Corrigido bug em mostrarAlertaElegante: callback destrucivo anterior podia disparar ao clicar OK.\n- [CRÍTICO] Eliminado FOUC (flash escuro) ao carregar a app com tema claro (Arctic/Forest/Midnight) salvo.\n- [MAIOR] Ciclo de dependência circular utils→toast→utils→confirm resolvido.\n- [MAIOR] confirm.js passou a controlar exclusivamente o estado de acaoConfirmacao.\n- Scroll para o topo ao trocar de aba (navegacao.js).\n- Massa: migração automática da chave de storage legada do app standalone.\n- Arctic: contraste do btn-star melhorado (C07000 em vez de FF9F0A).\n- Todos os inline styles residuais de modais e calculadora removidos.\n- sw.js: cache atualizado para v9-4.\n- Versão: v9.3.0 → v9.4.0`,
    "v9.3.0": `StockFlow Pro v9.3.0 — Massa Master\n\n- Nova aba Massa: calculadora proporcional de receita de pizza.\n- Receita base editável (açúcar, sal, fermento, óleo, água) por 1 kg de trigo.\n- Resultados em tempo real com cópia para clipboard.\n- Botão Reset para restaurar padrões de fábrica.\n- Integrado ao sistema de 4 temas e design tokens.\n- Varredura completa: correção do bug de ciclo de temas (TEMA_ALIAS).\n- Inline styles removidos dos modais — classe CSS pura.\n- sw.js atualizado (cache v9-3, massa.js incluso).\n- Versão: v9.2.0 → v9.3.0`,
    "v9.2.0": `StockFlow Pro v9.2.0 — Apple Edition\n\n- Design System com 4 temas: Dark Premium, Midnight OLED, Arctic Silver, Deep Forest.\n- CSS Design Tokens completos (superfícies, bordas, texto, accent, glow).\n- Inner Glows em botões e cards — hover sutil sem mudança brusca de cor.\n- Fonte Inter com fallback San Francisco (sistema Apple).\n- Glassmorphism refinado com backdrop-filter: blur(28px) em todos os painéis.\n- Border radius generoso (10–32px) com sistema de escala.\n- Backup completo: estoque, ocultos, favoritos, Lista Fácil, histórico de preços.\n- Chip visual animado a cada backup automático.\n- Versão: v9.1.0 → v9.2.0`,
    "v9.1.0": `StockFlow Pro v9.1.0\n\n- Auto Save: salvamento automático em cada alteração.\n- Fixação de Data: snapshot diário com histórico de até 60 dias.\n- Ícone calendário 📅 no cabeçalho: abre popup para carregar dados por data.\n- Dias com dados destacados com indicador azul no calendário.\n- Restauração completa de estoque + Lista Fácil a partir de qualquer data salva.\n- Correções de bugs: alerta.js null-guard, swipe, modal.\n- Versão: v9.0.0 → v9.1.0`,
    "v9.0.0": `StockFlow Pro v9.0.0\n\n- Glass morphism em todos os cards.\n- Gauge circular SVG com cor dinâmica.\n- Sparklines de histórico de preços.\n- visualViewport API para iOS.\n- Spring physics no swipe.\n- Compartilhamento nativo.\n- PWA completo.\n- store.js reativo.`,
};

// ── Novidades ─────────────────────────────────────────────────
function verificarNovidades() {
    const ultima = carregarUltimaVersao();
    if (ultima !== VERSAO_ATUAL) {
        if (releaseNotes[VERSAO_ATUAL]) mostrarNovidades(releaseNotes[VERSAO_ATUAL]);
        salvarUltimaVersao(VERSAO_ATUAL);
    }
}
function mostrarNovidades(texto) {
    document.getElementById('whatsnew-content').innerText = texto;
    document.getElementById('modal-whatsnew').style.display = 'flex';
}

// ── Título ────────────────────────────────────────────────────
function atualizarTituloPrincipal() {
    document.getElementById('titulo-principal').innerHTML =
        `StockFlow Pro <span class="version-tag">${VERSAO_ATUAL}</span>`;
}

function atualizarTitulos() {
    document.getElementById("titulo-compras").innerText = "LISTA " + obterDataAmanha();
}

// ── Carregar lista padrão ────────────────────────────────────
function carregarListaPadrao() {
    var listaCombinada = [];
    var ocultosSistema = carregarOcultos();

    if (Array.isArray(produtosPadrao)) {
        produtosPadrao.forEach(p => {
            var d = p.split("|");
            if (!ocultosSistema.includes(d[0].toLowerCase())) {
                listaCombinada.push({ n: d[0], q: "", u: d[1], c: false, min: null, max: null });
            }
        });
    } else {
        ["Arroz|kg","Feijão|kg","Açúcar|kg","Sal|kg","Óleo|uni"].forEach(p => {
            var d = p.split("|");
            listaCombinada.push({ n: d[0], q: "", u: d[1], c: false, min: null, max: null });
        });
    }

    carregarMeus().forEach(item => {
        if (!listaCombinada.some(i => i.n.toLowerCase() === item.n.toLowerCase())) {
            listaCombinada.push({ n: item.n, q: "", u: item.u, c: false, min: null, max: null });
        }
    });

    renderizarListaCompleta(listaCombinada);
}

// ── Filtro ────────────────────────────────────────────────────
function filtrarGeral() {
    var tBusca  = document.getElementById('filtroBusca').value.toLowerCase();
    var tSelect = document.getElementById('filtroSelect').value.toLowerCase();
    document.querySelectorAll("#lista-itens-container tr:not(.categoria-header-row)").forEach(r => {
        var nomEl = r.querySelector(".nome-prod");
        if (!nomEl) return;
        var nome = nomEl.innerText.toLowerCase();
        r.style.display = (nome.includes(tBusca) && (tSelect === "" || nome === tSelect)) ? "" : "none";
    });
    document.querySelectorAll(".categoria-header-row").forEach(header => {
        let prox = header.nextElementSibling;
        let temVisivel = false;
        while (prox && !prox.classList.contains("categoria-header-row")) {
            if (prox.style.display !== "none") { temVisivel = true; break; }
            prox = prox.nextElementSibling;
        }
        header.style.display = temVisivel ? "" : "none";
    });
}

// ── Adicionar item ────────────────────────────────────────────
function adicionarManual(salvarNoPadrao) {
    var p = document.getElementById("novoProduto").value.trim();
    var q = document.getElementById("novoQtd").value.trim();
    var u = document.getElementById("novoUnidade").value;

    if (!p) { mostrarToast("Digite o nome do produto!"); return; }
    darFeedback();

    var dados = carregarDados() || [];
    if (dados.some(item => item.n.toLowerCase() === p.toLowerCase())) {
        mostrarToast("O item já existe na lista!");
        return;
    }

    dados.push({ n: p, q: q, u: u, c: false, min: null, max: null });
    renderizarListaCompleta(dados);
    salvarDados(dados);
    atualizarPainelCompras();
    agendarSnapshot();

    if (salvarNoPadrao) {
        var favs = carregarMeus();
        if (!favs.some(item => item.n.toLowerCase() === p.toLowerCase())) {
            favs.push({ n: p, u: u });
            salvarMeus(favs);
            mostrarToast("Item fixado!");
        }
    }
    document.getElementById("novoProduto").value = "";
    document.getElementById("novoQtd").value = "";
}

function removerDoPadrao() {
    var p = document.getElementById("novoProduto").value.trim();
    if (!p) { mostrarToast("Digite o nome para remover!"); return; }
    darFeedback();
    salvarMeus(carregarMeus().filter(item => item.n.toLowerCase() !== p.toLowerCase()));
    var ocultos = carregarOcultos();
    if (!ocultos.includes(p.toLowerCase())) { ocultos.push(p.toLowerCase()); salvarOcultos(ocultos); }
    document.querySelectorAll("#lista-itens-container tr:not(.categoria-header-row)").forEach(r => {
        var nomEl = r.querySelector(".nome-prod");
        if (nomEl && nomEl.innerText.toLowerCase() === p.toLowerCase()) r.remove();
    });
    const dados = coletarDadosDaTabela();
    salvarDados(dados);
    atualizarPainelCompras();
    atualizarDropdown();
    agendarSnapshot();
    document.getElementById("novoProduto").value = "";
    document.getElementById("novoQtd").value = "";
}

// ── UI helpers ────────────────────────────────────────────────
function alternarLista() {
    darFeedback();
    var tabelaWrapper = document.querySelector(".table-wrapper");
    var btnToggle = document.getElementById("btn-toggle-lista");
    if (tabelaWrapper.style.display === "none") {
        tabelaWrapper.style.display = "block";
        btnToggle.innerHTML = "Ocultar Lista de Estoque";
    } else {
        tabelaWrapper.style.display = "none";
        btnToggle.innerHTML = "Mostrar Lista de Estoque";
    }
}

// ── Sistema de 4 temas ────────────────────────────────────────────────────────
// Ordem de ciclo: dark → midnight → arctic → forest → dark → ...
const TEMAS = [
    { classe: '',                label: 'DARK',     icon: '🌑', nome: 'escuro'   },
    { classe: 'theme-midnight',  label: 'OLED',     icon: '✦',  nome: 'midnight' },
    { classe: 'theme-arctic',    label: 'ARCTIC',   icon: '❄',  nome: 'arctic'   },
    { classe: 'theme-forest',    label: 'FOREST',   icon: '🌿', nome: 'forest'   },
];
const THEME_CLASSES = TEMAS.map(t => t.classe).filter(Boolean);
// Retrocompatibilidade: 'claro' → arctic
const TEMA_ALIAS = { 'claro': 'arctic' }; // 'escuro' é o nome canônico — não precisa de alias

function aplicarTema(nomeTema) {
    // Normaliza alias legados
    const nome = TEMA_ALIAS[nomeTema] !== undefined ? TEMA_ALIAS[nomeTema] : nomeTema;
    const tema  = TEMAS.find(t => t.nome === nome) || TEMAS[0];

    // Remove todas as classes de tema do body
    document.body.classList.remove('light-mode', ...THEME_CLASSES);
    if (tema.classe) document.body.classList.add(tema.classe);
    // Retrocompatibilidade: light-mode = arctic
    if (tema.nome === 'arctic') document.body.classList.add('light-mode');

    // Atualiza botão de tema
    const btn = document.querySelector('.btn-theme');
    if (btn) {
        const iconEl  = btn.querySelector('.btn-theme-icon');
        const labelEl = btn.querySelector('.btn-theme-label');
        if (iconEl)  iconEl.textContent  = tema.icon;
        if (labelEl) labelEl.textContent = tema.label;
    }

    // html background para compatibilidade com body::before
    document.documentElement.style.backgroundColor = '';
    // FOUC cleanup: remove classes provisórias do <html> (JS já aplicou ao body)
    document.documentElement.classList.remove('theme-midnight', 'theme-arctic', 'theme-forest', 'light-mode');

    // html theme-color meta tag para barra do navegador
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        const cores = { '': '#0D0D0F', 'midnight': '#000000', 'arctic': '#F0F0F5', 'forest': '#0A1912' };
        meta.setAttribute('content', cores[tema.nome] || '#0D0D0F');
    }

    salvarTema(tema.nome || 'escuro');
}

function alternarTema() {
    darFeedback();
    if (navigator.vibrate) navigator.vibrate([8,3,8]);
    // Identifica o tema atual pelo nome salvo
    const nomeAtual = carregarTema() || 'escuro';
    const nomeNorm  = TEMA_ALIAS[nomeAtual] !== undefined ? TEMA_ALIAS[nomeAtual] : nomeAtual;
    const idxAtual  = TEMAS.findIndex(t => t.nome === nomeNorm);
    const proximo   = TEMAS[(idxAtual + 1) % TEMAS.length];
    aplicarTema(proximo.nome);
}

function resetarTudo() {
    mostrarConfirmacao("ATENÇÃO: Restaurar lista de fábrica?", () => {
        localStorage.removeItem(STORAGE_KEYS.dados);
        localStorage.removeItem(STORAGE_KEYS.ocultos);
        location.reload();
    });
}

function iniciarNovoDia() {
    mostrarConfirmacao("ZERAR QUANTIDADES?", () => {
        var dados = carregarDados() || [];
        dados.forEach(item => { item.q = ""; item.c = false; });
        salvarDados(dados);
        agendarSnapshot();
        location.reload();
    }, 'sucesso');
}

// ── Exportar / Importar ───────────────────────────────────────
function salvarListaNoCelular() {
    var dados = localStorage.getItem(STORAGE_KEYS.dados);
    if (!dados || dados === "[]") return;
    darFeedback();
    var blob = new Blob([dados], { type: "application/json" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href   = url;
    var data = new Date();
    a.download = `ESTOQUE_${String(data.getDate()).padStart(2,'0')}-${String(data.getMonth()+1).padStart(2,'0')}-${data.getFullYear()}_${String(data.getHours()).padStart(2,'0')}h${String(data.getMinutes()).padStart(2,'0')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function carregarListaDoCelular(event) {
    var f = event.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
        try {
            let dados = JSON.parse(e.target.result);
            dados = dados.map(item => ({
                ...item,
                min: item.min !== undefined ? item.min : null,
                max: item.max !== undefined ? item.max : null
            }));
            localStorage.setItem(STORAGE_KEYS.dados, JSON.stringify(dados));
            agendarSnapshot();
            location.reload();
        } catch (err) {
            mostrarToast("Erro ao carregar arquivo. Verifique se é um JSON válido.");
        }
    };
    r.readAsText(f);
    // Reset file input for re-use
    event.target.value = '';
}

// ── Partilha / Copiar ─────────────────────────────────────────
function autoPreencherUnidade() {
    var inputNome = document.getElementById("novoProduto").value.toLowerCase().trim();
    var match = Array.isArray(produtosPadrao)
        ? produtosPadrao.find(p => p.split("|")[0].toLowerCase().startsWith(inputNome))
        : null;
    if (match) document.getElementById("novoUnidade").value = match.split("|")[1];
}

function compartilharEstoque() { window.open("https://wa.me/?text=" + encodeURIComponent(gerarTextoEstoque()), '_blank'); }
function copiarEstoque()       { copiarParaClipboard(gerarTextoEstoque()); }
function compartilharCompras() { window.open("https://wa.me/?text=" + encodeURIComponent(gerarTextoCompras()), '_blank'); }
function copiarCompras()       { copiarParaClipboard(gerarTextoCompras()); }

function gerarTextoEstoque() {
    let t = "*ESTOQUE " + obterDataAtual() + "*\n\n";
    let itens = [];
    document.querySelectorAll("#lista-itens-container tr:not(.categoria-header-row)").forEach(r => {
        let cols = r.querySelectorAll("td");
        if (!cols.length) return;
        let nomEl = cols[1].querySelector('.nome-prod');
        if (!nomEl) return;
        let nome = nomEl.innerText.replace(/(\r\n|\n|\r)/gm, " ").trim();
        let qTxt = cols[2].querySelector("input")?.value.trim() || '';
        let sel  = cols[3].querySelector("select");
        let unid = sel ? sel.options[sel.selectedIndex].text : '';
        itens.push(qTxt !== "" ? `${nome}: ${qTxt} ${unid}` : `${nome}:   ${unid}`);
    });
    itens.sort();
    itens.forEach(i => t += `${i}\n`);
    return t;
}

// ── Restaurar snapshot (backup completo) ──────────────────────────────────────
function restaurarSnapshot(snap, data) {
    // 1. Estoque principal (inclui marcações de compra c:true e alertas min/max por item)
    if (snap.estoque && Array.isArray(snap.estoque)) {
        salvarDados(snap.estoque);
        renderizarListaCompleta(snap.estoque);
        atualizarDropdown();
        atualizarPainelCompras();
    }
    // 2. Configurações de lista (itens ocultos da lista padrão)
    if (snap.ocultos && Array.isArray(snap.ocultos)) {
        salvarOcultos(snap.ocultos);
    }
    // 3. Favoritos do usuário
    if (snap.meus && Array.isArray(snap.meus)) {
        salvarMeus(snap.meus);
    }
    // 4. Lista Fácil — itens e orçamento
    if (snap.lfItens && Array.isArray(snap.lfItens)) {
        salvarItensLF(snap.lfItens);
    }
    if (typeof snap.lfOrcamento === 'number') {
        salvarOrcamentoLF(snap.lfOrcamento);
    }
    // 5. Histórico de preços (alimenta sparklines da Lista Fácil)
    if (snap.lfHistorico && typeof snap.lfHistorico === 'object') {
        localStorage.setItem(STORAGE_KEYS.lfHistorico, JSON.stringify(snap.lfHistorico));
    }
    // Notifica Lista Fácil para recarregar UI
    document.dispatchEvent(new CustomEvent('snapshotRestored'));
    mostrarToast(`✅ Backup de ${data} restaurado!`);
}

// ── Dica swipe ────────────────────────────────────────────────
function mostrarDicaSwipe() {
    if (!dicaSwipeFoiVista()) {
        setTimeout(() => {
            mostrarToast("Deslize os itens para a esquerda para apagar ou configurar alerta");
            marcarDicaSwipeVista();
        }, 1000);
    }
}

// ── Reconhecimento de voz ─────────────────────────────────────
let recognition = null, isRecording = false, activeField = null;

function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = function() {
        isRecording = true;
        if (activeField === 'produto') {
            document.getElementById('btn-mic-prod').classList.add('ouvindo');
            document.getElementById('novoProduto').placeholder = "Ouvindo...";
        } else if (activeField === 'busca') {
            document.getElementById('btn-mic-busca').classList.add('ouvindo');
            document.getElementById('filtroBusca').placeholder = "Ouvindo...";
        }
    };
    recognition.onend = function() {
        isRecording = false;
        document.getElementById('btn-mic-prod').classList.remove('ouvindo');
        document.getElementById('btn-mic-busca').classList.remove('ouvindo');
        document.getElementById('novoProduto').placeholder = "Item";
        document.getElementById('filtroBusca').placeholder = "Buscar...";
        if (activeField === 'produto') autoPreencherUnidade();
        activeField = null;
    };
    recognition.onerror = function() {
        isRecording = false;
        document.getElementById('btn-mic-prod').classList.remove('ouvindo');
        document.getElementById('btn-mic-busca').classList.remove('ouvindo');
        document.getElementById('novoProduto').placeholder = "Item";
        document.getElementById('filtroBusca').placeholder = "Buscar...";
        activeField = null;
    };
    recognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        let textoFinal = transcript.replace(/\.$/, '');
        if (activeField === 'produto') {
            document.getElementById('novoProduto').value = textoFinal;
        } else if (activeField === 'busca') {
            document.getElementById('filtroBusca').value = textoFinal;
            filtrarGeral();
        }
    };
}

function toggleMic(campo, event) {
    if (event) event.stopPropagation();
    darFeedback();
    if (!recognition) { mostrarToast("Navegador sem suporte a voz."); return; }
    if (isRecording) {
        recognition.stop();
    } else {
        activeField = campo;
        try { recognition.start(); } catch (e) { recognition.stop(); isRecording = false; }
    }
}

// ── Lupa flutuante ────────────────────────────────────────────
let isDragging = false, startX, startY, initialLeft, initialTop, isTouchEvent = false, lastTap = 0, tapTimeout;
const assistiveTouch = document.getElementById('assistive-touch');

function initLupa() {
    const posLupa = carregarPosicaoLupa();
    if (posLupa) {
        assistiveTouch.style.left   = posLupa.left;
        assistiveTouch.style.top    = posLupa.top;
        assistiveTouch.style.bottom = 'auto';
        assistiveTouch.style.right  = 'auto';
    } else {
        assistiveTouch.style.bottom = '20px';
        assistiveTouch.style.right  = '15px';
    }

    assistiveTouch.addEventListener('touchstart', onTouchStart, { passive: false });
    assistiveTouch.addEventListener('touchmove',  onTouchMove,  { passive: false });
    assistiveTouch.addEventListener('touchend',   onTouchEnd,   { passive: false });
    assistiveTouch.addEventListener('click', onClick);
    assistiveTouch.addEventListener('touchstart', onDoubleTapTouchStart);
    assistiveTouch.addEventListener('touchend',   onDoubleTapTouchEnd);
}

function onTouchStart(e) {
    e.preventDefault();
    const touch  = e.touches[0];
    startX = touch.clientX; startY = touch.clientY;
    const rect = assistiveTouch.getBoundingClientRect();
    initialLeft = rect.left; initialTop = rect.top;
    isDragging = false;
}
function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - startX, dy = touch.clientY - startY;
    if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) isDragging = true;
    if (isDragging) {
        let newLeft = Math.max(0, Math.min(initialLeft + dx, window.innerWidth  - assistiveTouch.offsetWidth));
        let newTop  = Math.max(0, Math.min(initialTop  + dy, window.innerHeight - assistiveTouch.offsetHeight));
        assistiveTouch.style.left = newLeft + 'px';
        assistiveTouch.style.top  = newTop  + 'px';
        assistiveTouch.style.bottom = 'auto';
        assistiveTouch.style.right  = 'auto';
    }
}
function onTouchEnd(e) {
    if (isDragging) {
        e.preventDefault();
        salvarPosicaoLupa({ left: assistiveTouch.style.left, top: assistiveTouch.style.top });
    }
    isDragging = false;
}
function onClick(e) {
    if (isTouchEvent || isDragging) { e.preventDefault(); e.stopPropagation(); isTouchEvent = false; return; }
    toggleSearch(e);
}
function onDoubleTapTouchStart() { isTouchEvent = true; }
function onDoubleTapTouchEnd(e) {
    if (isDragging) { e.preventDefault(); e.stopPropagation(); isTouchEvent = false; return; }
    e.preventDefault();
    const now = new Date().getTime();
    if (lastTap && (now - lastTap) < 300) {
        clearTimeout(tapTimeout);
        if (document.getElementById('search-overlay').style.display !== 'block') toggleSearch(null);
        setTimeout(() => toggleMic('busca', null), 150);
        lastTap = 0;
    } else {
        tapTimeout = setTimeout(() => toggleSearch(null), 300);
    }
    lastTap = now;
}

function toggleSearch(event) {
    if (event) event.stopPropagation();
    darFeedback();
    const overlay = document.getElementById('search-overlay');
    if (overlay.style.display === 'block') {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'block';
        overlay.style.top = (window.scrollY + 15) + 'px';
        document.getElementById('filtroBusca').focus();
    }
}

document.addEventListener('click', function(event) {
    const overlay = document.getElementById('search-overlay');
    if (!overlay.contains(event.target) && !assistiveTouch.contains(event.target) && overlay.style.display === 'block') {
        toggleSearch(null);
    }
});
window.addEventListener('scroll', function() {
    const overlay = document.getElementById('search-overlay');
    if (overlay.style.display === 'block') overlay.style.top = (window.scrollY + 15) + 'px';
});

// ── Event Listeners ────────────────────────────────────────────
function configurarEventListeners() {
    document.querySelector('.btn-theme').addEventListener('click', alternarTema);

    // Calculadora estoque
    document.querySelectorAll('[data-calc]').forEach(btn => {
        btn.addEventListener('click', e => {
            const val = e.currentTarget.dataset.calc;
            if (val === 'OK') calcSalvar();
            else calcDigito(val);
        });
    });
    document.querySelector('.calc-close').addEventListener('click', fecharCalculadora);

    // Botões limpar
    document.querySelectorAll('.btn-limpar').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.dataset.limpar;
            if (id) {
                document.getElementById(id).value = '';
                document.getElementById(id).focus();
                if (id === 'filtroBusca') filtrarGeral();
            }
        });
    });

    document.getElementById('btn-mic-prod').addEventListener('click',  e => toggleMic('produto', e));
    document.getElementById('btn-mic-busca').addEventListener('click', e => toggleMic('busca', e));

    document.getElementById('add-btn').addEventListener('click', () => adicionarManual(false));
    document.getElementById('add-star-btn').addEventListener('click', () => adicionarManual(true));
    document.getElementById('remove-star-btn').addEventListener('click', removerDoPadrao);

    document.getElementById('btn-toggle-lista').addEventListener('click', alternarLista);

    document.getElementById('btn-compartilhar-estoque').addEventListener('click', () => { darFeedback(); compartilharEstoque(); });
    document.getElementById('btn-copiar-estoque').addEventListener('click', copiarEstoque);
    document.getElementById('btn-compartilhar-compras').addEventListener('click', () => { darFeedback(); compartilharCompras(); });
    document.getElementById('btn-copiar-compras').addEventListener('click', copiarCompras);

    document.getElementById('btn-novo-dia').addEventListener('click', iniciarNovoDia);
    document.getElementById('btn-exportar').addEventListener('click', salvarListaNoCelular);
    document.getElementById('btn-importar').addEventListener('click', () => { darFeedback(); document.getElementById('input-arquivo').click(); });
    document.getElementById('btn-reset').addEventListener('click', resetarTudo);
    document.getElementById('input-arquivo').addEventListener('change', carregarListaDoCelular);

    document.getElementById('check-todos').addEventListener('change', e => alternarTodos(e.target));

    // Tabela – delegação de eventos (auto-save + snapshot)
    document.getElementById('lista-itens-container').addEventListener('change', e => {
        if (e.target.type === 'checkbox') alternarCheck(e.target);
        if (e.target.classList.contains('select-tabela')) {
            const dados = coletarDadosDaTabela();
            salvarDados(dados);
            atualizarPainelCompras();
            agendarSnapshot();
        }
    });

    document.getElementById('lista-itens-container').addEventListener('blur', e => {
        if (e.target.classList.contains('nome-prod')) {
            salvarEAtualizar();
            agendarSnapshot();
        }
        if (e.target.classList.contains('input-qtd-tabela') && !e.target.hasAttribute('readonly')) {
            parseAndUpdateQuantity(e.target);
            agendarSnapshot();
        }
    }, true);

    document.getElementById('lista-itens-container').addEventListener('click', e => {
        if (e.target.classList.contains('input-qtd-tabela') && e.target.hasAttribute('readonly')) {
            abrirCalculadora(e.target);
        }
    });

    document.getElementById('novoQtd').addEventListener('click', e => {
        if (e.target.hasAttribute('readonly')) abrirCalculadora(e.target);
    });
    document.getElementById('novoQtd').addEventListener('blur', e => {
        if (!e.target.hasAttribute('readonly')) parseAndUpdateQuantity(e.target);
    });

    document.addEventListener('keypress', e => {
        if (e.key === 'Enter' && (e.target.classList.contains('input-qtd-tabela') || e.target.id === 'novoQtd')) {
            e.preventDefault();
            e.target.blur();
        }
    });

    document.getElementById('filtroBusca').addEventListener('input', filtrarGeral);
    document.getElementById('filtroSelect').addEventListener('change', filtrarGeral);

    document.getElementById('btn-scroll-top').addEventListener('click', () => { darFeedback(); window.scrollTo({top:0, behavior:'smooth'}); });
    document.getElementById('btn-scroll-bottom').addEventListener('click', () => { darFeedback(); window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}); });

    document.getElementById('salvar-alerta').addEventListener('click', salvarAlerta);
    document.querySelectorAll('.fechar-modal-alerta').forEach(btn => btn.addEventListener('click', fecharModalAlerta));

    document.getElementById('calc-btn-teclado').addEventListener('click', function(e) {
        e.stopPropagation();
        const input = getInputCalculadoraAtual();
        if (input) { fecharCalculadora(); ativarModoTeclado(input); }
        else mostrarToast("Clique em um campo de quantidade primeiro.");
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal-overlay')) {
            if (e.target.id === 'modal-confirm')  fecharModal();
            if (e.target.id === 'modal-calc')     fecharCalculadora();
            if (e.target.id === 'modal-alerta')   fecharModalAlerta();
            if (e.target.id === 'modal-whatsnew') e.target.style.display = 'none';
        }
    });

    configurarListenersConfirm();

    document.querySelectorAll('.fechar-whatsnew').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('modal-whatsnew').style.display = 'none';
        });
    });
}

// ── Inicialização ──────────────────────────────────────────────
function iniciarApp() {
    initSpeech();
    aplicarTema(carregarTema() || 'escuro');
    atualizarTituloPrincipal();
    atualizarTitulos();
    initLupa();

    var salvos = carregarDados();
    if (salvos && salvos.length > 0) {
        renderizarListaCompleta(salvos);
    } else {
        carregarListaPadrao();
    }

    atualizarDropdown();
    atualizarPainelCompras();
    initSwipe();
    verificarAlertas();
    mostrarDicaSwipe();
    iniciarNavegacao();
    configurarEventListeners();
    iniciarListaFacil();
    iniciarCalendario(restaurarSnapshot);
    iniciarMassa();
    verificarNovidades();
    registrarSW();
    configurarPWABanner();

    // Snapshot inicial ao abrir o app (registra o dia atual)
    agendarSnapshot();
}

// ── Service Worker ─────────────────────────────────────────────
function registrarSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[SW] Registrado:', reg.scope))
            .catch(err => console.warn('[SW] Erro:', err));
    }
}

// ── PWA Banner ─────────────────────────────────────────────────
let deferredPrompt = null;

function configurarPWABanner() {
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        if (!localStorage.getItem('pwaBannerDismissed')) {
            setTimeout(() => mostrarPWABanner(), 3000);
        }
    });
    window.addEventListener('appinstalled', () => {
        ocultarPWABanner();
        mostrarToast('App instalado! 🎉');
    });
}

function mostrarPWABanner() {
    if (document.getElementById('pwa-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-banner';
    banner.innerHTML = `
        <img src="icone.png" class="pwa-banner-icon" alt="StockFlow">
        <div class="pwa-banner-text">
            <strong>Instalar StockFlow Pro</strong>
            <small>Funciona offline · Acesso direto</small>
        </div>
        <button class="pwa-banner-install" id="pwa-install-btn">Instalar</button>
        <button class="pwa-banner-close" id="pwa-close-btn">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        ocultarPWABanner();
        if (outcome === 'accepted') mostrarToast('Instalando...');
    });
    document.getElementById('pwa-close-btn').addEventListener('click', () => {
        localStorage.setItem('pwaBannerDismissed', '1');
        ocultarPWABanner();
    });
}

function ocultarPWABanner() {
    const b = document.getElementById('pwa-banner');
    if (b) b.remove();
}

iniciarApp();
