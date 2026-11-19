import { registrarMaldições } from './amaldicoados.js?v=0.41';
import { LIVROS_DIGITALIZADOS, NOME_DO_SITE, MODOS, CLASSES, ORIGEM } from './catalogo.js?v=0.41';
import { aplicarContaminacao } from './contaminacao.js?v=0.41';
import { ELEMENTOS_VISUAIS, aplicarElemento, aplicarAnimacoes, sistemaReduzMovimento, $, esc, avisar, htmlMantendoFoco, definir, inteiro, numero, baixarArquivo, escolherArquivo, imagemOpcional, sigilo } from './util.js?v=0.41';
import { normalizar, derivar } from './regras.js?v=0.41';
import { carregarFichas, salvarFichas, carregarElemento, salvarElemento, carregarAnimacoes, salvarAnimacoes, espacoUsado } from './armazenamento.js?v=0.41';
import { telaCriador, novoRascunho, acoesCriador, campoCriador, problemasDoPasso } from './criador.js?v=0.41';
import { telaFicha, acoesFicha, checksFicha, carregarTextos } from './fichaUI.js?v=0.41';
import { telaMestre, acoesMestre, campoMestre, htmlFeed } from './mestre.js?v=0.41';
import { mesa, quandoMesaMudar, quandoMostrar, quandoComando, quandoPedirFicha, enviarFicha, resumoFicha, acessoDoMestre, rolagemNaMesa, entrarMesa, sairDaMesa, voltarSeEstavaNaMesa, normalizarCodigo, abrirMesa, codigoGuardadoDoMestre } from './mesa.js?v=0.41';
import { sofrerDano, recuperar, adicionarCondicao } from './combate.js?v=0.41';
import { definirRaizModal, abrirModal, fecharModal, htmlHistorico, ouvintesRolagem, quandoMudar, limparHistorico, proxima, ultimaRolagem, resolverEfeitoRitual, rolarDanoUI, animacoesLigadas, ligarAnimacoes, danoMedioLigado, ligarDanoMedio } from './rolagem.js?v=0.41';
// app.js — o "maestro": estado, rotas (#/…), desenhar a tela e distribuir os cliques.
// Ciclo (igual ao Arcana): estado → render() → clique em [data-acao] → muda o estado → salva → render().

export const VERSAO = '0.41';
const estado = {
  fichas: carregarFichas(),
  rota: { tela: 'inicio' },
  ui: { aba: 'agente', ritFiltro: { busca: '', elemento: '', circulo: '' } },
  criador: null,
  historicoAberto: false,
  elemento: carregarElemento(),
  animacoes: carregarAnimacoes(), // 'sistema' ou 'sempre'
};
const app = $('#app');
const raizContaminacao = $('#contaminacao-raiz');
let SUPLEMENTOS = null;
let SAH_REF = null;
let livroDigital = null;
let paginaDigital = 1;
let buscaLivroDigital = '';
async function abrirLivroDigital(id, pagina=1) {
  if (!LIVROS_DIGITALIZADOS.some(v=>v.id===id)) return;
  try {
    const resp = await fetch('dados/biblioteca/'+id+'.json?v=0.41', {cache:'no-cache'});
    if (!resp.ok) throw new Error('Não foi possível carregar esta transcrição.');
    livroDigital = await resp.json(); paginaDigital = Math.min(Math.max(1, Number(pagina)||1),livroDigital.paginas.length); buscaLivroDigital = '';
    render();
    if (location.hash.startsWith(`#/acervo/${id}/`)) {
      requestAnimationFrame(() => document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}));
    }
  } catch (e) { avisar('Falha ao abrir livro digitalizado: '+e.message,true); }
}

async function carregarSuplementos(){
  try { const r=await fetch('dados/suplementos.json?v=0.41'); if(r.ok) SUPLEMENTOS=await r.json(); } catch(e){ console.warn('Suplementos não disponíveis',e); }
}
async function carregarReferenciasSAH(){
  try {
    const r = await fetch('dados/sah_referencias.json?v=0.41', {cache:'no-cache'});
    if(r.ok) SAH_REF = await r.json();
  } catch(e){ console.warn('Índice do Sobrevivendo ao Horror não disponível', e); }
}
definirRaizModal($('#modal-raiz'));
aplicarElemento(estado.elemento);
aplicarAnimacoes(estado.animacoes);

const ctx = {
  estado, avisar,
  render: () => render(),
  fichas: () => estado.fichas,
  fichaAtual: () => estado.fichas.find(f => f.id === estado.rota.id),
  salvarFicha(f) {
    f.atualizadoEm = new Date().toISOString();
    const i = estado.fichas.findIndex(x => x.id === f.id);
    if (i >= 0) estado.fichas[i] = f;
    if (!salvarFichas(estado.fichas)) avisar('Não consegui salvar: o armazenamento do navegador está cheio. Exporte as fichas e remova retratos grandes.', true);
    if (mesa.papel === 'jogador' && f.id === mesa.fichaId) {
      const codigo = mesa.codigo;
      setTimeout(() => {
        if (mesa.papel !== 'jogador' || mesa.codigo !== codigo || mesa.fichaId !== f.id) return;
        const atual = estado.fichas.find(x => x.id === f.id);
        if (atual) enviarFicha(resumoFicha(atual, derivar(atual)));
      }, 0);
    }
  },
  adicionarFicha(f) { estado.fichas.unshift(f); salvarFichas(estado.fichas); },
  apagarFicha(id) { estado.fichas = estado.fichas.filter(f => f.id !== id); salvarFichas(estado.fichas); },
};

// ---------- Rotas ----------
function lerRota() {
  const h = location.hash.replace(/^#\/?/, '');
  const [tela, id, pagina] = h.split('/');
  if (tela === 'acervo' && LIVROS_DIGITALIZADOS.some(livro => livro.id === id)) return {tela:'acervo', livro:id, pagina:Math.max(1,Number(pagina)||1)};
  if (tela === 'agente' && id) return { tela: 'ficha', id };
  if (tela === 'mesa') return { tela: 'mesa', codigo: normalizarCodigo(decodeURIComponent(id || '')) };
  if (['agentes', 'novo', 'mestre', 'sobre', 'acervo'].includes(tela)) return { tela };
  return { tela: 'inicio' };
}
addEventListener('hashchange', () => {
  const antes = estado.rota;
  estado.rota = lerRota();
  if (estado.rota.tela === 'novo' && !estado.criador) estado.criador = novoRascunho();
  if (estado.rota.tela === 'ficha' && antes.id !== estado.rota.id) estado.ui.aba = 'agente';
  fecharModal();
  if(estado.rota.tela==='acervo' && estado.rota.livro) {
    abrirLivroDigital(estado.rota.livro, estado.rota.pagina);
  }
  render(); scrollTo(0, 0);
});

// ---------- Telas ----------
function icone(nome) {
  const paths = {inicio:'M3 10 12 3l9 7v10h-6v-6H9v6H3Z', agentes:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 8v6 M17 11h6', mestre:'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Z M8 12l3 3 5-6', acervo:'M4 3h7v18H4Z M14 4l5-1 4 17-5 1Z M4 7h7 M4 17h7', sobre:'M12 8h.01 M12 11v6 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', tema:'M12 3a9 9 0 1 0 9 9c-5 2-11-4-9-9Z'};
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[nome] || paths.inicio}"/></svg>`;
}
function topo() {
  const r = estado.rota.tela;
  const link = (href, nome, id, ativo, num) => `<a href="${href}" ${ativo ? 'aria-current="page"' : ''}>${icone(id)}<span>${nome}</span><small>${num}</small></a>`;
  return `<a class="pular-conteudo" href="#conteudo" onclick="event.preventDefault();document.getElementById('conteudo').focus()">Pular para o conteúdo</a>
  <header class="topo"><a class="marca" href="#/"><img src="assets/favicon.svg" alt=""><span>Ficha <b>Oculta</b><small>ORDEM PARANORMAL · RPG</small></span></a>
  <div class="nav-legenda">CENTRAL DE INVESTIGAÇÃO</div>
  <nav aria-label="Navegação principal">${link('#/', 'Início', 'inicio', r === 'inicio','00')}${link('#/agentes', 'Agentes', 'agentes', ['agentes', 'ficha', 'novo'].includes(r),'01')}${link('#/mestre', 'Mestre', 'mestre', r === 'mestre','02')}${link('#/acervo', 'Suplementos', 'acervo', r === 'acervo','03')}${link('#/sobre', 'Sobre', 'sobre', r === 'sobre','04')}</nav>
  <div class="nav-base"><div class="nav-sigilo" aria-hidden="true"></div><p>O paranormal não vem<br>para a nossa realidade<br><em>por vontade própria.</em></p><label class="escolha-elemento"><span>ELEMENTO DA INTERFACE</span><select data-elemento-visual aria-label="Elemento da interface">${ELEMENTOS_VISUAIS.map(e => `<option value="${e.id}" ${estado.elemento === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select><small>ESTILO VISUAL · SEM ALTERAR REGRAS</small></label>${botaoAnimacoes()}<span class="nav-local">● ARQUIVO LOCAL · v${VERSAO}</span></div></header>`;
}
function inicio() {
  return `<div class="pagina pagina-inicio"><section class="hero-arquivo" aria-labelledby="hero-titulo">
    <div class="hero-texto"><div class="sobretitulo"><span class="ponto-sinal"></span> SISTEMA DE REGISTRO PARANORMAL</div>
    <h1 id="hero-titulo">Toda investigação<br>deixa <em>marcas.</em></h1>
    <p>Algumas ficam nos arquivos.<br>Outras ficam em você.</p><p class="hero-descricao">Crie seu agente, reúna o que sabe e prepare sua próxima sessão de Ordem Paranormal RPG.</p>
    <div class="hero-acoes"><a class="btn sangue" href="#/novo" data-acao="novo-agente">+ Criar meu agente <span aria-hidden="true">↗</span></a><a class="btn" href="#/agentes">Abrir meus arquivos</a></div>
    <div class="hero-nota"><span>SEM CONTA</span><i></i><span>SALVO NO NAVEGADOR</span><i></i><span>FEITO POR FÃS</span></div></div>
    <div class="hero-arte" aria-hidden="true"><div class="orbita-ritual"></div><div class="membrana"></div><div class="olho-vazio"><i></i></div>
    <div class="documento-hero"><div class="doc-linha"><span>DIVISÃO DE INVESTIGAÇÃO</span><b>OP / 001</b></div><div class="doc-corpo"><img src="assets/favicon.svg" alt=""><div><span>REGISTRO DE AGENTE</span><strong>IDENTIDADE<br>CONFIDENCIAL</strong></div></div><div class="doc-campos"><span>NOME / <b>████████████</b></span><span>STATUS / <b>EM INVESTIGAÇÃO</b></span><span>EXPOSIÇÃO / <b>DESCONHECIDA</b></span></div><div class="doc-base"><span class="selo">ACESSO RESTRITO</span><span class="codigo-barras"></span></div></div><span class="arte-legenda">FIG. 01 — A MEMBRANA É MAIS FINA AQUI.</span></div>
    </section>
    <div class="separador-arquivo"><span>ESCOLHA SEU PRÓXIMO PASSO</span><span>ÍNDICE DE ARQUIVOS / 01—03</span></div>
    <div class="portas"><a class="porta" href="#/agentes"><div class="porta-topo">${icone('agentes')}<span class="num">01 / AGENTES</span><span class="seta">↗</span></div><h2>Área do Jogador</h2><p>Seu agente, suas escolhas e as marcas de cada missão. Atributos, perícias, poderes, rituais e inventário.</p><span class="porta-rodape">ABRIR DOSSIÊS <b>→</b></span></a>
    <a class="porta" href="#/mestre"><div class="porta-topo">${icone('mestre')}<span class="num">02 / OPERAÇÕES</span><span class="seta">↗</span></div><h2>Área do Mestre</h2><p>Prepare as ameaças. Organize o combate, acompanhe a iniciativa e guarde suas anotações.</p><span class="porta-rodape">ASSUMIR A OPERAÇÃO <b>→</b></span></a>
    <a class="porta" href="#/acervo"><div class="porta-topo">${icone('acervo')}<span class="num">03 / CONHECIMENTO</span><span class="seta">↗</span></div><h2>Acervo de suplementos</h2><p>Consulte as transcrições, referências e materiais dos seus livros em um só arquivo.</p><span class="porta-rodape">CONSULTAR O ACERVO <b>→</b></span></a></div>
    <section class="faixa-operacao"><div><span class="sobretitulo">DOIS CAMINHOS. O MESMO MEDO.</span><h2>Como você vai enfrentar o horror?</h2><p>Regras Padrão e Sobrevivendo ao Horror disponíveis na criação do agente.</p></div><a class="btn" href="#/novo" data-acao="novo-agente">Escolher minhas regras →</a></section>
    <div class="nota-tabuleiro"><span>EM DESENVOLVIMENTO</span><b>Tabuleiro e Mesa</b><p>Mapa ao vivo e mesa online, previstos para as próximas versões.</p></div></div>`;
}
function barraContexto() {
  const r = estado.rota.tela;
  const nomes = {inicio:'Visão geral',agentes:'Dossiês de agentes',novo:'Recrutamento',ficha:'Arquivo de agente',mestre:'Controle de operações',acervo:'Acervo de suplementos',sobre:'Sobre o projeto'};
  return `<div class="barra-contexto"><span>ARQUIVO OCULTO <b>/</b> ${nomes[r] || 'Visão geral'}</span><span class="contexto-status"><i></i>${ELEMENTOS_VISUAIS.find(e => e.id === estado.elemento).nome.toUpperCase()} · MEMBRANA INSTÁVEL</span></div>`;
}
// ---------- Mesa online: entrar com o código, painel do jogador ----------
function telaEntrarMesa(codigo) {
  const fs = estado.fichas;
  return `<div class="pagina"><section class="painel"><h1 class="faixa sangue">Entrar na mesa</h1>
    ${codigo ? `<div class="codigo-mesa"><span>Código</span><b>${esc(codigo)}</b></div>` : `<p class="aviso-ocr">Código inválido. Peça ao mestre o código no formato OCULTA-XXXX.</p>`}
    ${mesa.erro ? `<p class="aviso-ocr">${esc(mesa.erro)}</p>` : ''}
    ${codigo ? (fs.length ? `<p>Escolha a ficha que vai usar na mesa. O mestre verá PV, ${'PE/PD'}, Sanidade, Defesa e condições dela, do agente. Você pode liberar edição de recursos e condições no painel Mesa.</p>
      <div class="cartoes">${fs.map(f => { const d = derivar(f); return `<button class="cartao" data-acao="mesa-entrar" data-id="${esc(f.id)}" data-codigo="${esc(codigo)}"><b>${esc(f.nome || 'Sem nome')}</b><small>${esc(CLASSES[f.classe]?.nome || '')} · NEX ${d.nexAtual ?? f.nex}% · PV ${d.atual.pv}/${d.pv}</small></button>`; }).join('')}</div>`
      : '<p class="vazio">Você ainda não tem fichas neste navegador. Crie uma em Agentes e volte por este link.</p><a class="btn sangue" href="#/novo" data-acao="novo-agente">+ Novo agente</a>') : ''}
  </section></div>`;
}
function painelMesa() {
  if (!mesa.papel || !estado.mesaAberta) return '';
  const ini = mesa.iniciativa;
  const status = { aberta: '● mesa aberta', conectada: '● conectado', conectando: 'conectando…', reconectando: 'reconectando…', 'esperando o mestre': 'esperando o mestre abrir a mesa…', abrindo: 'abrindo…', erro: 'erro' }[mesa.status] || mesa.status;
  const ficha = mesa.papel === 'jogador' ? estado.fichas.find(f => f.id === mesa.fichaId) : null;
  return `<aside class="painel-mesa" aria-label="Mesa online"><div class="titulo-secao"><h3 style="margin:0">Mesa ${esc(mesa.codigo)}</h3><button class="icone-btn" data-acao="mesa-painel" aria-label="Fechar">✕</button></div>
    <p class="apagado" style="font-size:.85rem;margin:2px 0 8px">${esc(status)}${ficha ? ` · jogando com <b>${esc(ficha.nome || 'Agente')}</b>` : mesa.papel === 'mestre' ? ' · você é o mestre' : ''}</p>
    ${mesa.erro ? `<p class="aviso-ocr">${esc(mesa.erro)}</p>` : ''}
    ${ficha ? `<label class="campo" style="margin-bottom:8px"><span>Acesso do mestre nesta mesa</span><select data-mesa-permissao aria-label="Acesso do mestre nesta mesa">
      <option value="consulta" ${acessoDoMestre(ficha, mesa.codigo) === 'consulta' ? 'selected' : ''}>Consultar resumo e rolagens</option>
      <option value="editar" ${acessoDoMestre(ficha, mesa.codigo) === 'editar' ? 'selected' : ''}>Editar recursos e condições</option>
    </select></label>` : ''}
    <h4 class="titulo-vermelho" style="margin:6px 0 2px">${ini?.encontro ? `⚔ ${esc(ini.encontro)} · ` : ''}Iniciativa${ini ? ` · rodada ${ini.rodada}` : ''}</h4>
    ${ini?.ordem?.length ? `<ol class="ini-mesa">${ini.ordem.map((p, i) => `<li class="${ini.ativo && i === ini.vez ? 'vez' : ''}">${esc(p.nome)}${p.tipo === 'ameaca' ? ' <small class="apagado">ameaça</small>' : ''}</li>`).join('')}</ol>` : '<p class="apagado">Sem combate agora.</p>'}
    ${mesa.mostrados?.length ? `<h4 class="titulo-vermelho" style="margin:6px 0 2px">O mestre mostrou</h4>${mesa.mostrados.map((x, i) => i === 0
      ? `<div class="mostrado">${x.imagem ? `<img src="${esc(x.imagem)}" alt="${esc(x.nome)}">` : ''}<b>${esc(x.nome)}</b>${x.descricao ? `<p>${esc(x.descricao)}</p>` : ''}</div>`
      : `<details class="mostrado-antigo"><summary>${esc(x.nome)}</summary>${x.imagem ? `<img src="${esc(x.imagem)}" alt="${esc(x.nome)}">` : ''}${x.descricao ? `<p>${esc(x.descricao)}</p>` : ''}</details>`).join('')}` : ''}
    <h4 class="titulo-vermelho" style="margin:6px 0 2px">Feed da mesa</h4>${htmlFeed(mesa.feed, { mestre: mesa.papel === 'mestre' })}
    <div class="linha fim" style="margin-top:8px">${mesa.papel === 'jogador' ? '<button class="btn pequeno perigo" data-acao="mesa-sair">Sair da mesa</button>' : '<a class="btn pequeno" href="#/mestre">Abrir a Área do Mestre</a>'}</div></aside>`;
}
// Comandos que o mestre manda para a ficha deste jogador
function aplicarComandoDoMestre(cmd) {
  const f = estado.fichas.find(x => x.id === mesa.fichaId);
  if (mesa.papel !== 'jogador' || mesa.status !== 'conectada' || !f || (cmd.fichaId && cmd.fichaId !== f.id) || acessoDoMestre(f, mesa.codigo) !== 'editar') return;
  const d = derivar(f), v = inteiro(cmd.valor, 0, 99999, 0);
  let msg = '';
  if (cmd.acao === 'dano' && v) { const r = sofrerDano(f, d, v, { tipo: cmd.tipo === 'mental' ? 'mental' : 'pv', rd: cmd.tipo === 'mental' ? d.rdMental : d.rd }); msg = `${r?.total ?? v} de dano${cmd.tipo === 'mental' ? ' mental' : ''}`; }
  else if (cmd.acao === 'cura' && v) { recuperar(f, d, ['pv', 'pe', 'san', 'pd'].includes(cmd.recurso) ? cmd.recurso : 'pv', v); msg = `+${v} ${String(cmd.recurso || 'pv').toUpperCase()}`; }
  else if (cmd.acao === 'recursos' && cmd.recursos && typeof cmd.recursos === 'object') {
    const campos = d.pd ? ['pv', 'pd'] : ['pv', 'pe', 'san'];
    const alterados = campos.filter(k => Number.isInteger(cmd.recursos[k]));
    if (!alterados.length) return;
    for (const k of alterados) f.recursos[k] = inteiro(cmd.recursos[k], -999, 9999, d.atual[k]);
    msg = alterados.map(k => `${k.toUpperCase()} = ${f.recursos[k]}`).join(' · ');
  }
  else if (cmd.acao === 'condicoes' && Array.isArray(cmd.lista)) { f.condicoes = []; for (const c of cmd.lista.slice(0, 40)) if (typeof c === 'string') adicionarCondicao(f, c); msg = cmd.lista.length ? 'condições atualizadas' : 'condições removidas'; }
  else return;
  ctx.salvarFicha(normalizar(f)); Object.assign(f, normalizar(f)); render();
  avisar(`O mestre aplicou: ${msg}.`);
}

function listaAgentes() {
  const fs = estado.fichas;
  return `<div class="pagina"><section class="painel entrar-mesa"><div class="linha"><b>Mesa online</b><input id="mesa-codigo" placeholder="Código do mestre (OCULTA-XXXX)" aria-label="Código da mesa" style="max-width:260px"><button class="btn pequeno sangue" data-acao="mesa-ir">Entrar na mesa</button>${mesa.papel === 'jogador' ? `<span class="etiqueta">na mesa ${esc(mesa.codigo)}</span>` : ''}</div></section>
  <div class="titulo-secao"><h1 class="faixa">Agentes</h1>
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
    <h3 class="titulo-vermelho">Dano médio</h3><label class="check"><input type="checkbox" data-acao-check="dano-medio" ${danoMedioLigado() ? 'checked' : ''}> <span>Usar o dano médio em vez de rolar (dano, cura e efeitos). Os testes de d20 continuam rolando.</span></label>
    <h3 class="titulo-vermelho">Elementos</h3><p>${[['sangue', '#c8141f', 'Sangue'], ['morte', '#8d8d8d', 'Morte'], ['conhecimento', '#d9a521', 'Conhecimento'], ['energia', '#a64dff', 'Energia'], ['medo', '#f2efe8', 'Medo']].map(([id, cor, n]) => `<span class="etiqueta" style="border-color:${cor}">${sigilo(id, cor)} ${n}</span>`).join(' ')}</p>
    <p class="apagado" style="font-size:.88rem">Os sigilos, o círculo ritual e as pinceladas deste site são desenhos originais, não os símbolos oficiais.</p></section></div>`;
}
function bandeja() {
  const naFicha = estado.rota?.tela === 'ficha' && ctx.fichaAtual();
  return `${painelMesa()}<div class="bandeja">${mesa.papel ? `<button class="btn${mesa.status === 'aberta' || mesa.status === 'conectada' ? ' mesa-on' : ''}" data-acao="mesa-painel" aria-expanded="${!!estado.mesaAberta}">🌐 Mesa</button>` : naFicha ? '<button class="btn" data-acao="mesa-online-ficha">🌐 Entrar online</button>' : ''}${naFicha ? '<button class="btn" data-acao="janela-macros">⚡ Macros</button>' : ''}<button class="btn" data-acao="historico" aria-expanded="${estado.historicoAberto}">🎲 Rolagens</button></div>
  ${estado.historicoAberto ? `<aside class="historico" aria-label="Histórico de rolagens"><div class="titulo-secao"><h3 style="margin:0">Próxima rolagem</h3><button class="icone-btn" data-acao="historico" aria-label="Fechar">✕</button></div>
    <div class="grade c3" style="grid-template-columns:repeat(3,1fr);gap:6px"><label class="campo"><span>d20 a mais ±</span><input type="number" id="prox-dados" data-prox="dados" value="${proxima.dados}" min="-5" max="5"></label><label class="campo"><span>Bônus</span><input type="number" id="prox-bonus" data-prox="bonus" value="${proxima.bonus}"></label><label class="campo"><span>DT</span><input type="number" id="prox-dt" data-prox="dt" value="${esc(proxima.dt)}" placeholder="—"></label></div>
    <p class="apagado" style="font-size:.8rem;margin:4px 0 8px">Dados e bônus valem só para a próxima rolagem (ex.: Ataque Especial +5, ajuda de aliado +1d20). A DT fica até você apagar.</p>
    <div class="titulo-secao"><h3 style="margin:0">Histórico</h3><button class="btn pequeno fantasma" data-acao="limpar-historico">Limpar</button></div>${htmlHistorico()}</aside>` : ''}`;
}

function render() {
  const r = estado.rota;
  let corpo;
  if (r.tela === 'agentes') corpo = listaAgentes();
  else if (r.tela === 'novo') corpo = telaCriador(estado.criador || (estado.criador = novoRascunho()));
  else if (r.tela === 'ficha') { const f = ctx.fichaAtual(); corpo = f ? telaFicha(f, estado.ui) : `<div class="pagina"><p class="vazio">Agente não encontrado neste navegador. <a href="#/agentes">Voltar</a></p></div>`; }
  else if (r.tela === 'mestre') corpo = telaMestre(estado.fichas);
  else if (r.tela === 'mesa') corpo = telaEntrarMesa(r.codigo);
  else if (r.tela === 'acervo') corpo = acervo();
  else if (r.tela === 'sobre') corpo = sobre();
  else corpo = inicio();
  const fichaVisual = r.tela === 'ficha' ? ctx.fichaAtual() : null;
  aplicarContaminacao(fichaVisual, estado.elemento, raizContaminacao);
  htmlMantendoFoco(app, `${topo()}<div class="area-trabalho">${barraContexto()}<main id="conteudo" tabindex="-1">${corpo}</main><footer class="rodape">${NOME_DO_SITE} v${VERSAO} · projeto pessoal de Thiago Silva · ferramenta de fãs para Ordem Paranormal RPG · salvo só neste navegador</footer>${bandeja()}</div>`);
}
quandoMudar(() => { if (estado.historicoAberto) render(); });

// ---------- Ações gerais ----------
// Botão do menu: animações automáticas (seguem o "reduzir movimento" do sistema) ou sempre ligadas
function botaoAnimacoes() {
  const dadosLigados = animacoesLigadas();
  const sempre = estado.animacoes === 'sempre' && dadosLigados;
  const parado = estado.animacoes !== 'sempre' && sistemaReduzMovimento();
  const texto = sempre ? '✦ Animações: ligadas' : !dadosLigados ? '◌ Ativar animações' : '✦ Animações: automáticas';
  const titulo = sempre ? 'Interface e dados 3D ligados. Clique para seguir a preferência de movimento do sistema.'
    : `${parado ? 'O sistema está reduzindo o movimento. ' : ''}Clique para ativar as animações da interface e os dados 3D.`;
  return `<button class="btn pequeno botao-animacoes${sempre ? ' ligado' : ''}" data-acao="alternar-animacoes" aria-pressed="${sempre}" title="${titulo}">${texto}</button>`;
}
const acoes = {
  'mesa-painel': () => { estado.mesaAberta = !estado.mesaAberta; render(); },
  // Na ficha: entra na mesa do mestre com esta ficha, só digitando o código
  'mesa-online-ficha': () => { const f = ctx.fichaAtual(); if (!f) return;
    abrirModal('Entrar na mesa online', `<p style="margin-top:0">Peça ao mestre o código da mesa. Você entra com a ficha <b>${esc(f.nome || 'Agente')}</b>: o mestre vê PV, ${'PE/PD'}, Sanidade, Defesa e condições, e as suas rolagens vão para o feed da mesa.</p>
      <label class="campo"><span>Código da mesa</span><input id="mesa-codigo-ficha" placeholder="OCULTA-XXXX" autofocus autocomplete="off"></label>`,
      `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="mesa-online-ficha-ok" data-id="${esc(f.id)}">🌐 Entrar</button>`); },
  'mesa-online-ficha-ok': async el => { const c = normalizarCodigo(document.getElementById('mesa-codigo-ficha')?.value); if (!c) return avisar('Código inválido. Use o formato OCULTA-XXXX.', true);
    fecharModal(); await entrarMesa(c, el.dataset.id); estado.mesaAberta = true; render(); },
  'mesa-ir': () => { const c = normalizarCodigo(document.getElementById('mesa-codigo')?.value); if (!c) return avisar('Código inválido. Use o formato OCULTA-XXXX.', true); location.hash = `#/mesa/${c}`; },
  'mesa-entrar': async el => { await entrarMesa(el.dataset.codigo, el.dataset.id); estado.mesaAberta = true; location.hash = `#/agente/${el.dataset.id}`; },
  'mesa-sair': () => { if (!confirm('Sair da mesa online?')) return; sairDaMesa(); estado.mesaAberta = false; render(); },
  'alternar-animacoes': () => {
    estado.animacoes = estado.animacoes === 'sempre' && animacoesLigadas() ? 'sistema' : 'sempre';
    salvarAnimacoes(estado.animacoes);
    aplicarAnimacoes(estado.animacoes);
    ligarAnimacoes(estado.animacoes === 'sempre' ? true : null);
    render();
    avisar(estado.animacoes === 'sempre' ? 'Animações sempre ligadas.' : sistemaReduzMovimento() ? 'Animações seguindo o sistema: ele pede menos movimento, então ficam paradas.' : 'Animações seguindo o sistema.');
  },
  ...acoesCriador(ctx), ...acoesFicha(ctx), ...acoesMestre(ctx),
  'fechar-modal': () => fecharModal(),
  'fechar-modal-fundo': (el, ev) => { if (ev.target === el) fecharModal(); },
  'novo-agente': (el, ev) => { ev.preventDefault(); estado.criador = novoRascunho(); if (location.hash === '#/novo') render(); else location.hash = '#/novo'; },
  'abrir-livro-digital': el => abrirLivroDigital(el.dataset.livro),
  'pagina-livro': el => { paginaDigital = Number(el.dataset.pagina)||1; render(); document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}); },
  'ir-pagina-livro': () => { const n=Number(document.getElementById('biblioteca-ir-pagina')?.value); if(!livroDigital || !Number.isInteger(n) || n<1 || n>livroDigital.paginas.length) return; paginaDigital=n;render();document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}); },
  'buscar-livro-digital': () => { buscaLivroDigital=document.getElementById('biblioteca-buscar')?.value||''; render(); document.getElementById('leitor-privado')?.scrollIntoView({block:'start'}); },
  'historico': () => { estado.historicoAberto = !estado.historicoAberto; render(); },
  'limpar-historico': () => limparHistorico(),
  'resolver-efeito-ritual': el => resolverEfeitoRitual(el.dataset.token),
  'rolar-dano-ultimo': el => { const u = ultimaRolagem(); if (!u) return; fecharModal(); rolarDanoUI({ titulo: u.tituloDano || u.titulo.replace(/^Ataque/, 'Dano'), quem: u.quem, formula: u.formulaDano, gruposCritico: u.gruposCritico, multiplicador: el.dataset.crit === '1' ? u.mult : 1, adicional: el.dataset.crit === '1' ? (u.criticoExtra || '') : '', rotulo: u.rotuloDano || '' }); },
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
const checks = { ...checksFicha(ctx), 'dano-medio': el => { ligarDanoMedio(el.checked); render(); avisar(el.checked ? 'Dano médio ligado: dano e cura usam a média.' : 'Dano médio desligado: os dados voltam a ser rolados.'); }, 'animacoes': el => { ligarAnimacoes(el.checked); render(); avisar(el.checked ? 'Animação ligada.' : 'Animação desligada.'); } };

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
  if ('elementoVisual' in el.dataset) {
    if (final && ELEMENTOS_VISUAIS.some(e => e.id === el.value)) {
      estado.elemento = el.value; salvarElemento(el.value); aplicarElemento(el.value); render();
    }
    return;
  }
  if (el.dataset.acaoCheck) { if (final) checks[el.dataset.acaoCheck]?.(el, ev); return; }
  if (el.dataset.limiteItem != null) { // limites de itens por categoria (editados à mão)
    if (!final) return; const f = ctx.fichaAtual(); if (!f) return; const d = derivar(f);
    const lim = [...(f.limitesItens || d.patente.itens)]; lim[Number(el.dataset.limiteItem)] = inteiro(el.value, 0, 20, 0);
    f.limitesItens = lim; ctx.salvarFicha(normalizar(f)); Object.assign(f, normalizar(f)); render(); return;
  }
  if (el.dataset.prox) { proxima[el.dataset.prox] = el.dataset.prox === 'dt' ? el.value : inteiro(el.value, -50, 50, 0); return; }
  if (el.dataset.ritFiltro) { estado.ui.ritFiltro[el.dataset.ritFiltro] = el.value; if (final || el.type === 'search') render(); return; }
  if ('mesaPermissao' in el.dataset) {
    if (!final || mesa.papel !== 'jogador' || !['consulta', 'editar'].includes(el.value)) return;
    const ficha = estado.fichas.find(f => f.id === mesa.fichaId);
    if (!ficha) return;
    ficha.permissoesMesa ||= {};
    ficha.permissoesMesa[mesa.codigo] = el.value;
    ctx.salvarFicha(normalizar(ficha));
    render();
    return;
  }
  if (el.dataset.filtroItens) {
    const valor = campo => document.querySelector(`.modal [data-filtro-itens="${campo}"]`)?.value || '';
    const busca = valor('busca').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const fonte = valor('fonte'), grupo = valor('grupo');
    let encontrados = 0;
    document.querySelectorAll('.modal [data-fonte][data-grupo][data-busca]').forEach(cartao => {
      cartao.hidden = (fonte && cartao.dataset.fonte !== fonte) || (grupo && cartao.dataset.grupo !== grupo) || !cartao.dataset.busca.includes(busca);
      if (!cartao.hidden) encontrados++;
    });
    document.getElementById('catalogo-itens-vazio').hidden = encontrados > 0;
    return;
  }
  if ('filtroModal' in el.dataset) { const q = el.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); document.querySelectorAll('.modal [data-busca]').forEach(b => { b.hidden = q && !b.dataset.busca.includes(q); }); return; }
  const m = campoMestre(el, ctx, final);
  if (m) { if (final && m === 'cheio') render(); return; }
  const c = campoCriador(ctx, el, final);
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
  if (final && /^(itens\.\d+\.(ativo|qtd)|protecoes\.\d+\.vestida)$/.test(el.dataset.campo)) registrarMaldições(f);
  definir(f, el.dataset.campo, v);
  if (final && /^(itens\.\d+\.ativo|protecoes\.\d+\.vestida)$/.test(el.dataset.campo) && v) registrarMaldições(f);
  const precisa = final || el.tagName === 'SELECT' || tipo === 'bool';
  if (precisa) { const n = normalizar(f); Object.assign(f, n); }
  ctx.salvarFicha(f);
  if (precisa && (el.tagName === 'SELECT' || tipo || el.type === 'checkbox' || el.dataset.campo === 'idade')) render();
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
if (estado.rota.tela === 'acervo' && estado.rota.livro) abrirLivroDigital(estado.rota.livro, estado.rota.pagina);
// ---------- Mesa online ----------
ouvintesRolagem.push(rolagemNaMesa);
quandoMesaMudar(() => render());
quandoPedirFicha(() => { const f = estado.fichas.find(x => x.id === mesa.fichaId); if (f) enviarFicha(resumoFicha(f, derivar(f))); });
quandoComando(aplicarComandoDoMestre);
quandoMostrar(item => { estado.mesaAberta = true; render(); avisar(`O mestre mostrou: ${item.nome}`); });
voltarSeEstavaNaMesa();                        // jogador que recarregou volta para a mesa
if (codigoGuardadoDoMestre()) abrirMesa();     // mestre que recarregou reabre a mesa com o mesmo código
render();
Promise.all([carregarTextos(),carregarSuplementos(),carregarReferenciasSAH()]).then(render);
try { navigator.storage?.persist?.(); } catch {}
