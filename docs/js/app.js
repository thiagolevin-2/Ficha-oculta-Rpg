// app.js — o "maestro": estado, rotas (#/…), desenhar a tela e distribuir os cliques.
// Ciclo (igual ao Arcana): estado → render() → clique em [data-acao] → muda o estado → salva → render().
import { NOME_DO_SITE, MODOS, CLASSES, ORIGEM } from './catalogo.js?v=0.14';
import { normalizar, derivar } from './regras.js?v=0.14';
import { carregarFichas, salvarFichas, carregarTema, salvarTema, espacoUsado } from './armazenamento.js?v=0.14';
import { $, esc, avisar, htmlMantendoFoco, definir, inteiro, numero, baixarArquivo, escolherArquivo, imagemOpcional, sigilo } from './util.js?v=0.14';
import { telaCriador, novoRascunho, acoesCriador, campoCriador, problemasDoPasso } from './criador.js?v=0.14';
import { telaFicha, acoesFicha, checksFicha, carregarTextos } from './fichaUI.js?v=0.14-sah';
import { telaMestre, acoesMestre, campoMestre } from './mestre.js?v=0.14';
import { definirRaizModal, fecharModal, htmlHistorico, quandoMudar, limparHistorico, proxima, ultimaRolagem, rolarDanoUI, animacoesLigadas, ligarAnimacoes } from './rolagem.js?v=0.14';

export const VERSAO = '0.14';
const estado = {
  fichas: carregarFichas(),
  rota: { tela: 'inicio' },
  ui: { aba: 'agente', ritFiltro: { busca: '', elemento: '', circulo: '' } },
  criador: null,
  historicoAberto: false,
  tema: carregarTema(),
};
const app = $('#app');
let SUPLEMENTOS = null;
let SAH_REF = null;
const LIVROS_DIGITALIZADOS = [{"id": "base", "titulo": "Livro de Regras v1.3", "paginas": 332}, {"id": "as01", "titulo": "Arquivos Secretos #01", "paginas": 74}, {"id": "as02", "titulo": "Arquivos Secretos #02", "paginas": 108}, {"id": "as03", "titulo": "Arquivos Secretos #03", "paginas": 142}, {"id": "as04", "titulo": "Arquivos Secretos #04", "paginas": 79}, {"id": "as05", "titulo": "Arquivos Secretos #05", "paginas": 72}, {"id": "as06", "titulo": "Arquivos Secretos #06", "paginas": 84}, {"id": "as07", "titulo": "Arquivos Secretos #07", "paginas": 93}, {"id": "as09", "titulo": "Arquivos Secretos #09", "paginas": 66}, {"id": "sah", "titulo": "Sobrevivendo ao Horror · OCR", "paginas": 226}];
let livroDigital = null;
let paginaDigital = 1;
let buscaLivroDigital = '';
async function abrirLivroDigital(id, pagina=1) {
  if (!LIVROS_DIGITALIZADOS.some(v=>v.id===id)) return;
  try {
    const resp = await fetch('dados/biblioteca/'+id+'.json?v=0.14-sah', {cache:'no-cache'});
    if (!resp.ok) throw new Error('Não foi possível carregar esta transcrição.');
    livroDigital = await resp.json(); paginaDigital = Math.min(Math.max(1, Number(pagina)||1),livroDigital.paginas.length); buscaLivroDigital = '';
    render();
    if (id === 'sah' && location.hash.startsWith('#/acervo/sah/')) {
      requestAnimationFrame(() => document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}));
    }
  } catch (e) { avisar('Falha ao abrir livro digitalizado: '+e.message,true); }
}

async function carregarSuplementos(){
  try { const r=await fetch('dados/suplementos.json?v=0.14'); if(r.ok) SUPLEMENTOS=await r.json(); } catch(e){ console.warn('Suplementos não disponíveis',e); }
}
async function carregarReferenciasSAH(){
  try {
    const r = await fetch('dados/sah_referencias.json?v=0.14', {cache:'no-cache'});
    if(r.ok) SAH_REF = await r.json();
  } catch(e){ console.warn('Índice do Sobrevivendo ao Horror não disponível', e); }
}
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
  const [tela, id, pagina] = h.split('/');
  if (tela === 'acervo' && id === 'sah') return {tela:'acervo', livro:'sah', pagina:Math.max(1,Number(pagina)||1)};
  if (tela === 'agente' && id) return { tela: 'ficha', id };
  if (['agentes', 'novo', 'mestre', 'sobre', 'acervo'].includes(tela)) return { tela };
  return { tela: 'inicio' };
}
addEventListener('hashchange', () => {
  const antes = estado.rota;
  estado.rota = lerRota();
  if (estado.rota.tela === 'novo' && !estado.criador) estado.criador = novoRascunho();
  if (estado.rota.tela === 'ficha' && antes.id !== estado.rota.id) estado.ui.aba = 'agente';
  fecharModal();
  if(estado.rota.tela==='acervo' && estado.rota.livro==='sah') {
    abrirLivroDigital('sah',estado.rota.pagina);
  }
  render(); scrollTo(0, 0);
});

// ---------- Telas ----------
function topo() {
  const r = estado.rota.tela;
  const link = (href, nome, ativo) => `<a href="${href}" ${ativo ? 'aria-current="page"' : ''}>${nome}</a>`;
  return `<header class="topo"><span class="gotas" aria-hidden="true"><i></i><i></i><i></i></span><a class="marca" href="#/"><img src="assets/favicon.svg" alt=""><span>Ficha <b>Oculta</b> RPG</span></a>
    <nav>${link('#/agentes', 'Agentes', ['agentes', 'ficha', 'novo'].includes(r))}${link('#/mestre', 'Mestre', r === 'mestre')}${link('#/acervo', 'Suplementos', r === 'acervo')}${link('#/sobre', 'Sobre', r === 'sobre')}
    <button data-acao="tema" title="Trocar tema" aria-label="Trocar tema claro/escuro">${estado.tema === 'papel' ? '☾ Noite' : '☼ Papel'}</button></nav></header>`;
}
function inicio() {
  return `<div class="pagina"><section class="capa"><div class="circulo" aria-hidden="true"></div>
    <h1>Ficha Oculta<b>RPG</b></h1>
    <p>Fichas, rolagens e Área do Mestre para <i>Ordem Paranormal RPG</i>. Tudo fica salvo no seu navegador, sem conta e sem servidor.</p>
    ${imagemOpcional('assets/imagens/capa.jpg', 'imagem-capa', '')}
  </section>
  <div class="portas">
    <a class="porta" href="#/agentes"><span class="num">ARQUIVO 01</span><h2>Área do Jogador</h2><p>Crie agentes nas Regras Padrão ou no Sobrevivendo ao Horror. Ficha completa com rolagens.</p><span class="respingo"></span></a>
    <a class="porta" href="#/mestre"><span class="num">ARQUIVO 02</span><h2>Área do Mestre</h2><p>Ameaças, combate com iniciativa, anotações e backup.</p><span class="respingo" style="transform:rotate(90deg)"></span></a>
    <div class="porta em-breve"><span class="num">ARQUIVO 03 · EM BREVE</span><h2>Tabuleiro e Mesa</h2><p>Mapa ao vivo e mesa online (vamos trazer do Arcana nas próximas versões).</p></div>
  </div></div>`;
}
function listaAgentes() {
  const fs = estado.fichas;
  return `<div class="pagina"><div class="titulo-secao"><h1 class="faixa">Agentes</h1>
    <div class="linha"><a class="btn sangue" href="#/novo" data-acao="novo-agente">+ Novo agente</a><button class="btn" data-acao="importar">Importar</button>${fs.length ? '<button class="btn fantasma" data-acao="exportar-todos">Exportar todos</button>' : ''}</div></div>
    ${fs.length ? `<div class="lista-fichas">${fs.map(f => {
      const d = derivar(f);
      return `<a class="ficha-cartao" href="#/agente/${esc(f.id)}"><span class="mini" style="${f.retrato ? `background-image:url(${esc(f.retrato)})` : ''}">${f.retrato ? '' : esc((f.nome || '?')[0].toUpperCase())}</span>
        <span><b>${esc(f.nome || 'Sem nome')}</b><br><small>${esc(CLASSES[f.classe].nome)} · ${esc(ORIGEM[f.origem]?.nome || f.origemPropria?.nome || '—')}</small><br>
        <small class="dossie-txt">${esc(d.textoNivel)} · PV ${d.atual.pv}/${d.pv}${d.pd ? ` · PD ${d.atual.pd}/${d.pdMax}` : ` · PE ${d.atual.pe}/${d.pe} · SAN ${d.atual.san}/${d.san}`}</small><br>
        <span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}" style="margin-top:4px">${esc(MODOS[f.modo].nome)}</span>
        ${d.pendencias.length ? `<span class="pend-mini"><b>A fazer:</b> ${d.pendencias.map(p => esc(p.texto)).join(' · ')}</span>` : '<span class="pend-mini ok">Ficha em dia.</span>'}</span></a>`;
    }).join('')}</div>` : `<div class="vazio"><p>Nenhum agente ainda. O Outro Lado está esperando.</p><a class="btn sangue" href="#/novo" data-acao="novo-agente">Criar o primeiro agente</a></div>`}
    <p class="apagado" style="margin-top:20px;font-size:.88rem">As fichas ficam só neste navegador (${Math.round(espacoUsado() / 1024)} KB usados). Se limpar os dados do navegador, elas somem: use Exportar para guardar uma cópia.</p></div>`;
}

function acervo() {
  const volumes = SUPLEMENTOS?.volumes || [];
  const pg = livroDigital?.paginas?.find(p=>p.pagina===paginaDigital);
  const consulta = buscaLivroDigital.trim().toLocaleLowerCase('pt-BR');
  const resultados = consulta && livroDigital ? livroDigital.paginas.filter(p=>p.texto.toLocaleLowerCase('pt-BR').includes(consulta)).slice(0,45) : [];
  return `<div class="pagina acervo-pagina"><div class="titulo-secao"><h1 class="faixa">Acervo de suplementos</h1><span class="etiqueta">Textos dos PDFs enviados</span></div>
    <section class="painel"><p>Consulta de regras, poderes, rituais, trilhas, origens e itens adicionais dos <i>Arquivos Secretos</i>. Conteúdo extraído dos materiais enviados para uso pessoal; as imagens e tabelas devem ser conferidas no livro original. Estas regras não são ativadas automaticamente nas fichas.</p>
      <p class="apagado">O livro <i>Sobrevivendo ao Horror</i> agora está disponível nesta Biblioteca em texto OCR por página. As referências ajudam a localizar 155 descrições pendentes, mas erros de leitura são possíveis, especialmente em tabelas e números. A transcrição não foi conferida palavra por palavra.</p>
      <label class="campo"><span>Buscar nos suplementos</span><input type="search" data-acervo-busca placeholder="Nome de poder, ritual, trilha, regra ou item..." autocomplete="off"></label>
    </section>

    <section class="painel biblioteca-livros" id="biblioteca-digital">
      <h2 class="faixa">Biblioteca digitalizada</h2>
      <p>Os textos abaixo foram fornecidos em TXT e Word pelo usuário, incluindo Sobrevivendo ao Horror. A leitura conserva as transcrições por página e não transforma automaticamente menções em descrições de habilidades. Conteúdo destinado a uso pessoal — não publique em GitHub Pages público sem autorização.</p>
      <div class="livros-lista">${LIVROS_DIGITALIZADOS.map(v=>`<button class="btn pequeno" data-acao="abrir-livro-digital" data-livro="${v.id}" aria-pressed="${livroDigital?.id===v.id}">${esc(v.titulo)} · ${v.paginas} páginas</button>`).join('')}</div>
      ${livroDigital ? `<div class="livro-leitor" id="leitor-privado"><h3 class="titulo-vermelho">${esc(livroDigital.titulo)}</h3>
        <div class="linha livro-acoes">
          <button class="btn pequeno" data-acao="pagina-livro" data-pagina="${Math.max(1,paginaDigital-1)}" ${paginaDigital<=1?'disabled':''}>Anterior</button>
          <span class="etiqueta">Página ${paginaDigital} / ${livroDigital.paginas.length}</span>
          <button class="btn pequeno" data-acao="pagina-livro" data-pagina="${Math.min(livroDigital.paginas.length,paginaDigital+1)}" ${paginaDigital>=livroDigital.paginas.length?'disabled':''}>Próxima</button>
          <label class="campo pagina-escolher"><span>Ir à página</span><input type="number" id="biblioteca-ir-pagina" min="1" max="${livroDigital.paginas.length}" value="${paginaDigital}"></label>
          <button class="btn pequeno" data-acao="ir-pagina-livro">Abrir</button>
        </div>
        <div class="linha livro-acoes"><label class="campo" style="flex:1"><span>Buscar neste volume</span><input id="biblioteca-buscar" type="search" value="${esc(buscaLivroDigital)}" placeholder="Palavra ou nome de poder"></label><button class="btn pequeno" data-acao="buscar-livro-digital">Buscar</button></div>
        ${consulta ? `<div class="livro-resultados"><small>${resultados.length} resultado(s) listado(s), até 45 páginas</small><div class="linha">${resultados.map(p=>`<button class="btn pequeno fantasma" data-acao="pagina-livro" data-pagina="${p.pagina}">Página ${p.pagina}</button>`).join('')}</div></div>`:''}
        <div class="livro-pagina-digital"><strong>Página ${paginaDigital} · transcrição enviada</strong><pre>${esc(pg?.texto||'Página não localizada')}</pre></div>
      </div>` : ''}
    </section>
    ${!volumes.length ? '<p class="painel">Carregando os textos...</p>' : volumes.map(vol=>`<section class="painel acervo-volume" data-acervo-volume><h2 class="faixa">${esc(vol.titulo)}</h2><p class="apagado">${esc(vol.id)} · ${vol.secoes.reduce((n,sec)=>n+sec.paginas.length,0)} páginas selecionadas</p>${vol.secoes.map(sec=>`<div class="acervo-secao"><h3 class="titulo-vermelho">${esc(sec.titulo)}</h3>${sec.paginas.map(p=>`<details class="acervo-pagina-fonte" data-acervo-pagina><summary>Página ${p.pagina} · ver transcrição</summary><div class="acervo-conteudo">${esc(p.texto)}</div></details>`).join('')}</div>`).join('')}</section>`).join('')}
    <section class="painel referencias-sah">
      <h2 class="faixa">Sobrevivendo ao Horror — referências</h2>
      <p>Consulta por <strong>página do PDF</strong> (não pela numeração impressa). O conteúdo foi localizado por reconhecimento óptico automático e ainda precisa de conferência manual nos originais.</p>
      ${SAH_REF ? `
        <details open><summary>16 rituais pendentes · ver localização</summary>
          <div class="refs-sah-grid">${Object.entries(SAH_REF.rituais).map(([nome,info])=>`<div class="ref-sah"><strong>${esc(nome)}</strong><small>${esc(info.documento)} · PDF páginas ${info.pdf_paginas.join(', ')}</small></div>`).join('')}</div>
        </details>
        <details><summary>${Object.keys(SAH_REF.habilidades).length} possíveis localizações de poderes e habilidades</summary>
          <p class="apagado">As ocorrências devem ser conferidas: o nome pode aparecer em uma lista, tabela ou exemplo sem conter a descrição completa.</p>
          <div class="refs-sah-grid">${Object.entries(SAH_REF.habilidades).map(([nome,info])=>`<div class="ref-sah"><strong>${esc(nome)}</strong><small>PDF páginas ${info.pdf_paginas.join(', ')}</small></div>`).join('')}</div>
        </details>
      ` : '<p class="apagado">Índice de referências não carregado.</p>'}
    </section>
    <p class="apagado">É necessário ter direito de redistribuição antes de publicar o texto integral dos suplementos em uma página pública.</p>
  </div>`;
}
function sobre() {
  return `<div class="pagina"><section class="painel"><h1 class="faixa">Sobre</h1>
    <p><b>${NOME_DO_SITE}</b> v${VERSAO} é uma ferramenta de fãs para jogar <i>Ordem Paranormal RPG</i>. Não é um produto oficial.</p>
    <p>Projeto pessoal de <b>Thiago Silva</b>, feito para uso próprio e para aprender programação.</p>
    <p>As descrições de rituais e habilidades localizadas nos arquivos enviados foram transcritas para consulta pessoal. Os itens não localizados estão indicados como pendentes. Verifique o livro oficial para confirmar diagramação, tabelas e regras adicionais. A publicação pública de textos integrais pode exigir autorização dos titulares.</p>
    <h3 class="titulo-vermelho">Imagens</h3><p>Você pode colocar imagens suas na pasta <span class="dossie-txt">assets/imagens/</span> do site (veja o LEIA-ME de lá): <span class="dossie-txt">capa.jpg</span>, <span class="dossie-txt">classe-combatente.jpg</span>, <span class="dossie-txt">origem-academico.jpg</span> etc. Se o arquivo existir, ele aparece; se não, o espaço some.</p>
    <h3 class="titulo-vermelho">Dados 3D</h3><label class="check"><input type="checkbox" data-acao-check="animacoes" ${animacoesLigadas() ? 'checked' : ''}> <span>Mostrar a animação dos dados 3D</span></label>
    <h3 class="titulo-vermelho">Elementos</h3><p>${[['sangue', '#c8141f', 'Sangue'], ['morte', '#8d8d8d', 'Morte'], ['conhecimento', '#d9a521', 'Conhecimento'], ['energia', '#a64dff', 'Energia'], ['medo', '#f2efe8', 'Medo']].map(([id, cor, n]) => `<span class="etiqueta" style="border-color:${cor}">${sigilo(id, cor)} ${n}</span>`).join(' ')}</p>
    <p class="apagado" style="font-size:.88rem">Os sigilos, o círculo ritual e as pinceladas deste site são desenhos originais, não os símbolos oficiais.</p></section></div>`;
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
  else if (r.tela === 'acervo') corpo = acervo();
  else if (r.tela === 'sobre') corpo = sobre();
  else corpo = inicio();
  htmlMantendoFoco(app, `${topo()}<main id="conteudo">${corpo}</main><footer class="rodape">${NOME_DO_SITE} v${VERSAO} · projeto pessoal de Thiago Silva · ferramenta de fãs para Ordem Paranormal RPG · salvo só neste navegador</footer>${bandeja()}`);
}
quandoMudar(() => { if (estado.historicoAberto) render(); });

// ---------- Ações gerais ----------
const acoes = {
  ...acoesCriador(ctx), ...acoesFicha(ctx), ...acoesMestre(ctx),
  'fechar-modal': () => fecharModal(),
  'fechar-modal-fundo': (el, ev) => { if (ev.target === el) fecharModal(); },
  'tema': () => { estado.tema = estado.tema === 'papel' ? 'noite' : 'papel'; document.documentElement.dataset.tema = estado.tema; salvarTema(estado.tema); render(); },
  'novo-agente': (el, ev) => { ev.preventDefault(); estado.criador = novoRascunho(); if (location.hash === '#/novo') render(); else location.hash = '#/novo'; },
  'abrir-livro-digital': el => abrirLivroDigital(el.dataset.livro),
  'pagina-livro': el => { paginaDigital = Number(el.dataset.pagina)||1; render(); document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}); },
  'ir-pagina-livro': () => { const n=Number(document.getElementById('biblioteca-ir-pagina')?.value); if(!livroDigital || !Number.isInteger(n) || n<1 || n>livroDigital.paginas.length) return; paginaDigital=n;render();document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}); },
  'buscar-livro-digital': () => { buscaLivroDigital=document.getElementById('biblioteca-buscar')?.value||''; render(); document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}); },
  'historico': () => { estado.historicoAberto = !estado.historicoAberto; render(); },
  'limpar-historico': () => limparHistorico(),
  'rolar-dano-ultimo': el => { const u = ultimaRolagem(); if (!u) return; fecharModal(); rolarDanoUI({ titulo: u.tituloDano || u.titulo.replace(/^Ataque/, 'Dano'), quem: u.quem, formula: u.formulaDano, multiplicador: el.dataset.crit === '1' ? u.mult : 1, rotulo: u.rotuloDano || '' }); },
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
document.addEventListener('input', ev => { if(ev.target.matches('[data-acervo-busca]')){
  const q=ev.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  document.querySelectorAll('[data-acervo-pagina]').forEach(el=>{const txt=el.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');el.hidden=!!q&&!txt.includes(q)});
  document.querySelectorAll('[data-acervo-volume]').forEach(el=>{el.hidden=!!q && !el.querySelector('[data-acervo-pagina]:not([hidden])')}); return;
 } aoEditar(ev, false); });
document.addEventListener('change', ev => aoEditar(ev, true));
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && $('#modal-raiz').firstChild) fecharModal(); });

// ---------- Início ----------
estado.rota = lerRota();
if (estado.rota.tela === 'novo') estado.criador = novoRascunho();
if (estado.rota.tela === 'acervo' && estado.rota.livro === 'sah') abrirLivroDigital('sah',estado.rota.pagina);
render();
Promise.all([carregarTextos(),carregarSuplementos(),carregarReferenciasSAH()]).then(render);
try { navigator.storage?.persist?.(); } catch {}
