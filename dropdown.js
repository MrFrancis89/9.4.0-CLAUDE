// dropdown.js
export function atualizarDropdown() {
    var select = document.getElementById('filtroSelect');
    if (!select) return;
    var v = select.value;
    select.innerHTML = '<option value="">Todos</option>';
    var nomes = [];
    document.querySelectorAll(".nome-prod").forEach(td => nomes.push(td.innerText.replace(/(\r\n|\n|\r)/gm, " ").trim()));
    nomes.sort().forEach(n => {
        var o = document.createElement("option");
        o.value = n;
        o.text = n;
        select.add(o);
    });
    select.value = v;
}