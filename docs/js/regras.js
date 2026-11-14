// regras.js — o MOTOR do sistema. A ficha guarda só as ESCOLHAS; derivar(ficha) calcula o resto.
// (mesma ideia do derive() do core.js do Arcana)
import {
  ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, nivelDoNex, CLASSES, ORIGEM, TRILHA, PODER, PODERES, VIRARAM_GERAIS,
  PATENTES, patenteDosPP, PROG_PATENTE, CIRCULOS, DESLOCAMENTO_BASE, EFEITO_CONDICAO, CRIACAO_ATRIBUTOS, PROTECOES,
} from './catalogo.js?v=0.1';

export const VERSAO_FICHA = 1;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const txt = (v, max = 200) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const int = (v, min, max, padrao = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao; };
const lista = (v, max = 200) => (Array.isArray(v) ? v.slice(0, max) : []);
const FORMULA = /^[0-9d+\-\s]{0,40}$/i;

// ---------- Ficha nova ----------
export function novaFicha(modo = 'padrao', opcionais = {}) {
  return normalizar({ id: uid(), modo, opcionais, nome: '', classe: 'combatente', origem: '', atributos: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 } });
}

// ---------- Normalizar: limpa e completa TUDO que chega (arquivo importado, localStorage velho…) ----------
export function normalizar(f) {
  f = f && typeof f === 'object' ? f : {};
  const modo = f.modo === 'sah' ? 'sah' : 'padrao';
  const o = f.opcionais || {};
  const opcionais = modo === 'sah' ? {
    determinacao: !!o.determinacao || !!o.patentes, nivelExp: !!o.nivelExp && !o.patentes, patentes: !!o.patentes, ferimentos: !!o.ferimentos,
  } : { determinacao: false, nivelExp: false, patentes: false, ferimentos: false };
  let classe = CLASSES[f.classe] ? f.classe : 'combatente';
  if (CLASSES[classe].soSah && modo !== 'sah') classe = 'combatente';
  const atributos = {};
  for (const a of ATRIBUTOS) atributos[a.id] = int(f.atributos?.[a.id], 0, 7, 1);
  const pericias = {};
  for (const p of PERICIAS) { const g = int(f.pericias?.[p.id], 0, 3, 0); if (g) pericias[p.id] = g; }
  const bonusPericia = {};
  for (const p of PERICIAS) { const b = int(f.bonusPericia?.[p.id], -50, 50, 0); if (b) bonusPericia[p.id] = b; }
  const origem = ORIGEM[f.origem] && (ORIGEM[f.origem].fonte !== 'SaH' || modo === 'sah') ? f.origem : (f.origem === 'propria' ? 'propria' : '');
  const trilhaOk = TRILHA[f.trilha] && TRILHA[f.trilha].classe === classe && (TRILHA[f.trilha].fonte !== 'SaH' || modo === 'sah');
  const r = f.recursos || {};
  const ficha = {
    id: txt(f.id, 60) || uid(), versao: VERSAO_FICHA, modo, opcionais,
    nome: txt(f.nome, 80), jogador: txt(f.jogador, 80), conceito: txt(f.conceito, 160), idade: txt(f.idade, 20),
    aparencia: txt(f.aparencia, 2000), historia: txt(f.historia, 6000), notas: txt(f.notas, 12000),
    retrato: typeof f.retrato === 'string' && f.retrato.startsWith('data:image/') && f.retrato.length < 400000 ? f.retrato : '',
    atributos, classe, trilha: trilhaOk ? f.trilha : '', origem,
    origemPropria: { nome: txt(f.origemPropria?.nome, 60), poder: txt(f.origemPropria?.poder, 60), resumo: txt(f.origemPropria?.resumo, 600) },
    nex: NEX.includes(Number(f.nex)) ? Number(f.nex) : 5,
    nivel: int(f.nivel, 1, 20, 1), nexExposicao: int(f.nexExposicao, 0, 99, 0),
    estagio: int(f.estagio, 1, 5, 1), pp: int(f.pp, 0, 9999, 0),
    pericias, bonusPericia,
    profissao: txt(f.profissao, 40),
    poderes: lista(f.poderes, 60).map(p => ({ id: PODER[p?.id] ? p.id : 'proprio', nome: txt(p?.nome, 80), resumo: txt(p?.resumo, 1000), escolha: txt(p?.escolha, 60), uid: txt(p?.uid, 60) || uid() }))
      .filter(p => p.id !== 'proprio' || p.nome),
    habilidadesProprias: lista(f.habilidadesProprias, 60).map(h => ({ nome: txt(h?.nome, 80), resumo: txt(h?.resumo, 1500), custo: txt(h?.custo, 30), uid: txt(h?.uid, 60) || uid() })).filter(h => h.nome),
    notasHabilidade: Object.fromEntries(Object.entries(f.notasHabilidade || {}).slice(0, 120).map(([k, v]) => [txt(k, 80), txt(v, 1500)])),
    rituais: lista(f.rituais, 80).map(x => ({
      uid: txt(x?.uid, 60) || uid(), nome: txt(x?.nome, 80) || 'Ritual', elemento: txt(x?.elemento, 20) || 'conhecimento', circulo: int(x?.circulo, 1, 4, 1),
      execucao: txt(x?.execucao, 40), alcance: txt(x?.alcance, 40), alvo: txt(x?.alvo, 80), duracao: txt(x?.duracao, 40), resistencia: txt(x?.resistencia, 60),
      efeito: txt(x?.efeito, 3000), formula: FORMULA.test(txt(x?.formula, 40)) ? txt(x?.formula, 40) : '', discente: txt(x?.discente, 400), verdadeiro: txt(x?.verdadeiro, 400),
    })),
    armas: lista(f.armas, 40).map(a => ({
      uid: txt(a?.uid, 60) || uid(), nome: txt(a?.nome, 60) || 'Arma', prof: ['simples', 'taticas', 'pesadas'].includes(a?.prof) ? a.prof : 'simples',
      uso: ['corpo', 'disparo', 'fogo', 'arremesso'].includes(a?.uso) ? a.uso : 'corpo', categoria: int(a?.categoria, 0, 4, 0),
      dano: FORMULA.test(txt(a?.dano, 20)) && txt(a?.dano, 20) ? txt(a?.dano, 20) : '1d4', margem: int(a?.margem, 2, 20, 20), mult: int(a?.mult, 2, 6, 2),
      alcance: txt(a?.alcance, 20), tipo: txt(a?.tipo, 3), espacos: Number.isFinite(+a?.espacos) ? Math.min(20, Math.max(0, +a.espacos)) : 1,
      bonusAtaque: int(a?.bonusAtaque, -20, 30, 0), bonusDano: int(a?.bonusDano, -20, 50, 0), maos: int(a?.maos, 1, 2, 1), municao: txt(a?.municao, 40), nota: txt(a?.nota, 400),
      favorita: !!a?.favorita,
    })),
    protecoes: lista(f.protecoes, 10).map(p => ({ uid: txt(p?.uid, 60) || uid(), nome: txt(p?.nome, 60) || 'Proteção', peso: ['leve', 'pesada', 'escudo'].includes(p?.peso) ? p.peso : 'leve', defesa: int(p?.defesa, 0, 20, 5), rd: int(p?.rd, 0, 20, 0), categoria: int(p?.categoria, 0, 4, 1), espacos: Number.isFinite(+p?.espacos) ? Math.min(20, Math.max(0, +p.espacos)) : 2, vestida: p?.vestida !== false })),
    itens: lista(f.itens, 120).map(i => ({ uid: txt(i?.uid, 60) || uid(), nome: txt(i?.nome, 80) || 'Item', categoria: int(i?.categoria, 0, 4, 0), espacos: Number.isFinite(+i?.espacos) ? Math.min(20, Math.max(0, +i.espacos)) : 1, qtd: int(i?.qtd, 0, 999, 1), nota: txt(i?.nota, 600) })),
    recursos: { pv: r.pv == null ? null : int(r.pv, -999, 9999), pe: r.pe == null ? null : int(r.pe, -999, 9999), san: r.san == null ? null : int(r.san, -999, 9999), pd: r.pd == null ? null : int(r.pd, -999, 9999), pvTemp: int(r.pvTemp, 0, 999), peTemp: int(r.peTemp, 0, 999), morrendo: int(r.morrendo, 0, 3), enlouquecendo: int(r.enlouquecendo, 0, 3) },
    condicoes: lista(f.condicoes, 40).filter(c => typeof c === 'string' && c.length < 30),
    ferimentos: lista(f.ferimentos, 10).filter(a => ['agi', 'for', 'int', 'pre', 'vig'].includes(a)),
    bonus: Object.fromEntries(['defesa', 'pv', 'pe', 'san', 'pd', 'desl', 'carga', 'rd', 'resistencia', 'iniciativaDados'].map(k => [k, int(f.bonus?.[k], -99, 999, 0)])),
    elementoAfinidade: txt(f.elementoAfinidade, 20),
    criadoEm: txt(f.criadoEm, 40) || new Date().toISOString(), atualizadoEm: txt(f.atualizadoEm, 40) || new Date().toISOString(),
  };
  return ficha;
}

// ---------- Ajudantes ----------
export const temOpcional = (f, k) => f.modo === 'sah' && !!f.opcionais?.[k];
export const usaPD = f => temOpcional(f, 'determinacao') || temOpcional(f, 'patentes');
export const ehSobrevivente = f => f.classe === 'sobrevivente';
export const poderesDisponiveis = f => PODERES.filter(p => p.fonte !== 'SaH' || f.modo === 'sah');

// nível de progressão: 1..20 (ou 1..5 para estágio/patente)
export function nivelProgressao(f) {
  if (ehSobrevivente(f)) return f.estagio;
  if (temOpcional(f, 'patentes')) return patenteDosPP(f.pp).n;
  if (temOpcional(f, 'nivelExp')) return f.nivel;
  return nivelDoNex(f.nex);
}
// "nível equivalente" (1..20) para pré-requisitos e bônus "por 5% de NEX"
export function nivelEquivalente(f) {
  if (ehSobrevivente(f)) return 0;
  if (temOpcional(f, 'patentes')) return patenteDosPP(f.pp).limitePd;
  if (temOpcional(f, 'nivelExp')) return f.nivel;
  return nivelDoNex(f.nex);
}
export function textoNivel(f) {
  if (ehSobrevivente(f)) return `Estágio ${f.estagio}`;
  if (temOpcional(f, 'patentes')) return patenteDosPP(f.pp).nome;
  if (temOpcional(f, 'nivelExp')) return `Nível ${f.nivel} · NEX ${f.nexExposicao}%`;
  return `NEX ${f.nex}%`;
}

// Efeitos de origem + trilha + poderes já obtidos
function efeitosAtivos(f, nivel) {
  const efs = [];
  const o = ORIGEM[f.origem];
  if (o?.ef) efs.push({ fonte: o.poder, ...o.ef });
  const t = TRILHA[f.trilha];
  if (t) for (const h of t.habilidades) if (h.ef && trilhaLiberada(f, h.nivel)) efs.push({ fonte: h.nome, ...h.ef });
  for (const p of f.poderes) { const d = PODER[p.id]; if (d?.ef) efs.push({ fonte: d.nome, ...d.ef, escolha: p.escolha }); }
  return efs;
}
// a habilidade de trilha "nivel" (2, 8, 13, 20 — ou 2/4 do Sobrevivente) já foi alcançada?
export function trilhaLiberada(f, nivelHab) {
  if (ehSobrevivente(f)) return f.estagio >= nivelHab;
  if (temOpcional(f, 'patentes')) { const p = patenteDosPP(f.pp).n; return (nivelHab === 2 && p >= 3) || (nivelHab === 8 && p >= 4) || (nivelHab >= 13 && p >= 5); }
  return nivelProgressao(f) >= nivelHab;
}

// ---------- Rolar: quantos dados e qual bônus num teste ----------
// Ordem: rola tantos d20 quanto o atributo e fica com o MELHOR. Atributo 0 (ou menos): 2d20 e fica com o PIOR.
export function dadosDoTeste(valorAtributo, ajusteDados = 0) {
  const n = valorAtributo + ajusteDados;
  if (n >= 1) return { qtd: n, pior: false };
  return { qtd: 2 - n, pior: true }; // 0 → 2 dados pior; -1 → 3 dados pior…
}

// ---------- DERIVAR ----------
export function derivar(f) {
  const cls = CLASSES[f.classe];
  const at = { ...f.atributos };
  const n = nivelProgressao(f);
  const neq = nivelEquivalente(f);
  const efs = efeitosAtivos(f, n);
  const soma = k => efs.reduce((s, e) => s + (Number(e[k]) || 0), 0);
  const tem = k => efs.some(e => e[k]);
  const avisos = [];
  const pd = usaPD(f), patentes = temOpcional(f, 'patentes');
  const racional = tem('racional');
  const atrPE = racional ? at.int : at.pre;

  // --- PV ---
  let pv;
  if (ehSobrevivente(f)) {
    pv = cls.pv[0] + at.vig + (f.estagio - 1) * cls.pv[1];
    if (TRILHA[f.trilha]?.id === 'durao' && f.estagio >= 2) pv += 4 + (f.estagio >= 3 ? 2 : 0);
  } else if (patentes) pv = cls.patente.pv[0] + at.vig + (n - 1) * (cls.patente.pv[1] + at.vig);
  else pv = cls.pv[0] + at.vig + (n - 1) * (cls.pv[1] + at.vig);
  pv += soma('pvPorNivel') * neq + soma('pv') + f.bonus.pv;
  if (temOpcional(f, 'ferimentos')) pv -= f.ferimentos.filter(a => a === 'vig').length * Math.max(1, neq);

  // --- PE / SAN / PD ---
  let pe = 0, san = 0, pdMax = 0;
  const pePorEfeitos = soma('pe') + soma('pePor2Niveis') * Math.floor(neq / 2) + (tem('peDedicacao') ? 1 + Math.floor((neq - 1) / 2) : 0);
  if (pd) {
    if (ehSobrevivente(f)) pdMax = cls.pd[0] + atrPE + (f.estagio - 1) * cls.pd[1];
    else if (patentes) pdMax = cls.patente.pd[0] + atrPE + (n - 1) * (cls.patente.pd[1] + atrPE);
    else pdMax = cls.pd[0] + atrPE + (n - 1) * (cls.pd[1] + atrPE);
    pdMax += pePorEfeitos + f.bonus.pd + f.bonus.pe;
  } else {
    if (ehSobrevivente(f)) { pe = cls.pe[0] + atrPE + (f.estagio - 1) * cls.pe[1]; san = cls.san[0] + (f.estagio - 1) * cls.san[1]; }
    else {
      pe = cls.pe[0] + atrPE + (n - 1) * (cls.pe[1] + atrPE);
      const transcender = f.poderes.filter(p => p.id === 'transcender').length;
      san = cls.san[0] + (n - 1) * cls.san[1] - transcender * cls.san[1];
    }
    if (tem('sanMetade')) san = Math.floor(san / 2);
    san += soma('sanPorNivel') * neq + f.bonus.san;
    pe += pePorEfeitos + f.bonus.pe;
  }

  // --- limite de PE por turno ---
  let limitePE = ehSobrevivente(f) ? 1 : patentes ? patenteDosPP(f.pp).limitePd : n;
  const limiteRitual = limitePE + (f.trilha === 'intuitivo' && trilhaLiberada(f, 8) ? at.pre : 0);

  // --- condições: dados a menos ---
  const ajusteDados = { agi: 0, for: 0, int: 0, pre: 0, vig: 0, todos: 0, pericias: 0, defesa: 0 };
  for (const c of f.condicoes) { const e = EFEITO_CONDICAO[c]; if (e) for (const [k, v] of Object.entries(e)) ajusteDados[k] += v; }
  if (temOpcional(f, 'ferimentos')) for (const a of f.ferimentos) ajusteDados[a] -= 1;

  // --- carga ---
  let cargaMax = at.for > 0 ? at.for * 5 : 2;
  if (tem('cargaInt')) cargaMax = Math.max(cargaMax, (at.for + at.int) * 5);
  if (tem('cargaIntExtra')) cargaMax += at.int;
  cargaMax += soma('carga') + f.bonus.carga;
  const espacoArmas = f.armas.reduce((s, a) => s + a.espacos, 0);
  const espacoProt = f.protecoes.reduce((s, p) => s + p.espacos, 0);
  const espacoItens = f.itens.reduce((s, i) => s + i.espacos * Math.max(0, i.qtd), 0);
  const cargaUsada = Math.round((espacoArmas + espacoProt + espacoItens) * 100) / 100;
  const sobrecarregado = cargaUsada > cargaMax;
  if (cargaUsada > cargaMax * 2) avisos.push('Carga acima do dobro do limite: não dá para carregar tudo isso.');

  // --- proficiências ---
  const prof = { ...(cls.prof || {}) };
  if (efs.some(e => e.profPesada)) prof.pesada = true;
  if (f.poderes.some(p => p.id === 'armamento-pesado')) prof.pesadas = true;
  if (f.poderes.some(p => p.id === 'balistica-avancada') || f.poderes.some(p => p.id === 'ninja-urbano')) prof.taticas = true;

  // --- proteção / Defesa ---
  const vestidas = f.protecoes.filter(p => p.vestida);
  let defProt = 0, rd = soma('rd') + f.bonus.rd, penalCarga = 0;
  for (const p of vestidas) {
    defProt += p.defesa; rd += p.rd;
    if (p.peso === 'pesada' || p.peso === 'escudo') { if (!prof.pesada) avisos.push(`${p.nome}: você não tem proficiência com proteções pesadas.`); }
    if (p.peso === 'pesada') { penalCarga += 5; if (tem('tanque')) { defProt += 2; rd += 2; } }
  }
  if (sobrecarregado) penalCarga += 5;
  let defesa = 10 + at.agi + defProt + soma('defesa') + f.bonus.defesa + ajusteDados.defesa - (sobrecarregado ? 5 : 0);
  let desl = DESLOCAMENTO_BASE + soma('desl') + f.bonus.desl - (sobrecarregado ? 3 : 0);

  // --- perícias ---
  const treinaOuMais = efs.filter(e => e.treinaOuMais).map(e => e.treinaOuMais);
  const bonusEf = {};
  for (const e of efs) if (e.pericia) for (const [k, v] of Object.entries(e.pericia)) bonusEf[k] = (bonusEf[k] || 0) + v;
  const resist = soma('resistencia') + f.bonus.resistencia;
  const pericias = PERICIAS.map(p => {
    let grau = f.pericias[p.id] || 0;
    let extra = (bonusEf[p.id] || 0) + (f.bonusPericia[p.id] || 0);
    for (const t of treinaOuMais) if (t === p.id) { if (grau >= 1) extra += 2; else grau = 1; }
    let atr = p.atr;
    if (p.id === 'vontade' && racional && at.int > at.pre) atr = 'int';
    if (p.id === 'intuicao' && tem('intEmIntuicao')) extra += at.int;
    if (p.carga) extra -= penalCarga;
    if (['fortitude', 'reflexos', 'vontade'].includes(p.id)) extra += resist;
    const bonus = GRAUS[grau].bonus + extra;
    const ajuste = ajusteDados[atr] + ajusteDados.todos + ajusteDados.pericias + (f.poderes.some(x => x.id === 'foco-em-pericia' && x.escolha === p.id) ? 1 : 0);
    const valorAtr = at[atr];
    const bloqueada = p.treinada && grau === 0;
    if (grau === 2 && neq < 7 && !ehSobrevivente(f)) avisos.push(`${p.nome}: veterano só a partir de NEX 35% (nível 7).`);
    if (grau === 3 && neq < 14 && !ehSobrevivente(f)) avisos.push(`${p.nome}: expert só a partir de NEX 70% (nível 14).`);
    return { ...p, atrUsado: atr, grau, bonus, ajuste, dados: dadosDoTeste(valorAtr, ajuste), bloqueada, valorAtr };
  });
  const PER = Object.fromEntries(pericias.map(p => [p.id, p]));

  // --- ataques ---
  const ataques = f.armas.map(a => {
    const pericia = a.uso === 'corpo' ? 'luta' : 'pontaria';
    const pe = PER[pericia];
    const temProf = a.prof === 'simples' ? true : a.prof === 'taticas' ? !!prof.taticas : !!prof.pesadas;
    let ajuste = pe.ajuste + (temProf ? 0 : -1);
    let danoExtra = a.bonusDano;
    let dadosExtras = 0;
    if (a.uso === 'corpo' || a.uso === 'arremesso') danoExtra += at.for;
    if ((a.uso === 'disparo' || a.uso === 'fogo') && tem('agiDisparo')) danoExtra += at.agi;
    if (a.uso === 'corpo') { danoExtra += soma('danoCorpo'); dadosExtras += soma('dadoCorpo'); }
    if (a.uso === 'fogo') danoExtra += soma('danoFogo');
    let margem = a.margem - (a.uso === 'corpo' ? soma('margemCorpo') : 0);
    const [qtd, lados] = (a.dano.match(/(\d*)d(\d+)/) || [0, '1', '4']).slice(1).map(Number);
    const dadoBase = `${(qtd || 1) + dadosExtras}d${lados}`;
    const resto = a.dano.replace(/^\s*\d*d\d+/, '');
    const formula = dadoBase + resto + (danoExtra ? (danoExtra > 0 ? `+${danoExtra}` : `${danoExtra}`) : '');
    return { ...a, pericia, periciaNome: pe.nome, dados: dadosDoTeste(at[pe.atrUsado], ajuste), bonus: pe.bonus + a.bonusAtaque, formula, margem: Math.max(2, margem), temProf };
  });

  // --- habilidades liberadas ---
  const habilidades = [];
  if (ehSobrevivente(f)) for (const h of cls.habilidades) { if (f.estagio >= h.nivel && !h.nome.startsWith('Trilha')) habilidades.push({ ...h, fonte: 'Classe' }); }
  else if (patentes) { for (const h of cls.habilidades) if (h.nivel === 1) habilidades.push({ ...h, fonte: 'Classe' }); }
  else for (const h of cls.habilidades) if (n >= h.nivel) habilidades.push({ ...h, fonte: 'Classe' });
  const trilha = TRILHA[f.trilha];
  const trilhaHabs = trilha ? trilha.habilidades.map(h => ({ ...h, liberada: trilhaLiberada(f, h.nivel) })) : [];

  // --- quantos poderes/aumentos/graus a ficha já tem direito ---
  let slotsPoder = 0, slotsAtributo = 0, slotsGrau = 0, trilhaEm = 2, versatilidade = false;
  if (ehSobrevivente(f)) { slotsAtributo = f.estagio >= 3 ? 1 : 0; trilhaEm = 2; }
  else if (patentes) { slotsPoder = n - 1; slotsAtributo = (n >= 2 ? 1 : 0) + (n >= 4 ? 1 : 0); slotsGrau = (n >= 3 ? 1 : 0) + (n >= 5 ? 1 : 0); trilhaEm = 3; }
  else {
    for (let i = 1; i <= n; i++) { const p = cls.prog[i] || []; if (p.includes('poder')) slotsPoder++; if (p.includes('atributo')) slotsAtributo++; if (p.includes('grau')) slotsGrau++; if (p.includes('versatilidade')) versatilidade = true; }
  }
  const poderesEscolhidos = f.poderes.length;
  const pontosCriacao = (ehSobrevivente(f) ? CRIACAO_ATRIBUTOS.pontosSobrevivente : CRIACAO_ATRIBUTOS.pontos);
  const somaAtr = ATRIBUTOS.reduce((s, a) => s + at[a.id], 0);
  const esperado = 5 + pontosCriacao + slotsAtributo;
  if (somaAtr > esperado + (Object.values(at).some(v => v === 0) ? 1 : 0)) avisos.push(`Atributos somam ${somaAtr}; o esperado é até ${esperado} (+1 se um atributo estiver em 0).`);
  if (poderesEscolhidos > slotsPoder + (versatilidade ? 1 : 0) + (ORIGEM[f.origem]?.id === 'cultista' ? 1 : 0)) avisos.push(`Você tem ${poderesEscolhidos} poderes; o nível atual dá direito a ${slotsPoder}${versatilidade ? ' (+1 da versatilidade)' : ''}.`);
  if (!f.trilha && trilhaLiberada(f, 2)) avisos.push('Escolha sua trilha.');
  if (!f.origem) avisos.push('Escolha uma origem.');

  // --- rituais ---
  const circuloMax = f.classe === 'ocultista' ? (patentes ? Math.max(1, n - 1) : n >= 17 ? 4 : n >= 11 ? 3 : n >= 5 ? 2 : 1) : 1;
  const dtRitual = 10 + limitePE + at.pre;
  const rituais = f.rituais.map(r => ({ ...r, custo: CIRCULOS[r.circulo - 1].custo }));

  // --- patente e itens por categoria ---
  const patente = patenteDosPP(f.pp);
  const usoCategoria = [0, 0, 0, 0, 0];
  for (const a of f.armas) usoCategoria[a.categoria]++;
  for (const p of f.protecoes) usoCategoria[p.categoria]++;
  for (const i of f.itens) usoCategoria[i.categoria] += Math.max(1, i.qtd > 0 ? 1 : 0);
  if (!ehSobrevivente(f)) for (let c = 1; c <= 4; c++) if (usoCategoria[c] > patente.itens[c - 1]) avisos.push(`Itens de categoria ${'I'.repeat(c).replace('IIII', 'IV')}: ${usoCategoria[c]} de ${patente.itens[c - 1]} permitidos pela patente.`);

  // --- recursos atuais (null = cheio) ---
  const atual = {
    pv: f.recursos.pv ?? pv, pe: f.recursos.pe ?? pe, san: f.recursos.san ?? san, pd: f.recursos.pd ?? pdMax,
  };
  const machucado = atual.pv <= pv / 2;

  // --- iniciativa ---
  const iniciativa = PER.iniciativa;
  const bloqueio = PER.fortitude.grau >= 1 ? PER.fortitude.bonus : null;
  const esquiva = PER.reflexos.grau >= 1 ? PER.reflexos.bonus : null;

  return {
    nivel: n, nivelEq: neq, textoNivel: textoNivel(f), pd, pv, pe, san, pdMax, atual, machucado, limitePE, limiteRitual,
    defesa, rd, desl, cargaMax, cargaUsada, sobrecarregado, penalCarga, prof, pericias, PER, ataques, habilidades, trilha, trilhaHabs,
    slotsPoder, slotsAtributo, slotsGrau, versatilidade, trilhaEm, circuloMax, dtRitual, rituais, patente, usoCategoria,
    iniciativa, bloqueio, esquiva, avisos: [...new Set(avisos)], efs, ajusteDados,
    progressao: progressaoTexto(f, n),
  };
}

// Lista "o que ganhou em cada NEX/estágio/patente" (mostra até o nível atual + o próximo)
export function progressaoTexto(f, n) {
  const cls = CLASSES[f.classe];
  const nomes = { trilha: 'Habilidade de trilha', poder: `Poder de ${cls.nome.toLowerCase()}`, atributo: 'Aumento de atributo', grau: `Grau de treinamento (${cls.grauTreinamento} + Int perícias)`, versatilidade: 'Versatilidade' };
  const linhas = [];
  if (ehSobrevivente(f)) {
    for (const h of cls.habilidades) linhas.push({ rotulo: `Estágio ${h.nivel}`, itens: [h.nome], atingido: f.estagio >= h.nivel });
  } else if (temOpcional(f, 'patentes')) {
    for (const p of PATENTES) linhas.push({ rotulo: p.nome, itens: PROG_PATENTE[f.classe][p.n], atingido: n >= p.n });
  } else {
    for (let i = 1; i <= 20; i++) {
      const itens = (cls.prog[i] || []).map(x => nomes[x] || x);
      if (!itens.length) continue;
      linhas.push({ rotulo: temOpcional(f, 'nivelExp') ? `Nível ${i}` : `NEX ${NEX[i - 1]}%`, itens, atingido: n >= i });
    }
  }
  return linhas;
}

// Requisitos simples ("Agi 2", "For 2", "treinado em X", "NEX 30%"): devolve true/false/null (não sei avaliar)
export function cumpreRequisito(f, d, req) {
  if (!req) return true;
  let ok = true;
  for (const parte of req.split(/,\s*/)) {
    const m = parte.match(/^(Agi|For|Int|Pre|Vig) (\d)$/i);
    if (m) { if ((f.atributos[m[1].toLowerCase()] || 0) < Number(m[2])) ok = false; continue; }
    const nx = parte.match(/^NEX (\d+)%$/);
    if (nx) { if (d.nivelEq < NEX.indexOf(Number(nx[1])) + 1) ok = false; continue; }
    const tr = parte.match(/^treinado em (.+)$/i);
    if (tr) {
      const nomes = tr[1].split(/ ou | e /);
      const alg = nomes.map(nm => PERICIAS.find(p => p.nome.toLowerCase() === nm.trim().toLowerCase())).filter(Boolean);
      if (alg.length) { const e = / e /.test(tr[1]); const t = alg.map(p => d.PER[p.id].grau >= 1); if (e ? !t.every(Boolean) : !t.some(Boolean)) ok = false; }
      continue;
    }
    if (PODER[parte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')]) {
      const id = parte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
      if (!f.poderes.some(p => p.id === id)) ok = false;
    }
  }
  return ok;
}

// Quais poderes a ficha pode escolher (classe + todas + gerais no SaH)
export function poderesParaFicha(f) {
  return poderesDisponiveis(f).filter(p => {
    if (p.classe === f.classe || p.classe === 'todas') return true;
    if (f.modo === 'sah' && (p.classe === 'geral' || VIRARAM_GERAIS.includes(p.id))) return true;
    return false;
  });
}

export const PROTECOES_PADRAO = PROTECOES;
