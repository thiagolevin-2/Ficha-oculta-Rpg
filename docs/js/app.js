// app.js — o "maestro": estado, rotas (#/…), desenhar a tela e distribuir os cliques.
// Ciclo (igual ao Arcana): estado → render() → clique em [data-acao] → muda o estado → salva → render().
import { NOME_DO_SITE, MODOS, CLASSES, ORIGEM } from './catalogo.js?v=0.9';
import { normalizar, derivar } from './regras.js?v=0.9';
import { carregarFichas, salvarFichas, carregarTema, salvarTema, espacoUsado } from './armazenamento.js?v=0.9';
import { $, esc, avisar, htmlMantendoFoco, definir, inteiro, numero, baixarArquivo, escolherArquivo, imagemOpcional, sigilo } from './util.js?v=0.9';
import { telaCriador, novoRascunho, acoesCriador, campoCriador, problemasDoPasso } from './criador.js?v=0.9';
import { telaFicha, acoesFicha, checksFicha } from './fichaUI.js?v=0.9';
import { telaMestre, acoesMestre, campoMestre } from './mestre.js?v=0.9';
import { definirRaizModal, fecharModal, htmlHistorico, quandoMudar, limparHistorico, proxima, ultimaRolagem, rolarDanoUI, animacoesLigadas, ligarAnimacoes } from './rolagem.js?v=0.9';

export const VERSAO = '0.9';
const estado = {
  fichas: carregarFichas(),
  rota: { tela: 'inicio' },
  ui: { aba: 'agente', ritFiltro: { busca: '', elemento: '', circulo: '' } },
  criador: null,
  historicoAberto: false,
  tema: carregarTema(),
};
// Uma preferência visual apenas: não interfere nas regras ou nos dados das fichas.
let ambienteAtivo = true;
try { ambienteAtivo = localStorage.getItem('fichaoculta-ambiente') !== '0'; } catch {}
document.documentElement.dataset.ambiente = ambienteAtivo ? 'ativo' : 'silencioso';
const app = $('#app');
definirRaizModal($('#modal-raiz'));
document.documentElement.dataset.tema = estado.tema;

const ctx = {
  estado, avisar,
  render: () => render(),
  fichas: () => estado.fichas,
  fichaAtual: () => estado.fichas.find(f => f.id === estado.rota.id),
  salvarFicha(f) { f.atualizadoEm = new Date().toISOString(); const i = estado.fichas.findIndex(x => x.id === f.id); if (i >= 0) estado.fichas[i] = f; if (!salvarFichas(estado.fichas)) avisar('Não consegui salvar: o armazenamento do navegador está cheio. Exporte as fichas e remova retratos grandes.', true); },
  adicionarFicha(f) { estado.fichas.unshift(f); salvarFichas(estado.fichas); },
  apagarFicha(id) { estado.fichas = estado.fichas.filter(f => f.id !== id); salvarFichas(estado.fichas); },
};

// ---------- Rotas ----------
function lerRota() {
  const h = location.hash.replace(/^#\/?/, '');
  const [tela, id] = h.split('/');
  if (tela === 'agente' && id) return { tela: 'ficha', id };
  if (['agentes', 'novo', 'mestre', 'sobre'].includes(tela)) return { tela };
  return { tela: 'inicio' };
}
addEventListener('hashchange', () => {
  const antes = estado.rota;
  estado.rota = lerRota();
  if (estado.rota.tela === 'novo' && !estado.criador) estado.criador = novoRascunho();
  if (estado.rota.tela === 'ficha' && antes.id !== estado.rota.id) estado.ui.aba = 'agente';
  fecharModal();
  render(); scrollTo(0, 0);
});

// ---------- Telas ----------
function topo() {
  const r = estado.rota.tela;
  const link = (href, nome, ativo) => `<a href="${href}" ${ativo ? 'aria-current="page"' : ''}>${nome}</a>`;
  return `<header class="topo topo-oculto"><a class="marca" href="#/"><img src="assets/selo-oculto.svg" alt=""><span>FICHA <b>OCULTA</b><small>ARQUIVO DE AGENTES</small></span></a>
    <nav>${link('#/agentes', 'Agentes', ['agentes', 'ficha', 'novo'].includes(r))}${link('#/mestre', 'Mestre', r === 'mestre')}${link('#/sobre', 'Sobre', r === 'sobre')}
    <button class="btn-ambiente" data-acao="ambiente" title="Ativar ou pausar efeitos visuais" aria-label="Ativar ou pausar efeitos visuais" aria-pressed="${ambienteAtivo}">${ambienteAtivo ? '◉ Efeitos' : '◎ Efeitos'}</button>
    <button data-acao="tema" title="Trocar tema" aria-label="Trocar tema claro/escuro" aria-pressed="${estado.tema === 'papel'}">${estado.tema === 'papel' ? '☾ Noite' : '☼ Papel'}</button></nav></header>`;
}
function inicio() {
  const elementos = [['sangue','Sangue','A intensidade do sentir.'],['morte','Morte','O tempo devora tudo.'],['conhecimento','Conhecimento','O preço de saber.'],['energia','Energia','Nada permanece igual.'],['medo','Medo','O impossível tem nome.']];
  return `<div class="inicio-oculto">
    <section class="limiar-hero" aria-label="Bem-vindo à Ficha Oculta">
      <div class="hero-ruido" aria-hidden="true"></div>
      <div class="hero-gravura" aria-hidden="true"></div>
      <div class="hero-veu" aria-hidden="true"></div>
      <div class="hero-container pagina">
        <div class="hero-texto">
          <span class="sobrescrito-oculto"><span class="marca-cruz" aria-hidden="true">✦</span> REGISTRO NÃO AUTORIZADO <span class="risco-vivo" aria-hidden="true"></span></span>
          <h1 class="titulo-limiar">A MEMBRANA<br><span>ESTÁ</span><br><em>SE ROMPENDO.</em></h1>
          <p class="sinopse-limiar">Há coisas que não deveriam atravessar. Registre seus agentes, reúna evidências e encare o inexplicável em uma ficha feita para histórias de <i>Ordem Paranormal</i>.</p>
          <div class="hero-acoes"><a href="#/novo" data-acao="novo-agente" class="invocar principal"><span>✠</span> CRIAR UM AGENTE</a><a href="#/agentes" class="invocar secundario">CONSULTAR ARQUIVOS <span>↗</span></a></div>
          <div class="hero-nota"><span>REGISTROS DO OUTRO LADO</span><span>FERRAMENTA GRATUITA DE FÃS</span></div>
          <div class="licenca-comunidade"><a href="https://ordemparanormal.com.br/licenca" target="_blank" rel="noopener noreferrer" aria-label="Ler a licença oficial da comunidade"><img src="assets/selo-comunidade-referencia.svg" alt="Aviso de projeto não oficial e não canônico; consulte o selo oficial na página da licença" loading="lazy"></a><div><strong>PROJETO NÃO OFICIAL</strong><small>Este é um conteúdo não oficial, publicado sob a Licença da Comunidade de Ordem Paranormal.</small><small>Contém material gerado por inteligência artificial.</small></div></div>
        </div>
        <div class="hero-selo" aria-hidden="true"><img src="assets/selo-oculto.svg" alt=""><span class="hero-selo-texto">QUANDO A REALIDADE<br>FALHA, INVESTIGUE.</span></div>
      </div>
      <div class="hero-rodape" aria-hidden="true"><span>DOCUMENTO 001 / ACESSO AO OUTRO LADO</span><span>SCROLL PARA INVESTIGAR ↓</span></div>
    </section>
    <section class="pagina capitulo" aria-labelledby="capitulo-titulo">
      <header class="capitulo-cabecalho"><span class="capitulo-numero">I</span><div><span class="sobrescrito-oculto">DOSSIÊ DE OPERAÇÕES</span><h2 id="capitulo-titulo">Toda investigação <em>começa aqui.</em></h2></div></header>
      <div class="portais-acesso">
        <a href="#/agentes" class="portal-acesso portal-jogador"><span class="portal-imagem" aria-hidden="true"></span><span class="portal-margem">ARQUIVO 01 / PESSOAL</span><span class="portal-descricao"><span class="portal-icon" aria-hidden="true">✠</span><strong>Meus agentes</strong><small>Fichas, atributos, poderes, rituais e as marcas deixadas pelo Outro Lado.</small><span class="portal-link">ABRIR REGISTROS <b>↗</b></span></span></a>
        <a href="#/mestre" class="portal-acesso portal-mestre"><span class="portal-imagem" aria-hidden="true"></span><span class="portal-margem">ARQUIVO 02 / AMEAÇAS</span><span class="portal-descricao"><span class="portal-icon" aria-hidden="true">◈</span><strong>Área do mestre</strong><small>Controle o desconhecido, organize ameaças e registre a sua missão.</small><span class="portal-link">INVESTIGAR <b>↗</b></span></span></a>
        <div class="portal-acesso portal-futuro" aria-label="Tabuleiro em desenvolvimento"><span class="portal-imagem" aria-hidden="true"></span><span class="portal-margem">ARQUIVO 03 / LACRADO</span><span class="portal-descricao"><span class="portal-icon" aria-hidden="true">◇</span><strong>Mesa e tabuleiro</strong><small>O próximo mistério ainda não está pronto para ser revelado.</small><span class="portal-link">DOCUMENTO LACRADO <b>✕</b></span></span></div>
      </div>
    </section>
    <section class="elementos-ocultos" aria-labelledby="elementos-titulo"><div class="pagina">
      <header class="capitulo-cabecalho"><span class="capitulo-numero">II</span><div><span class="sobrescrito-oculto">ALÉM DA REALIDADE</span><h2 id="elementos-titulo">Os cinco <em>elementos.</em></h2><p>Há forças que não deveriam ser compreendidas.</p></div></header>
      <div class="circulo-elementos">${elementos.map(([id,nome,descricao]) => `<div class="elemento-placa elemento-${id}"><span class="elemento-sombra" aria-hidden="true"></span><img src="assets/glifo-${id}.svg" alt="" aria-hidden="true"><b>${nome}</b><small>${descricao}</small></div>`).join('')}</div>
      <div class="nota-fim"><span>UMA FERRAMENTA DE FÃS · NÃO OFICIAL</span><span>OS DADOS SÃO SALVOS NESTE NAVEGADOR. EXPORTE UMA CÓPIA.</span></div>
    </div></section>
  </div>`;
}

function listaAgentes() {
  const fs = estado.fichas;
  return `<div class="pagina arquivo-agentes"><div class="titulo-secao"><h1 class="faixa">Agentes</h1>
    <div class="linha"><a class="btn sangue" href="#/novo" data-acao="novo-agente">+ Novo agente</a><button class="btn" data-acao="importar">Importar</button>${fs.length ? '<button class="btn fantasma" data-acao="exportar-todos">Exportar todos</button>' : ''}</div></div>
    ${fs.length ? `<div class="lista-fichas">${fs.map(f => {
      const d = derivar(f);
      return `<a class="ficha-cartao" href="#/agente/${esc(f.id)}"><span class="mini" style="${f.retrato ? `background-image:url(${esc(f.retrato)})` : ''}">${f.retrato ? '' : esc((f.nome || '?')[0].toUpperCase())}</span>
        <span><b>${esc(f.nome || 'Sem nome')}</b><br><small>${esc(CLASSES[f.classe].nome)} · ${esc(ORIGEM[f.origem]?.nome || f.origemPropria?.nome || '—')}</small><br>
        <small class="dossie-txt">${esc(d.textoNivel)} · PV ${d.atual.pv}/${d.pv}${d.pd ? ` · PD ${d.atual.pd}/${d.pdMax}` : ` · PE ${d.atual.pe}/${d.pe} · SAN ${d.atual.san}/${d.san}`}</small><br>
        <span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}" style="margin-top:4px">${esc(MODOS[f.modo].nome)}</span></span></a>`;
    }).join('')}</div>` : `<div class="vazio"><p>Nenhum agente ainda. O Outro Lado está esperando.</p><a class="btn sangue" href="#/novo" data-acao="novo-agente">Criar o primeiro agente</a></div>`}
    <p class="apagado" style="margin-top:20px;font-size:.88rem">As fichas ficam só neste navegador (${Math.round(espacoUsado() / 1024)} KB usados). Se limpar os dados do navegador, elas somem: use Exportar para guardar uma cópia.</p></div>`;
}
function sobre() {
  return `<div class="pagina"><section class="painel"><h1 class="faixa">Sobre</h1>
    <p><b>${NOME_DO_SITE}</b> v${VERSAO} é uma ferramenta de fãs para jogar <i>Ordem Paranormal RPG</i>. Não é um produto oficial.</p>
    <p>As regras estão resumidas com outras palavras, só para consulta rápida durante o jogo. Os textos completos, as artes e as ameaças estão nos livros (Livro de Regras e Sobrevivendo ao Horror): compre e consulte os livros oficiais.</p>
    <h3 class="titulo-vermelho">Imagens</h3><p>Você pode colocar imagens suas na pasta <span class="dossie-txt">assets/imagens/</span> do site (veja o LEIA-ME de lá): <span class="dossie-txt">capa.jpg</span>, <span class="dossie-txt">classe-combatente.jpg</span>, <span class="dossie-txt">origem-academico.jpg</span> etc. Se o arquivo existir, ele aparece; se não, o espaço some.</p>
    <h3 class="titulo-vermelho">Dados 3D</h3><label class="check"><input type="checkbox" data-acao-check="animacoes" ${animacoesLigadas() ? 'checked' : ''}> <span>Mostrar a animação dos dados 3D</span></label>
    <h3 class="titulo-vermelho">Elementos</h3><p>${[['sangue', '#c8141f', 'Sangue'], ['morte', '#8d8d8d', 'Morte'], ['conhecimento', '#d9a521', 'Conhecimento'], ['energia', '#a64dff', 'Energia'], ['medo', '#f2efe8', 'Medo']].map(([id, cor, n]) => `<span class="etiqueta" style="border-color:${cor}">${sigilo(id, cor)} ${n}</span>`).join(' ')}</p>
    <p class="apagado" style="font-size:.88rem">A identidade gráfica usa artes originais criadas para esta versão, incluindo uma imagem gerada por inteligência artificial, e símbolos reinterpretados em vetores. Os livros oficiais foram usados como referência de atmosfera, sem reprodução de imagens ou logos dos livros. Este é um conteúdo não oficial, publicado sob a Licença da Comunidade de Ordem Paranormal. Contém material gerado por inteligência artificial.</p></section></div>`;
}
function bandeja() {
  return `<div class="bandeja"><button class="btn" data-acao="historico" aria-expanded="${estado.historicoAberto}">🎲 Rolagens</button></div>
  ${estado.historicoAberto ? `<aside class="historico" aria-label="Histórico de rolagens"><div class="titulo-secao"><h3 style="margin:0">Próxima rolagem</h3><button class="icone-btn" data-acao="historico" aria-label="Fechar">✕</button></div>
    <div class="grade c3" style="grid-template-columns:repeat(3,1fr);gap:6px"><label class="campo"><span>Dados ±</span><input type="number" id="prox-dados" data-prox="dados" value="${proxima.dados}" min="-5" max="5"></label><label class="campo"><span>Bônus</span><input type="number" id="prox-bonus" data-prox="bonus" value="${proxima.bonus}"></label><label class="campo"><span>DT</span><input type="number" id="prox-dt" data-prox="dt" value="${esc(proxima.dt)}" placeholder="—"></label></div>
    <p class="apagado" style="font-size:.8rem;margin:4px 0 8px">Dados e bônus valem só para a próxima rolagem (ex.: Ataque Especial +5, ajuda de aliado +1D). A DT fica até você apagar.</p>
    <div class="titulo-secao"><h3 style="margin:0">Histórico</h3><button class="btn pequeno fantasma" data-acao="limpar-historico">Limpar</button></div>${htmlHistorico()}</aside>` : ''}`;
}

function render() {
  const r = estado.rota;
  let corpo;
  if (r.tela === 'agentes') corpo = listaAgentes();
  else if (r.tela === 'novo') corpo = telaCriador(estado.criador || (estado.criador = novoRascunho()));
  else if (r.tela === 'ficha') { const f = ctx.fichaAtual(); corpo = f ? telaFicha(f, estado.ui) : `<div class="pagina"><p class="vazio">Agente não encontrado neste navegador. <a href="#/agentes">Voltar</a></p></div>`; }
  else if (r.tela === 'mestre') corpo = telaMestre(estado.fichas);
  else if (r.tela === 'sobre') corpo = sobre();
  else corpo = inicio();
  document.documentElement.dataset.tela = r.tela;
  htmlMantendoFoco(app, `${topo()}<main id="conteudo">${corpo}</main><footer class="rodape">${NOME_DO_SITE} v${VERSAO} · conteúdo não oficial · sob a Licença da Comunidade de Ordem Paranormal · contém material gerado por inteligência artificial · salvo só neste navegador</footer>${bandeja()}`);
}
quandoMudar(() => { if (estado.historicoAberto) render(); });

// ---------- Ações gerais ----------
const acoes = {
  ...acoesCriador(ctx), ...acoesFicha(ctx), ...acoesMestre(ctx),
  'fechar-modal': () => fecharModal(),
  'fechar-modal-fundo': (el, ev) => { if (ev.target === el) fecharModal(); },
  'ambiente': () => { ambienteAtivo = !ambienteAtivo; document.documentElement.dataset.ambiente = ambienteAtivo ? 'ativo' : 'silencioso'; try { localStorage.setItem('fichaoculta-ambiente', ambienteAtivo ? '1' : '0'); } catch {} render(); },
  'tema': () => { estado.tema = estado.tema === 'papel' ? 'noite' : 'papel'; document.documentElement.dataset.tema = estado.tema; salvarTema(estado.tema); render(); },
  'novo-agente': (el, ev) => { ev.preventDefault(); estado.criador = novoRascunho(); if (location.hash === '#/novo') render(); else location.hash = '#/novo'; },
  'historico': () => { estado.historicoAberto = !estado.historicoAberto; render(); },
  'limpar-historico': () => limparHistorico(),
  'rolar-dano-ultimo': el => { const u = ultimaRolagem(); if (!u) return; fecharModal(); rolarDanoUI({ titulo: u.titulo.replace(/^Ataque/, 'Dano'), quem: u.quem, formula: u.formulaDano, multiplicador: el.dataset.crit === '1' ? u.mult : 1 }); },
  'importar': async () => {
    const arq = await escolherArquivo('.json,application/json'); if (!arq) return;
    if (arq.size > 3_000_000) return avisar('Arquivo grande demais.', true);
    try {
      const j = JSON.parse(await arq.text());
      const lista = j.tipo === 'fichaoculta-fichas' ? j.fichas : j.tipo === 'fichaoculta-ficha' ? [j.ficha] : Array.isArray(j) ? j : [j.ficha || j];
      let n = 0;
      for (const x of lista.slice(0, 100)) { const f = normalizar(x); if (estado.fichas.some(y => y.id === f.id)) f.id = crypto.randomUUID?.() || String(Date.now() + n); estado.fichas.unshift(f); n++; }
      salvarFichas(estado.fichas); render(); avisar(`${n} agente(s) importado(s).`);
    } catch { avisar('Não consegui ler esse arquivo. Ele precisa ser uma ficha exportada por este site.', true); }
  },
  'exportar-todos': () => baixarArquivo(`agentes-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ tipo: 'fichaoculta-fichas', versao: 1, fichas: estado.fichas }, null, 2)),
};
const checks = { ...checksFicha(ctx), 'animacoes': el => { ligarAnimacoes(el.checked); avisar(el.checked ? 'Animação ligada.' : 'Animação desligada.'); } };

document.addEventListener('click', ev => {
  const alvo = ev.target.closest('[data-acao]');
  if (!alvo || alvo.disabled) return;
  const fn = acoes[alvo.dataset.acao];
  if (!fn) return;
  if (alvo.tagName === 'BUTTON') ev.preventDefault();
  try { fn(alvo, ev); } catch (e) { console.error(e); avisar('Algo deu errado: ' + e.message, true); }
});

// Campos: digitar salva sem redesenhar (o teclado não fecha); mudar número/seleção redesenha.
function aoEditar(ev, final) {
  const el = ev.target;
  if (el.dataset.acaoCheck) { if (final) checks[el.dataset.acaoCheck]?.(el, ev); return; }
  if (el.dataset.limiteItem != null) { // limites de itens por categoria (editados à mão)
    if (!final) return; const f = ctx.fichaAtual(); if (!f) return; const d = derivar(f);
    const lim = [...(f.limitesItens || d.patente.itens)]; lim[Number(el.dataset.limiteItem)] = inteiro(el.value, 0, 20, 0);
    f.limitesItens = lim; ctx.salvarFicha(normalizar(f)); Object.assign(f, normalizar(f)); render(); return;
  }
  if (el.dataset.prox) { proxima[el.dataset.prox] = el.dataset.prox === 'dt' ? el.value : inteiro(el.value, -50, 50, 0); return; }
  if (el.dataset.ritFiltro) { estado.ui.ritFiltro[el.dataset.ritFiltro] = el.value; if (final || el.type === 'search') render(); return; }
  if ('filtroModal' in el.dataset) { const q = el.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); document.querySelectorAll('.modal [data-busca]').forEach(b => { b.hidden = q && !b.dataset.busca.includes(q); }); return; }
  const m = campoMestre(el);
  if (m) { if (final && m === 'cheio') render(); return; }
  const c = campoCriador(ctx, el);
  if (c) {
    if (c === 'cheio' && (final || el.type === 'search')) render();
    else { // digitação: só atualiza o botão Avançar e a dica, sem redesenhar
      const prob = problemasDoPasso(estado.criador); const bt = document.querySelector('[data-acao="cri-avancar"]');
      if (bt) bt.disabled = prob.length > 0;
      const dica = document.querySelector('.pagina .linha.fim [role="status"]'); if (dica) dica.textContent = prob[0] || '';
    }
    return;
  }
  if (!el.dataset.campo) return;
  const f = ctx.fichaAtual(); if (!f) return;
  let v = el.type === 'checkbox' ? el.checked : el.value;
  const tipo = el.dataset.tipo;
  if (tipo === 'int') v = inteiro(v, -9999, 99999, 0);
  if (tipo === 'num') v = numero(v, 0, 999, 0);
  if (tipo === 'bool') v = !!el.checked;
  if (tipo === 'recurso') { v = el.value === '' ? null : inteiro(v, -999, 9999, 0); if (!final) return; }
  if ((tipo === 'int' || tipo === 'num') && !final && el.tagName === 'INPUT') return; // número: só ao terminar
  definir(f, el.dataset.campo, v);
  const precisa = final || el.tagName === 'SELECT' || tipo === 'bool';
  if (precisa) { const n = normalizar(f); Object.assign(f, n); }
  ctx.salvarFicha(f);
  if (precisa && (el.tagName === 'SELECT' || tipo || el.type === 'checkbox')) render();
}
document.addEventListener('input', ev => aoEditar(ev, false));
document.addEventListener('change', ev => aoEditar(ev, true));
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && $('#modal-raiz').firstChild) fecharModal(); });

// ---------- Início ----------
estado.rota = lerRota();
if (estado.rota.tela === 'novo') estado.criador = novoRascunho();
render();
try { navigator.storage?.persist?.(); } catch {}
