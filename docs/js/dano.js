import { d as dado, rolarTeste } from './dados.js?v=0.23.3';

export function sofrerDano(ficha, d, quantidade, { tipo = 'pv', rd = 0, metade = 0, ignorarTemp = false } = {}) {
  const recurso = tipo === 'mental' ? d.pd ? 'pd' : 'san' : 'pv';
  const total = Math.max(0, Math.floor(quantidade / (2 ** metade)) - Math.max(0, rd));
  const absorvido = recurso === 'pv' && !ignorarTemp ? Math.min(ficha.recursos.pvTemp, total) : 0;
  ficha.recursos.pvTemp -= absorvido;
  ficha.recursos[recurso] = d.atual[recurso] - (total - absorvido);
  return { total, absorvido, recurso, atual: ficha.recursos[recurso] };
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

export function adicionarCondicao(ficha, id) {
  const anterior = ficha.condicoes.includes(id);
  if (!anterior) return ficha.condicoes.push(id);
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
