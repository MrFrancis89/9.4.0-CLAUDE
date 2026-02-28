// toast.js — StockFlow Pro v9.4.0
// CORREÇÃO v9.4.0: mostrarAlertaElegante removido daqui e movido para confirm.js.
// Mantém apenas mostrarToast (notificação não bloqueante).

export function mostrarToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
