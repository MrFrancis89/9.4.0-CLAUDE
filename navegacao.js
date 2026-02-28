// navegacao.js — StockFlow Pro v9.4.0
// CORREÇÃO v9.4.0: scroll para o topo ao trocar de aba.
import { darFeedback } from './utils.js';

export function iniciarNavegacao() {
    const tabs     = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(target + '-section').classList.add('active');
            darFeedback();
            // Scroll para o topo da nova seção sem animação brusca
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: target } }));
        });
    });
}
