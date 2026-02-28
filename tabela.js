// tabela.js
export function coletarDadosDaTabela() {
    let dados = [];
    document.querySelectorAll("#lista-itens-container tr:not(.categoria-header-row)").forEach(r => {
        var c = r.querySelectorAll("td");
        if (c.length > 0) {
            let nome = c[1].querySelector('.nome-prod').innerText.replace(/(\r\n|\n|\r)/gm, " ").trim();
            let qtd = c[2].querySelector("input").value.trim();
            let unid = c[3].querySelector("select").value;
            let chk = c[0].querySelector("input[type='checkbox']").checked;
            let min = r.dataset.min ? parseFloat(r.dataset.min) : null;
            let max = r.dataset.max ? parseFloat(r.dataset.max) : null;
            dados.push({ n: nome, q: qtd, u: unid, c: chk, min: min, max: max });
        }
    });
    return dados;
}