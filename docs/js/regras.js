import { condicoesEfetivas } from './combate.js?v=0.47';
import { OPCIONAIS_LIVRES } from './catalogo.js?v=0.47';
import { ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, nivelDoNex, CLASSES, ORIGEM, TRILHA, PODER, PODERES, VIRARAM_GERAIS, PATENTES, patenteDosPP, PROG_PATENTE, CIRCULOS, DESLOCAMENTO_BASE, EFEITO_CONDICAO, CRIACAO_ATRIBUTOS, PROTECOES, ALTERACOES_GERAIS, ALTERACOES_ELEMENTO, PODERES_PARANORMAIS, PODER_PARANORMAL, USAVEIS, TROCAS_PERICIA, MODIFICACAO, RITUAIS } from './catalogo.js?v=0.47';
import { CAPACIDADE_ARMAS, MOD_ACESSORIOS, PASSIVOS_ITENS } from './equipamentos.js?v=0.47';
import { passivosDeItens, passivoAmaldicoado, AMALDICOADOS, CONJURACAO, ELEMENTOS_MALDICAO } from './amaldicoados.js?v=0.47';
// ═══════════ aprendizado ═══════════
export const RITUAIS_DE_TRILHA = {
  'canalizar-o-medo': 'conduite',
  'conhecendo-o-medo': 'graduado',
  'lamina-do-medo': 'lamina',
  'medo-tangivel': 'flagelador',
  'presenca-do-medo': 'intuitivo',
};

export const circuloDeAprender = nex => nex >= 75 ? 3 : nex >= 45 ? 2 : 1;

function cabemNosLimites(rituais, vagas) {
  const limites = vagas.slice().sort((a, b) => b - a);
  return rituais.slice().sort((a, b) => b - a).every((c, i) => c <= (limites[i] ?? 0));
}

export function problemaAoAprender(ficha, derivada, ritual) {
  const trilha = RITUAIS_DE_TRILHA[ritual.id];
  if (ficha.rituais.some(r => r.nome === ritual.nome)) return 'Ritual já conhecido.';
  if (ritual.fonte === 'SaH' && ficha.modo !== 'sah') return 'Este ritual pertence ao modo Sobrevivendo ao Horror.';
  if (trilha) return ficha.trilha === trilha && derivada.trilhaHabs.some(h => h.nivel === 20 && h.liberada)
    ? '' : 'Este ritual exige a habilidade final da trilha correspondente.';
  if (ritual.ritualExigido && !ficha.rituais.some(r => r.nome === ritual.ritualExigido)) return `Exige conhecer ${ritual.ritualExigido}.`;
  if (ritual.requerAfinidades && !ritual.requerAfinidades.every(el => derivada.afinidade === el)) return 'Falta afinidade com os elementos exigidos.';
  if (derivada.vagasEspecificas.includes(ritual.id)) return '';
  const niveis = ficha.rituais.filter(r => !r.proprio && !derivada.vagasEspecificas.includes(r.idCatalogo)).map(r => r.circulo);
  return cabemNosLimites([...niveis, ritual.circulo], derivada.vagasRituais)
    ? '' : 'Nenhuma vaga permite este círculo neste momento.';
}

export function viaPoder(ficha, d, poder) {
  if (poder.id === 'transcender' && d.transcenderTrilhaLivre > 0) return 'trilha'; // Ele Me Ensina (Possuído)
  if (poder.id === 'transcender' && d.transcenderSeparado) return d.transcenderNexLivre > 0 ? 'nex' : '';
  const possuiVivencia = d.faixa?.id === 'adulto' && ficha.classe !== 'mundano';
  const vivenciaUsada = ficha.poderes.some(p => p.via === 'vivencia');
  const vagasComuns = d.slotsPoder - Number(possuiVivencia) + Number(d.versatilidade && !ficha.escolhas.versatilidade);
  const comuns = ficha.poderes.filter(p => !p.via && p.id !== 'proprio' && !(p.id === 'transcender' && d.transcenderSeparado)).length;
  const total = comuns + Number(vivenciaUsada);
  if (total >= vagasComuns + Number(possuiVivencia)) return '';
  const elegivelVivencia = poder.classe === ficha.classe || poder.classe === 'todas';
  if (possuiVivencia && !vivenciaUsada && elegivelVivencia && poder.id !== 'transcender') return 'vivencia';
  return comuns + Number(!possuiVivencia && vivenciaUsada) < vagasComuns ? 'classe' : '';
}

// ═══════════ idade ═══════════
export const FAIXAS_IDADE = [
  { id: 'crianca', nome: 'Criança', min: 9, max: 12, origem: 1, base: { for: 0, vig: 0 }, teto: { for: 1, vig: 1 } },
  { id: 'adolescente', nome: 'Adolescente', min: 13, max: 16, origem: 2, base: { for: 0 }, teto: { for: 2 } },
  { id: 'jovem', nome: 'Jovem', min: 17, max: 24 },
  { id: 'adulto', nome: 'Adulto', min: 25, max: 44, peso: 1 },
  { id: 'maduro', nome: 'Maduro', min: 45, max: 64, peso: 2, nex: 5 },
  { id: 'idoso', nome: 'Idoso', min: 65, max: Infinity, peso: 3, nex: 10 },
];

export const PESOS_IDADE = {
  catarata: ['Catarata', '−5 em Percepção e Pontaria.'],
  definhamento: ['Definhamento', '−5 em Fortitude e manobras.'],
  devagar: ['Devagar, Jovem!', '−3 m de deslocamento. Sem investidas.'],
  distraido: ['Distraído', 'Surpreendido na primeira rodada de ação e perde o primeiro turno de investigação.'],
  fragil: ['Frágil', '−2 PV por etapa de NEX.'],
  gota: ['Gota', 'Sofre 1d6 de dano ao testar Agilidade ou esquivar.'],
  juntas: ['Juntas Duras', '−5 em Acrobacia e Reflexos.'],
  melancolico: ['Melancólico', '−1 PE por etapa de NEX.'],
  meuTempo: ['No Meu Tempo', '−5 em Intuição e Vontade.'],
  pulmao: ['Pulmão Ruim', 'Sofre 1d6 de dano ao testar Força. Testa Fortitude desde a primeira rodada sem respirar. Investir causa fadiga até o fim da cena.'],
  rabugento: ['Rabugento', '−5 em testes de Presença, exceto Intimidação.'],
  recurvado: ['Recurvado', 'Tamanho Pequeno, sem bônus de Furtividade.'],
  sono: ['Sono Ruim', 'Qualidade do descanso uma categoria abaixo.'],
  teimoso: ['Teimoso', 'Sem bônus por ajuda, para dar ou receber.'],
  tosse: ['Tosse', 'Role 1d6 no começo da rodada de ação ou investigação. Em 1, perde o turno. Em interpretação, role em testes de perícia de Presença. Em 1, sofre −5.'],
};

export function faixaEtaria(ficha) {
  if (!ficha.opcionais?.idade || !/^\d+$/.test(String(ficha.idade).trim())) return undefined;
  const anos = Number(ficha.idade);
  return FAIXAS_IDADE.find(faixa => anos >= faixa.min && anos <= faixa.max);
}

export const temPeso = (ficha, id) => !!faixaEtaria(ficha)?.peso && ficha.pesosIdade?.includes(id);
export const origemAtiva = ficha => !faixaEtaria(ficha)?.origem || ficha.beneficiosOrigem?.includes('poder');
export const tetoEtario = (ficha, atributo, teto) => Math.min(teto, faixaEtaria(ficha)?.teto?.[atributo] ?? teto);
export const aumentoPermitido = (ficha, atributo, teto) => (
  (faixaEtaria(ficha)?.id !== 'idoso' || ['int', 'pre'].includes(atributo))
  && ficha.atributos[atributo] < tetoEtario(ficha, atributo, teto)
);

// ═══════════ efeitos-rituais ═══════════
const PERFIS = {
  'cicatrizacao': {
    basica: { formula: '3d8+3', cura: true, envelhece: true },
    discente: { formula: '5d8+5', cura: true, envelhece: true },
    verdadeiro: { formula: '7d8+7', cura: true, envelhece: true },
  },
  'decadencia': {
    basica: { formula: '2d8+2', teste: 'fortitude', sucesso: 'metade' },
    discente: { formula: '3d8+3', exigeAtaque: true },
    verdadeiro: { formula: '8d8+8', teste: 'fortitude', sucesso: 'metade' },
  },
  'esfolar': {
    basica: { formula: '3d4+3', teste: 'reflexos', sucesso: 'metade', condicao: 'sangrando' },
    discente: { formula: '5d4+5', teste: 'reflexos', sucesso: 'metade', condicao: 'sangrando' },
    verdadeiro: { formula: '10d4+10', teste: 'reflexos', sucesso: 'metade', condicao: 'sangrando', condicaoNoSucesso: 'sangrando' },
  },
  'desfazer-sinapses': {
    basica: { formula: '2d6+2', teste: 'vontade', sucesso: 'metade', condicao: 'frustrado', turnos: 1 },
    discente: { formula: '3d6+3', teste: 'vontade', sucesso: 'metade', condicao: 'frustrado', turnos: 1 },
    verdadeiro: { formula: '8d6+8', teste: 'vontade', sucesso: 'metade', condicao: 'esmorecido', condicaoNoSucesso: 'frustrado', turnos: 1 },
  },
  'eletrocussao': {
    basica: { formula: '3d6', teste: 'fortitude', sucesso: 'metade', condicao: 'vulneravel', turnos: 1 },
  },
  'definhar': {
    basica: { teste: 'fortitude', condicao: 'fatigado', condicaoNoSucesso: 'vulneravel' },
    discente: { teste: 'fortitude', condicao: 'exausto', condicaoNoSucesso: 'fatigado' },
    verdadeiro: { teste: 'fortitude', condicao: 'exausto', condicaoNoSucesso: 'fatigado' },
  },
};

export function perfilRitual(id, forma) {
  return PERFIS[id]?.[forma || 'basica'];
}

export function podeResolverRitual(id, formula, resistencia) {
  return Object.hasOwn(PERFIS, id) || !!(formula && /^(Fortitude|Reflexos|Vontade) (reduz|anula|evita)/i.test(resistencia));
}

// ═══════════ fabricacao ═══════════
export function parametrosFabricacao({ categoria, consumivel, improvisado, kit, mascate, propria }) {
  const improviso = Boolean(improvisado && !consumivel);
  return {
    acoes: consumivel || propria ? 1 : 2,
    quantidade: consumivel && propria ? 2 : 1,
    dt: 15 + 5 * categoria - (improviso ? mascate ? 10 : 5 : 0),
    penalidade: kit ? 0 : -5,
    improviso,
  };
}

// ═══════════ regras ═══════════
// regras.js — o MOTOR do sistema. A ficha guarda só as ESCOLHAS; derivar(ficha) calcula o resto.
// (mesma ideia do derive() do core.js do Arcana)


export const VERSAO_FICHA = 1;
export const LIMITE_DANOS_EXTRAS_MACRO = 12;
export function quantidadeMaldicoes(item) {
  return item.maldicoes?.length ?? (item.mods || []).filter(id => MODIFICACAO[id]?.maldicao).length;
}
export function categoriaEquipamento(item, reducao = 0) {
  const maldicoes = quantidadeMaldicoes(item);
  const extras = (item.mods || []).length + (item.maldicoes?.length || 0);
  return Math.min(4, Math.max(0, item.categoria + extras + Number(maldicoes > 0) - reducao));
}
const modsEquipamento = mods => (Array.isArray(mods) ? mods : []).filter(m => typeof m === 'string' && Object.hasOwn(MODIFICACAO, m));
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
const RITUAL_POR_NOME = new Map(RITUAIS.map(r => [semAcento(r.nome), r]));
const ritualDoCatalogo = nome => RITUAL_POR_NOME.get(semAcento(nome));

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
    transcenderSan: !!o.transcenderSan,
  } : { determinacao: false, nivelExp: false, patentes: false, ferimentos: false, progressaoNex: false, transcenderSan: false };
  for (const k of OPCIONAIS_LIVRES) opcionais[k] = !!o[k];
  let classe = CLASSES[f.classe] ? f.classe : 'combatente';
  if (CLASSES[classe].soSah && modo !== 'sah') classe = 'combatente';
  const atributos = {};
  for (const a of ATRIBUTOS) atributos[a.id] = int(f.atributos?.[a.id], 0, tetoEtario(f, a.id, 7), faixaEtaria(f)?.base?.[a.id] ?? 1);
  const pericias = {};
  for (const p of PERICIAS) { const g = int(f.pericias?.[p.id], 0, 3, 0); if (g) pericias[p.id] = g; }
  const bonusPericia = {};
  for (const p of PERICIAS) { const b = int(f.bonusPericia?.[p.id], -50, 50, 0); if (b) bonusPericia[p.id] = b; }
  const origem = ORIGEM[f.origem] && (ORIGEM[f.origem].fonte !== 'SaH' || modo === 'sah') ? f.origem : (f.origem === 'propria' ? 'propria' : '');
  const trilhaOk = TRILHA[f.trilha] && TRILHA[f.trilha].classe === classe && (TRILHA[f.trilha].fonte !== 'SaH' || modo === 'sah' || classe === 'sobrevivente');
  const r = f.recursos || {};
  const ficha = {
    id: txt(f.id, 60) || uid(), versao: VERSAO_FICHA, modo, opcionais,
    nome: txt(f.nome, 80), jogador: txt(f.jogador, 80), conceito: txt(f.conceito, 160), idade: txt(f.idade, 20),
    pesosIdade: [...new Set(lista(f.pesosIdade, 15))].filter(id => Object.hasOwn(PESOS_IDADE, id)).slice(0, faixaEtaria(f)?.peso || 0),
    treinoOrigem: Array.isArray(f.treinoOrigem) ? f.treinoOrigem.slice(0, 2).map(id => PERICIA[id] ? id : '') : null,
    treinoOutrasFontes: [...new Set(lista(f.treinoOutrasFontes, 40))].filter(id => PERICIA[id]),
    beneficiosOrigem: [...new Set(lista(f.beneficiosOrigem, 3))].filter(id => ['0', '1', 'poder'].includes(id)).slice(0, faixaEtaria(f)?.origem || 3),
    aparencia: txt(f.aparencia, 2000), historia: txt(f.historia, 6000), notas: txt(f.notas, 12000),
    retrato: typeof f.retrato === 'string' && f.retrato.startsWith('data:image/') && f.retrato.length < 400000 ? f.retrato : '',
    atributos, classe, trilha: trilhaOk ? f.trilha : '', origem,
    origemPropria: { nome: txt(f.origemPropria?.nome, 60), poder: txt(f.origemPropria?.poder, 60), resumo: txt(f.origemPropria?.resumo, 600) },
    nex: classe === 'mundano' ? 0 : NEX.includes(Number(f.nex)) ? Number(f.nex) : 5,
    nivel: int(f.nivel, 1, 20, 1), nexExposicao: int(f.nexExposicao, 0, 99, 0),
    estagio: int(f.estagio, 1, 5, 1), pp: int(f.pp, 0, 9999, 0),
    patenteManual: int(f.patenteManual, 0, 5, 0),
    limitesItens: Array.isArray(f.limitesItens) && f.limitesItens.length === 4 ? f.limitesItens.map(v => int(v, 0, 20, 0)) : null,
    creditoManual: ['Baixo', 'Médio', 'Alto', 'Ilimitado'].includes(f.creditoManual) ? f.creditoManual : '',
    pericias, bonusPericia,
    atributosPericias: Object.fromEntries(PERICIAS.flatMap(p => ATRIBUTOS.some(a => a.id === f.atributosPericias?.[p.id]) ? [[p.id, f.atributosPericias[p.id]]] : [])),
    permissoesMesa: Object.fromEntries(Object.entries(f.permissoesMesa || {}).filter(([codigo, acesso]) => /^OCULTA-[A-Z0-9]{4}$/.test(codigo) && ['consulta', 'editar'].includes(acesso)).slice(-100)),
    turnoManualIniciado: !!f.turnoManualIniciado,
    profissao: txt(f.profissao, 40),
    poderes: lista(f.poderes, 60).map(p => ({ id: PODER[p?.id] ? p.id : 'proprio', nome: txt(p?.nome, 80), resumo: txt(p?.resumo, 1000), escolha: txt(p?.escolha, 60), via: txt(p?.via, 60), deVersatilidade: !!p?.deVersatilidade && !TRILHA[f.escolhas?.versatilidade], uid: txt(p?.uid, 60) || uid() }))
      .filter(p => p.id !== 'proprio' || p.nome),
    habilidadesProprias: lista(f.habilidadesProprias, 60).map(h => ({ nome: txt(h?.nome, 80), resumo: txt(h?.resumo, 1500), custo: txt(h?.custo, 30), uid: txt(h?.uid, 60) || uid() })).filter(h => h.nome),
    notasHabilidade: Object.fromEntries(Object.entries(f.notasHabilidade || {}).slice(0, 120).map(([k, v]) => [txt(k, 80), txt(v, 1500)])),
    // Campos vazios (ritual aprendido em versão antiga, por exemplo) são completados com os dados do catálogo.
    rituais: lista(f.rituais, 80).map(x => { const c = ritualDoCatalogo(x?.nome) || {}; const vazio = (v, max, alt) => txt(v, max) || txt(alt, max); return ({
      formulasAvancadas: Object.fromEntries(['discente', 'verdadeiro'].map(id => [id, txt(x?.formulasAvancadas?.[id], 40).trim()])),
      custosAvancados: { discente: int(x?.custosAvancados?.discente, 0, 30, 2), verdadeiro: int(x?.custosAvancados?.verdadeiro, 0, 30, 5) },
      tipoDados: c.id && !x?.proprio ? c.tipoDados || 'dano' : x?.tipoDados === 'cura' || x?.tipoDados === 'dano' ? x.tipoDados : c.tipoDados || 'dano', // ritual do catálogo segue o catálogo
      rolagemExtra: FORMULA.test(txt(x?.rolagemExtra, 40)) ? txt(x?.rolagemExtra, 40) : '',
      elementos: c.elementos || [], idCatalogo: c.id || '', proprio: !c.id || !!x?.proprio,
      uid: txt(x?.uid, 60) || uid(), nome: txt(x?.nome, 80) || 'Ritual', elemento: txt(x?.elemento, 20) || 'conhecimento', circulo: int(x?.circulo ?? c.circulo, 1, 4, 1),
      execucao: vazio(x?.execucao, 40, c.execucao), alcance: vazio(x?.alcance, 40, c.alcance), alvo: vazio(x?.alvo, 80, c.alvo || c.area || c.efeitoArea), duracao: vazio(x?.duracao, 40, c.duracao), resistencia: vazio(x?.resistencia, 60, c.resistencia),
      efeito: vazio(x?.efeito, 3000, c.resumo), formula: txt(x?.formula, 40).trim() || (FORMULA.test(txt(c.dados, 40)) ? txt(c.dados, 40) : ''), discente: txt(x?.discente, 400), verdadeiro: txt(x?.verdadeiro, 400),
    }); }),
    armas: lista(f.armas, 40).map(a => ({
      uid: txt(a?.uid, 60) || uid(), nome: txt(a?.nome, 60) || 'Arma', prof: ['simples', 'taticas', 'pesadas'].includes(a?.prof) ? a.prof : 'simples',
      uso: ['corpo', 'disparo', 'fogo', 'arremesso'].includes(a?.uso) ? a.uso : 'corpo', categoria: int(a?.categoria, 0, 4, 0),
      dano: FORMULA.test(txt(a?.dano, 20)) && txt(a?.dano, 20) ? txt(a?.dano, 20) : '1d4', margem: int(a?.margem, 2, 20, 20), mult: int(a?.mult, 2, 6, 2),
      alcance: txt(a?.alcance, 20), tipo: txt(a?.tipo, 3), espacos: Number.isFinite(+a?.espacos) ? Math.min(20, Math.max(0, +a.espacos)) : 1,
      capacidade: int(a?.capacidade ?? CAPACIDADE_ARMAS[a?.nome], 0, 200), carregada: int(a?.carregada, 0, 200), reserva: int(a?.reserva, 0, 9999),
      bonusAtaque: int(a?.bonusAtaque, -20, 30, 0), bonusDano: int(a?.bonusDano, -20, 50, 0), maos: int(a?.maos, 1, 2, 1), municao: txt(a?.municao, 40), nota: txt(a?.nota, 400),
      favorita: !!a?.favorita, ferramenta: !!a?.ferramenta, balasLongas: !!a?.balasLongas, extraMultiplica: !!a?.extraMultiplica,
      reducaoMotivos: lista(a?.reducaoMotivos, 5).filter(m => ['ferramentas-paranormais'].includes(m)),
      reducaoOutra: int(a?.reducaoOutra, 0, 4, 0), reducaoOutraNome: txt(a?.reducaoOutraNome, 60),
      criticoExtra: FORMULA.test(txt(a?.criticoExtra, 30)) && /\d/.test(txt(a?.criticoExtra, 30)) ? txt(a?.criticoExtra, 30).replace(/\s+/g, '').replace(/^\+/, '') : '',
      mods: modsEquipamento(a?.mods), maldicao: { tipo: txt(a?.maldicao?.tipo, 20), elemento: txt(a?.maldicao?.elemento, 20), dados: FORMULA.test(txt(a?.maldicao?.dados, 20)) ? txt(a?.maldicao?.dados, 20) : '', texto: txt(a?.maldicao?.texto, 600) },
    })),
    protecoes: lista(f.protecoes, 10).map(p => ({ uid: txt(p?.uid, 60) || uid(), nome: txt(p?.nome, 60) || 'Proteção', peso: ['leve', 'pesada', 'escudo'].includes(p?.peso) ? p.peso : 'leve', defesa: int(p?.defesa, 0, 20, 5), rd: int(p?.rd, 0, 20, 0), categoria: int(p?.categoria, 0, 4, 1), espacos: Number.isFinite(+p?.espacos) ? Math.min(20, Math.max(0, +p.espacos)) : 2, vestida: p?.vestida !== false, mods: modsEquipamento(p?.mods), nota: txt(p?.nota, 400) })),
    penalidadeSanPermanente: int(f.penalidadeSanPermanente, 0, 999),
    projetosFabricacao: lista(f.projetosFabricacao, 20).filter(p => p?.nome).map(p => ({
      uid: txt(p.uid, 60) || uid(), nome: txt(p.nome, 80), categoria: int(p.categoria, 0, 4), espacos: int(p.espacos, 0, 20, 1),
      dt: int(p.dt, 5, 35, 15), penalidade: p.penalidade === -5 ? -5 : 0,
      exigidas: int(p.exigidas, 1, 3, 1), feitas: int(p.feitas, 0, 3), qtd: int(p.qtd, 1, 2, 1), improviso: !!p.improviso,
    })),
    interludio: {
      descanso: int(f.interludio?.descanso, 0, 3, 1),
      acoes: lista(f.interludio?.acoes, 2).filter(a => ['dormir', 'relaxar', 'revisar', 'manutencao', 'alimentar', 'exercitar', 'ler'].includes(a)),
    },
    itens: lista(f.itens, 120).map(i => {
      const maldicoes = (Array.isArray(i?.maldicoes) ? i.maldicoes : []).flatMap((nome, k) => {
        if (typeof nome !== 'string' || !nome.startsWith('Acessório amaldiçoado: ') || !Object.hasOwn(AMALDICOADOS, nome)) return [];
        const el = i.elementosMaldicoes?.[k];
        return [{ nome, el: ELEMENTOS_MALDICAO.includes(el) ? el : '' }];
      });
      return {
      expiraCena: !!i?.expiraCena, diasVestido: int(i?.diasVestido, 0, 999, 0), ativo: !!i?.ativo, carga: int(i?.carga, 0, 999, 0), usosDia: int(i?.usosDia, 0, 99, 0),
      ritualConjuracao: (i?.nome === CONJURACAO || maldicoes.some(m => m.nome === CONJURACAO)) && RITUAIS.some(r => r.circulo === 1 && r.id === i?.ritualConjuracao) ? i.ritualConjuracao : '',
      ritualSelo: RITUAIS.some(r => r.id === i?.ritualSelo) ? i.ritualSelo : '',
      poderDedo: PODER_PARANORMAL[i?.poderDedo] ? i.poderDedo : '',
      periciaKit: PERICIA[i?.periciaKit] ? i.periciaKit : '',
      escrito: !!i?.escrito, pericia: PERICIA[i?.pericia] ? i.pericia : '', periciaExtra: PERICIA[i?.periciaExtra] ? i.periciaExtra : '',
      mods: [...new Set(lista(i?.mods, 6))].filter(id => MOD_ACESSORIOS.some(m => m[0] === id)),
      elemento: ['sangue', 'morte', 'conhecimento', 'energia'].includes(i?.elemento) ? i.elemento : '', // componentes ritualísticos
      maldicoes: maldicoes.map(m => m.nome), elementosMaldicoes: maldicoes.map(m => m.el),
      elementoMaldicao: ELEMENTOS_MALDICAO.includes(i?.elementoMaldicao) ? i.elementoMaldicao : '',
      efeitos: lista(i?.efeitos, 6).map(e => ({ tipo: TIPOS_EFEITO_ITEM.includes(e?.tipo) ? e.tipo : '', alvo: txt(e?.alvo, 30), valor: int(e?.valor, -20, 20, 0) }))
        .filter(e => e.tipo && e.valor && (e.tipo === 'pericia' ? !!PERICIA[e.alvo] : e.tipo === 'atributo' ? ['agi', 'for', 'int', 'pre', 'vig'].includes(e.alvo) : true)),
       uid: txt(i?.uid, 60) || uid(), nome: txt(i?.nome, 80) || 'Item', categoria: int(i?.categoria, 0, 4, 0), espacos: Number.isFinite(+i?.espacos) ? Math.min(20, Math.max(0, +i.espacos)) : 1, qtd: int(i?.qtd, 0, 999, 1), nota: txt(i?.nota, 600) };
    }),
    recursos: { pv: r.pv == null ? null : int(r.pv, -999, 9999), pe: r.pe == null ? null : int(r.pe, -999, 9999), san: r.san == null ? null : int(r.san, -999, 9999), pd: r.pd == null ? null : int(r.pd, -999, 9999), pvTemp: int(r.pvTemp, 0, 999), peTemp: int(r.peTemp, 0, 999), morrendo: int(r.morrendo, 0, 3), enlouquecendo: int(r.enlouquecendo, 0, 3) },
    morto: !!f.morto,
    maldicoesAceitas: Object.fromEntries(Object.entries(f.maldicoesAceitas || {}).slice(0, 800).filter(([k, el]) =>
      /^(item|arma|protecao):[^\s]{1,110}$/.test(k) && ['conhecimento', 'energia', 'morte', 'sangue', 'medo'].includes(el))),
    prazosCondicao: Object.fromEntries(Object.entries(f.prazosCondicao || {}).slice(0, 40).filter(([id]) => f.condicoes?.includes(id)).map(([id, n]) => [id, int(n, 1, 99)])),
    condicoes: lista(f.condicoes, 40).filter(c => typeof c === 'string' && c.length < 30),
    origemCondicao: Object.fromEntries(Object.entries(f.origemCondicao || {}).filter(([id]) => f.condicoes?.includes(id)).slice(0, 40).map(([id, o]) => [id, txt(o, 120)])),
    marcadores: lista(f.marcadores, 40).filter(m => txt(m?.nome, 80)).map(m => ({
      uid: txt(m.uid, 60) || uid(), tipo: m.tipo === 'positivo' ? 'positivo' : 'negativo', nome: txt(m.nome, 80), texto: txt(m.texto, 200), origem: txt(m.origem, 120),
      dura: ['cena', 'turno', 'permanente'].includes(m.dura) ? m.dura : 'cena', turnos: int(m.turnos, 0, 99, 0),
      desfazer: m.desfazer && ATRIBUTOS.some(a => a.id === m.desfazer.atributo) ? { atributo: m.desfazer.atributo, valor: int(m.desfazer.valor, -5, 5, 0) } : null })),
    ferimentos: lista(f.ferimentos, 10).filter(a => ['agi', 'for', 'int', 'pre', 'vig'].includes(a)),
    escolhas: { versatilidade: TRILHA[f.escolhas?.versatilidade] ? f.escolhas.versatilidade : '', flashback: ORIGEM[f.escolhas?.flashback] ? f.escolhas.flashback : '', forcaSaber: PERICIA[f.escolhas?.forcaSaber] ? f.escolhas.forcaSaber : '', numeroSorte: txt(f.escolhas?.numeroSorte, 20), sangueFervente: f.escolhas?.sangueFervente === 'agi' ? 'agi' : 'for', perito: (Array.isArray(f.escolhas?.perito) ? f.escolhas.perito : []).filter(id => PERICIA[id] && id !== 'luta' && id !== 'pontaria').slice(0, 2), experimento: PERICIA[f.escolhas?.experimento] ? f.escolhas.experimento : '' },
    paranormais: lista(f.paranormais, 40).filter(p => PODER_PARANORMAL[p?.id]).map(p => ({ uid: txt(p.uid, 60) || uid(), id: p.id, trocaRitualUsada: !!p.trocaRitualUsada, transcenderUid: txt(p.transcenderUid, 60), circuloAprender: int(p.circuloAprender, 0, 3), escolha: txt(p.escolha, 40), afinidade: !!p.afinidade, fonte: ['transcender', 'origem', 'outro'].includes(p.fonte) ? p.fonte : 'outro' })),
    medos: lista(f.medos, 20).filter(x => x && Number.isInteger(x.n) && x.n >= 2 && x.n <= 20).map(x => ({ uid: txt(x.uid, 60) || uid(), n: x.n })),
    insanidades: lista(f.insanidades, 20).filter(x => x && Number.isInteger(x.n) && x.n >= 1 && x.n <= 20).map(x => ({ uid: txt(x.uid, 60) || uid(), n: x.n, missao: !!x.missao })),
    // Macros: sequências reutilizadas na aba Combate.
    macros: lista(f.macros, 30).map(m => ({ uid: txt(m?.uid, 60) || uid(), nome: txt(m?.nome, 60) || 'Macro', nota: txt(m?.nota, 300),
      noCombate: !!m?.noCombate, usaPd: !!m?.usaPd, pd: int(m?.pd, 0, 99, 1), // gastar PE/PD ao executar (o jogador marca e escolhe quanto)
      passos: lista(m?.passos, 8).map(p => ({ tipo: ['pericia', 'ataque', 'acerto', 'formula', 'gasto'].includes(p?.tipo) ? p.tipo : 'formula', alvo: txt(p?.alvo, 60), formula: txt(p?.formula, 40), rotulo: txt(p?.rotulo, 40), valor: int(p?.valor, 0, 99, 1),
        pericia: PERICIAS.some(x => x.id === p?.pericia) ? p.pericia : '', alcanceAtaque: p?.alcanceAtaque === 'distancia' ? 'distancia' : 'corpo',
        atributoDano: p?.atributoDano === 'nenhum' || ATRIBUTOS.some(a => a.id === p?.atributoDano) ? p.atributoDano : '',
        danoArma: txt(p?.danoArma, 40).trim(), tipoDanoArma: txt(p?.tipoDanoArma, 20), tipoDano: txt(p?.tipoDano, 20),
        danosExtras: lista(p?.danosExtras, LIMITE_DANOS_EXTRAS_MACRO).map(e => ({
          formula: txt(e?.formula, 40).trim(), tipo: txt(e?.tipo, 20), multiplicaCritico: e?.multiplicaCritico === true,
        })),
        criticoProprio: !!p?.criticoProprio, margem: int(p?.margem, 2, 20, 20), mult: int(p?.mult, 2, 6, 2) })) })),
    rolagensSalvas: lista(f.rolagensSalvas, 40).filter(r => r && txt(r.formula, 40) && /d/i.test(r.formula) && FORMULA.test(txt(r.formula, 40))).map(r => ({ uid: txt(r.uid, 60) || uid(), nome: txt(r.nome, 60) || 'Rolagem', formula: txt(r.formula, 40).replace(/\s+/g, '') })),
    efeitos: lista(f.efeitos, 30).map(e => ({ uid: txt(e?.uid, 60) || uid(), nome: txt(e?.nome, 80) || 'Efeito', dura: ['cena', 'rodada', 'proxima'].includes(e?.dura) ? e.dura : 'cena', nota: txt(e?.nota, 200), ef: limparEf(e?.ef) })),
    usosCena: Object.fromEntries(Object.entries(f.usosCena || {}).slice(0, 40).map(([k, v]) => [txt(k, 60), int(v, 0, 99, 0)])),
    gastoTurno: int(f.gastoTurno, 0, 999, 0),
    numTurno: int(f.numTurno, 0, 1e9, 0), numCena: int(f.numCena, 0, 1e9, 0),
    // registro de PE/PD gastos, com o nome da habilidade (Combate › Gastos de PE)
    gastosPE: lista(f.gastosPE, 300).filter(g => g && txt(g.nome, 60)).map(g => ({ nome: txt(g.nome, 60), custo: int(g.custo, 0, 999, 0), turno: int(g.turno, 0, 1e9, 0), cena: int(g.cena, 0, 1e9, 0) })),
    // regra opcional Reter Ritual (AS #01 p. 58): PE presos em rituais retidos
    rituaisRetidos: lista(f.rituaisRetidos, 20).filter(r => r && txt(r.nome, 80)).map(r => ({ uid: txt(r.uid, 60) || uid(), nome: txt(r.nome, 80), custo: int(r.custo, 0, 99, 0) })),
    cargasAntecipacao: int(f.cargasAntecipacao, 0, 20, 0),
    mochilaUtilidades: txt(f.mochilaUtilidades, 60), // uid do item guardado na Mochila de Utilidades
    aumentos: lista(f.aumentos, 10).filter(a => ['agi', 'for', 'int', 'pre', 'vig'].includes(a)),
    grausAplicados: int(f.grausAplicados, 0, 10, 0),
    bonus: Object.fromEntries(['defesa', 'esquiva', 'pv', 'pe', 'san', 'pd', 'desl', 'carga', 'rd', 'resistencia', 'iniciativaDados', 'paranormais', 'rituais'].map(k => [k, int(f.bonus?.[k], -99, 999, 0)])),
    elementoAfinidade: txt(f.elementoAfinidade, 20),
    // Livro de Regras p. 124: em NEX 50% o personagem se CONECTA a um elemento; a AFINIDADE só se desenvolve no próximo Transcender.
    // Fichas antigas (sem o campo) que já tinham elemento continuam com afinidade.
    afinidadeAtiva: typeof f.afinidadeAtiva === 'boolean' ? f.afinidadeAtiva && !!txt(f.elementoAfinidade, 20) : !!txt(f.elementoAfinidade, 20),
    nexAlt: { pen25: ['diplomacia', 'enganacao', 'intimidacao'].includes(f.nexAlt?.pen25) ? f.nexAlt.pen25 : '', pen35: ['atletismo', 'fortitude', 'reflexos'].includes(f.nexAlt?.pen35) ? f.nexAlt.pen35 : '', atr35: ['agi', 'for', 'int', 'vig'].includes(f.nexAlt?.atr35) ? f.nexAlt.atr35 : '' },
    criadoEm: txt(f.criadoEm, 40) || new Date().toISOString(), atualizadoEm: txt(f.atualizadoEm, 40) || new Date().toISOString(),
  };
  return ficha;
}

// ---------- Ajudantes ----------
export const temOpcional = (f, k) => (OPCIONAIS_LIVRES.includes(k) || f.modo === 'sah') && !!f.opcionais?.[k];
export const usaPD = f => temOpcional(f, 'determinacao') || temOpcional(f, 'patentes');
export const ehSobrevivente = f => f.classe === 'sobrevivente';
// NEX separado da experiência (só vale como EXPOSIÇÃO): regras NEX & Experiência, Patentes e o Sobrevivente
export const nexSeparado = f => f.classe !== 'mundano' && f.modo === 'sah' && (!!f.opcionais?.nivelExp || !!f.opcionais?.patentes || f.classe === 'sobrevivente');
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
  if (f.classe === 'mundano') return 1;
  if (ehSobrevivente(f)) return f.estagio;
  if (temOpcional(f, 'patentes')) return patenteDaFicha(f).n;
  if (temOpcional(f, 'nivelExp')) return f.nivel;
  return nivelDoNex(f.nex);
}
// "nível equivalente" (1..20) para pré-requisitos e bônus "por 5% de NEX"
export function nivelEquivalente(f) {
  if (f.classe === 'mundano') return 0;
  if (ehSobrevivente(f)) return 0;
  if (temOpcional(f, 'patentes')) return patenteDaFicha(f).limitePd;
  if (temOpcional(f, 'nivelExp')) return f.nivel;
  return nivelDoNex(f.nex);
}
export function textoNivel(f) {
  if (f.classe === 'mundano') return 'NEX 0% · Mundano';
  if (ehSobrevivente(f)) return `Estágio ${f.estagio}${f.modo === 'sah' ? ` · NEX ${f.nexExposicao}%` : ''}`;
  if (temOpcional(f, 'patentes')) return `${patenteDaFicha(f).nome} · NEX ${f.nexExposicao}%`;
  if (temOpcional(f, 'nivelExp')) return `Nível ${f.nivel} · NEX ${f.nexExposicao}%`;
  return `NEX ${f.nex}%`;
}

// Efeitos de origem + trilha + poderes já obtidos
function efeitosAtivos(f, passivosItens) {
  const efs = [];
  const o = ORIGEM[f.origem];
  if (o?.ef && origemAtiva(f)) efs.push({ fonte: o.poder, ...o.ef });
  const t = TRILHA[f.trilha];
  if (t) for (const h of t.habilidades) if (h.ef && trilhaLiberada(f, h.nivel)) efs.push({ fonte: h.nome, ...h.ef });
  for (const p of f.poderes) { const d = PODER[p.id]; if (d?.ef) efs.push({ fonte: d.nome, ...d.ef, escolha: p.escolha }); }
  const tv = TRILHA[f.escolhas?.versatilidade]; if (tv?.habilidades[0]?.ef) efs.push({ fonte: tv.habilidades[0].nome + ' (Versatilidade)', ...tv.habilidades[0].ef });
  const fb = ORIGEM[f.escolhas?.flashback]; if (fb?.ef && f.poderes.some(p => p.id === 'flashback')) efs.push({ fonte: fb.poder + ' (Flashback)', ...fb.ef });
  const poderesParanormais = [...f.paranormais];
  for (const item of f.itens) {
    if (item.nome === 'Dedo Decepado' && item.qtd && item.ativo && item.diasVestido >= 7
      && item.poderDedo && !poderesParanormais.some(p => p.id === item.poderDedo)) poderesParanormais.push({ id: item.poderDedo });
  }
  for (const p of poderesParanormais) { const d = PODER_PARANORMAL[p.id]; if (!d) continue; if (p.afinidade) { if (d.efAfinidade) efs.push({ fonte: d.nome + ' (afinidade)', ...d.efAfinidade }); } else if (d.ef) efs.push({ fonte: d.nome, ...d.ef }); }
  return efs.concat(passivosItens);
}
// Efeitos de itens comuns EQUIPADOS (campo "ativo"): os fixos da tabela PASSIVOS_ITENS (equipamentos.js, cada nome
// conta uma vez) e os que o jogador escolheu no próprio item (perícia, atributo, Defesa… para somar ou diminuir).
export const TIPOS_EFEITO_ITEM = ['pericia', 'atributo', 'defesa', 'desl', 'rd', 'carga', 'pv', 'pe', 'resistencia'];
export function passivosComuns(f) {
  const out = [], vistos = new Set();
  for (const it of f.itens || []) {
    if (!(it.qtd > 0) || AMALDICOADOS[it.nome]) continue;
    // maldições de acessório aplicadas no item (Amaldiçoar): valem com o acessório equipado
    if (it.escrito || it.ativo) for (const [k, n] of (it.maldicoes || []).entries()) {
      const passivo = passivoAmaldicoado(it, n, it.elementosMaldicoes?.[k]);
      if (passivo) out.push({ fonte: `${it.nome} (${n.replace('Acessório amaldiçoado: ', '')})`, ...passivo });
    }
    if (!it.ativo) continue;
    const def = PASSIVOS_ITENS[it.nome];
    if (def && !vistos.has(it.nome)) {
      vistos.add(it.nome);
      const { acessorio, exige, ...ef } = def;
      if (!exige || f.pericias?.[exige] >= 1) out.push({ fonte: it.nome, ...ef, ...(acessorio ? { acessorioItem: acessorio } : {}) });
    }
    if (it.efeitos?.length) {
      const ef = { fonte: it.nome, pericia: {}, atr: {} };
      for (const e of it.efeitos) {
        if (e.tipo === 'pericia') ef.pericia[e.alvo] = (ef.pericia[e.alvo] || 0) + e.valor;
        else if (e.tipo === 'atributo') ef.atr[e.alvo] = (ef.atr[e.alvo] || 0) + e.valor;
        else ef[e.tipo] = (ef[e.tipo] || 0) + e.valor;
      }
      out.push(ef);
    }
  }
  return out;
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
export function derivar(f, { armaUid, periciaAtaque, atributoDano, ritualExtra } = {}) {
  const cls = CLASSES[f.classe];
  const faixa = faixaEtaria(f);
  const crianca = faixa?.id === 'crianca', pequeno = crianca || temPeso(f, 'recurvado');
  const efeitosCondicao = condicoesEfetivas(f.condicoes);
  const at = { ...f.atributos };
  const passivosItens = [...passivosDeItens(f), ...passivosComuns(f)];
  for (const e of passivosItens) for (const [k, v] of Object.entries(e.atr || {})) if (k in at) at[k] += v;
  const forcaSaber = f.trilha === 'bibliotecario' && trilhaLiberada(f, 20);
  if (forcaSaber) at.int += 1;
  const n = nivelProgressao(f);
  const neq = nivelEquivalente(f);
  const efs = efeitosAtivos(f, passivosItens);
  const soma = k => efs.reduce((s, e) => s + (Number(e[k]) || 0), 0);
  const tem = k => efs.some(e => e[k]);
  const avisos = [];
  const pd = usaPD(f), patentes = temOpcional(f, 'patentes');
  const racional = tem('racional');
  const atrPE = racional ? at.int : at.pre - soma('semPE');

  // --- PV ---
  let pv;
  if (ehSobrevivente(f)) {
    pv = cls.pv[0] + at.vig + (f.estagio - 1) * cls.pv[1];
    if (TRILHA[f.trilha]?.id === 'durao' && f.estagio >= 2) pv += 4 + (f.estagio >= 3 ? 2 : 0);
  } else if (patentes && f.classe !== 'mundano') pv = cls.patente.pv[0] + at.vig + (n - 1) * (cls.patente.pv[1] + at.vig);
  else pv = cls.pv[0] + at.vig + (n - 1) * (cls.pv[1] + at.vig);
  if (temPeso(f, 'fragil')) pv -= 2 * Math.max(1, neq);
  pv += soma('pvPorNivel') * neq + soma('pv') + f.bonus.pv;
  if (temOpcional(f, 'ferimentos')) pv -= f.ferimentos.filter(a => a === 'vig').length * Math.max(1, neq);

  // --- PE / SAN / PD ---
  let pe = 0, san = 0, pdMax = 0;
  const pePorEfeitos = (faixa?.id === 'adolescente' ? 5 : 0) - (temPeso(f, 'melancolico') ? Math.max(1, neq) : 0) + (forcaSaber ? at.int : 0) + soma('pe') + soma('pePorNivel') * Math.max(1, neq) + soma('pePor2Niveis') * Math.floor(neq / 2) + (tem('peDedicacao') ? 1 + Math.floor((neq - 1) / 2) : 0);
  if (pd) {
    if (ehSobrevivente(f)) pdMax = cls.pd[0] + atrPE + (f.estagio - 1) * cls.pd[1];
    else if (patentes) pdMax = cls.patente.pd[0] + atrPE + (n - 1) * (cls.patente.pd[1] + atrPE);
    else pdMax = cls.pd[0] + atrPE + (n - 1) * (cls.pd[1] + atrPE);
    pdMax += -f.penalidadeSanPermanente + pePorEfeitos + f.bonus.pd + f.bonus.pe;
  } else {
    if (ehSobrevivente(f)) { pe = cls.pe[0] + atrPE + (f.estagio - 1) * cls.pe[1]; san = cls.san[0] + (f.estagio - 1) * cls.san[1] - (f.opcionais?.transcenderSan ? f.poderes.filter(p => p.id === 'transcender').length * cls.san[1] : 0); }
    else {
      pe = cls.pe[0] + atrPE + (n - 1) * (cls.pe[1] + atrPE);
      const transcender = f.poderes.filter(p => p.id === 'transcender').length;
      const custaSan = !nexSeparado(f) || !!f.opcionais?.transcenderSan;
      san = cls.san[0] + (n - 1) * cls.san[1] - (custaSan ? transcender * cls.san[1] : 0);
    }
    if (tem('sanMetade')) san = Math.floor(san / 2);
    san += soma('sanPorNivel') * neq + f.bonus.san - f.penalidadeSanPermanente;
    pe += pePorEfeitos + f.bonus.pe;
  }

  const peRetido = (f.rituaisRetidos || []).reduce((s, r) => s + r.custo, 0); // Reter Ritual: os PE retidos saem do máximo
  if (pd) pdMax -= peRetido; else pe -= peRetido;
  pv = Math.max(0, pv); pe = Math.max(0, pe); san = Math.max(0, san); pdMax = Math.max(0, pdMax);

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
  for (const c of efeitosCondicao) {
    const e = EFEITO_CONDICAO[c];
    if (e) for (const [k, v] of Object.entries(e)) ajusteDados[k] = Math.min(ajusteDados[k], v);
  }
  if (temOpcional(f, 'ferimentos')) for (const a of f.ferimentos) ajusteDados[a] -= 1;

  // --- carga ---
  let cargaMax = at.for > 0 ? at.for * 5 : 2;
  if (tem('cargaInt')) cargaMax = Math.max(cargaMax, (at.for + at.int) * 5);
  if (tem('cargaIntExtra')) cargaMax += at.int;
  cargaMax += soma('carga') + f.bonus.carga;
  const espacoArmas = f.armas.reduce((s, a) => s + Math.max(0, a.espacos + (a.mods || []).reduce((x, m) => x + (MODIFICACAO[m].ef?.espacos || 0), 0)), 0);
  const espacoProt = f.protecoes.reduce((s, p) => s + Math.max(0, p.espacos + p.mods.reduce((x, m) => x + (MODIFICACAO[m].ef?.espacos || 0), 0)), 0);
  const temMochilaUtil = f.poderes.some(p => p.id === 'mochila-de-utilidades');
  const itemMochila = temMochilaUtil ? f.itens.find(i => i.uid === f.mochilaUtilidades && i.qtd > 0) || null : null;
  if (temMochilaUtil && !itemMochila) avisos.push('Mochila de Utilidades: escolha o item guardado nela (aba Inventário).');
  const espacoUnidade = i => Math.max(0, i.espacos - Number((i.mods || []).includes('discreto')));
  const espacoItens = f.itens.reduce((s, i) => s + espacoUnidade(i) * Math.max(0, i.qtd), 0) - (itemMochila ? Math.min(1, espacoUnidade(itemMochila)) : 0);
  const cargaUsada = Math.round((espacoArmas + espacoProt + espacoItens) * 100) / 100;
  const sobrecarregado = cargaUsada > cargaMax;
  if (cargaUsada > cargaMax * 2) avisos.push('Carga acima do dobro do limite: não dá para carregar tudo isso.');

  // --- proficiências ---
  const prof = { ...(cls.prof || {}) };
  if (efs.some(e => e.profPesada)) prof.pesada = true;
  if (f.poderes.some(p => p.id === 'armamento-pesado')) prof.pesadas = true;
  

  // --- proteção / Defesa ---
  const vestidas = f.protecoes.filter(p => p.vestida);
  let defProt = 0, rd = soma('rd') + f.bonus.rd, penalCarga = 0;
  const modsP = p => p.mods.map(m => MODIFICACAO[m].ef || {});
  for (const p of vestidas) {
    const mp = modsP(p);
    defProt += p.defesa + mp.reduce((x, e) => x + (e.defesa || 0), 0);
    const rdCinetica = p.mods.some(m => MODIFICACAO[m].rdCinetica) && (p.peso === 'pesada' ? 5 : 2);
    rd += Math.max(p.rd, rdCinetica || 0, ...mp.map(e => e.rdPara || 0));
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
  for (const e of passivosItens) {
    for (const k of ['rdMental', 'dtRitual', 'ataque', 'dano', 'todasPericias', 'dadosTodas']) if (e[k]) ativo[k] += e[k];
    for (const [p, x] of Object.entries(e.dadosPericia || {})) ativo.dadosPericia[p] = (ativo.dadosPericia[p] || 0) + x;
  }
  // Sangue Fervente: machucado dá +1 (ou +2 com afinidade) em Agilidade ou Força
  const sf = f.paranormais.find(p => p.id === 'sangue-fervente');
  const pvAtualPrevio = f.recursos.pv;
  const sangueFervente = sf && pvAtualPrevio != null && pvAtualPrevio <= pv / 2 ? (f.paranormais.some(p => p.id === 'sangue-fervente' && p.afinidade) ? 2 : 1) : 0;
  if (sangueFervente) { ajusteDados[f.escolhas.sangueFervente] += sangueFervente; if (f.escolhas.sangueFervente === 'agi') ativo.defesa += sangueFervente; else ativo.dano += sangueFervente; }
  const sentidoTatico = 0, combateDefensivo = ativo.ataqueDados < 0;
  let defesa = 10 + (crianca ? 2 : 0) + at.agi + defProt + soma('defesa') + f.bonus.defesa + ajusteDados.defesa - (sobrecarregado ? 5 : 0) + ativo.defesa;
  // Defesa por partes (para a ficha mostrar de onde vem cada ponto); a soma das partes é a Defesa
  const efsItens = passivosItens.filter(e => e.defesa);
  const defItensEf = efsItens.reduce((s, e) => s + Number(e.defesa), 0);
  const defesaPartes = {
    base: 10 + (crianca ? 2 : 0), agilidade: at.agi,
    itens: defProt + defItensEf,
    itensFontes: [...vestidas.map(p => `${p.nome} +${p.defesa + modsP(p).reduce((x, e) => x + (e.defesa || 0), 0) + (p.peso === 'pesada' && tem('tanque') ? 2 : 0)}`), ...efsItens.map(e => `${e.fonte} ${e.defesa > 0 ? '+' : ''}${e.defesa}`)],
    habilidades: soma('defesa') - defItensEf,
    habilidadesFontes: efs.filter(e => e.defesa && !efsItens.some(x => x.fonte === e.fonte)).map(e => `${e.fonte} ${e.defesa > 0 ? '+' : ''}${e.defesa}`),
    efeitos: ativo.defesa,
    efeitosFontes: [...f.efeitos.filter(e => e.ef?.defesa).map(e => e.nome), ...(sangueFervente && f.escolhas.sangueFervente === 'agi' ? ['Sangue Fervente'] : [])],
    penalidades: ajusteDados.defesa - (sobrecarregado ? 5 : 0),
    penalidadesFontes: (() => { const conds = [...efeitosCondicao].filter(c => EFEITO_CONDICAO[c]?.defesa);
      return [...(sobrecarregado ? ['Sobrecarregado −5'] : []), ...conds.map(c => `${c[0].toUpperCase() + c.slice(1)} −${-EFEITO_CONDICAO[c].defesa}`), ...(conds.length > 1 ? ['condições não acumulam: vale a maior'] : [])]; })(),
    outros: f.bonus.defesa,
  };
  rd += ativo.rd;
  if (efeitosCondicao.has('petrificado')) rd = Math.max(10, rd);
  let desl = (crianca ? 6 : DESLOCAMENTO_BASE) - (temPeso(f, 'devagar') ? 3 : 0) + soma('desl') + f.bonus.desl - (sobrecarregado ? 3 : 0) + ativo.desl;

  if (efeitosCondicao.has('imovel')) desl = 0;
  else if (efeitosCondicao.has('caido')) desl = Math.min(desl, 1.5);
  else if (efeitosCondicao.has('lento')) desl = Math.floor(desl / 3) * 1.5;
  desl = Math.max(0, desl);

  // --- perícias ---
  const treinaOuMais = efs.filter(e => e.treinaOuMais).map(e => e.treinaOuMais);
  const bonusEf = {};
  for (const e of efs) if (e.pericia) for (const [k, v] of Object.entries(e.pericia)) bonusEf[k] = (bonusEf[k] || 0) + v;
  const resist = (crianca ? 5 : 0) + soma('resistencia') + f.bonus.resistencia + ativo.resistencia;
  const dadosEf = {};
  if (tem('experimento')) { if (f.escolhas.experimento) bonusEf[f.escolhas.experimento] = (bonusEf[f.escolhas.experimento] || 0) + 2; else avisos.push('Mutação (Experimento): escolha a perícia com +2 (aba Habilidades).'); dadosEf.diplomacia = (dadosEf.diplomacia || 0) - 1; }
  const acessorios = f.itens.filter(i => i.escrito && i.qtd > 0);
  const acessoriosFixos = efs.filter(e => e.acessorioItem).map(e => e.acessorioItem); // Amuleto sagrado, Pé de morto…
  const pericias = PERICIAS.map(p => {
    let grau = f.pericias[p.id] || 0;
    let extra = (bonusEf[p.id] || 0) + (f.bonusPericia[p.id] || 0) + (bonusNex[p.id] || 0) + ativo.todasPericias + (ativo.pericia[p.id] || 0);
    for (const t of treinaOuMais) if (t === p.id) { if (grau >= 1) extra += 2; else grau = 1; }
    let atr = p.atr;
    if (p.id === 'vontade' && racional && at.int > at.pre) atr = 'int';
    if (p.id === 'intimidacao' && f.poderes.some(x => x.id === 'valentao') && at.for > at.pre) atr = 'for';
    if (p.id === 'ocultismo' && f.poderes.some(x => x.id === 'olhar-sinistro') && at.pre > at.int) atr = 'pre';
    if (forcaSaber && f.escolhas.forcaSaber === p.id) atr = 'int';
    atr = f.atributosPericias?.[p.id] || atr;
    if (p.id === 'intuicao' && tem('intEmIntuicao')) extra += at.int;
    if (p.carga) extra -= penalCarga;
    if (['fortitude', 'reflexos', 'vontade'].includes(p.id)) extra += resist;
    if (p.id === 'ocultismo' && usaProgressaoNex(f) && nexAtual >= 25 && grau >= 1) extra += 2;
    if (!['luta', 'pontaria'].includes(p.id)) {
      const bonusAcessorio = acessorios.map(i => i.pericia === p.id ? i.mods.includes('aprimorado') ? 5 : 2 : i.mods.includes('funcao') && i.periciaExtra === p.id ? i.mods.includes('aprimorado-extra') ? 5 : 2 : 0);
      extra += Math.max(0, ...bonusAcessorio, ...acessoriosFixos.map(a => a[p.id] || 0));
    }
    if (crianca && p.id === 'furtividade') extra += 2;
    if (temPeso(f, 'catarata') && ['percepcao', 'pontaria'].includes(p.id)) extra -= 5;
    if (temPeso(f, 'definhamento') && p.id === 'fortitude') extra -= 5;
    if (temPeso(f, 'juntas') && ['acrobacia', 'reflexos'].includes(p.id)) extra -= 5;
    if (temPeso(f, 'meuTempo') && ['intuicao', 'vontade'].includes(p.id)) extra -= 5;
    if (temPeso(f, 'rabugento') && atr === 'pre' && p.id !== 'intimidacao') extra -= 5;
    const bonus = GRAUS[grau].bonus + extra;
    const dadosCondicao = (p.id === 'percepcao' && efeitosCondicao.has('fascinado') ? -2 : 0) + (p.id === 'pontaria' || p.id === 'luta' ? (efeitosCondicao.has('ofuscado') ? -1 : 0) : 0) + (p.id === 'reflexos' && efeitosCondicao.has('desprevenido') ? -1 : 0)
      + (p.id === 'percepcao' && efeitosCondicao.has('ofuscado') ? -1 : 0)
      + (p.id === 'iniciativa' && efeitosCondicao.has('surdo') ? -2 : 0);
    const ajuste = dadosCondicao + ajusteDados[atr] + ajusteDados.todos + ajusteDados.pericias + (dadosNex[p.id] || 0) + (dadosEf[p.id] || 0) + ativo.dadosTodas + (ativo.dadosPericia[p.id] || 0) + (f.poderes.some(x => x.id === 'foco-em-pericia' && x.escolha === p.id) ? 1 : 0);
    const valorAtr = at[atr];
    const bloqueada = p.treinada && grau === 0 && !(p.id === 'ocultismo' && usaProgressaoNex(f) && nexAtual >= 25);
    if (grau === 2 && neq < 7 && !ehSobrevivente(f)) avisos.push(`${p.nome}: veterano só a partir de NEX 35% (nível 7).`);
    if (grau === 3 && neq < 14 && !ehSobrevivente(f)) avisos.push(`${p.nome}: expert só a partir de NEX 70% (nível 14).`);
    const kitAcessorio = acessorios.some(i => i.periciaKit === p.id && i.mods.includes('instrumental'));
    return { ...p, kitAcessorio, atrUsado: atr, grau, bonus, ajuste, dados: dadosDoTeste(valorAtr, ajuste), bloqueada, valorAtr };
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
    const periciaPadrao = a.uso === 'corpo' ? 'luta' : 'pontaria';
    const pericia = a.uid === armaUid && Object.hasOwn(PER, periciaAtaque) ? periciaAtaque : periciaPadrao;
    const pe = PER[pericia];
    const profEspecial = (a.uso === 'fogo' && temPoder('balistica-avancada'))
      || (['corpo', 'disparo'].includes(a.uso) && temPoder('ninja-urbano'));
    const temProf = a.prof === 'simples' || (a.prof === 'taticas' ? !!prof.taticas || profEspecial : !!prof.pesadas);
    let ajuste = pe.ajuste - ativo.dadosTodas - (ativo.dadosPericia[pericia] || 0) + (temProf ? 0 : -1) + ativo.ataqueDados;
    let danoExtra = a.bonusDano + ativo.dano, bonusAtaque = a.bonusAtaque + ativo.ataque - ativo.todasPericias - (ativo.pericia[pericia] || 0);
    let dadosExtras = 0;
    const notas = [];
    if (efeitosCondicao.has('agarrado') || efeitosCondicao.has('enredado')) ajuste -= 1;
    if (a.uso === 'corpo' && efeitosCondicao.has('caido')) ajuste -= 2;
    const atrDanoPadrao = ['corpo', 'arremesso'].includes(a.uso) ? 'for' : tem('agiDisparo') ? 'agi' : '';
    const atrDano = a.uid === armaUid && atributoDano ? atributoDano : atrDanoPadrao;
    danoExtra += at[atrDano] || 0;
    if (a.uso === 'corpo') { danoExtra += soma('danoCorpo'); dadosExtras += soma('dadoCorpo'); }
    if (a.uso === 'fogo') danoExtra += soma('danoFogo');
    if (temPoder('ninja-urbano') && (a.uso === 'corpo' || a.uso === 'disparo')) { danoExtra += 2; notas.push('Ninja Urbano +2'); }
    // Maldição Predadora (Livro de Regras p. 146): a margem de ameaça dobra antes de qualquer aumento (19 vira 17).
    const margemBase = (a.mods || []).some(m => MODIFICACAO[m]?.ef?.margemDobro) ? 21 - (21 - a.margem) * 2 : a.margem;
    let margem = margemBase - (a.uso === 'corpo' ? soma('margemCorpo') : 0) - soma('margemTodas') - ativo.margemTodas;
    const mult = a.mult + soma('multTodas') + (a.mods || []).filter(m => MODIFICACAO[m]?.ef?.mult).length;
    if (a.ferramenta && tem('ferramenta')) { bonusAtaque += 1; danoExtra += 1; margem -= 1; notas.push('Ferramenta de Trabalho'); }
    if (a.balasLongas && f.trilha === 'atirador' && trilhaNv(2)) { danoExtra += at.int; notas.push('Mira de Elite +Int'); }
    // Redução de categoria (Editar arma › "Por que a categoria diminuiu"): favorita do Aniquilador, Ferramentas Paranormais e motivo do mestre
    const reducoesCategoria = [];
    if (a.favorita && favoritaReducao) reducoesCategoria.push([`Arma favorita (${trilhaNv(20) ? 'Máquina de Matar' : trilhaNv(8) ? 'Técnica Secreta' : 'A Favorita'})`, favoritaReducao]);
    if ((a.reducaoMotivos || []).includes('ferramentas-paranormais') && temPoder('ferramentas-paranormais')) reducoesCategoria.push(['Ferramentas Paranormais', 1]);
    if (a.reducaoOutra) reducoesCategoria.push([a.reducaoOutraNome || 'Outro motivo (mestre)', a.reducaoOutra]);
    const reducao = reducoesCategoria.reduce((s, [, n]) => s + n, 0);
    if (a.favorita && favoritaReducao) { notas.push(`Favorita (−${favoritaReducao} cat.)`); if (trilhaNv(20)) { margem -= 2; dadosExtras += 1; } }
    const extrasDados = [], dadosDeCritico = [];
    for (const m of a.mods || []) { const e = MODIFICACAO[m].ef || {}; bonusAtaque += e.ataque || 0; danoExtra += e.dano || 0; margem -= e.margem || 0; dadosExtras += e.dados || 0; if (e.danoDados) (e.criticoDados ? dadosDeCritico : extrasDados).push(e.danoDados); if (e.mult) notas.push('+1 mult.'); notas.push(MODIFICACAO[m].nome); }
    if (a.maldicao?.tipo) { if (a.maldicao.dados) extrasDados.push(a.maldicao.dados); notas.push(`Amaldiçoada${a.maldicao.elemento ? ' (' + a.maldicao.elemento + ')' : ''}`); }
    if (combateDefensivo) notas.push('Combate Defensivo −1d20');
    const [qtd, lados] = (a.dano.match(/(\d*)d(\d+)/) || [0, '1', '4']).slice(1).map(Number);
    const dadoBase = `${(qtd || 1) + dadosExtras}d${lados}`;
    const resto = a.dano.replace(/^\s*\d*d\d+/, '');
    const formula = dadoBase + dadosDeCritico.map(x => '+' + x).join('') + resto + extrasDados.map(x => '+' + x).join('') + (danoExtra ? (danoExtra > 0 ? `+${danoExtra}` : `${danoExtra}`) : '');
    return { ...a, mult, gruposCritico: 1 + dadosDeCritico.length + (a.extraMultiplica ? (resto.match(/\d*d\d+/g) || []).length : 0), bloqueadaTamanho: pequeno && a.maos === 2, pericia, periciaNome: pe.nome, dados: dadosDoTeste(at[pe.atrUsado], ajuste), bonus: pe.bonus + bonusAtaque, formula, margem: Math.max(2, margem), temProf, notas, categoriaEfetiva: categoriaEquipamento(a, reducao), categoriaSemReducao: categoriaEquipamento(a, 0), reducoesCategoria };
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
  if (faixa?.id === 'adulto' && f.classe !== 'mundano') slotsPoder++;
  // Transcender x poderes paranormais (contados separados)
  const transcenderes = f.poderes.filter(p => p.id === 'transcender').length;
  const limiarNex = [25, 35, 50, 60, 75, 90];
  const transcenderSeparado = nexSeparado(f); // SaH p. 98: com NEX separado, Transcender deixa de ser poder de classe (vale também para o sobrevivente)
  // Vagas de Transcender dadas por habilidade (Ele Me Ensina, do Possuído): não ocupam poder de classe
  const transcenderExtra = soma('transcenderExtra');
  const transcenderTrilha = f.poderes.filter(p => p.id === 'transcender' && p.via === 'trilha').length;
  const transcenderTrilhaLivre = Math.max(0, transcenderExtra - transcenderTrilha);
  const chamadosNex = limiarNex.filter(x => nexAtual >= x).length;
  const limiteTranscender = (transcenderSeparado ? chamadosNex : slotsPoder + (versatilidade ? 1 : 0)) + transcenderExtra;
  // NEX separado: cada faixa de NEX é um "chamado"; quem não transcende antes do próximo perde a chance (Livro de Regras p. 110).
  // Por isso fica no máximo 1 Transcender pendente, mesmo que faixas antigas tenham passado sem uso.
  const transcenderNexLivre = transcenderSeparado ? Math.min(1, Math.max(0, chamadosNex - (transcenderes - transcenderTrilha))) : 0;
  const pontosPossessao = tem('possuido') ? 3 + 2 * transcenderes : 0; // Possuído: 3 + 2 por Transcender
  const paranormalDaOrigem = ORIGEM[f.origem]?.id === 'cultista' && origemAtiva(f) ? 1 : 0;
  const limiteParanormais = transcenderes + paranormalDaOrigem + (f.bonus.paranormais || 0);
  const paranormaisUsados = f.paranormais.length;
  if (transcenderes > limiteTranscender) avisos.push(`Transcender: ${transcenderes} de ${limiteTranscender} permitidos${transcenderSeparado ? ' (um a cada faixa de NEX 25/35/50/60/75/90%)' : ''}.`);
  if (paranormaisUsados > limiteParanormais) avisos.push(`Poderes paranormais: ${paranormaisUsados} de ${limiteParanormais} permitidos.`);
  const porElemento = {};
  for (const p of f.paranormais) { const def = PODER_PARANORMAL[p.id]; const el = def.elemento === 'variavel' ? semAcento(p.escolha) : def.elemento; if (el) porElemento[el] = (porElemento[el] || 0) + 1; }
  const expansao = f.paranormais.filter(p => p.id === 'expansao-de-conhecimento').length;
  const poderesEscolhidos = f.poderes.filter(p => (!p.via || p.via === 'vivencia') && p.id !== 'proprio' && !(transcenderSeparado && p.id === 'transcender')).length;
  const pontosCriacao = (ehSobrevivente(f) ? CRIACAO_ATRIBUTOS.pontosSobrevivente : CRIACAO_ATRIBUTOS.pontos);
  const somaAtr = ATRIBUTOS.reduce((s, a) => s + f.atributos[a.id], 0);
  const esperado = 5 + pontosCriacao + slotsAtributo;
  if (somaAtr > esperado + (Object.values(f.atributos).some(v => v === 0) ? 1 : 0)) avisos.push(`Atributos somam ${somaAtr}; o esperado é até ${esperado} (+1 se um atributo estiver em 0).`);
  // Versatilidade (NEX 50%) é contada à parte dos poderes de classe
  const conta = p => (!p.via || p.via === 'vivencia') && p.id !== 'proprio' && !(transcenderSeparado && p.id === 'transcender');
  const usouVersatilidade = versatilidade && (!!TRILHA[f.escolhas.versatilidade] || f.poderes.some(p => p.deVersatilidade));
  const poderesDeClasse = poderesEscolhidos - (f.poderes.some(p => p.deVersatilidade && conta(p)) ? 1 : 0);
  const cultista = ORIGEM[f.origem]?.id === 'cultista' ? 1 : 0;
  if (poderesDeClasse > slotsPoder + cultista + (versatilidade && !usouVersatilidade ? 1 : 0)) avisos.push(`Você tem ${poderesDeClasse} poderes de classe; o nível atual dá direito a ${slotsPoder}${versatilidade ? ' (a Versatilidade é contada à parte)' : ''}.`);
  if (versatilidade && !usouVersatilidade) avisos.push(poderesDeClasse > slotsPoder + cultista
    ? 'Versatilidade (NEX 50%): você tem um poder de classe além das vagas. Se ele veio da Versatilidade, marque-o na aba Poderes com "É da Versatilidade".'
    : 'Versatilidade (NEX 50%) ainda não escolhida: um poder de classe a mais OU a 1ª habilidade de outra trilha da sua classe.');
  if (!f.trilha && trilhaLiberada(f, 2)) avisos.push('Escolha sua trilha.');
  if (!f.origem) avisos.push('Escolha uma origem.');

  // --- rituais ---
  const circuloClasse = f.classe === 'ocultista' ? (patentes ? Math.max(1, n - 1) : n >= 17 ? 4 : n >= 11 ? 3 : n >= 5 ? 2 : 1) : 1;
  const circulosAprender = f.paranormais.filter(p => p.id === 'aprender-ritual').slice(0, Math.max(0, at.int))
    .map(p => p.circuloAprender || circuloDeAprender(nexAtual));
  const circuloMax = Math.max(circuloClasse, ...circulosAprender);
  const dtRitual = 10 + limitePE + at.pre + ativo.dtRitual;
  const elementosEsp = f.poderes.filter(p => p.id === 'especialista-em-elemento').map(p => semAcento(p.escolha));
  const elementosMestre = f.poderes.filter(p => p.id === 'mestre-em-elemento').map(p => semAcento(p.escolha));
  const prediletos = f.poderes.filter(p => p.id === 'ritual-predileto').map(p => semAcento(p.escolha));
  const eficientes = f.trilha === 'graduado' && trilhaLiberada(f, 13) ? 5 : 0;
  const rituais = (ritualExtra ? [...f.rituais, ritualExtra] : f.rituais).map(r => {
    const elementos = r.elementos?.length ? r.elementos : [semAcento(r.elemento)], notas = [];
    let custo = CIRCULOS[r.circulo - 1].custo, dt = dtRitual + eficientes;
    if (eficientes) notas.push('Rituais Eficientes +5 DT');
    if (elementos.some(el => elementosEsp.includes(el))) { dt += 2; notas.push('Especialista em Elemento +2 DT'); }
    if (elementos.some(el => elementosMestre.includes(el))) { custo -= 1; notas.push('Mestre em Elemento −1'); }
    if (prediletos.includes(semAcento(r.nome))) { custo -= 1; notas.push('Ritual Predileto −1'); }
    const bonusFormula = temPoder('ritual-potente') ? at.int : 0;
    const formulaFinal = r.formula && bonusFormula ? r.formula + `+${bonusFormula}` : r.formula;
    if (bonusFormula && (r.formula || Object.values(r.formulasAvancadas || {}).some(Boolean))) notas.push('Ritual Potente +Int');
    return { ...r, custo: Math.max(1, custo), dt, formulaFinal, bonusFormula, notas };
  });

  // --- quantos rituais pode conhecer ---
  const vagasRituais = [];
  if (f.classe === 'ocultista') {
    vagasRituais.push(1, 1, 1);
    for (let nivel = 2; nivel <= n; nivel++) {
      const circulo = patentes ? Math.max(1, nivel - 1) : nivel >= 17 ? 4 : nivel >= 11 ? 3 : nivel >= 5 ? 2 : 1;
      vagasRituais.push(circulo);
      if (patentes) vagasRituais.push(circulo);
    }
  }
  if (f.trilha === 'graduado' && trilhaLiberada(f, 2)) {
    for (let c = 1; c <= circuloClasse; c++) vagasRituais.push(c);
  }
  if (f.trilha === 'esoterico' && trilhaLiberada(f, 4)) vagasRituais.push(1);
  // Lâmina Maldita ensina um ritual específico. Se já o conhece, vem o benefício de custo.
  const vagasEspecificas = f.trilha === 'lamina' && trilhaLiberada(f, 2) ? ['amaldicoar-arma'] : [];
  for (const [id, trilha] of Object.entries(RITUAIS_DE_TRILHA)) {
    if (f.trilha === trilha && trilhaLiberada(f, 20)) vagasEspecificas.push(id);
  }
  vagasRituais.push(...circulosAprender);
  for (let i = 0; i < Math.min(80, Math.max(0, f.bonus.rituais)); i++) vagasRituais.push(circuloMax);
  const limiteRituais = vagasRituais.length + vagasEspecificas.length;

  // --- patente e itens por categoria ---
  const patBase = patenteDaFicha(f);
  const patente = { ...patBase, itens: f.classe === 'mundano' ? [1, 0, 0, 0] : f.limitesItens || patBase.itens, credito: f.creditoManual || patBase.credito, itensEditados: !!f.limitesItens, creditoEditado: !!f.creditoManual };
  const usoCategoria = [0, 0, 0, 0, 0];
  for (const a of ataques) if (!a.automatica) usoCategoria[a.categoriaEfetiva]++;
  for (const p of f.protecoes) usoCategoria[categoriaEquipamento(p)]++;
  for (const i of f.itens) if (i.qtd > 0) usoCategoria[Math.max(0, categoriaEquipamento(i) - (i === itemMochila ? 1 : 0))]++;
  if (!ehSobrevivente(f)) for (let c = 1; c <= 4; c++) if (usoCategoria[c] > patente.itens[c - 1]) avisos.push(`Itens de categoria ${'I'.repeat(c).replace('IIII', 'IV')}: ${usoCategoria[c]} de ${patente.itens[c - 1]} permitidos pela patente.`);

  // --- recursos atuais (null = cheio) ---
  const atual = {
    pv: Math.min(f.recursos.pv ?? pv, pv), pe: Math.min(f.recursos.pe ?? pe, pe),
    san: Math.min(f.recursos.san ?? san, san), pd: Math.min(f.recursos.pd ?? pdMax, pdMax),
  };
  const machucado = atual.pv <= pv / 2;

  // --- iniciativa ---
  const iniciativa = PER.iniciativa;
  const bloqueio = PER.fortitude.grau >= 1 ? PER.fortitude.bonus + (f.trilha === 'tropa' && trilhaLiberada(f, 2) ? at.vig : 0) + soma('bloqueio') : null;
  let rdMental = (tem('rdMentalInt') ? at.int : 0) + ativo.rdMental;
  const rdElemento = {};
  const fontesRD = [...passivosItens, ...vestidas.flatMap(modsP)];
  for (const e of fontesRD) for (const [el, valor] of Object.entries(e.rdElemento || {})) rdElemento[el] = Math.max(rdElemento[el] || 0, valor);
  if (f.trilha === 'intuitivo' && trilhaLiberada(f, 13)) rdMental = Math.max(rdMental, 10);
  const esquiva = PER.reflexos.grau >= 1 ? PER.reflexos.bonus : null; // bônus de Reflexos somado à Defesa ao esquivar (LR p. 88)
  const esquivaTotal = esquiva == null ? null : defesa + esquiva + f.bonus.esquiva;

  // --- PENDÊNCIAS: o que falta fazer na ficha ---
  const transcenderLivres = (transcenderSeparado ? transcenderNexLivre : Math.max(0, slotsPoder + (versatilidade ? 1 : 0) - poderesEscolhidos)) + transcenderTrilhaLivre;
  const pend = [];
  const aumentosFaltando = Math.max(0, slotsAtributo - f.aumentos.length);
  if (aumentosFaltando) pend.push({ id: 'atributo', texto: `${aumentosFaltando} aumento(s) de atributo para escolher`, acao: 'aumento-atributo' });
  const porGrau = (CLASSES[f.classe].grauTreinamento || 0) + at.int;
  const grausFaltando = Math.max(0, slotsGrau - f.grausAplicados);
  if (grausFaltando) pend.push({ id: 'grau', texto: `${grausFaltando} grau(s) de treinamento: ${porGrau} perícias para virar ${neq >= 14 ? 'veterano ou expert' : 'veterano'}`, acao: 'grau-treinamento' });
  const poderesLivres = Math.max(0, slotsPoder + (versatilidade ? 1 : 0) - poderesEscolhidos - (versatilidade && f.escolhas.versatilidade ? 1 : 0));
  if (poderesLivres) pend.push({ id: 'poder', texto: `${poderesLivres} poder(es) de classe para escolher${transcenderSeparado ? '' : ' (Transcender conta como um)'}`, acao: 'escolher-poder' });
  if (transcenderSeparado && transcenderNexLivre) pend.push({ id: 'transcender', texto: 'Transcender disponível: seu NEX chegou a uma faixa de alteração (25/35/50/60/75/90%). É opcional, mas se não transcender antes da próxima faixa, perde esta chance.', acao: 'transcender' });
  if (transcenderTrilhaLivre) pend.push({ id: 'transcender-trilha', texto: 'Ele Me Ensina: Transcender (ou o primeiro poder de outra trilha de ocultista, anotado à mão)', acao: 'transcender' });
  if (nexAtual >= 50 && !f.elementoAfinidade) pend.push({ id: 'conexao', texto: 'NEX 50%: escolher o elemento de conexão (vira afinidade no próximo Transcender)', acao: 'escolher-conexao' });
  if (f.paranormais.length < limiteParanormais) pend.push({ id: 'paranormal', texto: `${limiteParanormais - f.paranormais.length} poder(es) paranormal(is) para escolher`, acao: 'janela-paranormal' });
  if (limiteRituais && f.rituais.length < limiteRituais) pend.push({ id: 'rituais', texto: `${limiteRituais - f.rituais.length} ritual(is) para aprender (até o ${circuloMax}º círculo)`, aba: 'rituais' });
  if (!f.trilha && trilhaLiberada(f, 2)) pend.push({ id: 'trilha', texto: 'Escolher a trilha', aba: 'habilidades' });
  if (versatilidade && !f.escolhas.versatilidade && poderesEscolhidos <= slotsPoder) pend.push({ id: 'versatilidade', texto: 'Escolher a Versatilidade (NEX 50%)', acao: 'versatilidade' });

  return {
    faixa, pequeno, atributosEfetivos: at, condicoesEfetivas: efeitosCondicao,
    semAcoes: f.morto || ['inconsciente', 'atordoado', 'pasmo', 'fascinado', 'surpreendido', 'morrendo'].some(c => efeitosCondicao.has(c)),
    podeInvestir: !efeitosCondicao.has('imovel') && !efeitosCondicao.has('lento') && !efeitosCondicao.has('caido') && !temPeso(f, 'devagar'),
    custoCondicao: efeitosCondicao.has('alquebrado') ? 1 : 0, reflexosFalha: ['indefeso', 'inconsciente', 'paralisado'].some(c => efeitosCondicao.has(c)), manobraIdade: (pequeno ? -2 : 0) - (temPeso(f, 'definhamento') ? 5 : 0),
    pendencias: pend, afinidade: f.afinidadeAtiva ? f.elementoAfinidade : '', transcenderLivres, limiteRituais, porGrau, nomesAtivos: f.efeitos.map(e => e.nome),
    nivel: n, nivelEq: neq, textoNivel: textoNivel(f), nexAtual, alteracoesNex, nexSeparado: nexSeparado(f), progressaoNex: usaProgressaoNex(f), pd, pv, pe, san, pdMax, peRetido, atual, machucado, limitePE, limiteRitual,
    defesa, rd, desl, cargaMax, cargaUsada, sobrecarregado, itemMochila: itemMochila?.uid || '', temMochilaUtil, penalCarga, prof, pericias, PER, ataques, habilidades, trilha, trilhaHabs,
    poderesEscolhidos, expansao, forcaSaber, slotsPoder, slotsAtributo, slotsGrau, versatilidade, trilhaEm, transcenderes, limiteTranscender, transcenderSeparado, transcenderNexLivre, transcenderTrilhaLivre, pontosPossessao, possuido: tem('possuido'), limiteParanormais, paranormaisUsados, paranormalDaOrigem, porElemento, ativo, sangueFervente,
    limiteAcao: limitePE + soma('limiteAcao'), circuloMax, vagasRituais, vagasEspecificas, dtRitual, rituais, patente, usoCategoria,
    iniciativa, bloqueio, esquiva, esquivaTotal, defesaPartes, rdMental, rdElemento, sentidoTatico, combateDefensivo, avisos: [...new Set(avisos)], efs, ajusteDados,
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
    const grau = parte.match(/^(veterano|expert) em (.+)$/i);
    if (grau) {
      const p = PERICIAS.find(x => semAcento(x.nome) === semAcento(grau[2]));
      if (!p || d.PER[p.id].grau < (grau[1].toLowerCase() === 'expert' ? 3 : 2)) ok = false;
      continue;
    }
    if (/^Especialista em Elemento no elemento$/i.test(parte)) {
      if (!f.poderes.some(p => p.id === 'especialista-em-elemento')) ok = false;
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

// Poderes de OUTRAS classes (Especialista Diletante / Expansão de Conhecimento), em ordem alfabética
export function poderesDeOutrasClasses(f) {
  return poderesDisponiveis(f).filter(p => ['combatente', 'especialista', 'ocultista'].includes(p.classe) && p.classe !== f.classe)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}

// ---------- Gastar PE/PD numa rolagem (passo 9) ----------
// Devolve as opções que a ficha tem para uma perícia ou um ataque. Cada opção:
// { id, nome, custo, bonus (soma fixa), dados (+D), dadoExtra ('1d6'), danoPor5 (Ataque Especial), maxPassos, nota }
export function periciaComAtributo(f, d, id, atributo) {
  const p = d.PER[id];
  if (!p || !Object.hasOwn(d.atributosEfetivos, atributo) || atributo === p.atrUsado) return p;
  const ajuste = p.ajuste + d.ajusteDados[atributo] - d.ajusteDados[p.atrUsado];
  const rabugento = temPeso(f, 'rabugento') && id !== 'intimidacao';
  const bonus = p.bonus + (rabugento ? 5 * (Number(p.atrUsado === 'pre') - Number(atributo === 'pre')) : 0);
  const valorAtr = d.atributosEfetivos[atributo];
  return { ...p, atrUsado: atributo, valorAtr, ajuste, bonus, dados: dadosDoTeste(valorAtr, ajuste) };
}

export function opcoesGasto(f, d, alvo) {
  const ops = [];
  const n = d.nivel, patentes = temOpcional(f, 'patentes');
  if (alvo.tipo === 'pericia') {
    const p = periciaComAtributo(f, d, alvo.id, alvo.atr);
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
    if (['sobrevivente', 'mundano'].includes(f.classe)) ops.push({ id: 'empenho', nome: 'Empenho', custo: 1, bonus: 2 });
    if (f.trilha === 'esperto' && trilhaLiberada(f, 4) && f.escolhas.perito.includes(p.id) && p.grau >= 1) ops.push({ id: 'entendido', nome: 'Entendido', custo: 1, dadoExtra: '1d4' });
    // trocar a perícia do teste (origens) e usar Intelecto como base (Conhecimento Aplicado / Prático)
    for (const t of TROCAS_PERICIA) {
      const [tipo, id] = t.fonte.split(':');
      if (tipo === 'origem' && (f.origem !== id || !origemAtiva(f))) continue;
      if (t.para === p.id || (t.de && !t.de.includes(p.id))) continue;
      ops.push({ id: 'troca-' + t.para, nome: `${t.nome}: usar ${PERICIA[t.para].nome}`, custo: t.custo, troca: t.para, nota: t.nota || '' });
    }
    const temPoder = id => f.poderes.some(x => x.id === id);
    const pratico = f.trilha === 'bibliotecario' && trilhaLiberada(f, 2);
    if ((temPoder('conhecimento-aplicado') || pratico) && p.atrUsado !== 'int' && !['luta', 'pontaria'].includes(p.id))
      ops.push({ id: 'atr-int', nome: pratico ? 'Conhecimento Prático: usar Intelecto' : 'Conhecimento Aplicado: usar Intelecto', custo: pratico && temPoder('conhecimento-aplicado') ? 1 : 2, atr: 'int' });
    if (temPoder('maos-firmes') && p.id === 'furtividade') ops.push({ id: 'maos-firmes', nome: 'Mãos Firmes', custo: 2, dados: 1, nota: 'esconder-se ou mexer em objetos' });
    if (temPoder('minha-dor-me-impulsiona') && ['acrobacia', 'atletismo', 'furtividade'].includes(p.id) && d.atual.pv <= d.pv - 5) ops.push({ id: 'minha-dor', nome: 'Minha Dor me Impulsiona', custo: 1, dadoExtra: '1d6' });
    const g = origemAtiva(f) ? ORIGEM[f.origem]?.gasto : null;
    if (g && (!g.atr || g.atr.includes(p.atrUsado)) && (!g.pericias || g.pericias.includes(p.id)) && !(g.exceto || []).includes(p.id))
      ops.push({ id: 'origem', nome: ORIGEM[f.origem].poder, custo: g.custo, bonus: g.bonus, rerrolar: !!g.rerrolar, nota: g.nota || '' });
    if (temPoder('papinho-sedutor') && p.atrUsado === 'pre') ops.push({ id: 'papinho', nome: 'Papinho Sedutor', custo: 1, bonus: 5, nota: 'para seduzir alguém' });
    if (f.trilha === 'maledictologo' && trilhaLiberada(f, 2) && p.id === 'ocultismo') ops.push({ id: 'identificacao-macabra', nome: 'Identificação Macabra', custo: 1, dadoExtra: '1d10', nota: 'identificar item amaldiçoado ou ritual' });
  }
  if (alvo.tipo === 'ataque') {
    const a = d.ataques[alvo.i];
    if (f.classe === 'combatente') {
      const max = patentes ? Math.max(1, d.patente.n - 1) : n >= 17 ? 4 : n >= 11 ? 3 : n >= 5 ? 2 : 1;
      const dobra = f.trilha === 'guerreiro' && trilhaLiberada(f, 20) && a.uso === 'corpo';
      ops.push({ id: 'ataque-especial', nome: 'Ataque Especial', maxPassos: max, custoPorPassos: k => (patentes ? k : k + 1), valorPasso: dobra ? 10 : 5, nota: dobra ? 'Potência Máxima: bônus dobrados' : 'cada +5 vai no ataque ou no dano' });
    }
    const temPoderA = id => f.poderes.some(x => x.id === id);
    // Especialista em Matar (AS02): +4 no ataque ou dano por passo; 2 PE (+4), NEX 25% 3 PE (+8), 55% 4 PE (+12), 85% 5 PE (+16)
    if (temPoderA('especialista-em-matar') && !ops.some(o => o.id === 'ataque-especial'))
      ops.push({ id: 'ataque-especial', nome: 'Especialista em Matar', maxPassos: n >= 17 ? 4 : n >= 11 ? 3 : n >= 5 ? 2 : 1, custoPorPassos: k => k + 1, valorPasso: 4, nota: 'cada +4 vai no ataque ou no dano' });
    if (temPoderA('tiro-intuitivo') && a.uso !== 'corpo') ops.push({ id: 'tiro-intuitivo', nome: 'Tiro Intuitivo', custo: 2, margem: 2, nota: 'ataque à distância sem mirar: +2 na margem de ameaça' });
    if (f.trilha === 'durao' && trilhaLiberada(f, 4)) ops.push({ id: 'pancada', nome: 'Pancada Forte', custo: 1, dados: 1 });
    if (f.trilha === 'infiltrador' && trilhaLiberada(f, 2)) {
      const nd = (trilhaLiberada(f, 20) ? 4 : trilhaLiberada(f, 13) ? 3 : trilhaLiberada(f, 8) ? 2 : 1) + (f.poderes.some(x => x.id === 'assassinato-furtivo') ? 1 : 0); // Assassinato Furtivo: +1d6
      ops.push({ id: 'furtivo', nome: 'Ataque Furtivo', custo: 1, danoDados: `${nd}d6`, nota: 'alvo desprevenido ou flanqueado; uma vez por rodada' });
      if (f.poderes.some(x => x.id === 'assassinato-furtivo')) ops.push({ id: 'assassinato-d8', nome: 'Assassinato Furtivo: dados d8', custo: 2, furtivoD8: true, nota: 'junto com o Ataque Furtivo, ao acertar' });
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
