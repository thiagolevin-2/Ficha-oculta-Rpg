import { sofrerDano, resolverCondicoesDoTurno, iniciarTurno, encerrarTurno, fimDeCena, d as dado, rolarTeste } from './combate.js?v=0.40.5';
import { ELEMENTOS, ATRIBUTOS, CONDICOES, EVENTOS_INVESTIGACAO, CLASSES, LIVROS_DIGITALIZADOS } from './catalogo.js?v=0.40.5';
import { temPeso, derivar, normalizar } from './regras.js?v=0.40.5';
import { carregarMestre, salvarMestre } from './armazenamento.js?v=0.40.5';
import { esc, uid, inteiro, semAcento, sigilo, baixarArquivo, escolherArquivo, comSinal, reduzirImagem } from './util.js?v=0.40.5';
import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal } from './rolagem.js?v=0.40.5';
import { mesa, abrirMesa, fecharMesa, publicarIniciativa, comandoParaJogador, linkConvite, mostrarAosJogadores, imagemValida } from './mesa.js?v=0.40.5';
// ═══════════ bestiario ═══════════
// Fichas de referência. As habilidades de texto são resolvidas pelo mestre.
export const AMEACAS_BASE = [
  {
    nome: 'Zumbi de Sangue', elemento: 'sangue', vd: 20,
    pv: 45, defesa: 17, desl: '9 m', atributos: { agi: 2, for: 2, int: 0, pre: 1, vig: 2 },
    iniciativa: 5, percepcao: 10, fortitude: 5, reflexos: 5, vontade: 5,
    sentidos: 'Percepção às cegas', resistencias: 'Balístico, impacto e perfuração 5, Sangue 10', vulnerabilidades: 'Morte',
    presenca: { dt: 15, dano: '2d6', nex: 25 },
    ataques: [{ nome: 'Garras (dois ataques na ação)', dados: 2, bonus: 5, dano: '1d6+5', alcance: 'Corpo a corpo' }],
    notas: 'Livro de Regras p. 202.',
  },
  {
    nome: 'Esqueleto de Lodo', elemento: 'morte', vd: 20,
    pv: 40, defesa: 14, desl: '6 m', atributos: { agi: 2, for: 2, int: 0, pre: 1, vig: 1 },
    reflexos: 5, sentidos: 'Percepção às cegas', resistencias: 'Corte, impacto e perfuração 5, Morte 10', vulnerabilidades: 'Energia',
    presenca: { dt: 14, dano: '2d4', nex: 25 },
    ataques: [{ nome: 'Garras (dois ataques na ação)', dados: 2, bonus: 5, dano: '2d6+2', alcance: 'Corpo a corpo' }],
    habilidades: 'Imortalidade: volta com 20 PV após 1d3 rodadas, salvo se a poça sofrer Fogo ou Energia. Espiral de Lodo: ação completa, atravessa até 9 m em linha reta e causa 2d10 de Morte no trajeto (Reflexos DT 14 reduz à metade).',
    notas: 'Livro de Regras p. 217.',
  },
  {
    tipo: 'Animal', nome: 'Cão de Guarda', vd: 10,
    pv: 12, defesa: 14, desl: '12 m', atributos: { agi: 2, for: 2, int: 0, pre: 1, vig: 2 },
    iniciativa: 5, percepcao: 10, fortitude: 5, reflexos: 5, sentidos: 'Faro e visão na penumbra',
    ataques: [{ nome: 'Mordida', dados: 2, bonus: 5, dano: '1d6+2', alcance: 'Corpo a corpo' }],
    habilidades: 'Se acertar a mordida, pode tentar derrubar com 2d20 +5.',
    notas: 'Livro de Regras p. 288. Sobrevivência +10.',
  },
];

AMEACAS_BASE.push({
  nome: 'Anulado', elemento: 'sangue', vd: 100,
  pv: 190, defesa: 25, desl: '9 m', atributos: { agi: 2, for: 3, int: 1, pre: 1, vig: 3 },
  iniciativa: 10, percepcao: 10, fortitude: 10, reflexos: 5, vontade: 10,
  sentidos: 'Visão no escuro. Percepção usa 3d20+10.',
  presenca: { dt: 20, dano: '4d6', nex: 45 },
  ataques: [
    { nome: 'Braços grotescos (dois ataques)', dados: 3, bonus: 15, dano: '1d8+10', nota: 'Impacto' },
    { nome: 'Mordida asquerosa', dados: 3, bonus: 15, dano: '1d10+10', nota: 'Sangue' },
  ],
  habilidades: 'Corpo Oscilante: olhar diretamente pela primeira vez causa 2d6 mental. Evitar olhar impõe −1 dado ao agir contra ele. Pode dividir os ataques entre até três alvos. Errar um ataque contra ele exige Reflexos DT 25 para evitar ser agarrado. Ao iniciar turno com um agarrado, causa 4d10 de Sangue e recupera metade do dano em PV.',
  notas: 'Arquivos Secretos nº 01, p. 53.',
});

// Bestiário completo: um arquivo por livro (dados/bestiario*.json), com os números da ficha e o texto integral do verbete.
// Fichas com "conferir" vieram de OCR ruim: os campos listados precisam ser conferidos no livro.
// (descrição, habilidades, ações, enigma). Carrega na primeira vez que a janela abre.
export const LIVROS_BESTIARIO = { base: 'Livro de Regras', sah: 'Sobrevivendo ao Horror', ...Object.fromEntries(['01', '02', '03', '04', '05', '06', '07', '09'].map(n => [`as${n}`, `Arquivos Secretos nº ${n}`])) };
const ARQUIVOS_BESTIARIO = ['bestiario', 'bestiario-sah', 'bestiario-as'];
let BESTIARIO = null;
const preparar = b => ({ ...b, elementos: Array.isArray(b.elementos) ? b.elementos : [], conferir: Array.isArray(b.conferir) ? b.conferir : [], _busca: semAcento(`${b.nome} ${b.tipo || ''} ${b.texto || ''}`) });
const vdTexto = b => (!b.vd && (b.conferir || []).includes('VD') ? '?' : b.vd);
const numTexto = (b, campo, rotulo) => (!b[campo] && (b.conferir || []).some(c => c.startsWith(rotulo)) ? '?' : b[campo]);
export function definirBestiario(lista) { BESTIARIO = lista.map(preparar); return BESTIARIO; }
export async function carregarBestiario() {
  if (BESTIARIO) return BESTIARIO;
  let lista = [];
  const partes = await Promise.all(ARQUIVOS_BESTIARIO.map(async n => { try { const r = await fetch(`dados/${n}.json?v=0.40.5`); return r.ok ? await r.json() : []; } catch (e) { console.warn('Bestiário indisponível', n, e); return []; } }));
  lista = partes.flat();
  return definirBestiario(lista);
}
const CULTISTAS = /^(iniciado|investido|líder de culto)$/i;
// Ficha do bestiário → ameaça editável (cópia: mudar a ameaça não muda o bestiário)
export function ameacaDoBestiario(b, id = uid()) {
  const tipo = b.categoria === 'animal' ? 'Animal' : b.categoria === 'pessoa' ? (CULTISTAS.test(b.nome) ? 'Cultista' : 'Pessoa') : 'Criatura paranormal';
  return normalizarAmeaca({
    ...b, id, tipo, elemento: b.elementos?.[0] || '', descricao: b.descricao || '',
    habilidades: [b.outrasPericias && `Outras perícias: ${b.outrasPericias}`, b.texto].filter(Boolean).join('\n\n'),
    resistencias: [b.resistencias, b.imunidades && `Imune: ${b.imunidades}`].filter(Boolean).join(' · '),
    notas: `${LIVROS_BESTIARIO[b.livro] || b.livro} p. ${b.paginaLivro}.${b.conferir?.length ? ` Confira no livro: ${b.conferir.join(', ')}.` : ''}`, fonte: { livro: b.livro, pagina: b.pagina, id: b.id },
  });
}

// ═══════════ mestre ═══════════
// mestre.js — Área do Mestre (primeira versão): Ameaças, Combate (iniciativa), Anotações e Backup.
// Ideia do dm-manager do Arcana, com o "bloco de ameaça" do Ordem Paranormal.

const txt = (v, m = 200) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, m);
const FORMULA = /^[0-9d+\-\s]{0,40}$/i;
const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
export const TIPOS_AMEACA = ['Criatura paranormal', 'Pessoa', 'Cultista', 'Animal', 'Outro'];

export function normalizarAmeaca(a) {
  a = a || {};
  return {
    id: txt(a.id, 60) || uid(), nome: txt(a.nome, 80) || 'Ameaça', tipo: TIPOS_AMEACA.includes(a.tipo) ? a.tipo : 'Criatura paranormal',
    elemento: ELEM[a.elemento] ? a.elemento : a.elemento === '' ? '' : 'medo', vd: inteiro(a.vd, 0, 999, 20), tamanho: txt(a.tamanho, 20) || 'Médio',
    elementos: [...new Set((Array.isArray(a.elementos) ? a.elementos : []).filter(e => ELEM[e]))].slice(0, 5),
    pv: inteiro(a.pv, 1, 99999, 20), defesa: inteiro(a.defesa, 0, 99, 15), desl: txt(a.desl, 60) || '9m',
    atributos: Object.fromEntries(ATRIBUTOS.map(x => [x.id, inteiro(a.atributos?.[x.id], 0, 10, 1)])),
    iniciativa: inteiro(a.iniciativa, -20, 60, 0), percepcao: inteiro(a.percepcao, -20, 60, 0),
    fortitude: inteiro(a.fortitude, -20, 60, 0), reflexos: inteiro(a.reflexos, -20, 60, 0), vontade: inteiro(a.vontade, -20, 60, 0),
    resistencias: txt(a.resistencias, 300), vulnerabilidades: txt(a.vulnerabilidades, 300), sentidos: txt(a.sentidos, 200),
    presenca: { dt: inteiro(a.presenca?.dt, 0, 99, 0), dano: FORMULA.test(txt(a.presenca?.dano, 30)) ? txt(a.presenca?.dano, 30) : '', nex: inteiro(a.presenca?.nex, 0, 99, 0) },
    ataques: (Array.isArray(a.ataques) ? a.ataques : []).slice(0, 12).map(x => ({ nome: txt(x?.nome, 60) || 'Ataque', dados: inteiro(x?.dados, 1, 10, 2), bonus: inteiro(x?.bonus, -20, 80, 10), dano: FORMULA.test(txt(x?.dano, 30)) && txt(x?.dano, 30) ? txt(x?.dano, 30) : '1d6', margem: inteiro(x?.margem, 2, 20, 20), mult: inteiro(x?.mult, 2, 6, 2), nota: txt(x?.nota, 200) })),
    habilidades: txt(a.habilidades, 12000), enigma: txt(a.enigma, 1000), notas: txt(a.notas, 2000),
    descricao: txt(a.descricao, 3000), imagem: imagemValida(a.imagem),
    fonte: a.fonte && typeof a.fonte === 'object' ? { livro: txt(a.fonte.livro, 20), pagina: inteiro(a.fonte.pagina, 0, 999, 0), id: txt(a.fonte.id, 80) } : null,
  };
}
// NPCs: pessoas da história (aliados, testemunhas, suspeitos). A ficha de combate é opcional.
export const RELACOES = { aliado: 'Aliado', neutro: 'Neutro', desconfiado: 'Desconfiado', hostil: 'Hostil', desconhecido: 'Desconhecido' };
export function normalizarNpc(n) {
  n = n && typeof n === 'object' ? n : {};
  const id = txt(n.id, 60) || uid(), nome = txt(n.nome, 80) || 'NPC';
  return {
    id, nome, ocupacao: txt(n.ocupacao, 120), local: txt(n.local, 120), relacao: Object.hasOwn(RELACOES, n.relacao) ? n.relacao : 'desconhecido',
    aparencia: txt(n.aparencia, 3000), personalidade: txt(n.personalidade, 2000), sabe: txt(n.sabe, 3000), notas: txt(n.notas, 4000),
    imagem: imagemValida(n.imagem), origem: txt(n.origem, 120), combate: !!n.combate,
    pericias: (Array.isArray(n.pericias) ? n.pericias : []).slice(0, 30).map(p => ({ nome: txt(p?.nome, 40) || 'Perícia', dados: inteiro(p?.dados, 1, 10, 1), bonus: inteiro(p?.bonus, -20, 80, 0) })),
    ficha: normalizarAmeaca({ tipo: 'Pessoa', elemento: '', ...(n.ficha && typeof n.ficha === 'object' ? n.ficha : {}), id, nome }),
  };
}
// Ficha de agente (deste navegador ou de um arquivo exportado) → NPC com ficha de combate
export function npcDaFicha(f0) {
  const f = normalizar(f0), d = derivar(f);
  const P = d.PER || {}, b = id => P[id]?.bonus ?? 0, qtd = x => (x?.pior ? 1 : Math.max(1, Math.min(10, x?.qtd || 1)));
  const cinco = ['iniciativa', 'percepcao', 'fortitude', 'reflexos', 'vontade'];
  const habs = [...(d.habilidades || []).map(h => h.nome), ...(d.rituais || []).map(r => r.nome && `Ritual: ${r.nome}`)].filter(Boolean);
  return normalizarNpc({
    nome: f.nome || 'Agente', ocupacao: `Agente${f.classe ? ` (${CLASSES[f.classe]?.nome || f.classe})` : ''} · NEX ${d.nexAtual ?? f.nex}%`, aparencia: f.aparencia,
    notas: [f.conceito, f.historia].filter(Boolean).join('\n\n'), relacao: 'aliado', origem: 'Ficha de jogador', imagem: f.retrato, combate: true,
    pericias: (d.pericias || []).filter(p => p.grau > 0 && !cinco.includes(p.id)).map(p => ({ nome: p.nome, dados: qtd(p.dados), bonus: p.bonus })),
    ficha: {
      tipo: 'Pessoa', elemento: '', vd: 0, pv: d.pv, defesa: d.defesa, desl: `${d.desl}m`, atributos: d.atributosEfetivos || f.atributos,
      iniciativa: b('iniciativa'), percepcao: b('percepcao'), fortitude: b('fortitude'), reflexos: b('reflexos'), vontade: b('vontade'),
      ataques: (d.ataques || []).map(a => ({ nome: a.nome, dados: qtd(a.dados), bonus: a.bonus, dano: String(a.formula || '').replace(/\s/g, ''), margem: a.margem, mult: a.mult, nota: a.periciaNome || '' })),
      habilidades: habs.join(' · '),
    },
  });
}
export function npcDoBestiario(b) {
  const a = ameacaDoBestiario(b);
  return normalizarNpc({ nome: b.nome, ocupacao: b.nome, aparencia: b.descricao, origem: `${LIVROS_BESTIARIO[b.livro] || b.livro} p. ${b.paginaLivro}`, combate: true, relacao: 'hostil', ficha: a });
}
export const CORES_NOTA = { amarelo: 'Amarelo', rosa: 'Rosa', verde: 'Verde', azul: 'Azul', roxo: 'Roxo' };
export function normalizarNota(n) {
  n = n && typeof n === 'object' ? n : {};
  return { id: txt(n.id, 60) || uid(), titulo: txt(n.titulo, 120) || 'Sem título', subtitulo: txt(n.subtitulo, 160), texto: txt(n.texto, 40000),
    cor: Object.hasOwn(CORES_NOTA, n.cor) ? n.cor : 'amarelo', fixada: !!n.fixada };
}
// Encontros: o mestre prepara antes (nome, local, ameaças e NPCs) e, na sessão, escolhe quais jogadores entram.
// Área do Mestre em duas partes: a Base (preparar antes) e o Escudo (usar durante a sessão)
const ABAS_BASE = [['ameacas', 'Ameaças'], ['encontros', 'Encontros'], ['npcs', 'NPCs'], ['anotacoes', 'Anotações'], ['homebrew', 'Homebrews']];
const ABAS_ESCUDO = [['combate', 'Combate'], ['cenas', 'Cenas'], ['mesa', 'Mesa online']];
export const TIPOS_HOMEBREW = ['Regra da casa', 'Item', 'Arma', 'Ritual', 'Poder', 'Origem', 'Criatura', 'Outro'];
export function normalizarHomebrew(h) {
  h = h && typeof h === 'object' ? h : {};
  return { id: txt(h.id, 60) || uid(), nome: txt(h.nome, 120) || 'Homebrew', tipo: TIPOS_HOMEBREW.includes(h.tipo) ? h.tipo : 'Outro', resumo: txt(h.resumo, 300), texto: txt(h.texto, 20000), tags: txt(h.tags, 200) };
}
// Janelas que o mestre puxa por cima do combate (ficam onde ele arrastou)
export const JANELAS = { dados: '🎲 Dados', busca: '🔎 Busca', encontros: '⚔ Encontros', npcs: '👥 NPCs', notas: '📝 Notas', homebrew: '📜 Homebrews', condicoes: '⚠ Condições', ameacas: '👹 Ameaças' };
export function normalizarEncontro(e) {
  e = e && typeof e === 'object' ? e : {};
  return {
    id: txt(e.id, 60) || uid(), nome: txt(e.nome, 100) || 'Encontro', local: txt(e.local, 120), descricao: txt(e.descricao, 4000), notas: txt(e.notas, 4000),
    ameacas: (Array.isArray(e.ameacas) ? e.ameacas : []).map(a => ({ ref: txt(a?.ref, 60), qtd: inteiro(a?.qtd, 0, 20, 1) })).filter(a => a.ref && a.qtd).slice(0, 30),
    npcs: (Array.isArray(e.npcs) ? e.npcs : []).map(x => txt(x, 60)).filter(Boolean).slice(0, 30),
  };
}
function normalizarMestre(m) {
  m = m && typeof m === 'object' ? m : {};
  return {
    aba: [...ABAS_BASE, ...ABAS_ESCUDO].some(([id]) => id === m.aba) ? m.aba : 'combate',
    homebrews: (Array.isArray(m.homebrews) ? m.homebrews : []).slice(0, 500).map(normalizarHomebrew),
    janelas: (Array.isArray(m.janelas) ? m.janelas : []).filter(j => Object.hasOwn(JANELAS, j?.tipo)).slice(0, 8).map(j => ({ tipo: j.tipo, x: inteiro(j.x, 0, 4000, 80), y: inteiro(j.y, 0, 3000, 120) })),
    encontros: (Array.isArray(m.encontros) ? m.encontros : []).slice(0, 200).map(normalizarEncontro),
    ameacas: (Array.isArray(m.ameacas) ? m.ameacas : []).slice(0, 300).map(normalizarAmeaca),
    npcs: (Array.isArray(m.npcs) ? m.npcs : []).slice(0, 300).map(normalizarNpc),
    combate: {
      rodada: inteiro(m.combate?.rodada, 1, 999, 1), vez: inteiro(m.combate?.vez, 0, 99, 0), ativo: !!m.combate?.ativo,
      encontro: m.combate?.encontro?.nome ? { id: txt(m.combate.encontro.id, 60), nome: txt(m.combate.encontro.nome, 100) } : null,
      participantes: (Array.isArray(m.combate?.participantes) ? m.combate.participantes : []).slice(0, 40).map(p => ({
        uid: txt(p?.uid, 60) || uid(), nome: txt(p?.nome, 80) || '?', tipo: ['agente', 'jogador', 'npc'].includes(p?.tipo) ? p.tipo : 'ameaca', ref: txt(p?.ref, 80),
        ini: p?.ini == null || p.ini === '' ? null : inteiro(p.ini, -50, 99, 0), pv: inteiro(p?.pv, -9999, 99999, 0), pvMax: inteiro(p?.pvMax, 1, 99999, 1), nota: txt(p?.nota, 200),
        condicoes: (Array.isArray(p?.condicoes) ? p.condicoes : []).filter(c => CONDICOES.some(x => x.id === c)).slice(0, 40),
      })),
    },
    cenas: {
      tipo: ['investigacao', 'perseguicao', 'furtividade', 'fabricacao', 'interpretacao'].includes(m.cenas?.tipo) ? m.cenas.tipo : 'investigacao',
      nome: txt(m.cenas?.nome, 100), objetivo: txt(m.cenas?.objetivo, 200),
      eventos: (Array.isArray(m.cenas?.eventos) ? m.cenas.eventos : []).map(Number).filter(n => n >= 2 && n <= 12).slice(0, 20),
      rodada: inteiro(m.cenas?.rodada, 1, 999, 1), sucessos: inteiro(m.cenas?.sucessos, 0, 999), falhas: inteiro(m.cenas?.falhas, 0, 999),
      agentes: Object.fromEntries(Object.entries(m.cenas?.agentes || {}).slice(0, 40).map(([id, p]) => [id, {
        sucessos: inteiro(p?.sucessos, 0, 99), falhas: inteiro(p?.falhas, 0, 99), visibilidade: inteiro(p?.visibilidade, 0, 99),
      }])),
      registro: (Array.isArray(m.cenas?.registro) ? m.cenas.registro : []).slice(-80).map(x => txt(x, 300)),
    },
    // Anotações em post-its (título, subtítulo e texto). O texto único das versões antigas vira o primeiro post-it.
    notas: (Array.isArray(m.notas) ? m.notas : txt(m.anotacoes, 40000).trim() ? [{ titulo: 'Anotações antigas', texto: m.anotacoes }] : []).slice(0, 300).map(normalizarNota),
  };
}
let mestre = normalizarMestre(carregarMestre());
const gravar = () => { salvarMestre(mestre); if (mesa.papel === 'mestre') publicarIniciativa(mestre.combate); };
export const pegarMestre = () => mestre;
// Ficha usada para rolar: uma ameaça ou a ficha de combate de um NPC (mesmo formato)
const npcPorId = id => mestre.npcs.find(n => n.id === id);
const fichaNpc = n => n && { ...n.ficha, id: n.id, nome: n.nome };
const fichaDe = id => mestre.ameacas.find(a => a.id === id) || fichaNpc(npcPorId(id));

// ---------- Telas ----------
export function telaMestre(fichas) {
  const conta = { ameacas: mestre.ameacas.length, encontros: mestre.encontros.length, npcs: mestre.npcs.length, anotacoes: mestre.notas.length, homebrew: mestre.homebrews.length };
  const escudo = ABAS_ESCUDO.some(([id]) => id === mestre.aba);
  if (mesa.papel === 'mestre') publicarIniciativa(mestre.combate);
  const corpo = mestre.aba === 'mesa' ? abaMesa() : mestre.aba === 'encontros' ? abaEncontros(fichas) : mestre.aba === 'ameacas' ? abaAmeacas() : mestre.aba === 'npcs' ? abaNpcs() : mestre.aba === 'anotacoes' ? abaAnotacoes() : mestre.aba === 'homebrew' ? abaHomebrew() : mestre.aba === 'cenas' ? abaCenas(fichas) : abaCombate(fichas);
  const aba = ([id, n]) => `<button role="tab" data-acao="m-aba" data-aba="${id}" aria-selected="${mestre.aba === id}">${n}${conta[id] != null ? ` (${conta[id]})` : ''}${id === 'mesa' && mesa.papel === 'mestre' ? ` · ${Object.values(mesa.jogadores).filter(j => j.online).length}` : ''}</button>`;
  return `<div class="pagina"><div class="titulo-secao"><h1 class="faixa sangue">Área do Mestre</h1><div class="linha"><button class="btn pequeno" data-acao="m-backup">Backup</button><button class="btn pequeno fantasma" data-acao="m-restaurar">Restaurar</button></div></div>
  <div class="mestre-partes">
    <nav class="parte-mestre${escudo ? '' : ' ativa'}" aria-label="Base do Mestre"><span class="parte-titulo">📚 Base do Mestre <small>preparar</small></span><div class="abas" role="tablist">${ABAS_BASE.map(aba).join('')}</div></nav>
    <nav class="parte-mestre${escudo ? ' ativa' : ''}" aria-label="Escudo do Mestre"><span class="parte-titulo">🛡 Escudo do Mestre <small>na sessão</small></span><div class="abas" role="tablist">${ABAS_ESCUDO.map(aba).join('')}</div></nav>
  </div>
  ${escudo ? barraEscudo() : ''}${corpo}${escudo ? mestre.janelas.map(janelaFlutuante).join('') : ''}</div>`;
}
// Barra do Escudo: mesa online, rolagem escondida/pública e os botões das janelas flutuantes
function barraEscudo() {
  const on = mesa.papel === 'mestre';
  return `<div class="escudo-barra">
    <div class="linha" style="flex-wrap:wrap;gap:6px">${on ? `<span class="etiqueta online-sim">● mesa ${esc(mesa.codigo)} · ${Object.values(mesa.jogadores).filter(j => j.online).length} online</span>` : '<button class="btn pequeno sangue" data-acao="m-mesa-abrir">🌐 Abrir mesa online</button>'}
      <button class="btn pequeno${mesa.escondido ? ' escondido-on' : ''}" data-acao="m-escondido" aria-pressed="${mesa.escondido}" title="Vale para as suas rolagens na mesa online">${mesa.escondido ? '🙈 Rolagens escondidas' : '👁 Rolagens públicas'}</button></div>
    <div class="linha escudo-janelas" style="flex-wrap:wrap;gap:4px">${Object.entries(JANELAS).map(([t, n]) => `<button class="btn pequeno${mestre.janelas.some(j => j.tipo === t) ? ' ativo' : ''}" data-acao="m-janela" data-tipo="${t}">${n}</button>`).join('')}</div>
  </div>`;
}

// ---------- Mesa online (PeerJS): o mestre abre, os jogadores entram pelo código ----------
export function htmlFeed(feed, { mestre: ehMestre = false } = {}) {
  const lista = ehMestre ? feed : feed.filter(x => !x.escondida);
  if (!lista.length) return '<p class="apagado">Nenhuma rolagem ainda.</p>';
  return `<ul class="feed-mesa">${lista.slice(0, 40).map(x => `<li class="${x.critico ? 'critico' : ''}${x.escondida ? ' escondida' : ''}"><span class="feed-quem">${esc(x.quem || '?')}</span><span class="feed-titulo">${esc(x.titulo)}${x.escondida ? ' <small>(escondida)</small>' : ''}</span><b class="feed-total">${esc(String(x.total ?? '—'))}</b>${x.texto ? `<small class="apagado">${esc(x.texto)}</small>` : ''}</li>`).join('')}</ul>`;
}
const barra = (atual, max, cor) => `<span class="barra-mini" style="--cor:${cor}"><b style="width:${Math.max(0, Math.min(100, (atual / Math.max(1, max)) * 100))}%"></b></span>`;
function cartaoJogador(peer, j, i) {
  const recurso = j.pd != null ? [['PD', j.pd, j.pdMax, 'var(--vela)']] : [['PE', j.pe, j.peMax, 'var(--vela)'], ['SAN', j.san, j.sanMax, 'var(--roxo)']];
  const podeEditar = j.online && j.acesso !== 'consulta';
  const conds = (j.condicoes || []).map(id => CONDICOES.find(c => c.id === id)?.nome || id);
  return `<div class="hab jogador-mesa${j.online ? '' : ' offline'}"><span class="meta"><span class="${j.online ? 'online-sim' : 'online-nao'}">${j.online ? '● online' : '○ offline'}</span>${j.acesso ? ` <small>${j.acesso === 'editar' ? 'Edição liberada' : 'Só consulta'}</small>` : ''}</span>
    <b>${esc(j.nome)}</b> <small class="apagado">${esc(j.classe || '')} · NEX ${esc(String(j.nex ?? '?'))}% · Defesa ${j.defesa}</small>
    <div class="recursos-mesa"><div><span>PV ${j.pv}/${j.pvMax}${j.pvTemp ? ` (+${j.pvTemp})` : ''}</span>${barra(j.pv, j.pvMax, 'var(--sangue)')}</div>${recurso.map(([n, a, m, cor]) => `<div><span>${n} ${a}/${m}</span>${barra(a, m, cor)}</div>`).join('')}</div>
    ${conds.length ? `<p class="apagado" style="font-size:.85rem">Condições: ${conds.map(esc).join(' · ')}</p>` : ''}
    <div class="linha" style="margin-top:6px;flex-wrap:wrap"><input type="number" min="0" style="width:76px" id="mj-q-${i}" placeholder="qtd" aria-label="Quantidade para ${esc(j.nome)}" ${podeEditar ? '' : 'disabled'}>
      <button class="btn pequeno" data-acao="m-j-cmd" data-peer="${esc(peer)}" data-i="${i}" data-c="dano" ${podeEditar ? '' : 'disabled'}>Dano</button>
      <button class="btn pequeno" data-acao="m-j-cmd" data-peer="${esc(peer)}" data-i="${i}" data-c="mental" ${podeEditar ? '' : 'disabled'}>Dano mental</button>
      <button class="btn pequeno" data-acao="m-j-cmd" data-peer="${esc(peer)}" data-i="${i}" data-c="cura" ${podeEditar ? '' : 'disabled'}>Curar PV</button>
      <button class="btn pequeno" data-acao="m-j-cmd" data-peer="${esc(peer)}" data-i="${i}" data-c="recupera" ${podeEditar ? '' : 'disabled'}>Recuperar ${j.pd != null ? 'PD' : 'PE'}</button>
      <button class="btn pequeno" data-acao="m-j-recursos" data-peer="${esc(peer)}" ${podeEditar && j.acesso === 'editar' ? '' : 'disabled'}>Editar recursos</button>
      <button class="btn pequeno" data-acao="m-j-cond" data-peer="${esc(peer)}" ${podeEditar ? '' : 'disabled'}>Condições</button></div></div>`;
}
function abaMesa() {
  if (mesa.papel === 'jogador') return `<section class="painel"><h2 class="faixa">Mesa online</h2><p>Você está numa mesa como <b>jogador</b> (${esc(mesa.codigo)}). Saia dela pelo botão 🌐 Mesa para abrir a sua.</p></section>`;
  if (mesa.papel !== 'mestre') return `<section class="painel"><h2 class="faixa sangue">Mesa online</h2>
    <p>Abra uma mesa e mande o código ou o link para os jogadores. Eles entram com a ficha deles: você vê PV, ${'PE/PD'}, Sanidade, Defesa e condições ao vivo, aplica dano, cura e condições, e as rolagens de todos aparecem no feed. A iniciativa do Combate aparece para eles (das ameaças, só o nome).</p>
    ${mesa.erro ? `<p class="aviso-ocr">${esc(mesa.erro)}</p>` : ''}
    <div class="linha"><button class="btn sangue" data-acao="m-mesa-abrir">🌐 Abrir mesa online</button></div>
    <p class="apagado" style="font-size:.85rem;margin-top:8px">Usa o servidor público do PeerJS só para os navegadores se acharem; os dados vão direto entre vocês. Precisa de internet.</p></section>`;
  const link = mesa.codigo ? linkConvite(mesa.codigo) : '';
  const js = Object.entries(mesa.jogadores);
  return `<div class="grade c2" style="grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr)">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Mesa online</h2><span class="etiqueta">${mesa.status === 'aberta' ? '● aberta' : esc(mesa.status)}</span></div>
    ${mesa.erro ? `<p class="aviso-ocr">${esc(mesa.erro)}</p>` : ''}
    <div class="codigo-mesa"><span>Código</span><b>${esc(mesa.codigo || '…')}</b></div>
    <div class="linha"><input readonly id="m-mesa-link" value="${esc(link)}" aria-label="Link de convite" style="flex:1"><button class="btn pequeno" data-acao="m-mesa-copiar">Copiar link</button></div>
    <label class="check" style="margin-top:8px"><input type="checkbox" data-acao="m-mesa-escondido" ${mesa.escondido ? 'checked' : ''}><span><b>Rolar escondido</b><small>Suas rolagens não aparecem para os jogadores (só para você).</small></span></label>
    <h3 class="titulo-vermelho">Jogadores (${js.filter(([, j]) => j.online).length} online)</h3>
    ${js.length ? `<div class="lista-hab">${js.map(([peer, j], i) => cartaoJogador(peer, j, i)).join('')}</div>` : '<p class="vazio">Ninguém entrou ainda. Mande o link ou o código.</p>'}
    <div class="linha fim" style="margin-top:10px"><button class="btn pequeno perigo" data-acao="m-mesa-fechar">Fechar mesa</button></div>
  </section>
  <section class="painel"><h2 class="faixa">Feed da mesa</h2>${htmlFeed(mesa.feed, { mestre: true })}</section></div>`;
}

function abaCombate(fichas) {
  const c = mestre.combate;
  const ordem = c.participantes.map(p => {
    if (p.tipo === 'jogador') { const j = mesa.jogadores[p.ref]; return { ...p, nome: j?.nome || p.nome, pv: j?.pv ?? p.pv, pvMax: j?.pvMax ?? p.pvMax, condicoes: j?.condicoes || [], online: !!j?.online }; }
    const ficha = p.tipo === 'agente' && p.ref ? fichas.find(f => f.id === p.ref) : null;
    if (!ficha) return { ...p, condicoes: p.condicoes || [] };
    const d = derivar(ficha);
    return { ...p, nome: ficha.nome || p.nome, pv: d.atual.pv, pvMax: d.pv, condicoes: ficha.condicoes };
  });
  return `<div class="grade c2" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr)">
  <section class="painel">${c.encontro ? `<p class="encontro-atual">⚔ Encontro: <b>${esc(c.encontro.nome)}</b></p>` : ''}<div class="titulo-secao"><h2 class="faixa">Rodada ${c.rodada}</h2>
    <div class="linha" style="flex-wrap:wrap"><button class="btn pequeno" data-acao="m-puxar">+ Puxar jogadores</button>${c.participantes.length ? '<button class="btn pequeno" data-acao="m-area">💥 Dano/condição em vários</button>' : ''}<button class="btn pequeno" data-acao="m-rolar-ini">Rolar iniciativa das ameaças</button><button class="btn pequeno" data-acao="m-ordenar">Ordenar</button><button class="btn pequeno sangue" data-acao="m-proximo">${c.ativo ? 'Próximo turno →' : 'Iniciar turnos'}</button></div></div>
    ${ordem.length ? `<div class="iniciativa">${ordem.map((p, i) => `<div class="ini-linha ${i === c.vez ? 'vez' : ''} ${p.pv <= 0 ? 'caido' : ''}">
      <input type="number" class="ini" data-m-part="${i}.ini" id="mp-ini-${i}" value="${p.ini ?? ''}" placeholder="—" aria-label="Iniciativa de ${esc(p.nome)}">
      <div><b>${esc(p.nome)}</b> <small class="apagado">${p.tipo === 'agente' ? 'agente' : p.tipo === 'npc' ? 'NPC' : p.tipo === 'jogador' ? `jogador ${p.online ? '<span class="online-sim">● online</span>' : '<span class="online-nao">○ offline</span>'}` : 'ameaça'}</small>
        <div class="linha" style="gap:6px;margin-top:4px"><span class="dossie-txt">PV</span><input type="number" style="width:80px" data-m-part="${i}.pv" id="mp-pv-${i}" value="${p.pv}" aria-label="PV de ${esc(p.nome)}"><span class="apagado">/ ${p.pvMax}</span>
        <input type="number" style="width:70px" id="mp-q-${i}" placeholder="qtd" aria-label="Quantidade"><button class="btn pequeno" data-acao="m-dano" data-i="${i}" data-s="-1">Dano</button><button class="btn pequeno" data-acao="m-dano" data-i="${i}" data-s="1">Cura</button>
        ${p.tipo === 'ameaca' || p.tipo === 'npc' ? `<span class="etiqueta">${estadoPV(p)}</span>` : ''}</div>
        ${p.condicoes ? `<button class="btn pequeno" data-acao="m-condicoes" data-i="${i}">Condições</button> <small>${p.condicoes.map(id => esc(CONDICOES.find(c => c.id === id)?.nome || id)).join(' · ')}</small>` : ''}
        <input data-m-part="${i}.nota" id="mp-nota-${i}" value="${esc(p.nota)}" placeholder="condições, anotações…" style="margin-top:4px;min-height:30px;font-size:.9rem" aria-label="Anotação"></div>
      <div class="linha" style="flex-direction:column;gap:2px">${(p.tipo === 'ameaca' || p.tipo === 'npc') && fichaDe(p.ref)?.ataques.length ? `<button class="icone-btn" data-acao="m-atacar-alvo" data-i="${i}" aria-label="Atacar um alvo" title="Atacar um alvo">🎯</button>` : ''}${p.tipo === 'ameaca' || p.tipo === 'npc' ? `<button class="icone-btn" data-acao="m-ver" data-ref="${esc(p.ref)}" aria-label="Ver ficha">👁</button>` : ''}<button class="icone-btn" data-acao="m-tirar" data-i="${i}" aria-label="Tirar do combate">✕</button></div>
    </div>`).join('')}</div>` : '<p class="vazio">Ninguém no combate. Adicione agentes e ameaças ao lado.</p>'}
    ${ordem.length ? '<div class="linha fim" style="margin-top:10px"><button class="btn pequeno perigo" data-acao="m-encerrar">Encerrar combate</button></div>' : ''}
  </section>
  <section class="painel"><h2 class="faixa">Adicionar</h2>
    ${mesa.papel === 'mestre' && Object.keys(mesa.jogadores).length ? `<h3 class="titulo-vermelho">Jogadores da mesa online</h3>${Object.entries(mesa.jogadores).map(([peer, j]) => `<button class="btn pequeno" style="margin:2px" data-acao="m-add-jogador" data-peer="${esc(peer)}" ${c.participantes.some(p => p.tipo === 'jogador' && p.ref === peer) ? 'disabled' : ''}>+ ${esc(j.nome)}${j.online ? '' : ' (offline)'}</button>`).join('')}` : ''}
    <h3 class="titulo-vermelho">Agentes deste navegador</h3>
    ${fichas.length ? fichas.map(f => `<button class="btn pequeno" style="margin:2px" data-acao="m-add-agente" data-id="${f.id}">+ ${esc(f.nome || 'Sem nome')}</button>`).join('') : '<p class="apagado">Nenhuma ficha salva aqui. Também dá para adicionar pelo nome:</p>'}
    <div class="linha" style="margin-top:6px"><input id="m-nome-livre" placeholder="Nome do jogador/NPC" aria-label="Nome"><button class="btn pequeno" data-acao="m-add-livre">+</button></div>
    <h3 class="titulo-vermelho">Ameaças</h3>
    ${mestre.ameacas.length ? mestre.ameacas.map(a => `<button class="btn pequeno el-${a.elemento || 'nenhum'}" style="margin:2px;border-color:var(--el)" data-acao="m-add-ameaca" data-id="${a.id}">${a.elemento ? sigilo(a.elemento, 'var(--el)') : ''} ${esc(a.nome)}</button>`).join('') : '<p class="apagado">Crie ameaças na aba Ameaças.</p>'}
    ${mestre.npcs.some(n => n.combate) ? `<h3 class="titulo-vermelho">NPCs</h3>${mestre.npcs.filter(n => n.combate).map(n => `<button class="btn pequeno" style="margin:2px" data-acao="m-add-npc" data-id="${n.id}">+ ${esc(n.nome)}</button>`).join('')}` : ''}
  </section></div>`;
}
// ---------- Janelas flutuantes do Escudo ----------
const itensBusca = () => [
  ...mestre.encontros.map(e => ({ tipo: 'Encontro', nome: e.nome, sub: e.local, txt: `${e.descricao} ${e.notas}`, acao: `data-acao="m-enc-ver" data-id="${e.id}"` })),
  ...mestre.notas.map(n => ({ tipo: 'Nota', nome: n.titulo, sub: n.subtitulo, txt: n.texto, acao: `data-acao="m-nota-ver" data-id="${n.id}"` })),
  ...mestre.npcs.map(n => ({ tipo: 'NPC', nome: n.nome, sub: n.ocupacao, txt: `${n.aparencia} ${n.personalidade} ${n.sabe} ${n.notas} ${n.local}`, acao: `data-acao="m-ver" data-ref="${n.id}"` })),
  ...mestre.homebrews.map(h => ({ tipo: 'Homebrew', nome: h.nome, sub: h.tipo, txt: `${h.resumo} ${h.texto} ${h.tags}`, acao: `data-acao="m-hb-ver" data-id="${h.id}"` })),
  ...mestre.ameacas.map(a => ({ tipo: 'Ameaça', nome: a.nome, sub: `VD ${a.vd}`, txt: `${a.habilidades} ${a.descricao}`, acao: `data-acao="m-ver" data-ref="${a.id}"` })),
];
let buscaEscudo = '';
export function buscarNoMestre(q) {
  const p = semAcento(q).trim().split(/\s+/).filter(Boolean); if (!p.length) return [];
  return itensBusca().map(x => ({ ...x, n: semAcento(x.nome), t: semAcento(`${x.nome} ${x.sub} ${x.txt}`) })).filter(x => p.every(w => x.t.includes(w))).sort((a, b) => (p.every(w => b.n.includes(w)) - p.every(w => a.n.includes(w)))).slice(0, 40);
}
const resultadosBusca = q => { const r = buscarNoMestre(q); return !q.trim() ? '<p class="apagado">Digite para procurar em encontros, notas, NPCs, homebrews e ameaças.</p>' : r.length ? `<ul class="jf-lista">${r.map(x => `<li><button class="jf-item" ${x.acao}><small class="etiqueta">${x.tipo}</small> <b>${esc(x.nome)}</b>${x.sub ? ` <small class="apagado">${esc(x.sub)}</small>` : ''}</button></li>`).join('')}</ul>` : '<p class="apagado">Nada encontrado.</p>'; };
function conteudoJanela(t) {
  const lista = (itens, vazio) => itens.length ? `<ul class="jf-lista">${itens.join('')}</ul>` : `<p class="apagado">${vazio}</p>`;
  if (t === 'dados') return `<div class="jf-dados">${['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => `<button class="btn pequeno" data-acao="m-dado" data-f="1${d}">${d}</button>`).join('')}</div>
    <div class="linha" style="margin-top:6px"><input id="jf-formula" placeholder="Fórmula: 3d6+2" aria-label="Fórmula de dados"><button class="btn pequeno sangue" data-acao="m-dado-formula">Rolar</button></div>
    <div class="linha" style="margin-top:6px"><input type="number" id="jf-qtd" value="1" min="1" max="10" style="width:56px" aria-label="Quantos d20"><span>d20 +</span><input type="number" id="jf-bonus" value="0" style="width:60px" aria-label="Bônus"><button class="btn pequeno" data-acao="m-dado-teste">Teste</button></div>
    <p class="apagado" style="font-size:.8rem;margin:6px 0 0">${mesa.escondido ? '🙈 Escondidas dos jogadores.' : '👁 Públicas na mesa online.'}</p>`;
  if (t === 'busca') return `<input type="search" data-m-busca-escudo value="${esc(buscaEscudo)}" placeholder="Buscar em tudo" aria-label="Buscar em encontros, notas, NPCs e homebrews"><div id="jf-busca-res">${resultadosBusca(buscaEscudo)}</div>`;
  if (t === 'encontros') return lista(mestre.encontros.map(e => `<li><button class="jf-item" data-acao="m-enc-ver" data-id="${e.id}"><b>${esc(e.nome)}</b> <small class="apagado">${esc(e.local)}</small></button><button class="btn pequeno sangue" data-acao="m-enc-iniciar" data-id="${e.id}">▶</button></li>`), 'Nenhum encontro preparado.');
  if (t === 'npcs') return lista(mestre.npcs.map(n => `<li><button class="jf-item" data-acao="m-ver" data-ref="${n.id}"><b>${esc(n.nome)}</b> <small class="apagado">${esc(n.ocupacao)}</small></button>${n.combate ? `<button class="btn pequeno" data-acao="m-add-npc" data-id="${n.id}" title="Ao combate">⚔</button>` : ''}<button class="btn pequeno" data-acao="m-mostrar" data-k="npc" data-id="${n.id}" title="Mostrar aos jogadores">📢</button></li>`), 'Nenhum NPC.');
  if (t === 'notas') return lista([...mestre.notas].sort((a, b) => b.fixada - a.fixada).map(n => `<li><button class="jf-item" data-acao="m-nota-ver" data-id="${n.id}">${n.fixada ? '📌 ' : ''}<b>${esc(n.titulo)}</b> <small class="apagado">${esc(n.subtitulo)}</small></button></li>`), 'Nenhuma anotação.');
  if (t === 'homebrew') return lista(mestre.homebrews.map(h => `<li><button class="jf-item" data-acao="m-hb-ver" data-id="${h.id}"><b>${esc(h.nome)}</b> <small class="apagado">${esc(h.tipo)}</small></button></li>`), 'Nenhum homebrew.');
  if (t === 'ameacas') return lista(mestre.ameacas.map(a => `<li><button class="jf-item" data-acao="m-ver" data-ref="${a.id}"><b>${esc(a.nome)}</b> <small class="apagado">VD ${a.vd} · ${a.pv} PV · Def ${a.defesa}</small></button><button class="btn pequeno" data-acao="m-add-ameaca" data-id="${a.id}" title="Ao combate">⚔</button></li>`), 'Nenhuma ameaça.');
  if (t === 'condicoes') return `<ul class="jf-lista">${CONDICOES.map(c => `<li style="display:block"><b>${esc(c.nome)}</b> <small>${esc(c.resumo || '')}</small></li>`).join('')}</ul>`;
  return '';
}
function janelaFlutuante(j) {
  return `<section class="janela-flutuante" data-jf="${j.tipo}" style="left:${j.x}px;top:${j.y}px" aria-label="${esc(JANELAS[j.tipo])}">
    <header class="jf-barra" title="Arraste para mover"><b>${JANELAS[j.tipo]}</b><button class="icone-btn" data-acao="m-janela" data-tipo="${j.tipo}" aria-label="Fechar">✕</button></header>
    <div class="jf-corpo">${conteudoJanela(j.tipo)}</div></section>`;
}
// Arrastar as janelas pela barra (sem redesenhar a página; a posição fica salva)
if (globalThis.document?.addEventListener) {
  let arraste = null;
  document.addEventListener('pointerdown', ev => {
    const barra = ev.target.closest?.('.jf-barra'); if (!barra || ev.target.closest('button')) return;
    const jan = barra.parentElement, r = jan.getBoundingClientRect();
    arraste = { jan, dx: ev.clientX - r.left, dy: ev.clientY - r.top }; barra.setPointerCapture?.(ev.pointerId); ev.preventDefault();
  });
  document.addEventListener('pointermove', ev => {
    if (!arraste) return;
    const x = Math.max(0, Math.min(innerWidth - 120, ev.clientX - arraste.dx)), y = Math.max(0, Math.min(innerHeight - 40, ev.clientY - arraste.dy));
    arraste.jan.style.left = x + 'px'; arraste.jan.style.top = y + 'px';
  });
  document.addEventListener('pointerup', () => {
    if (!arraste) return;
    const j = mestre.janelas.find(x => x.tipo === arraste.jan.dataset.jf);
    if (j) { j.x = parseInt(arraste.jan.style.left, 10) || 0; j.y = parseInt(arraste.jan.style.top, 10) || 0; salvarMestre(mestre); }
    arraste = null;
  });
}

// ---------- Homebrews ----------
let buscaHb = '';
function abaHomebrew() {
  return `<div class="linha" style="margin-bottom:12px;flex-wrap:wrap;align-items:center"><button class="btn sangue" data-acao="m-hb-novo">+ Novo homebrew</button>
    <input type="search" data-m-hb-busca value="${esc(buscaHb)}" placeholder="Buscar homebrews (nome, tipo, texto, tags)" aria-label="Buscar homebrews" style="flex:1;min-width:200px"></div>
  ${mestre.homebrews.length ? `<div class="grade c2">${mestre.homebrews.map(h => `<article class="ameaca-bloco homebrew" data-busca-hb="${esc(semAcento(`${h.nome} ${h.tipo} ${h.resumo} ${h.texto} ${h.tags}`))}">
    <div class="titulo-secao"><h3>${esc(h.nome)}</h3><span class="etiqueta">${esc(h.tipo)}</span></div>
    ${h.resumo ? `<p style="margin:6px 0">${esc(h.resumo)}</p>` : ''}${h.texto ? `<p class="postit-texto">${esc(h.texto)}</p>` : ''}${h.tags ? `<p class="apagado" style="font-size:.8rem">#${esc(h.tags.split(/[,\s]+/).filter(Boolean).join(' #'))}</p>` : ''}
    <div class="linha fim" style="margin-top:8px;flex-wrap:wrap"><button class="btn pequeno" data-acao="m-hb-ver" data-id="${h.id}">Ler</button><button class="btn pequeno" data-acao="m-mostrar" data-k="hb" data-id="${h.id}">📢 Mostrar aos jogadores</button><button class="btn pequeno" data-acao="m-hb-editar" data-id="${h.id}">Editar</button><button class="btn pequeno perigo" data-acao="m-hb-apagar" data-id="${h.id}">Apagar</button></div>
  </article>`).join('')}</div>` : '<p class="vazio">Nenhum homebrew. Guarde aqui suas regras da casa, itens, armas, rituais, poderes, origens e criaturas próprias, para consultar no Escudo durante a sessão.</p>'}`;
}
function formHomebrew(h) {
  return `<div class="grade c2"><label class="campo"><span>Nome</span><input id="hb-nome" value="${esc(h.nome)}" autofocus></label>
    <label class="campo"><span>Tipo</span><select id="hb-tipo">${TIPOS_HOMEBREW.map(t => `<option ${h.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
    <label class="campo"><span>Resumo (uma linha)</span><input id="hb-resumo" value="${esc(h.resumo)}"></label>
    <label class="campo"><span>Texto completo</span><textarea id="hb-texto" style="min-height:35vh">${esc(h.texto)}</textarea></label>
    <label class="campo"><span>Tags (separadas por vírgula)</span><input id="hb-tags" value="${esc(h.tags)}" placeholder="sangue, cura, campanha 2"></label>
    <input type="hidden" id="hb-id" value="${esc(h.id)}">`;
}

// ---------- Encontros ----------
const ameacaPorId = id => mestre.ameacas.find(a => a.id === id);
function abaEncontros() {
  return `<div class="linha" style="margin-bottom:12px;flex-wrap:wrap"><button class="btn sangue" data-acao="m-enc-novo">+ Novo encontro</button>${mestre.combate.encontro ? `<span class="etiqueta">Em andamento: ${esc(mestre.combate.encontro.nome)}</span>` : ''}</div>
  ${mestre.encontros.length ? `<div class="grade c2">${mestre.encontros.map(e => {
    const am = e.ameacas.map(a => ({ a: ameacaPorId(a.ref), qtd: a.qtd })).filter(x => x.a), npcs = e.npcs.map(npcPorId).filter(Boolean);
    return `<article class="ameaca-bloco encontro${mestre.combate.encontro?.id === e.id ? ' ativo' : ''}">
      <div class="titulo-secao"><h3>${esc(e.nome)}</h3>${e.local ? `<span class="etiqueta">📍 ${esc(e.local)}</span>` : ''}</div>
      ${e.descricao ? `<p style="white-space:pre-wrap;margin:6px 0">${esc(e.descricao)}</p>` : ''}
      <p class="linha-stat"><b>Ameaças</b>${am.length ? am.map(x => `${esc(x.a.nome)}${x.qtd > 1 ? ` ×${x.qtd}` : ''} <small class="apagado">(VD ${x.a.vd})</small>`).join(' · ') : '<span class="apagado">nenhuma</span>'}</p>
      ${npcs.length ? `<p class="linha-stat"><b>NPCs</b>${npcs.map(n => esc(n.nome)).join(' · ')}</p>` : ''}
      ${e.notas ? `<p class="linha-stat" style="white-space:pre-wrap"><b>Notas</b>${esc(e.notas)}</p>` : ''}
      <div class="linha fim" style="margin-top:8px;flex-wrap:wrap"><button class="btn pequeno sangue" data-acao="m-enc-iniciar" data-id="${e.id}">▶ Iniciar encontro</button><button class="btn pequeno" data-acao="m-enc-editar" data-id="${e.id}">Editar</button><button class="btn pequeno" data-acao="m-enc-duplicar" data-id="${e.id}">Duplicar</button><button class="btn pequeno perigo" data-acao="m-enc-apagar" data-id="${e.id}">Apagar</button></div>
    </article>`; }).join('')}</div>` : '<p class="vazio">Nenhum encontro. Prepare antes da sessão: dê um nome, escolha as ameaças (com quantidade) e os NPCs. Na hora, "Iniciar encontro" pergunta quais jogadores entram.</p>'}`;
}
function formEncontro(e) {
  const qtd = id => e.ameacas.find(a => a.ref === id)?.qtd || 0;
  return `<div class="grade c2"><label class="campo"><span>Nome do encontro</span><input id="enc-nome" value="${esc(e.nome)}" autofocus></label><label class="campo"><span>Local</span><input id="enc-local" value="${esc(e.local)}"></label></div>
    <label class="campo"><span>Descrição (o que acontece)</span><textarea id="enc-descricao">${esc(e.descricao)}</textarea></label>
    <h3 class="titulo-vermelho">Ameaças (quantidade)</h3>
    ${mestre.ameacas.length ? `<div class="grade c2">${mestre.ameacas.map(a => `<label class="linha enc-linha"><input type="number" min="0" max="20" style="width:64px" data-enc-am="${a.id}" value="${qtd(a.id)}" aria-label="Quantidade de ${esc(a.nome)}"><span>${esc(a.nome)} <small class="apagado">VD ${a.vd} · ${a.pv} PV</small></span></label>`).join('')}</div>` : '<p class="apagado">Crie ameaças na aba Ameaças (ou pelo Bestiário) para colocar aqui.</p>'}
    ${mestre.npcs.some(n => n.combate) ? `<h3 class="titulo-vermelho">NPCs</h3><div class="grade c2">${mestre.npcs.filter(n => n.combate).map(n => `<label class="check"><input type="checkbox" data-enc-npc="${n.id}" ${e.npcs.includes(n.id) ? 'checked' : ''}><span>${esc(n.nome)}</span></label>`).join('')}</div>` : ''}
    <label class="campo" style="margin-top:8px"><span>Notas do mestre</span><textarea id="enc-notas" placeholder="Táticas das ameaças, gatilhos, recompensas…">${esc(e.notas)}</textarea></label>
    <p class="apagado" style="font-size:.85rem">Os jogadores são escolhidos na hora de iniciar: todos os da mesa online ou só uma parte.</p>
    <input type="hidden" id="enc-id" value="${esc(e.id)}">`;
}
// Quem pode entrar no encontro agora: jogadores da mesa online e fichas deste navegador
function candidatosJogadores(fichas) {
  const js = Object.entries(mesa.jogadores).map(([peer, j]) => ({ chave: `j:${peer}`, nome: j.nome, info: j.online ? '● online' : '○ offline', marcado: !!j.online }));
  const fs = fichas.map(f => ({ chave: `a:${f.id}`, nome: f.nome || 'Agente', info: 'ficha deste navegador', marcado: !js.length }));
  return [...js, ...fs];
}
const listaPuxar = cands => cands.length ? `<div class="linha" style="gap:6px;margin-bottom:6px"><button class="btn pequeno" data-acao="m-enc-marcar" data-v="1">Todos</button><button class="btn pequeno fantasma" data-acao="m-enc-marcar" data-v="0">Nenhum</button></div>
  <div class="grade c2">${cands.map(c => `<label class="check"><input type="checkbox" data-enc-jog="${esc(c.chave)}" ${c.marcado ? 'checked' : ''}><span><b>${esc(c.nome)}</b><small>${esc(c.info)}</small></span></label>`).join('')}</div>`
  : '<p class="apagado">Nenhum jogador conectado e nenhuma ficha neste navegador. Abra a mesa online ou adicione pelo nome no Combate.</p>';
// Põe jogadores (j:peer) e agentes (a:id) no combate, sem repetir
function puxarJogadores(ctx, chaves) {
  const c = mestre.combate; let n = 0;
  for (const ch of chaves) {
    const [t, ref] = [ch.slice(0, 1), ch.slice(2)];
    if (t === 'j') { const j = mesa.jogadores[ref]; if (!j || c.participantes.some(p => p.tipo === 'jogador' && p.ref === ref)) continue; c.participantes.push({ uid: uid(), nome: j.nome, tipo: 'jogador', ref, ini: null, pv: j.pv, pvMax: j.pvMax, nota: '', condicoes: [] }); n++; }
    else { const f = ctx.fichas().find(x => x.id === ref); if (!f || c.participantes.some(p => p.tipo === 'agente' && p.ref === ref)) continue; const d = derivar(f); c.participantes.push({ uid: uid(), nome: f.nome || 'Agente', tipo: 'agente', ref, ini: null, pv: d.atual.pv, pvMax: d.pv, nota: '', condicoes: [] }); n++; }
  }
  return n;
}
function adicionarAmeaca(id, qtd = 1) {
  const a = ameacaPorId(id); if (!a) return;
  for (let k = 0; k < qtd; k++) { const n = mestre.combate.participantes.filter(p => p.ref === a.id).length; mestre.combate.participantes.push({ uid: uid(), nome: a.nome + (n ? ` ${n + 1}` : ''), tipo: 'ameaca', ref: a.id, ini: null, pv: a.pv, pvMax: a.pv, nota: '', condicoes: [] }); }
}
function adicionarNpc(id) {
  const n = npcPorId(id); if (!n) return; const k = mestre.combate.participantes.filter(p => p.ref === n.id).length;
  mestre.combate.participantes.push({ uid: uid(), nome: n.nome + (k ? ` ${k + 1}` : ''), tipo: 'npc', ref: n.id, ini: null, pv: n.ficha.pv, pvMax: n.ficha.pv, nota: '', condicoes: [] });
}
// Defesa do alvo de um ataque (null = desconhecida: o mestre digita)
function defesaDe(ctx, p) {
  if (p.tipo === 'jogador') return mesa.jogadores[p.ref]?.defesa ?? null;
  if (p.tipo === 'agente') { const f = fichaVinculada(ctx, p); return f ? derivar(f).defesa : null; }
  return fichaDe(p.ref)?.defesa ?? null;
}
// Aplica dano (ou cura, se valor < 0) num participante: ficha local com RD, jogador online por comando, ameaça/NPC nos PV do combate
export function danoNoParticipante(ctx, p, valor, { mental = false } = {}) {
  if (!p || !valor) return '';
  if (p.tipo === 'jogador') {
    if (mesa.jogadores[p.ref]?.acesso === 'consulta') return `${p.nome} está em modo de consulta`;
    const ok = comandoParaJogador(p.ref, valor > 0 ? { acao: 'dano', valor, tipo: mental ? 'mental' : 'pv' } : { acao: 'cura', valor: -valor, recurso: 'pv' });
    return ok ? `${p.nome}: ${valor > 0 ? `${valor} de dano${mental ? ' mental' : ''}` : `+${-valor} PV`} enviado` : `${p.nome} está offline`;
  }
  const ficha = fichaVinculada(ctx, p);
  if (ficha) {
    const d = derivar(ficha);
    if (valor > 0) { const r = sofrerDano(ficha, d, valor, { tipo: mental ? 'mental' : 'pv', rd: mental ? d.rdMental : d.rd }); p.pv = ficha.recursos.pv; ctx.salvarFicha(ficha); return `${p.nome}: −${r?.total ?? valor} ${mental ? (d.pd ? 'PD' : 'SAN') : 'PV'}`; }
    atualizaPv(ctx, p, d.atual.pv - valor); return `${p.nome}: +${-valor} PV`;
  }
  if (mental) return `${p.nome}: ameaças não têm Sanidade (anote o efeito)`;
  p.pv = Math.min(p.pvMax, p.pv - valor);
  return `${p.nome}: ${valor > 0 ? `−${valor}` : `+${-valor}`} PV (${p.pv}/${p.pvMax}${p.pv <= 0 ? ', caído' : ''})`;
}
const opcoesAlvo = (ctx, menos = -1) => mestre.combate.participantes.map((p, i) => i === menos ? '' : `<option value="${i}">${esc(p.nome)}${(d => d != null ? ` · Defesa ${d}` : '')(defesaDe(ctx, p))}</option>`).join('');
function estadoPV(p) { const r = p.pv / p.pvMax; return p.pv <= 0 ? 'Caído' : r <= 0.5 ? 'Machucado' : r < 1 ? 'Ferido' : 'Ileso'; }

function abaAmeacas() {
  return `<div class="linha" style="margin-bottom:12px;flex-wrap:wrap"><button class="btn sangue" data-acao="m-nova-ameaca">+ Nova ameaça</button><button class="btn" data-acao="m-bestiario">📖 Bestiário</button><button class="btn" data-acao="m-importar-ameaca">Importar</button></div>
  ${mestre.ameacas.length ? `<div class="grade c2">${mestre.ameacas.map(blocoAmeaca).join('')}</div>` : '<p class="vazio">Nenhuma ameaça. Crie a primeira com os números do livro (VD, PV, Defesa, ataques…).</p>'}`;
}
const elNome = a => (a.elemento ? ELEM[a.elemento]?.nome : 'Sem elemento');
const sigilos = (els, cor) => els.map(e => `<span class="el-${e}" title="${esc(ELEM[e]?.nome || e)}">${sigilo(e, cor || 'var(--el)')}</span>`).join('');
// Números da ficha (ameaça, NPC ou ficha do bestiário). leitura: sem botões de rolar.
function blocoNumeros(a, { alvo = a.id, leitura = false, pericias = [], incertos = [] } = {}) {
  const q = (campo, v) => (incertos.includes(campo) ? '?' : v);
  const rol = (acao, extra, rotulo) => leitura ? `<span class="rolavel"><span class="d">${rotulo}</span></span>` : `<button class="rolavel" data-acao="${acao}" data-id="${esc(alvo)}" ${extra}><span class="d">${rotulo}</span></button>`;
  const T = [['iniciativa', 'Ini'], ['percepcao', 'Perc'], ['fortitude', 'Fort'], ['reflexos', 'Refl'], ['vontade', 'Von']];
  return `<div class="numeros-chave" style="margin:10px 0"><div class="chave"><b>${q('PV', a.pv)}</b><span>PV</span></div><div class="chave"><b>${q('Defesa', a.defesa)}</b><span>Defesa</span></div><div class="chave"><b class="${a.desl.length > 12 ? 'longo' : ''}">${esc(a.desl)}</b><span>Desloc.</span></div></div>
    <p class="linha-stat"><b>Atributos</b>${ATRIBUTOS.map(x => `${x.sigla} ${a.atributos[x.id]}`).join(' · ')}</p>
    <p class="linha-stat"><b>Perícias</b>${T.map(([k, n]) => rol('m-teste', `data-k="${k}"`, `${n} ${comSinal(a[k])}`)).join(' ')}${pericias.map((p, i) => ' ' + rol('m-npc-pericia', `data-i="${i}"`, `${esc(p.nome)} ${p.dados}d20${p.bonus ? comSinal(p.bonus) : ''}`)).join('')}</p>
    ${a.presenca.dt ? `<p class="linha-stat"><b>Presença perturbadora</b>DT ${a.presenca.dt}${a.presenca.dano ? `, ${esc(a.presenca.dano)} mental` : ''}${a.presenca.nex ? `, NEX ${a.presenca.nex}% imune` : ''}</p>` : ''}
    ${a.resistencias ? `<p class="linha-stat"><b>Resistências</b>${esc(a.resistencias)}</p>` : ''}${a.vulnerabilidades ? `<p class="linha-stat"><b>Vulnerab.</b>${esc(a.vulnerabilidades)}</p>` : ''}${a.sentidos ? `<p class="linha-stat"><b>Sentidos</b>${esc(a.sentidos)}</p>` : ''}
    ${a.ataques.map((x, i) => `<p class="linha-stat"><b>${esc(x.nome)}</b>${rol('m-atacar', `data-i="${i}"`, `${x.dados}d20 ${comSinal(x.bonus)}`)} ${rol('m-dano-ataque', `data-i="${i}"`, esc(x.dano))} <small class="apagado">${x.margem < 20 ? x.margem + '/' : ''}×${x.mult} ${esc(x.nota)}</small></p>`).join('')}`;
}
const textoLongo = (rotulo, t, aberto = false) => !t ? '' : t.length > 500
  ? `<details class="texto-livro-box"${aberto ? ' open' : ''}><summary>${rotulo}</summary><div class="texto-livro">${esc(t)}</div></details>`
  : `<p style="white-space:pre-wrap;font-size:.95rem;margin-top:6px">${esc(t)}</p>`;
const retratoMini = (img, nome) => img ? `<img class="retrato-mini" src="${esc(img)}" alt="Retrato de ${esc(nome)}">` : '';
function blocoAmeaca(a, { leitura = false, incertos = [] } = {}) {
  const els = a.elementos?.length ? a.elementos : a.elemento ? [a.elemento] : [];
  return `<article class="ameaca-bloco el-${a.elemento || 'nenhum'}" style="border-top-color:var(--el)">
    <div class="npc-topo">${retratoMini(a.imagem, a.nome)}<div style="flex:1;min-width:0"><div class="titulo-secao"><div class="linha">${sigilos(els)}<h3>${esc(a.nome)}</h3></div><span class="etiqueta">VD ${incertos.includes('VD') ? '?' : a.vd}</span></div>
    <p class="apagado" style="margin:0">${esc(a.tipo)} · ${esc(els.length ? els.map(e => ELEM[e].nome).join(', ') : elNome(a))} · ${esc(a.tamanho)}${a.notas && a.fonte ? ` · ${esc(a.notas)}` : ''}</p></div></div>
    ${blocoNumeros(a, { leitura, incertos })}
    ${leitura ? '' : textoLongo(a.fonte ? 'Habilidades, ações e texto do livro' : 'Habilidades e ações', a.habilidades)}
    ${a.enigma ? `<p class="linha-stat"><b>Enigma de medo</b>${esc(a.enigma)}</p>` : ''}
    ${leitura ? '' : `<div class="linha fim" style="margin-top:8px;flex-wrap:wrap"><button class="btn pequeno" data-acao="m-mostrar" data-k="ameaca" data-id="${a.id}">📢 Mostrar aos jogadores</button><button class="btn pequeno" data-acao="m-editar-ameaca" data-id="${a.id}">Editar</button><button class="btn pequeno" data-acao="m-duplicar-ameaca" data-id="${a.id}">Duplicar</button><button class="btn pequeno perigo" data-acao="m-apagar-ameaca" data-id="${a.id}">Apagar</button></div>`}
  </article>`;
}

// ---------- Janela do bestiário ----------
const filtroBest = { q: '', el: '', vd: '', livro: '' };
let modoBest = 'ameaca'; // 'ameaca' (aba Ameaças) | 'npc' (modelo de NPC)
const FAIXAS_VD = { '0-40': 'VD até 40', '41-120': 'VD 41 a 120', '121-240': 'VD 121 a 240', '241-999': 'VD 241 ou mais' };
export function filtrarBestiario(lista, f = filtroBest) {
  const q = semAcento(f.q).trim(), [min, max] = f.vd ? f.vd.split('-').map(Number) : [0, 9999];
  const achados = lista.filter(b => (!q || q.split(/\s+/).every(p => b._busca.includes(p)))
    && (!f.el || (f.el === 'nenhum' ? b.categoria !== 'paranormal' : b.elementos.includes(f.el)))
    && b.vd >= min && b.vd <= max && (!f.livro || b.livro === f.livro));
  if (!q) return achados;
  const peso = b => { const n = semAcento(b.nome); return n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : q.split(/\s+/).every(p => n.includes(p)) ? 3 : 4; };
  return achados.map((b, i) => [peso(b), i, b]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[2]); // nome primeiro, depois o texto
}
function cartaoBest(b) {
  return `<button class="cartao best-cartao el-${b.elementos[0] || 'nenhum'}" data-acao="m-best-ver" data-id="${esc(b.id)}"><b>${sigilos(b.elementos)} ${esc(b.nome)}</b><small>VD ${vdTexto(b)} · ${numTexto(b, 'pv', 'PV')} PV · Defesa ${numTexto(b, 'defesa', 'Defesa')}</small><small class="apagado">${esc(b.tipo)} · ${esc(b.tamanho)} · ${esc(LIVROS_BESTIARIO[b.livro] || b.livro)} p. ${b.paginaLivro}</small>${b.conferir.length ? '<small class="conferir">⚠ confira no livro</small>' : ''}</button>`;
}
function listaBest() {
  const l = filtrarBestiario(BESTIARIO || []);
  return `<p class="apagado" style="grid-column:1/-1;margin:0">${l.length} de ${(BESTIARIO || []).length} fichas</p>${l.length ? l.map(cartaoBest).join('') : '<p class="vazio" style="grid-column:1/-1">Nada encontrado com esses filtros.</p>'}`;
}
function htmlBestiario() {
  const opt = (k, v, n) => `<option value="${v}" ${filtroBest[k] === v ? 'selected' : ''}>${n}</option>`;
  return `${modoBest === 'npc' ? '<p class="apagado" style="margin-top:0">Escolha uma ficha para servir de base ao NPC (as pessoas do livro estão em "Ameaças da Realidade").</p>' : ''}
  <div class="best-filtros"><label class="campo"><span>Buscar</span><input type="search" data-m-best="q" value="${esc(filtroBest.q)}" placeholder="Nome ou trecho do texto" aria-label="Buscar no bestiário" autofocus></label>
    <label class="campo"><span>Elemento</span><select data-m-best="el">${opt('el', '', 'Todos')}${ELEMENTOS.map(e => opt('el', e.id, e.nome)).join('')}${opt('el', 'nenhum', 'Ameaças da Realidade')}</select></label>
    <label class="campo"><span>VD</span><select data-m-best="vd">${opt('vd', '', 'Qualquer')}${Object.entries(FAIXAS_VD).map(([v, n]) => opt('vd', v, n)).join('')}</select></label>
    <label class="campo"><span>Livro</span><select data-m-best="livro">${opt('livro', '', 'Todos')}${Object.entries(LIVROS_BESTIARIO).map(([v, n]) => opt('livro', v, n)).join('')}</select></label></div>
  <div class="cartoes" id="best-lista" style="margin-top:10px">${listaBest()}</div>`;
}
function detalheBest(b) {
  const a = ameacaDoBestiario(b, b.id);
  const acervo = LIVROS_DIGITALIZADOS.some(l => l.id === b.livro) && b.pagina ? `<a class="btn pequeno" href="#/acervo/${b.livro}/${b.pagina}" data-acao="fechar-modal">📚 Abrir no Acervo (p. ${b.paginaLivro})</a>` : '';
  return `<div class="linha" style="margin-bottom:10px;flex-wrap:wrap"><button class="btn pequeno fantasma" data-acao="m-bestiario" data-modo="${modoBest}">← Voltar ao bestiário</button>${acervo}</div>
    ${b.conferir.length ? `<p class="aviso-ocr">⚠ Ficha tirada de OCR com erros. Confira no livro: ${esc(b.conferir.join(', '))}. Campos ilegíveis aparecem como 0 ou "?".</p>` : ''}
    ${blocoAmeaca(a, { leitura: true, incertos: ['VD', 'PV', 'Defesa'].filter(c => b.conferir.some(x => x.startsWith(c)) && !b[c.toLowerCase()]) })}${b.outrasPericias ? `<p style="margin:8px 0 0"><b>Outras perícias:</b> ${esc(b.outrasPericias)}</p>` : ''}
    <h3 class="titulo-vermelho">Texto do livro · ${esc(LIVROS_BESTIARIO[b.livro] || b.livro)} p. ${b.paginaLivro}</h3><div class="texto-livro">${esc(b.texto || '')}</div>`;
}

function progressoCena(cena, id) {
  if (!Object.hasOwn(cena.agentes, id)) Object.defineProperty(cena.agentes, id, { enumerable: true, value: { sucessos: 0, falhas: 0, visibilidade: 0 } });
  return cena.agentes[id];
}

const TIPOS_CENA = { investigacao: 'Investigação', perseguicao: 'Perseguição', furtividade: 'Furtividade', fabricacao: 'Fabricação em campo', interpretacao: 'Interpretação' };

function abaCenas(fichas) {
  const cena = mestre.cenas;
  const dicas = {
    investigacao: 'Registre pistas, eventos e ações. O mestre define a urgência e a DT de cada ação.',
    perseguicao: 'Registre os resultados da presa. O mestre resolve a captura e a fuga segundo o cenário e os poderes ativos.',
    furtividade: 'Registre o objetivo e os obstáculos. O mestre determina quem percebe cada ação.',
    fabricacao: 'Anote o item, material e ferramentas antes de resolver o teste.',
    interpretacao: 'Registre decisões e resultados da cena.',
  };
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa">Cena</h2><span class="etiqueta">Rodada ${cena.rodada}</span></div>
    <div class="grade c3">
      <label class="campo"><span>Tipo</span><select data-m-cena="tipo">${Object.entries(TIPOS_CENA).map(([id, nome]) => `<option value="${id}" ${cena.tipo === id ? 'selected' : ''}>${nome}</option>`).join('')}</select></label>
      <label class="campo"><span>Nome</span><input data-m-cena="nome" value="${esc(cena.nome)}"></label>
      <label class="campo"><span>Objetivo</span><input data-m-cena="objetivo" value="${esc(cena.objetivo)}"></label>
    </div><p class="apagado">${dicas[cena.tipo]}</p>
    <div class="linha"><button class="btn" data-acao="m-cena-rodada">Próxima rodada</button><button class="btn" data-acao="m-cena-contar" data-id="sucessos">Sucesso · ${cena.sucessos}</button><button class="btn" data-acao="m-cena-contar" data-id="falhas">Falha · ${cena.falhas}</button></div>
    <div class="grade c3" style="margin-top:12px"><label class="campo"><span>Agente</span><select id="cena-agente"><option value="">—</option>${fichas.map(f => `<option value="${esc(f.id)}">${esc(f.nome || 'Agente')}</option>`).join('')}</select></label><label class="campo"><span>DT</span><input type="number" id="cena-dt" min="1" max="99" value="15"></label><label class="campo"><span>Resultado do teste</span><input id="cena-resultado" type="number"></label></div>
    ${['perseguicao', 'furtividade'].includes(cena.tipo) ? `<div class="lista-hab">${fichas.map(f => {
      const p = cena.agentes[f.id] || { sucessos: 0, falhas: 0, visibilidade: 0 };
      const falhas = f.trilha === 'perseverante' && derivar(f).trilhaHabs.some(h => h.nome === 'Fuga Obstinada' && h.liberada) ? 4 : 3;
      return `<div class="hab"><b>${esc(f.nome || 'Agente')}</b> · ${cena.tipo === 'perseguicao'
        ? `${p.sucessos}/3 sucessos · ${p.falhas}/${falhas} falhas ${p.sucessos >= 3 ? '· venceu' : p.falhas >= falhas ? '· perdeu' : ''}`
        : `Visibilidade ${p.visibilidade} ${p.visibilidade >= 3 ? '· exposto' : ''} <button class="btn pequeno" data-acao="m-visibilidade" data-id="${esc(f.id)}" data-d="-1">−1</button> <button class="btn pequeno" data-acao="m-visibilidade" data-id="${esc(f.id)}" data-d="1">+1</button>`}</div>`;
    }).join('')}</div>` : ''}
    ${cena.tipo === 'furtividade' ? `<p>Visibilidade total: ${fichas.reduce((total, f) => total + (cena.agentes[f.id]?.visibilidade || 0), 0)}. Na regra de grupo, com 5 ou mais ao fim da rodada, personagens com visibilidade positiva são vistos.</p>` : ''}
    ${cena.tipo === 'fabricacao' ? `<ul>${fichas.flatMap(f => f.projetosFabricacao.map(p => `<li>${esc(f.nome)} · ${esc(p.nome)} · DT ${p.dt} · ${p.feitas}/${p.exigidas} ações</li>`)).join('')}</ul>` : ''}
    ${cena.tipo === 'investigacao' ? `<div class="linha" style="margin:10px 0"><button class="btn" data-acao="m-evento-investigacao">Rolar evento de investigação (2d6)</button><small class="apagado">SaH p. 82: no início da rodada. Cada evento só acontece uma vez por cena; repetido vira "sem evento".</small></div>` : ''}
    <div class="linha"><input id="cena-registro" aria-label="Evento, pista ou ação" placeholder="Evento, pista ou ação"><button class="btn sangue" data-acao="m-cena-registrar">Registrar</button></div>
    <ul>${cena.registro.slice().reverse().map(l => `<li>${esc(l)}</li>`).join('')}</ul>
    <button class="btn perigo" data-acao="m-cena-reiniciar">Nova cena</button>
  </section>`;
}

const linhaTxt = (rotulo, v) => v ? `<p class="linha-stat" style="white-space:pre-wrap"><b>${rotulo}</b>${esc(v)}</p>` : '';
function abaNpcs() {
  return `<div class="linha" style="margin-bottom:12px;flex-wrap:wrap"><button class="btn sangue" data-acao="m-novo-npc">+ Novo NPC</button><button class="btn" data-acao="m-bestiario" data-modo="npc">📖 A partir de um modelo do livro</button><button class="btn" data-acao="m-npc-de-jogador">Ficha de jogador → NPC</button></div>
  ${mestre.npcs.length ? `<div class="grade c2">${mestre.npcs.map(cartaoNpc).join('')}</div>` : '<p class="vazio">Nenhum NPC ainda. Crie um do zero, use uma pessoa do livro (policial, cultista, assassino…) ou transforme a ficha de um jogador em NPC.</p>'}`;
}
function cartaoNpc(n) {
  const f = fichaNpc(n);
  return `<article class="ameaca-bloco npc-bloco rel-${n.relacao}">
    <div class="npc-topo">${retratoMini(n.imagem, n.nome)}<div style="flex:1;min-width:0"><div class="titulo-secao"><h3>${esc(n.nome)}</h3><span class="etiqueta">${RELACOES[n.relacao]}</span></div>
    <p class="apagado" style="margin:0">${[n.ocupacao, n.local && `📍 ${n.local}`].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</p></div></div>
    ${linhaTxt('Aparência', n.aparencia)}${linhaTxt('Personalidade', n.personalidade)}${linhaTxt('O que sabe', n.sabe)}${linhaTxt('Notas', n.notas)}
    ${n.combate ? `<details class="texto-livro-box"><summary>Ficha de combate · PV ${f.pv} · Defesa ${f.defesa}</summary>${blocoNumeros(f, { alvo: n.id, pericias: n.pericias })}${textoLongo('Habilidades', f.habilidades)}</details>` : ''}
    ${n.origem ? `<p class="apagado" style="font-size:.8rem;margin:6px 0 0">Base: ${esc(n.origem)}</p>` : ''}
    <div class="linha fim" style="margin-top:8px;flex-wrap:wrap">${n.combate ? `<button class="btn pequeno" data-acao="m-add-npc" data-id="${n.id}">⚔ Ao combate</button>` : ''}<button class="btn pequeno" data-acao="m-mostrar" data-k="npc" data-id="${n.id}">📢 Mostrar aos jogadores</button><button class="btn pequeno" data-acao="m-editar-npc" data-id="${n.id}">Editar</button><button class="btn pequeno" data-acao="m-duplicar-npc" data-id="${n.id}">Duplicar</button><button class="btn pequeno perigo" data-acao="m-apagar-npc" data-id="${n.id}">Apagar</button></div>
  </article>`;
}
const retratoCampo = (img, alvo) => `<div class="retrato-campo"><div class="retrato" id="${alvo}-retrato">${img ? `<img src="${esc(img)}" alt="Retrato">` : '<span>sem imagem</span>'}</div>
  <div><b>Retrato / imagem</b><p class="apagado" style="margin:2px 0 6px;font-size:.85rem">Fica guardada neste navegador (reduzida). Vai junto quando você mostra aos jogadores.</p><div class="linha"><button class="btn pequeno" data-acao="m-imagem" data-alvo="${alvo}">Escolher imagem</button><button class="btn pequeno fantasma" data-acao="m-imagem-tirar" data-alvo="${alvo}">Remover</button></div></div></div>`;
const linhaPericiaNpc = p => `<div class="grade c3 npc-per" style="padding:4px 0"><label class="campo"><span>Perícia</span><input data-pr="nome" value="${esc(p.nome)}"></label><label class="campo"><span>Dados (d20)</span><input type="number" data-pr="dados" value="${p.dados}"></label><label class="campo"><span>Bônus</span><input type="number" data-pr="bonus" value="${p.bonus}"></label></div>`;
function formNpc(n) {
  const c = (k, rot) => `<label class="campo"><span>${rot}</span><input data-npc="${k}" value="${esc(n[k])}"></label>`;
  const t = (k, rot, ph = '') => `<label class="campo"><span>${rot}</span><textarea data-npc="${k}" placeholder="${ph}">${esc(n[k])}</textarea></label>`;
  return `${retratoCampo(n.imagem, 'npc')}
    <div class="grade c3">${c('nome', 'Nome')}${c('ocupacao', 'Ocupação')}${c('local', 'Local onde é encontrado')}
      <label class="campo"><span>Relação com o grupo</span><select data-npc="relacao">${Object.entries(RELACOES).map(([v, r]) => `<option value="${v}" ${n.relacao === v ? 'selected' : ''}>${r}</option>`).join('')}</select></label></div>
    ${t('aparencia', 'Aparência', 'O que os agentes veem ao encontrá-lo')}${t('personalidade', 'Personalidade', 'Jeito de falar, manias, o que quer')}${t('sabe', 'O que sabe', 'Pistas, segredos, o que conta e o que esconde')}${t('notas', 'Notas')}
    <label class="check" style="margin-top:8px"><input type="checkbox" data-npc-combate ${n.combate ? 'checked' : ''}><span><b>Ficha de combate</b><small>PV, Defesa, perícias e ataques para rolar e colocar no combate.</small></span></label>
    <div id="npc-ficha" ${n.combate ? '' : 'hidden'}><h3 class="titulo-vermelho">Outras perícias</h3><div id="npc-pericias">${n.pericias.map(linhaPericiaNpc).join('')}</div><button class="btn pequeno" data-acao="m-npc-add-pericia">+ Perícia</button>
      ${formAmeaca(n.ficha, { npc: true })}</div>`;
}
function lerNpc(base) {
  const n = structuredClone(base);
  document.querySelectorAll('[data-npc]').forEach(i => { n[i.dataset.npc] = i.value; });
  n.combate = !!document.querySelector('[data-npc-combate]')?.checked;
  n.pericias = [...document.querySelectorAll('.npc-per')].map(l => Object.fromEntries([...l.querySelectorAll('[data-pr]')].map(i => [i.dataset.pr, i.value])));
  n.ficha = lerForm(n.ficha);
  return normalizarNpc(n);
}
const buscaNota = n => semAcento(`${n.titulo} ${n.subtitulo} ${n.texto}`);
let buscaNotas = '';
function postIt(n) {
  return `<article class="postit cor-${n.cor}${n.fixada ? ' fixada' : ''}" data-busca-nota="${esc(buscaNota(n))}">
    <button class="postit-abrir" data-acao="m-nota-ver" data-id="${n.id}" aria-label="Abrir ${esc(n.titulo)}"><h3>${n.fixada ? '📌 ' : ''}${esc(n.titulo)}</h3>${n.subtitulo ? `<p class="postit-sub">${esc(n.subtitulo)}</p>` : ''}<p class="postit-texto">${esc(n.texto)}</p></button>
    <div class="postit-acoes"><button class="icone-btn" data-acao="m-nota-fixar" data-id="${n.id}" aria-label="${n.fixada ? 'Desafixar' : 'Fixar no topo'}" title="${n.fixada ? 'Desafixar' : 'Fixar no topo'}">📌</button><button class="icone-btn" data-acao="m-nota-editar" data-id="${n.id}" aria-label="Editar" title="Editar">✎</button><button class="icone-btn" data-acao="m-nota-apagar" data-id="${n.id}" aria-label="Apagar" title="Apagar">✕</button></div>
  </article>`;
}
function abaAnotacoes() {
  const notas = [...mestre.notas].sort((a, b) => b.fixada - a.fixada);
  return `<div class="linha" style="margin-bottom:12px;flex-wrap:wrap;align-items:center"><button class="btn sangue" data-acao="m-nota-nova">+ Nova anotação</button>
    <input type="search" data-m-notas-busca value="${esc(buscaNotas)}" placeholder="Buscar nas anotações (título, subtítulo ou texto)" aria-label="Buscar nas anotações" style="flex:1;min-width:200px"></div>
  ${notas.length ? `<div class="mural">${notas.map(postIt).join('')}</div><p class="vazio" id="notas-nada" hidden>Nenhuma anotação com essa busca.</p>` : '<p class="vazio">Nenhuma anotação. Crie post-its para pistas, NPCs, locais, cronologia e segredos da missão e consulte durante a sessão.</p>'}
  <p class="apagado" style="margin-top:10px">Salvo só neste navegador. Use Backup para guardar.</p>`;
}
function formNota(n) {
  return `<div class="grade c2"><label class="campo"><span>Título</span><input id="nota-titulo" value="${esc(n.titulo)}" autofocus></label><label class="campo"><span>Subtítulo</span><input id="nota-subtitulo" value="${esc(n.subtitulo)}" placeholder="Ex.: NPC, Local, Pista, Sessão 3"></label></div>
    <label class="campo"><span>Texto</span><textarea id="nota-texto" style="min-height:40vh">${esc(n.texto)}</textarea></label>
    <div class="linha" style="flex-wrap:wrap;gap:6px"><span class="apagado">Cor:</span>${Object.entries(CORES_NOTA).map(([v, r]) => `<label class="cor-opcao postit cor-${v}"><input type="radio" name="nota-cor" value="${v}" ${n.cor === v ? 'checked' : ''}> ${r}</label>`).join('')}
    <label class="check"><input type="checkbox" id="nota-fixada" ${n.fixada ? 'checked' : ''}><span>Fixar no topo</span></label></div>`;
}

function formAmeaca(a, { npc = false } = {}) {
  const c = (k, rot, tipo = 'text', v = a[k]) => `<label class="campo"><span>${rot}</span><input type="${tipo}" data-am="${k}" value="${esc(v)}"></label>`;
  return `${npc ? '' : retratoCampo(a.imagem, 'am')}<div class="grade c3">${npc ? '' : `${c('nome', 'Nome')}<label class="campo"><span>Tipo</span><select data-am="tipo">${TIPOS_AMEACA.map(t => `<option ${a.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`}
    <label class="campo"><span>Elemento</span><select data-am="elemento"><option value="" ${a.elemento ? '' : 'selected'}>Sem elemento</option>${ELEMENTOS.map(e => `<option value="${e.id}" ${a.elemento === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
    ${c('vd', 'VD', 'number')}${c('tamanho', 'Tamanho')}${c('pv', 'PV', 'number')}${c('defesa', 'Defesa', 'number')}${c('desl', 'Deslocamento')}
    ${ATRIBUTOS.map(x => `<label class="campo"><span>${x.nome}</span><input type="number" data-am="atributos.${x.id}" value="${a.atributos[x.id]}"></label>`).join('')}
    ${c('iniciativa', 'Iniciativa (bônus)', 'number')}${c('percepcao', 'Percepção (bônus)', 'number')}${c('fortitude', 'Fortitude', 'number')}${c('reflexos', 'Reflexos', 'number')}${c('vontade', 'Vontade', 'number')}
    ${c('presenca.dt', 'Presença perturbadora: DT', 'number', a.presenca.dt)}${c('presenca.dano', 'Dano mental (ex.: 2d6)', 'text', a.presenca.dano)}${c('presenca.nex', 'NEX imune (%)', 'number', a.presenca.nex)}
    ${c('resistencias', 'Resistências')}${c('vulnerabilidades', 'Vulnerabilidades')}${c('sentidos', 'Sentidos')}</div>
    <h3 class="titulo-vermelho">Ataques</h3><div id="am-ataques">${a.ataques.map((x, i) => linhaAtaque(x, i)).join('')}</div>
    <button class="btn pequeno" data-acao="m-add-ataque-form">+ Ataque</button>
    <label class="campo" style="margin-top:10px"><span>Habilidades e ações${a.fonte ? ' (texto do livro)' : ''}</span><textarea data-am="habilidades" style="min-height:${a.habilidades.length > 600 ? 260 : 120}px">${esc(a.habilidades)}</textarea></label>
    ${npc ? '' : `<label class="campo"><span>Enigma de medo / fraquezas</span><textarea data-am="enigma">${esc(a.enigma)}</textarea></label>
    <label class="campo"><span>Descrição para os jogadores (sem números)</span><textarea data-am="descricao" placeholder="O que os agentes veem. Vai junto com a imagem no botão Mostrar aos jogadores.">${esc(a.descricao)}</textarea></label>`}`;
}
const linhaAtaque = (x, i) => `<div class="grade c3 am-ataque" style="padding:8px 0;border-bottom:1px solid var(--linha)"><label class="campo"><span>Nome</span><input data-at="nome" value="${esc(x.nome)}"></label><label class="campo"><span>Dados (d20)</span><input type="number" data-at="dados" value="${x.dados}"></label><label class="campo"><span>Bônus</span><input type="number" data-at="bonus" value="${x.bonus}"></label><label class="campo"><span>Dano</span><input data-at="dano" value="${esc(x.dano)}"></label><label class="campo"><span>Margem</span><input type="number" data-at="margem" value="${x.margem}"></label><label class="campo"><span>Multiplicador</span><input type="number" data-at="mult" value="${x.mult}"></label><label class="campo" style="grid-column:1/-1"><span>Nota</span><input data-at="nota" value="${esc(x.nota)}"></label></div>`;

function lerForm(base) {
  const a = structuredClone(base);
  document.querySelectorAll('[data-am]').forEach(i => { const [k, s] = i.dataset.am.split('.'); if (s) a[k][s] = i.value; else a[k] = i.value; });
  a.elementos = a.elemento ? [a.elemento, ...(a.elementos || []).filter(e => e !== a.elemento)] : [];
  a.ataques = [...document.querySelectorAll('.am-ataque')].map(l => Object.fromEntries([...l.querySelectorAll('[data-at]')].map(i => [i.dataset.at, i.value])));
  return normalizarAmeaca(a);
}

// ---------- Ações ----------
function fichaVinculada(ctx, participante) {
  return participante?.tipo === 'agente' && participante.ref ? ctx?.fichas().find(f => f.id === participante.ref) : undefined;
}

function atualizaPv(ctx, participante, valor) {
  const ficha = fichaVinculada(ctx, participante);
  const dd = ficha ? derivar(ficha) : null;
  const pv = Math.min(dd?.pv ?? participante.pvMax, Number(valor) || 0);
  participante.pv = pv;
  if (ficha) {
    ficha.recursos.pv = pv;
    if (pv > 0) ficha.recursos.morrendo = 0;
    ctx.salvarFicha(ficha);
  }
}

export function acoesMestre(ctx) {
  const att = () => { gravar(); ctx.render(); };
  const ameaca = id => mestre.ameacas.find(a => a.id === id);
  let editando = null, editandoNpc = null;
  const rodapeSalvar = acao => `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="${acao}">Salvar</button>`;
  const best = id => (BESTIARIO || []).find(b => b.id === id);
  return {
    'm-aba': el => { mestre.aba = el.dataset.aba; att(); },
    'm-mesa-abrir': async () => { await abrirMesa(); att(); },
    'm-mesa-escondido': el => { mesa.escondido = !!el.checked; ctx.avisar(mesa.escondido ? 'Rolagens escondidas dos jogadores.' : 'Rolagens visíveis para os jogadores.'); },
    'm-mesa-fechar': () => { if (!confirm('Fechar a mesa? Os jogadores serão desconectados e o código deixa de valer.')) return; fecharMesa(); att(); },
    'm-mesa-copiar': async () => { const v = document.getElementById('m-mesa-link')?.value || ''; try { await navigator.clipboard.writeText(v); ctx.avisar('Link copiado.'); } catch { document.getElementById('m-mesa-link')?.select(); ctx.avisar('Selecione e copie o link (Ctrl+C).'); } },
    'm-add-jogador': el => { const j = mesa.jogadores[el.dataset.peer]; if (!j || mestre.combate.participantes.some(p => p.tipo === 'jogador' && p.ref === el.dataset.peer)) return; mestre.combate.participantes.push({ uid: uid(), nome: j.nome, tipo: 'jogador', ref: el.dataset.peer, ini: null, pv: j.pv, pvMax: j.pvMax, nota: '' }); att(); },
    'm-j-cmd': el => {
      const j = mesa.jogadores[el.dataset.peer]; if (!j) return;
      if (j.acesso === 'consulta') return ctx.avisar(`${j.nome} está em modo de consulta.`, true);
      const q = inteiro(document.getElementById('mj-q-' + el.dataset.i)?.value, 0, 99999, 0); if (!q) return ctx.avisar('Digite a quantidade.', true);
      const c = el.dataset.c;
      const cmd = c === 'dano' ? { acao: 'dano', valor: q, tipo: 'pv' } : c === 'mental' ? { acao: 'dano', valor: q, tipo: 'mental' } : c === 'cura' ? { acao: 'cura', valor: q, recurso: 'pv' } : { acao: 'cura', valor: q, recurso: j.pd != null ? 'pd' : 'pe' };
      if (!comandoParaJogador(el.dataset.peer, cmd)) return ctx.avisar(`${j.nome} está offline.`, true);
      ctx.avisar(`${j.nome}: ${c === 'cura' ? `+${q} PV` : c === 'recupera' ? `+${q} ${j.pd != null ? 'PD' : 'PE'}` : `${q} de dano${c === 'mental' ? ' mental' : ''}`} enviado.`);
    },
    'm-j-recursos': el => {
      const j = mesa.jogadores[el.dataset.peer];
      if (!j?.online || j.acesso !== 'editar') return;
      const campos = j.pd != null ? ['pv', 'pd'] : ['pv', 'pe', 'san'];
      abrirModal(`Recursos · ${j.nome}`, `<div class="grade c2">${campos.map(k => `<label class="campo"><span>${k.toUpperCase()}</span><input type="number" min="-999" max="9999" data-m-j-recurso="${k}" value="${esc(j[k])}" data-original="${esc(j[k])}"></label>`).join('')}</div>`,
        `<button class="btn sangue" data-acao="m-j-recursos-salvar" data-peer="${esc(el.dataset.peer)}">Aplicar alterações</button>`);
    },
    'm-j-recursos-salvar': el => {
      const j = mesa.jogadores[el.dataset.peer];
      if (!j?.online || j.acesso !== 'editar') return ctx.avisar('Edição indisponível para este jogador.', true);
      const campos = [...document.querySelectorAll('[data-m-j-recurso]')];
      if (campos.some(c => !c.value || !c.checkValidity())) return ctx.avisar('Informe valores inteiros válidos para os recursos.', true);
      const recursos = Object.fromEntries(campos.filter(c => c.value !== c.dataset.original).map(c => [c.dataset.mJRecurso, Number(c.value)]));
      if (Object.keys(recursos).length && !comandoParaJogador(el.dataset.peer, { acao: 'recursos', recursos })) return ctx.avisar('Não foi possível enviar as alterações.', true);
      fecharModal();
    },
    'm-j-cond': el => { const j = mesa.jogadores[el.dataset.peer]; if (!j) return;
      if (j.acesso === 'consulta') return ctx.avisar(`${j.nome} está em modo de consulta.`, true);
      abrirModal('Condições · ' + j.nome, `<div class="grade c2">${CONDICOES.map(c => `<label class="check"><input type="checkbox" data-m-cond="${c.id}" ${(j.condicoes || []).includes(c.id) ? 'checked' : ''}><span>${esc(c.nome)}</span></label>`).join('')}</div>`,
        `<button class="btn sangue" data-acao="m-j-cond-salvar" data-peer="${esc(el.dataset.peer)}">Enviar para ${esc(j.nome)}</button>`, true); },
    'm-j-cond-salvar': el => {
      if (mesa.jogadores[el.dataset.peer]?.acesso === 'consulta') return ctx.avisar('Jogador está em modo de consulta.', true);
      const lista = [...document.querySelectorAll('[data-m-cond]:checked')].map(x => x.dataset.mCond);
      if (!comandoParaJogador(el.dataset.peer, { acao: 'condicoes', lista })) return ctx.avisar('Jogador offline.', true);
      fecharModal(); ctx.avisar('Condições enviadas.'); },

    'm-nova-ameaca': () => { editando = normalizarAmeaca({ nome: 'Nova ameaça', ataques: [{ nome: 'Garras', dados: 2, bonus: 10, dano: '2d6+5' }] }); abrirModal('Nova ameaça', formAmeaca(editando), rodapeSalvar('m-salvar-ameaca'), true); },
    'm-editar-ameaca': el => { editando = structuredClone(ameaca(el.dataset.id)); abrirModal(`Editar · ${editando.nome}`, formAmeaca(editando), '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-salvar-ameaca">Salvar</button>', true); },
    'm-add-ataque-form': () => { const box = document.getElementById('am-ataques'); box.insertAdjacentHTML('beforeend', linhaAtaque({ nome: 'Ataque', dados: 2, bonus: 10, dano: '1d8', margem: 20, mult: 2, nota: '' }, box.children.length)); },
    'm-salvar-ameaca': () => { const a = lerForm(editando); const i = mestre.ameacas.findIndex(x => x.id === a.id); if (i >= 0) mestre.ameacas[i] = a; else mestre.ameacas.push(a); fecharModal(); att(); },
    'm-duplicar-ameaca': el => { const a = structuredClone(ameaca(el.dataset.id)); a.id = uid(); a.nome += ' (cópia)'; mestre.ameacas.push(a); att(); },
    'm-apagar-ameaca': el => { const a = ameaca(el.dataset.id); if (!confirm(`Apagar "${a.nome}"?`)) return; mestre.ameacas = mestre.ameacas.filter(x => x.id !== a.id); att(); },
    'm-ver': el => { const n = npcPorId(el.dataset.ref); if (n) return abrirModal(n.nome, cartaoNpc(n), '', true); const a = ameaca(el.dataset.ref); if (a) abrirModal(a.nome, blocoAmeaca(a), '', true); },
    'm-teste': el => { const a = fichaDe(el.dataset.id); if (!a) return; const k = el.dataset.k; const atr = { iniciativa: 'agi', percepcao: 'pre', fortitude: 'vig', reflexos: 'agi', vontade: 'pre' }[k]; const n = a.atributos[atr]; rolarTesteUI({ titulo: `${a.nome} · ${k}`, quem: 'Mestre', dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2, pior: true }, bonus: a[k] }); },
    'm-atacar': el => { const a = fichaDe(el.dataset.id), x = a.ataques[Number(el.dataset.i)]; rolarTesteUI({ titulo: `${a.nome} · ${x.nome}`, quem: 'Mestre', dados: { qtd: x.dados, pior: false }, bonus: x.bonus, margem: x.margem, mult: x.mult, tipo: 'ataque', formulaDano: x.dano }); },
    'm-dano-ataque': el => { const a = fichaDe(el.dataset.id), x = a.ataques[Number(el.dataset.i)]; rolarDanoUI({ titulo: `${a.nome} · ${x.nome}`, quem: 'Mestre', formula: x.dano }); },
    'm-importar-ameaca': async () => {
      const arq = await escolherArquivo('.json,application/json'); if (!arq) return;
      try { const j = JSON.parse(await arq.text()); const lista = Array.isArray(j) ? j : j.ameacas || [j]; lista.slice(0, 300).forEach(a => mestre.ameacas.push(normalizarAmeaca({ ...a, id: uid() }))); att(); ctx.avisar(`${lista.length} ameaça(s) importada(s).`); } catch { ctx.avisar('Arquivo inválido.', true); }
    },
    'm-cena-rodada': () => {
      const cena = mestre.cenas;
      cena.rodada = Math.min(999, cena.rodada + 1);
      att();
    },
    'm-cena-contar': el => {
      const k = el.dataset.id;
      if (k === 'sucessos' || k === 'falhas') mestre.cenas[k]++;
      att();
    },
    'm-visibilidade': el => {
      const ficha = ctx.fichas().find(f => f.id === el.dataset.id);
      if (!ficha) return;
      const p = progressoCena(mestre.cenas, ficha.id);
      p.visibilidade = Math.min(99, Math.max(0, p.visibilidade + (Number(el.dataset.d) < 0 ? -1 : 1)));
      att();
    },
    'm-evento-investigacao': async () => {
      const cena = mestre.cenas;
      const r = await rolarDanoUI({ titulo: 'Evento de investigação', formula: '2d6', rotulo: 'EVENTO' }); if (!r) return;
      let n = r.total; const repetido = cena.eventos.includes(n) && ![6, 7, 8].includes(n);
      const [nome, texto] = repetido ? ['Sem evento', `Resultado ${n} repetido nesta cena.`] : EVENTOS_INVESTIGACAO[n];
      if (!repetido) cena.eventos.push(n);
      let extra = '';
      if (!repetido && n === 10) { const a = await rolarDanoUI({ titulo: 'Ferimento: atributo (1d10)', formula: '1d10', rotulo: 'ATRIBUTO' }); if (a) extra = ` Atributo: ${['Agilidade', 'Força', 'Intelecto', 'Presença', 'Vigor'][Math.ceil(a.total / 2) - 1]}.`; }
      cena.registro.push(`Rodada ${cena.rodada} · evento ${n} — ${nome}: ${texto}${extra}`.slice(0, 300));
      att(); ctx.avisar(`${nome}.${extra}`);
    },
    'm-cena-registrar': () => {
      const cena = mestre.cenas, entrada = document.getElementById('cena-registro').value.trim();
      const resultado = document.getElementById('cena-resultado').value;
      if (!entrada && resultado === '') return;
      const ficha = ctx.fichas().find(f => f.id === document.getElementById('cena-agente').value);
      const dt = inteiro(document.getElementById('cena-dt').value, 1, 99, 15);
      let teste = '';
      if (resultado !== '') {
        const sucesso = Number(resultado) >= dt;
        const chave = sucesso ? 'sucessos' : 'falhas';
        cena[chave]++;
        if (ficha && cena.tipo === 'perseguicao') progressoCena(cena, ficha.id)[chave]++;
        teste = ` · ${sucesso ? 'sucesso' : 'falha'} (${resultado} / DT ${dt})`;
      }
      cena.registro = [...cena.registro, txt(`R${cena.rodada} · ${ficha ? ficha.nome + ' · ' : ''}${entrada || 'Teste'}${teste}`, 300)].slice(-80);
      att();
    },
    'm-cena-reiniciar': () => {
      if (!confirm('Limpar os registros desta cena?')) return;
      mestre.cenas = normalizarMestre({}).cenas;
      att();
    },
    'm-condicoes': el => {
      const part = mestre.combate.participantes[Number(el.dataset.i)];
      if (part?.tipo === 'jogador') return acoesMestre(ctx)['m-j-cond']({ dataset: { peer: part.ref } });
      const ficha = fichaVinculada(ctx, part) || (part && { nome: part.nome, condicoes: part.condicoes || [] });
      if (!ficha) return;
      abrirModal('Condições · ' + ficha.nome, `<div class="grade c2">${CONDICOES.map(c => `<label class="check"><input type="checkbox" data-m-cond="${c.id}" ${ficha.condicoes.includes(c.id) ? 'checked' : ''}><span>${esc(c.nome)}</span></label>`).join('')}</div>`,
        `<button class="btn sangue" data-acao="m-salvar-condicoes" data-i="${Number(el.dataset.i)}">Salvar</button>`, true);
    },
    'm-salvar-condicoes': el => {
      const part = mestre.combate.participantes[Number(el.dataset.i)];
      const ficha = fichaVinculada(ctx, part);
      if (!ficha && part) { part.condicoes = [...document.querySelectorAll('[data-m-cond]:checked')].map(x => x.dataset.mCond); fecharModal(); return att(); }
      if (!ficha) return;
      ficha.condicoes = [...document.querySelectorAll('[data-m-cond]:checked')].map(x => x.dataset.mCond);
      ctx.salvarFicha(ficha); fecharModal(); att();
    },
    'm-bestiario': async el => {
      const modo = el?.dataset?.modo === 'npc' ? 'npc' : 'ameaca';
      if (modo === 'npc' && modoBest !== 'npc') filtroBest.el = 'nenhum';
      if (modo === 'ameaca' && modoBest === 'npc' && filtroBest.el === 'nenhum') filtroBest.el = '';
      modoBest = modo;
      await carregarBestiario();
      abrirModal(modo === 'npc' ? 'Modelos do livro para NPC' : 'Bestiário', htmlBestiario(), '', true);
    },
    'm-best-ver': el => {
      const b = best(el.dataset.id); if (!b) return;
      const npcBtn = `<button class="btn${modoBest === 'npc' ? ' sangue' : ''}" data-acao="m-best-npc" data-id="${esc(b.id)}">Usar como NPC</button>`;
      abrirModal(b.nome, detalheBest(b), modoBest === 'npc' ? npcBtn
        : `${b.categoria === 'pessoa' ? npcBtn : ''}<button class="btn" data-acao="m-best-criar" data-id="${esc(b.id)}">Criar a partir desta…</button><button class="btn sangue" data-acao="m-best-add" data-id="${esc(b.id)}">Adicionar às ameaças</button>`, true);
    },
    'm-best-add': el => { const b = best(el.dataset.id); if (!b) return; mestre.ameacas.push(ameacaDoBestiario(b)); mestre.aba = 'ameacas'; fecharModal(); att(); ctx.avisar(`${b.nome} entrou nas Ameaças. Dá para editar à vontade: o bestiário não muda.`); },
    'm-best-criar': el => { const b = best(el.dataset.id); if (!b) return; editando = ameacaDoBestiario(b); abrirModal(`Nova ameaça a partir de ${b.nome}`, formAmeaca(editando), rodapeSalvar('m-salvar-ameaca'), true); },
    'm-best-npc': el => { const b = best(el.dataset.id); if (!b) return; editandoNpc = npcDoBestiario(b); abrirModal(`Novo NPC a partir de ${b.nome}`, formNpc(editandoNpc), rodapeSalvar('m-salvar-npc'), true); },
    'm-imagem': async el => {
      const arq = await escolherArquivo('image/*'); if (!arq) return;
      let url = ''; try { url = imagemValida(await reduzirImagem(arq, 480)); } catch (e) { return ctx.avisar(e.message, true); } if (!url) return ctx.avisar('Não consegui ler essa imagem.', true);
      const alvo = el.dataset.alvo === 'npc' ? editandoNpc : editando; if (!alvo) return;
      alvo.imagem = url; const box = document.getElementById(`${el.dataset.alvo}-retrato`); if (box) box.innerHTML = `<img src="${esc(url)}" alt="Retrato">`;
    },
    'm-imagem-tirar': el => { const alvo = el.dataset.alvo === 'npc' ? editandoNpc : editando; if (!alvo) return; alvo.imagem = ''; const box = document.getElementById(`${el.dataset.alvo}-retrato`); if (box) box.innerHTML = '<span>sem imagem</span>'; },
    'm-mostrar': el => {
      const npc = el.dataset.k === 'npc', hb = el.dataset.k === 'hb', alvo = npc ? npcPorId(el.dataset.id) : hb ? mestre.homebrews.find(h => h.id === el.dataset.id) : ameaca(el.dataset.id); if (!alvo) return;
      if (mesa.papel !== 'mestre') return ctx.avisar('Abra a mesa online (aba Mesa online) para mostrar aos jogadores.', true);
      const desc = npc ? alvo.aparencia : hb ? [alvo.resumo, alvo.texto].filter(Boolean).join('\n\n') : alvo.descricao;
      abrirModal('Mostrar aos jogadores', `${alvo.imagem ? `<img class="retrato-grande" src="${esc(alvo.imagem)}" alt="">` : '<p class="apagado">Sem imagem. Dá para pôr uma em Editar.</p>'}
        <label class="campo"><span>Nome que eles veem</span><input id="m-mostrar-nome" value="${esc(alvo.nome)}"></label>
        <label class="campo"><span>Descrição (sem números)</span><textarea id="m-mostrar-desc" style="min-height:140px">${esc(desc)}</textarea></label>
        ${alvo.imagem ? '<label class="check"><input type="checkbox" id="m-mostrar-img" checked><span>Enviar a imagem</span></label>' : ''}
        <p class="apagado" style="font-size:.85rem">Os jogadores veem só o nome, a imagem e este texto, no painel 🌐 Mesa.</p>`,
        `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-mostrar-enviar" data-k="${npc ? 'npc' : hb ? 'hb' : 'ameaca'}" data-id="${esc(alvo.id)}">📢 Mostrar a todos</button>`, true);
    },
    'm-mostrar-enviar': el => {
      const alvo = el.dataset.k === 'npc' ? npcPorId(el.dataset.id) : el.dataset.k === 'hb' ? mestre.homebrews.find(h => h.id === el.dataset.id) : ameaca(el.dataset.id); if (!alvo) return;
      const n = mostrarAosJogadores({ nome: document.getElementById('m-mostrar-nome')?.value || alvo.nome, descricao: document.getElementById('m-mostrar-desc')?.value || '', imagem: document.getElementById('m-mostrar-img')?.checked ? alvo.imagem : '' });
      fecharModal(); ctx.avisar(n ? `Mostrado para ${n} jogador(es).` : 'Ninguém conectado agora; quem entrar verá na lista do painel.');
    },
    // ---- Anotações (post-its) ----
    'm-nota-nova': () => abrirModal('Nova anotação', formNota(normalizarNota({ titulo: '' })), rodapeSalvar('m-nota-salvar'), true),
    'm-nota-editar': el => { const n = mestre.notas.find(x => x.id === el.dataset.id); if (n) abrirModal(`Editar · ${n.titulo}`, formNota(n) + `<input type="hidden" id="nota-id" value="${esc(n.id)}">`, rodapeSalvar('m-nota-salvar'), true); },
    'm-nota-salvar': () => {
      const id = document.getElementById('nota-id')?.value, v = k => document.getElementById(k)?.value || '';
      const n = normalizarNota({ id, titulo: v('nota-titulo').trim(), subtitulo: v('nota-subtitulo').trim(), texto: v('nota-texto'), cor: document.querySelector('[name="nota-cor"]:checked')?.value, fixada: !!document.getElementById('nota-fixada')?.checked });
      const i = mestre.notas.findIndex(x => x.id === n.id); if (i >= 0) mestre.notas[i] = n; else mestre.notas.unshift(n);
      fecharModal(); att();
    },
    'm-nota-ver': el => { const n = mestre.notas.find(x => x.id === el.dataset.id); if (!n) return;
      abrirModal(n.titulo, `${n.subtitulo ? `<p class="apagado" style="margin-top:0">${esc(n.subtitulo)}</p>` : ''}<div class="texto-livro postit-leitura">${esc(n.texto) || '<span class="apagado">Sem texto.</span>'}</div>`,
        `<button class="btn" data-acao="m-nota-editar" data-id="${n.id}">Editar</button><button class="btn sangue" data-acao="fechar-modal">Fechar</button>`, true); },
    'm-nota-fixar': el => { const n = mestre.notas.find(x => x.id === el.dataset.id); if (!n) return; n.fixada = !n.fixada; att(); },
    'm-nota-apagar': el => { const n = mestre.notas.find(x => x.id === el.dataset.id); if (!n || !confirm(`Apagar a anotação "${n.titulo}"?`)) return; mestre.notas = mestre.notas.filter(x => x.id !== n.id); att(); },
    // ---- NPCs ----
    'm-novo-npc': () => { editandoNpc = normalizarNpc({ nome: 'Novo NPC' }); abrirModal('Novo NPC', formNpc(editandoNpc), rodapeSalvar('m-salvar-npc'), true); },
    'm-editar-npc': el => { const n = npcPorId(el.dataset.id); if (!n) return; editandoNpc = structuredClone(n); abrirModal(`Editar · ${n.nome}`, formNpc(editandoNpc), rodapeSalvar('m-salvar-npc'), true); },
    'm-npc-add-pericia': () => document.getElementById('npc-pericias')?.insertAdjacentHTML('beforeend', linhaPericiaNpc({ nome: 'Perícia', dados: 1, bonus: 0 })),
    'm-salvar-npc': () => { const n = lerNpc(editandoNpc); const i = mestre.npcs.findIndex(x => x.id === n.id); if (i >= 0) mestre.npcs[i] = n; else mestre.npcs.push(n); mestre.aba = 'npcs'; fecharModal(); att(); },
    'm-duplicar-npc': el => { const n = npcPorId(el.dataset.id); if (!n) return; mestre.npcs.push(normalizarNpc({ ...structuredClone(n), id: uid(), nome: n.nome + ' (cópia)' })); att(); },
    'm-apagar-npc': el => { const n = npcPorId(el.dataset.id); if (!n || !confirm(`Apagar o NPC "${n.nome}"?`)) return; mestre.npcs = mestre.npcs.filter(x => x.id !== n.id); att(); },
    'm-add-npc': el => {
      const n = npcPorId(el.dataset.id); if (!n) return; const k = mestre.combate.participantes.filter(p => p.ref === n.id).length;
      mestre.combate.participantes.push({ uid: uid(), nome: n.nome + (k ? ` ${k + 1}` : ''), tipo: 'npc', ref: n.id, ini: null, pv: n.ficha.pv, pvMax: n.ficha.pv, nota: '' }); att(); ctx.avisar(`${n.nome} entrou no combate.`);
    },
    'm-npc-pericia': el => { const n = npcPorId(el.dataset.id), p = n?.pericias[Number(el.dataset.i)]; if (!p) return; rolarTesteUI({ titulo: `${n.nome} · ${p.nome}`, quem: 'Mestre', dados: { qtd: p.dados, pior: false }, bonus: p.bonus }); },
    'm-npc-de-jogador': () => {
      const fs = ctx.fichas();
      abrirModal('Ficha de jogador → NPC', `<p>Vira um NPC com ficha de combate (PV, Defesa, perícias treinadas, ataques). A ficha original não muda.</p>
        ${fs.length ? `<h3 class="titulo-vermelho">Fichas deste navegador</h3><div class="cartoes">${fs.map(f => `<button class="cartao" data-acao="m-npc-jogador-local" data-id="${esc(f.id)}"><b>${esc(f.nome || 'Sem nome')}</b><small>${esc(f.classe || '')} · NEX ${esc(String(f.nex ?? '?'))}%</small></button>`).join('')}</div>` : ''}
        <h3 class="titulo-vermelho">Arquivo exportado</h3><p class="apagado">O .json do botão Exportar da ficha (ou Exportar todos).</p><button class="btn" data-acao="m-npc-jogador-arquivo">Escolher arquivo…</button>`, '', true);
    },
    'm-npc-jogador-local': el => { const f = ctx.fichas().find(x => x.id === el.dataset.id); if (!f) return; editandoNpc = npcDaFicha(structuredClone(f)); abrirModal(`Novo NPC · ${editandoNpc.nome}`, formNpc(editandoNpc), rodapeSalvar('m-salvar-npc'), true); },
    'm-npc-jogador-arquivo': async () => {
      const arq = await escolherArquivo('.json,application/json'); if (!arq) return;
      try {
        const j = JSON.parse(await arq.text());
        const lista = j.tipo === 'fichaoculta-fichas' ? j.fichas : j.tipo === 'fichaoculta-ficha' ? [j.ficha] : Array.isArray(j) ? j : [j.ficha || j];
        if (!lista.length || !lista.every(x => x && typeof x === 'object')) throw 0;
        if (lista.length === 1) { editandoNpc = npcDaFicha(lista[0]); return abrirModal(`Novo NPC · ${editandoNpc.nome}`, formNpc(editandoNpc), rodapeSalvar('m-salvar-npc'), true); }
        for (const f of lista.slice(0, 50)) mestre.npcs.push(npcDaFicha(f));
        mestre.aba = 'npcs'; fecharModal(); att(); ctx.avisar(`${Math.min(50, lista.length)} NPC(s) criados das fichas do arquivo.`);
      } catch { ctx.avisar('Esse arquivo não é uma ficha exportada do Ficha Oculta.', true); }
    },
    'm-bestiario-incluir': el => {
      const entrada = AMEACAS_BASE[Number(el.dataset.i)];
      if (!entrada) return;
      mestre.ameacas.push(normalizarAmeaca(entrada)); fecharModal(); att();
    },
    'm-add-agente': el => {
      const f = ctx.fichas().find(x => x.id === el.dataset.id); if (!f) return; const d = derivar(f);
      if (mestre.combate.participantes.some(p => p.tipo === 'agente' && p.ref === f.id)) return;
      if (mestre.combate.rodada === 1 && temPeso(f, 'distraido')) {
        f.condicoes = [...new Set([...f.condicoes, 'surpreendido'])];
        f.usosCena.surpresaIdade = 1;
        ctx.salvarFicha(f);
      }
      mestre.combate.participantes.push({ uid: uid(), nome: f.nome || 'Agente', tipo: 'agente', ref: f.id, ini: null, pv: d.atual.pv, pvMax: d.pv, nota: '' }); att();
    },
    'm-add-livre': () => { const i = document.getElementById('m-nome-livre'); const nome = i?.value.trim(); if (!nome) return i?.focus(); mestre.combate.participantes.push({ uid: uid(), nome, tipo: 'agente', ref: '', ini: null, pv: 1, pvMax: 1, nota: '' }); att(); },
    'm-add-ameaca': el => { adicionarAmeaca(el.dataset.id); att(); },
    'm-rolar-ini': () => {
      for (const p of mestre.combate.participantes) if (p.tipo === 'ameaca' || p.tipo === 'npc') { const a = fichaDe(p.ref); if (!a) continue; const n = a.atributos.agi; p.ini = rolarTeste({ qtd: Math.max(1, n || 2), pior: n < 1, bonus: a.iniciativa }).total; }
      mestre.combate.participantes.sort((x, y) => (y.ini ?? -99) - (x.ini ?? -99)); mestre.combate.vez = 0; att(); ctx.avisar('Iniciativa das ameaças rolada. Peça aos jogadores as deles.');
    },
    'm-ordenar': () => { mestre.combate.participantes.sort((x, y) => (y.ini ?? -99) - (x.ini ?? -99)); mestre.combate.vez = 0; att(); },
    'm-proximo': () => {
      const c = mestre.combate;
      if (!c.participantes.length) return;
      const atual = fichaVinculada(ctx, c.participantes[c.vez]);
      if (c.ativo && atual) { encerrarTurno(atual); ctx.salvarFicha(atual); }
      if (c.ativo && ++c.vez >= c.participantes.length) {
        c.vez = 0; c.rodada++;
        for (const p of c.participantes) {
          const ficha = fichaVinculada(ctx, p);
          if (ficha?.usosCena.surpresaIdade) {
            ficha.condicoes = ficha.condicoes.filter(x => x !== 'surpreendido');
            delete ficha.usosCena.surpresaIdade;
            ctx.salvarFicha(ficha);
          }
        }
      }
      c.ativo = true;
      const ficha = fichaVinculada(ctx, c.participantes[c.vez]);
      if (ficha) {
        iniciarTurno(ficha);
        const d = derivar(ficha);
        for (const msg of resolverCondicoesDoTurno(ficha, derivar)) ctx.avisar(`${ficha.nome}: ${msg}`);
        if (d.atual.pv <= 0) ficha.recursos.morrendo = Math.min(3, ficha.recursos.morrendo + 1);
        if (!d.pd && d.atual.san <= 0) ficha.recursos.enlouquecendo = Math.min(3, ficha.recursos.enlouquecendo + 1);
        if (temPeso(ficha, 'tosse') && dado(6) === 1) ctx.avisar(`${ficha.nome}: crise de tosse, perde este turno.`);
        ctx.salvarFicha(ficha);
      }
      att();
    },
    'm-dano': el => { const i = Number(el.dataset.i); const q = inteiro(document.getElementById('mp-q-' + i)?.value, 0, 99999, 0); if (!q) return; const p = mestre.combate.participantes[i]; if (!p) return;
      const msg = danoNoParticipante(ctx, p, Number(el.dataset.s) < 0 ? q : -q);
      if (p.tipo === 'jogador') return ctx.avisar(msg + '.', /offline/.test(msg));
      att(); },
    // ---- Escudo: janelas, dados, rolagem escondida ----
    'm-janela': el => {
      const t = el.dataset.tipo; if (!Object.hasOwn(JANELAS, t)) return;
      const i = mestre.janelas.findIndex(j => j.tipo === t);
      if (i >= 0) mestre.janelas.splice(i, 1);
      else { const n = mestre.janelas.length; mestre.janelas.push({ tipo: t, x: Math.max(8, (globalThis.innerWidth || 1280) - 360 - n * 24), y: 260 + n * 30 }); }
      att();
    },
    'm-escondido': () => { mesa.escondido = !mesa.escondido; att(); ctx.avisar(mesa.escondido ? 'Suas rolagens agora são escondidas dos jogadores.' : 'Suas rolagens agora aparecem para os jogadores.'); },
    'm-dado': el => rolarDanoUI({ titulo: `Rolagem do mestre · ${el.dataset.f}`, quem: 'Mestre', formula: el.dataset.f, rotulo: 'DADOS' }),
    'm-dado-formula': () => { const f = (document.getElementById('jf-formula')?.value || '').trim(); if (!f) return ctx.avisar('Digite uma fórmula, como 3d6+2.', true); rolarDanoUI({ titulo: `Rolagem do mestre · ${f}`, quem: 'Mestre', formula: f, rotulo: 'DADOS' }); },
    'm-dado-teste': () => { const q = inteiro(document.getElementById('jf-qtd')?.value, 1, 10, 1), b = inteiro(document.getElementById('jf-bonus')?.value, -50, 99, 0); rolarTesteUI({ titulo: `Teste do mestre · ${q}d20${b ? comSinal(b) : ''}`, quem: 'Mestre', dados: { qtd: q, pior: false }, bonus: b }); },
    // ---- Homebrews ----
    'm-hb-novo': () => abrirModal('Novo homebrew', formHomebrew(normalizarHomebrew({ nome: '' })), rodapeSalvar('m-hb-salvar'), true),
    'm-hb-editar': el => { const h = mestre.homebrews.find(x => x.id === el.dataset.id); if (h) abrirModal(`Editar · ${h.nome}`, formHomebrew(h), rodapeSalvar('m-hb-salvar'), true); },
    'm-hb-salvar': () => {
      const v = id => document.getElementById(id)?.value || '';
      const h = normalizarHomebrew({ id: v('hb-id'), nome: v('hb-nome').trim(), tipo: v('hb-tipo'), resumo: v('hb-resumo').trim(), texto: v('hb-texto'), tags: v('hb-tags').trim() });
      const i = mestre.homebrews.findIndex(x => x.id === h.id); if (i >= 0) mestre.homebrews[i] = h; else mestre.homebrews.push(h);
      fecharModal(); att();
    },
    'm-hb-ver': el => { const h = mestre.homebrews.find(x => x.id === el.dataset.id); if (!h) return;
      abrirModal(h.nome, `<p class="apagado" style="margin-top:0">${esc(h.tipo)}${h.tags ? ` · ${esc(h.tags)}` : ''}</p>${h.resumo ? `<p><b>${esc(h.resumo)}</b></p>` : ''}<div class="texto-livro postit-leitura">${esc(h.texto) || '<span class="apagado">Sem texto.</span>'}</div>`,
        `<button class="btn" data-acao="m-hb-editar" data-id="${h.id}">Editar</button><button class="btn sangue" data-acao="fechar-modal">Fechar</button>`, true); },
    'm-hb-apagar': el => { const h = mestre.homebrews.find(x => x.id === el.dataset.id); if (!h || !confirm(`Apagar "${h.nome}"?`)) return; mestre.homebrews = mestre.homebrews.filter(x => x.id !== h.id); att(); },
    'm-enc-ver': el => { const e = mestre.encontros.find(x => x.id === el.dataset.id); if (!e) return;
      const am = e.ameacas.map(a => ({ a: ameacaPorId(a.ref), qtd: a.qtd })).filter(x => x.a);
      abrirModal(e.nome, `${e.local ? `<p class="apagado" style="margin-top:0">📍 ${esc(e.local)}</p>` : ''}${e.descricao ? `<p style="white-space:pre-wrap">${esc(e.descricao)}</p>` : ''}<p class="linha-stat"><b>Ameaças</b>${am.map(x => `${esc(x.a.nome)}${x.qtd > 1 ? ` ×${x.qtd}` : ''}`).join(' · ') || '—'}</p>${e.notas ? `<p style="white-space:pre-wrap"><b>Notas:</b> ${esc(e.notas)}</p>` : ''}`,
        `<button class="btn sangue" data-acao="m-enc-iniciar" data-id="${e.id}">▶ Iniciar encontro</button>`, true); },
    // ---- Encontros ----
    'm-enc-novo': () => abrirModal('Novo encontro', formEncontro(normalizarEncontro({ nome: '' })), rodapeSalvar('m-enc-salvar'), true),
    'm-enc-editar': el => { const e = mestre.encontros.find(x => x.id === el.dataset.id); if (e) abrirModal(`Editar · ${e.nome}`, formEncontro(e), rodapeSalvar('m-enc-salvar'), true); },
    'm-enc-salvar': () => {
      const v = id => document.getElementById(id)?.value || '';
      const e = normalizarEncontro({ id: v('enc-id'), nome: v('enc-nome').trim(), local: v('enc-local').trim(), descricao: v('enc-descricao'), notas: v('enc-notas'),
        ameacas: [...document.querySelectorAll('[data-enc-am]')].map(i => ({ ref: i.dataset.encAm, qtd: i.value })), npcs: [...document.querySelectorAll('[data-enc-npc]:checked')].map(i => i.dataset.encNpc) });
      const i = mestre.encontros.findIndex(x => x.id === e.id); if (i >= 0) mestre.encontros[i] = e; else mestre.encontros.push(e);
      mestre.aba = 'encontros'; fecharModal(); att();
    },
    'm-enc-duplicar': el => { const e = mestre.encontros.find(x => x.id === el.dataset.id); if (!e) return; mestre.encontros.push(normalizarEncontro({ ...structuredClone(e), id: uid(), nome: e.nome + ' (cópia)' })); att(); },
    'm-enc-apagar': el => { const e = mestre.encontros.find(x => x.id === el.dataset.id); if (!e || !confirm(`Apagar o encontro "${e.nome}"?`)) return; mestre.encontros = mestre.encontros.filter(x => x.id !== e.id); att(); },
    'm-enc-marcar': el => document.querySelectorAll('.modal [data-enc-jog]').forEach(c => { c.checked = el.dataset.v === '1'; }),
    'm-enc-iniciar': el => {
      const e = mestre.encontros.find(x => x.id === el.dataset.id); if (!e) return;
      const temGente = mestre.combate.participantes.length > 0;
      abrirModal(`Iniciar · ${e.nome}`, `<h3 class="titulo-vermelho" style="margin-top:0">Quem entra no encontro</h3>${listaPuxar(candidatosJogadores(ctx.fichas()))}
        <h3 class="titulo-vermelho">Ameaças</h3>${e.ameacas.filter(a => ameacaPorId(a.ref)).map(a => `<label class="linha enc-linha"><input type="number" min="0" max="20" style="width:64px" data-enc-iam="${a.ref}" value="${a.qtd}"><span>${esc(ameacaPorId(a.ref).nome)}</span></label>`).join('') || '<p class="apagado">Nenhuma ameaça neste encontro.</p>'}
        ${e.npcs.filter(npcPorId).length ? `<h3 class="titulo-vermelho">NPCs</h3>${e.npcs.filter(npcPorId).map(id => `<label class="check"><input type="checkbox" data-enc-inpc="${id}" checked><span>${esc(npcPorId(id).nome)}</span></label>`).join('')}` : ''}
        ${temGente ? `<label class="check" style="margin-top:8px"><input type="checkbox" id="enc-substituir" checked><span><b>Limpar o combate atual</b><small>Desmarque para juntar este encontro a quem já está na iniciativa.</small></span></label>` : ''}`,
        `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-enc-comecar" data-id="${e.id}">▶ Começar</button>`, true);
    },
    'm-enc-comecar': el => {
      const e = mestre.encontros.find(x => x.id === el.dataset.id); if (!e) return;
      const jogs = [...document.querySelectorAll('[data-enc-jog]:checked')].map(c => c.dataset.encJog);
      const ams = [...document.querySelectorAll('[data-enc-iam]')].map(i => [i.dataset.encIam, inteiro(i.value, 0, 20, 0)]);
      const npcs = [...document.querySelectorAll('[data-enc-inpc]:checked')].map(c => c.dataset.encInpc);
      if (!document.getElementById('enc-substituir') || document.getElementById('enc-substituir').checked) mestre.combate = { rodada: 1, vez: 0, ativo: false, participantes: [], encontro: null };
      mestre.combate.encontro = { id: e.id, nome: e.nome };
      const n = puxarJogadores(ctx, jogs); for (const [id, q] of ams) adicionarAmeaca(id, q); for (const id of npcs) adicionarNpc(id);
      mestre.aba = 'combate'; fecharModal(); att(); ctx.avisar(`Encontro "${e.nome}" começou com ${n} jogador(es). Role a iniciativa.`);
    },
    'm-puxar': () => {
      const c = mestre.combate, cands = candidatosJogadores(ctx.fichas()).filter(x => !c.participantes.some(p => (x.chave === `j:${p.ref}` && p.tipo === 'jogador') || (x.chave === `a:${p.ref}` && p.tipo === 'agente')));
      abrirModal('Puxar jogadores para o combate', listaPuxar(cands.map(x => ({ ...x, marcado: true }))), cands.length ? `<button class="btn sangue" data-acao="m-puxar-ok">Puxar marcados</button>` : '', true);
    },
    'm-puxar-ok': () => { const n = puxarJogadores(ctx, [...document.querySelectorAll('[data-enc-jog]:checked')].map(c => c.dataset.encJog)); fecharModal(); att(); ctx.avisar(`${n} jogador(es) entraram no combate.`); },
    // ---- Ataque com alvo: rola contra a Defesa do alvo e aplica o dano nele ----
    'm-atacar-alvo': el => {
      const i = Number(el.dataset.i), p = mestre.combate.participantes[i], a = p && fichaDe(p.ref); if (!a) return;
      abrirModal(`${p.nome} ataca`, `<div class="lista-hab">${a.ataques.map((x, k) => `<label class="check hab"><input type="radio" name="alvo-atq" value="${k}" ${k ? '' : 'checked'}><span><b>${esc(x.nome)}</b> ${x.dados}d20${comSinal(x.bonus)} · ${esc(x.dano)} <small class="apagado">${esc(x.nota)}</small></span></label>`).join('')}</div>
        <label class="campo"><span>Alvo</span><select id="alvo-quem">${opcoesAlvo(ctx, i)}</select></label>
        <label class="campo"><span>Defesa do alvo (se não aparecer, digite)</span><input type="number" id="alvo-defesa" placeholder="automática"></label>`,
        `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-atacar-alvo-rolar" data-i="${i}">🎯 Rolar ataque</button>`, true);
    },
    'm-atacar-alvo-rolar': async el => {
      const p = mestre.combate.participantes[Number(el.dataset.i)], a = p && fichaDe(p.ref); if (!a) return;
      const x = a.ataques[Number(document.querySelector('[name="alvo-atq"]:checked')?.value) || 0], ia = Number(document.getElementById('alvo-quem')?.value), alvo = mestre.combate.participantes[ia]; if (!x || !alvo) return;
      const def = document.getElementById('alvo-defesa')?.value !== '' ? inteiro(document.getElementById('alvo-defesa').value, 0, 99, 0) : defesaDe(ctx, alvo);
      const t = await rolarTesteUI({ titulo: `${p.nome} · ${x.nome} → ${alvo.nome}`, quem: 'Mestre', dados: { qtd: x.dados, pior: false }, bonus: x.bonus, margem: x.margem, mult: x.mult, tipo: 'ataque', formulaDano: x.dano });
      const acertou = def == null ? null : t.total >= def;
      abrirModal(`${p.nome} → ${alvo.nome}`, `<p style="font-size:1.1rem">Ataque <b>${t.total}</b>${def != null ? ` contra Defesa <b>${def}</b>: ${acertou ? '<b class="acerto">ACERTOU</b>' : '<b class="erro">ERROU</b>'}` : ' (Defesa do alvo desconhecida)'}${t.critico ? ' · <b class="acerto">CRÍTICO</b>' : ''}</p>`,
        acertou === false ? '<button class="btn" data-acao="fechar-modal">Fechar</button>' : `<button class="btn fantasma" data-acao="fechar-modal">Não aplicar</button><button class="btn sangue" data-acao="m-atacar-alvo-dano" data-i="${el.dataset.i}" data-alvo="${ia}" data-k="${a.ataques.indexOf(x)}" data-crit="${t.critico ? 1 : 0}">Rolar dano em ${esc(alvo.nome)}</button>`, true);
    },
    'm-atacar-alvo-dano': async el => {
      const p = mestre.combate.participantes[Number(el.dataset.i)], a = p && fichaDe(p.ref), x = a?.ataques[Number(el.dataset.k)], alvo = mestre.combate.participantes[Number(el.dataset.alvo)]; if (!x || !alvo) return;
      const r = await rolarDanoUI({ titulo: `${p.nome} · ${x.nome} → ${alvo.nome}`, quem: 'Mestre', formula: x.dano, multiplicador: el.dataset.crit === '1' ? x.mult : 1 }); if (!r) return;
      const msg = danoNoParticipante(ctx, alvo, r.total, { mental: /mental/i.test(x.nota) });
      gravar(); ctx.render(); ctx.avisar(msg + '.', /offline/.test(msg));
    },
    // ---- Dano, cura ou condição em vários alvos de uma vez (área, explosão, ritual) ----
    'm-area': () => {
      abrirModal('Dano, cura ou condição em vários', `<div class="grade c2"><label class="campo"><span>Valor ou fórmula (ex.: 12 ou 4d6+2)</span><input id="area-valor" placeholder="4d6"></label>
        <label class="campo"><span>O que fazer</span><select id="area-tipo"><option value="dano">Dano</option><option value="mental">Dano mental</option><option value="cura">Cura de PV</option><option value="nada">Só condição</option></select></label></div>
        <label class="campo"><span>Condição (opcional)</span><select id="area-cond"><option value="">—</option>${CONDICOES.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></label>
        <h3 class="titulo-vermelho">Alvos <small class="apagado">(½ = passou no teste e sofre metade)</small></h3>
        <div class="lista-hab">${mestre.combate.participantes.map((p, i) => `<div class="linha area-alvo"><label class="check"><input type="checkbox" data-area="${i}"><span>${esc(p.nome)}</span></label><label class="check"><input type="checkbox" data-area-metade="${i}"><span>½</span></label></div>`).join('')}</div>`,
        `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-area-aplicar">Aplicar</button>`, true);
    },
    'm-area-aplicar': async () => {
      const alvos = [...document.querySelectorAll('[data-area]:checked')].map(c => Number(c.dataset.area)); if (!alvos.length) return ctx.avisar('Marque pelo menos um alvo.', true);
      const metade = new Set([...document.querySelectorAll('[data-area-metade]:checked')].map(c => Number(c.dataset.areaMetade)));
      const tipo = document.getElementById('area-tipo')?.value, cond = document.getElementById('area-cond')?.value, bruto = (document.getElementById('area-valor')?.value || '').trim();
      let valor = 0;
      if (tipo !== 'nada' && bruto) { if (/^\d+$/.test(bruto)) valor = Number(bruto); else { const r = await rolarDanoUI({ titulo: tipo === 'cura' ? 'Cura em vários' : 'Dano em vários', quem: 'Mestre', formula: bruto }); if (!r) return; valor = r.total; } }
      const msgs = [];
      for (const i of alvos) {
        const p = mestre.combate.participantes[i]; if (!p) continue;
        const v = metade.has(i) ? Math.floor(valor / 2) : valor;
        if (v && tipo !== 'nada') msgs.push(danoNoParticipante(ctx, p, tipo === 'cura' ? -v : v, { mental: tipo === 'mental' }));
        if (cond && !(metade.has(i))) {
          if (p.tipo === 'jogador') { const j = mesa.jogadores[p.ref]; comandoParaJogador(p.ref, { acao: 'condicoes', lista: [...new Set([...(j?.condicoes || []), cond])] }); }
          else { const f = fichaVinculada(ctx, p); if (f) { f.condicoes = [...new Set([...f.condicoes, cond])]; ctx.salvarFicha(f); } else p.condicoes = [...new Set([...(p.condicoes || []), cond])]; }
          msgs.push(`${p.nome}: ${CONDICOES.find(c => c.id === cond)?.nome}`);
        }
      }
      fecharModal(); att(); ctx.avisar(msgs.join(' · ') || 'Nada aplicado.');
    },
    'm-tirar': el => { mestre.combate.participantes.splice(Number(el.dataset.i), 1); mestre.combate.vez = Math.min(mestre.combate.vez, Math.max(0, mestre.combate.participantes.length - 1)); att(); },
    'm-encerrar': () => { if (!confirm('Encerrar o combate e limpar a lista?')) return; for (const p of mestre.combate.participantes) {
      const ficha = fichaVinculada(ctx, p);
      if (ficha) {
        if (ficha.usosCena.surpresaIdade) ficha.condicoes = ficha.condicoes.filter(x => x !== 'surpreendido');
        fimDeCena(ficha); ctx.salvarFicha(ficha);
      }
    }
    mestre.combate = { rodada: 1, vez: 0, ativo: false, participantes: [] }; att(); },
    'm-backup': () => baixarArquivo(`backup-mestre-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ tipo: 'fichaoculta-mestre', versao: 1, mestre }, null, 2)),
    'm-restaurar': async () => {
      const arq = await escolherArquivo('.json,application/json'); if (!arq) return;
      try { const j = JSON.parse(await arq.text()); if (j.tipo !== 'fichaoculta-mestre') throw 0; if (!confirm('Substituir a Área do Mestre atual pelo backup?')) return; mestre = normalizarMestre(j.mestre); att(); ctx.avisar('Backup restaurado.'); } catch { ctx.avisar('Esse arquivo não é um backup da Área do Mestre.', true); }
    },
  };
}
export function campoMestre(el, ctx, final = true) {
  if (el.dataset.mBest) { if (filtroBest[el.dataset.mBest] === el.value) return 'leve'; // o change ao sair do campo não redesenha (o clique no cartão continua valendo)
    filtroBest[el.dataset.mBest] = el.value; const box = document.getElementById('best-lista'); if (box) box.innerHTML = listaBest(); return 'leve'; }
  if ('npcCombate' in el.dataset) { const box = document.getElementById('npc-ficha'); if (box) box.hidden = !el.checked; return 'leve'; }
  if (el.dataset.mCena) {
    const k = el.dataset.mCena;
    if (k === 'tipo' && !final) return 'leve';
    if (k === 'tipo' && Object.hasOwn(TIPOS_CENA, el.value)) mestre.cenas.tipo = el.value;
    if (['nome', 'objetivo'].includes(k)) mestre.cenas[k] = txt(el.value, k === 'nome' ? 100 : 200);
    gravar();
    return k === 'tipo' ? 'cheio' : 'leve';
  }
  if (el.dataset.mPart) { const [i, k] = el.dataset.mPart.split('.'); const p = mestre.combate.participantes[Number(i)]; if (!p) return false; if (k === 'pv') { if (!final) return 'leve'; atualizaPv(ctx, p, inteiro(el.value, -9999, 99999)); gravar(); return 'cheio'; } p[k] = k === 'nota' ? txt(el.value, 200) : el.value === '' ? null : inteiro(el.value, -9999, 99999, 0); gravar(); return k === 'nota' ? 'leve' : 'leve'; }
  if ('mBuscaEscudo' in el.dataset) { buscaEscudo = el.value; const box = document.getElementById('jf-busca-res'); if (box) box.innerHTML = resultadosBusca(el.value); return 'leve'; }
  if ('mHbBusca' in el.dataset) { buscaHb = el.value; const q = semAcento(el.value).trim().split(/\s+/).filter(Boolean); document.querySelectorAll('[data-busca-hb]').forEach(p => { p.hidden = !q.every(w => p.dataset.buscaHb.includes(w)); }); return 'leve'; }
  if ('mNotasBusca' in el.dataset) { // consulta rápida: esconde os post-its que não batem, sem redesenhar
    buscaNotas = el.value; const q = semAcento(el.value).trim().split(/\s+/).filter(Boolean); let vistos = 0;
    document.querySelectorAll('[data-busca-nota]').forEach(p => { p.hidden = !q.every(w => p.dataset.buscaNota.includes(w)); if (!p.hidden) vistos++; });
    const nada = document.getElementById('notas-nada'); if (nada) nada.hidden = vistos > 0; return 'leve';
  }
  return false;
}
