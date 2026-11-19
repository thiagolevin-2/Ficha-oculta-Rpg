// ═══════════ dados ═══════════
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
// Multiplica os grupos da arma marcados no cálculo, inclusive Lancinante. Devolve { expr, total, detalhe, dados }.
// A macro pode aplicar o multiplicador a todos os termos de uma parcela de dano extra.
// Dano médio (sem rolar): cada dado vale a média (lados + 1) / 2; o total é arredondado para baixo.
// Segue as mesmas regras de crítico de rolar(): multiplica só os grupos de dados da arma, ou a expressão inteira.
export function media(expr, { multiplicador = 1, gruposCritico = 1, multiplicarExpressao = false } = {}) {
  let total = 0, grupo = 0; const pedacos = [];
  for (const t of analisar(expr)) {
    if (t.valor != null) { const v = multiplicarExpressao ? t.valor * multiplicador : t.valor; total += t.sinal * v; pedacos.push((t.sinal < 0 ? '− ' : '+ ') + v); continue; }
    const n = (grupo++ < gruposCritico || multiplicarExpressao) ? t.n * multiplicador : t.n;
    const m = n * (t.lados + 1) / 2; total += t.sinal * m; pedacos.push((t.sinal < 0 ? '− ' : '+ ') + `${n}d${t.lados}≈${m}`);
  }
  return { expr: String(expr).replace(/\s+/g, ''), total: Math.floor(total), detalhe: pedacos.join(' ').replace(/^\+ /, '') + ' (média)', dados: [] };
}

export function rolar(expr, { multiplicador = 1, gruposCritico = 1, multiplicarExpressao = false } = {}) {
  const termos = analisar(expr);
  let total = 0, grupo = 0;
  const pedacos = [], dados = [];
  for (const t of termos) {
    if (t.valor != null) {
      const valor = multiplicarExpressao ? t.valor * multiplicador : t.valor;
      total += t.sinal * valor;
      pedacos.push((t.sinal < 0 ? '− ' : '+ ') + valor);
      continue;
    }
    const multiplica = grupo++ < gruposCritico || multiplicarExpressao;
    const n = multiplica ? t.n * multiplicador : t.n;
    const valores = Array.from({ length: multiplicarExpressao ? n : Math.min(200, n) }, () => d(t.lados));
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

// ═══════════ dano ═══════════
const dado = d;
export function sofrerDano(ficha, d, quantidade, { tipo = 'pv', rd = 0, metade = 0, ignorarTemp = false, rolarDado = dado } = {}) {
  const recurso = tipo === 'mental' ? d.pd ? 'pd' : 'san' : 'pv';
  const total = Math.max(0, Math.floor(quantidade / (2 ** metade)) - Math.max(0, rd));
  const absorvido = recurso === 'pv' && !ignorarTemp ? Math.min(ficha.recursos.pvTemp, total) : 0;
  ficha.recursos.pvTemp -= absorvido;
  ficha.recursos[recurso] = d.atual[recurso] - (total - absorvido);
  let peitoral;
  if (recurso === 'pv' && !ficha.morto && d.atual.pv > 0 && ficha.recursos.pv <= 0
    && ficha.itens?.some(i => i.nome === 'Peitoral da Segunda Chance' && i.ativo && i.qtd > 0)) {
    const esforco = d.pd ? 'pd' : 'pe';
    if (d.atual[esforco] + ficha.recursos.peTemp >= 5) {
      const temporario = Math.min(5, ficha.recursos.peTemp);
      ficha.recursos.peTemp -= temporario;
      ficha.recursos[esforco] = d.atual[esforco] - (5 - temporario);
      const risco = rolarDado(10);
      const dadosCura = risco === 1 ? [] : Array.from({ length: 4 }, () => rolarDado(10));
      ficha.morto = risco === 1;
      ficha.recursos.pv = Math.min(d.pv, dadosCura.reduce((soma, valor) => soma + valor, 0));
      ficha.recursos.morrendo = 0;
      ficha.condicoes = ficha.condicoes.filter(c => c !== 'morrendo');
      peitoral = { risco, dadosCura, morto: ficha.morto };
    }
  }
  return { total, absorvido, recurso, atual: ficha.recursos[recurso], ...(peitoral ? { peitoral } : {}) };
}

export function recuperar(ficha, d, recurso, quantidade) {
  const maximo = { pv: d.pv, pe: d.pe, pd: d.pdMax, san: d.san }[recurso];
  const novo = Math.min(maximo, d.atual[recurso] + quantidade);
  ficha.recursos[recurso] = novo;
  return novo;
}

const EVOLUCAO_CONDICAO = { fraco: 'debilitado', debilitado: 'inconsciente', fatigado: 'exausto', exausto: 'inconsciente', frustrado: 'esmorecido' };
const DERIVADAS = {
  petrificado: ['inconsciente'], inconsciente: ['indefeso'], paralisado: ['imovel', 'indefeso'],
  indefeso: ['desprevenido'], cego: ['desprevenido', 'lento'], atordoado: ['desprevenido'], surpreendido: ['desprevenido'],
  agarrado: ['imovel', 'desprevenido'], enredado: ['lento', 'vulneravel'], exausto: ['debilitado', 'lento', 'vulneravel'],
  fatigado: ['fraco', 'vulneravel'],
};

export function condicoesEfetivas(condicoes) {
  const resultado = new Set();
  function incluir(id) {
    if (resultado.has(id)) return;
    resultado.add(id);
    for (const derivada of DERIVADAS[id] || []) incluir(derivada);
  }
  condicoes.forEach(incluir);
  return resultado;
}

// Reter Ritual (AS #01 p. 58): atordoado, exausto e pasmo fazem perder o foco e soltar todos os rituais retidos
// (os PE máximos voltam, os atuais não). Devolve quantos rituais foram soltos.
export function perderFoco(ficha) {
  if (!ficha.rituaisRetidos?.length) return 0;
  const efetivas = condicoesEfetivas(ficha.condicoes);
  if (!['atordoado', 'exausto', 'pasmo'].some(c => efetivas.has(c))) return 0;
  const n = ficha.rituaisRetidos.length; ficha.rituaisRetidos = []; return n;
}
// ═══════════ status (condições com origem e marcadores) ═══════════
// Marcador: algo que vale no personagem e não é uma condição do catálogo nem um efeito com bônus automático
// (ex.: "−1 de Intelecto permanente" de um desastre paranormal, "ação de movimento extra no próximo turno").
// dura: 'cena' (some no Fim da cena), 'turno' (some depois de N fins de turno), 'permanente' (só sai à mão).
// desfazer: { atributo, valor } — ao tirar o marcador, o jogador pode devolver o atributo.
const novoUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export function adicionarMarcador(ficha, { tipo = 'negativo', nome, texto = '', origem = '', dura = 'cena', turnos = 0, desfazer = null }) {
  ficha.marcadores = [...(ficha.marcadores || []), { uid: novoUid(), tipo, nome, texto, origem, dura, turnos, desfazer }].slice(-40);
}
// Põe a condição e guarda de onde ela veio (também na condição que ela vira, ex.: abalado → apavorado)
export function marcarCondicao(ficha, id, origem) {
  const antes = new Set(ficha.condicoes);
  adicionarCondicao(ficha, id);
  if (!origem) return;
  ficha.origemCondicao = ficha.origemCondicao || {};
  for (const c of ficha.condicoes) if (!antes.has(c) || c === id) ficha.origemCondicao[c] = origem;
}
// Tira origens de condições que não estão mais na ficha
const limparOrigens = ficha => { for (const c of Object.keys(ficha.origemCondicao || {})) if (!ficha.condicoes.includes(c)) delete ficha.origemCondicao[c]; };

export function adicionarCondicao(ficha, id) {
  const anterior = ficha.condicoes.includes(id);
  if (!anterior) { ficha.condicoes.push(id); perderFoco(ficha); return ficha.condicoes.length; }
  const seguinte = EVOLUCAO_CONDICAO[id];
  if (!seguinte) return;
  ficha.condicoes = ficha.condicoes.filter(x => x !== id);
  adicionarCondicao(ficha, seguinte);
}

export function resolverCondicoesDoTurno(ficha, calcular, rolarDado = dado, testar = rolarTeste) {
  const avisos = [];
  let d = calcular(ficha);
  if (d.condicoesEfetivas.has('em-chamas')) {
    const q = rolarDado(6);
    sofrerDano(ficha, d, q, { rd: d.rd });
    avisos.push(`Em Chamas: ${q} de dano de fogo antes de RD.`);
    d = calcular(ficha);
  }
  if (d.condicoesEfetivas.has('sangrando')) {
    const n = ficha.atributos.vig + d.ajusteDados.vig + d.ajusteDados.todos;
    const t = testar({ qtd: n >= 1 ? n : 2 - n, pior: n < 1 });
    if (t.total >= 20) {
      ficha.condicoes = ficha.condicoes.filter(x => x !== 'sangrando');
      avisos.push('Sangramento estabilizado pelo teste de Vigor.');
    } else {
      const q = rolarDado(6);
      sofrerDano(ficha, d, q, { ignorarTemp: true });
      avisos.push(`Sangramento: perda de ${q} PV.`);
    }
  }
  return avisos;
}

// ═══════════ turnos ═══════════
export function iniciarTurno(ficha) {
  ficha.gastoTurno = 0;
  ficha.numTurno = (ficha.numTurno || 0) + 1; // separa os gastos de PE por turno
  ficha.efeitos = ficha.efeitos.filter(efeito => efeito.dura !== 'rodada');
}

export function encerrarTurno(ficha) {
  for (const [id, prazo] of Object.entries(ficha.prazosCondicao || {})) {
    if (prazo > 1) ficha.prazosCondicao[id]--;
    else {
      ficha.condicoes = ficha.condicoes.filter(c => c !== id);
      delete ficha.prazosCondicao[id];
    }
  }
  limparOrigens(ficha);
  ficha.marcadores = (ficha.marcadores || []).flatMap(m => m.dura !== 'turno' ? [m] : m.turnos > 1 ? [{ ...m, turnos: m.turnos - 1 }] : []);
}

export function fimDeCena(ficha) {
  ficha.efeitos = [];
  const permanentes = new Set(['doente', 'petrificado', 'envenenado', 'asfixiado', 'inconsciente', 'morrendo', 'enlouquecendo']);
  ficha.condicoes = ficha.condicoes.filter(c => permanentes.has(c) && !ficha.prazosCondicao?.[c]);
  ficha.prazosCondicao = {};
  limparOrigens(ficha);
  ficha.marcadores = (ficha.marcadores || []).filter(m => m.dura === 'permanente');
  ficha.turnoManualIniciado = false;
  ficha.itens = ficha.itens.filter(i => !i.expiraCena);
  ficha.gastoTurno = 0;
  ficha.recursos.peTemp = 0;
  ficha.usosCena = {};
  ficha.numCena = (ficha.numCena || 0) + 1; // separa os gastos de PE por cena
  ficha.recursos.morrendo = 0;
  ficha.recursos.enlouquecendo = 0;
}
