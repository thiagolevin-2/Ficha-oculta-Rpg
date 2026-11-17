// mesa.js — mesa online com PeerJS. O mestre é o centro: ele abre a mesa, recebe um código (OCULTA-7K3Q)
// e os jogadores se conectam ao navegador dele com esse código. O servidor público do PeerJS só apresenta os
// navegadores; depois disso os dados vão direto entre eles.
//
// Mensagens (campo t):
//   jogador → mestre:  ficha {resumo} · rolagem {item}
//   mestre → jogador:  boasvindas {iniciativa, feed, mostrados} · iniciativa {iniciativa} · rolagem {item} · cmd {acao, valor, tipo, condicao}
//                      mostrar {item: nome, descricao, imagem} (o botão "Mostrar aos jogadores": sem números da ficha)
//   comandos (cmd):    dano (tipo 'pv' | 'mental') · cura (recurso 'pv' | 'pe' | 'san' | 'pd') · condicao (+ ou −)

const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const PREFIXO = 'fichaoculta-mesa-';
const CHAVE_MESTRE = 'fichaoculta-mesa-mestre';   // código da mesa do mestre (o link continua valendo ao recarregar)
const CHAVE_JOGADOR = 'fichaoculta-mesa-jogador'; // { codigo, fichaId } para voltar sozinho à mesa

export const mesa = {
  papel: null,          // 'mestre' | 'jogador' | null
  codigo: '', status: 'desligada', erro: '',
  fichaId: '',          // jogador: ficha usada na mesa
  jogadores: {},        // mestre: peerId → resumo da ficha + online
  feed: [],             // rolagens da mesa (mais nova primeiro)
  iniciativa: null,     // { rodada, ativo, vez, ordem: [{ nome, tipo }] }
  escondido: false,     // mestre: rolar escondido (fora do feed dos jogadores)
  mostrados: [],        // o que o mestre mostrou aos jogadores (mais novo primeiro)
};
let peer = null, conn = null, tentativa = null;
const conns = new Map();
let aoMudar = () => {}, aoComando = () => {}, aoMostrar = () => {};
export const quandoMostrar = fn => { aoMostrar = fn; };
export const quandoMesaMudar = fn => { aoMudar = fn; };
export const quandoComando = fn => { aoComando = fn; };
const mudou = () => { try { aoMudar(); } catch (e) { console.error(e); } };
const ler = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const gravar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ---------- ajudantes puros (testáveis sem rede) ----------
const LETRAS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O, 1/I/L
// Imagem aceita (retrato do NPC/ameaça): data URL de imagem comum ou endereço https, com tamanho limitado
export function imagemValida(v) {
  if (typeof v !== 'string' || !v) return '';
  if (v.length <= 700000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  if (v.length <= 600 && /^https:\/\/[^\s"'<>()]+$/.test(v)) return v;
  return '';
}
export function itemMostrado(x) {
  const t = (v, m) => (typeof v === 'string' ? v : '').slice(0, m);
  return { nome: t(x?.nome, 80) || '?', descricao: t(x?.descricao, 3000), imagem: imagemValida(x?.imagem), quando: Number(x?.quando) || Date.now() };
}
export function gerarCodigo(rand = Math.random) {
  let s = ''; for (let i = 0; i < 4; i++) s += LETRAS[Math.floor(rand() * LETRAS.length)];
  return 'OCULTA-' + s;
}
export function normalizarCodigo(c) {
  const x = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^OCULTA/, '');
  return x.length === 4 && [...x].every(ch => LETRAS.includes(ch)) ? 'OCULTA-' + x : '';
}
export const idDoPeer = codigo => PREFIXO + codigo.toLowerCase();
export const linkConvite = (codigo, base = location.href) => `${base.split('#')[0]}#/mesa/${codigo}`;
// O que o mestre vê da ficha de um jogador
export function resumoFicha(f, d) {
  return {
    id: f.id, nome: f.nome || 'Agente', classe: f.classe, nex: d.nexAtual ?? f.nex,
    pv: d.atual.pv, pvMax: d.pv, pvTemp: f.recursos?.pvTemp || 0,
    pd: d.pd ? d.atual.pd : null, pdMax: d.pd ? d.pdMax : null,
    pe: d.pd ? null : d.atual.pe, peMax: d.pd ? null : d.pe,
    san: d.pd ? null : d.atual.san, sanMax: d.pd ? null : d.san,
    defesa: d.defesa, condicoes: [...(f.condicoes || [])],
  };
}
// Rolagem no formato do feed (sem nada da ficha além do resultado)
export function itemDoFeed(item, quem = '') {
  const txt = item.valores ? `${item.valores.join(' · ')}${item.bonus ? ` ${item.bonus > 0 ? '+' : ''}${item.bonus}` : ''}` : item.formula || '';
  return { quem: item.quem || quem, titulo: item.titulo || 'Rolagem', total: item.total, critico: !!item.critico, texto: txt, quando: Date.now() };
}
// Ordem de iniciativa pública: só nomes e de quem é a vez (sem PV nem números das ameaças)
export function iniciativaPublica(combate) {
  if (!combate) return null;
  return { rodada: combate.rodada, ativo: !!combate.ativo, vez: combate.vez, ordem: combate.participantes.map(p => ({ nome: p.nome, tipo: p.tipo })) };
}
const noFeed = item => { mesa.feed = [item, ...mesa.feed].slice(0, 60); };

// ---------- PeerJS ----------
function carregarPeer() {
  if (globalThis.Peer) return Promise.resolve(globalThis.Peer);
  return new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = PEERJS; s.async = true;
    s.onload = () => (globalThis.Peer ? ok(globalThis.Peer) : erro(new Error('PeerJS não carregou.')));
    s.onerror = () => erro(new Error('Não consegui carregar o PeerJS. Confira a internet.'));
    document.head.appendChild(s);
  });
}
function falhar(msg) { mesa.status = 'erro'; mesa.erro = msg; mudou(); }
function enviar(c, msg) { try { if (c?.open) c.send(msg); } catch (e) { console.warn(e); } }
function paraTodos(msg) { for (const c of conns.values()) enviar(c, msg); }

// ---------- Mestre ----------
export async function abrirMesa({ novoCodigo = false } = {}) {
  let Peer; try { Peer = await carregarPeer(); } catch (e) { return falhar(e.message); }
  sairDaMesa({ manterCodigo: true });
  mesa.papel = 'mestre'; mesa.status = 'abrindo'; mesa.erro = '';
  mesa.codigo = (!novoCodigo && normalizarCodigo(ler(CHAVE_MESTRE))) || gerarCodigo();
  gravar(CHAVE_MESTRE, mesa.codigo); mudou();
  peer = new Peer(idDoPeer(mesa.codigo));
  peer.on('open', () => { mesa.status = 'aberta'; mudou(); });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { gravar(CHAVE_MESTRE, null); return abrirMesa({ novoCodigo: true }); } // código preso: gera outro
    if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') return falhar('Sem conexão com o servidor do PeerJS. Tentando de novo…'), setTimeout(() => mesa.papel === 'mestre' && abrirMesa(), 5000);
    console.warn('PeerJS', e);
  });
  peer.on('disconnected', () => { if (mesa.papel === 'mestre' && peer && !peer.destroyed) peer.reconnect(); });
  peer.on('connection', c => {
    c.on('open', () => { conns.set(c.peer, c); enviar(c, { t: 'boasvindas', codigo: mesa.codigo, iniciativa: mesa.iniciativa, feed: mesa.feed.slice(0, 30), mostrados: mesa.mostrados.slice(0, 3) }); mudou(); });
    c.on('data', m => receberDoJogador(c, m));
    c.on('close', () => { conns.delete(c.peer); if (mesa.jogadores[c.peer]) mesa.jogadores[c.peer].online = false; mudou(); });
  });
}
function receberDoJogador(c, m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'ficha' && m.resumo) mesa.jogadores[c.peer] = { ...m.resumo, peer: c.peer, online: true };
  else if (m.t === 'rolagem' && m.item) { const item = { ...m.item, quando: Date.now() }; noFeed(item); paraTodos({ t: 'rolagem', item }); }
  mudou();
}
export function publicarIniciativa(combate) {
  mesa.iniciativa = iniciativaPublica(combate);
  if (mesa.papel === 'mestre') paraTodos({ t: 'iniciativa', iniciativa: mesa.iniciativa });
}
// O mestre mostra um NPC/ameaça: só nome, imagem e descrição. Devolve quantos jogadores receberam.
export function mostrarAosJogadores(x) {
  if (mesa.papel !== 'mestre') return 0;
  const item = itemMostrado({ ...x, quando: Date.now() });
  mesa.mostrados = [item, ...mesa.mostrados].slice(0, 8);
  paraTodos({ t: 'mostrar', item }); mudou();
  return [...conns.values()].filter(c => c.open).length;
}
// O mestre aplica dano, cura ou condição na ficha de um jogador conectado
export function comandoParaJogador(peerId, cmd) {
  const c = conns.get(peerId);
  if (!c?.open) return false;
  enviar(c, { t: 'cmd', ...cmd }); return true;
}

// ---------- Jogador ----------
export async function entrarMesa(codigo, fichaId) {
  const cod = normalizarCodigo(codigo);
  if (!cod) return falhar('Código inválido. Use o formato OCULTA-XXXX.');
  let Peer; try { Peer = await carregarPeer(); } catch (e) { return falhar(e.message); }
  sairDaMesa();
  Object.assign(mesa, { papel: 'jogador', codigo: cod, fichaId, status: 'conectando', erro: '', feed: [], iniciativa: null, mostrados: [] });
  gravar(CHAVE_JOGADOR, { codigo: cod, fichaId }); mudou();
  peer = new Peer();
  const conectar = () => {
    if (mesa.papel !== 'jogador' || !peer || peer.destroyed) return;
    clearTimeout(tentativa);
    conn = peer.connect(idDoPeer(cod), { reliable: true, metadata: { fichaId } });
    conn.on('open', () => { mesa.status = 'conectada'; mesa.erro = ''; mudou(); pedirFicha(); });
    conn.on('data', receberDoMestre);
    conn.on('close', () => { if (mesa.papel !== 'jogador') return; mesa.status = 'reconectando'; mudou(); tentativa = setTimeout(conectar, 3000); });
  };
  peer.on('open', conectar);
  peer.on('error', e => {
    if (e.type === 'peer-unavailable') { mesa.status = 'esperando o mestre'; mudou(); tentativa = setTimeout(conectar, 4000); return; }
    if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') { falhar('Sem conexão com o servidor do PeerJS. Tentando de novo…'); tentativa = setTimeout(() => mesa.papel === 'jogador' && entrarMesa(cod, fichaId), 5000); return; }
    console.warn('PeerJS', e);
  });
  peer.on('disconnected', () => { if (mesa.papel === 'jogador' && peer && !peer.destroyed) peer.reconnect(); });
}
let pedirFicha = () => {};
export const quandoPedirFicha = fn => { pedirFicha = fn; }; // o app manda o resumo da ficha ao conectar
function receberDoMestre(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'boasvindas') { mesa.iniciativa = m.iniciativa || null; mesa.feed = Array.isArray(m.feed) ? m.feed : []; mesa.mostrados = (Array.isArray(m.mostrados) ? m.mostrados : []).slice(0, 8).map(itemMostrado); }
  else if (m.t === 'mostrar' && m.item) { const item = itemMostrado(m.item); mesa.mostrados = [item, ...mesa.mostrados].slice(0, 8); try { aoMostrar(item); } catch (e) { console.error(e); } }
  else if (m.t === 'iniciativa') mesa.iniciativa = m.iniciativa || null;
  else if (m.t === 'rolagem' && m.item) noFeed(m.item);
  else if (m.t === 'cmd') { try { aoComando(m); } catch (e) { console.error(e); } }
  mudou();
}
export function enviarFicha(resumo) { if (mesa.papel === 'jogador') enviar(conn, { t: 'ficha', resumo }); }
// Uma rolagem feita neste navegador entra no feed da mesa (a do mestre só se não estiver escondida)
export function rolagemNaMesa(item) {
  if (!mesa.papel || !['aberta', 'conectada'].includes(mesa.status)) return;
  const f = itemDoFeed(item);
  if (mesa.papel === 'jogador') enviar(conn, { t: 'rolagem', item: f });
  else { const x = { ...f, quem: f.quem || 'Mestre', escondida: mesa.escondido }; noFeed(x); if (!mesa.escondido) paraTodos({ t: 'rolagem', item: x }); mudou(); }
}

// ---------- sair / voltar ----------
export function sairDaMesa({ manterCodigo = false } = {}) {
  clearTimeout(tentativa);
  for (const c of conns.values()) { try { c.close(); } catch {} }
  conns.clear();
  try { conn?.close(); } catch {}
  try { peer?.destroy(); } catch {}
  peer = null; conn = null;
  const eraJogador = mesa.papel === 'jogador';
  Object.assign(mesa, { papel: null, status: 'desligada', erro: '', jogadores: {}, feed: [], iniciativa: null, mostrados: [] });
  if (!manterCodigo) { mesa.codigo = ''; if (eraJogador) gravar(CHAVE_JOGADOR, null); }
  mudou();
}
export function fecharMesa() { sairDaMesa(); gravar(CHAVE_MESTRE, null); }
// Ao recarregar a página, o jogador volta sozinho para a mesa em que estava
export function voltarSeEstavaNaMesa() {
  const j = ler(CHAVE_JOGADOR);
  if (j?.codigo && j?.fichaId) entrarMesa(j.codigo, j.fichaId);
}
export const codigoGuardadoDoMestre = () => normalizarCodigo(ler(CHAVE_MESTRE));
