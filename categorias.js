// categorias.js
export const mapaCategorias = {
    'temperos': ['orégano', 'pimenta', 'canela', 'colorau', 'caldo', 'tempero', 'ervas', 'salsa', 'cebolinha', 'cominho', 'açafrão', 'páprica', 'curry'],
    'limpeza': ['detergente', 'sabão', 'esponja', 'água sanitária', 'desinfetante', 'papel', 'saco', 'lixo', 'bucha', 'álcool', 'limpador', 'multiuso', 'pano', 'vassoura'],
    'carnes': ['carne', 'frango', 'bacon', 'calabresa', 'presunto', 'peixe', 'hamburguer', 'linguiça', 'strogonoff', 'costela', 'bife'],
    'laticinios': ['queijo', 'mussarela', 'cheddar', 'requeijão', 'catupiry', 'leite', 'manteiga', 'iogurte', 'creme de leite', 'parmesão', 'provolone', 'gorgonzola'],
    'hortifruti': ['tomate', 'cebola', 'alho', 'batata', 'banana', 'limão', 'alface', 'rúcula', 'manjericão', 'pimentão', 'cenoura', 'azeitona', 'milho', 'ervilha', 'palmito', 'cogumelo', 'champignon', 'fruta', 'abacaxi', 'uva'],
    'mercearia': ['arroz', 'feijão', 'trigo', 'farinha', 'açúcar', 'sal', 'macarrão', 'óleo', 'azeite', 'fermento', 'fubá', 'molho', 'extrato', 'passata', 'ketchup', 'maionese', 'mostarda', 'chocolate', 'café', 'pão'],
    'bebidas': ['refrigerante', 'coca', 'guaraná', 'suco', 'água', 'cerveja', 'vinho', 'vodka', 'whisky', 'gelo', 'polpa'],
    'embalagens': ['caixa', 'sacola', 'plástico', 'filme', 'alumínio', 'isopor', 'guardanapo', 'canudo', 'copo']
};

export const coresCategorias = {
    'carnes': 'var(--cat-carnes)', 'laticinios': 'var(--cat-laticinios)',
    'hortifruti': 'var(--cat-horti)', 'mercearia': 'var(--cat-mercearia)',
    'temperos': 'var(--cat-temperos)', 'limpeza': 'var(--cat-limpeza)',
    'bebidas': 'var(--cat-bebidas)', 'embalagens': 'var(--cat-outros)',
    'outros': 'var(--cat-outros)'
};

export const nomesCategorias = {
    'carnes': 'CARNES & FRIOS',
    'laticinios': 'LATICÍNIOS',
    'hortifruti': 'HORTIFRUTI',
    'mercearia': 'MERCEARIA & GRÃOS',
    'temperos': 'TEMPEROS',
    'limpeza': 'LIMPEZA & DESCARTÁVEIS',
    'bebidas': 'BEBIDAS',
    'embalagens': 'EMBALAGENS',
    'outros': 'OUTROS'
};

export function identificarCategoria(nomeItem) {
    let nome = nomeItem.toLowerCase();
    const prioridade = ['temperos', 'limpeza', 'bebidas', 'laticinios', 'hortifruti', 'mercearia', 'carnes', 'embalagens'];
    for (let i = 0; i < prioridade.length; i++) {
        let cat = prioridade[i];
        if (mapaCategorias[cat] && mapaCategorias[cat].some(termo => nome.includes(termo))) {
            return cat;
        }
    }
    return 'outros';
}