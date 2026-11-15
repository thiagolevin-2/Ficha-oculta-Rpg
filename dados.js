// dados.js — rola dados. Base: dados.js do Tabuleiro do Arcana (sorteio justo com crypto)
// + o TESTE do Ordem Paranormal: rola N d20 e fica com o MELHOR (ou o PIOR, se o atributo for 0).

export function d(lados) {
  // sorteio sem viés: descarta valores que deixariam alguns lados mais prováveis
  const limite = Math.floor(0x100000000 / lados) * lados;
  const n = new Uint32Array(1);
  do crypto.getRandomValues(n); while (n[0] >= limite);
  return (n[0] % lados) + 1;
}

// "2d6+3" -> [{ sinal: 1, n: 2, lados: 6 }, { sinal: 1, valor: 3 }]
export function analisar(texto) {
  const limpo = String(texto || '').toLowerCase().replace(/\s+/g, '').replace(/−/g, '-');
  if (!limpo || limpo.length > 80 || !/^[-+]?(\d*d\d+|\d+)([-+](\d*d\d+|\d+))*$/.test(limpo)) throw new Error(`Não entendi "${texto}". Use algo como 2d6+3.`);
  const termos = [];
  for (const m of limpo.matchAll(/([-+]?)(\d*)d(\d+)|([-+]?)(\d+)/g)) {
    if (m[3]) {
      const n = Number(m[2] || 1), lados = Number(m[3]);
      if (n < 1 || n > 100 || lados < 1 || lados > 1000) throw new Error('Use de 1 a 100 dados, com até 1000 lados.');
      termos.push({ sinal: m[1] === '-' ? -1 : 1, n, lados });
    } else termos.push({ sinal: m[4] === '-' ? -1 : 1, valor: Number(m[5]) });
  }
  return termos;
}

// Rola uma expressão de dano/efeito. Crítico no Ordem: MULTIPLICA os dados da arma (x2, x3…); bônus fixos não.
// multiplicador só afeta o PRIMEIRO grupo de dados (os da arma). Devolve { expr, total, detalhe, dados }.
export function rolar(expr, { multiplicador = 1 } = {}) {
  const termos = analisar(expr);
  let total = 0, primeiro = true;
  const pedacos = [], dados = [];
  for (const t of termos) {
    if (t.valor != null) { total += t.sinal * t.valor; pedacos.push((t.sinal < 0 ? '− ' : '+ ') + t.valor); continue; }
    const n = primeiro ? t.n * multiplicador : t.n; primeiro = false;
    const valores = Array.from({ length: Math.min(200, n) }, () => d(t.lados));
    const soma = valores.reduce((a, b) => a + b, 0);
    total += t.sinal * soma;
    dados.push({ lados: t.lados, valores });
    pedacos.push((t.sinal < 0 ? '− ' : '+ ') + `[${valores.join(', ')}]`);
  }
  const detalhe = pedacos.join(' ').replace(/^\+ /, '');
  return { expr: String(expr).replace(/\s+/g, ''), total, detalhe, dados };
}

// TESTE do Ordem: qtd d20, fica com o melhor (ou pior). bonus = soma fixa. margem = crítico (ataques).
export function rolarTeste({ qtd = 1, pior = false, bonus = 0, margem = 21 } = {}) {
  qtd = Math.max(1, Math.min(20, qtd));
  const valores = Array.from({ length: qtd }, () => d(20));
  const escolhido = pior ? Math.min(...valores) : Math.max(...valores);
  const indice = valores.indexOf(escolhido);
  return { valores, escolhido, indice, pior, bonus, total: escolhido + bonus, critico: escolhido >= margem, natural20: escolhido === 20, natural1: escolhido === 1 };
}

export const comSinal = n => (n >= 0 ? '+' : '−') + Math.abs(n);
// "3d20+5" no jeito do livro: 3O+5 (O = dado). Aqui escrevemos "3d20 +5" e "pior de 2d20" quando atributo 0.
export const textoTeste = ({ qtd, pior }, bonus) => `${pior ? 'pior de ' : ''}${qtd}d20${bonus ? ' ' + comSinal(bonus) : ''}`;
