// rolagem.js — rolar testes, ataques e dano; mostrar o resultado; guardar o histórico.
// Os dados 3D (do Arcana) só MOSTRAM um resultado já sorteado: a animação não decide nada.
import { rolarTeste, rolar, comSinal } from './combate.js?v=0.40.5';
import { animateDice, diceAnimationsEnabled, setDiceAnimations, diceFromValues } from './dados3d.js?v=0.40.5';
import { carregarRolagens, salvarRolagens } from './armazenamento.js?v=0.40.5';
import { esc, avisar } from './util.js?v=0.40.5';
let historico = carregarRolagens();
// modificadores da PRÓXIMA rolagem (bandeja): dados a mais/menos e bônus fixo
export const proxima = { dados: 0, bonus: 0, dt: '' };
let aoMudar = () => {};
export const quandoMudar = fn => { aoMudar = fn; };
export const pegarHistorico = () => historico;
export function limparHistorico() { historico = []; salvarRolagens(historico); aoMudar(); }
export const animacoesLigadas = () => diceAnimationsEnabled();
export const ligarAnimacoes = v => setDiceAnimations(v);

// Ouvintes de rolagem: cada rolagem registrada também vai para eles (ex.: o feed da mesa online)
export const ouvintesRolagem = [];
function registrar(item) {
  for (const fn of ouvintesRolagem) { try { fn(item); } catch (e) { console.warn(e); } }
  historico.unshift({ ...item, quando: Date.now() });
  historico = historico.slice(0, 60);
  salvarRolagens(historico);
  aoMudar();
}

// Todos os dados aparecem iguais na animação: não dá para saber antes qual deles vai valer
const dadosAnim = (valores, indice, lados = 20) => valores.slice(0, 12).map(v => ({ sides: lados, value: v, selected: true }));

// Teste de perícia/atributo/ataque. dados: { qtd, pior } (já com condições). bonus: soma fixa.
export async function rolarTesteUI({ titulo, quem = '', dados, bonus = 0, margem = 21, mult = 2, gruposCritico = 1, tipo = 'teste', formulaDano = '', subtitulo = '', tituloDano = '', rotuloDano = '' }) {
  let qtd = dados.qtd, pior = dados.pior;
  // aplica os dados extras da bandeja (no Ordem, +1D = um d20 a mais; com atributo 0 a conta inverte)
  if (proxima.dados) {
    const efetivo = (pior ? 2 - qtd : qtd) + proxima.dados; // volta ao "valor do atributo" e soma
    if (efetivo >= 1) { qtd = efetivo; pior = false; } else { qtd = 2 - efetivo; pior = true; }
  }
  const bonusTotal = bonus + proxima.bonus;
  const dt = Number(proxima.dt) || null;
  const r = rolarTeste({ qtd, pior, bonus: bonusTotal, margem });
  const item = { tipo, titulo, quem, valores: r.valores, indice: r.indice, pior: r.pior, bonus: bonusTotal, total: r.total, critico: tipo === 'ataque' && r.critico, dt, formulaDano, mult, gruposCritico, margem, tituloDano, rotuloDano };
  proxima.dados = 0; proxima.bonus = 0;
  await animar(item);
  registrar(item);
  mostrarResultado(item);
  return item;
}

export async function rolarDanoUI({ titulo, quem = '', formula, multiplicador = 1, gruposCritico = 1, multiplicarExpressao = false, tipo = 'dano', rotulo = '' }) {
  let r;
  try { r = rolar(formula, { multiplicador, gruposCritico, multiplicarExpressao }); } catch (e) { avisar(e.message, true); return null; }
  const item = { tipo, titulo, quem, formula, multiplicador, multiplicarExpressao, total: r.total, detalhe: r.detalhe, grupos: r.dados, rotulo };
  await animar(item);
  registrar(item);
  mostrarResultado(item);
  return item;
}

async function animar(item) {
  if (!diceAnimationsEnabled()) return;
  try {
    if (item.valores) {
      await animateDice(dadosAnim(item.valores, item.indice), { label: item.titulo, total: item.total, subtitle: item.pior ? 'ATRIBUTO ZERO: VALE O PIOR' : `${item.valores.length}d20 · VALE O MELHOR`, dc: item.dt, natural: item.valores[item.indice], kind: item.tipo === 'ataque' ? 'attack' : 'check', criticalThreshold: item.margem || 21, quem: item.quem });
    } else {
      // d2 vira moeda e d100 vira dois d10 (dezenas e unidades); outros tamanhos não têm modelo 3D
      const dice = item.grupos.filter(g => [2, 4, 6, 8, 10, 12, 20, 100].includes(g.lados)).flatMap(g => diceFromValues(g.lados, g.valores)).slice(0, 24);
      if (!dice.length) return;
      await animateDice(dice, { label: item.titulo, total: item.total, subtitle: item.multiplicador > 1 ? `CRÍTICO ×${item.multiplicador}` : (item.rotulo || 'DANO'), kind: item.rotulo === 'CURA' ? 'heal' : item.rotulo === 'EFEITO' ? 'effect' : 'damage', quem: item.quem });
    }
  } catch (e) { console.warn(e); }
}

export function htmlDadosD20(item) {
  return item.valores.map((v, i) => `<span class="${i === item.indice ? 'escolhido' : ''}">${v}</span>`).join('');
}
export function vereditoTexto(item) {
  if (item.critico) return ['critico', 'CRÍTICO'];
  if (item.dt) return item.total >= item.dt ? ['sucesso', `SUCESSO (DT ${item.dt})`] : ['falha', `FALHA (DT ${item.dt})`];
  return ['', ''];
}

let raizModal = null;
export const definirRaizModal = el => { raizModal = el; };
export function fecharModal() { if (raizModal) raizModal.innerHTML = ''; document.body.style.overflow = ''; }
export function abrirModal(titulo, corpo, rodape = '', largo = false) {
  raizModal.innerHTML = `<div class="fundo-modal" data-acao="fechar-modal-fundo"><section class="modal ${largo ? 'largo' : ''}" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
    <header><h2>${esc(titulo)}</h2><button class="icone-btn" data-acao="fechar-modal" aria-label="Fechar">✕</button></header>
    <div class="corpo-modal">${corpo}</div>${rodape ? `<footer>${rodape}</footer>` : ''}</section></div>`;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => raizModal.querySelector('.modal [autofocus], .modal footer .btn.sangue, .modal .icone-btn')?.focus({ preventScroll: true }));
}

// guarda o último ataque para o botão "Rolar dano"
let ultimo = null;
export const ultimaRolagem = () => ultimo;

let efeitoPendente;
export function oferecerEfeitoRitual(item, resolver) {
  const token = crypto.randomUUID();
  efeitoPendente = { token, resolver, item };
  mostrarResultado(item);
}

export async function resolverEfeitoRitual(token) {
  if (efeitoPendente?.token !== token || ultimo !== efeitoPendente.item) return;
  const { resolver } = efeitoPendente;
  efeitoPendente = null;
  fecharModal();
  await resolver();
}

function mostrarResultado(item) {
  ultimo = item;
  let corpo;
  if (item.valores) {
    const [classe, texto] = vereditoTexto(item);
    corpo = `<div class="resultado-grande">${item.critico ? '<span class="respingo-critico" aria-hidden="true"></span>' : ''}<div class="total">${item.total}</div>
      <div class="dados-d20" aria-label="Dados rolados">${htmlDadosD20(item)} ${item.bonus ? `<b>${comSinal(item.bonus)}</b>` : ''}</div>
      <p class="apagado dossie-txt" style="margin-top:6px">${item.pior ? 'Atributo 0: fica com o PIOR dado.' : `${item.valores.length}d20, fica com o MELHOR.`}${item.tipo === 'ataque' ? ` Crítico em ${item.margem}+ (×${item.mult}).` : ''}</p>
      ${texto ? `<div class="veredito ${classe}">${texto}</div>` : ''}</div>`;
  } else {
    const critico = item.multiplicador > 1 ? ` · crítico ×${item.multiplicador} (${item.multiplicarExpressao ? 'dano extra inteiro' : 'só os dados da arma'})` : '';
    corpo = `<div class="resultado-grande"><div class="total">${item.total}</div><p class="dossie-txt">${esc(item.formula)}${critico}</p><p class="apagado dossie-txt">${esc(item.detalhe)}</p></div>`;
  }
  const rodape = efeitoPendente?.item === item
    ? `<button class="btn fantasma" data-acao="fechar-modal">Fechar</button><button class="btn sangue" data-acao="resolver-efeito-ritual" data-token="${efeitoPendente.token}">Resolver efeito do ritual</button>`
    : item.tipo === 'ataque' && item.formulaDano
    ? `<button class="btn" data-acao="rolar-dano-ultimo" data-crit="0">Rolar dano</button>${item.critico ? `<button class="btn sangue" data-acao="rolar-dano-ultimo" data-crit="1">Dano crítico ×${item.mult}</button>` : ''}`
    : item.tipo === 'ritual' && item.formulaDano
      ? `<button class="btn fantasma" data-acao="fechar-modal">Fechar</button><button class="btn sangue" data-acao="rolar-dano-ultimo" data-crit="0">Rolar ${item.rotuloDano === 'CURA' ? 'cura' : 'dano'} (${esc(item.formulaDano)})</button>`
      : `<button class="btn sangue" data-acao="fechar-modal">Fechar</button>`;
  if (raizModal) abrirModal(item.titulo, corpo, rodape);
}

export function htmlHistorico() {
  if (!historico.length) return '<p class="apagado">Nenhuma rolagem ainda.</p>';
  return historico.map(h => {
    const [classe, texto] = h.valores ? vereditoTexto(h) : ['', ''];
    return `<div class="rolagem-item ${h.critico ? 'critico' : ''}"><span class="total">${h.total}</span><b>${esc(h.titulo)}</b>${h.quem ? ` <small>· ${esc(h.quem)}</small>` : ''}
      <div class="det">${h.valores ? `<span class="dados-d20">${h.valores.map((v, i) => i === h.indice ? `<b>${v}</b>` : v).join(', ')}</span>${h.pior ? ' (pior)' : ''} ${h.bonus ? comSinal(h.bonus) : ''} ${texto ? '· ' + texto : ''}` : `${esc(h.formula)}${h.multiplicador > 1 ? ` ×${h.multiplicador}` : ''}: ${esc(h.detalhe)}`}</div></div>`;
  }).join('');
}
