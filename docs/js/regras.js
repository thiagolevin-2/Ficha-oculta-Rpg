// regras.js — o MOTOR do sistema. A ficha guarda só as ESCOLHAS; derivar(ficha) calcula o resto.
// (mesma ideia do derive() do core.js do Arcana)
import {
  ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, nivelDoNex, CLASSES, ORIGEM, TRILHA, PODER, PODERES, VIRARAM_GERAIS,
  PATENTES, patenteDosPP, PROG_PATENTE, CIRCULOS, DESLOCAMENTO_BASE, EFEITO_CONDICAO, CRIACAO_ATRIBUTOS, PROTECOES,
  ALTERACOES_GERAIS, ALTERACOES_ELEMENTO, PODERES_PARANORMAIS, PODER_PARANORMAL, USAVEIS, TROCAS_PERICIA,
} from './catalogo.js?v=0.5';

export const VERSAO_FICHA = 1;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const txt = (v, max = 200) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const int = (v, min, max, padrao = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao; };
const lista = (v, max = 200) => (Array.isArray(v) ? v.slice(0, max) : []);
const FORMULA = /^[0-9d+\-\s]{0,40}$/i;
// Efeitos de cena vindos de arquivos: só números ou nomes de atributo
const VAL = v => (['int', 'pre', 'vig', 'agi', 'for'].includes(v) ? v : Number.isFinite(+v) ? Math.max(-50, Math.min(50, +v)) : 0);
function limparEf(ef) {
  const o = {};
  if (!ef || typeof ef !== 'object') return o;
  for (const k of ['defesa', 'resistencia', 'rd', 'rdMental', 'desl', 'todasPericias', 'dadosTodas', 'ataque', 'ataqueDados', 'dano', 'margemTodas', 'dtRitual']) if (ef[k] != null) o[k] = VAL(ef[k]);
  for (const k of ['pericia', 'dadosPericia']) if (ef[k] && typeof ef[k] === 'object') o[k] = Object.fromEntries(Object.entries(ef[k]).filter(([p]) => PERICIA[p]).map(([p, v]) => [p, VAL(v)]));
  if (ef.arma) o.arma = true;
  return o;
}
const semAcento = v => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

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
    determinacao: !!o.determinacao || !!o.patentes, nivelExp: !!o.nivelExp && !o.patentes, patentes: !!o.patentes, ferimentos: !!o.ferimentos, progressaoNex: !!o.progressaoNex,
  } : { determinacao: false, nivelExp: false, patentes: false, ferimentos: false, progressaoNex: false };
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
    patenteManual: int(f.patenteManual, 0, 5, 0),
    limitesItens: Array.isArray(f.limitesItens) && f.limitesItens.length === 4 ? f.limitesItens.map(v => int(v, 0, 20, 0)) : null,
    creditoManual: ['Baixo', 'Médio', 'Alto', 'Ilimitado'].includes(f.creditoManual) ? f.creditoManual : '',
    pericias, bonusPericia,
    profissao: txt(f.profissao, 40),
    poderes: lista(f.poderes, 60).map(p => ({ id: PODER[p?.id] ? p.id : 'proprio', nome: txt(p?.nome, 80), resumo: txt(p?.resumo, 1000), escolha: txt(p?.escolha, 60), via: txt(p?.via, 60), uid: txt(p?.uid, 60) || uid() }))
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
      favorita: !!a?.favorita, ferramenta: !!a?.ferramenta, balasLongas: !!a?.balasLongas,
    })),
    protecoes: lista(f.protecoes, 10).map(p => ({ uid: txt(p?.uid, 60) || uid(), nome: txt(p?.nome, 60) || 'Proteção', peso: ['leve', 'pesada', 'escudo'].includes(p?.peso) ? p.peso : 'leve', defesa: int(p?.defesa, 0, 20, 5), rd: int(p?.rd, 0, 20, 0), categoria: int(p?.categoria, 0, 4, 1), espacos: Number.isFinite(+p?.espacos) ? Math.min(20, Math.max(0, +p.espacos)) : 2, vestida: p?.vestida !== false })),
    itens: lista(f.itens, 120).map(i => ({ uid: txt(i?.uid, 60) || uid(), nome: txt(i?.nome, 80) || 'Item', categoria: int(i?.categoria, 0, 4, 0), espacos: Number.isFinite(+i?.espacos) ? Math.min(20, Math.max(0, +i.espacos)) : 1, qtd: int(i?.qtd, 0, 999, 1), nota: txt(i?.nota, 600) })),
    recursos: { pv: r.pv == null ? null : int(r.pv, -999, 9999), pe: r.pe == null ? null : int(r.pe, -999, 9999), san: r.san == null ? null : int(r.san, -999, 9999), pd: r.pd == null ? null : int(r.pd, -999, 9999), pvTemp: int(r.pvTemp, 0, 999), peTemp: int(r.peTemp, 0, 999), morrendo: int(r.morrendo, 0, 3), enlouquecendo: int(r.enlouquecendo, 0, 3) },
    condicoes: lista(f.condicoes, 40).filter(c => typeof c === 'string' && c.length < 30),
    ferimentos: lista(f.ferimentos, 10).filter(a => ['agi', 'for', 'int', 'pre', 'vig'].includes(a)),
    escolhas: { versatilidade: TRILHA[f.escolhas?.versatilidade] ? f.escolhas.versatilidade : '', flashback: ORIGEM[f.escolhas?.flashback] ? f.escolhas.flashback : '', forcaSaber: PERICIA[f.escolhas?.forcaSaber] ? f.escolhas.forcaSaber : '', numeroSorte: txt(f.escolhas?.numeroSorte, 20), sangueFervente: f.escolhas?.sangueFervente === 'agi' ? 'agi' : 'for', perito: (Array.isArray(f.escolhas?.perito) ? f.escolhas.perito : []).filter(id => PERICIA[id] && id !== 'luta' && id !== 'pontaria').slice(0, 2), experimento: PERICIA[f.escolhas?.experimento] ? f.escolhas.experimento : '' },
    paranormais: lista(f.paranormais, 40).filter(p => PODER_PARANORMAL[p?.id]).map(p => ({ uid: txt(p.uid, 60) || uid(), id: p.id, escolha: txt(p.escolha, 40), afinidade: !!p.afinidade, fonte: ['transcender', 'origem', 'outro'].includes(p.fonte) ? p.fonte : 'outro' })),
    efeitos: lista(f.efeitos, 30).map(e => ({ uid: txt(e?.uid, 60) || uid(), nome: txt(e?.nome, 80) || 'Efeito', dura: ['cena', 'rodada', 'proxima'].includes(e?.dura) ? e.dura : 'cena', nota: txt(e?.nota, 200), ef: limparEf(e?.ef) })),
    usosCena: Object.fromEntries(Object.entries(f.usosCena || {}).slice(0, 40).map(([k, v]) => [txt(k, 60), int(v, 0, 99, 0)])),
    cargasAntecipacao: int(f.cargasAntecipacao, 0, 20, 0),
    bonus: Object.fromEntries(['defesa', 'pv', 'pe', 'san', 'pd', 'desl', 'carga', 'rd', 'resistencia', 'iniciativaDados', 'paranormais'].map(k => [k, int(f.bonus?.[k], -99, 999, 0)])),
    elementoAfinidade: txt(f.elementoAfinidade, 20),
    nexAlt: { pen25: ['diplomacia', 'enganacao', 'intimidacao'].includes(f.nexAlt?.pen25) ? f.nexAlt.pen25 : '', pen35: ['atletismo', 'fortitude', 'reflexos'].includes(f.nexAlt?.pen35) ? f.nexAlt.pen35 : '', atr35: ['agi', 'for', 'int', 'vig'].includes(f.nexAlt?.atr35) ? f.nexAlt.atr35 : '' },
    criadoEm: txt(f.criadoEm, 40) || new Date().toISOString(), atualizadoEm: txt(f.atualizadoEm, 40) || new Date().toISOString(),
  };
  return ficha;
}

// ---------- Ajudantes ----------
export const temOpcional = (f, k) => f.modo === 'sah' && !!f.opcionais?.[k];
export const usaPD = f => temOpcional(f, 'determinacao') || temOpcional(f, 'patentes');
export const ehSobrevivente = f => f.classe === 'sobrevivente';
// NEX separado da experiência (só vale como EXPOSIÇÃO): regras NEX & Experiência, Patentes e o Sobrevivente
export const nexSeparado = f => f.modo === 'sah' && (!!f.opcionais?.nivelExp || !!f.opcionais?.patentes || f.classe === 'sobrevivente');
// valor de NEX (exposição) da ficha
// Patente: o jogador pode escolher à mão (patenteManual 1–5) ou deixar pelos pontos de prestígio
export const patenteDaFicha = f => (f.patenteManual ? PATENTES[f.patenteManual - 1] : patenteDosPP(f.pp));
export const nexDaFicha = f => (nexSeparado(f) ? f.nexExposicao : f.nex);
// Progressão de NEX do SaH vale com NEX separado e na trilha Monstruoso
// Agora é OPCIONAL: só vale com a caixinha "Progressão de NEX" ligada
export const usaProgressaoNex = f => f.modo === 'sah' && !!f.opcionais?.progressaoNex;
export const poderesDisponiveis = f => PODERES.filter(p => p.fonte !== 'SaH' || f.modo === 'sah');

// nível de progressão: 1..20 (ou 1..5 para estágio/patente)
export function nivelProgressao(f) {
  if (ehSobrevivente(f)) return f.estagio;
  if (temOpcional(f, 'patentes')) return patenteDaFicha(f).n;
  if (temOpcional(f, 'nivelExp')) return f.nivel;
  return nivelDoNex(f.nex);
}
// "nível equivalente" (1..20) para pré-requisitos e bônus "por 5% de NEX"
export function nivelEquivalente(f) {
  if (ehSobrevivente(f)) return 0;
  if (temOpcional(f, 'patentes')) return patenteDaFicha(f).limitePd;
  if (temOpcional(f, 'nivelExp')) return f.nivel;
  return nivelDoNex(f.nex);
}
export function textoNivel(f) {
  if (ehSobrevivente(f)) return `Estágio ${f.estagio}${f.modo === 'sah' ? ` · NEX ${f.nexExposicao}%` : ''}`;
  if (temOpcional(f, 'patentes')) return `${patenteDaFicha(f).nome} · NEX ${f.nexExposicao}%`;
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
  const tv = TRILHA[f.escolhas?.versatilidade]; if (tv?.habilidades[0]?.ef) efs.push({ fonte: tv.habilidades[0].nome + ' (Versatilidade)', ...tv.habilidades[0].ef });
  const fb = ORIGEM[f.escolhas?.flashback]; if (fb?.ef && f.poderes.some(p => p.id === 'flashback')) efs.push({ fonte: fb.poder + ' (Flashback)', ...fb.ef });
  for (const p of f.paranormais || []) { const d = PODER_PARANORMAL[p.id]; if (!d) continue; if (p.afinidade) { if (d.efAfinidade) efs.push({ fonte: d.nome + ' (afinidade)', ...d.efAfinidade }); } else if (d.ef) efs.push({ fonte: d.nome, ...d.ef }); }
  return efs;
}
// a habilidade de trilha "nivel" (2, 8, 13, 20 — ou 2/4 do Sobrevivente) já foi alcançada?
export function trilhaLiberada(f, nivelHab) {
  if (ehSobrevivente(f)) return f.estagio >= nivelHab;
  if (temOpcional(f, 'patentes')) { const p = patenteDaFicha(f).n; return (nivelHab === 2 && p >= 3) || (nivelHab === 8 && p >= 4) || (nivelHab >= 13 && p >= 5); }
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
  const forcaSaber = f.trilha === 'bibliotecario' && trilhaLiberada(f, 20);
  if (forcaSaber) at.int += 1;
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
  const pePorEfeitos = (forcaSaber ? at.int : 0) + soma('pe') + soma('pePorNivel') * Math.max(1, neq) + soma('pePor2Niveis') * Math.floor(neq / 2) + (tem('peDedicacao') ? 1 + Math.floor((neq - 1) / 2) : 0);
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

  // --- Progressão de NEX (SaH): alterações por exposição ---
  const nexAtual = nexDaFicha(f);
  const alteracoesNex = [];
  const dadosNex = {}, bonusNex = {};
  if (usaProgressaoNex(f)) {
    for (const g of ALTERACOES_GERAIS) alteracoesNex.push({ ...g, atingida: nexAtual >= g.nex });
    if (nexAtual >= 25) { if (f.nexAlt.pen25) bonusNex[f.nexAlt.pen25] = (bonusNex[f.nexAlt.pen25] || 0) - 5; else avisos.push('NEX 25%: escolha a perícia com −5 (aba Habilidades).'); }
    if (nexAtual >= 35) {
      if (f.nexAlt.pen35) bonusNex[f.nexAlt.pen35] = (bonusNex[f.nexAlt.pen35] || 0) - 5; else avisos.push('NEX 35%: escolha a perícia com −5 (aba Habilidades).');
      if (f.nexAlt.atr35) { if (pd) pdMax += at[f.nexAlt.atr35]; else pe += at[f.nexAlt.atr35]; } else avisos.push('NEX 35%: escolha o atributo somado nos PE (aba Habilidades).');
    }
    const el = ALTERACOES_ELEMENTO[f.elementoAfinidade];
    if (nexAtual >= 50 && !el) avisos.push('NEX 50%: escolha a afinidade elemental (aba Notas).');
    if (el) for (const a of el) {
      alteracoesNex.push({ ...a, nome: `${f.elementoAfinidade[0].toUpperCase() + f.elementoAfinidade.slice(1)} ${a.nex}%`, atingida: nexAtual >= a.nex });
      if (nexAtual >= a.nex && a.ef) for (const [k, v] of Object.entries(a.ef)) dadosNex[k] = (dadosNex[k] || 0) + v;
    }
  }

  // --- limite de PE por turno ---
  let limitePE = ehSobrevivente(f) ? 1 : patentes ? patenteDaFicha(f).limitePd : n;
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
  const temPoder = id => f.poderes.some(p => p.id === id);
  // efeitos ativos (ligados pelo jogador; somem no "Fim da cena")
  const valor = v => (typeof v === 'string' ? at[v] || 0 : v || 0);
  const ativo = { defesa: 0, resistencia: 0, rd: 0, rdMental: 0, desl: 0, todasPericias: 0, dadosTodas: 0, ataque: 0, ataqueDados: 0, dano: 0, margemTodas: 0, dtRitual: 0, pericia: {}, dadosPericia: {}, arma: false };
  for (const e of f.efeitos) for (const [k, v] of Object.entries(e.ef)) {
    if (k === 'pericia' || k === 'dadosPericia') for (const [p, x] of Object.entries(v)) ativo[k][p] = (ativo[k][p] || 0) + valor(x);
    else if (k === 'arma') ativo.arma = true; else ativo[k] += valor(v);
  }
  // Sangue Fervente: machucado dá +1 (ou +2 com afinidade) em Agilidade ou Força
  const sf = f.paranormais.find(p => p.id === 'sangue-fervente');
  const pvAtualPrevio = f.recursos.pv;
  const sangueFervente = sf && pvAtualPrevio != null && pvAtualPrevio <= pv / 2 ? (f.paranormais.some(p => p.id === 'sangue-fervente' && p.afinidade) ? 2 : 1) : 0;
  if (sangueFervente) { ajusteDados[f.escolhas.sangueFervente] += sangueFervente; if (f.escolhas.sangueFervente === 'agi') ativo.defesa += sangueFervente; else ativo.dano += sangueFervente; }
  const sentidoTatico = 0, combateDefensivo = ativo.ataqueDados < 0;
  let defesa = 10 + at.agi + defProt + soma('defesa') + f.bonus.defesa + ajusteDados.defesa - (sobrecarregado ? 5 : 0) + ativo.defesa;
  rd += ativo.rd;
  let desl = DESLOCAMENTO_BASE + soma('desl') + f.bonus.desl - (sobrecarregado ? 3 : 0) + ativo.desl;

  // --- perícias ---
  const treinaOuMais = efs.filter(e => e.treinaOuMais).map(e => e.treinaOuMais);
  const bonusEf = {};
  for (const e of efs) if (e.pericia) for (const [k, v] of Object.entries(e.pericia)) bonusEf[k] = (bonusEf[k] || 0) + v;
  const resist = soma('resistencia') + f.bonus.resistencia + ativo.resistencia;
  const dadosEf = {};
  if (tem('experimento')) { if (f.escolhas.experimento) bonusEf[f.escolhas.experimento] = (bonusEf[f.escolhas.experimento] || 0) + 2; else avisos.push('Mutação (Experimento): escolha a perícia com +2 (aba Habilidades).'); dadosEf.diplomacia = (dadosEf.diplomacia || 0) - 1; }
  const pericias = PERICIAS.map(p => {
    let grau = f.pericias[p.id] || 0;
    let extra = (bonusEf[p.id] || 0) + (f.bonusPericia[p.id] || 0) + (bonusNex[p.id] || 0) + ativo.todasPericias + (ativo.pericia[p.id] || 0);
    for (const t of treinaOuMais) if (t === p.id) { if (grau >= 1) extra += 2; else grau = 1; }
    let atr = p.atr;
    if (p.id === 'vontade' && racional && at.int > at.pre) atr = 'int';
    if (p.id === 'intimidacao' && f.poderes.some(x => x.id === 'valentao') && at.for > at.pre) atr = 'for';
    if (p.id === 'ocultismo' && f.poderes.some(x => x.id === 'olhar-sinistro') && at.pre > at.int) atr = 'pre';
    if (forcaSaber && f.escolhas.forcaSaber === p.id) atr = 'int';
    if (p.id === 'intuicao' && tem('intEmIntuicao')) extra += at.int;
    if (p.carga) extra -= penalCarga;
    if (['fortitude', 'reflexos', 'vontade'].includes(p.id)) extra += resist;
    if (p.id === 'ocultismo' && usaProgressaoNex(f) && nexAtual >= 25 && grau >= 1) extra += 2;
    const bonus = GRAUS[grau].bonus + extra;
    const ajuste = ajusteDados[atr] + ajusteDados.todos + ajusteDados.pericias + (dadosNex[p.id] || 0) + (dadosEf[p.id] || 0) + ativo.dadosTodas + (ativo.dadosPericia[p.id] || 0) + (f.poderes.some(x => x.id === 'foco-em-pericia' && x.escolha === p.id) ? 1 : 0);
    const valorAtr = at[atr];
    const bloqueada = p.treinada && grau === 0 && !(p.id === 'ocultismo' && usaProgressaoNex(f) && nexAtual >= 25);
    if (grau === 2 && neq < 7 && !ehSobrevivente(f)) avisos.push(`${p.nome}: veterano só a partir de NEX 35% (nível 7).`);
    if (grau === 3 && neq < 14 && !ehSobrevivente(f)) avisos.push(`${p.nome}: expert só a partir de NEX 70% (nível 14).`);
    return { ...p, atrUsado: atr, grau, bonus, ajuste, dados: dadosDoTeste(valorAtr, ajuste), bloqueada, valorAtr };
  });
  const PER = Object.fromEntries(pericias.map(p => [p.id, p]));

  // --- ataques ---
  const trilhaNv = h => trilhaLiberada(f, h);
  const favoritaReducao = f.trilha === 'aniquilador' ? (trilhaNv(20) ? 3 : trilhaNv(8) ? 2 : trilhaNv(2) ? 1 : 0) : 0;
  const armasCalc = [...f.armas];
  if (ativo.arma) { const afin = f.paranormais.some(p => p.id === 'arma-de-sangue' && p.afinidade); armasCalc.unshift({ uid: 'arma-sangue', nome: 'Arma de Sangue', prof: 'simples', uso: 'corpo', categoria: 0, dano: afin ? '1d10' : '1d6', margem: 20, mult: 2, alcance: '—', tipo: 'S', espacos: 0, bonusAtaque: 0, bonusDano: 0, automatica: true }); }
  else if (f.paranormais.some(p => p.id === 'arma-de-sangue' && p.afinidade)) armasCalc.unshift({ uid: 'arma-sangue', nome: 'Arma de Sangue (permanente)', prof: 'simples', uso: 'corpo', categoria: 0, dano: '1d10', margem: 20, mult: 2, alcance: '—', tipo: 'S', espacos: 0, bonusAtaque: 0, bonusDano: 0, automatica: true });
  // Artista Marcial: ataque desarmado automático (1d6, 1d8 em NEX 35%, 1d10 em NEX 70%)
  if (temPoder('artista-marcial')) armasCalc.unshift({ uid: 'desarmado', nome: 'Desarmado (Artista Marcial)', prof: 'simples', uso: 'corpo', categoria: 0, dano: neq >= 14 ? '1d10' : neq >= 7 ? '1d8' : '1d6', margem: 20, mult: 2, alcance: '—', tipo: 'I', espacos: 0, bonusAtaque: 0, bonusDano: 0, automatica: true });
  const ataques = armasCalc.map(a => {
    const pericia = a.uso === 'corpo' ? 'luta' : 'pontaria';
    const pe = PER[pericia];
    const temProf = a.prof === 'simples' ? true : a.prof === 'taticas' ? !!prof.taticas : !!prof.pesadas;
    let ajuste = pe.ajuste - ativo.dadosTodas - (ativo.dadosPericia[pericia] || 0) + (temProf ? 0 : -1) + ativo.ataqueDados;
    let danoExtra = a.bonusDano + ativo.dano, bonusAtaque = a.bonusAtaque + ativo.ataque - ativo.todasPericias - (ativo.pericia[pericia] || 0);
    let dadosExtras = 0;
    const notas = [];
    if (a.uso === 'corpo' || a.uso === 'arremesso') danoExtra += at.for;
    if ((a.uso === 'disparo' || a.uso === 'fogo') && tem('agiDisparo')) danoExtra += at.agi;
    if (a.uso === 'corpo') { danoExtra += soma('danoCorpo'); dadosExtras += soma('dadoCorpo'); }
    if (a.uso === 'fogo') danoExtra += soma('danoFogo');
    if (temPoder('ninja-urbano') && (a.uso === 'corpo' || a.uso === 'disparo')) { danoExtra += 2; notas.push('Ninja Urbano +2'); }
    let margem = a.margem - (a.uso === 'corpo' ? soma('margemCorpo') : 0) - soma('margemTodas') - ativo.margemTodas;
    const mult = a.mult + soma('multTodas');
    if (a.ferramenta && tem('ferramenta')) { bonusAtaque += 1; danoExtra += 1; margem -= 1; notas.push('Ferramenta de Trabalho'); }
    if (a.balasLongas && f.trilha === 'atirador' && trilhaNv(2)) { danoExtra += at.int; notas.push('Mira de Elite +Int'); }
    if (a.favorita && favoritaReducao) { notas.push(`Favorita (−${favoritaReducao} cat.)`); if (trilhaNv(20)) { margem -= 2; dadosExtras += 1; } }
    if (combateDefensivo) notas.push('Combate Defensivo −1D');
    const [qtd, lados] = (a.dano.match(/(\d*)d(\d+)/) || [0, '1', '4']).slice(1).map(Number);
    const dadoBase = `${(qtd || 1) + dadosExtras}d${lados}`;
    const resto = a.dano.replace(/^\s*\d*d\d+/, '');
    const formula = dadoBase + resto + (danoExtra ? (danoExtra > 0 ? `+${danoExtra}` : `${danoExtra}`) : '');
    return { ...a, mult, pericia, periciaNome: pe.nome, dados: dadosDoTeste(at[pe.atrUsado], ajuste), bonus: pe.bonus + bonusAtaque, formula, margem: Math.max(2, margem), temProf, notas, categoriaEfetiva: Math.max(0, a.categoria - (a.favorita ? favoritaReducao : 0)) };
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
  // Transcender x poderes paranormais (contados separados)
  const transcenderes = f.poderes.filter(p => p.id === 'transcender').length;
  const limiarNex = [25, 35, 50, 60, 75, 90];
  const transcenderSeparado = nexSeparado(f) && f.classe !== 'sobrevivente';
  const limiteTranscender = transcenderSeparado ? limiarNex.filter(x => nexAtual >= x).length : slotsPoder + (versatilidade ? 1 : 0);
  const paranormalDaOrigem = ORIGEM[f.origem]?.id === 'cultista' ? 1 : 0;
  const limiteParanormais = transcenderes + paranormalDaOrigem + (f.bonus.paranormais || 0);
  const paranormaisUsados = f.paranormais.length;
  if (transcenderes > limiteTranscender) avisos.push(`Transcender: ${transcenderes} de ${limiteTranscender} permitidos${transcenderSeparado ? ' (um a cada faixa de NEX 25/35/50/60/75/90%)' : ''}.`);
  if (paranormaisUsados > limiteParanormais) avisos.push(`Poderes paranormais: ${paranormaisUsados} de ${limiteParanormais} permitidos.`);
  const porElemento = {};
  for (const p of f.paranormais) { const def = PODER_PARANORMAL[p.id]; const el = def.elemento === 'variavel' ? semAcento(p.escolha) : def.elemento; if (el) porElemento[el] = (porElemento[el] || 0) + 1; }
  const expansao = f.paranormais.filter(p => p.id === 'expansao-de-conhecimento').length;
  const poderesEscolhidos = f.poderes.filter(p => !p.via && !(transcenderSeparado && p.id === 'transcender')).length;
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
  const elementosEsp = f.poderes.filter(p => p.id === 'especialista-em-elemento').map(p => semAcento(p.escolha));
  const elementosMestre = f.poderes.filter(p => p.id === 'mestre-em-elemento').map(p => semAcento(p.escolha));
  const prediletos = f.poderes.filter(p => p.id === 'ritual-predileto').map(p => semAcento(p.escolha));
  const eficientes = f.trilha === 'graduado' && trilhaLiberada(f, 13) ? 5 : 0;
  const rituais = f.rituais.map(r => {
    const el = semAcento(r.elemento), notas = [];
    let custo = CIRCULOS[r.circulo - 1].custo, dt = dtRitual + eficientes + ativo.dtRitual;
    if (eficientes) notas.push('Rituais Eficientes +5 DT');
    if (elementosEsp.includes(el)) { dt += 2; notas.push('Especialista em Elemento +2 DT'); }
    if (elementosMestre.includes(el)) { custo -= 1; notas.push('Mestre em Elemento −1'); }
    if (prediletos.includes(semAcento(r.nome))) { custo -= 1; notas.push('Ritual Predileto −1'); }
    let formula = r.formula;
    if (formula && temPoder('ritual-potente')) { formula += `+${at.int}`; notas.push('Ritual Potente +Int'); }
    return { ...r, custo: Math.max(1, custo), dt, formulaFinal: formula, notas };
  });

  // --- patente e itens por categoria ---
  const patBase = patenteDaFicha(f);
  const patente = { ...patBase, itens: f.limitesItens || patBase.itens, credito: f.creditoManual || patBase.credito, itensEditados: !!f.limitesItens, creditoEditado: !!f.creditoManual };
  const usoCategoria = [0, 0, 0, 0, 0];
  for (const a of ataques) if (!a.automatica) usoCategoria[a.categoriaEfetiva]++;
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
  const bloqueio = PER.fortitude.grau >= 1 ? PER.fortitude.bonus + (f.trilha === 'tropa' && trilhaLiberada(f, 2) ? at.vig : 0) : null;
  let rdMental = (tem('rdMentalInt') ? at.int : 0) + ativo.rdMental;
  if (f.trilha === 'intuitivo' && trilhaLiberada(f, 13)) rdMental = Math.max(rdMental, 10);
  const esquiva = PER.reflexos.grau >= 1 ? PER.reflexos.bonus : null;

  return {
    nivel: n, nivelEq: neq, textoNivel: textoNivel(f), nexAtual, alteracoesNex, nexSeparado: nexSeparado(f), progressaoNex: usaProgressaoNex(f), pd, pv, pe, san, pdMax, atual, machucado, limitePE, limiteRitual,
    defesa, rd, desl, cargaMax, cargaUsada, sobrecarregado, penalCarga, prof, pericias, PER, ataques, habilidades, trilha, trilhaHabs,
    poderesEscolhidos, expansao, forcaSaber, slotsPoder, slotsAtributo, slotsGrau, versatilidade, trilhaEm, transcenderes, limiteTranscender, transcenderSeparado, limiteParanormais, paranormaisUsados, paranormalDaOrigem, porElemento, ativo, sangueFervente,
    limiteAcao: limitePE + soma('limiteAcao'), circuloMax, dtRitual, rituais, patente, usoCategoria,
    iniciativa, bloqueio, esquiva, rdMental, sentidoTatico, combateDefensivo, avisos: [...new Set(avisos)], efs, ajusteDados,
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
// Poderes de OUTRAS classes (Especialista Diletante / Expansão de Conhecimento), em ordem alfabética
export function poderesDeOutrasClasses(f) {
  return poderesDisponiveis(f).filter(p => ['combatente', 'especialista', 'ocultista'].includes(p.classe) && p.classe !== f.classe)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}

// ---------- Gastar PE/PD numa rolagem (passo 9) ----------
// Devolve as opções que a ficha tem para uma perícia ou um ataque. Cada opção:
// { id, nome, custo, bonus (soma fixa), dados (+D), dadoExtra ('1d6'), danoPor5 (Ataque Especial), maxPassos, nota }
export function opcoesGasto(f, d, alvo) {
  const ops = [];
  const n = d.nivel, patentes = temOpcional(f, 'patentes');
  if (alvo.tipo === 'pericia') {
    const p = d.PER[alvo.id];
    if (f.classe === 'especialista') {
      if (p.grau === 0) {
        ops.push({ id: 'ecletico', nome: 'Eclético', custo: 2, bonus: 5, nota: 'faz o teste como treinado' });
        const engenhosidade = patentes ? false : n >= 8;
        if (engenhosidade) ops.push({ id: 'engenhosidade', nome: 'Eclético + Engenhosidade', custo: 4, bonus: 10, nota: 'como veterano' });
      }
      if (f.escolhas.perito.includes(p.id) && p.grau >= 1) {
        const passo = patentes ? Math.max(0, d.patente.n - 2) : n >= 17 ? 3 : n >= 11 ? 2 : n >= 5 ? 1 : 0;
        const custo = (patentes ? 1 : 2) + passo;
        ops.push({ id: 'perito', nome: 'Perito', custo, dadoExtra: ['1d6', '1d8', '1d10', '1d12'][passo] });
      }
    }
    if (f.classe === 'sobrevivente') ops.push({ id: 'empenho', nome: 'Empenho', custo: 1, bonus: 2 });
    if (f.trilha === 'esperto' && trilhaLiberada(f, 4) && f.escolhas.perito.includes(p.id) && p.grau >= 1) ops.push({ id: 'entendido', nome: 'Entendido', custo: 1, dadoExtra: '1d4' });
    // trocar a perícia do teste (origens) e usar Intelecto como base (Conhecimento Aplicado / Prático)
    for (const t of TROCAS_PERICIA) {
      const [tipo, id] = t.fonte.split(':');
      if (tipo === 'origem' && f.origem !== id) continue;
      if (t.para === p.id || (t.de && !t.de.includes(p.id))) continue;
      ops.push({ id: 'troca-' + t.para, nome: `${t.nome}: usar ${PERICIA[t.para].nome}`, custo: t.custo, troca: t.para, nota: t.nota || '' });
    }
    const temPoder = id => f.poderes.some(x => x.id === id);
    const pratico = f.trilha === 'bibliotecario' && trilhaLiberada(f, 2);
    if ((temPoder('conhecimento-aplicado') || pratico) && p.atrUsado !== 'int' && !['luta', 'pontaria'].includes(p.id))
      ops.push({ id: 'atr-int', nome: pratico ? 'Conhecimento Prático: usar Intelecto' : 'Conhecimento Aplicado: usar Intelecto', custo: pratico && temPoder('conhecimento-aplicado') ? 1 : 2, atr: 'int' });
    if (temPoder('maos-firmes') && p.id === 'furtividade') ops.push({ id: 'maos-firmes', nome: 'Mãos Firmes', custo: 2, dados: 2, nota: 'esconder-se ou mexer em objetos' });
    if (temPoder('minha-dor-me-impulsiona') && ['acrobacia', 'atletismo', 'furtividade'].includes(p.id) && d.atual.pv <= d.pv - 5) ops.push({ id: 'minha-dor', nome: 'Minha Dor me Impulsiona', custo: 1, dadoExtra: '1d6' });
    const g = ORIGEM[f.origem]?.gasto;
    if (g && (!g.atr || g.atr.includes(p.atrUsado)) && (!g.pericias || g.pericias.includes(p.id)) && !(g.exceto || []).includes(p.id))
      ops.push({ id: 'origem', nome: ORIGEM[f.origem].poder, custo: g.custo, bonus: g.bonus, nota: g.nota || '' });
  }
  if (alvo.tipo === 'ataque') {
    const a = d.ataques[alvo.i];
    if (f.classe === 'combatente') {
      const max = patentes ? Math.max(1, d.patente.n - 1) : n >= 17 ? 4 : n >= 11 ? 3 : n >= 5 ? 2 : 1;
      const dobra = f.trilha === 'guerreiro' && trilhaLiberada(f, 20) && a.uso === 'corpo';
      ops.push({ id: 'ataque-especial', nome: 'Ataque Especial', maxPassos: max, custoPorPassos: k => (patentes ? k : k + 1), valorPasso: dobra ? 10 : 5, nota: dobra ? 'Potência Máxima: bônus dobrados' : 'cada +5 vai no ataque ou no dano' });
    }
    if (f.trilha === 'durao' && trilhaLiberada(f, 4)) ops.push({ id: 'pancada', nome: 'Pancada Forte', custo: 1, dados: 1 });
    if (f.trilha === 'infiltrador' && trilhaLiberada(f, 2)) {
      const nd = trilhaLiberada(f, 20) ? 4 : trilhaLiberada(f, 13) ? 3 : trilhaLiberada(f, 8) ? 2 : 1;
      ops.push({ id: 'furtivo', nome: 'Ataque Furtivo', custo: 1, danoDados: `${nd}d6`, nota: 'alvo desprevenido ou flanqueado; uma vez por rodada' });
    }
  }
  const temPar = id => f.paranormais.some(x => x.id === id);
  if (temPar('valer-se-do-caos')) ops.push({ id: 'caos', nome: 'Valer-se do Caos', custo: 0, dados: 1, caos: f.paranormais.some(x => x.id === 'valer-se-do-caos' && x.afinidade) ? 2 : 5, nota: 'se falhar ou o dado extra sair baixo, perde 1d4 de Sanidade' });
  if (temPar('antecipar-vitalidade')) {
    const max = f.atributos.vig + (f.paranormais.some(x => x.id === 'antecipar-vitalidade' && x.afinidade) ? 2 : 0);
    if (f.cargasAntecipacao < max) ops.push({ id: 'antecipar', nome: `Antecipar Vitalidade (${f.cargasAntecipacao}/${max} cargas)`, custo: 0, dados: 1, carga: true });
  }
  return ops;
}
