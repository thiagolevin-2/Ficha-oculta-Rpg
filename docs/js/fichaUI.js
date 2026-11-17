import { registrarMaldições, cobrarMaldição, AMALDICOADOS, NOMES_AMALDICOADOS } from './amaldicoados.js?v=0.30.0';
import { abrirOrigem, pentagramaAtributos } from './criador.js?v=0.30.0';
import { parametrosFabricacao, perfilRitual, podeResolverRitual, problemaAoAprender, viaPoder, circuloDeAprender, faixaEtaria, temPeso, origemAtiva, PESOS_IDADE, aumentoPermitido, tetoEtario, derivar, normalizar, poderesParaFicha, cumpreRequisito, ehSobrevivente, temOpcional, usaPD, nexSeparado, opcoesGasto, periciaComAtributo, poderesDeOutrasClasses, TIPOS_EFEITO_ITEM } from './regras.js?v=0.30.0';
import { sofrerDano, recuperar, resolverCondicoesDoTurno, adicionarCondicao, iniciarTurno, encerrarTurno, fimDeCena, textoTeste, d, rolar } from './combate.js?v=0.30.0';
import { MODOS, OPCIONAIS, ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, CLASSES, ORIGEM, TRILHAS, TRILHA, PODER, ELEMENTOS, CIRCULOS, ARMAS, PROTECOES, ITENS_GERAIS, ITENS_CATALOGO, ITEM_INFO, CONDICOES, PATENTES, RITUAIS, TIPOS_DANO, FERIMENTOS, EXPOSICOES, PODERES_PARANORMAIS, PODER_PARANORMAL, USAVEIS, PODERES, ORIGENS, TREINAMENTO_ESPECIAL, MODIFICACOES, MODIFICACAO, MALDICOES_ARMA, CRIACAO_ATRIBUTOS, EFEITOS_INSANIDADE, EFEITOS_MEDO } from './catalogo.js?v=0.30.0';
import { MOD_ACESSORIOS, moverPacoteParaReserva, PASSIVOS_ITENS } from './equipamentos.js?v=0.30.0';
import { esc, comSinal, romano, sigilo, semAcento, inteiro, numero, uid, imagemOpcional, reduzirImagem, escolherArquivo, baixarArquivo } from './util.js?v=0.30.0';
import { rolarTesteUI, rolarDanoUI, oferecerEfeitoRitual, abrirModal, fecharModal, proxima } from './rolagem.js?v=0.30.0';
// fichaUI.js — as telas da ficha do agente e as ações delas.

// Textos transcritos dos livros fornecidos pelo usuário, para consulta pessoal. Os não localizados permanecem pendentes.
let TEXTOS = {};
let FONTES_SAH = {rituais:{},habilidades:{}};
export async function carregarTextos() {
  try { const r = await fetch('dados/textos.json?v=0.30.0', { cache: 'no-cache' }); if (r.ok) TEXTOS = await r.json(); } catch {}
  try { const r = await fetch('dados/sah_referencias_verificadas.json?v=0.30.0', {cache:'no-cache'}); if (r.ok) FONTES_SAH = await r.json(); } catch {}
  // Os textos do Sobrevivendo ao Horror foram conferidos com o PDF e estão em dados/textos.json (v0.23).
}
// Textos do Sobrevivendo ao Horror tirados do OCR (não revisados): aparecem com aviso, separados dos textos conferidos.
let OCR_SAH = { rituais: {}, habilidades: {} };
const textoOcr = (tipo, nome) => { const o = OCR_SAH?.[tipo]?.[nome]; return o && typeof o.texto === 'string' && o.texto ? o : null; };
function blocoOcr(o) {
  return `<div class="texto-completo texto-ocr">${esc(o.texto)}</div>
    <p class="aviso-ocr">Texto do OCR do <i>Sobrevivendo ao Horror</i> (PDF p. ${o.pagina}): pode ter erros de leitura e “[…]” marca trecho ilegível. Confira no livro.</p>
    <a class="fonte-sah-link" href="#/acervo/sah/${o.pagina}">Abrir a página ${o.pagina} do livro digitalizado</a>`;
}
function abrirPaginaSah(tipo,nome) {
  const pagina = FONTES_SAH?.[tipo]?.[nome]?.pagina;
  return pagina ? `<a class="fonte-sah-link" href="#/acervo/sah/${pagina}" title="Abrir transcrição digitalizada de Sobrevivendo ao Horror · página ${pagina}">Consultar fonte · Sobrevivendo ao Horror, PDF p. ${pagina}</a>` : '';
}
export const textoCompleto = (tipo, nome) => { const t = TEXTOS?.[tipo]?.[nome]; return typeof t === 'string' ? t.slice(0, 20000) : ''; };
// Ícone de d20 (desenho simples, original)
export const ICONE_D20 = '<svg class="icone-d20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8 21.6 7.2v9.6L12 22.2 2.4 16.8V7.2Z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6.3 17.6 15.8H6.4Z M12 1.8V6.3 M2.4 7.2l4 8.6 M21.6 7.2l-4 8.6 M6.4 15.8 12 22.2l5.6-6.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
export const ABAS = [['agente', 'Agente'], ['combate', 'Combate'], ['rolagens', 'Rolagens'], ['habilidades', 'Habilidades'], ['poderes', 'Poderes'], ['rituais', 'Rituais'], ['inventario', 'Inventário'], ['notas', 'Notas']];
const nomesElementos = r => (r.elementos?.length ? r.elementos : [r.elemento]).map(id => ELEM[id]?.nome || id).join(' + ');
const alvoDeFicha = (ctx, id) => ctx.fichas().find(f => f.id === id);
const opcoesAlvos = (ctx, atual) => ctx.fichas().map(f =>
  `<option value="${esc(f.id)}" ${f.id === atual.id ? 'selected' : ''}>${esc(f.nome || 'Agente')}</option>`).join('');

const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
const fonteTag = f => f === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : String(f).startsWith('AS') ? `<span class="etiqueta">${esc(f)}</span>` : '';
const cat = n => (n ? romano(n) : '0');

// ---------- Tela ----------
export function telaFicha(f, ui) {
  const d = derivar(f);
  dAtual = d;
  const aba = ui.aba || 'agente';
  const corpo = ({ agente: abaAgente, combate: abaCombate, rolagens: abaRolagens, habilidades: abaHabilidades, poderes: abaPoderes, rituais: abaRituais, inventario: abaInventario, notas: abaNotas }[aba] || abaAgente)(f, d, ui);
  return `<div class="pagina pagina-ficha">
  ${f.morto ? '<p class="etiqueta alerta" role="status">Agente morto</p>' : ''}
  <div class="ficha-identificador"><span>DOSSIÊ DE AGENTE / REGISTRO INDIVIDUAL</span><span class="selo">CONFIDENCIAL</span></div>
  ${cabecalho(f, d)}
  ${aba !== 'agente' ? avisosDeRegra(d) : ''}
  <nav class="abas" role="tablist" data-guardar-rolagem="abas">${ABAS.map(([id, nome]) => `<button role="tab" data-acao="aba" data-aba="${id}" aria-selected="${aba === id}">${nome}</button>`).join('')}</nav>
  <div class="secao-aba"><span>${String(ABAS.findIndex(([id]) => id === aba) + 1).padStart(2, '0')} / ${esc(ABAS.find(([id]) => id === aba)?.[1] || 'Agente')}</span><small>ARQUIVO PESSOAL · ALTERAÇÕES SALVAS AUTOMATICAMENTE</small></div>
  <div class="conteudo-aba">${corpo}</div></div>`;
}

function avisosDeRegra(d) {
  return d.avisos.length ? `<details class="avisos-ficha" open><summary class="ui">⚠ ${d.avisos.length} aviso(s) de regra</summary><ul>${d.avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></details>` : '';
}

function cabecalho(f, d) {
  const cls = CLASSES[f.classe];
  const origem = ORIGEM[f.origem]?.nome || (f.origem === 'propria' ? f.origemPropria.nome || 'Origem própria' : 'Sem origem');
  return `<header class="ficha-cabeca">
    <button class="retrato" data-acao="retrato" style="${f.retrato ? `background-image:url(${esc(f.retrato)})` : ''}" aria-label="Trocar retrato">${f.retrato ? '' : 'Retrato'}</button>
    <div><h1><input data-campo="nome" id="f-nome" value="${esc(f.nome)}" placeholder="Nome do agente" aria-label="Nome do agente" maxlength="80"></h1>
      <div class="sub-cabeca">
        <span class="etiqueta">${esc(cls.nome)}</span>${d.faixa ? `<span class="etiqueta">${esc(d.faixa.nome)} · ${esc(f.idade)} anos</span>` : ''}${d.trilha ? `<span class="etiqueta">${esc(d.trilha.nome)}</span>` : ''}${ORIGEM[f.origem] ? `<button class="etiqueta etiqueta-origem" data-acao="ver-origem" data-id="${esc(f.origem)}" aria-label="Ler origem ${esc(origem)}">${esc(origem)}</button>` : `<span class="etiqueta">${esc(origem)}</span>`}
        <span class="etiqueta" style="border-color:var(--sangue)">${esc(d.textoNivel)}</span>
        ${ehSobrevivente(f) ? '' : `<span class="etiqueta">${esc(d.patente.nome)}</span>`}
        <span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}">${esc(MODOS[f.modo].nome)}</span>
      </div></div>
    <div class="linha acoes-cabeca">
      <button class="btn pequeno" data-acao="subir-nivel">${ehSobrevivente(f) ? '+ Estágio' : temOpcional(f, 'patentes') ? '+ Prestígio' : temOpcional(f, 'nivelExp') ? '+ Nível' : '+ NEX'}</button>
      <button class="btn pequeno" data-acao="exportar-ficha">Exportar</button>
      <button class="btn pequeno fantasma" data-acao="imprimir">Imprimir</button>
    </div></header>`;
}

// ---------- Aba AGENTE ----------
function recurso(sigla, nome, cor, atual, max, campo, extra = '') {
  const pct = max > 0 ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0;
  return `<div class="recurso" style="--cor:${cor}">
    <div class="topo-rec"><span class="sigla">${sigla} · ${nome}</span><span class="numeros"><input type="number" data-campo="recursos.${campo}" data-tipo="recurso" id="rec-${campo}" value="${atual}" aria-label="${nome} atual"><small> / ${max}</small></span></div>
    <div class="barra" aria-hidden="true"><b style="width:${pct}%"></b></div>
    <div class="acoes-rec"><input type="number" min="0" id="qtd-${campo}" placeholder="qtd" aria-label="Quantidade de ${nome}">
      <button class="btn pequeno" data-acao="rec-mudar" data-rec="${campo}" data-sinal="-1">${campo === 'pv' ? 'Dano' : campo === 'san' ? 'Perder' : 'Gastar'}</button>
      <button class="btn pequeno" data-acao="rec-mudar" data-rec="${campo}" data-sinal="1">${campo === 'pv' ? 'Curar' : 'Recuperar'}</button>
      <button class="icone-btn" data-acao="rec-cheio" data-rec="${campo}" title="Encher" aria-label="Encher ${nome}">↺</button></div>${extra}</div>`;
}
// PE temporários (somem no Fim da cena; são gastos antes dos normais)
function caixaTemp(f, d) {
  const k = d.pd ? 'PD' : 'PE';
  return `<div class="linha" style="margin-top:8px"><span class="rotulo">${k} temporários</span><input type="number" min="0" style="width:72px;min-height:32px" data-campo="recursos.peTemp" data-tipo="int" id="rec-petemp" value="${f.recursos.peTemp}" aria-label="${k} temporários"><small class="apagado">gastos primeiro; somem no fim da cena</small></div>`;
}

function abaAgente(f, d) {
  const efeitos = painelEfeitos(f, d);
  const recursos = [recurso('PV', 'Vida', 'var(--pv)', d.atual.pv, d.pv, 'pv', d.machucado ? '<small class="etiqueta alerta" style="margin-top:6px">Machucado</small>' : '')];
  if (d.pd) recursos.push(recurso('PD', 'Determinação', 'var(--pd)', d.atual.pd, d.pdMax, 'pd', caixaTemp(f, d)));
  else { recursos.push(recurso('PE', 'Esforço', 'var(--pe)', d.atual.pe, d.pe, 'pe', caixaTemp(f, d))); recursos.push(recurso('SAN', 'Sanidade', 'var(--san)', d.atual.san, d.san, 'san')); }
  const campoNexExposicao = `<label class="campo"><span>NEX (exposição, %)</span><input type="number" min="0" max="99" data-campo="nexExposicao" data-tipo="int" id="f-nexexp" value="${f.nexExposicao}"></label>`;
  const nivelCampo = f.classe === 'mundano' ? '<p>NEX 0%</p>' : ehSobrevivente(f)
    ? `<label class="campo"><span>Estágio</span><select data-campo="estagio" data-tipo="int">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${f.estagio === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>${f.modo === 'sah' ? campoNexExposicao : ''}`
    : temOpcional(f, 'patentes') ? `<label class="campo"><span>Prestígio (PP)</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="f-pp" value="${f.pp}"></label>${campoNexExposicao}`
      : temOpcional(f, 'nivelExp') ? `<label class="campo"><span>Nível</span><select data-campo="nivel" data-tipo="int">${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${f.nivel === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>${campoNexExposicao}`
        : `<label class="campo"><span>NEX</span><select data-campo="nex" data-tipo="int">${NEX.map(n => `<option value="${n}" ${f.nex === n ? 'selected' : ''}>${n}%</option>`).join('')}</select></label>`;
  const botoesExposicao = nexSeparado(f) ? `<div class="linha" style="margin-top:8px"><span class="rotulo">Exposição ao paranormal:</span>${EXPOSICOES.map(e => `<button class="btn pequeno" data-acao="exposicao" data-nex="${e.nex}" title="${esc(e.resumo)}">${esc(e.nome)} +${e.nex}%</button>`).join('')}</div><p class="apagado" style="font-size:.85rem;margin-top:4px">O NEX aqui mede só a exposição (máximo 99%). Aprender um ritual soma o círculo dele no NEX. ${f.opcionais.progressaoNex ? 'A Progressão de NEX está na aba Habilidades.' : 'A Progressão de NEX (regra opcional) está desligada: ligue na aba Notas se quiser.'}</p>` : '';
  return `<div class="ficha-alertas">${avisosDeRegra(d)}${painelPendencias(d)}</div>
  <div class="grade c2 visao-agente">
  <section class="painel painel-roda"><div class="titulo-secao"><h2 class="faixa sangue">Atributos</h2><button class="btn pequeno fantasma" data-acao="editar-atributos">Editar</button></div>
    ${pentagramaAtributos(f.atributos, false, true)}
    <p class="apagado" style="text-align:center;font-size:.9rem">Toque num atributo para rolar. ${d.slotsAtributo ? `Aumentos de atributo liberados: ${d.slotsAtributo}.` : ''}</p>
  </section>
  <section class="painel painel-vitais"><div class="titulo-secao"><h2 class="faixa">Sinais vitais</h2><small class="apagado dossie-txt">CONTROLE DE RECURSOS</small></div><div class="recursos">${recursos.join('')}</div></section>
  </div>
  <section class="painel painel-status"><h2 class="faixa">Status operacional</h2>
    <div class="numeros-chave" style="margin-top:12px">
      <div class="chave"><b>${d.defesa}</b><span>Defesa</span></div>
      <div class="chave"><b>${d.desl}m</b><span>Desloc.</span></div>
      <div class="chave"><b>${d.limitePE}</b><span>Limite ${d.pd ? 'PD' : 'PE'}/turno</span></div>
      <div class="chave"><b>${d.rd || 0}</b><span>RD</span></div>
      ${d.bloqueio != null ? `<div class="chave"><b>${d.bloqueio}</b><span>Bloqueio (RD)</span></div>` : ''}
      ${d.esquiva != null ? `<div class="chave"><b>${d.esquivaTotal}</b><span>Esquiva</span></div>` : ''}
    </div>
    ${blocoDefesa(f, d)}
    <div class="grade c2" style="margin-top:12px">${nivelCampo}
      ${ehSobrevivente(f) || temOpcional(f, 'patentes') ? '' : `<label class="campo"><span>Patente (PP: ${f.pp})</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="f-pp2" value="${f.pp}" aria-label="Pontos de prestígio"></label>`}
    </div>${botoesExposicao}
    <div class="linha" style="margin-top:12px"><button class="btn" data-acao="rolar-iniciativa">Iniciativa ${textoTeste(d.iniciativa.dados, d.iniciativa.bonus)}</button>
      ${d.atual.pv <= 0 ? `<span class="etiqueta alerta">Morrendo ${f.recursos.morrendo}/3</span><button class="btn pequeno" data-acao="contador" data-c="morrendo">+1 turno morrendo</button>` : ''}
      ${!d.pd && d.atual.san <= 0 ? `<span class="etiqueta alerta">Enlouquecendo ${f.recursos.enlouquecendo}/3</span><button class="btn pequeno" data-acao="contador" data-c="enlouquecendo">+1 turno</button>` : ''}
    </div>
  </section>
  ${efeitos ? `<div class="ficha-acompanhamento">${efeitos}</div>` : ''}
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Perícias</h2><span class="apagado dossie-txt">Toque no dado para rolar</span></div>
    <div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Perícia</th><th>Atr.</th><th>Grau</th><th class="esconde-celular">Outros</th><th>Rolar</th></tr></thead><tbody>
    ${d.pericias.map(p => `<tr class="${p.bloqueada ? 'pericia-bloq' : ''}"><td>${esc(p.nome)}${p.id === 'profissao' && f.profissao ? ` <small>(${esc(f.profissao)})</small>` : ''}${p.treinada ? ' <small title="Só treinada">*</small>' : ''}${p.carga ? ' <small title="Penalidade de carga">+</small>' : ''}</td>
      <td class="num">${p.atrUsado.toUpperCase()}</td>
      <td><select data-campo="pericias.${p.id}" data-tipo="int" aria-label="Grau em ${esc(p.nome)}">${GRAUS.map(g => `<option value="${g.id}" ${(f.pericias[p.id] || 0) === g.id ? 'selected' : ''}>${g.nome}</option>`).join('')}</select></td>
      <td class="esconde-celular"><input type="number" style="width:64px;min-height:30px;padding:2px 6px" data-campo="bonusPericia.${p.id}" data-tipo="int" id="bp-${p.id}" value="${f.bonusPericia[p.id] || ''}" placeholder="0" aria-label="Bônus extra em ${esc(p.nome)}"></td>
      <td><button class="rolavel rolar-d20" data-acao="rolar-pericia" data-id="${p.id}" title="${p.bloqueada ? 'Só pode ser usada se treinado. ' : ''}Rolar ${esc(p.nome)}" aria-label="Rolar ${esc(p.nome)}: ${textoTeste(p.dados, p.bonus)}">${ICONE_D20}<span class="d">${textoTeste(p.dados, p.bonus)}</span></button> <button class="btn pequeno fantasma" data-acao="pericia-atributo" data-id="${p.id}" aria-label="Escolher atributo de ${esc(p.nome)}" title="Escolher atributo para esta rolagem">Atributo</button></td></tr>`).join('')}
    </tbody></table></div>
    <label class="campo" style="max-width:320px;margin-top:10px"><span>Especialização de Profissão</span><input data-campo="profissao" id="f-prof" value="${esc(f.profissao)}" placeholder="Ex.: cozinheiro, engenheiro"></label>
    <p class="apagado" style="font-size:.88rem;margin-top:8px">* só treinada · + sofre penalidade de carga${d.penalCarga ? ` (agora: −${d.penalCarga})` : ''}. Veterano a partir de NEX 35%, expert a partir de 70%.</p>
  </section>`;
}

// ---------- Aba COMBATE ----------
function abaCombate(f, d, ui = {}) {
  const sub = ui.subCombate === 'amaldicoados' ? 'amaldicoados' : 'armas';
  const qtd = f.itens.filter(it => AMALDICOADOS[it.nome]).length;
  const nav = `<div class="condicoes" role="tablist" aria-label="Seções de combate" style="margin-bottom:14px">
    <button role="tab" data-acao="sub-combate" data-sub="armas" aria-pressed="${sub === 'armas'}" aria-selected="${sub === 'armas'}">Armas e combate</button>
    <button role="tab" data-acao="sub-combate" data-sub="amaldicoados" aria-pressed="${sub === 'amaldicoados'}" aria-selected="${sub === 'amaldicoados'}">Itens amaldiçoados${qtd ? ` (${qtd})` : ''}</button></div>`;
  return nav + (sub === 'amaldicoados' ? abaAmaldicoados(f, d) : abaCombateArmas(f, d));
}
// Itens amaldiçoados e paranormais do inventário: efeito passivo (caixinha), botões de uso, testes e rolagens.
const COR_EL = { conhecimento: 'conhecimento', energia: 'energia', morte: 'morte', sangue: 'sangue', medo: 'medo', variavel: 'variavel' };
const NOME_EL = { conhecimento: 'Conhecimento', energia: 'Energia', morte: 'Morte', sangue: 'Sangue', medo: 'Medo', variavel: 'Variável' };
function descreverPassivo(p) {
  const partes = [];
  for (const [k, v] of Object.entries(p.atr || {})) partes.push(`${comSinal(v)} ${k.toUpperCase()}`);
  if (p.pv) partes.push(`${comSinal(p.pv)} PV máx.`); if (p.pe) partes.push(`${comSinal(p.pe)} PE máx.`);
  if (p.defesa) partes.push(`${comSinal(p.defesa)} Defesa`); if (p.desl) partes.push(`${comSinal(p.desl)} m desloc.`);
  if (p.carga) partes.push(`${comSinal(p.carga)} espaços de carga`); if (p.bloqueio) partes.push(`${comSinal(p.bloqueio)} no Bloqueio`); if (p.resistencia) partes.push(`${comSinal(p.resistencia)} em resistências`);
  if (p.rd) partes.push(`RD ${p.rd}`); if (p.rdMental) partes.push(`RD mental ${p.rdMental}`); if (p.dtRitual) partes.push(`${comSinal(p.dtRitual)} DT de rituais`);
  if (p.ataque) partes.push(`${comSinal(p.ataque)} ataque`); if (p.dano) partes.push(`${comSinal(p.dano)} dano`);
  for (const [k, v] of Object.entries(p.pericia || {})) partes.push(`${comSinal(v)} ${PERICIA[k]?.nome || k}`);
  for (const [k, v] of Object.entries(p.dadosPericia || {})) partes.push(`${v > 0 ? '+' : '−'}${Math.abs(v)}d20 ${PERICIA[k]?.nome || k}`);
  return partes.join(', ');
}
function custoDoUso(u, it) {
  if (u.custoPorAtaque) return `${u.custoPorAtaque} PE por ataque já feito`;
  if (u.custoPergunta) return u.custoPergunta;
  const c = (u.custo || 0) + (u.custoDia ? it.usosDia : 0);
  return c ? `${c} PE` : '';
}
function abaAmaldicoados(f, d) {
  const lista = f.itens.map((it, i) => [it, i]).filter(([it]) => AMALDICOADOS[it.nome]);
  const outros = f.itens.filter(it => !AMALDICOADOS[it.nome] && /amaldiço|paranormal/i.test(ITEM_INFO[it.nome]?.grupo || ''));
  const cartao = ([it, i]) => {
    const def = AMALDICOADOS[it.nome], el = COR_EL[def.el] || 'variavel', info = ITEM_INFO[it.nome];
    const passivo = def.passivo ? descreverPassivo(def.passivo) : '';
    const usos = (def.usos || []).map((u, k) => {
      const c = custoDoUso(u, it), dtExtra = u.teste?.porUso ? u.teste.porUso * it.usosDia : 0;
      const det = [u.acao, c, u.teste ? `${PERICIA[u.teste.pericia]?.nome} DT ${u.teste.dt + dtExtra}` : '', u.rolar ? u.rolar.f : ''].filter(Boolean).join(' · ');
      return `<button class="btn pequeno usar" data-acao="usar-amaldicoado" data-uid="${esc(it.uid)}" data-u="${k}" ${!it.qtd ? 'disabled' : ''} title="${esc(u.nota || '')}">${esc(u.nome)}${det ? ` <small>(${esc(det)})</small>` : ''}</button>`;
    }).join(' ');
    return `<div class="hab el-${el}" style="border-left-color:var(--el)">
      <span class="meta">${sigilo(el === 'medo' ? 'medo' : el, 'var(--el)')}<span class="etiqueta">${NOME_EL[def.el] || 'Variável'}</span>${it.qtd > 1 ? `<span class="etiqueta">×${it.qtd}</span>` : ''}${it.carga ? `<span class="etiqueta">carga ${it.carga}</span>` : ''}${it.usosDia ? `<span class="etiqueta">${it.usosDia} uso(s) hoje</span>` : ''}</span>
      <b>${esc(it.nome)}</b>
      <p>${esc(info?.resumo || '')}</p>
      ${def.nota ? `<p class="apagado" style="font-size:.88rem">${esc(def.nota)}</p>` : ''}
      ${def.vestir || def.passivo ? `<label class="check" style="margin-top:6px"><input type="checkbox" data-campo="itens.${i}.ativo" data-tipo="bool" ${it.ativo ? 'checked' : ''}> <span><b>${esc(def.vestir || 'Em uso')}</b>${passivo ? ` <small>— aplica ${esc(passivo)}</small>` : ''}</span></label>` : ''}
      ${it.nome === 'Dedo Decepado' ? `<button class="btn pequeno" data-acao="dias-dedo" data-uid="${esc(it.uid)}">Dias de uso: ${it.diasVestido}</button> <button class="btn pequeno" data-acao="vincular-item" data-i="${i}">Vincular poder</button>` : ''}
      ${usos ? `<div class="linha" style="margin-top:8px;flex-wrap:wrap">${usos}</div>` : ''}
      ${it.usosDia || it.carga ? `<div class="linha" style="margin-top:6px">${it.usosDia ? `<button class="btn pequeno fantasma" data-acao="zerar-usos-amaldicoado" data-uid="${esc(it.uid)}">Novo dia (zerar usos)</button>` : ''}</div>` : ''}
    </div>`;
  };
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Itens amaldiçoados</h2><button class="btn pequeno" data-acao="add-amaldicoado-lista">+ Item amaldiçoado</button></div>
    <p class="apagado" style="font-size:.88rem">Marque a caixinha quando o item estiver vestido ou empunhado: o efeito passivo entra na ficha. Os botões cobram PE, fazem os testes (a DT sobe com os usos do dia), rolam os dados e aplicam cura, dano, condições e efeitos ativos. Resistências por tipo de dano ficam na nota de cada item.</p>
    <div class="linha"><button class="btn pequeno" data-acao="preco-maldicao">Registrar falha na mesa</button>
      <button class="btn pequeno" data-acao="fim-maldicao">Rever maldições entre missões</button></div>
    ${lista.length ? `<div class="lista-hab">${lista.map(cartao).join('')}</div>` : '<p class="vazio">Nenhum item amaldiçoado no inventário. Use "+ Item amaldiçoado" ou adicione pela aba Inventário.</p>'}
    ${outros.length ? `<p class="apagado" style="margin-top:10px">Outros itens paranormais no inventário (sem automação): ${outros.map(it => esc(it.nome)).join(', ')}.</p>` : ''}
  </section>
  ${painelEfeitos(f, d)}`;
}
function abaCombateArmas(f, d) {
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Ataques</h2><div class="linha"><span class="etiqueta">Neste turno: ${f.gastoTurno}/${d.limitePE} ${d.pd ? 'PD' : 'PE'}</span><button class="btn pequeno" data-acao="novo-turno">Novo turno</button><button class="btn pequeno fantasma" data-acao="fim-cena">Fim da cena</button><button class="btn pequeno" data-acao="add-arma">+ Arma</button></div></div>
    ${d.ataques.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th><th>Crítico</th><th class="esconde-celular">Alcance</th><th></th></tr></thead><tbody>
    ${d.ataques.map((a, i) => `<tr><td><b>${esc(a.nome)}</b><br><small>${esc(a.periciaNome)} · ${a.prof}${a.temProf ? '' : ' <span class="etiqueta alerta">sem proficiência −1d20</span>'}${a.notas?.length ? `<br><small class="apagado">${a.notas.map(esc).join(' · ')}</small>` : ''}</small></td>
      <td><button class="rolavel" data-acao="rolar-ataque" data-i="${i}" ${a.bloqueadaTamanho ? 'disabled title="Arma de duas mãos para personagem Pequeno"' : ''}><span class="d">${textoTeste(a.dados, a.bonus)}</span></button></td>
      <td><button class="rolavel" data-acao="rolar-dano" data-i="${i}"><span class="d">${esc(a.formula)}</span></button> <small>${esc(TIPOS_DANO[a.tipo] || a.tipo)}</small></td>
      <td class="num">${a.margem < 20 ? a.margem + '+' : '20'} / ×${a.mult}</td><td class="esconde-celular">${esc(a.alcance)}</td>
      <td>${temOpcional(f, 'municao') && a.capacidade ? `<small>${a.carregada}/${a.capacidade} · reserva ${a.reserva}</small> <button class="btn pequeno" data-acao="recarregar" data-i="${i}">Recarregar</button> <button class="btn pequeno" data-acao="adicionar-pacote" data-i="${i}">Usar pacote</button>` : ''}${a.automatica ? '' : `<button class="icone-btn" data-acao="editar-arma" data-i="${f.armas.findIndex(x => x.uid === a.uid)}" aria-label="Editar ${esc(a.nome)}">✎</button>`}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="vazio">Nenhuma arma. Adicione uma da lista do livro ou crie a sua.</p>'}
    <p class="apagado">Controle ações e reações na mesa. Resolva manobras, testes opostos e ataques concedidos com o outro jogador.</p>
    <p class="apagado" style="font-size:.88rem">Corpo a corpo e arremesso somam Força no dano. No crítico, os dados da arma são multiplicados (bônus fixos não).${CLASSES[f.classe].nome === 'Combatente' ? ' Ataque Especial: gaste PE para +5 no ataque ou dano (use a bandeja de dados para somar o bônus).' : ''}</p>
  </section>
  <div class="grade c2" style="margin-top:14px">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Proteção</h2><button class="btn pequeno" data-acao="add-protecao">+ Proteção</button></div>
    ${f.protecoes.length ? f.protecoes.map((p, i) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--linha)"><label class="check"><input type="checkbox" data-campo="protecoes.${i}.vestida" data-tipo="bool" ${p.vestida ? 'checked' : ''}> <span><b>${esc(p.nome)}</b> <small>Defesa +${p.defesa}${p.rd ? `, RD ${p.rd}` : ''} · cat. ${cat(p.categoria)} · ${p.espacos} esp.</small></span></label><span class="espaco"></span><button class="icone-btn" data-acao="remover" data-lista="protecoes" data-i="${i}" aria-label="Remover ${esc(p.nome)}">✕</button></div>`).join('') : '<p class="apagado">Sem proteção.</p>'}
    <h3 class="titulo-vermelho">Ajustes manuais</h3>
    <div class="grade c3">${[['defesa', 'Defesa'], ['rd', 'RD'], ['desl', 'Desloc. (m)'], ['resistencia', 'Testes de resist.'], ['pv', 'PV máx.'], [usaPD(f) ? 'pd' : 'pe', usaPD(f) ? 'PD máx.' : 'PE máx.'], ...(usaPD(f) ? [] : [['san', 'SAN máx.']]), ['carga', 'Carga']].map(([k, n]) => `<label class="campo"><span>${n}</span><input type="number" data-campo="bonus.${k}" data-tipo="int" id="bonus-${k}" value="${f.bonus[k] || 0}"></label>`).join('')}</div>
    <p class="apagado" style="font-size:.88rem">Para efeitos que o site não calcula sozinho (itens, rituais ativos, poderes paranormais…).</p>
  </section>
  ${painelEfeitos(f, d)}
  ${painelAcoes(f, d)}
  <section class="painel"><h2 class="faixa">Condições</h2>
    <div class="condicoes">${CONDICOES.map(c => `<button data-acao="condicao" data-id="${c.id}" aria-pressed="${f.condicoes.includes(c.id)}" title="${esc(c.resumo)}">${esc(c.nome)}</button>`).join('')}</div>
    ${f.condicoes.length ? `<ul style="margin-top:10px">${f.condicoes.map(id => CONDICOES.find(c => c.id === id)).filter(Boolean).map(c => `<li><b>${esc(c.nome)}:</b> ${esc(c.resumo)}</li>`).join('')}</ul>` : '<p class="apagado" style="margin-top:8px">Nenhuma condição. As penalidades de dados entram sozinhas nas rolagens.</p>'}
    ${temOpcional(f, 'ferimentos') ? `<h3 class="titulo-vermelho">Ferimentos debilitantes</h3>
      <p class="apagado" style="font-size:.9rem">Cada ferimento: −1 dado nos testes do atributo. Em Vigor, também reduz os PV máximos.</p>
      <div class="linha">${f.ferimentos.map((a, i) => `<span class="etiqueta alerta">${a.toUpperCase()} <button class="icone-btn" style="width:22px;height:22px" data-acao="remover" data-lista="ferimentos" data-i="${i}" aria-label="Curar ferimento">✕</button></span>`).join('')}
      <button class="btn pequeno" data-acao="rolar-ferimento">Rolar ferimento (1d6)</button></div>` : ''}
    <h3 class="titulo-vermelho">Efeitos de insanidade</h3>
    <p class="apagado" style="font-size:.9rem">Livro de Regras p. 113: na primeira vez que ficar perturbado (menos da metade da Sanidade) na cena, role 1d20. Dura enquanto estiver perturbado; se ficar enlouquecendo, até o fim da missão. Só interpretação, sem penalidade em testes.</p>
    ${f.insanidades.length ? `<ul>${f.insanidades.map((x, i) => `<li><b>${x.n}.</b> ${esc(EFEITOS_INSANIDADE[x.n - 1])}${x.missao ? ' <span class="etiqueta alerta">até o fim da missão</span>' : ''} <button class="btn pequeno fantasma" data-acao="insanidade-missao" data-i="${i}">${x.missao ? 'Só enquanto perturbado' : 'Durar a missão'}</button> <button class="icone-btn" style="width:22px;height:22px" data-acao="remover" data-lista="insanidades" data-i="${i}" aria-label="Remover efeito de insanidade">✕</button></li>`).join('')}</ul>` : ''}
    <div class="linha"><button class="btn pequeno" data-acao="rolar-insanidade">Rolar efeito de insanidade (1d20)</button></div>
    ${f.modo === 'sah' ? `<h3 class="titulo-vermelho">Efeitos de medo (Sobrevivendo ao Horror)</h3>
    <p class="apagado" style="font-size:.9rem">SaH p. 88: ao chegar a Sanidade 0 por dano mental (ou sofrer dano mental com Sanidade 0), role 2d10 (+1 por efeito anterior na cena). Duram até recuperar 1 ponto de Sanidade. Se entregar ao medo (uma vez por sessão): rola um segundo efeito com +5 e recupera 1d4 SAN por nível na rodada seguinte.</p>
    ${f.medos.length ? `<ul>${f.medos.map((x, i) => { const e = EFEITOS_MEDO.find(m => m[0] === x.n); return `<li><b>${x.n}. ${esc(e[1])}:</b> ${esc(e[2])} <button class="icone-btn" style="width:22px;height:22px" data-acao="remover" data-lista="medos" data-i="${i}" aria-label="Remover efeito de medo">✕</button></li>`; }).join('')}</ul>` : ''}
    <div class="linha"><button class="btn pequeno" data-acao="rolar-medo">Rolar efeito de medo (2d10${f.medos.length ? '+' + f.medos.length : ''})</button><button class="btn pequeno fantasma" data-acao="rolar-medo" data-entregar="1">Me entregar ao medo (+5)</button></div>` : ''}
  </section></div>`;
}

// Painel de EFEITOS ATIVOS: tudo que dura a cena/rodada/próxima rolagem. O jogador desliga quando quiser.
const DURA = { cena: 'até o fim da cena', rodada: 'até o seu próximo turno', proxima: 'só na próxima rolagem' };
function descreverEf(ef, f) {
  const nomeV = v => (typeof v === 'string' ? `+${f.atributos[v]} (${v.toUpperCase()})` : (v >= 0 ? '+' : '') + v);
  const partes = [];
  const rot = { defesa: 'Defesa', resistencia: 'resistências', rd: 'RD', rdMental: 'RD mental', desl: 'desloc.', todasPericias: 'todas as perícias', dadosTodas: 'd20 a mais em perícias', ataque: 'ataque', ataqueDados: 'd20 a mais no ataque', dano: 'dano', margemTodas: 'margem de ameaça', dtRitual: 'DT de rituais' };
  for (const [k, v] of Object.entries(ef)) {
    if (k === 'pericia' || k === 'dadosPericia') { for (const [p, x] of Object.entries(v)) partes.push(`${nomeV(x)}${k === 'dadosPericia' ? 'd20' : ''} ${PERICIA[p]?.nome || p}`); }
    else if (k === 'arma') partes.push('arma de sangue nos ataques');
    else partes.push(`${nomeV(v)} ${rot[k] || k}`);
  }
  return partes.join(', ');
}
// Todas as habilidades "usáveis" que a ficha tem agora (para o painel de Ações rápidas)
function usaveisDaFicha(f, d) {
  const nomes = new Set();
  for (const h of d.habilidades) nomes.add(h.nome);
  for (const h of d.trilhaHabs) if (h.liberada) nomes.add(h.nome);
  if (ORIGEM[f.origem] && origemAtiva(f)) nomes.add(ORIGEM[f.origem].poder);
  for (const p of f.poderes) if (PODER[p.id]) nomes.add(PODER[p.id].nome);
  for (const p of f.paranormais) nomes.add(PODER_PARANORMAL[p.id].nome);
  return [...nomes].filter(n => USAVEIS[n] && !HABILIDADES_MANUAIS.has(n));
}
function painelAcoes(f, d) {
  const lista = usaveisDaFicha(f, d);
  const gladiador = f.trilha === 'lamina' && d.trilhaHabs.find(h => h.nome === 'Gladiador Paranormal')?.liberada;
  if (!lista.length && !gladiador) return '';
  return `<section class="painel"><h2 class="faixa">Ações rápidas</h2><div class="acoes-rapidas">
    ${lista.map(n => `<div class="acao-rapida"><b>${esc(n)}</b>${botaoUsar(n, d)}</div>`).join('')}
    ${gladiador ? `<div class="acao-rapida"><b>Gladiador Paranormal</b><button class="btn pequeno usar" data-acao="gladiador">Acertei corpo a corpo (+2 PE temp.)</button></div>` : ''}
  </div><p class="apagado" style="font-size:.85rem;margin-top:6px">O botão desconta PE/PD (temporários primeiro). O que dura a cena aparece em "Efeitos ativos", onde você desliga.</p></section>`;
}
function painelEfeitos(f, d) {
  const lista = f.efeitos;
  const temp = f.recursos.peTemp;
  if (!lista.length && !temp && !d.rdMental && !d.sangueFervente && !f.cargasAntecipacao) return '';
  return `<section class="painel efeitos-ativos"><div class="titulo-secao"><h2 class="faixa sangue">Efeitos ativos</h2><button class="btn pequeno" data-acao="fim-cena" title="Desliga os efeitos de cena e zera os PE temporários">Fim da cena</button></div>
    ${lista.map((e, i) => `<div class="linha efeito"><button class="btn pequeno sangue" data-acao="desligar-efeito" data-i="${i}" aria-label="Desligar ${esc(e.nome)}">Desligar</button><span><b>${esc(e.nome)}</b> <small class="apagado">${esc(descreverEf(e.ef, f) || 'sem bônus automático')} · ${DURA[e.dura]}${e.nota ? ' · ' + esc(e.nota) : ''}</small></span></div>`).join('')}
    ${temp ? `<p>${d.pd ? 'PD' : 'PE'} temporários: <b>${temp}</b></p>` : ''}
    ${d.sangueFervente ? `<p>Sangue Fervente (machucado): <b>+${d.sangueFervente}</b> em ${f.escolhas.sangueFervente === 'agi' ? 'Agilidade' : 'Força'} <select data-campo="escolhas.sangueFervente" style="width:auto;min-height:30px"><option value="for" ${f.escolhas.sangueFervente === 'for' ? 'selected' : ''}>Força</option><option value="agi" ${f.escolhas.sangueFervente === 'agi' ? 'selected' : ''}>Agilidade</option></select></p>` : ''}
    ${f.cargasAntecipacao ? `<p>Cargas de Antecipar Vitalidade: <b>${f.cargasAntecipacao}</b> <button class="btn pequeno" data-acao="dormir-antecipar">Dormir (gasta carga)</button></p>` : ''}
    ${d.rdMental ? `<p>Resistência a dano mental: <b>${d.rdMental}</b></p>` : ''}
  </section>`;
}
// Botão "Usar" de uma habilidade com custo (catálogo USAVEIS)
const BOTOES_JANELA = { 'Multifacetado': ['multifacetado', 'Usar (5 SAN)'], 'A Força do Saber': ['forca-saber', 'Escolher perícia'] };
const HABILIDADES_MANUAIS = new Set([
  'Abraçar a Dor', 'Acostumado ao Extremo', 'Anular Ritual', 'Ataque de Oportunidade',
  'Ataque Extra', 'Aura de Pavor', 'Brecha na Guarda', 'Cai Dentro', 'Determinação Inquestionável',
  'Disparo Impactante', 'Duro de Matar', 'Equipe de Trauma', 'Escapar da Morte', 'Estrategista',
  'Força Opressora', 'Inspirar Confiança', 'Oficial Comandante', 'Paramédico', 'Reanimação',
  'Remendão', 'Revidar', 'Só Mais um Passo', 'Surto de Adrenalina',
]);
function botaoUsar(nome, d) {
  if (HABILIDADES_MANUAIS.has(nome)) return '<span class="etiqueta">Resolva na mesa</span>';
  if (BOTOES_JANELA[nome]) return `<button class="btn pequeno usar" data-acao="${BOTOES_JANELA[nome][0]}">${BOTOES_JANELA[nome][1]}</button>`;
  const u = USAVEIS[nome]; if (!u) return '';
  const k = d.pd ? 'PD' : 'PE';
  if (u.dura !== 'instante') {
    const ativoAgora = (d.nomesAtivos || []).some(n => n === nome || n.startsWith(nome + ':'));
    const c = typeof u.custo === 'number' ? (u.custo ? `−${u.custo} ${k}` : 'grátis') : `${k} variável`;
    return ativoAgora ? `<button class="btn pequeno sangue usar" data-acao="desativar-nome" data-nome="${esc(nome)}">Desativar</button>`
      : `<button class="btn pequeno usar" data-acao="usar" data-nome="${esc(nome)}" title="${esc(u.nota || '')}">Ativar (${c})</button>`;
  }
  const custo = typeof u.custo === 'number' ? (u.custo ? `−${u.custo} ${k}` : 'grátis') : u.custo === 'aliados' ? `${k} por alvo` : `${k} variável`;
  return `<button class="btn pequeno usar" data-acao="usar" data-nome="${esc(nome)}" title="${esc(u.nota || '')}">Usar (${custo})</button>`;
}

// Botões para rolar os dados citados no efeito (dano, cura, dados de bônus), com a animação 3D.
function botoesDados(nome, texto) {
  const vistos = new Set(), t = String(texto || '');
  const achados = [...t.matchAll(/(\d+)d(\d+)(?:\s*\+\s*(\d+)(?![\d%dD]))?/g)]
    .map(m => ({ f: m[0].replace(/\s+/g, ''), depois: t.slice(m.index + m[0].length, m.index + m[0].length + 45), lados: Number(m[2]) }))
    .filter(x => x.lados !== 20 && x.lados !== 100 && !vistos.has(x.f) && vistos.add(x.f)).slice(0, 3);
  return achados.map(x => {
    const rot = /\bPV\b|\bPE\b|SAN|cura|recupera/i.test(x.depois) ? 'CURA' : /dano/i.test(x.depois) ? 'DANO' : 'DADOS';
    return `<button class="btn pequeno rolar-efeito" data-acao="rolar-efeito" data-nome="${esc(nome)}" data-formula="${esc(x.f)}" data-rotulo="${rot}" title="Rolar ${esc(x.f)}">🎲 ${esc(x.f)}</button>`;
  }).join('');
}
// Dado de dano/cura de um ritual na forma escolhida (discente/verdadeira lidas do texto do ritual).
function formulaDaForma(nome, forma, base, final) {
  if (nome === 'Capturar Momento') return '';
  let f = final || base || '';
  const id = RITUAIS.find(r => r.nome === nome)?.id;
  const perfil = perfilRitual(id, forma);
  if (perfil?.formula) {
    const extra = final && base && final.startsWith(base) ? final.slice(base.length) : '';
    return perfil.formula + (perfil.cura ? '' : extra);
  }
  if (forma === 'discente' || forma === 'verdadeiro') {
    const txt = textoCompleto('rituais', nome) || textoOcr('rituais', nome)?.texto || '';
    const linha = (txt.match(new RegExp((forma === 'discente' ? 'Discente' : 'Verdadeiro') + '\\s*\\([^)]*\\):([^\\n]*)')) || [])[1] || '';
    const m = linha.match(/(?:dano|cura)[^.;]{0,40}?para\s+(\d+d\d+(?:\s*\+\s*\d+)?)/i);
    if (m) { const extra = final && base && final.startsWith(base) ? final.slice(base.length) : ''; f = m[1].replace(/\s+/g, '') + extra; }
  }
  return f;
}
// Maldições do Livro de Regras (p. 145–147), agrupadas por elemento, como caixinhas (contam como modificação: +1 categoria).
// ---------- Aba HABILIDADES ----------
let dAtual = null; // derivação da ficha que está sendo desenhada (para os botões "Usar")
function hab(nome, resumo, meta = '', chave = '', f = null, trancada = false) {
  const nota = chave && f ? f.notasHabilidade[chave] || '' : '';
  const base = String(nome).replace(/ \(.*\)$/, '');
  const usar = !trancada && dAtual ? botaoUsar(base, dAtual) : '';
  const dadosBtn = !trancada ? botoesDados(base, resumo + ' ' + (textoCompleto('habilidades', base) || textoOcr('habilidades', base)?.texto || '')) : '';
  const completo = textoCompleto('habilidades', base);
  const ocr = !completo ? textoOcr('habilidades', base) : null;
  const pendente = !completo && Object.hasOwn(TEXTOS?.habilidades || {},base);
  return `<div class="hab ${trancada ? 'trancada' : ''}"><span class="meta">${meta}${usar}${dadosBtn}</span><b>${esc(nome)}</b>${completo ? `<div class="texto-completo">${esc(completo)}</div>` : ocr ? blocoOcr(ocr) : pendente ? `<p class="apagado">Descrição ainda não conferida palavra por palavra. O livro digitalizado pode conter erros de OCR.</p>${abrirPaginaSah('habilidades',base)}` : (resumo ? `<p>${esc(resumo)}</p>` : '')}
    ${chave && !trancada ? `<details${nota ? ' open' : ''}><summary class="apagado" style="cursor:pointer;font-size:.85rem">Anotação</summary><textarea data-campo="notasHabilidade.${esc(chave)}" id="nota-${esc(chave)}" placeholder="Texto do livro, custo, detalhes…">${esc(nota)}</textarea></details>` : ''}</div>`;
}
// ---------- Aba PODERES (poderes de classe/gerais e paranormais) ----------
function abaPoderes(f, d) {
  dAtual = d;
  const transcender = registrosTranscender(f);
  return `<div class="poderes-aba">
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Poderes de classe</h2><span class="contador ${f.poderes.filter(p => !(d.transcenderSeparado && p.id === 'transcender')).length > d.slotsPoder + (d.versatilidade ? 1 : 0) ? 'erro' : ''}">${f.poderes.filter(p => !(d.transcenderSeparado && p.id === 'transcender')).length} / ${d.slotsPoder}${d.versatilidade ? ' +1' : ''}</span></div>
    <div class="lista-hab">${f.poderes.map((p, i) => { if (p.id === 'transcender') return d.transcenderSeparado ? '' : entradaTranscender(p, transcender.get(p.uid), i); const def = PODER[p.id]; return def ? hab(def.nome + (p.escolha ? ` (${p.escolha})` : ''), def.resumo, `${p.via ? `<span class="etiqueta">via ${esc(p.via)}</span>` : ''}${def.req ? `<small class="apagado">${esc(def.req)}</small>` : ''}${fonteTag(def.fonte)}<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button>`, 'poder-' + p.uid, f) : hab(p.nome, p.resumo, `<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover">✕</button>`, 'poder-' + p.uid, f); }).join('') || '<p class="apagado">Nenhum poder escolhido.</p>'}</div>
    <div class="linha" style="margin-top:10px"><button class="btn" data-acao="escolher-poder">+ Escolher poder</button><button class="btn fantasma" data-acao="poder-proprio">+ Poder próprio (homebrew)</button></div>
    <p class="apagado" style="font-size:.88rem;margin-top:6px">${f.modo === 'sah' ? 'No Sobrevivendo ao Horror, poderes gerais podem ser escolhidos no lugar de um poder de classe. ' : ''}Escolher <b>Transcender</b> abre a janela de poderes paranormais.</p>
  </section>
  ${secaoParanormais(f, d, transcender)}
  </div>`;
}
function abaHabilidades(f, d) {
  const cls = CLASSES[f.classe];
  const o = ORIGEM[f.origem];
  const trilhas = TRILHAS.filter(t => t.classe === f.classe && (t.fonte !== 'SaH' || f.modo === 'sah' || t.classe === 'sobrevivente')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  return `<div class="grade c2">
  <section class="painel"><h2 class="faixa sangue">Classe · ${esc(cls.nome)}</h2>
    <div class="lista-hab">${d.habilidades.map(h => hab(h.nome, h.resumo, '', 'classe-' + h.nome, f)).join('') || '<p class="apagado">—</p>'}</div>
    ${escolhasClasse(f)}
    ${d.versatilidade ? `<div class="hab" style="margin-top:10px"><span class="meta"><button class="btn pequeno usar" data-acao="versatilidade">${f.escolhas.versatilidade ? 'Trocar' : 'Escolher'}</button></span><b>Versatilidade (NEX 50%)</b><p>${f.escolhas.versatilidade ? `Escolhida: <b>${esc(TRILHA[f.escolhas.versatilidade].habilidades[0].nome)}</b> (trilha ${esc(TRILHA[f.escolhas.versatilidade].nome)}) — ${esc(TRILHA[f.escolhas.versatilidade].habilidades[0].resumo)}` : 'Um poder de classe a mais OU a 1ª habilidade de outra trilha da sua classe.'}</p></div>` : ''}
    ${f.classe === 'mundano' || ehSobrevivente(f) ? `<div class="hab" style="margin-top:10px"><span class="meta"><button class="btn pequeno usar" data-acao="treinamento-especial">Entrar para a Ordem</button></span><b>Treinamento Especial</b><p>Se a história levar o sobrevivente para a Ordem, ele vira NEX 5% de uma classe.</p></div>` : ''}
    ${f.poderes.some(p => p.id === 'flashback') && ORIGEM[f.escolhas.flashback] ? hab(`${ORIGEM[f.escolhas.flashback].poder} (Flashback)`, ORIGEM[f.escolhas.flashback].resumo, `<span class="etiqueta">${esc(ORIGEM[f.escolhas.flashback].nome)}</span>`, 'flashback', f) : ''}
    <h3 class="titulo-vermelho">Origem</h3>
    ${o ? `<button class="btn pequeno" data-acao="ver-origem" data-id="${o.id}">Ler origem no livro</button>` : ''}
    ${!origemAtiva(f) ? '<p>O poder de origem ficou fora dos benefícios escolhidos pela faixa etária.</p>' : o ? hab(o.poder, o.resumo, `<span class="etiqueta">${esc(o.nome)}</span>${fonteTag(o.fonte)}`, 'origem', f) : f.origem === 'propria' ? hab(f.origemPropria.poder || 'Poder da origem', f.origemPropria.resumo, `<span class="etiqueta">${esc(f.origemPropria.nome)}</span>`, 'origem', f) : '<p class="apagado">Sem origem.</p>'}
    <label class="campo" style="margin-top:10px"><span>Origem</span><select data-campo="origem">${['<option value="">—</option>', ...Object.values(ORIGEM).filter(x => x.fonte !== 'SaH' || f.modo === 'sah').sort((a, b) => a.nome.localeCompare(b.nome, 'pt')).map(x => `<option value="${x.id}" ${f.origem === x.id ? 'selected' : ''}>${esc(x.nome)}${x.fonte === 'SaH' ? ' (SaH)' : ''}</option>`), `<option value="propria" ${f.origem === 'propria' ? 'selected' : ''}>Origem própria</option>`].join('')}</select></label>
    ${f.origem === 'propria' ? `<div class="grade c2" style="margin-top:8px"><label class="campo"><span>Nome</span><input data-campo="origemPropria.nome" id="op-nome" value="${esc(f.origemPropria.nome)}"></label><label class="campo"><span>Poder</span><input data-campo="origemPropria.poder" id="op-poder" value="${esc(f.origemPropria.poder)}"></label><label class="campo" style="grid-column:1/-1"><span>Efeito</span><textarea data-campo="origemPropria.resumo" id="op-resumo">${esc(f.origemPropria.resumo)}</textarea></label></div>` : ''}
  </section>
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Trilha</h2>
    <select data-campo="trilha" style="max-width:240px" aria-label="Trilha"><option value="">— escolher —</option>${trilhas.map(t => `<option value="${t.id}" ${f.trilha === t.id ? 'selected' : ''}>${esc(t.nome)}${t.fonte === 'SaH' ? ' (SaH)' : ''}</option>`).join('')}</select></div>
    ${d.trilha ? `${d.trilha.aviso ? `<p class="apagado" style="font-size:.88rem">${esc(d.trilha.aviso)}</p>` : ''}<div class="lista-hab">${d.trilhaHabs.map(h => hab(h.nome, h.resumo, `<span class="etiqueta">${ehSobrevivente(f) ? `Estágio ${h.nivel}` : temOpcional(f, 'patentes') ? ['', '', 'Agente especial', '', '', '', '', '', 'Oficial', '', '', '', '', 'Elite', '', '', '', '', '', '', 'Elite'][h.nivel] : temOpcional(f, 'nivelExp') ? `Nível ${h.nivel}` : `NEX ${NEX[h.nivel - 1]}%`}</span>`, 'trilha-' + h.nome, f, !h.liberada)).join('')}</div>`
      : `<p class="apagado">Escolha a trilha ${ehSobrevivente(f) ? 'no estágio 2' : temOpcional(f, 'patentes') ? 'ao virar agente especial' : 'em NEX 10%'}.</p>`}
  </section></div>
  ${secaoAfinidade(f, d)}
  <div class="grade c2" style="margin-top:14px">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Habilidades próprias</h2><button class="btn pequeno" data-acao="add-propria">+ Adicionar</button></div>
    ${f.habilidadesProprias.map((h, i) => `<div class="hab"><span class="meta"><button class="icone-btn" data-acao="remover" data-lista="habilidadesProprias" data-i="${i}" aria-label="Remover">✕</button></span>
      <input data-campo="habilidadesProprias.${i}.nome" id="hp-n-${i}" value="${esc(h.nome)}" aria-label="Nome" style="font-weight:700"><input data-campo="habilidadesProprias.${i}.custo" id="hp-c-${i}" value="${esc(h.custo)}" placeholder="Custo (ex.: 2 PE)" style="margin-top:4px" aria-label="Custo"><textarea data-campo="habilidadesProprias.${i}.resumo" id="hp-r-${i}" placeholder="O que faz">${esc(h.resumo)}</textarea></div>`).join('') || '<p class="apagado">Itens amaldiçoados, bênçãos do mestre, homebrews…</p>'}
  </section>
  ${d.progressaoNex ? secaoProgressaoNex(f, d) : ''}
  <section class="painel"><h2 class="faixa">Progressão</h2>
    <ul class="progressao">${d.progressao.map(l => `<li class="${l.atingido ? 'atingido' : ''}"><span class="n">${esc(l.rotulo)}</span><span>${l.itens.map(esc).join(', ')}</span></li>`).join('')}</ul>
  </section></div>`;
}

// ---------- Afinidade elemental (Livro de Regras p. 110 e 114) ----------
// Elemento opressor (p. 98–107): Sangue oprime Conhecimento, Morte oprime Sangue, Energia oprime Morte, Conhecimento oprime Energia
const OPRESSOR_DE = { conhecimento: 'sangue', sangue: 'morte', morte: 'energia', energia: 'conhecimento' };
function secaoAfinidade(f, d) {
  const el = f.elementoAfinidade;
  if (!el && d.nexAtual < 50) return '';
  const nome = id => ELEM[id]?.nome || id;
  if (!el) return `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Afinidade elemental</h2><button class="btn pequeno sangue" data-acao="escolher-conexao">Escolher elemento</button></div>
    <p>NEX 50%: você se conecta a um elemento (Conhecimento, Energia, Morte ou Sangue). A escolha não muda depois. A afinidade se desenvolve no próximo poder paranormal que você receber.</p></section>`;
  const ativa = !!d.afinidade, op = OPRESSOR_DE[el];
  const comAfinidade = f.paranormais.filter(p => p.afinidade).map(p => PODER_PARANORMAL[p.id]).filter(Boolean);
  const podemReceber = f.paranormais.filter(p => !p.afinidade && poderParaAfinidade(f, PODER_PARANORMAL[p.id], el) === p).map(p => PODER_PARANORMAL[p.id]);
  const formas = f.rituais.map(r => [r, RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome))]).filter(([, c]) => c && (c.elementos?.length ? c.elementos : [c.elemento]).every(e => e === el))
    .flatMap(([r, c]) => [['discente', 'Discente'], ['verdadeiro', 'Verdadeiro']].filter(([k]) => c[k]?.afinidade).map(([, n]) => `${r.nome} (${n})`));
  const item = (titulo, texto, extra = '') => `<div class="hab${ativa ? '' : ' trancada'}"><b>${titulo}</b><p>${texto}</p>${extra}</div>`;
  return `<section class="painel painel-afinidade el-${el}${ativa ? ' ativa' : ''}" style="margin-top:14px">
    <div class="titulo-secao"><h2 class="faixa">${sigilo(el, 'var(--el)')} Afinidade · ${esc(nome(el))}</h2><span class="etiqueta">${ativa ? 'desenvolvida' : 'conectado: desenvolve no próximo poder paranormal'}</span></div>
    ${ativa ? '' : `<p class="apagado" style="font-size:.88rem">Você está conectado a ${esc(nome(el))}. Os benefícios abaixo começam quando você receber o próximo poder paranormal (Transcender, Versatilidade ou outra fonte).</p>`}
    <div class="lista-hab">
      ${item('Rituais sem componentes', `Conjura rituais de ${esc(nome(el))} sem componentes ritualísticos. Pode aprender rituais e formas que exigem afinidade com ${esc(nome(el))}.`,
        formas.length ? `<p class="apagado" style="font-size:.88rem">Formas que pedem afinidade nos seus rituais: ${formas.map(esc).join(', ')}.</p>` : '')}
      ${item('Resistência do elemento', `<b>+2d20</b> em testes contra efeitos de ${esc(nome(el))}.`)}
      ${item('Elemento opressor', `<b>−2d20</b> em testes contra efeitos de ${esc(nome(op))}, o elemento opressor de ${esc(nome(el))}.`)}
      ${item('Poderes com afinidade', `Pode escolher de novo um poder paranormal de ${esc(nome(el))} que já tem, para receber o benefício da linha “Afinidade”.`,
        `${comAfinidade.length ? `<p style="font-size:.9rem">Com afinidade: ${comAfinidade.map(p => `<b>${esc(p.nome)}</b> (${esc((p.afinidade || '').replace(/\.$/, ''))})`).join('; ')}.</p>` : ''}${podemReceber.length ? `<p class="aviso-afinidade" style="font-size:.88rem">Podem receber afinidade: ${podemReceber.map(p => esc(p.nome)).join(', ')} (aba Poderes).</p>` : ''}`)}
      ${d.progressaoNex ? item('Alterações do elemento', `Com NEX & Experiência, você recebe as alterações de ${esc(nome(el))} em NEX 60%, 75% e 90% (veja a Progressão de NEX abaixo).`) : ''}
    </div>
    <p class="apagado" style="font-size:.85rem;margin-top:8px">Livro de Regras p. 114. Os testes contra efeitos do elemento dependem da situação: some ou tire os dados na hora da rolagem.</p>
  </section>`;
}

function secaoProgressaoNex(f, d) {
  const sel = (k, opcoes, nomes) => `<select data-campo="nexAlt.${k}" aria-label="Escolha" style="width:auto;min-height:32px;margin-top:6px"><option value="">— escolher —</option>${opcoes.map(o => `<option value="${o}" ${f.nexAlt[k] === o ? 'selected' : ''}>${esc(nomes(o))}</option>`).join('')}</select>`;
  const nomeP = id => PERICIA[id].nome, nomeA = id => ATRIBUTOS.find(a => a.id === id).nome;
  return `<section class="painel" style="grid-column:1/-1"><div class="titulo-secao"><h2 class="faixa sangue">Progressão de NEX</h2><span class="etiqueta">NEX ${d.nexAtual}%</span></div>
    <p class="apagado" style="font-size:.88rem">Mudanças que a exposição ao Outro Lado causa (Sobrevivendo ao Horror, p. 99–102). Os efeitos em números já entram na ficha.</p>
    <div class="lista-hab">${d.alteracoesNex.map(a => `<div class="hab ${a.atingida ? '' : 'trancada'}"><span class="meta"><span class="etiqueta">NEX ${a.nex}%</span></span><b>${esc(a.nome)}</b><p>${esc(a.resumo)}</p>
      ${a.atingida && a.escolha ? `<div class="linha">${sel(a.escolha, a.opcoes, nomeP)}${a.escolhaAtr ? sel(a.escolhaAtr, ['agi', 'for', 'int', 'vig'], nomeA) : ''}</div>` : ''}
      ${a.atingida && a.nex === 50 ? `<div class="linha"><select data-campo="elementoAfinidade" style="width:auto;min-height:32px;margin-top:6px" aria-label="Afinidade"><option value="">— afinidade —</option>${['sangue', 'morte', 'conhecimento', 'energia'].map(e => `<option value="${e}" ${f.elementoAfinidade === e ? 'selected' : ''}>${e[0].toUpperCase() + e.slice(1)}</option>`).join('')}</select></div>` : ''}</div>`).join('')}</div>
  </section>`;
}

function escolhasClasse(f) {
  const perito = f.classe === 'especialista' || (f.trilha === 'esperto');
  const treinadas = PERICIAS.filter(p => (f.pericias[p.id] || 0) >= 1 && p.id !== 'luta' && p.id !== 'pontaria');
  const sel = i => `<select data-campo="escolhas.perito.${i}" aria-label="Perícia ${i + 1}" style="width:auto"><option value="">—</option>${treinadas.map(p => `<option value="${p.id}" ${f.escolhas.perito[i] === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>`;
  let h = '';
  if (perito) h += `<div class="hab"><b>${f.classe === 'especialista' ? 'Perícias do Perito' : 'Perícias do Entendido'}</b><p>Escolha duas perícias treinadas. Ao rolá-las, aparece a opção de gastar ${f.classe === 'especialista' ? 'PE para somar o dado do Perito' : '1 PE para somar +1d4'}.</p><div class="linha" style="margin-top:6px">${sel(0)}${sel(1)}</div></div>`;
  if (ORIGEM[f.origem]?.id === 'jovem-mistico') h += `<div class="hab"><b>Números da sorte</b><p>Separe por vírgula. O botão "Usar" da origem rola 1d6 e ajusta os números sozinho.</p><input data-campo="escolhas.numeroSorte" id="esc-sorte" value="${esc(f.escolhas.numeroSorte)}" placeholder="ex.: 4" style="max-width:160px;margin-top:6px"></div>`;
  if (ORIGEM[f.origem]?.id === 'experimento') h += `<div class="hab"><b>Mutação: perícia com +2</b><div class="linha" style="margin-top:6px"><select data-campo="escolhas.experimento" style="width:auto" aria-label="Perícia da Mutação"><option value="">—</option>${PERICIAS.filter(p => ['for', 'agi', 'vig'].includes(p.atr)).map(p => `<option value="${p.id}" ${f.escolhas.experimento === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></div></div>`;
  return h ? `<div class="lista-hab" style="margin-top:10px">${h}</div>` : '';
}

function registrosTranscender(f) {
  const escolhas = f.paranormais.filter(p => p.fonte === 'transcender');
  const porRegistro = new Map(escolhas.filter(p => p.transcenderUid).map(p => [p.transcenderUid, p]));
  const antigos = escolhas.filter(p => !p.transcenderUid);
  for (const p of f.poderes.filter(p => p.id === 'transcender' && p.escolha)) {
    if (porRegistro.has(p.uid)) continue;
    const i = antigos.findIndex(x => PODER_PARANORMAL[x.id].nome === p.escolha);
    if (i >= 0) porRegistro.set(p.uid, antigos.splice(i, 1)[0]);
  }
  return porRegistro;
}

function entradaTranscender(registro, poder, i) {
  const def = PODER_PARANORMAL[poder?.id] || PODERES_PARANORMAIS.find(p => p.nome === registro.escolha);
  const nome = def?.nome || registro.escolha;
  const detalhe = poder?.escolha ? ` (${poder.escolha})` : '';
  const descricao = def && (textoCompleto('habilidades', def.nome) || def.resumo);
  return `<div class="hab registro-transcender"><span class="meta"><button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover registro de Transcender">✕</button></span><b>Transcender${nome ? ` · ${esc(nome + detalhe)}` : ''}</b>
    ${descricao ? `<div class="texto-completo">${esc(descricao)}</div>` : ''}
    ${poder?.afinidade && def?.afinidade ? `<p><b>Afinidade</b> ${esc(def.afinidade)}</p>` : ''}
    ${nome ? '' : '<p class="apagado">Poder pendente de escolha.</p><button class="btn pequeno" data-acao="transcender">Escolher poder</button>'}</div>`;
}

// Afinidade (Livro de Regras p. 110 e 114): com afinidade num elemento, escolher de novo um poder paranormal desse
// elemento dá o benefício de Afinidade. A afinidade se desenvolve na primeira vez que a personagem transcende depois
// da conexão (NEX 50%), e "transcender" é receber qualquer poder paranormal: nessa escolha o elemento já vale.
function elementoAfinidadeDisponivel(f, d, fonte) {
  if (d.afinidade) return d.afinidade;
  return f.elementoAfinidade && d.nexAtual >= 50 ? f.elementoAfinidade : ''; // qualquer poder paranormal recebido conta como transcender
}
// O poder já escolhido que pode receber a afinidade agora (do elemento certo, ainda sem afinidade); null = não pode
function poderParaAfinidade(f, def, el) {
  if (!el || !def?.afinidade) return null;
  const elDe = p => (def.elemento === 'variavel' ? semAcento(p.escolha || '') : def.elemento);
  const tem = f.paranormais.filter(x => x.id === def.id);
  if (tem.some(x => x.afinidade && elDe(x) === el)) return null;
  return tem.find(x => !x.afinidade && elDe(x) === el) || null;
}
// Possuído (SaH, Poder Não Desejado): a vaga de poder de ocultista só aceita Transcender (vivência de idade continua livre)
const bloqueadoPossuido = (d, ficha, p) => !!d.possuido && p.id !== 'transcender' && viaPoder(ficha, d, p) === 'classe';
// Transcender e poderes paranormais têm contadores separados.
function secaoParanormais(f, d, transcender) {
  const ELEM_COR = { conhecimento: 'conhecimento', energia: 'energia', morte: 'morte', sangue: 'sangue', variavel: 'variavel' };
  const lista = f.paranormais.map((p, i) => {
    const def = PODER_PARANORMAL[p.id];
    const el = def.elemento === 'variavel' ? (semAcento(p.escolha) || 'variavel') : def.elemento;
    const brilha = !p.afinidade && poderParaAfinidade(f, def, elementoAfinidadeDisponivel(f, d, 'transcender')) === p;
    return `<div class="hab el-${ELEM_COR[el] || 'variavel'}${brilha ? ' brilho-afinidade' : ''}" style="border-left-color:var(--el)"${brilha ? ` title="Afinidade disponível: 'escolha este poder de novo no próximo poder paranormal (Transcender ou + Poder paranormal)'"` : ''}><span class="meta">${sigilo(ELEM_COR[el] || 'variavel', 'var(--el)')}<span class="etiqueta">${p.fonte === 'transcender' ? 'Transcender' : p.fonte === 'origem' ? 'Origem' : 'Outro'}</span>${p.afinidade ? '<span class="etiqueta">afinidade</span>' : ''}${def.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}${dAtual ? botaoUsar(def.nome, dAtual) : ''}<button class="icone-btn" data-acao="remover-paranormal" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button></span>
      <b>${esc(def.nome)}${p.escolha ? ` (${esc(p.escolha)})` : ''}</b><p>${esc(p.afinidade ? 'Afinidade: ' + def.afinidade : def.resumo)}</p>${brilha ? `<p class="aviso-afinidade"><b>Afinidade disponível.</b> No próximo poder paranormal (Transcender ou + Poder paranormal), escolha este de novo para ganhar: ${esc(def.afinidade)}</p>` : ''}${(() => { const b = botoesDados(def.nome, def.resumo + ' ' + (p.afinidade ? def.afinidade : '') + ' ' + (textoCompleto('habilidades', def.nome) || '')); return b ? `<div class="linha" style="margin-top:6px">${b}</div>` : ''; })()}</div>`;
  }).join('');
  const T = d.transcenderes, LT = d.limiteTranscender;
  return `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa sangue">Poderes paranormais</h2>
      <div class="linha"><span class="contador ${T > LT ? 'erro' : ''}" title="Quantas vezes transcendeu">Transcender: ${T} usado(s) · ${d.transcenderLivres} ${d.transcenderSeparado ? 'disponível(is) pelo NEX' : 'poder(es) de classe livre(s)'}</span><span class="contador ${d.paranormaisUsados > d.limiteParanormais ? 'erro' : ''}" title="Poderes paranormais escolhidos">Paranormais: ${d.paranormaisUsados} / ${d.limiteParanormais}</span></div></div>
    <p class="apagado" style="font-size:.88rem">${d.transcenderSeparado
      ? 'Sobrevivendo ao Horror (NEX & Experiência, p. 98): Transcender não é poder de classe. Cada vez que seu NEX chega a uma faixa de alteração (25, 35, 50, 60, 75 ou 90%), você pode realizar o ritual de conexão e transcender uma vez (é opcional). Como a Sanidade vem do nível, transcender não a reduz (há uma opção mais dura na aba Notas).'
      : 'Livro de Regras: Transcender é um poder de classe. Cada um ocupa um poder de classe e você não ganha a Sanidade daquele aumento de NEX.'}
    ${d.possuido ? ` <b>Possuído:</b> ${d.pontosPossessao} pontos de possessão (3 + 2 por Transcender); novos poderes de ocultista viram Transcender.` : ''}
    ${f.elementoAfinidade ? (d.afinidade ? ` Afinidade com <b>${esc(f.elementoAfinidade)}</b> desenvolvida.` : ` Conectado a <b>${esc(f.elementoAfinidade)}</b>: a afinidade se desenvolve no próximo poder paranormal que você receber (Transcender, Versatilidade ou outra fonte).`) : ''}</p>
    ${d.transcenderSeparado && T ? `<h3 class="titulo-vermelho">Transcender</h3><div class="lista-hab">${f.poderes.map((p, i) => p.id === 'transcender' ? entradaTranscender(p, transcender.get(p.uid), i) : '').join('')}</div>` : ''}
    <div class="lista-hab">${lista || '<p class="apagado">Nenhum poder paranormal.</p>'}</div>
    <div class="linha" style="margin-top:10px"><button class="btn sangue" data-acao="transcender">Transcender</button><button class="btn" data-acao="janela-paranormal" data-fonte="${d.paranormalDaOrigem && !f.paranormais.some(p => p.fonte === 'origem') ? 'origem' : 'outro'}">+ Poder paranormal${d.paranormalDaOrigem && !f.paranormais.some(p => p.fonte === 'origem') ? ' (Traços do Outro Lado)' : ''}</button>
      <label class="campo" style="max-width:150px"><span>Extras (mestre)</span><input type="number" min="0" data-campo="bonus.paranormais" data-tipo="int" id="bonus-paranormais" value="${f.bonus.paranormais || 0}"></label></div>
  </section>`;
}
// Janela com a lista de poderes paranormais, por elemento, com pré-requisitos
function janelaParanormal(f, d, fonte) {
  const ordem = ['variavel', 'conhecimento', 'energia', 'morte', 'sangue'];
  const nomesEl = { variavel: 'Qualquer elemento', conhecimento: 'Conhecimento', energia: 'Energia', morte: 'Morte', sangue: 'Sangue' };
  const grupos = ordem.map(el => {
    const ps = PODERES_PARANORMAIS.filter(p => p.elemento === el && (p.fonte !== 'SaH' || f.modo === 'sah')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    return `<h3 class="titulo-vermelho">${sigilo(el, 'var(--el)')} ${nomesEl[el]}</h3><div class="cartoes">${ps.map(p => {
      const tem = f.paranormais.filter(x => x.id === p.id);
      const baseAfin = poderParaAfinidade(f, p, elementoAfinidadeDisponivel(f, d, fonte));
      const afin = !!baseAfin;
      const faltas = Object.entries(p.req || {}).filter(([e, n]) => (d.porElemento[e] || 0) < n).map(([e, n]) => `${nomesEl[e]} ${n}`);
      const bloqueado = (tem.length && !p.repete && !afin) || faltas.length;
      return `<button class="cartao el-${el}${afin ? ' brilho-afinidade' : ''}" style="border-left:4px solid var(--el)" data-acao="add-paranormal" data-id="${p.id}" data-fonte="${fonte}" data-afinidade="${afin ? 1 : 0}"${afin && baseAfin.escolha ? ` data-escolha="${esc(baseAfin.escolha)}"` : ''} data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${bloqueado ? 'disabled' : ''}>
        <span class="linha"><b>${esc(p.nome)}</b><span class="espaco"></span>${p.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}</span>
        ${faltas.length ? `<small style="color:var(--perigo)">Pré: ${faltas.join(', ')} (poderes do elemento)</small>` : Object.keys(p.req || {}).length ? `<small style="color:var(--ok)">Pré: ${Object.entries(p.req).map(([e, n]) => `${nomesEl[e]} ${n}`).join(', ')}</small>` : ''}
        <small>${esc(afin ? 'AFINIDADE: ' + p.afinidade : p.resumo)}</small>${p.afinidade && !afin ? `<small class="apagado">Afinidade: ${esc(p.afinidade)}</small>` : ''}${tem.length && !afin && !p.repete ? '<small class="apagado">Já escolhido.</small>' : ''}</button>`;
    }).join('')}</div>`;
  }).join('');
  abrirModal(fonte === 'transcender' ? 'Transcender: escolha um poder paranormal' : 'Poder paranormal', `<p class="apagado">${fonte === 'transcender' ? 'Ao transcender você não ganha a Sanidade deste aumento de NEX. ' : ''}Pré-requisito "Morte 2" = já ter 2 poderes de Morte.</p><input type="search" placeholder="Procurar poder…" data-filtro-modal autofocus aria-label="Procurar poder paranormal" style="margin:8px 0">${grupos}`, '', true);
}

// ---------- Aba RITUAIS ----------
// Pedido do projeto: cada ritual tem a SUA caixinha de seleção na cor do elemento.
function abaRituais(f, d, ui) {
  const filtro = ui.ritFiltro || { busca: '', elemento: '', circulo: '' };
  const conhecidos = new Set(f.rituais.map(r => semAcento(r.nome) + '|' + r.elemento));
  const lista = RITUAIS.filter(r => (r.fonte !== 'SaH' || f.modo === 'sah')
    && (!filtro.elemento || (r.elementos || [r.elemento]).includes(filtro.elemento)) && (!filtro.circulo || r.circulo === Number(filtro.circulo))
    && (!filtro.busca || semAcento(r.nome + ' ' + r.resumo).includes(semAcento(filtro.busca)))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  const podeConjurar = f.classe === 'ocultista' || f.rituais.length > 0 || (f.trilha === 'esoterico');
  const porCirculo = [1, 2, 3, 4].map(c => ({ c, itens: f.rituais.map((r, i) => [r, i]).filter(([r]) => r.circulo === c) }));
  const lim = d.limiteRituais, qtd = f.rituais.length;
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Rituais conhecidos</h2>
    <div class="linha"><span class="contador marcador-rituais ${lim && qtd > lim ? 'erro' : ''}" title="Rituais conhecidos / que pode conhecer">${qtd} / ${lim || '—'} rituais</span><span class="etiqueta">DT ${d.dtRitual}</span><span class="etiqueta">Círculo máx. ${d.circuloMax}º</span><button class="btn pequeno" data-acao="ritual-proprio">+ Ritual próprio</button></div></div>
    ${!podeConjurar ? '<p class="apagado">Só ocultistas conjuram rituais desde o início (outros podem aprender por poderes, trilhas ou origem).</p>' : ''}
    ${qtd ? porCirculo.filter(g => g.itens.length).map(g => `<h3 class="titulo-vermelho">${g.c}º círculo <small class="apagado">· ${CIRCULOS[g.c - 1].custo} ${d.pd ? 'PD' : 'PE'}</small></h3><div class="rituais-compactos">${g.itens.map(([r, i]) => cartaoRitual(f, d, r, i)).join('')}</div>`).join('') : '<p class="vazio">Nenhum ritual. Marque as caixinhas na lista abaixo.</p>'}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">Toque num ritual para ver tudo. Conjurar faz sozinho o teste de Ocultismo (DT 20 + custo; menos para Medo). ${f.classe === 'ocultista' && !temOpcional(f, 'patentes') ? 'Ocultista: 3 rituais de 1º círculo no início e +1 a cada NEX.' : ''}</p>
    <label class="campo" style="max-width:200px"><span>Rituais extras (mestre)</span><input type="number" min="0" data-campo="bonus.rituais" data-tipo="int" id="bonus-rituais" value="${f.bonus.rituais || 0}"></label>
  </section>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Grimório</h2><span class="apagado">${lista.length} rituais · toque num ritual para ver tudo antes de aprender</span></div>
    <div class="linha" style="margin-bottom:12px">
      <input type="search" class="filtro" placeholder="Procurar ritual…" data-rit-filtro="busca" id="rit-busca" value="${esc(filtro.busca)}" aria-label="Procurar ritual">
      <select data-rit-filtro="elemento" style="width:auto" aria-label="Elemento"><option value="">Todos os elementos</option>${ELEMENTOS.map(e => `<option value="${e.id}" ${filtro.elemento === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
      <select data-rit-filtro="circulo" style="width:auto" aria-label="Círculo"><option value="">Todos os círculos</option>${CIRCULOS.map(c => `<option value="${c.n}" ${Number(filtro.circulo) === c.n ? 'selected' : ''}>${c.n}º círculo</option>`).join('')}</select>
    </div>
    <div class="caixas-ritual">${lista.map(r => {
      const marcado = conhecidos.has(semAcento(r.nome) + '|' + r.elemento);
      const acima = r.circulo > d.circuloMax;
      return `<label class="caixa-ritual el-${r.elemento} ${marcado ? 'marcada' : ''} ${acima ? 'acima' : ''}">
        <input type="checkbox" data-acao-check="ritual-catalogo" data-id="${r.id}" data-elemento="${r.elemento}" ${marcado ? 'checked' : ''} aria-label="${esc(r.nome)} (${nomesElementos(r)}, ${r.circulo}º círculo)">
        <span class="caixa-check" aria-hidden="true"></span>
        ${sigilo(r.elemento, 'var(--el)')}
        <span class="txt"><b>${esc(r.nome)}</b> <small class="dossie-txt">${nomesElementos(r)} ${r.circulo}${fonteTag(r.fonte)}</small><small>${textoCompleto('rituais', r.nome) ? 'Texto integral disponível' : textoOcr('rituais', r.nome) ? 'Texto do OCR disponível (conferir)' : 'Descrição integral pendente — consulte o livro'}</small>${acima ? '<small class="aviso-circulo">Círculo acima do seu acesso</small>' : ''}</span>
      </label>`;
    }).join('')}</div>
  </section>`;
}
// Janela de PRÉ-VISUALIZAÇÃO (grimório): tocar num ritual mostra tudo antes de ele entrar nos rituais conhecidos.
const chaveRitual = r => semAcento(r.nome) + '|' + r.elemento;
function janelaPreviaRitual(f, d, r) {
  const k = d.pd ? 'PD' : 'PE';
  const conhecido = f.rituais.some(x => chaveRitual(x) === chaveRitual(r));
  const custo = CIRCULOS[r.circulo - 1]?.custo ?? 0;
  const texto = textoCompleto('rituais', r.nome), ocr = !texto ? textoOcr('rituais', r.nome) : null;
  const afinidade = (r.elementos?.length ? r.elementos : [r.elemento]).every(el => d.afinidade === el);
  const lim = d.limiteRituais, qtd = f.rituais.length;
  const ficha = [['Execução', r.execucao], ['Alcance', r.alcance], ['Alvo', r.alvo], ['Área', r.area], ['Efeito', r.efeitoArea], ['Duração', r.duracao], ['Resistência', r.resistencia]].filter(([, v]) => v);
  const formas = [['discente', 'Discente'], ['verdadeiro', 'Verdadeiro']].filter(([id]) => r[id]).map(([id, nome]) => {
    const fo = r[id], okCirc = !fo.circulo || d.circuloMax >= fo.circulo, okAf = !fo.afinidade || afinidade;
    const req = [fo.circulo ? `requer ${fo.circulo}º círculo` : '', fo.afinidade ? 'requer afinidade' : ''].filter(Boolean).join(' e ');
    return `<li><b>${nome}</b> +${fo.custo} ${k} <span class="apagado">(total ${custo + fo.custo} ${k})</span>${req ? ` · <small>${req}</small>` : ''}${okCirc && okAf ? '' : ' <small class="aviso-circulo">você ainda não pode usar</small>'}</li>`;
  });
  const problema = conhecido ? '' : problemaAoAprender(f, d, r);
  const avisos = [
    problema,
    r.circulo > d.circuloMax ? `Este ritual é de ${r.circulo}º círculo e seu acesso hoje vai até o ${d.circuloMax}º.` : '',
    r.ritualExigido && !f.rituais.some(x => x.nome === r.ritualExigido) ? `Exige conhecer ${r.ritualExigido}.` : '',
    !conhecido && lim && qtd >= lim ? `Você já conhece ${qtd} de ${lim} rituais possíveis.` : '',
    r.elemento === 'variavel' ? 'Elemento variável: escolha o elemento no cartão do ritual depois de aprender.' : '',
  ].filter(Boolean);
  const corpo = `<div class="previa-ritual el-${r.elemento}">
    <div class="cab-previa">${sigilo(r.elemento, 'var(--el)')}<div><b>${esc(nomesElementos(r))} · ${r.circulo}º círculo</b>${fonteTag(r.fonte)}
      <p class="apagado">${esc(r.resumo || '')}</p></div></div>
    <div class="linha"><span class="etiqueta">Custo ${custo} ${k}</span><span class="etiqueta">DT ${d.dtRitual}</span>${conhecido ? '<span class="etiqueta">Já conhecido</span>' : ''}</div>
    ${ficha.length ? `<dl class="ficha-ritual">${ficha.map(([rot, v]) => `<dt>${rot}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
    ${r.dados ? `<div class="linha dano-previa"><span class="etiqueta">${r.tipoDados === 'cura' ? 'Cura' : 'Dano'} ${esc(r.dados)}</span><button class="btn pequeno" data-acao="rolar-ritual-previa" data-id="${r.id}">Rolar ${esc(r.dados)}</button></div>` : ''}
    ${formas.length ? `<h3 class="titulo-vermelho">Formas avançadas</h3><ul class="formas-previa">${formas.join('')}</ul>` : ''}
    ${avisos.map(a => `<p class="aviso-previa">${esc(a)}</p>`).join('')}
    <h3 class="titulo-vermelho">Descrição</h3>
    ${texto ? `<div class="texto-completo">${esc(texto)}</div>` : ocr ? blocoOcr(ocr) : `<p class="apagado">Descrição integral ainda não disponível nos livros anexados.</p>${abrirPaginaSah('rituais', r.nome)}`}
  </div>`;
  const troca = !conhecido && f.paranormais.some(p => p.id === 'aprender-ritual' && !p.trocaRitualUsada) && f.rituais.length
    ? `<button class="btn" data-acao="ritual-substituir" data-id="${r.id}">Substituir ritual conhecido</button>` : '';
  const rodape = conhecido
    ? `<button class="btn fantasma" data-acao="fechar-modal">Fechar</button><button class="btn perigo" data-acao="ritual-catalogo-esquecer" data-id="${r.id}">Esquecer ritual</button>`
    : `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button>${troca}<button class="btn sangue" data-acao="ritual-aprender" data-id="${r.id}" ${problema ? 'disabled' : ''}>Aprender ritual</button>`;
  abrirModal(`Ritual · ${r.nome}`, corpo, rodape, true);
}
function adicionarRitualCatalogo(ficha, r) {
  if (ficha.rituais.some(x => chaveRitual(x) === chaveRitual(r))) return false;
  ficha.rituais.push({ uid: uid(), elementos: r.elementos || [], nome: r.nome, elemento: r.elemento === 'variavel' ? 'variavel' : r.elemento, circulo: r.circulo, efeito: r.resumo,
    execucao: r.execucao || '', alcance: r.alcance || '', alvo: r.alvo || r.area || r.efeitoArea || '', duracao: r.duracao || '', resistencia: r.resistencia || '', formula: r.dados || '' });
  return true;
}
function cartaoRitual(f, d, r, i) {
  const calc = d.rituais[i] || {}, custo = calc.custo ?? CIRCULOS[r.circulo - 1].custo, k = d.pd ? 'PD' : 'PE';
  const cat = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {};
  const exemplo = { execucao: 'ex.: padrão', alcance: 'ex.: curto', alvo: 'ex.: 1 ser', duracao: 'ex.: cena', resistencia: 'ex.: Vontade anula' };
  const campo = (c, rot) => `<label class="campo"><span>${rot}</span><input data-campo="rituais.${i}.${c}" id="rit-${i}-${c}" value="${esc(r[c])}" placeholder="${exemplo[c] || ''}"></label>`;
  const forma = (fo, nome) => fo ? `<span class="etiqueta">${nome} +${fo.custo} ${k}${fo.circulo ? ` · ${fo.circulo}º` : ''}${fo.afinidade ? ' · afinidade' : ''}</span>` : '';
  const especial = cat.id === 'capturar-momento'
    ? '<button class="btn pequeno" data-acao="capturar-explodir" data-forma="discente">Explodir símbolo discente · 4d8</button><button class="btn pequeno" data-acao="capturar-explodir" data-forma="verdadeiro">Explodir símbolo verdadeiro · 8d8</button>'
    : cat.id === 'presenca-do-medo' ? '<button class="btn pequeno" data-acao="presenca-dano">Rolar os dois danos da área</button>' : '';
  const formula = especial ? '' : calc.formulaFinal || r.formula;
  const texto = textoCompleto('rituais', r.nome);
  const ocr = !texto ? textoOcr('rituais', r.nome) : null;
  return `<details class="ritual ritual-compacto el-${r.elemento}">
    <summary><span class="cab">${sigilo(r.elemento, 'var(--el)')}<b>${esc(r.nome)}</b></span>
      <span class="linha resumo-rit"><span class="etiqueta">${custo} ${k}</span>${formula ? `<span class="etiqueta">${cat.tipoDados === 'cura' ? 'cura' : 'dano'} ${esc(formula)}</span>` : ''}<span class="etiqueta">DT ${calc.dt ?? d.dtRitual}</span></span>
      <small class="apagado">${texto ? 'Descrição disponível abaixo' : ocr ? 'Texto do OCR abaixo (conferir no livro)' : 'Transcrição ainda não revisada'}</small>
      <span class="linha" style="margin-top:6px"><button class="btn pequeno sangue" data-acao="conjurar" data-i="${i}">Conjurar</button>${/sustentad/i.test(r.duracao) ? `<button class="btn pequeno" data-acao="sustentar-ritual" data-i="${i}">Sustentar</button>` : ''}${formula ? `<button class="btn pequeno" data-acao="rolar-ritual" data-i="${i}">Rolar ${esc(formula)}</button>` : ''}</span></summary>
    <div class="detalhes-rit">
      ${especial}
      ${!texto && !ocr ? `<p class="apagado">Descrição integral pendente de conferência: compare os dados com o PDF original.</p>${abrirPaginaSah('rituais',r.nome)}` : ''}
      <div class="grade-mini">
        <label class="campo"><span>Elemento</span><select data-campo="rituais.${i}.elemento">${ELEMENTOS.map(x => `<option value="${x.id}" ${r.elemento === x.id ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></label>
        <label class="campo"><span>Círculo</span><select data-campo="rituais.${i}.circulo" data-tipo="int">${CIRCULOS.map(c => `<option value="${c.n}" ${r.circulo === c.n ? 'selected' : ''}>${c.n}º</option>`).join('')}</select></label>
        ${campo('execucao', 'Execução')}${campo('alcance', 'Alcance')}${campo('alvo', 'Alvo/Área')}${campo('duracao', 'Duração')}${campo('resistencia', 'Resistência')}
        <label class="campo"><span>Dano/cura</span><input data-campo="rituais.${i}.formula" id="rit-${i}-formula" value="${esc(r.formula)}" placeholder="ex.: 3d6+3"></label>
        <label class="campo"><span>Outra rolagem após conjurar</span><input data-campo="rituais.${i}.rolagemExtra" value="${esc(r.rolagemExtra)}" placeholder="ex.: 1d4"></label>
      </div>
      <p class="linha" style="margin-top:8px">${forma(cat.discente, 'Discente')}${forma(cat.verdadeiro, 'Verdadeiro')}</p>
      ${calc.notas?.length ? `<p class="apagado" style="font-size:.85rem">${calc.notas.map(esc).join(' · ')}</p>` : ''}
      ${texto ? `<div class="texto-completo">${esc(texto)}</div>` : ocr ? blocoOcr(ocr) : '<p class="apagado">O texto completo deste ritual ainda não está disponível nos livros anexados.</p>'}
      <label class="campo" style="margin-top:8px"><span>Efeito / anotações (cole aqui o texto do seu livro, se quiser)</span><textarea data-campo="rituais.${i}.efeito" id="rit-${i}-efeito">${esc(r.efeito)}</textarea></label>
      <div class="linha fim" style="margin-top:6px"><button class="btn pequeno perigo" data-acao="esquecer-ritual" data-i="${i}">Esquecer ritual</button></div>
    </div></details>`;
}

// ---------- Modificar e Amaldiçoar (cartões que abrem janelas; a ficha recalcula categoria, espaços e carga) ----------
const MALDICOES_ACESSORIO = Object.keys(AMALDICOADOS).filter(n => n.startsWith('Acessório amaldiçoado: '));
const NOME_EL_MALDICAO = { conhecimento: 'Conhecimento', energia: 'Energia', morte: 'Morte', sangue: 'Sangue', variavel: 'Elemento à escolha' };
const alvoMod = (f, tipo, i) => (tipo === 'arma' ? f.armas[i] : tipo === 'protecao' ? f.protecoes[i] : f.itens[i]);
const campoMod = (tipo, modo) => (tipo === 'item' && modo === 'amaldicoar' ? 'maldicoes' : 'mods');
// Opções da janela: modificações comuns ou maldições (arma pelo tipo de ataque, proteção pelo peso, acessório: maldições de acessório)
function opcoesMod(f, tipo, alvo, modo) {
  if (tipo === 'item') return modo === 'amaldicoar'
    ? MALDICOES_ACESSORIO.map(n => ({ id: n, nome: n.replace('Acessório amaldiçoado: ', ''), el: AMALDICOADOS[n].el, resumo: ITEM_INFO[n]?.resumo || AMALDICOADOS[n].nota || '' }))
    : [];
  const chave = tipo === 'arma' ? alvo.uso : alvo.peso;
  return MODIFICACOES.filter(m => m.para.includes(chave) && (modo === 'amaldicoar' ? !!m.maldicao : !m.maldicao) && (m.fonte !== 'SaH' || f.modo === 'sah'))
    .sort((x, y) => x.nome.localeCompare(y.nome, 'pt'))
    .map(m => ({ id: m.id, nome: m.nome, el: m.maldicao, resumo: m.resumo, fonte: m.fonte, espacos: m.ef?.espacos || 0 }));
}
// Categoria efetiva e espaços do alvo, do mesmo jeito que a ficha calcula
function numerosAlvo(d, tipo, alvo) {
  const mods = alvo.mods || [];
  const espMods = mods.reduce((x, m) => x + (MODIFICACAO[m]?.ef?.espacos || 0), 0);
  if (tipo === 'arma') return { cat: d.ataques.find(x => x.uid === alvo.uid)?.categoriaEfetiva ?? Math.min(4, alvo.categoria + mods.length), esp: Math.max(0, alvo.espacos + espMods) };
  if (tipo === 'protecao') return { cat: Math.min(4, alvo.categoria + mods.length + Number(mods.some(m => MODIFICACAO[m]?.maldicao))), esp: Math.max(0, alvo.espacos + espMods) };
  return { cat: Math.min(4, alvo.categoria + mods.length + (alvo.maldicoes || []).length), esp: Math.max(0, alvo.espacos - Number(mods.includes('discreto'))) };
}
// Os dois cartões: Modificar e Amaldiçoar
function cartoesMod(d, tipo, i, alvo, daJanelaEditar = false) {
  const mods = alvo.mods || [];
  const nMal = tipo === 'item' ? (alvo.maldicoes || []).length : mods.filter(m => MODIFICACAO[m]?.maldicao).length;
  const nMod = tipo === 'item' ? mods.length : mods.length - nMal;
  const n = numerosAlvo(d, tipo, alvo);
  const plural = (k, um, varios, nada) => (k ? `${k} ${k === 1 ? um : varios}` : nada);
  return `<div class="cartoes cartoes-mod">
      <button class="cartao" data-acao="${tipo === 'item' ? 'acessorio' : daJanelaEditar ? 'editar-para-mod' : 'janela-mod'}" data-tipo="${tipo}" data-i="${i}" data-modo="modificar"><b>Modificar</b><small>${plural(nMod, 'modificação', 'modificações', 'Nenhuma modificação')}${tipo === 'item' ? ' · perícia' : ''}</small></button>
      <button class="cartao cartao-amaldicoar" data-acao="${daJanelaEditar ? 'editar-para-mod' : 'janela-mod'}" data-tipo="${tipo}" data-i="${i}" data-modo="amaldicoar"><b>Amaldiçoar</b><small>${plural(nMal, 'maldição', 'maldições', 'Sem maldição')}</small></button>
    </div><small class="apagado">Categoria ${cat(n.cat)} · ${n.esp} espaço(s)</small>`;
}
function janelaMod(f, tipo, i, modo) {
  const alvo = alvoMod(f, tipo, i); if (!alvo) return;
  const d = derivar(f), n = numerosAlvo(d, tipo, alvo), marcadas = alvo[campoMod(tipo, modo)] || [], ops = opcoesMod(f, tipo, alvo, modo);
  const lim = ehSobrevivente(f) ? null : d.patente?.itens;
  const painel = `<div class="numeros-chave numeros-mod">
      <div class="chave"><b>${cat(n.cat)}</b><span>Categoria</span></div><div class="chave"><b>${n.esp}</b><span>Espaços</span></div>
      <div class="chave"><b class="${d.sobrecarregado ? 'erro' : ''}">${d.cargaUsada}/${d.cargaMax}</b><span>Carga da ficha</span></div>
      ${n.cat && lim ? `<div class="chave"><b class="${d.usoCategoria[n.cat] > lim[n.cat - 1] ? 'erro' : ''}">${d.usoCategoria[n.cat]}/${lim[n.cat - 1]}</b><span>Itens cat. ${cat(n.cat)}</span></div>` : ''}</div>`;
  const cartao = o => {
    const on = marcadas.includes(o.id), el = o.el ? (NOME_EL_MALDICAO[o.el] ? o.el : 'variavel') : '';
    return `<button class="cartao${el ? ` el-${el}` : ''}" ${el ? 'style="border-left:4px solid var(--el)"' : ''} aria-pressed="${on}" data-acao="alternar-mod" data-tipo="${tipo}" data-i="${i}" data-modo="${modo}" data-id="${esc(o.id)}">
      <span class="linha"><b>${esc(o.nome)}</b><span class="espaco"></span>${fonteTag(o.fonte || '')}<span class="etiqueta">${on ? '✓ aplicada' : '+1 categoria'}</span></span>
      <small>${esc(o.resumo)}</small>${o.espacos ? `<small class="apagado">${o.espacos > 0 ? '+' : '−'}${Math.abs(o.espacos)} espaço</small>` : ''}</button>`;
  };
  const corpo = modo === 'amaldicoar'
    ? `${['conhecimento', 'energia', 'morte', 'sangue', 'variavel'].map(el => { const g = ops.filter(o => o.el === el); return g.length ? `<h3 class="titulo-vermelho el-${el}">${sigilo(el, 'var(--el)')} ${NOME_EL_MALDICAO[el]}</h3><div class="cartoes">${g.map(cartao).join('')}</div>` : ''; }).join('')}
       <p class="apagado" style="font-size:.85rem;margin-top:10px">Preço das maldições: ao falhar num teste do atributo do elemento (Int para Conhecimento, Agi para Energia, Pre para Morte, For ou Vig para Sangue), perde 2 de Sanidade por maldição desse elemento.${tipo === 'arma' ? ' O ritual Amaldiçoar Arma (dano extra do elemento) fica em Editar.' : ''}${tipo === 'item' ? ' O efeito vale com o acessório equipado.' : ''}</p>`
    : `<div class="cartoes">${ops.map(cartao).join('') || '<p class="apagado">Não há modificações para este tipo.</p>'}</div>`;
  abrirModal(`${modo === 'amaldicoar' ? 'Amaldiçoar' : 'Modificar'} · ${alvo.nome}`,
    `<p class="apagado">Clique para aplicar ou tirar. Cada ${modo === 'amaldicoar' ? 'maldição' : 'modificação'} aumenta a categoria em +1 (máximo IV). A ficha recalcula na hora.</p>${painel}${ops.length ? corpo : '<p class="apagado">Não há opções para este item.</p>'}`,
    '<button class="btn sangue" data-acao="fechar-modal">Pronto</button>', true);
}

// ---------- Itens do inventário (cartões que abrem como os rituais) ----------
// Cartões abertos continuam abertos depois de salvar (o evento "toggle" não sobe, por isso a captura).
const ITENS_ABERTOS = new Set();
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('toggle', ev => {
  const uidItem = ev.target?.dataset?.itemUid;
  if (uidItem) ev.target.open ? ITENS_ABERTOS.add(uidItem) : ITENS_ABERTOS.delete(uidItem);
}, true);
const ROTULO_EFEITO = { pericia: 'Perícia', atributo: 'Atributo', defesa: 'Defesa', desl: 'Deslocamento (m)', rd: 'RD (redução de dano)', carga: 'Espaços de carga', pv: 'PV máximos', pe: 'PE máximos', resistencia: 'Testes de resistência' };
const ehAcessorio = it => ['Utensílio', 'Vestimenta'].includes(it.nome) || it.escrito;
// Como o item é equipado: 'acessorio' (Utensílio/Vestimenta, campo escrito), 'amaldicoado' ou 'comum' (campo ativo).
// '' = o item não muda nada na ficha (não precisa de botão).
function tipoEquipar(it) {
  const am = AMALDICOADOS[it.nome];
  if (am) return am.vestir || am.passivo ? 'amaldicoado' : '';
  if (ehAcessorio(it)) return 'acessorio';
  return PASSIVOS_ITENS[it.nome] || it.efeitos?.length ? 'comum' : '';
}
const estaEquipado = it => (tipoEquipar(it) === 'acessorio' ? it.escrito : it.ativo);
function descreverEfeitosItem(efeitos) {
  return efeitos.map(e => `${comSinal(e.valor)} ${e.tipo === 'pericia' ? PERICIA[e.alvo]?.nome : e.tipo === 'atributo' ? ATRIBUTOS.find(a => a.id === e.alvo)?.nome : ROTULO_EFEITO[e.tipo]}`).join(', ');
}
// O que o item muda na ficha, em texto curto
function efeitoDoItem(it) {
  const partes = [], mods = it.mods || [];
  if (ehAcessorio(it) && it.pericia) {
    partes.push(`${mods.includes('aprimorado') ? '+5' : '+2'} ${PERICIA[it.pericia].nome}`);
    if (mods.includes('funcao') && it.periciaExtra) partes.push(`${mods.includes('aprimorado-extra') ? '+5' : '+2'} ${PERICIA[it.periciaExtra].nome}`);
  }
  const am = AMALDICOADOS[it.nome]?.passivo;
  if (am) partes.push(descreverPassivo(am));
  const def = PASSIVOS_ITENS[it.nome];
  if (def) {
    const { acessorio, exige, ...ef } = def;
    partes.push(descreverPassivo({ ...ef, pericia: { ...(ef.pericia || {}), ...(acessorio || {}) } }) + (exige ? ` (se for treinado em ${PERICIA[exige].nome})` : ''));
  }
  for (const n of it.maldicoes || []) { const p = AMALDICOADOS[n]?.passivo; partes.push(`${n.replace('Acessório amaldiçoado: ', '')} (maldição)${p ? ': ' + descreverPassivo(p) : ''}`); }
  if (it.efeitos?.length) partes.push(descreverEfeitosItem(it.efeitos));
  return partes.filter(Boolean).join(' · ');
}
function cartaoItem(f, d, itemSalvo, i) {
  const it = { mods: [], efeitos: [], ...itemSalvo }; // item recém-adicionado ainda não passou por normalizar()
  const tipo = tipoEquipar(it), eq = estaEquipado(it), info = ITEM_INFO[it.nome];
  const pendente = tipo === 'acessorio' && !it.pericia;
  const naMochila = d.itemMochila === it.uid;
  const efeito = efeitoDoItem(it);
  const catEf = Math.max(0, Math.min(4, it.categoria + it.mods.length + (it.maldicoes || []).length) - (naMochila ? 1 : 0));
  const espEf = Math.max(0, it.espacos - Number(it.mods.includes('discreto')) - (naMochila ? 1 : 0));
  const linhaResumo = pendente ? 'Clique para escolher a perícia que este acessório melhora.'
    : efeito ? `Na ficha: ${efeito}${tipo && !eq ? ' (desligado enquanto estiver desequipado)' : ''}`
    : info?.resumo || it.nota || 'Clique para ver e editar.';
  return `<details class="ritual ritual-compacto item-cartao${eq ? ' equipado' : ''}${pendente ? ' pendente' : ''}" data-item-uid="${esc(it.uid)}" ${ITENS_ABERTOS.has(it.uid) ? 'open' : ''}>
    <summary${pendente ? ` data-acao="item-escolher" data-i="${i}"` : ''}><span class="cab"><b>${esc(it.nome)}</b>${it.qtd !== 1 ? `<span class="etiqueta">×${it.qtd}</span>` : ''}</span>
      <span class="linha resumo-rit"><span class="etiqueta">cat. ${cat(catEf)}</span><span class="etiqueta">${espEf} esp.</span>${tipo ? `<span class="etiqueta ${eq ? 'estado-equipado' : 'estado-desequipado'}">${eq ? 'Equipado' : 'Desequipado'}</span>` : ''}${naMochila ? '<span class="etiqueta">Mochila de Utilidades</span>' : ''}</span>
      <small class="apagado">${esc(linhaResumo)}</small>
      <span class="linha" style="margin-top:6px">${tipo ? `<button class="btn pequeno${eq ? '' : ' sangue'}" data-acao="item-equipar" data-i="${i}" aria-pressed="${eq}">${eq ? 'Desequipar' : 'Equipar'}</button>` : ''}${pendente ? `<button class="btn pequeno" data-acao="item-escolher" data-i="${i}">Escolher perícia</button>` : ''}${info ? `<button class="icone-btn" data-acao="item-info" data-nome="${esc(it.nome)}" aria-label="O que faz ${esc(it.nome)}" title="O que este item faz">?</button>` : ''}</span>
    </summary>
    <div class="detalhes-rit">
      ${info?.resumo ? `<p>${esc(info.resumo)}</p>` : ''}
      ${efeito ? `<p><b>Efeito na ficha:</b> ${esc(efeito)}${tipo && !eq ? ' <span class="apagado">(só vale equipado)</span>' : ''}</p>` : ''}
      ${it.efeitos?.length ? `<div class="linha" style="flex-wrap:wrap">${it.efeitos.map((e, k) => `<span class="etiqueta">${esc(descreverEfeitosItem([e]))} <button class="icone-btn" data-acao="item-efeito-remover" data-i="${i}" data-k="${k}" aria-label="Tirar o efeito ${esc(descreverEfeitosItem([e]))}">✕</button></span>`).join('')}</div>` : ''}
      <div class="linha" style="margin-top:8px;flex-wrap:wrap">
        ${AMALDICOADOS[it.nome] || tipo === 'acessorio' ? '' : `<button class="btn pequeno" data-acao="item-efeito" data-i="${i}">+ Efeito na ficha</button>`}

        ${it.nome.startsWith('Selo Paranormal') || it.nome === 'Dedo Decepado' ? `<button class="btn pequeno" data-acao="vincular-item" data-i="${i}">Vincular</button>` : ''}
        ${it.ritualSelo && it.qtd > 0 ? `<button class="btn pequeno sangue" data-acao="usar-selo" data-i="${i}">Ativar selo</button>` : ''}
      </div>
      ${tipo === 'acessorio' ? cartoesMod(d, 'item', i, it) : ''}
      ${d.temMochilaUtil ? `<label class="check" style="margin-top:8px"><input type="checkbox" data-acao-check="mochila-utilidades" data-uid="${esc(it.uid)}" ${naMochila ? 'checked' : ''}><span><b>Guardar na Mochila de Utilidades</b><small>Este item ocupa 1 espaço a menos e conta como uma categoria abaixo. Só um item por vez.</small></span></label>` : ''}
      <div class="grade-mini" style="margin-top:8px">
        <label class="campo"><span>Nome</span><input data-campo="itens.${i}.nome" id="it-n-${i}" value="${esc(it.nome)}" aria-label="Nome do item"></label>
        <label class="campo"><span>Quantidade</span><input type="number" min="0" data-campo="itens.${i}.qtd" data-tipo="int" id="it-q-${i}" value="${it.qtd}" aria-label="Quantidade"></label>
        <label class="campo"><span>Categoria</span><select data-campo="itens.${i}.categoria" data-tipo="int" aria-label="Categoria">${[0, 1, 2, 3, 4].map(c => `<option value="${c}" ${it.categoria === c ? 'selected' : ''}>${cat(c)}</option>`).join('')}</select></label>
        <label class="campo"><span>Espaços</span><input type="number" min="0" step="0.25" data-campo="itens.${i}.espacos" data-tipo="num" id="it-e-${i}" value="${it.espacos}" aria-label="Espaços"></label>
      </div>
      <label class="campo" style="margin-top:6px"><span>Anotação</span><input data-campo="itens.${i}.nota" id="it-o-${i}" value="${esc(it.nota)}" placeholder="anotação" aria-label="Anotação"></label>
      <div class="linha fim" style="margin-top:6px"><button class="btn pequeno perigo" data-acao="remover" data-lista="itens" data-i="${i}" aria-label="Remover ${esc(it.nome)}">Remover item</button></div>
    </div></details>`;
}

// ---------- Defesa e Esquiva por partes ----------
// Base, itens equipados, habilidades/poderes e efeitos ativos são calculados; "Outros" é o ajuste do jogador
// (rituais e fontes que o site não calcula sozinho).
function blocoDefesa(f, d) {
  const p = d.defesaPartes, sinal = n => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
  const fontes = l => (l?.length ? `<small class="apagado">${l.map(esc).join(' · ')}</small>` : '');
  const linha = (rot, v, l, sempre = true) => (sempre || v ? `<div class="def-linha"><span>${rot}${fontes(l)}</span><b>${sinal(v)}</b></div>` : '');
  const outros = (campo, id, valor) => `<div class="def-linha def-outros"><label for="${id}">Outros <small class="apagado">rituais e outras fontes que você soma à mão</small></label><input type="number" id="${id}" data-campo="bonus.${campo}" data-tipo="int" value="${valor}" aria-label="Outros (${campo === 'defesa' ? 'Defesa' : 'Esquiva'})"></div>`;
  const defesa = `<div class="def-cartao"><div class="def-total"><b>${d.defesa}</b><span>Defesa</span></div>
      <div class="def-linha"><span>Base<small class="apagado">10${p.base > 10 ? ` + ${p.base - 10} (criança)` : ''} + Agilidade ${p.agilidade}</small></span><b>${p.base + p.agilidade}</b></div>
      ${linha('Itens equipados', p.itens, p.itensFontes)}
      ${linha('Habilidades e poderes', p.habilidades, p.habilidadesFontes)}
      ${linha('Rituais e efeitos ativos', p.efeitos, p.efeitosFontes, false)}
      ${linha('Penalidades', p.penalidades, p.penalidadesFontes, false)}
      ${outros('defesa', 'def-outros', p.outros)}</div>`;
  const esquiva = d.esquiva == null
    ? `<div class="def-cartao def-sem"><div class="def-total"><b>—</b><span>Esquiva</span></div><p class="apagado">Esquivar é uma reação de quem é treinado em Reflexos: soma o bônus de Reflexos na Defesa contra aquele ataque (Livro de Regras p. 88).</p></div>`
    : `<div class="def-cartao"><div class="def-total"><b>${d.esquivaTotal}</b><span>Esquiva</span></div>
      <div class="def-linha"><span>Defesa<small class="apagado">o total ao lado</small></span><b>${d.defesa}</b></div>
      ${linha('Reflexos', d.esquiva, ['bônus da perícia, somado ao esquivar (reação)'])}
      ${outros('esquiva', 'esq-outros', f.bonus.esquiva)}
      ${f.paranormais.some(x => x.id === 'campo-protetor') ? '<p class="apagado" style="font-size:.85rem;margin-top:6px">Campo Protetor: ao esquivar, 1 PE para +5 na Defesa (botão Usar na aba Poderes; entra em "Rituais e efeitos ativos").</p>' : ''}</div>`;
  return `<div class="bloco-defesa">${defesa}${esquiva}</div>`;
}

// ---------- Aba INVENTÁRIO ----------
function abaInventario(f, d) {
  const pct = Math.min(100, (d.cargaUsada / Math.max(1, d.cargaMax)) * 100);
  const lim = ehSobrevivente(f) ? null : d.patente.itens;
  return `<div class="grade c2">
  <section class="painel"><h2 class="faixa">Carga</h2>
    <p><b class="dossie-txt" style="font-size:1.4rem">${d.cargaUsada}</b> / ${d.cargaMax} espaços ${d.sobrecarregado ? '<span class="etiqueta alerta">Sobrecarregado: −5 Defesa, −3m e −5 nas perícias de carga</span>' : ''}</p>
    <div class="barra" style="--cor:${d.sobrecarregado ? 'var(--perigo)' : 'var(--vela)'}"><b style="width:${pct}%"></b></div>
    <p class="apagado" style="font-size:.88rem">5 espaços por ponto de Força (Força 0: 2 espaços). Máximo absoluto: o dobro.</p>
  </section>
  <section class="painel"><h2 class="faixa">${ehSobrevivente(f) ? 'Sobrevivente' : `Patente · ${esc(d.patente.nome)}`}</h2>
    ${lim ? `<div class="grade c2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        <label class="campo"><span>Patente</span><select data-campo="patenteManual" data-tipo="int"><option value="0" ${!f.patenteManual ? 'selected' : ''}>Automática pelos PP (${esc(PATENTES.find(p => p.n === (PATENTES.filter(x => f.pp >= x.pp).at(-1) || PATENTES[0]).n).nome)})</option>${PATENTES.map(p => `<option value="${p.n}" ${f.patenteManual === p.n ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
        <label class="campo"><span>Pontos de prestígio</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="inv-pp" value="${f.pp}"></label>
        <label class="campo"><span>Limite de crédito</span><select data-campo="creditoManual"><option value="" ${!f.creditoManual ? 'selected' : ''}>Da patente (${esc(PATENTES[d.patente.n - 1].credito)})</option>${['Baixo', 'Médio', 'Alto', 'Ilimitado'].map(c => `<option ${f.creditoManual === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
      <div class="tabela-rolagem" style="margin-top:10px"><table class="tabela tabela-limites"><thead><tr><th>Categoria</th><th>I</th><th>II</th><th>III</th><th>IV</th></tr></thead><tbody>
        <tr><td>Em uso</td>${[1, 2, 3, 4].map(c => `<td class="num" style="${d.usoCategoria[c] > lim[c - 1] ? 'color:var(--perigo);font-weight:700' : ''}">${d.usoCategoria[c]}</td>`).join('')}</tr>
        <tr><td>Pode levar</td>${[1, 2, 3, 4].map(c => `<td><input type="number" min="0" max="20" data-limite-item="${c - 1}" id="lim-${c}" value="${lim[c - 1]}" aria-label="Limite de itens de categoria ${romano(c)}"></td>`).join('')}</tr></tbody></table></div>
      <div class="linha" style="margin-top:8px"><small class="apagado">${d.patente.itensEditados ? 'Limites editados à mão.' : 'Limites da patente.'} Itens de categoria 0 não têm limite.</small>${d.patente.itensEditados ? '<button class="btn pequeno" data-acao="limites-padrao">Voltar ao padrão da patente</button>' : ''}</div>
      ${!f.patenteManual && PATENTES[d.patente.n] ? `<p class="apagado" style="margin-top:6px">Próxima: ${esc(PATENTES[d.patente.n].nome)} com ${PATENTES[d.patente.n].pp} PP.</p>` : ''}`
      : '<p>Um item de categoria I e itens de categoria 0 compatíveis com a origem. Não usa patente.</p>'}
  </section></div>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa sangue">Itens</h2><div class="linha"><button class="btn pequeno" data-acao="add-arma">+ Arma</button><button class="btn pequeno" data-acao="add-protecao">+ Proteção</button><button class="btn pequeno" data-acao="add-item-lista">+ Item da lista</button><button class="btn pequeno" data-acao="add-item">+ Item personalizado</button></div></div>
    ${f.itens.length ? `<div class="lista-itens">${f.itens.map((it, i) => cartaoItem(f, d, it, i)).join('')}</div>` : '<p class="vazio">Mochila vazia.</p>'}
    ${f.armas.length || f.protecoes.length ? `<h3 class="titulo-vermelho">Armas e proteções</h3><div class="lista-hab">${f.armas.map((a, i) => `<div class="hab"><span class="meta"><button class="btn pequeno" data-acao="editar-arma" data-i="${i}">Editar</button></span><b>${esc(a.nome)}</b><p>${esc(a.dano)}${a.mods.length ? ' · ' + a.mods.map(m => MODIFICACAO[m].nome).join(', ') : ''}${a.maldicao?.tipo ? ' · Amaldiçoar Arma' : ''}</p>${cartoesMod(d, 'arma', i, a)}</div>`).join('')}
      ${f.protecoes.map((p, i) => `<div class="hab"><span class="meta"><button class="btn pequeno" data-acao="editar-protecao" data-i="${i}">Editar</button></span><b>${esc(p.nome)}</b><p>Defesa +${p.defesa}${p.mods.length ? ' · ' + p.mods.map(m => MODIFICACAO[m].nome).join(', ') : ''}</p>${cartoesMod(d, 'protecao', i, p)}</div>`).join('')}</div>` : ''}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">Clique num item para ver o que ele faz, equipar ou desequipar, escolher perícias e editar. Itens desequipados continuam ocupando espaço e categoria. Armas e proteções também aparecem na aba Combate e contam na carga. Cada modificação aumenta a categoria em +1.</p>
  </section>`;
}

// ---------- Aba NOTAS ----------
const ACOES_INTERLUDIO = {
  dormir: 'Dormir', relaxar: 'Relaxar', revisar: 'Revisar caso', manutencao: 'Manutenção',
  alimentar: 'Alimentar-se', exercitar: 'Exercitar-se', ler: 'Ler',
};
function blocoInterludio(f) {
  return `<section class="painel"><h2 class="faixa">Interlúdio</h2>
    <p>${f.interludio.acoes.map(a => ACOES_INTERLUDIO[a]).join(' · ') || 'Nenhuma ação usada'} · ${f.interludio.acoes.length}/2</p>
    <label class="campo"><span>Qualidade do descanso</span><select data-campo="interludio.descanso" data-tipo="int">${['Precária', 'Normal', 'Confortável', 'Luxuosa'].map((q, i) => `<option value="${i}" ${f.interludio.descanso === i ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
    <div class="linha" style="margin-top:8px">${Object.entries(ACOES_INTERLUDIO).map(([id, nome]) => `<button class="btn pequeno" data-acao="interludio-acao" data-id="${id}" ${f.interludio.acoes.length >= 2 || (id === 'relaxar' && f.interludio.acoes.includes(id)) ? 'disabled' : ''}>${nome}</button>`).join('')}
      <button class="btn pequeno fantasma" data-acao="interludio-reiniciar">Novo interlúdio</button></div>
    ${f.modo === 'sah' ? `<div class="linha"><button class="btn pequeno" data-acao="novo-projeto-fabricacao">Planejar fabricação</button></div>${f.projetosFabricacao.map((p, i) => `<div class="hab"><b>${esc(p.nome)}</b> · DT ${p.dt} · ${p.feitas}/${p.exigidas} ações ${p.improviso ? '· improvisado' : ''} <button class="btn pequeno" data-acao="avancar-fabricacao" data-i="${i}">${p.feitas >= p.exigidas ? 'Testar Profissão' : 'Gastar manutenção'}</button></div>`).join('')}` : ''}
    <p class="apagado">Dormir e relaxar calculam a recuperação da ficha. As outras ações ficam registradas para o mestre resolver.</p>
  </section>`;
}

// Rolagens personalizadas: todos os dados (d2 = moeda, d100 = percentual), fórmulas livres, teste do Ordem e rolagens salvas na ficha.
const DADOS_LIVRES = [[2, 'Moeda'], [4, 'd4'], [6, 'd6'], [8, 'd8'], [10, 'd10'], [12, 'd12'], [20, 'd20'], [100, 'd100']];
function abaRolagens(f) {
  return `<div class="grade c2">
  <section class="painel"><h2 class="faixa">Dados</h2>
    <div class="grade c2">
      <label class="campo"><span>Quantidade</span><input type="number" id="rol-qtd" min="1" max="100" value="1"></label>
      <label class="campo"><span>Modificador (+/−)</span><input type="number" id="rol-mod" min="-999" max="999" value="0"></label>
    </div>
    <div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr));margin-top:10px">
      ${DADOS_LIVRES.map(([l, n]) => `<button class="cartao" data-acao="rol-dado" data-lados="${l}"><b>${l === 2 ? 'd2' : n}</b><small>${l === 2 ? 'moeda: 1 cara, 2 coroa' : l === 100 ? 'percentual (1–100)' : `1 a ${l}`}</small></button>`).join('')}
    </div>
    <div class="linha" style="margin-top:10px;flex-wrap:wrap">
      <button class="btn" data-acao="rol-moeda">Cara ou coroa</button>
      ${DADOS_LIVRES.map(([l]) => `<button class="btn pequeno fantasma" data-acao="rol-somar" data-lados="${l}" title="Acrescentar à fórmula">+d${l}</button>`).join('')}
    </div>
  </section>
  <section class="painel"><h2 class="faixa">Fórmula livre</h2>
    <label class="campo"><span>Fórmula (ex.: 2d6+1d4+3, 1d100, 3d2)</span><input id="rol-formula" maxlength="40" placeholder="2d6+3" autocomplete="off"></label>
    <div class="linha" style="margin-top:8px;flex-wrap:wrap"><button class="btn" data-acao="rol-formula">Rolar fórmula</button><button class="btn pequeno fantasma" data-acao="rol-limpar">Limpar</button></div>
    <h3 class="titulo-vermelho" style="margin-top:14px">Teste do Ordem (d20)</h3>
    <div class="grade c3">
      <label class="campo"><span>Dados (d20)</span><input type="number" id="rol-teste-qtd" min="0" max="10" value="1"></label>
      <label class="campo"><span>Bônus</span><input type="number" id="rol-teste-bonus" min="-99" max="99" value="0"></label>
      <label class="campo"><span>DT (opcional)</span><input type="number" id="rol-teste-dt" min="0" max="99" value=""></label>
    </div>
    <p class="apagado" style="font-size:.88rem">Fica com o melhor d20. Com 0 dados, rola 2 e fica com o pior.</p>
    <button class="btn" data-acao="rol-teste">Rolar teste</button>
  </section>
  </div>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Rolagens salvas</h2></div>
    <div class="grade c3">
      <label class="campo"><span>Nome</span><input id="rol-salvar-nome" maxlength="60" placeholder="Ex.: Dano da faca + Sangue"></label>
      <label class="campo"><span>Fórmula</span><input id="rol-salvar-formula" maxlength="40" placeholder="1d4+2d10"></label>
      <div class="campo"><span>&nbsp;</span><button class="btn" data-acao="rol-salvar">Salvar rolagem</button></div>
    </div>
    ${f.rolagensSalvas.length ? `<div class="acoes-rapidas" style="margin-top:10px">${f.rolagensSalvas.map((r, i) => `<div class="acao-rapida"><b>${esc(r.nome)}</b><span class="linha"><button class="rolavel" data-acao="rol-salva" data-i="${i}"><span class="d">${esc(r.formula)}</span></button><button class="icone-btn" data-acao="rol-remover" data-i="${i}" aria-label="Remover ${esc(r.nome)}">✕</button></span></div>`).join('')}</div>` : '<p class="vazio" style="margin-top:8px">Nenhuma rolagem salva. Salve as que você usa sempre (dano de item, cura de ritual, tabela do mestre…).</p>'}
  </section>`;
}
function abaNotas(f) {
  const area = (k, rot, ph, alto = 140) => `<label class="campo"><span>${rot}</span><textarea data-campo="${k}" id="f-${k}" placeholder="${esc(ph)}" style="min-height:${alto}px">${esc(f[k])}</textarea></label>`;
  return `<section class="painel"><h2 class="faixa">Dossiê do agente</h2>
    <div class="grade c2"><label class="campo"><span>Jogador(a)</span><input data-campo="jogador" id="f-jogador" value="${esc(f.jogador)}"></label><label class="campo"><span>Conceito</span><input data-campo="conceito" id="f-conceito" value="${esc(f.conceito)}"></label><label class="campo"><span>Idade</span><input data-campo="idade" id="f-idade" value="${esc(f.idade)}"></label>
    <label class="campo"><span>Elemento de conexão (NEX 50%)</span><select data-campo="elementoAfinidade"><option value="">Nenhum</option>${ELEMENTOS.filter(e => e.id !== 'variavel').map(e => `<option value="${e.id}" ${f.elementoAfinidade === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label></div>
    <div class="grade" style="margin-top:12px">${area('aparencia', 'Aparência', 'Como o agente se parece, marcas, roupas…', 90)}${area('historia', 'História', 'O que fazia antes, o primeiro contato com o paranormal…')}${area('notas', 'Anotações da missão', 'Pistas, nomes, lugares…', 220)}</div>
  </section>${blocoInterludio(f)}
  <section class="painel" style="margin-top:14px"><h2 class="faixa">Regras desta ficha</h2>
    <p><span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}">${esc(MODOS[f.modo].nome)}</span></p>
    ${`<div class="opcionais">${Object.entries(OPCIONAIS).filter(([k]) => f.modo === 'sah' || ['idade', 'municao'].includes(k)).map(([k, o]) => `<label class="check opcional"><input type="checkbox" data-acao-check="opcional" data-k="${k}" ${f.opcionais[k] ? 'checked' : ''}><span><b>${esc(o.nome)}</b><small>${esc(o.resumo)}</small></span></label>`).join('')}</div>`}
      ${f.opcionais.idade ? `<div class="painel"><h3>${faixaEtaria(f)?.nome || 'Idade inválida ou em branco'}</h3>
      ${faixaEtaria(f)?.origem ? `<p>Benefícios da origem: ${f.beneficiosOrigem.length}/${faixaEtaria(f).origem}. <button class="btn pequeno" data-acao="revisar-origem-idade">Revisar benefícios</button></p>` : ''}
      ${faixaEtaria(f)?.peso ? `<p>${f.pesosIdade.length}/${faixaEtaria(f).peso} desvantagens</p><div class="grade c2">${Object.entries(PESOS_IDADE).map(([id, [nome, efeito]]) => `<label class="check hab"><input type="checkbox" data-acao-check="peso-idade" data-id="${id}" ${f.pesosIdade.includes(id) ? 'checked' : ''} ${f.pesosIdade.length >= faixaEtaria(f).peso && !f.pesosIdade.includes(id) ? 'disabled' : ''}><span><b>${nome}</b> <small>${efeito}</small></span></label>`).join('')}</div>` : ''}
    </div>` : ''}
    ${f.elementoAfinidade ? `<label class="check opcional"><input type="checkbox" data-acao-check="afinidade-ativa" ${f.afinidadeAtiva ? 'checked' : ''}><span><b>Afinidade desenvolvida</b><small>Livro de Regras p. 124: depois de se conectar ao elemento em NEX 50%, a afinidade se desenvolve na primeira vez que você transcende (recebe um poder paranormal). O site marca sozinho; use para corrigir.</small></span></label>` : ''}
    ${nexSeparado(f) ? `<label class="check opcional"><input type="checkbox" data-acao-check="opcional" data-k="transcenderSan" ${f.opcionais.transcenderSan ? 'checked' : ''}><span><b>Transcender custa Sanidade (interpretação mais dura)</b><small>Com NEX separado, a Sanidade vem do nível e o livro não diz o que o Transcender tira. Padrão do site: não tira nada. Marcando, cada Transcender tira a Sanidade de um nível.</small></span></label>` : ''}
    <div class="linha" style="margin-top:14px"><button class="btn" data-acao="duplicar-ficha">Duplicar ficha</button><button class="btn perigo" data-acao="apagar-ficha">Apagar agente</button></div>
  </section>`;
}

// ---------- Janela "Gastar PE" antes de rolar (passo 9) ----------
function janelaGasto(f, d, alvo, ops) {
  const k = d.pd ? 'PD' : 'PE';
  const titulo = alvo.tipo === 'pericia' ? d.PER[alvo.id].nome : `Ataque · ${d.ataques[alvo.i].nome}`;
  const linhas = ops.map(o => o.id === 'ataque-especial'
    ? `<div class="hab"><b>${esc(o.nome)}</b> <small class="apagado">até ${o.maxPassos}× +${o.valorPasso} · custo: ${Array.from({ length: o.maxPassos }, (_, j) => `${j + 1}× = ${o.custoPorPassos(j + 1)} ${k}`).join(', ')}</small>
        <div class="grade c2" style="margin-top:6px"><label class="campo"><span>+${o.valorPasso} no ATAQUE (vezes)</span><input type="number" id="ae-ataque" min="0" max="${o.maxPassos}" value="0"></label><label class="campo"><span>+${o.valorPasso} no DANO (vezes)</span><input type="number" id="ae-dano" min="0" max="${o.maxPassos}" value="0"></label></div>
        ${o.nota ? `<p>${esc(o.nota)}</p>` : ''}</div>`
    : `<label class="check hab"><input type="checkbox" id="gasto-${o.id}"><span><b>${esc(o.nome)}</b> — ${o.custo} ${k}: ${o.bonus ? `+${o.bonus}` : ''}${o.dados ? `+${o.dados}d20` : ''}${o.dadoExtra ? `+${o.dadoExtra}` : ''}${o.nota ? ` <small class="apagado">(${esc(o.nota)})</small>` : ''}</span></label>`).join('');
  const dadosAlvo = JSON.stringify(alvo).replace(/"/g, '&quot;');
  abrirModal(titulo, `<p class="apagado">Você tem <b>${d.atual[d.pd ? 'pd' : 'pe']} ${k}</b> (limite ${d.limitePE} por turno). Marque o que quer gastar nesta rolagem:</p><div class="lista-hab">${linhas}</div>`,
    `<button class="btn fantasma" data-acao="rolar-sem-gasto" data-alvo="${dadosAlvo}">Rolar sem gastar</button><button class="btn sangue" data-acao="rolar-com-gasto" data-alvo="${dadosAlvo}">Gastar e rolar</button>`);
}

const ritualDeToque = (ritual, catalogo) =>
  /\btoque\b/i.test(ritual.alcance || catalogo.alcance || '');

// Janela de CONJURAR: custo do ritual + extras (Ampliar, Acelerar, Camuflar, formas avançadas) + pagar com PV (Flagelador)
function janelaConjurar(ctx, f, d, i) {
  const r = d.rituais[i], k = d.pd ? 'PD' : 'PE';
  const cat = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {};
  const tem = id => f.poderes.some(p => p.id === id);
  const afinidade = (r.elementos?.length ? r.elementos : [r.elemento]).every(el => d.afinidade === el);
  const formas = [['basica', 'Forma básica', 0, true, '']];
  for (const [id, nome] of [['discente', 'Forma discente'], ['verdadeiro', 'Forma verdadeira']]) {
    const fo = cat[id]; if (!fo) continue;
    const okCirc = !fo.circulo || d.circuloMax >= fo.circulo, okAf = !fo.afinidade || afinidade;
    formas.push([id, nome, fo.custo, okCirc && okAf, `${fo.circulo ? `requer ${fo.circulo}º círculo` : ''}${fo.afinidade ? ' e afinidade' : ''}${!okCirc || !okAf ? ' (você ainda não pode)' : ''}`]);
  }
  const op = [];
  if (f.trilha === 'conduite' && d.trilhaHabs.find(h => h.nome === 'Ampliar Ritual')?.liberada) op.push(['ampliar', 'Ampliar Ritual: mais alcance ou área em dobro', 2]);
  if (f.trilha === 'conduite' && d.trilhaHabs.find(h => h.nome === 'Acelerar Ritual')?.liberada) op.push(['acelerar', 'Acelerar Ritual: conjurar como ação livre', 4]);
  if (tem('camuflar-ocultismo')) op.push(['camuflar', 'Camuflar Ocultismo: sem gestos nem palavras', 2]);
  if (f.trilha === 'lamina' && semAcento(r.nome) === 'amaldicoar arma') op.push(['lamina', 'Lâmina Maldita: conjurar com ação de movimento', 1]);
  const flagelo = f.trilha === 'flagelador' && d.trilhaHabs.find(h => h.nome === 'Poder do Flagelo')?.liberada;
  const armadura = f.protecoes.filter(p => p.vestida).some(p => p.peso === 'pesada') ? 2 : f.protecoes.filter(p => p.vestida).some(p => p.peso === 'leve') ? 1 : 0;
  abrirModal(`Conjurar · ${r.nome}`, `<p>${esc(cat.execucao ? `Execução ${cat.execucao} · alcance ${cat.alcance || '—'} · ${cat.alvo || cat.area || cat.efeitoArea || ''} · ${cat.duracao || ''}` : '')}</p>
    ${ritualDeToque(r, cat) ? '<p class="apagado">Confirme o toque e aplique o efeito ao alvo na mesa. Os dados do ritual são rolados normalmente.</p>' : podeResolverRitual(cat.id, r.formula, r.resistencia) ? `<label class="campo"><span>Alvo para resolver resistência e dano</span><select id="conj-alvo"><option value="">Apenas conjurar</option>${opcoesAlvos(ctx, f).replace(' selected', '')}</select></label><label class="campo"><span>Recurso do alvo</span><select id="conj-recurso"><option value="pv">PV</option><option value="mental">Sanidade / PD</option></select></label>` : ''}
    <h3 class="titulo-vermelho">Forma</h3><div class="lista-hab">${formas.map(([id, nome, c, ok, req], j) => `<label class="check hab"><input type="radio" name="conj-forma" value="${id}" data-custo="${c}" ${j === 0 ? 'checked' : ''} ${ok ? '' : 'disabled'}><span><b>${nome}</b> — total <b>${r.custo + c} ${k}</b>${c ? ` (${r.custo} + ${c})` : ''}${req ? ` <small class="apagado">${esc(req)}</small>` : ''}</span></label>`).join('')}</div>
    ${op.length ? `<h3 class="titulo-vermelho">Extras</h3><div class="lista-hab">${op.map(([id, n, c]) => `<label class="check hab"><input type="checkbox" id="conj-${id}" data-custo="${c}"><span>${esc(n)} <b>+${c} ${k}</b></span></label>`).join('')}</div>` : ''}
    <div class="grade c2" style="margin-top:8px"><label class="campo"><span>Outro custo (${k})</span><input type="number" min="0" id="conj-outro" value="0"></label>
      <label class="campo"><span>Concentração: DT de Vontade (0 = sem teste)</span><input type="number" min="0" id="conj-vontade" value="0"></label></div>
    ${flagelo ? `<label class="check hab"><input type="checkbox" id="conj-flagelo"><span><b>Poder do Flagelo:</b> pagar com PV (2 PV por ${k}).</span></label>` : ''}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">${r.elemento === 'medo' ? 'Rituais de Medo dispensam Ocultismo. Perca Sanidade (ou PD) igual ao custo, além de 1 a 3 pontos permanentes pela forma usada.' : `O site rola Ocultismo contra DT 20 + custo. Se falhar, você perde Sanidade igual ao custo (e 1 permanente se falhar por 5 ou mais).${armadura ? ` Proteção ${armadura === 2 ? 'pesada (−2 dados)' : 'leve (−1 dado)'} atrapalha os gestos.` : ''}`} Limite: ${d.limiteRitual} ${k}/turno.</p>`,
    `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="conjurar-confirmar" data-i="${i}">Conjurar</button>`, true);
}
function janelaDano(d, qtd, recurso) {
  const rd = recurso === 'pv' ? d.rd : d.rdMental;
  abrirModal(recurso === 'pv' ? 'Sofrer dano' : 'Dano mental', `<p class="apagado">Resolva as reações na mesa e informe o dano resultante.</p>
    <label class="campo"><span>Dano a registrar</span><input type="number" id="dano-qtd" min="0" value="${qtd}"></label>
    ${rd ? `<label class="check hab"><input type="checkbox" id="dano-aplicar-rd"><span>Aplicar RD ${rd}</span></label>` : ''}`,
    '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="aplicar-dano" data-rec="' + recurso + '">Aplicar</button>');
}

// ---------- JANELA DE ESCOLHA genérica: opções clicáveis, cada uma explicada, em ordem alfabética ----------
let escolhaPendente = null; // { aoEscolher(valor) }
const alfa = (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt');
function janelaEscolha({ titulo, intro = '', opcoes, aoEscolher, ordenar = true, busca = true, largo = true }) {
  const lista = ordenar ? [...opcoes].sort(alfa) : opcoes;
  escolhaPendente = { aoEscolher };
  abrirModal(titulo, `${intro ? `<p class="apagado">${intro}</p>` : ''}${busca && lista.length > 8 ? '<input type="search" placeholder="Procurar…" data-filtro-modal autofocus aria-label="Procurar" style="margin:6px 0 10px">' : ''}
    <div class="cartoes">${lista.map((o, i) => `<button class="cartao ${o.classe || ''}" style="${o.estilo || ''}" data-acao="escolher-opcao" data-valor="${esc(o.valor)}" data-busca="${esc(semAcento(o.nome + ' ' + (o.desc || '')))}" ${o.desabilitado || o.reqOk === false ? 'disabled' : ''}>
      <span class="linha"><b>${esc(o.nome)}</b><span class="espaco"></span>${o.tag || ''}</span>${o.req ? `<small style="color:${o.reqOk === false ? 'var(--perigo)' : 'var(--ok)'}">Pré: ${esc(o.req)}</small>` : ''}<small>${esc(o.desc || '')}</small>${o.obs ? `<small class="apagado">${esc(o.obs)}</small>` : ''}</button>`).join('')}</div>`, '', largo);
}
// Janela de várias escolhas (caixinhas) — ex.: Treinamento em Perícia
function janelaMultipla({ titulo, intro, opcoes, max, aoConfirmar }) {
  escolhaPendente = { aoConfirmar, max };
  abrirModal(titulo, `<p class="apagado">${intro}</p><div class="lista-hab">${[...opcoes].sort(alfa).map(o => `<label class="check hab"><input type="checkbox" data-multi="${esc(o.valor)}" ${o.desabilitado ? 'disabled' : ''}><span><b>${esc(o.nome)}</b> <small class="apagado">${esc(o.desc || '')}</small></span></label>`).join('')}</div>`,
    `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="confirmar-multipla">Confirmar</button>`);
}
const ELEMENTOS_OPCOES = [
  ['conhecimento', 'Conhecimento', 'Mente, informação, sigilos e verdades proibidas.'], ['energia', 'Energia', 'Caos, eletricidade, sorte e mudança.'],
  ['morte', 'Morte', 'Tempo, decadência, lodo e o fim das coisas.'], ['sangue', 'Sangue', 'Corpo, dor, emoção e fome.'],
];
// Escolher um poder de OUTRA classe (Especialista Diletante, Expansão de Conhecimento)
function janelaOutraClasse(ctx, ficha, via) {
  const d = derivar(ficha);
  janelaEscolha({ titulo: `${via}: poder de outra classe`, intro: 'Escolha um poder de classe que não é da sua classe (não vale poder de trilha nem paranormal). Ele não ocupa uma vaga de poder de classe.',
    opcoes: poderesDeOutrasClasses(ficha).map(p => ({ valor: p.id, nome: p.nome, desc: p.resumo, req: p.req, reqOk: cumpreRequisito(ficha, d, p.req), tag: `<span class="etiqueta">${CLASSES[p.classe].nome}</span>${p.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}`, desabilitado: ficha.poderes.some(x => x.id === p.id) && !p.repete })),
    aoEscolher: id => { const fx = ctx.fichaAtual(); if (!cumpreRequisito(fx, derivar(fx), PODER[id].req)) return; fx.poderes.push({ id, escolha: '', via, uid: uid() }); ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`${PODER[id].nome} aprendido (${via}).`); } });
}
// Escolhas que alguns poderes pedem ao serem adicionados
function escolhaDoPoder(ctx, ficha, p, depois) {
  const d = derivar(ficha);
  if (p.id === 'foco-em-pericia') return janelaEscolha({ titulo: 'Foco em Perícia', intro: 'Escolha uma perícia em que você é treinado (menos Luta e Pontaria). Você rola +1 dado nela.',
    opcoes: PERICIAS.filter(x => !['luta', 'pontaria'].includes(x.id)).map(x => ({ valor: x.id, nome: x.nome, desc: `${x.atr.toUpperCase()} · ${d.PER[x.id].grau ? GRAUS[d.PER[x.id].grau].nome : 'não treinado'}`, desabilitado: !d.PER[x.id].grau || ficha.poderes.some(y => y.id === 'foco-em-pericia' && y.escolha === x.id) })), aoEscolher: depois });
  if (p.id === 'especialista-em-elemento' || p.id === 'mestre-em-elemento') return janelaEscolha({ titulo: p.nome, intro: p.id === 'especialista-em-elemento' ? 'Rituais do elemento escolhido ficam mais difíceis de resistir: +2 na DT.' : 'Rituais do elemento escolhido custam −1 PE. Precisa de Especialista em Elemento no mesmo elemento e NEX 45%.', ordenar: true,
    opcoes: [...ELEMENTOS_OPCOES, ['medo', 'Medo', 'O elemento do Outro Lado em si.']].map(([v, n, x]) => ({ valor: v, nome: n, desc: x, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)', desabilitado: p.id === 'mestre-em-elemento' && !ficha.poderes.some(y => y.id === 'especialista-em-elemento' && semAcento(y.escolha) === v) })), aoEscolher: depois });
  if (p.id === 'ritual-predileto') { if (!ficha.rituais.length) { ctx.avisar('Aprenda um ritual antes (aba Rituais).', true); return; } return janelaEscolha({ titulo: 'Ritual Predileto', intro: 'Escolha um ritual que você conhece: o custo dele cai 1 PE.', opcoes: ficha.rituais.map(r => ({ valor: r.nome, nome: r.nome, desc: `${r.circulo}º círculo · ${r.elemento}`, classe: `el-${r.elemento}`, estilo: 'border-left:4px solid var(--el)' })), aoEscolher: depois }); }
  if (p.id === 'treinamento-em-pericia') return janelaMultipla({ titulo: 'Treinamento em Perícia', max: 2,
    intro: `Escolha 2 perícias. Destreinada vira treinada${d.nivelEq >= 7 ? '; treinada vira veterana' : ''}${d.nivelEq >= 14 ? '; veterana vira expert' : ''}. O grau já sobe na ficha.`,
    opcoes: PERICIAS.map(x => { const g = ficha.pericias[x.id] || 0; const pode = g === 0 || (g === 1 && d.nivelEq >= 7) || (g === 2 && d.nivelEq >= 14); return { valor: x.id, nome: x.nome, desc: pode ? `${GRAUS[g].nome} → ${GRAUS[g + 1].nome}` : `${GRAUS[g].nome} (não pode subir agora)`, desabilitado: !pode }; }),
    aoConfirmar: ids => { const fx = ctx.fichaAtual(); for (const id of ids) fx.pericias[id] = (fx.pericias[id] || 0) + 1; depois(ids.map(id => PERICIA[id].nome).join(', ')); } });
  if (p.id === 'especialista-diletante') { depois(''); return janelaOutraClasse(ctx, ctx.fichaAtual(), 'Especialista Diletante'); }
  if (p.id === 'flashback') return janelaEscolha({ titulo: 'Flashback: poder de outra origem', intro: 'Uma memória enterrada volta: você recebe o poder de outra origem (só o poder, não as perícias).',
    opcoes: ORIGENS.filter(o => o.id !== ficha.origem && (o.fonte !== 'SaH' || ficha.modo === 'sah')).map(o => ({ valor: o.id, nome: o.poder, desc: o.resumo, obs: `Origem: ${o.nome}`, tag: o.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : '' })),
    aoEscolher: id => { const fx = ctx.fichaAtual(); fx.escolhas.flashback = id; depois(ORIGEM[id].poder); } });
  depois('');
}

// Depois de subir de nível: abre a janela do que ganhou (aumento de atributo, grau de treinamento)
function abrirPendenciaDeNivel(ctx) {
  const d = derivar(ctx.fichaAtual());
  if (d.pendencias.some(p => p.id === 'atributo')) return janelaAumento(ctx);
  if (d.pendencias.some(p => p.id === 'grau')) return janelaGrau(ctx);
}
// Limite de aumento de atributo pela regra: sobrevivente 3 (SaH p. 32), patentes 4, padrão 5.
export function limiteAumentoAtributo(f) {
  return ehSobrevivente(f) ? 3 : temOpcional(f, 'patentes') ? CRIACAO_ATRIBUTOS.maximoAumentoPatente : CRIACAO_ATRIBUTOS.maximoAumento;
}
function janelaAumento(ctx) {
  const f = ctx.fichaAtual(), d = derivar(f);
  const max = limiteAumentoAtributo(f);
  const disponiveis = ATRIBUTOS.filter(a => aumentoPermitido(f, a.id, max));
  if (!disponiveis.length) return abrirModal('Aumento de atributo', `<p>Todos os atributos já estão no limite de aumento desta regra (${max}). Não há onde aplicar este aumento.</p>`, '<button class="btn sangue" data-acao="fechar-modal">Fechar</button>');
  const dicas = { agi: 'Defesa, Reflexos, Pontaria, Furtividade, Iniciativa.', for: 'Luta, Atletismo, carga e dano corpo a corpo.', int: 'Perícias de estudo e +1 perícia treinada.', pre: 'PE/PD, Vontade, perícias sociais e DT de rituais.', vig: 'PV (retroativo a todos os NEX) e Fortitude.' };
  const noLimite = ATRIBUTOS.filter(a => !aumentoPermitido(f, a.id, max)).map(a => a.nome);
  janelaEscolha({ titulo: 'Aumento de atributo', intro: `Você ganhou +1 em um atributo (máximo ${max} por aumento nesta regra). Escolha qual:${noLimite.length ? ` Já no limite e fora da lista: ${noLimite.join(', ')}.` : ''}`, ordenar: false,
    opcoes: disponiveis.map(a => ({ valor: a.id, nome: `${a.nome}: ${f.atributos[a.id]} → ${f.atributos[a.id] + 1}`, desc: dicas[a.id] })),
    aoEscolher: atr => { const fx = ctx.fichaAtual(); fx.atributos[atr]++; fx.aumentos.push(atr); fx.recursos.pv = fx.recursos.pe = fx.recursos.pd = null; ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`+1 em ${ATRIBUTOS.find(a => a.id === atr).nome}.`); setTimeout(() => abrirPendenciaDeNivel(ctx), 50); } });
}
// Treinado → veterano a partir de NEX 35% (nível 7); veterano → expert a partir de NEX 70% (nível 14).
function podeSubirGrau(f, d, id) {
  const g = f.pericias[id] || 0;
  return g >= 1 && g < 3 && d.nivelEq >= (GRAUS[g + 1].nivelMinimo || 0);
}
function janelaGrau(ctx) {
  const f = ctx.fichaAtual(), d = derivar(f);
  const max = d.porGrau;
  if (!PERICIAS.some(x => podeSubirGrau(f, d, x.id))) return abrirModal('Grau de treinamento', `<p>Nenhuma perícia sua pode subir de grau agora. Para virar veterana, a perícia precisa ser treinada (e NEX 35%+); para virar expert, veterana (e NEX 70%+).</p>`, '<button class="btn sangue" data-acao="fechar-modal">Fechar</button>');
  janelaMultipla({ titulo: 'Grau de treinamento', max,
    intro: `Escolha até ${max} perícias treinadas para subir um grau (treinado → veterano${d.nivelEq >= 14 ? ', veterano → expert' : ''}).`,
    opcoes: PERICIAS.filter(x => podeSubirGrau(f, d, x.id)).map(x => { const g = f.pericias[x.id] || 0; return { valor: x.id, nome: x.nome, desc: `${GRAUS[g].nome} → ${GRAUS[g + 1].nome}` }; }),
    aoConfirmar: ids => { const fx = ctx.fichaAtual(); for (const id of ids) fx.pericias[id] = (fx.pericias[id] || 0) + 1; fx.grausAplicados++; ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`Grau subiu em: ${ids.map(i => PERICIA[i].nome).join(', ')}.`); } });
}
export function painelPendencias(d, compacto = false) {
  if (!d.pendencias.length) return compacto ? '' : '';
  return `<section class="painel pendencias"><div class="titulo-secao"><h2 class="faixa">A fazer na ficha</h2><span class="contador">${d.pendencias.length}</span></div>
    <ul class="lista-pend">${d.pendencias.map(p => `<li><button class="btn pequeno" data-acao="pendencia" data-id="${p.id}">Resolver</button> ${esc(p.texto)}</li>`).join('')}</ul></section>`;
}

// Gasta PE (ou PD): primeiro os temporários. Devolve false se não tiver o bastante.
function gastar(ficha, d, custo, limite = d.limiteAcao, minimoDaAcao = custo) {
  if (!custo) return true;
  if (ficha.gastoTurno + custo > limite && (ficha.gastoTurno !== 0 || custo > minimoDaAcao)) return false;
  const k = d.pd ? 'pd' : 'pe';
  const total = d.atual[k] + ficha.recursos.peTemp;
  if (custo > total) return false;
  const doTemp = Math.min(ficha.recursos.peTemp, custo);
  ficha.recursos.peTemp -= doTemp;
  ficha.recursos[k] = d.atual[k] - (custo - doTemp);
  ficha.gastoTurno += custo;
  return true;
}
// Depois de qualquer rolagem, efeitos "só na próxima rolagem" se desligam sozinhos
function consumirProximas(ctx) {
  const ficha = ctx.fichaAtual(); if (!ficha) return;
  const antes = ficha.efeitos.length;
  ficha.efeitos = ficha.efeitos.filter(e => e.dura !== 'proxima');
  if (ficha.efeitos.length !== antes) { ctx.salvarFicha(ficha); ctx.render(); }
}

// ---------- Ações da ficha ----------
export function acoesFicha(ctx) {
  const f = () => ctx.fichaAtual();
  const salvar = (render = true) => { ctx.salvarFicha(f()); if (render) ctx.render(); };
  const quem = () => f().nome || 'Agente';
  const cobrar = (ficha, atributo) => {
    const perda = cobrarMaldição(ficha, derivar(ficha), atributo);
    ctx.salvarFicha(ficha); ctx.render();
    if (perda) ctx.avisar(`Preço da maldição: −${perda} ${derivar(ficha).pd ? 'PD' : 'Sanidade'}.`, true);
  };
  const testar = async (opcoes, atributo, ficha = f(), dificuldade) => {
    const resultado = await rolarTesteUI(opcoes);
    const dt = dificuldade ?? resultado.dt;
    if (atributo && dt && resultado.total < dt && !resultado.critico) cobrar(ficha, atributo);
    return resultado;
  };
  const mudarPv = (alvo, delta) => {
    const d = derivar(alvo);
    if (delta < 0) sofrerDano(alvo, d, -delta);
    else recuperar(alvo, d, 'pv', delta);
    if (alvo.recursos.pv > 0) alvo.recursos.morrendo = 0;
    ctx.salvarFicha(alvo);
  };
  const ataqueValido = a => {
    const d = derivar(f());
    if (d.semAcoes || d.condicoesEfetivas.has('paralisado')) { ctx.avisar('As condições atuais impedem o ataque.', true); return false; }
    if (!a || a.bloqueadaTamanho) { ctx.avisar('O personagem Pequeno não pode empunhar esta arma de duas mãos.', true); return false; }
    if (temOpcional(f(), 'municao') && a.capacidade && a.carregada < 1) { ctx.avisar('Recarregue a arma antes de disparar.', true); return false; }
    return true;
  };
  const consumirDisparo = a => {
    registrarMaldições(f(), a);
    ctx.salvarFicha(f());
    if (!temOpcional(f(), 'municao') || !a.capacidade) return;
    const arma = f().armas.find(x => x.uid === a.uid);
    arma.carregada--;
    salvar(false);
  };
  const danoDaIdade = (atr, esquiva = false) => {
    const ficha = f();
    const gota = (atr === 'agi' || esquiva) && temPeso(ficha, 'gota');
    const pulmao = atr === 'for' && temPeso(ficha, 'pulmao');
    if (!gota && !pulmao) return;
    const q = rolar('1d6').total;
    mudarPv(ficha, -q);
    ctx.avisar(`${gota ? 'Gota' : 'Pulmão Ruim'}: ${q} de dano.`);
    ctx.render();
  };
  return {
    'ver-origem': el => abrirOrigem(el.dataset.id),
    'aba': el => { ctx.estado.ui.aba = el.dataset.aba; ctx.render(); },
    'pericia-atributo': el => {
      const ficha = f(), d = derivar(ficha), p = d.PER[el.dataset.id];
      if (!p) return;
      janelaEscolha({ titulo: `${p.nome} · Atributo desta rolagem`, busca: false, ordenar: false,
        intro: 'O grau e os bônus da perícia continuam valendo. Escolha o atributo para este teste.',
        opcoes: ATRIBUTOS.map(a => {
          const teste = periciaComAtributo(ficha, d, p.id, a.id);
          return { valor: a.id, nome: a.nome, desc: textoTeste(teste.dados, teste.bonus) + (a.id === p.atrUsado ? ' · padrão atual' : '') };
        }),
        aoEscolher: atr => {
          fecharModal();
          return acoesFicha(ctx)['rolar-pericia']({ dataset: { id: p.id, atr } });
        } });
    },
    'rolar-pericia': el => {
      const ficha = f(), d = derivar(ficha), p = periciaComAtributo(ficha, d, el.dataset.id, el.dataset.atr);
      if (!p) return;
      const alvo = { tipo: 'pericia', id: p.id, atr: el.dataset.atr };
      if (p.id === 'reflexos' && d.reflexosFalha) return ctx.avisar('Falha automática em Reflexos.');
      const ops = opcoesGasto(ficha, d, alvo);
      if (ops.length) return janelaGasto(ficha, d, alvo, ops);
      if (p.bloqueada) return ctx.avisar(`${p.nome} só pode ser usada se você for treinado.`);
      const nome = alvo.atr ? `${p.nome} · ${ATRIBUTOS.find(a => a.id === p.atrUsado).nome}` : p.nome;
      return testar({ titulo: nome, quem: quem(), dados: p.dados, bonus: p.bonus }, p.atrUsado).then(() => { danoDaIdade(p.atrUsado); consumirProximas(ctx); });
    },
    'rolar-com-gasto': async el => {
      const ficha = f(), d = derivar(ficha), alvo = JSON.parse(el.dataset.alvo);
      const ataque = alvo.tipo === 'ataque' ? d.ataques[alvo.i] : null;
      if (ataque && !ataqueValido(ataque)) return;
      if (alvo.id === 'reflexos' && d.reflexosFalha) return ctx.avisar('Falha automática em Reflexos.');
      const ops = opcoesGasto(ficha, d, alvo);
      let custo = 0, minimo = 0, bonus = 0, dados = 0, danoExtra = 0, troca = null, atr = null, caos = 0, carga = false; const extras = [], danoDados = [], nomes = [];
      for (const o of ops) {
        if (o.id === 'ataque-especial') {
          const at = inteiro(document.getElementById('ae-ataque')?.value, 0, 8, 0), dn = inteiro(document.getElementById('ae-dano')?.value, 0, 8, 0);
          const k = Math.min(o.maxPassos, at + dn); if (!k) continue;
          custo += o.custoPorPassos(k); minimo = Math.max(minimo, o.custoPorPassos(1)); bonus += Math.min(at, k) * o.valorPasso; danoExtra += Math.max(0, k - at) * o.valorPasso; nomes.push(`${o.nome} ${k}×`);
        } else if (document.getElementById('gasto-' + o.id)?.checked) {
          custo += o.custo; minimo = Math.max(minimo, o.custo); bonus += o.bonus || 0; dados += o.dados || 0; nomes.push(o.nome.replace(/ \(.*\)$/, ''));
          if (o.dadoExtra) extras.push(o.dadoExtra); if (o.danoDados) danoDados.push(o.danoDados);
          if (o.troca) troca = o.troca; if (o.atr) atr = o.atr; if (o.caos) caos = o.caos; if (o.carga) carga = true;
        }
      }
      const k = d.pd ? 'PD' : 'PE';
      if (custo) { custo += d.custoCondicao; minimo += d.custoCondicao; }
      if (!gastar(ficha, d, custo, d.limiteAcao, minimo)) return ctx.avisar(`${k} insuficiente ou limite por turno excedido.`, true);
      if (ataque) consumirDisparo(ataque);
      if (carga) ficha.cargasAntecipacao++;
      ctx.salvarFicha(ficha);
      for (const e of extras) { const r = rolar(e); bonus += r.total; nomes.push(`${e}=${r.total}`); }
      fecharModal();
      const sufixo = nomes.length ? ` (${nomes.join(', ')}${custo ? `; −${custo} ${k}` : ''})` : '';
      const pool = (dd, extra) => { const q = (dd.pior ? 2 - dd.qtd : dd.qtd) + extra; return q >= 1 ? { qtd: q, pior: false } : { qtd: 2 - q, pior: true }; };
      let item;
      if (alvo.tipo === 'pericia') {
        const p = periciaComAtributo(ficha, d, troca || alvo.id, atr || alvo.atr);
        const nome = troca ? `${d.PER[alvo.id].nome} → ${p.nome}` : p.nome;
        const atributo = atr || alvo.atr ? ` · ${ATRIBUTOS.find(a => a.id === p.atrUsado).nome}` : '';
        item = await testar({ titulo: nome + atributo + sufixo, quem: quem(), dados: pool(p.dados, dados), bonus: p.bonus + bonus }, p.atrUsado);
        danoDaIdade(p.atrUsado);
      } else {
        const a = d.ataques[alvo.i];
        item = await rolarTesteUI({ titulo: `Ataque · ${a.nome}${sufixo}`, quem: quem(), dados: pool(a.dados, dados), bonus: a.bonus + bonus, margem: a.margem, mult: a.mult, gruposCritico: a.gruposCritico, tipo: 'ataque', formulaDano: a.formula + (danoExtra ? `+${danoExtra}` : '') + danoDados.map(x => '+' + x).join('') });
      }
      // Valer-se do Caos: o dado extra é o último rolado
      if (caos && item?.valores) {
        const extra = item.valores[item.valores.length - 1];
        if (extra <= caos) { const r = rolar('1d4'); const f2 = f(); const d2 = derivar(f2); if (d2.pd) f2.recursos.pd = d2.atual.pd - r.total; else f2.recursos.san = d2.atual.san - r.total; ctx.salvarFicha(f2); ctx.avisar(`Valer-se do Caos: o dado extra deu ${extra}. Perdeu ${r.total} de ${d2.pd ? 'PD' : 'Sanidade'}.`, true); }
        else ctx.avisar(`Valer-se do Caos: dado extra ${extra}. Se o teste falhar, perca 1d4 de Sanidade.`);
      }
      consumirProximas(ctx); ctx.render();
    },
    'rolar-sem-gasto': el => {
      const d = derivar(f()), alvo = JSON.parse(el.dataset.alvo); fecharModal();
      if (alvo.id === 'reflexos' && d.reflexosFalha) return ctx.avisar('Falha automática em Reflexos.');
      const fim = () => consumirProximas(ctx);
      if (alvo.tipo === 'pericia') {
        const p = periciaComAtributo(f(), d, alvo.id, alvo.atr);
        if (!p || p.bloqueada) return ctx.avisar('Perícia exige treinamento.');
        const titulo = alvo.atr ? `${p.nome} · ${ATRIBUTOS.find(a => a.id === p.atrUsado).nome}` : p.nome;
        return testar({ titulo, quem: quem(), dados: p.dados, bonus: p.bonus }, p.atrUsado).then(() => { danoDaIdade(p.atrUsado); fim(); });
      }
      else { const a = d.ataques[alvo.i]; if (!ataqueValido(a)) return; consumirDisparo(a); rolarTesteUI({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, gruposCritico: a.gruposCritico, tipo: 'ataque', formulaDano: a.formula }).then(fim); }
    },
    // ----- Usar habilidade (gasta PE, liga efeito, rola o que precisar) -----
    'usar': async el => {
      const ficha = f(), d = derivar(ficha), nome = el.dataset.nome, u = USAVEIS[nome]; if (!u) return;
      if (HABILIDADES_MANUAIS.has(nome)) return ctx.avisar('Resolva esta habilidade na mesa.');
      const k = d.pd ? 'PD' : 'PE';
      let custo = typeof u.custo === 'number' ? u.custo : 0;
      if (u.custo === 'aliados' || u.custo === 'var') { const n = prompt(u.custo === 'aliados' ? `${nome}: quantos alvos/aliados?` : `${nome}: quantos ${k}?`, '1'); if (n == null) return; custo = inteiro(n, 0, 99, 0); }
      if (!usaveisDaFicha(ficha, d).includes(nome)) return ctx.avisar('Esta habilidade não está disponível.', true);
      if (d.semAcoes) return ctx.avisar('As condições atuais impedem a ação.', true);
      if (nome === 'Achado Conveniente') {
        return janelaEscolha({ titulo: nome, intro: 'Escolha um equipamento comum de até categoria III aprovado pelo mestre.',
          opcoes: ITENS_CATALOGO.filter(i => i.categoria != null && i.categoria <= 3 && !/paranorm|amaldiço/i.test(i.grupo || '') && !String(i.fonte).startsWith('AS'))
            .map(i => ({ valor: String(ITENS_CATALOGO.indexOf(i)), nome: i.nome })),
          aoEscolher: valor => {
            if (ficha.itens.length >= 120) return ctx.avisar('O inventário está cheio.');
            if (!gastar(ficha, derivar(ficha), 5 + d.custoCondicao)) return ctx.avisar('PE/PD insuficiente ou limite de turno.');
            const item = ITENS_CATALOGO[Number(valor)];
            ficha.itens.push({ uid: uid(), nome: item.nome, categoria: item.categoria, espacos: item.espacos, qtd: 1, mods: [], expiraCena: true, nota: nome });
            fecharModal(); salvar();
          } });
      }
      if (u.escolhePericia && !el.dataset.escolha) {
        const ops = PERICIAS.map(x => ({ valor: x.id, nome: x.nome, desc: `+${u.escolhePericia} em ${x.nome} (${GRAUS[d.PER[x.id].grau].nome.toLowerCase()})` }));
        if (u.podeDefesa) ops.unshift({ valor: '__defesa', nome: 'Defesa', desc: `+${u.escolhePericia} na Defesa contra o próximo ataque` });
        return janelaEscolha({ titulo: `${nome}: onde vai o bônus?`, intro: 'Escolha a perícia (ou a Defesa) que recebe o bônus. Depois é só desativar quando acabar.', opcoes: ops,
          aoEscolher: v => { fecharModal(); acoesFicha(ctx)['usar']({ dataset: { nome, escolha: v } }); } });
      }
      const minimo = typeof u.custo === 'number' ? custo + d.custoCondicao : 1 + d.custoCondicao;
      custo += d.custoCondicao;
      if (custo && !gastar(ficha, d, custo, d.limiteAcao, minimo)) return ctx.avisar(`${k} insuficiente (precisa de ${custo}).`, true);
      if (u.ganhaPeTemp) {
        let ganho = u.ganhaPeTemp;
        if (nome === 'Potencial Reaproveitado' && ficha.paranormais.some(p => p.id === 'potencial-reaproveitado' && p.afinidade)) ganho = 3;
        ficha.recursos.peTemp += ganho;
      }
      if (u.rolarSorte) {
        const r = rolar('1d6').total, sorte = (ficha.escolhas.numeroSorte || '').split(/[^0-9]+/).filter(Boolean).map(Number);
        if (!sorte.length) { ctx.salvarFicha(ficha); ctx.render(); return ctx.avisar('Anote seu número da sorte na aba Habilidades (origem).', true); }
        if (sorte.includes(r)) { ficha.efeitos.push({ uid: uid(), nome: 'A Culpa é das Estrelas', dura: 'cena', ef: { todasPericias: 2 }, nota: `saiu ${r}` }); ficha.escolhas.numeroSorte = String(sorte[0]); ctx.avisar(`1d6 = ${r}: número da sorte! +2 em perícias nesta cena.`); }
        else { const novos = [...new Set([...sorte, ...[1, 2, 3, 4, 5, 6].filter(x => !sorte.includes(x)).slice(0, 1)])]; ficha.escolhas.numeroSorte = novos.join(','); ctx.avisar(`1d6 = ${r}: não foi dessa vez. Agora seus números são ${novos.join(', ')}.`); }
        ctx.salvarFicha(ficha); ctx.render(); return;
      }
      if (u.dura !== 'instante' && (u.ef || u.arma || u.dura === 'cena')) {
        const nota = u.nota || '';
        ficha.efeitos = ficha.efeitos.filter(e => e.nome !== nome);
        let ef = { ...(u.ef || {}), ...(u.arma ? { arma: true } : {}) }, nomeEf = nome;
        if (u.escolhePericia && el.dataset.escolha) { if (el.dataset.escolha === '__defesa') { ef.defesa = u.escolhePericia; nomeEf = `${nome}: Defesa`; } else { ef.pericia = { [el.dataset.escolha]: u.escolhePericia }; nomeEf = `${nome}: ${PERICIA[el.dataset.escolha].nome}`; } }
        ficha.efeitos = ficha.efeitos.filter(e => !e.nome.startsWith(nome + ':'));
        ficha.efeitos.push({ uid: uid(), nome: nomeEf, dura: u.dura, nota, ef });
      }
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`${nome}${custo ? `: −${custo} ${k}` : ''}${u.ganhaPeTemp ? ` (+${ficha.recursos.peTemp} ${k} temporários)` : ''}${u.dura !== 'instante' ? ` · ativo ${DURA[u.dura]}` : ''}.`);
    },
    'rol-dado': async el => {
      const lados = Number(el.dataset.lados), qtd = inteiro(document.getElementById('rol-qtd')?.value, 1, 100, 1), mod = inteiro(document.getElementById('rol-mod')?.value, -999, 999, 0);
      const formula = `${qtd}d${lados}${mod ? (mod > 0 ? '+' : '') + mod : ''}`;
      const r = await rolarDanoUI({ titulo: lados === 2 ? `Moeda (${formula})` : `Rolagem ${formula}`, quem: quem(), formula, rotulo: lados === 2 ? 'MOEDA' : 'ROLAGEM' });
      if (r && lados === 2 && qtd === 1 && !mod) ctx.avisar(r.total === 1 ? 'Deu 1: cara.' : 'Deu 2: coroa.');
    },
    'rol-moeda': async () => { const r = await rolarDanoUI({ titulo: 'Cara ou coroa', quem: quem(), formula: '1d2', rotulo: 'MOEDA' }); if (r) ctx.avisar(r.total === 1 ? 'Cara (1).' : 'Coroa (2).'); },
    'rol-somar': el => { const i = document.getElementById('rol-formula'); if (!i) return; const v = i.value.trim(); const m = v.match(new RegExp(`(^|\\+)(\\d*)d${el.dataset.lados}(?!\\d)`)); i.value = m ? v.replace(m[0], `${m[1]}${(Number(m[2]) || 1) + 1}d${el.dataset.lados}`) : (v ? v + '+' : '') + `1d${el.dataset.lados}`; i.focus(); },
    'rol-limpar': () => { const i = document.getElementById('rol-formula'); if (i) { i.value = ''; i.focus(); } },
    'rol-formula': async () => { const v = (document.getElementById('rol-formula')?.value || '').trim(); if (!v) return ctx.avisar('Escreva uma fórmula, como 2d6+3.', true); await rolarDanoUI({ titulo: `Rolagem ${v}`, quem: quem(), formula: v, rotulo: 'ROLAGEM' }); },
    'rol-teste': async () => {
      const n = inteiro(document.getElementById('rol-teste-qtd')?.value, 0, 10, 1), bonus = inteiro(document.getElementById('rol-teste-bonus')?.value, -99, 99, 0), dt = document.getElementById('rol-teste-dt')?.value;
      if (dt) proxima.dt = String(inteiro(dt, 0, 99, 0));
      await rolarTesteUI({ titulo: `Teste ${n || 2}d20${n ? '' : ' (pior)'}`, quem: quem(), dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2, pior: true }, bonus });
      proxima.dt = '';
    },
    'rol-salvar': () => {
      const ficha = f(), nome = (document.getElementById('rol-salvar-nome')?.value || '').trim(), formula = (document.getElementById('rol-salvar-formula')?.value || '').replace(/\s+/g, '');
      try { rolar(formula); } catch (e) { return ctx.avisar(e.message, true); }
      if (!/d/i.test(formula)) return ctx.avisar('A fórmula precisa ter pelo menos um dado (ex.: 1d6).', true);
      if (ficha.rolagensSalvas.length >= 40) return ctx.avisar('Limite de 40 rolagens salvas.', true);
      ficha.rolagensSalvas.push({ uid: uid(), nome: nome || formula, formula }); salvar(); ctx.avisar('Rolagem salva.');
    },
    'rol-salva': el => { const r = f().rolagensSalvas[Number(el.dataset.i)]; if (r) rolarDanoUI({ titulo: r.nome, quem: quem(), formula: r.formula, rotulo: 'ROLAGEM' }); },
    'rol-remover': el => { const ficha = f(); ficha.rolagensSalvas.splice(Number(el.dataset.i), 1); salvar(); },
    'rolar-insanidade': async () => {
      const r = await rolarDanoUI({ titulo: 'Efeito de insanidade', quem: quem(), formula: '1d20', rotulo: 'INSANIDADE' }); if (!r) return;
      const ficha = f(); if (ficha.insanidades.length >= 20) return;
      ficha.insanidades.push({ uid: uid(), n: r.total, missao: false }); salvar();
      ctx.avisar(`Insanidade ${r.total}: ${EFEITOS_INSANIDADE[r.total - 1]}`);
    },
    'insanidade-missao': el => { const x = f().insanidades[Number(el.dataset.i)]; if (!x) return; x.missao = !x.missao; salvar(); },
    'rolar-medo': async el => {
      const extra = f().medos.length + (el.dataset.entregar ? 5 : 0);
      const r = await rolarDanoUI({ titulo: el.dataset.entregar ? 'Entregar-se ao medo' : 'Efeito de medo', quem: quem(), formula: `2d10${extra ? '+' + extra : ''}`, rotulo: 'MEDO' }); if (!r) return;
      const ficha = f(); let n = Math.max(2, Math.min(20, r.total));
      while (ficha.medos.some(x => x.n === n) && n < 20) n++; // efeito repetido: vale o próximo da tabela
      const e = EFEITOS_MEDO.find(m => m[0] === n);
      ficha.medos.push({ uid: uid(), n });
      if (e[3]) adicionarCondicao(ficha, e[3]);
      const d0 = derivar(ficha);
      if (n === 2 && !d0.pd) { const ganho = Math.max(1, Math.floor((ficha.nex || 5) / 5)); recuperar(ficha, d0, 'san', ganho); ficha.efeitos.push({ uid: uid(), nome: 'Encorajamento', dura: 'proxima', nota: '+1d20 num teste à escolha', ef: { dadosTodas: 1 } }); }
      if (n === 3) ficha.efeitos.push({ uid: uid(), nome: 'Surto de adrenalina (medo)', dura: 'cena', nota: 'outras ações: Vontade DT 20', ef: { ataque: 5, dano: 5 } });
      if (n === 10) ficha.efeitos.push({ uid: uid(), nome: 'Histeria (medo)', dura: 'cena', nota: 'dura 1d4 rodadas', ef: { dadosTodas: -1, ataqueDados: -1 } });
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`Medo ${n}: ${e[1]}. ${e[2]}`);
      if (n === 18) await rolarDanoUI({ titulo: 'Trauma: atributo (1d6)', quem: quem(), formula: '1d6', rotulo: 'TRAUMA' });
    },
    'preco-maldicao': () => janelaEscolha({ titulo: 'Falha em teste de atributo', intro: 'Use para uma falha que ainda não foi debitada, como um teste resolvido na mesa.',
      opcoes: ATRIBUTOS.map(atr => ({ valor: atr.id, nome: atr.nome })),
      aoEscolher: id => { fecharModal(); cobrar(f(), id); } }),
    'fim-maldicao': () => {
      if (!confirm('Encerrar a influência dos itens abandonados entre missões?')) return;
      const ficha = f(); ficha.maldicoesAceitas = {}; registrarMaldições(ficha); salvar();
    },
    'sub-combate': el => { ctx.estado.ui.subCombate = el.dataset.sub; ctx.render(); },
    'add-amaldicoado-lista': () => {
      const porEl = {};
      for (const nome of NOMES_AMALDICOADOS) { const def = AMALDICOADOS[nome]; (porEl[def.el] ||= []).push(nome); }
      abrirModal('Adicionar item amaldiçoado', Object.entries(porEl).map(([el, nomes]) => `<h3 class="titulo-vermelho">${NOME_EL[el] || el}</h3><div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${nomes.sort((a, b) => a.localeCompare(b, 'pt')).map(n => {
        const info = ITEM_INFO[n] || ITENS_CATALOGO.find(x => x.nome === n);
        return `<button class="cartao el-${COR_EL[el] || 'variavel'}" data-acao="add-amaldicoado" data-nome="${esc(n)}"><b>${esc(n)}</b><small>${esc((info?.resumo || '').slice(0, 140))}</small></button>`;
      }).join('')}</div>`).join(''), '', true);
    },
    'add-amaldicoado': el => {
      const ficha = f(), nome = el.dataset.nome; if (!AMALDICOADOS[nome]) return;
      if (ficha.itens.length >= 120) return ctx.avisar('O inventário está cheio.', true);
      const it = ITENS_CATALOGO.find(x => x.nome === nome) || {};
      const incerto = it.categoria == null;
      ficha.itens.push({ uid: uid(), nome, categoria: incerto ? 0 : it.categoria, espacos: incerto ? 1 : it.espacos, qtd: 1, mods: [], nota: incerto ? (it.notaCategoria || '') : '' });
      fecharModal(); Object.assign(ficha, normalizar(ficha)); salvar(); ctx.avisar(`${nome} adicionado ao inventário.`);
    },
    'dias-dedo': el => {
      const item = f().itens.find(i => i.uid === el.dataset.uid && i.nome === 'Dedo Decepado');
      if (!item) return;
      const dias = prompt('Dias contínuos de uso do Dedo Decepado:', String(item.diasVestido));
      if (dias == null) return;
      item.diasVestido = inteiro(dias, 0, 999, item.diasVestido); salvar();
    },
    'zerar-usos-amaldicoado': el => { const it = f().itens.find(x => x.uid === el.dataset.uid); if (!it) return; it.usosDia = 0; salvar(); ctx.avisar(`${it.nome}: usos do dia zerados.`); },
    'usar-amaldicoado': async el => {
      const ficha = f(); let d = derivar(ficha);
      const it = ficha.itens.find(x => x.uid === el.dataset.uid), def = it && AMALDICOADOS[it.nome], u = def?.usos?.[Number(el.dataset.u)];
      if (!u) return;
      if (!it.qtd) return ctx.avisar('Esse item está sem unidades.', true);
      const titulo = `${it.nome}: ${u.nome}`, k = d.pd ? 'PD' : 'PE', msgs = [];
      if (d.semAcoes && !['reação', 'automática', 'livre', 'interlúdio'].includes(u.acao)) return ctx.avisar('As condições atuais impedem a ação.', true);
      const pedir = (pergunta, padrao = '1', max = 999) => { const r = prompt(pergunta, padrao); return r == null ? null : inteiro(r, 0, max, 0); };
      // custo
      let custo = (u.custo || 0) + (u.custoDia ? it.usosDia : 0);
      if (u.custoPorAtaque) { const n = pedir('Quantos ataques você já fez neste turno?'); if (n == null) return; custo = u.custoPorAtaque * n; }
      if (u.custoPergunta) { const n = pedir(`${titulo}: ${u.custoPergunta}?`); if (n == null) return; custo = n; }
      if (custo) { custo += d.custoCondicao; if (!gastar(ficha, d, custo, d.limiteAcao)) return ctx.avisar(`${k} insuficiente ou limite do turno (precisa de ${custo}).`, true); msgs.push(`−${custo} ${k}`); d = derivar(ficha); }
      if (u.usaCargaUm) { if (!it.carga) return ctx.avisar(`${it.nome} não tem cargas.`, true); it.carga--; }
      if ((u.usaCarga) && !it.carga) return ctx.avisar(`${it.nome} está vazio.`, true);
      // dano informado pelo jogador
      if (u.pedeDano) {
        const n = pedir(u.pedeDano === 'encher' ? 'Quanto dano você vai sofrer para encher o frasco (até 20)?' : u.pedeDano === 'paraPV' ? 'Quanto dano mental você ia sofrer?' : 'Quanto dano você sofreu (antes de reduzir)?', u.pedeDano === 'encher' ? '20' : '10', u.pedeDano === 'encher' ? 20 : 999);
        if (n == null) return;
        if (u.pedeDano === 'metade') { const r = sofrerDano(ficha, d, n, { metade: 1 }); msgs.push(`sofreu ${r.total} (metade de ${n})`); }
        else if (u.pedeDano === 'paraPV') { const r = sofrerDano(ficha, d, n); msgs.push(`${r.total} de dano de Sangue nos PV (em vez de Sanidade)`); }
        else { const r = sofrerDano(ficha, d, n); it.carga = n; msgs.push(`sofreu ${r.total}; frasco com ${n} PV`); }
        d = derivar(ficha);
      }
      if (u.usaCarga === 'curaPV') { recuperar(ficha, d, 'pv', it.carga); msgs.push(`+${it.carga} PV`); it.carga = 0; d = derivar(ficha); }
      if (u.usaCarga === 'peTemp') { const n = pedir(`Quantos PE usar (tem ${it.carga})?`, String(it.carga), it.carga); if (n == null) return; ficha.recursos.peTemp += n; it.carga -= n; msgs.push(`+${n} ${k} temporários`); }
      if (u.peTemp) { ficha.recursos.peTemp += u.peTemp; msgs.push(`+${u.peTemp} ${k} temporários`); }
      if (u.ganhaPE) { recuperar(ficha, d, d.pd ? 'pd' : 'pe', u.ganhaPE); msgs.push(`+${u.ganhaPE} ${k}`); d = derivar(ficha); }
      if (u.cargaMais) { it.carga = Math.min(u.cargaMax || 999, it.carga + u.cargaMais); msgs.push(`carga ${it.carga}`); }
      if (u.danoFixo) { const r = sofrerDano(ficha, d, u.danoFixo.n, { tipo: u.danoFixo.tipo, ignorarTemp: true }); msgs.push(`−${r.total} ${r.recurso.toUpperCase()}`); d = derivar(ficha); }
      if (u.perdeMetadePV) { const r = sofrerDano(ficha, d, Math.floor(d.pv / 2), { ignorarTemp: true }); msgs.push(`perdeu ${r.total} PV (metade dos PV totais)`); d = derivar(ficha); }
      if (u.perdeSanAtributo) { const n = pedir('Valor do atributo-chave da perícia:', '1', 10); if (n == null) return; const r = sofrerDano(ficha, d, n, { tipo: 'mental', ignorarTemp: true }); msgs.push(`−${r.total} ${r.recurso.toUpperCase()}`); d = derivar(ficha); }
      // efeito ativo
      if (u.dura && u.dura !== 'instante') {
        ficha.efeitos = ficha.efeitos.filter(e => e.nome !== titulo);
        ficha.efeitos.push({ uid: uid(), nome: titulo, dura: u.dura, nota: u.nota || '', ef: u.ef || {} });
        msgs.push(`ativo ${DURA[u.dura]}`);
      }
      registrarMaldições(ficha, it);
      let destruir = !!u.destroi;
      const aplicar = async (r, modo, valor) => {
        d = derivar(ficha);
        if (modo === 'curaPV') { recuperar(ficha, d, 'pv', valor); msgs.push(`+${valor} PV`); }
        else if (modo === 'curaPVExcesso') { const sobra = Math.max(0, d.atual.pv + valor - d.pv); recuperar(ficha, d, 'pv', valor); if (sobra) ficha.recursos.pvTemp += sobra; msgs.push(`+${valor} PV${sobra ? ` (${sobra} viraram PV temporários)` : ''}`); }
        else if (modo === 'curaPE') { recuperar(ficha, d, d.pd ? 'pd' : 'pe', valor); msgs.push(`+${valor} ${k}`); }
        else if (modo === 'danoPV') { const x = sofrerDano(ficha, d, valor); msgs.push(`−${x.total} PV`); }
        else if (modo === 'danoMental') { const x = sofrerDano(ficha, d, valor, { tipo: 'mental' }); msgs.push(`−${x.total} ${x.recurso.toUpperCase()}`); }
        else if (modo === 'carga') { it.carga = Math.min(u.cargaMax || 999, it.carga + valor); msgs.push(`carga ${it.carga}`); }
        else if (modo === 'tabela') {
          const t = u.tabela[valor] || u.tabela.outro; if (!t) return;
          msgs.push(t.texto);
          if (t.destroi) destruir = true;
          if (t.condicao) adicionarCondicao(ficha, t.condicao);
          if (t.segue) { const r2 = await rolarDanoUI({ titulo: `${it.nome}: ${t.segue.rotulo === 'CURA' ? 'cura' : 'dano'}`, quem: quem(), formula: t.segue.f, rotulo: t.segue.rotulo }); if (r2 && t.segue.aplicar) await aplicar(r2, t.segue.aplicar, r2.total); else if (r2) msgs.push(`${t.segue.f} = ${r2.total}`); }
        }
      };
      // teste de resistência / perícia
      if (u.teste) {
        const t = u.teste, dt = t.dt + (t.porUso ? t.porUso * it.usosDia : 0), P = d.PER[t.pericia];
        const r = await testar({ titulo: `${it.nome}: ${PERICIA[t.pericia].nome} DT ${dt}`, quem: quem(), dados: P.dados, bonus: P.bonus }, P.atrUsado, ficha, dt);
        if (r && r.total < dt) {
          const falha = (t.falhaPor5 && r.total <= dt - 5) ? t.falhaPor5 : t.falha;
          msgs.push(`falhou (${r.total} contra DT ${dt}): ${falha.texto}`);
          if (falha.condicao) adicionarCondicao(ficha, falha.condicao);
          if (falha.destroi) destruir = true;
          if (falha.dano) { const r2 = await rolarDanoUI({ titulo: `${it.nome}: consequência`, quem: quem(), formula: falha.dano.f, rotulo: falha.dano.tipo === 'anos' ? 'ANOS' : 'DANO' }); if (r2 && falha.dano.tipo !== 'anos') await aplicar(r2, falha.dano.tipo === 'mental' ? 'danoMental' : 'danoPV', r2.total); else if (r2) msgs.push(`${r2.total} ano(s)`); }
        } else if (r) msgs.push(`passou (${r.total} contra DT ${dt})`);
      }
      // rolagem do item
      if (u.rolar) {
        const r = await rolarDanoUI({ titulo, quem: quem(), formula: u.rolar.f, rotulo: u.rolar.rotulo || 'EFEITO' });
        if (r) { if (u.rolar.aplicar) await aplicar(r, u.rolar.aplicar, r.total); else msgs.push(`${u.rolar.f} = ${r.total}`); }
      }
      it.usosDia = Math.min(99, it.usosDia + 1);
      if (u.consome) { it.qtd -= 1; if (it.qtd <= 0) destruir = true; msgs.push('item gasto'); }
      if (destruir) { ficha.itens = ficha.itens.filter(x => x !== it); if (!u.consome) msgs.push('item destruído'); }
      if (u.nota && !(u.dura && u.dura !== 'instante')) msgs.push(u.nota);
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`${titulo}${msgs.length ? ': ' + msgs.join(' · ') : '.'}`);
    },
    'desativar-nome': el => { const ficha = f(); const nome = el.dataset.nome; ficha.efeitos = ficha.efeitos.filter(e => !(e.nome === nome || e.nome.startsWith(nome + ':'))); salvar(); ctx.avisar(`${nome} desativado.`); },
    'desligar-efeito': el => { const ficha = f(); const e = ficha.efeitos[Number(el.dataset.i)]; ficha.efeitos.splice(Number(el.dataset.i), 1); salvar(); ctx.avisar(`${e?.nome || 'Efeito'} desligado.`); },
    'novo-projeto-fabricacao': () => {
      const ficha = f(), d = derivar(ficha);
      if (ficha.modo !== 'sah' || !d.PER.profissao.grau) return ctx.avisar('Fabricação em campo exige treino na Profissão apropriada.');
      if (ficha.projetosFabricacao.length >= 20) return ctx.avisar('Finalize um projeto antes de começar outro.');
      abrirModal('Fabricação de equipamento geral', `<p>O mestre aprova a profissão, materiais e equipamento. O resultado é um item de inventário.</p>
        <label class="campo"><span>Nome</span><input id="fabricacao-nome" maxlength="80"></label>
        <label class="campo"><span>Categoria</span><select id="fabricacao-categoria">${[0,1,2,3,4].map(c => `<option value="${c}">${cat(c)}</option>`).join('')}</select></label>
        <label class="campo"><span>Espaços</span><input type="number" min="0" max="20" id="fabricacao-espacos" value="1"></label>
        <label class="check"><input type="checkbox" id="fabricacao-kit"> Kit da profissão</label>
        <label class="check"><input type="checkbox" id="fabricacao-consumivel"> Consumível</label>
        <label class="check"><input type="checkbox" id="fabricacao-improvisada"> Improvisado</label>`,
        '<button class="btn sangue" data-acao="registrar-fabricacao">Registrar projeto</button>');
    },
    'registrar-fabricacao': () => {
      const ficha = f(), d = derivar(ficha);
      const nome = document.getElementById('fabricacao-nome')?.value.trim();
      if (!nome || ficha.projetosFabricacao.length >= 20 || ficha.modo !== 'sah' || !d.PER.profissao.grau) return;
      const categoria = inteiro(document.getElementById('fabricacao-categoria').value, 0, 4);
      const espacos = inteiro(document.getElementById('fabricacao-espacos').value, 0, 20, 1);
      const tem = nome => d.trilhaHabs.some(h => h.liberada && h.nome === nome);
      const p = parametrosFabricacao({ categoria, kit: document.getElementById('fabricacao-kit').checked || d.PER.profissao.kitAcessorio,
        consumivel: document.getElementById('fabricacao-consumivel').checked, improvisado: document.getElementById('fabricacao-improvisada').checked,
        mascate: tem('Mascate'), propria: tem('Fabricação Própria') });
      ficha.projetosFabricacao.push({ uid: uid(), nome, categoria, espacos, dt: p.dt, penalidade: p.penalidade, exigidas: p.acoes, feitas: 0, qtd: p.quantidade, improviso: p.improviso });
      fecharModal(); salvar();
    },
    'avancar-fabricacao': async el => {
      const ficha = f(), p = ficha.projetosFabricacao[Number(el.dataset.i)], per = derivar(ficha).PER.profissao;
      if (!p || !per.grau) return;
      if (p.feitas < p.exigidas) {
        if (ficha.interludio.acoes.length >= 2) return ctx.avisar('Sem ações de interlúdio disponíveis.');
        ficha.interludio.acoes.push('manutencao');
        p.feitas++; salvar(); return;
      }
      if (ficha.itens.length >= 120) return ctx.avisar('O inventário está cheio.');
      ficha.projetosFabricacao = ficha.projetosFabricacao.filter(x => x.uid !== p.uid);
      salvar();
      proxima.dt = String(p.dt);
      let resultado;
      try { resultado = await rolarTesteUI({ titulo: `Fabricar · ${p.nome}`, quem: quem(), dados: per.dados, bonus: per.bonus + p.penalidade }); }
      finally { proxima.dt = ''; }
      if (resultado.total >= p.dt) {
        ficha.itens.push({ uid: uid(), nome: p.nome, categoria: p.categoria, espacos: p.espacos, qtd: p.qtd,
          mods: [], expiraCena: p.improviso, nota: p.improviso ? 'Improvisado, dura uma cena.' : 'Fabricado em campo.' });
        salvar();
      }
    },
    'interludio-reiniciar': () => { f().interludio.acoes = []; salvar(); },
    'interludio-acao': async el => {
      const ficha = f(), id = el.dataset.id;
      if (!Object.hasOwn(ACOES_INTERLUDIO, id) || ficha.interludio.acoes.length >= 2 || (id === 'relaxar' && ficha.interludio.acoes.includes(id))) return;
      const d = derivar(ficha);
      if (['dormir', 'relaxar'].includes(id) && ficha.itens.some(i => i.nome === 'Dedo Decepado' && i.ativo && i.qtd && i.diasVestido >= 7)) {
        ficha.interludio.acoes.push(id); salvar();
        const risco = await rolarDanoUI({ titulo: 'Dedo Decepado · descanso', quem: quem(), formula: '1d4', rotulo: 'EFEITO' });
        if (risco?.total === 1) return ctx.avisar('O Dedo Decepado impediu a recuperação deste descanso.', true);
      } else ficha.interludio.acoes.push(id);
      const qualidade = ficha.interludio.descanso - (temPeso(ficha, 'sono') ? 1 : 0);
      const qtd = Math.floor(d.limitePE * ([0.5, 1, 2, 3][qualidade] ?? 0));
      const recuperar = (k, max) => { ficha.recursos[k] = Math.min(max, d.atual[k] + qtd); };
      if (id === 'dormir') { recuperar('pv', d.pv); recuperar(d.pd ? 'pd' : 'pe', d.pd ? d.pdMax : d.pe); if (ficha.recursos.pv > 0) ficha.recursos.morrendo = 0; }
      if (id === 'relaxar') recuperar(d.pd ? 'pd' : 'san', d.pd ? d.pdMax : d.san);
      salvar();
      ctx.avisar(['dormir', 'relaxar'].includes(id) ? `${ACOES_INTERLUDIO[id]} · recuperação de até ${qtd} por recurso.` : `${ACOES_INTERLUDIO[id]} registrada.`);
    },
    'novo-turno': () => {
      if (f().turnoManualIniciado) encerrarTurno(f());
      iniciarTurno(f());
      f().turnoManualIniciado = true;
      const resumo = resolverCondicoesDoTurno(f(), derivar);
      salvar();
      ctx.avisar(resumo.join(' ') || 'Novo turno. Limite de gasto reiniciado.');
    },
    'fim-cena': () => { fimDeCena(f()); salvar(); ctx.avisar('Cena encerrada.'); },
    'dormir-antecipar': () => { const ficha = f(); const perde = ficha.paranormais.some(p => p.id === 'antecipar-vitalidade' && p.afinidade) ? 2 : 1; ficha.cargasAntecipacao = Math.max(0, ficha.cargasAntecipacao - perde); salvar(); ctx.avisar(`Dormiu sem recuperar PV e perdeu ${perde} carga(s).`); },
    // ----- Poderes paranormais -----
    'transcender': () => {
      const ficha = f(), d = derivar(ficha);
      const pendente = ficha.poderes.some(p => p.id === 'transcender' && !p.escolha);
      if (!pendente && !viaPoder(ficha, d, PODER.transcender)) return ctx.avisar('Não há vaga para Transcender.', true);
      janelaParanormal(ficha, d, 'transcender');
    },
    'janela-paranormal': el => janelaParanormal(f(), derivar(f()), el.dataset.fonte || 'outro'),
    'escolher-conexao': () => janelaEscolha({ titulo: 'Conexão elemental (NEX 50%)', ordenar: false,
      intro: 'Ao chegar em NEX 50%, você se conecta a uma entidade (Livro de Regras p. 124). A escolha não muda depois. A afinidade se desenvolve no próximo poder paranormal que você receber.',
      opcoes: ELEMENTOS_OPCOES.map(([v, n, x]) => ({ valor: v, nome: n, desc: x, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)' })),
      aoEscolher: v => { const ficha = f(); ficha.elementoAfinidade = v; ficha.afinidadeAtiva = false; fecharModal(); salvar(); ctx.avisar(`Conectado a ${v}.`); } }),
    'add-paranormal': el => {
      const ficha = f(), def = PODER_PARANORMAL[el.dataset.id];
      if (!def) return;
      let escolha = '';
      if (def.escolheElemento && !el.dataset.escolha) return janelaEscolha({ titulo: 'Resistir a Elemento', intro: 'Escolha o elemento: você recebe resistência 10 contra ele (20 com afinidade). Conta como poder desse elemento.',
        opcoes: ELEMENTOS_OPCOES.map(([v, n, x]) => ({ valor: n, nome: n, desc: x, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)' })),
        aoEscolher: n => acoesFicha(ctx)['add-paranormal']({ dataset: { ...el.dataset, escolha: n } }) });
      if (el.dataset.escolha) escolha = el.dataset.escolha;
      if (def.id === 'aprender-ritual' && ficha.paranormais.filter(p => p.id === def.id).length >= ficha.atributos.int) return ctx.avisar('O limite de Aprender Ritual é o Intelecto.', true);
      const fonte = el.dataset.fonte || 'outro';
      let registro;
      if (fonte === 'transcender') {
        registro = ficha.poderes.findLast(p => p.id === 'transcender' && !p.escolha);
        if (!registro) {
          if (!viaPoder(ficha, derivar(ficha), PODER.transcender)) return ctx.avisar('Não há vaga para Transcender.', true);
          registro = { id: 'transcender', escolha: '', uid: uid(), via: viaPoder(ficha, derivar(ficha), PODER.transcender) === 'trilha' ? 'trilha' : '' };
          ficha.poderes.push(registro);
        }
        registro.escolha = def.nome;
      }
      ficha.paranormais.push({ uid: uid(), id: def.id, escolha, circuloAprender: def.id === 'aprender-ritual' ? circuloDeAprender(derivar(ficha).nexAtual) : 0, afinidade: el.dataset.afinidade === '1', fonte, transcenderUid: registro?.uid || '' });
      const desenvolveu = !!ficha.elementoAfinidade && !ficha.afinidadeAtiva && derivar(ficha).nexAtual >= 50; // LR p. 110: transcende sempre que recebe um poder paranormal
      if (desenvolveu) ficha.afinidadeAtiva = true;
      fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`${def.nome}${el.dataset.afinidade === '1' ? ' (afinidade)' : ''} adicionado.${desenvolveu ? ` Você transcendeu e desenvolveu afinidade com ${ficha.elementoAfinidade}.` : ''}`);
      if (def.acao === 'aprender-ritual') { ctx.estado.ui.aba = 'rituais'; ctx.render(); ctx.avisar('Aprender Ritual: marque o ritual na lista do Grimório.'); }
      if (def.id === 'expansao-de-conhecimento') janelaOutraClasse(ctx, f(), 'Expansão de Conhecimento');
    },
    'remover-paranormal': el => {
      const ficha = f(), i = Number(el.dataset.i), p = ficha.paranormais[i];
      if (!p || !confirm(`Remover "${PODER_PARANORMAL[p.id].nome}"?`)) return;
      const porRegistro = registrosTranscender(ficha);
      const registro = ficha.poderes.find(t => porRegistro.get(t.uid) === p);
      if (registro) registro.escolha = '';
      ficha.paranormais.splice(i, 1); salvar();
    },
    'ativo': el => { const ficha = f(); ficha.ativos[el.dataset.k] = !ficha.ativos[el.dataset.k]; salvar(); },
    'rolar-atributo': el => { const d = derivar(f()); const a = ATRIBUTOS.find(x => x.id === el.dataset.atr); const aj = d.ajusteDados[a.id] + d.ajusteDados.todos; const n = f().atributos[a.id] + aj; testar({ titulo: a.nome, quem: quem(), dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2 - n, pior: true }, bonus: a.id === 'pre' && temPeso(f(), 'rabugento') ? -5 : 0 }, a.id).then(() => danoDaIdade(a.id)); },
    'rolar-iniciativa': () => { const d = derivar(f()); testar({ titulo: 'Iniciativa', quem: quem(), dados: d.iniciativa.dados, bonus: d.iniciativa.bonus }, d.iniciativa.atrUsado); },
    'adicionar-pacote': el => {
      const ficha = f();
      const a = derivar(ficha).ataques[Number(el.dataset.i)];
      const arma = ficha.armas.find(x => x.uid === a?.uid);
      if (!arma || !temOpcional(ficha, 'municao')) return;
      janelaEscolha({ titulo: 'Munição da mochila', intro: 'Escolha um pacote compatível para acrescentar 20 disparos à reserva.',
        opcoes: ficha.itens.filter(i => i.qtd > 0).map(i => ({ valor: i.uid, nome: i.nome, desc: `${i.qtd} unidade(s)` })),
        aoEscolher: uidItem => {
          if (!moverPacoteParaReserva(ficha, arma, ficha.itens.find(i => i.uid === uidItem))) return ctx.avisar('Pacote incompatível ou indisponível.', true);
          fecharModal(); salvar();
        } });
    },
    'revisar-origem-idade': () => {
      const ficha = f(), limite = faixaEtaria(ficha)?.origem;
      const origem = ORIGEM[ficha.origem];
      if (!limite || !origem) return ctx.avisar('Escolha uma origem de catálogo para revisar seus benefícios.');
      const ids = ficha.treinoOrigem ?? origem.pericias;
      const seguranca = ficha.treinoOrigem ? '' : '<p>Ficha antiga. As perícias atuais serão preservadas. Revise seus graus na aba Agente se um treino veio exclusivamente da origem.</p>';
      abrirModal('Benefícios da origem', `${seguranca}<p>Marque exatamente ${limite} benefício(s).</p>
        ${[['0', PERICIA[ids[0]]?.nome || 'Primeira perícia de origem'], ['1', PERICIA[ids[1]]?.nome || 'Segunda perícia de origem'], ['poder', origem.poder]].map(([id, nome]) => `<label class="check"><input type="checkbox" data-origem-idade="${id}" ${ficha.beneficiosOrigem.includes(id) ? 'checked' : ''}><span>${esc(nome)}</span></label>`).join('')}`,
        '<button class="btn sangue" data-acao="salvar-origem-idade">Aplicar benefícios</button>');
    },
    'salvar-origem-idade': () => {
      const ficha = f(), limite = faixaEtaria(ficha)?.origem;
      const ids = [...document.querySelectorAll('[data-origem-idade]:checked')].map(x => x.dataset.origemIdade);
      if (!limite || ids.length !== limite) return ctx.avisar(`Escolha ${limite} benefício(s).`, true);
      if (ficha.treinoOrigem) {
        ficha.treinoOrigem.forEach((id, i) => {
          if (!id) return;
          if (ids.includes(String(i))) ficha.pericias[id] = Math.max(1, ficha.pericias[id] || 0);
          else if (!(ficha.pericias[id] > 1) && !ficha.treinoOutrasFontes.includes(id)
            && !ficha.treinoOrigem.some((x, j) => x === id && ids.includes(String(j)))) delete ficha.pericias[id];
        });
      }
      ficha.beneficiosOrigem = ids; fecharModal(); salvar();
    },
    'recarregar': el => {
      const calc = derivar(f()).ataques[Number(el.dataset.i)], arma = f().armas.find(a => a.uid === calc?.uid);
      if (!arma || !temOpcional(f(), 'municao')) return;
      const qtd = Math.max(0, Math.min(arma.reserva, arma.capacidade - arma.carregada));
      if (!qtd) return ctx.avisar('Carregador cheio ou reserva vazia.');
      arma.carregada += qtd; arma.reserva -= qtd; salvar();
      ctx.avisar(`Recarregou ${qtd} unidades de munição.`);
    },
    'rolar-ataque': el => {
      const d0 = derivar(f()), i = Number(el.dataset.i), a = d0.ataques[i];
      if (!ataqueValido(a)) return;
      const ops = opcoesGasto(f(), d0, { tipo: 'ataque', i });
      if (ops.length) return janelaGasto(f(), d0, { tipo: 'ataque', i }, ops);
      consumirDisparo(a);
      testar({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, gruposCritico: a.gruposCritico, tipo: 'ataque', formulaDano: a.formula }, d0.PER[a.pericia].atrUsado).then(() => { danoDaIdade(d0.PER[a.pericia].atrUsado); consumirProximas(ctx); ctx.render(); });
    },
    'rolar-dano': el => { const a = derivar(f()).ataques[Number(el.dataset.i)]; rolarDanoUI({ titulo: `Dano · ${a.nome}`, quem: quem(), formula: a.formula }); },
    'ritual-aprender': el => {
      const ficha = f(); const r = RITUAIS.find(x => x.id === el.dataset.id); if (!r) return;
      const problema = problemaAoAprender(ficha, derivar(ficha), r);
      if (problema) return ctx.avisar(problema, true);
      const novo = adicionarRitualCatalogo(ficha, r);
      const n = normalizar(ficha); Object.assign(ficha, n); ctx.salvarFicha(ficha); fecharModal();
      if (novo) ctx.avisar(`Ritual "${r.nome}" adicionado aos conhecidos.`);
      ctx.render();
    },
    'ritual-substituir': el => {
      const ficha = f(), ritual = RITUAIS.find(r => r.id === el.dataset.id);
      const poder = ficha.paranormais.find(p => p.id === 'aprender-ritual' && !p.trocaRitualUsada);
      if (!ritual || !poder) return;
      const candidatos = ficha.rituais.filter(anterior => {
        if (anterior.proprio || ritual.ritualExigido === anterior.nome) return false;
        if (ficha.rituais.some(r => RITUAIS.find(x => x.id === r.idCatalogo)?.ritualExigido === anterior.nome)) return false;
        const teste = { ...ficha, rituais: ficha.rituais.filter(r => r.uid !== anterior.uid) };
        return !problemaAoAprender(teste, derivar(teste), ritual);
      });
      if (!candidatos.length) return ctx.avisar('Nenhuma troca atende às vagas e requisitos do novo ritual.', true);
      janelaEscolha({ titulo: 'Qual ritual substituir?', opcoes: candidatos.map(r => ({ valor: r.uid, nome: r.nome })),
        aoEscolher: id => {
          const teste = { ...ficha, rituais: ficha.rituais.filter(r => r.uid !== id) };
          if (poder.trocaRitualUsada || teste.rituais.length === ficha.rituais.length || problemaAoAprender(teste, derivar(teste), ritual)) return;
          if (!adicionarRitualCatalogo(teste, ritual)) return;
          poder.trocaRitualUsada = true;
          Object.assign(ficha, normalizar(teste)); fecharModal(); salvar();
        } });
    },
    'ritual-catalogo-esquecer': el => {
      const ficha = f(); const r = RITUAIS.find(x => x.id === el.dataset.id); if (!r) return;
      ficha.rituais = ficha.rituais.filter(x => chaveRitual(x) !== chaveRitual(r));
      const n = normalizar(ficha); Object.assign(ficha, n); ctx.salvarFicha(ficha); fecharModal();
      ctx.avisar(`Ritual "${r.nome}" removido dos conhecidos.`);
      ctx.render();
    },
    'rolar-efeito': el => { rolarDanoUI({ titulo: `${el.dataset.nome} · ${el.dataset.formula}`, quem: quem(), formula: el.dataset.formula, rotulo: el.dataset.rotulo || 'DADOS' }); },
    'presenca-dano': async () => {
      await rolarDanoUI({ titulo: 'Presença do Medo · dano mental', quem: quem(), formula: '5d8', rotulo: 'DANO' });
      await rolarDanoUI({ titulo: 'Presença do Medo · dano de Medo', quem: quem(), formula: '5d8', rotulo: 'DANO' });
      ctx.avisar('Vontade reduz os dois danos à metade. Repita no início do turno dos alvos que estiverem na área.');
    },
    'rolar-ritual-previa': el => { const r = RITUAIS.find(x => x.id === el.dataset.id); if (r?.dados) rolarDanoUI({ titulo: `${r.nome} (prévia)`, quem: quem(), formula: r.dados, rotulo: r.tipoDados === 'cura' ? 'CURA' : 'DANO' }); },
    'capturar-explodir': el => {
      if (!f().rituais.some(r => r.idCatalogo === 'capturar-momento')) return;
      if (el.dataset.forma === 'verdadeiro' && derivar(f()).circuloMax < 3) return ctx.avisar('A forma verdadeira exige 3º círculo.', true);
      const formula = el.dataset.forma === 'verdadeiro' ? '8d8' : '4d8';
      return rolarDanoUI({ titulo: 'Capturar Momento · explosão de Morte (Fortitude reduz à metade)', quem: quem(), formula, rotulo: 'DANO' });
    },
    'rolar-ritual': el => { const i = Number(el.dataset.i), r = derivar(f()).rituais[i]; const cat = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {}; rolarDanoUI({ titulo: r.nome, quem: quem(), formula: r.formulaFinal || r.formula, rotulo: cat.tipoDados === 'cura' ? 'CURA' : 'DANO' }); },
    'sustentar-ritual': el => {
      const ficha = f(), d = derivar(ficha), r = d.rituais[Number(el.dataset.i)];
      if (!r || !/sustentad/i.test(r.duracao)) return;
      const custo = 1 + d.custoCondicao;
      if (!gastar(ficha, d, custo, d.limiteRitual, 0)) return ctx.avisar('Sem recurso ou limite de gasto para sustentar.', true);
      salvar(); ctx.avisar(`Sustentou ${r.nome} neste turno.`);
    },
    'conjurar': el => {
      const d = derivar(f());
      if (d.semAcoes) return ctx.avisar('As condições atuais impedem a conjuração.', true);
      janelaConjurar(ctx, f(), d, Number(el.dataset.i));
    },
    'conjurar-confirmar': async el => {
      const ficha = f(), d = derivar(ficha), i = Number(el.dataset.i), r = d.rituais[i], k = d.pd ? 'pd' : 'pe', K = k.toUpperCase();
      if (!r || d.semAcoes) return ctx.avisar('A conjuração está indisponível.', true);
      const alvoMental = document.getElementById('conj-recurso')?.value === 'mental';
      const forma = document.querySelector('[name="conj-forma"]:checked');
      const catR = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {};
      const alvoId = ritualDeToque(r, catR) ? '' : document.getElementById('conj-alvo')?.value;
      const formaId = forma?.value || 'basica';
      const avancada = formaId !== 'basica' ? catR[formaId] : null;
      if (formaId !== 'basica' && (!avancada || avancada.circulo > d.circuloMax ||
        (avancada.afinidade && !(r.elementos?.length ? r.elementos : [r.elemento]).every(el => el === d.afinidade)))) {
        return ctx.avisar('Pré-requisitos da forma avançada não cumpridos.', true);
      }
      let custo = r.custo + d.custoCondicao + (avancada?.custo || 0) + inteiro(document.getElementById('conj-outro')?.value, 0, 50, 0);
      document.querySelectorAll('[id^="conj-"][data-custo]').forEach(c => { if (c.checked) custo += Number(c.dataset.custo); });
      const dtVontade = inteiro(document.getElementById('conj-vontade')?.value, 0, 99, 0);
      if (ficha.gastoTurno + custo > d.limiteRitual) return ctx.avisar(`Limite do turno: ${d.limiteRitual} ${K} para conjurar.`, true);
      if (document.getElementById('conj-flagelo')?.checked) { const pv = custo * 2; if (d.atual.pv <= pv) return ctx.avisar('PV insuficientes.', true); ficha.recursos.pv = d.atual.pv - pv; ficha.gastoTurno += custo; }
      else if (!gastar(ficha, d, custo, d.limiteRitual, 0)) return ctx.avisar(`${K} insuficiente (precisa de ${custo}).`, true);
      ctx.salvarFicha(ficha); fecharModal(); ctx.render();
      const nomeForma = forma?.value === 'discente' ? ' (discente)' : forma?.value === 'verdadeiro' ? ' (verdadeira)' : '';
      const formulaD = formulaDaForma(r.nome, forma?.value, r.formula, r.formulaFinal);
      const rotuloD = catR.tipoDados === 'cura' ? 'CURA' : 'DANO';
      const rolarFormula = (alvo = '') => rolarDanoUI({
        titulo: `${r.nome}${nomeForma} · ${alvo || (rotuloD === 'CURA' ? 'cura' : 'dano')}`,
        quem: ficha.nome, formula: formulaD, rotulo: rotuloD,
      });
      const aplicarAoAlvo = async () => {
        const alvo = alvoId ? alvoDeFicha(ctx, alvoId) : null;
        if (!alvo) {
          if (formulaD) await rolarFormula();
          return;
        }
        const perfil = perfilRitual(catR.id, formaId);
        if (perfil?.exigeAtaque) {
          if (formulaD) await rolarFormula(alvo.nome);
          return ctx.avisar('A forma discente de Decadência exige acertar com uma arma. Some o dano do ritual após confirmar o acerto.');
        }
        const resistencia = r.resistencia.toLowerCase();
        if (!perfil && (formaId !== 'basica' || !/^(fortitude|reflexos|vontade) (reduz|anula|evita)/.test(resistencia))) {
          if (formulaD) await rolarFormula(alvo.nome);
          return ctx.avisar('Resolva a resistência e os demais efeitos conforme a descrição desta forma.');
        }
        const id = perfil ? perfil.teste : resistencia.split(' ')[0];
        const da = derivar(alvo), p = da.PER[id];
        let passou = false;
        if (p && !(id === 'reflexos' && da.reflexosFalha)) {
          proxima.dt = String(r.dt);
          try { passou = (await rolarTesteUI({ titulo: `${p.nome} · ${alvo.nome}`, quem: alvo.nome, dados: p.dados, bonus: p.bonus })).total >= r.dt; }
          finally { proxima.dt = ''; }
        }
        if (passou && !perfil && /anula|evita/.test(resistencia)) return ctx.avisar(`${alvo.nome} resistiu ao ritual.`);
        const atual = alvoDeFicha(ctx, alvoId) || alvo;
        const defesa = derivar(atual);
        const condicao = passou ? perfil?.condicaoNoSucesso : perfil?.condicao;
        let mensagem = condicao ? CONDICOES.find(c => c.id === condicao)?.nome : '';
        if (condicao) {
          adicionarCondicao(atual, condicao);
          if (perfil.turnos) atual.prazosCondicao[condicao] = Math.max(atual.prazosCondicao[condicao] || 0, perfil.turnos);
        }
        if (formulaD) {
          const resultado = await rolarFormula(alvo.nome);
          if (!resultado) return;
          const metade = passou && (perfil?.sucesso === 'metade' || !perfil) ? 1 : 0;
          if (rotuloD === 'CURA') {
            recuperar(atual, defesa, 'pv', resultado.total);
            if (perfil?.envelhece && /^\d+$/.test(atual.idade.trim())) atual.idade = String(Number(atual.idade) + 1);
            mensagem = `${resultado.total} de cura${perfil?.envelhece ? ' e +1 ano de idade' : ''}`;
          } else {
            const tipo = !perfil && alvoMental ? 'mental' : 'pv';
            const dano = sofrerDano(atual, defesa, resultado.total, { tipo, metade, rd: tipo === 'mental' ? defesa.rdMental : defesa.rd });
            mensagem = [`${dano.total} de dano`, mensagem].filter(Boolean).join(' · ');
          }
        }
        ctx.salvarFicha(atual); ctx.render(); ctx.avisar(`${alvo.nome}: ${mensagem || 'sem efeito'}.`);
      };
      const presencaMedo = catR.id === 'presenca-do-medo';
      const capturar = catR.id === 'capturar-momento';
      const temResolucao = !!(alvoId || formulaD || r.rolagemExtra || presencaMedo || capturar);
      const resolver = async () => {
        if (capturar) ctx.avisar(formaId === 'basica' ? 'Símbolo criado para captar imagens e sons.' : 'Símbolo criado. Use a rolagem da forma correspondente quando decidir explodi-lo na mesa.');
        else if (presencaMedo) await acoesFicha(ctx)['presenca-dano']();
        else if (alvoId && catR.id !== 'capturar-momento') await aplicarAoAlvo();
        else if (formulaD) await rolarFormula();
        if (r.rolagemExtra) await rolarDanoUI({ titulo: `${r.nome}${nomeForma} · rolagem do efeito`, quem: ficha.nome, formula: r.rolagemExtra, rotulo: 'EFEITO' });
      };
      // concentração
      if (dtVontade) { const pv = d.PER.vontade; const t = await rolarTesteUI({ titulo: `Concentração · ${r.nome}`, quem: quem(), dados: pv.dados, bonus: pv.bonus }); if (t.total < dtVontade) { ctx.avisar(`Falhou na concentração (${t.total} < ${dtVontade}): o ritual não funciona e os ${K} foram perdidos.`, true); return; } }
      // O Custo do Paranormal (menos Medo)
      if (r.elemento !== 'medo') {
        const oc = d.PER.ocultismo, dt = 20 + custo;
        const armadura = ficha.protecoes.filter(p => p.vestida).some(p => p.peso === 'pesada') ? -2 : ficha.protecoes.filter(p => p.vestida).some(p => p.peso === 'leve') ? -1 : 0;
        const base = oc.dados.pior ? 2 - oc.dados.qtd : oc.dados.qtd, q = base + armadura;
        proxima.dt = String(dt);
        const t = await testar({ titulo: `Custo do Paranormal · ${r.nome}${nomeForma}`, quem: quem(), dados: q >= 1 ? { qtd: q, pior: false } : { qtd: 2 - q, pior: true }, bonus: oc.bonus }, oc.atrUsado, ficha, dt);
        proxima.dt = '';
        if (t.total < dt) {
          const fx = ficha, dx = derivar(fx); const perm = t.total <= dt - 5;
          if (dx.pd) fx.recursos.pd = dx.atual.pd - custo; else fx.recursos.san = dx.atual.san - custo;
          if (perm) {
            fx.penalidadeSanPermanente++;
            if (dx.pd) fx.recursos.pd--; else fx.recursos.san--;
          }
          ctx.salvarFicha(fx); ctx.render();
          ctx.avisar(`Falhou no Ocultismo (${t.total} < ${dt}): −${custo} ${dx.pd ? 'PD' : 'Sanidade'}${perm ? ' e −1 de Sanidade permanente' : ''}. O ritual funciona mesmo assim.`, true);
          if (temResolucao) oferecerEfeitoRitual(t, resolver);
          return;
        }
        ctx.avisar(`${r.nome}${nomeForma} conjurado: −${custo} ${K}. Passou no Ocultismo (${t.total}).`);
      } else {
        const fx = ficha, dx = derivar(fx);
        const perda = forma?.value === 'verdadeiro' ? 3 : forma?.value === 'discente' ? 2 : 1;
        const recurso = dx.pd ? 'pd' : 'san';
        fx.recursos[recurso] = dx.atual[recurso] - custo - perda;
        fx.penalidadeSanPermanente += perda;
        ctx.salvarFicha(fx); ctx.render();
        ctx.avisar(`${r.nome}${nomeForma}: −${custo} ${K} de conjuração e −${custo} ${recurso.toUpperCase()}, mais ${perda} permanente.`);
      }
      if (temResolucao) await resolver();
    },
    'esquecer-ritual': el => { const ficha = f(); const r = ficha.rituais[Number(el.dataset.i)]; if (!confirm(`Esquecer o ritual "${r.nome}"?`)) return; ficha.rituais.splice(Number(el.dataset.i), 1); salvar(); },
    'aplicar-dano': el => {
      const ficha = f(), d = derivar(ficha), rec = el.dataset.rec; let q = inteiro(document.getElementById('dano-qtd')?.value, 0, 99999, 0);
      const rd = document.getElementById('dano-aplicar-rd')?.checked ? (rec === 'pv' ? d.rd : d.rdMental) : 0;
      q = Math.max(0, q - rd);
      const novo = sofrerDano(ficha, d, q, { tipo: rec === 'pv' ? 'pv' : 'mental' }).atual;
      ficha.recursos[rec] = novo; fecharModal(); salvar();
      if (rec === 'pv' && q > 0) { document.body.classList.remove('levou-dano'); void document.body.offsetWidth; document.body.classList.add('levou-dano'); setTimeout(() => document.body.classList.remove('levou-dano'), 750); }
      ctx.avisar(`Dano: ${q}${rd ? ` (RD ${rd})` : ''}.`);
    },
    'gladiador': () => { const ficha = f(), d = derivar(ficha); const ganho = ficha.usosCena.gladiador || 0; if (ganho >= d.limitePE) return ctx.avisar('Limite de PE temporários do Gladiador nesta cena atingido.'); const g = Math.min(2, d.limitePE - ganho); ficha.recursos.peTemp += g; ficha.usosCena.gladiador = ganho + g; salvar(); ctx.avisar(`Gladiador Paranormal: +${g} PE temporários.`); },
    'rec-mudar': el => {
      const ficha = f(), d = derivar(ficha), k = el.dataset.rec, inp = document.getElementById('qtd-' + k);
      const q = inteiro(inp?.value, 0, 9999, 0); if (!q) { inp?.focus(); return; }
      if (Number(el.dataset.sinal) < 0 && (k === 'pv' || k === 'san' || (k === 'pd' && d.rdMental))) {
        const temReducao = k === 'pv' ? d.rd : d.rdMental;
        if (temReducao) return janelaDano(d, q, k);
      }
      const max = { pv: d.pv, pe: d.pe, san: d.san, pd: d.pdMax }[k];
      const novo = d.atual[k] + q * Number(el.dataset.sinal);
      if (Number(el.dataset.sinal) < 0 && ['pv', 'san', 'pd'].includes(k)) sofrerDano(ficha, d, q, { tipo: k === 'pv' ? 'pv' : 'mental' });
      else ficha.recursos[k] = Math.min(max, novo);
      if (k === 'pv' && Number(el.dataset.sinal) < 0) { document.body.classList.remove('levou-dano'); void document.body.offsetWidth; document.body.classList.add('levou-dano'); setTimeout(() => document.body.classList.remove('levou-dano'), 750); }
      if (k === 'pv' && ficha.recursos.pv > 0) ficha.recursos.morrendo = 0;
      if (k === 'san' && ficha.recursos.san > 0) ficha.recursos.enlouquecendo = 0;
      salvar();
    },
    'rec-cheio': el => { const ficha = f(); ficha.recursos[el.dataset.rec] = null; if (el.dataset.rec === 'pv') ficha.recursos.morrendo = 0; salvar(); },
    'contador': el => { const ficha = f(); ficha.recursos[el.dataset.c] = Math.min(3, ficha.recursos[el.dataset.c] + 1); salvar(); if (ficha.recursos[el.dataset.c] >= 3) ctx.avisar(el.dataset.c === 'morrendo' ? 'Três turnos morrendo: o agente morreu.' : 'Três turnos enlouquecendo: o agente ficou insano.', true); },
    'condicao': el => { const ficha = f(); const id = el.dataset.id; if (ficha.condicoes.includes(id)) {
        ficha.condicoes = ficha.condicoes.filter(c => c !== id);
        delete ficha.prazosCondicao[id];
      } else ficha.condicoes.push(id);
      salvar(); },
    'rolar-ferimento': () => { const ficha = f(); const n = d(6); const atr = FERIMENTOS[n - 1]; if (atr) { ficha.ferimentos.push(atr); salvar(); } ctx.avisar(`1d6 = ${n}: ${atr ? 'ferimento em ' + ATRIBUTOS.find(a => a.id === atr).nome : 'ferimento superficial (nenhum atributo)'}.`); },
    'remover': el => { const ficha = f(); const lista = ficha[el.dataset.lista]; const i = Number(el.dataset.i); const nome = lista[i]?.nome || ''; if (['poderes', 'protecoes', 'habilidadesProprias', 'itens'].includes(el.dataset.lista) && nome && !confirm(`Remover "${nome}"?`)) return; if (['armas', 'protecoes', 'itens'].includes(el.dataset.lista)) registrarMaldições(ficha);
    if (el.dataset.lista === 'poderes' && lista[i]?.id === 'transcender') {
      const associado = registrosTranscender(ficha).get(lista[i].uid);
      if (associado) ficha.paranormais = ficha.paranormais.filter(p => p !== associado);
    }
    lista.splice(i, 1); fecharModal(); salvar(); },
    'limites-padrao': () => { const ficha = f(); ficha.limitesItens = null; salvar(); },
    'exposicao': el => { const ficha = f(); const antes = ficha.nexExposicao; ficha.nexExposicao = Math.min(99, antes + Number(el.dataset.nex)); salvar(); ctx.avisar(`NEX ${antes}% → ${ficha.nexExposicao}%.`); },
    'subir-nivel': () => {
      const ficha = f();
      if (ficha.classe === 'mundano') return acoesFicha(ctx)['treinamento-especial']();
      if (ehSobrevivente(ficha)) { if (ficha.estagio >= 5) return ctx.avisar('Estágio máximo. Se a Ordem o recrutar, use o Treinamento Especial (aba Habilidades).'); ficha.estagio++; }
      else if (temOpcional(ficha, 'patentes')) {
        if (ficha.patenteManual) { if (ficha.patenteManual >= 5) return ctx.avisar('Já é agente de elite.'); ficha.patenteManual++; }
        else { const p = PATENTES.find(x => x.pp > ficha.pp); if (!p) return ctx.avisar('Já é agente de elite.'); ficha.pp = p.pp; }
        const pat = PATENTES[(ficha.patenteManual || PATENTES.filter(x => ficha.pp >= x.pp).at(-1).n) - 1];
        ficha.nexExposicao = Math.min(99, Math.max(ficha.nexExposicao, pat.limitePd * 5)); // NEX acompanha o nível equivalente da patente
      }
      else if (temOpcional(ficha, 'nivelExp')) { if (ficha.nivel >= 20) return; ficha.nivel++; ficha.nexExposicao = Math.min(99, Math.max(ficha.nexExposicao, ficha.nivel * 5)); }
      else { const i = NEX.indexOf(ficha.nex); if (i >= NEX.length - 1) return ctx.avisar('NEX 99% é o máximo.'); ficha.nex = NEX[i + 1]; }
      ficha.recursos.pv = ficha.recursos.pe = ficha.recursos.san = ficha.recursos.pd = null;
      salvar(); const dd = derivar(ficha); ctx.avisar(`Agora: ${dd.textoNivel}.`);
      abrirPendenciaDeNivel(ctx);
    },
    'aumento-atributo': () => janelaAumento(ctx),
    'grau-treinamento': () => janelaGrau(ctx),
    'pendencia': el => { const p = derivar(f()).pendencias.find(x => x.id === el.dataset.id); if (!p) return; if (p.acao) return acoesFicha(ctx)[p.acao]({ dataset: {} }); ctx.estado.ui.aba = p.aba; ctx.render(); },
    'editar-atributos': () => {
      const at = f().atributos;
      abrirModal('Atributos', `<p class="apagado">Use para aumentos de atributo (NEX 20%, 50%, 80%, 95%) ou correções.</p><div class="grade c3">${ATRIBUTOS.map(a => `<label class="campo"><span>${a.nome}</span><input type="number" min="0" max="7" data-modal-atr="${a.id}" value="${at[a.id]}"></label>`).join('')}</div>`, '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="salvar-atributos">Salvar</button>');
    },
    'salvar-atributos': () => { const ficha = f(); document.querySelectorAll('[data-modal-atr]').forEach(i => { ficha.atributos[i.dataset.modalAtr] = inteiro(i.value, 0, tetoEtario(ficha, i.dataset.modalAtr, 7), 1); }); fecharModal(); salvar(); },
    'retrato': async () => {
      const arq = await escolherArquivo('image/png,image/jpeg,image/webp'); if (!arq) return;
      try { f().retrato = await reduzirImagem(arq); salvar(); } catch (e) { ctx.avisar(e.message, true); }
    },
    'add-arma': () => {
      const ficha = f(); const prof = derivar(ficha).prof;
      abrirModal('Adicionar arma', `<div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${ARMAS.map((a, i) => [a, i]).filter(([a]) => a.fonte !== 'SaH' || f().modo === 'sah').sort((x, y) => x[0].nome.localeCompare(y[0].nome, 'pt')).map(([a, i]) => `<button class="cartao" data-acao="add-arma-catalogo" data-i="${i}"><b>${esc(a.nome)}</b><small class="dossie-txt">${a.dano} ${TIPOS_DANO[a.tipo] || ''} · ${a.margem < 20 ? a.margem + '/' : ''}×${a.mult} · cat. ${cat(a.categoria)}</small><small>${a.prof === 'simples' ? 'Simples' : a.prof === 'taticas' ? 'Tática' : 'Pesada'} · ${a.uso === 'corpo' ? 'corpo a corpo' : a.uso === 'fogo' ? 'arma de fogo' : 'disparo'}${(a.prof === 'taticas' && !prof.taticas) || (a.prof === 'pesadas' && !prof.pesadas) ? ' · <span style="color:var(--perigo)">sem proficiência</span>' : ''}</small></button>`).join('')}
        <button class="cartao" data-acao="add-arma-catalogo" data-i="-1"><b>Arma personalizada</b><small>Preencha os números você mesmo.</small></button></div>`, '', true);
    },
    'add-arma-catalogo': el => {
      const i = Number(el.dataset.i); const ficha = f();
      const base = i >= 0 ? { ...ARMAS[i] } : { nome: 'Arma improvisada', prof: 'simples', uso: 'corpo', categoria: 0, dano: '1d6', margem: 20, mult: 2, alcance: '—', tipo: 'I', espacos: 1 };
      ficha.armas.push({ ...base, uid: uid() }); fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      acoesFicha(ctx)['editar-arma']({ dataset: { i: String(ficha.armas.length - 1) } });
    },
    'editar-arma': el => {
      const i = Number(el.dataset.i), a = f().armas[i];
      const c = (k, rot, tipo = 'text', extra = '') => `<label class="campo"><span>${rot}</span><input type="${tipo}" data-modal-arma="${k}" value="${esc(a[k])}" ${extra}></label>`;
      const s = (k, rot, ops) => `<label class="campo"><span>${rot}</span><select data-modal-arma="${k}">${ops.map(([v, n]) => `<option value="${v}" ${String(a[k]) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
      abrirModal(`Arma · ${a.nome}`, `<div class="bloco-mod-topo">${cartoesMod(derivar(f()), 'arma', i, a, true)}</div><div class="grade c2">${c('nome', 'Nome')}${s('uso', 'Tipo de ataque', [['corpo', 'Corpo a corpo (Luta)'], ['arremesso', 'Arremesso (Pontaria + For no dano)'], ['disparo', 'Disparo (Pontaria)'], ['fogo', 'Arma de fogo (Pontaria)']])}
        ${s('prof', 'Proficiência', [['simples', 'Simples'], ['taticas', 'Tática'], ['pesadas', 'Pesada']])}${c('dano', 'Dano (ex.: 2d6)')}
        ${c('margem', 'Margem de ameaça', 'number', 'min="2" max="20"')}${c('mult', 'Multiplicador', 'number', 'min="2" max="6"')}
        ${c('bonusAtaque', 'Bônus no ataque', 'number')}${c('bonusDano', 'Bônus no dano', 'number')}
        ${s('categoria', 'Categoria', [[0, '0'], [1, 'I'], [2, 'II'], [3, 'III'], [4, 'IV']])}${c('espacos', 'Espaços', 'number', 'min="0" step="0.5"')}
        ${temOpcional(f(), 'municao') ? c('capacidade', 'Capacidade', 'number', 'min="0"') + c('carregada', 'Carregada', 'number', 'min="0"') + c('reserva', 'Reserva', 'number', 'min="0"') : ''}
        ${c('alcance', 'Alcance')}${s('tipo', 'Tipo de dano', Object.entries(TIPOS_DANO))}${c('municao', 'Munição')}
        <div style="grid-column:1/-1">
          <h3 class="titulo-vermelho">Ritual Amaldiçoar Arma ou maldição própria</h3><div class="grade c3"><label class="campo"><span>Maldição</span><select data-maldicao="tipo">${MALDICOES_ARMA.map(m => `<option value="${m.id}" ${a.maldicao?.tipo === m.id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></label>
          <label class="campo"><span>Elemento</span><select data-maldicao="elemento">${['', 'sangue', 'morte', 'conhecimento', 'energia'].map(e => `<option value="${e}" ${a.maldicao?.elemento === e ? 'selected' : ''}>${e ? e[0].toUpperCase() + e.slice(1) : '—'}</option>`).join('')}</select></label>
          <label class="campo"><span>Dano extra (ex.: 1d6)</span><input data-maldicao="dados" value="${esc(a.maldicao?.dados || '')}" placeholder="preenche sozinho"></label>
          <label class="campo" style="grid-column:1/-1"><span>Efeito da maldição</span><textarea data-maldicao="texto">${esc(a.maldicao?.texto || '')}</textarea></label></div></div>
        ${f().trilha === 'aniquilador' ? `<label class="check"><input type="checkbox" data-modal-arma-check="favorita" ${a.favorita ? 'checked' : ''}><span>Arma favorita (Aniquilador)</span></label>` : ''}
        ${ORIGEM[f().origem]?.id === 'operario' ? `<label class="check"><input type="checkbox" data-modal-arma-check="ferramenta" ${a.ferramenta ? 'checked' : ''}><span>Ferramenta de Trabalho (Operário): +1 ataque, dano e margem</span></label>` : ''}
        ${f().trilha === 'atirador' ? `<label class="check"><input type="checkbox" data-modal-arma-check="balasLongas" ${a.balasLongas ? 'checked' : ''}><span>Usa balas longas (Mira de Elite: +Intelecto no dano)</span></label>` : ''}${c('nota', 'Anotação (modificações, maldições…)')}</div>`,
        `<button class="btn perigo" data-acao="remover-arma" data-i="${i}">Remover</button><span class="espaco"></span><button class="btn sangue" data-acao="salvar-arma" data-i="${i}">Salvar</button>`, true);
    },
    'salvar-arma': el => {
      const ficha = f(), i = Number(el.dataset.i), a = { ...ficha.armas[i] };
      document.querySelectorAll('[data-modal-arma]').forEach(inp => { a[inp.dataset.modalArma] = inp.type === 'number' ? Number(inp.value) : inp.value; });
      document.querySelectorAll('[data-modal-arma-check]').forEach(inp => { a[inp.dataset.modalArmaCheck] = inp.checked; });
      const mal = {}; document.querySelectorAll('[data-maldicao]').forEach(x => { mal[x.dataset.maldicao] = x.value; });
      if (mal.tipo && !mal.dados) mal.dados = MALDICOES_ARMA.find(m => m.id === mal.tipo)?.dados || '';
      a.maldicao = mal;
      a.categoria = Number(a.categoria);
      ficha.armas[i] = normalizar({ ...ficha, armas: [a] }).armas[0]; fecharModal(); salvar();
    },
    'remover-arma': el => { const ficha = f(); if (!confirm('Remover esta arma?')) return; ficha.armas.splice(Number(el.dataset.i), 1); fecharModal(); salvar(); },
    'add-protecao': () => abrirModal('Adicionar proteção', `<div class="cartoes"><button class="cartao" data-acao="add-protecao-catalogo" data-i="-1"><b>Proteção personalizada</b><small>Preencha os números você mesmo.</small></button>${PROTECOES.map((p, i) => `<button class="cartao" data-acao="add-protecao-catalogo" data-i="${i}"><b>${esc(p.nome)}</b><small>Defesa +${p.defesa}${p.rd ? `, RD ${p.rd} (balístico, corte, impacto, perfuração)` : ''}${p.penalidade ? `, −${p.penalidade} nas perícias de carga` : ''} · cat. ${cat(p.categoria)} · ${p.espacos} esp.</small></button>`).join('')}</div>`),
    'add-protecao-catalogo': el => { const ficha = f(); const i = Number(el.dataset.i); const p = i >= 0 ? PROTECOES[i] : { nome: 'Proteção personalizada', peso: 'leve', defesa: 2, categoria: 0, espacos: 1 }; ficha.protecoes.push({ ...p, rd: p.rd || 0, vestida: true, mods: [], uid: uid() }); fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); acoesFicha(ctx)['editar-protecao']({ dataset: { i: String(ficha.protecoes.length - 1) } }); },
    'editar-protecao': el => {
      const i = Number(el.dataset.i), p = f().protecoes[i];
      const c = (k, rot, tipo = 'text') => `<label class="campo"><span>${rot}</span><input type="${tipo}" data-modal-prot="${k}" value="${esc(p[k])}"></label>`;
      abrirModal(`Proteção · ${p.nome}`, `<div class="bloco-mod-topo">${cartoesMod(derivar(f()), 'protecao', i, p, true)}</div><div class="grade c2">${c('nome', 'Nome')}<label class="campo"><span>Tipo</span><select data-modal-prot="peso">${[['leve', 'Leve'], ['pesada', 'Pesada'], ['escudo', 'Escudo']].map(([v, n]) => `<option value="${v}" ${p.peso === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        ${c('defesa', 'Defesa', 'number')}${c('rd', 'RD', 'number')}${c('categoria', 'Categoria (0–4)', 'number')}${c('espacos', 'Espaços', 'number')}${c('nota', 'Anotação / maldição / efeito especial')}</div>
`,
        `<button class="btn perigo" data-acao="remover" data-lista="protecoes" data-i="${i}">Remover</button><span class="espaco"></span><button class="btn sangue" data-acao="salvar-protecao" data-i="${i}">Salvar</button>`, true);
    },
    'salvar-protecao': el => { const ficha = f(), i = Number(el.dataset.i), p = { ...ficha.protecoes[i] }; document.querySelectorAll('[data-modal-prot]').forEach(x => { p[x.dataset.modalProt] = x.type === 'number' ? Number(x.value) : x.value; }); ficha.protecoes[i] = p; fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); },
    'add-item': () => { const ficha = f(); ficha.itens.push({ uid: uid(), nome: 'Novo item', categoria: 0, espacos: 1, qtd: 1, nota: '' }); salvar(); },
    'add-item-lista': () => {
      const ficha = f();
      const lista = ITENS_CATALOGO.map((it, i) => [it, i]).filter(([it]) => it.fonte !== 'SaH' || ficha.modo === 'sah');
      const grupos = [...new Set(lista.map(([it]) => it.grupo || 'Itens gerais'))];
      const cartao = ([it, i]) => `<button class="cartao" data-acao="add-item-catalogo" data-i="${i}" data-busca="${esc(semAcento(it.nome + ' ' + (it.resumo || '')))}"><b>${esc(it.nome)}</b>${fonteTag(it.fonte || '')}<small>${it.categoria == null ? (it.notaCategoria ? 'cat.: a do acessório +1' : 'cat. e espaços: confira no livro') : `cat. ${cat(it.categoria)} · ${it.espacos} esp.`}${it.pagina ? ` · SaH p. ${it.pagina}` : ''}</small>${it.resumo ? `<small class="apagado">${esc(it.resumo)}</small>` : ''}</button>`;
      abrirModal('Adicionar item', `<input type="search" placeholder="Procurar item…" data-filtro-modal autofocus aria-label="Procurar item" style="margin-bottom:10px">
        ${grupos.map(g => `<section class="grupo-itens"><h3 class="titulo-vermelho">${esc(g)}</h3><div class="cartoes">${lista.filter(([it]) => (it.grupo || 'Itens gerais') === g).sort((x, y) => x[0].nome.localeCompare(y[0].nome, 'pt')).map(cartao).join('')}</div></section>`).join('')}
`, '', true);
    },
    'add-item-catalogo': el => {
      const ficha = f(); const it = ITENS_CATALOGO[Number(el.dataset.i)]; if (!it) return;
      const incerto = it.categoria == null;
      const novo = { uid: uid(), mods: [], efeitos: [], nome: it.nome, categoria: incerto ? 0 : it.categoria, espacos: incerto ? 1 : it.espacos, qtd: 1, nota: incerto ? (it.notaCategoria || `Categoria e espaços: confira no livro (SaH p. ${it.pagina}).`) : '' };
      if (PASSIVOS_ITENS[it.nome]) novo.ativo = true;              // entra equipado: o efeito já vale
      if (['Utensílio', 'Vestimenta'].includes(it.nome)) novo.escrito = true;
      ficha.itens.push(novo);
      fecharModal(); salvar();
      if (novo.escrito) acoesFicha(ctx).acessorio({ dataset: { i: String(ficha.itens.length - 1) } }); // já pergunta a perícia
    },
    'item-equipar': el => {
      const ficha = f(), it = ficha.itens[Number(el.dataset.i)]; if (!it) return;
      if (tipoEquipar(it) === 'acessorio') it.escrito = !it.escrito;
      else { it.ativo = !it.ativo; if (it.ativo) registrarMaldições(ficha); }
      salvar();
      ctx.avisar(`${it.nome} ${estaEquipado(it) ? 'equipado: o efeito vale na ficha.' : 'desequipado: o efeito saiu da ficha.'}`);
    },
    'editar-para-mod': el => { // salva o que foi editado na janela e abre Modificar/Amaldiçoar
      acoesFicha(ctx)[el.dataset.tipo === 'arma' ? 'salvar-arma' : 'salvar-protecao']({ dataset: { i: el.dataset.i } });
      janelaMod(f(), el.dataset.tipo, Number(el.dataset.i), el.dataset.modo);
    },
    'janela-mod': el => janelaMod(f(), el.dataset.tipo, Number(el.dataset.i), el.dataset.modo),
    'alternar-mod': el => {
      const ficha = f(), { tipo, modo, id } = el.dataset, i = Number(el.dataset.i), alvo = alvoMod(ficha, tipo, i); if (!alvo) return;
      const campo = campoMod(tipo, modo), lista = [...(alvo[campo] || [])], k = lista.indexOf(id);
      if (k >= 0) lista.splice(k, 1);
      else {
        if (numerosAlvo(derivar(ficha), tipo, alvo).cat >= 4) return ctx.avisar('Este item já está na categoria IV: tire uma modificação ou maldição antes.', true);
        lista.push(id);
      }
      alvo[campo] = lista;
      if (modo === 'amaldicoar' && k < 0) registrarMaldições(ficha);
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      janelaMod(f(), tipo, i, modo);
    },
    'item-escolher': (el, ev) => { ev?.preventDefault(); acoesFicha(ctx).acessorio(el); },
    'item-efeito': el => {
      const i = Number(el.dataset.i), item = f().itens[i]; if (!item) return;
      const valor = (tipo, alvo, nome) => janelaEscolha({ titulo: `${item.nome}: ${nome}`, intro: 'Quanto o item soma (+) ou diminui (−)?', ordenar: false, busca: false, largo: false,
        opcoes: [5, 4, 3, 2, 1, -1, -2, -3, -4, -5].map(v => ({ valor: String(v), nome: comSinal(v) })),
        aoEscolher: v => { const ficha = f(), it = ficha.itens[i]; it.efeitos = [...(it.efeitos || []), { tipo, alvo, valor: Number(v) }].slice(0, 6); it.ativo = true; fecharModal(); salvar(); ctx.avisar(`${it.nome}: ${descreverEfeitosItem([{ tipo, alvo, valor: Number(v) }])} (equipado).`); } });
      janelaEscolha({ titulo: `${item.nome}: efeito na ficha`, intro: 'O que este item muda? Depois você escolhe o valor. O efeito só vale com o item equipado.', ordenar: false, busca: false, largo: false,
        opcoes: TIPOS_EFEITO_ITEM.map(t => ({ valor: t, nome: ROTULO_EFEITO[t] })),
        aoEscolher: tipo => {
          if (tipo === 'pericia') return janelaEscolha({ titulo: `${item.nome}: perícia`, opcoes: PERICIAS.map(p => ({ valor: p.id, nome: p.nome })), aoEscolher: id => valor('pericia', id, PERICIA[id].nome) });
          if (tipo === 'atributo') return janelaEscolha({ titulo: `${item.nome}: atributo`, ordenar: false, busca: false, largo: false, opcoes: ATRIBUTOS.map(a => ({ valor: a.id, nome: a.nome })), aoEscolher: id => valor('atributo', id, ATRIBUTOS.find(a => a.id === id).nome) });
          valor(tipo, '', ROTULO_EFEITO[tipo]);
        } });
    },
    'item-efeito-remover': el => {
      const it = f().itens[Number(el.dataset.i)]; if (!it) return;
      (it.efeitos || []).splice(Number(el.dataset.k), 1); salvar();
    },
    'acessorio': el => {
      const i = Number(el.dataset.i), item = f().itens[i]; if (!item) return;
      const pericias = (id, valor, nome) => `<label class="campo"><span>${nome}</span><select id="${id}"><option value="">—</option>${PERICIAS.filter(p => !['luta', 'pontaria'].includes(p.id)).map(p => `<option value="${p.id}" ${valor === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></label>`;
      // Só a perícia principal aparece de início; a da Função Adicional e a do kit (Instrumental) aparecem quando a modificação é marcada (CSS :has)
      const mods = item.mods || [];
      const mod = id => { const m = MOD_ACESSORIOS.find(x => x[0] === id); return m && (!['bateria', 'lente'].includes(id) || f().modo === 'sah') ? `<label class="check"><input type="checkbox" data-ac-mod="${id}" ${mods.includes(id) ? 'checked' : ''}><span><b>${m[1]}</b> · ${m[2]}</span></label>` : ''; };
      abrirModal(item.nome, `<p class="apagado">Escolha a perícia que este ${item.nome === 'Utensílio' ? 'utensílio' : item.nome === 'Vestimenta' ? 'item vestido' : 'acessório'} melhora: +2 (ou +5 com Aprimorado). Luta e Pontaria não valem.</p>
        ${pericias('ac-pericia', item.pericia, 'Perícia')}
        <label class="check"><input type="checkbox" id="ac-ativo" ${item.escrito ? 'checked' : ''}><span><b>Equipado</b> · o bônus só vale equipado</span></label>
        <details class="ac-mods" ${mods.length ? 'open' : ''}><summary>Modificações (opcional, cada uma aumenta a categoria em +1)</summary>
          ${mod('aprimorado')}${mod('discreto')}
          ${mod('funcao')}<div class="so-funcao">${pericias('ac-extra', item.periciaExtra, 'Perícia da função adicional')}${mod('aprimorado-extra')}</div>
          ${mod('instrumental')}<div class="so-instrumental">${pericias('ac-kit', item.periciaKit, 'Perícia do kit')}</div>
          ${mod('bateria')}${mod('lente')}
        </details>`,
        `<button class="btn sangue" data-acao="salvar-acessorio" data-i="${i}">Salvar acessório</button>`);
    },
    'salvar-acessorio': el => {
      const item = f().itens[Number(el.dataset.i)]; if (!item) return;
      item.escrito = document.getElementById('ac-ativo').checked;
      item.pericia = document.getElementById('ac-pericia').value;
      item.periciaExtra = document.getElementById('ac-extra').value;
      item.periciaKit = document.getElementById('ac-kit').value;
      item.mods = [...document.querySelectorAll('[data-ac-mod]:checked')].map(x => x.dataset.acMod);
      if (!item.mods.includes('funcao') || !item.periciaExtra || item.periciaExtra === item.pericia) item.mods = item.mods.filter(m => m !== 'aprimorado-extra');
      if (item.periciaExtra === item.pericia || !item.mods.includes('funcao')) item.periciaExtra = '';
      if (!item.mods.includes('instrumental')) item.periciaKit = '';
      fecharModal(); salvar();
    },
    'vincular-item': el => {
      const ficha = f(), item = ficha.itens[Number(el.dataset.i)];
      if (!item) return;
      if (item.nome === 'Dedo Decepado') {
        return janelaEscolha({ titulo: item.nome, intro: 'Selecione o poder do dono original. O vínculo fica registrado no item.',
          opcoes: PODERES_PARANORMAIS.map(p => ({ valor: p.id, nome: p.nome, desc: p.resumo })),
          aoEscolher: id => { item.poderDedo = id; item.nota = PODER_PARANORMAL[id].nome; fecharModal(); salvar(); } });
      }
      if (!item.nome.startsWith('Selo Paranormal')) return;
      janelaEscolha({ titulo: item.nome, intro: 'Escolha o ritual inscrito no selo.',
        opcoes: RITUAIS.filter(r => r.circulo === item.categoria).map(r => ({ valor: r.id, nome: r.nome })),
        aoEscolher: id => { item.ritualSelo = id; item.nota = RITUAIS.find(r => r.id === id).nome; fecharModal(); salvar(); } });
    },
    'usar-selo': async el => {
      const ficha = f(), item = ficha.itens[Number(el.dataset.i)], d = derivar(ficha);
      const r = RITUAIS.find(x => x.id === item?.ritualSelo);
      if (!r || !item.qtd || d.semAcoes) return;
      const conhecida = ficha.rituais.some(x => x.idCatalogo === r.id || x.nome === r.nome);
      const custo = CIRCULOS[r.circulo - 1].custo, dt = 20 + custo, oc = d.PER.ocultismo;
      if (!conhecida && (await rolarTesteUI({ titulo: `Ativar selo · DT ${dt}`, quem: quem(), dados: oc.dados, bonus: oc.bonus })).total < dt) {
        return ctx.avisar('Falha na ativação. O selo continua no inventário.');
      }
      if (item.qtd < 1) return;
      item.qtd--; salvar();
      let perda = 0, perdaPermanente = 0;
      if (r.elemento === 'medo') { perda = custo; perdaPermanente = 1; }
      else {
        const teste = await rolarTesteUI({ titulo: `Custo do Paranormal · DT ${dt}`, quem: quem(), dados: oc.dados, bonus: oc.bonus });
        if (teste.total < dt) perda = custo;
        if (teste.total <= dt - 5) perdaPermanente = 1;
      }
      if (perda || perdaPermanente) {
        sofrerDano(ficha, derivar(ficha), perda + perdaPermanente, { tipo: 'mental' });
        ficha.penalidadeSanPermanente += perdaPermanente;
      }
      salvar(); ctx.avisar(`Selo de ${r.nome} ativado na forma básica. Resolva o efeito conforme o ritual.`);
    },
    'item-info': el => {
      const it = ITEM_INFO[el.dataset.nome]; if (!it) return;
      abrirModal(it.nome, `<p><span class="etiqueta">${esc(it.grupo)}</span>${it.elemento ? `<span class="etiqueta">${esc(ELEM[it.elemento]?.nome || it.elemento)}</span>` : ''}${fonteTag(it.fonte)}</p><p>${esc(it.resumo)}</p>${it.paginaLivro ? `<a href="#/acervo/${it.fonte.startsWith('AS') ? it.fonte.toLowerCase() : 'base'}/${it.paginaLivro}">Abrir ${it.fonte.startsWith('AS') ? it.fonte : 'Livro de Regras'} · p. ${it.fonte.startsWith('AS') ? it.paginaLivro : it.paginaLivro - 10}</a>` : ''}
        <p class="aviso-ocr">Resumo com outras palavras. O texto completo está no livro${it.fonte === 'LR' ? ` (Livro de Regras, ${/amaldiçoado/i.test(it.nome) ? 'p. 147' : 'cap. 3, Equipamento'})` : ''}.</p>${it.fonte === 'SaH' && it.pagina ? `<a class="fonte-sah-link" href="#/acervo/sah/${it.pagina}">Abrir a página ${it.pagina} do livro digitalizado</a>` : ''}`,
        '<button class="btn sangue" data-acao="fechar-modal">Fechar</button>');
    },
    'add-propria': () => { const ficha = f(); ficha.habilidadesProprias.push({ uid: uid(), nome: 'Nova habilidade', resumo: '', custo: '' }); salvar(); },
    'escolher-poder': () => {
      const ficha = f(), d = derivar(ficha);
      const lista = poderesParaFicha(ficha).filter(p => !(d.transcenderSeparado && p.id === 'transcender')).sort(alfa);
      const grupos = [['Classe', p => p.classe === ficha.classe], ['Todas as classes', p => p.classe === 'todas'], ['Gerais (SaH)', p => p.classe === 'geral' || (p.classe !== ficha.classe && p.classe !== 'todas')]];
      abrirModal('Escolher poder', `<input type="search" placeholder="Procurar poder…" data-filtro-modal autofocus aria-label="Procurar poder" style="margin-bottom:10px">
        ${grupos.map(([nome, fn]) => { const ps = lista.filter(fn); return ps.length ? `<h3 class="titulo-vermelho">${nome}</h3><div class="cartoes">${ps.map(p => { const tem = ficha.poderes.some(x => x.id === p.id); const ok = cumpreRequisito(ficha, d, p.req); return `<button class="cartao" data-acao="add-poder" data-id="${p.id}" data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${!ok || !viaPoder(ficha, d, p) || (tem && !p.repete) || bloqueadoPossuido(d, ficha, p) ? 'disabled' : ''}><span class="linha"><b>${esc(p.nome)}</b><span class="espaco"></span>${fonteTag(p.fonte)}</span>${p.req ? `<small style="color:${ok ? 'var(--ok)' : 'var(--perigo)'}">Pré: ${esc(p.req)}</small>` : ''}<small>${esc(p.resumo)}</small>${bloqueadoPossuido(d, ficha, p) ? '<small class="apagado">Possuído: novos poderes de ocultista viram Transcender.</small>' : ''}</button>`; }).join('')}</div>` : ''; }).join('')}`, '', true);
    },
    'add-poder': el => {
      const ficha = f(), p = PODER[el.dataset.id], d = derivar(ficha);
      if (p && !p.repete && ficha.poderes.some(x => x.id === p.id)) return ctx.avisar('Este poder já foi aprendido.');
      if (!p || !poderesParaFicha(ficha).some(x => x.id === p.id) || !cumpreRequisito(ficha, d, p.req)) return ctx.avisar('Pré-requisitos do poder não cumpridos.', true);
      if (!viaPoder(ficha, d, p)) return ctx.avisar('Não há uma vaga disponível para este poder.', true);
      if (bloqueadoPossuido(d, ficha, p)) return ctx.avisar('Possuído (Poder Não Desejado): todo novo poder de ocultista vira Transcender.', true);
      if (p.id === 'transcender') { fecharModal(); return acoesFicha(ctx)['transcender'](); }
      escolhaDoPoder(ctx, ficha, p, escolha => {
        const fx = f(), via = viaPoder(fx, derivar(fx), p);
        if (!via) return ctx.avisar('Não há uma vaga disponível para este poder.', true);
        fx.poderes.push({ id: p.id, escolha: escolha || '', via: via === 'vivencia' ? via : '', uid: uid() });
        ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`${p.nome}${escolha ? ` (${escolha})` : ''} adicionado.`);
      });
    },
    'escolher-opcao': el => { const e = escolhaPendente; if (!e?.aoEscolher) return; escolhaPendente = null; e.aoEscolher(el.dataset.valor); },
    'confirmar-multipla': () => { const e = escolhaPendente; if (!e?.aoConfirmar) return; const ids = [...document.querySelectorAll('[data-multi]:checked')].map(c => c.dataset.multi); if (e.max && ids.length > e.max) return ctx.avisar(`Escolha no máximo ${e.max}.`, true); if (!ids.length) return ctx.avisar('Marque pelo menos uma opção.', true); escolhaPendente = null; e.aoConfirmar(ids); },
    // Versatilidade (NEX 50%): poder de classe OU 1ª habilidade de outra trilha da sua classe
    'versatilidade': () => {
      const ficha = f();
      const trilhas = TRILHAS.filter(t => t.classe === ficha.classe && t.id !== ficha.trilha && (t.fonte !== 'SaH' || ficha.modo === 'sah'));
      janelaEscolha({ titulo: 'Versatilidade', intro: 'Em NEX 50% você escolhe: um poder de classe extra, OU a primeira habilidade de uma trilha da sua classe que não é a sua.',
        opcoes: [{ valor: '__poder', nome: 'Um poder de classe a mais', desc: 'Abre a lista de poderes da sua classe. Ele usa a vaga da Versatilidade.' }, ...trilhas.map(t => ({ valor: t.id, nome: `${t.habilidades[0].nome} (trilha ${t.nome})`, desc: t.habilidades[0].resumo, tag: t.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : '' }))],
        aoEscolher: v => { const fx = f(); if (v === '__poder') { fx.escolhas.versatilidade = ''; salvar(); fecharModal(); return acoesFicha(ctx)['escolher-poder'](); } fx.escolhas.versatilidade = v; ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`Versatilidade: ${TRILHA[v].habilidades[0].nome}.`); } });
    },
    // A Força do Saber (Bibliotecário 99%): uma perícia passa a usar Intelecto
    'forca-saber': () => janelaEscolha({ titulo: 'A Força do Saber', intro: 'Escolha uma perícia: ela passa a usar Intelecto como atributo-base.',
      opcoes: PERICIAS.filter(x => x.atr !== 'int').map(x => ({ valor: x.id, nome: x.nome, desc: `Hoje usa ${x.atr.toUpperCase()}; passará a usar INT (${f().atributos.int + 1}).` })),
      aoEscolher: v => { const fx = f(); fx.escolhas.forcaSaber = v; salvar(); fecharModal(); ctx.avisar(`${PERICIA[v].nome} agora usa Intelecto.`); } }),
    // Multifacetado (Agente Secreto 99%): 5 SAN para ganhar as habilidades até NEX 65% de outra trilha, pela cena
    'multifacetado': () => {
      const ficha = f();
      const trilhas = TRILHAS.filter(t => ['combatente', 'especialista'].includes(t.classe) && t.id !== ficha.trilha && (t.fonte !== 'SaH' || ficha.modo === 'sah'));
      janelaEscolha({ titulo: 'Multifacetado (5 de Sanidade)', intro: 'Uma vez por cena: você ganha as habilidades até NEX 65% de uma trilha de combatente ou especialista, até o fim da cena.',
        opcoes: trilhas.map(t => ({ valor: t.id, nome: `${t.nome} (${CLASSES[t.classe].nome})`, desc: t.habilidades.filter(h => h.nivel <= 13).map(h => h.nome).join(' · ') })),
        aoEscolher: v => { const fx = f(), dx = derivar(fx), t = TRILHA[v];
          if (dx.pd) fx.recursos.pd = dx.atual.pd - 5; else fx.recursos.san = dx.atual.san - 5;
          const ef = {}; for (const h of t.habilidades.filter(h => h.nivel <= 13)) if (h.ef?.pericia) { ef.pericia = { ...(ef.pericia || {}) }; for (const [k, x] of Object.entries(h.ef.pericia)) ef.pericia[k] = (ef.pericia[k] || 0) + x; }
          fx.efeitos.push({ uid: uid(), nome: `Multifacetado: ${t.nome}`, dura: 'cena', ef, nota: t.habilidades.filter(h => h.nivel <= 13).map(h => h.nome).join(', ') });
          ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`Multifacetado: ${t.nome} até o fim da cena (−5 ${dx.pd ? 'PD' : 'SAN'}).`); } });
    },
    // Treinamento Especial (Sobrevivente recrutado pela Ordem): cria uma cópia na nova classe
    'treinamento-especial': () => f().classe === 'mundano' ? janelaEscolha({
      titulo: 'Treinamento do Mundano', intro: 'Escolha a classe. Em seguida, escolha os benefícios do treinamento concluído. Uma nova ficha será criada.',
      opcoes: ['combatente', 'especialista', 'ocultista'].map(c => ({ valor: c, nome: CLASSES[c].nome })),
      aoEscolher: classe => acoesFicha(ctx)['mundano-beneficios']({ dataset: { classe } }),
    }) : janelaEscolha({ titulo: 'Treinamento Especial', intro: 'Quando a história levar o sobrevivente para a Ordem, ele vira NEX 5% de uma classe. Isto cria uma CÓPIA da ficha na classe escolhida (a original fica guardada). Ajuste os PV/PE extras em "Ajustes manuais" se o mestre pedir.',
      opcoes: ['combatente', 'especialista', 'ocultista'].map(c => ({ valor: c, nome: CLASSES[c].nome, desc: TREINAMENTO_ESPECIAL[c] })),
      aoEscolher: c => { const fx = f(); const nova = normalizar({ ...structuredClone(fx), id: uid(), classe: c, trilha: '', nex: 5, nivel: 1, nome: fx.nome, habilidadesProprias: [...fx.habilidadesProprias, { nome: 'Passado de Sobrevivente', resumo: `Estágio ${fx.estagio}, trilha ${TRILHA[fx.trilha]?.nome || '—'}. Mantém as habilidades já recebidas.` }], recursos: {} }); ctx.adicionarFicha(nova); fecharModal(); location.hash = '#/agente/' + nova.id; ctx.avisar(`Ficha de ${CLASSES[c].nome} criada a partir do sobrevivente.`); } }),
    'mundano-beneficios': el => {
      const ficha = f(), classe = el.dataset.classe;
      if (ficha.classe !== 'mundano' || !['combatente', 'especialista', 'ocultista'].includes(classe)) return;
      const opAtr = ATRIBUTOS.filter(a => aumentoPermitido(ficha, a.id, 3));
      const select = (id, titulo, opcoes) => `<label class="campo"><span>${titulo}</span><select id="${id}"><option value="">—</option>${opcoes.map(x => `<option value="${x.id}">${x.nome}</option>`).join('')}</select></label>`;
      const grupos = classe === 'combatente' ? [['luta', 'pontaria'], ['fortitude', 'reflexos']] : [];
      abrirModal('Benefícios do treinamento', `<div class="grade c2">${select('mund-atr', 'Atributo +1', opAtr)}
        ${grupos.map((ids, i) => select(`mund-fixa-${i}`, 'Perícia do treinamento', ids.map(id => PERICIA[id]))).join('')}</div>
        ${classe !== 'combatente' ? `<p>Escolha ${classe === 'especialista' ? 6 : 2} perícias adicionais disponíveis.</p><div class="grade c3">${PERICIAS.filter(p => !ficha.pericias[p.id] && !(classe === 'ocultista' && ['ocultismo', 'vontade'].includes(p.id))).map(p => `<label class="check"><input type="checkbox" data-mund-pericia="${p.id}"><span>${p.nome}</span></label>`).join('')}</div>` : ''}
        <label class="check"><input type="checkbox" id="mund-parcial"> Treinamento parcial aprovado pelo mestre</label>`,
        `<button class="btn sangue" data-acao="mundano-confirmar" data-classe="${classe}">Criar ficha de NEX 5%</button>`, true);
    },
    'mundano-confirmar': el => {
      const ficha = f(), classe = el.dataset.classe;
      if (ficha.classe !== 'mundano' || !['combatente', 'especialista', 'ocultista'].includes(classe)) return;
      const id = document.getElementById('mund-atr')?.value;
      const parcial = document.getElementById('mund-parcial')?.checked;
      const ids = classe === 'combatente' ? [0, 1].map(i => document.getElementById(`mund-fixa-${i}`)?.value).filter(Boolean)
        : [...new Set([...document.querySelectorAll('[data-mund-pericia]:checked')].map(x => x.dataset.mundPericia))];
      const n = classe === 'especialista' ? 6 : 2;
      if (ids.length > n || (!parcial && (ids.length !== n || !id))) return ctx.avisar(`Escolha o atributo e ${n} perícias para o treinamento completo.`, true);
      const nova = normalizar({ ...structuredClone(ficha), id: uid(), classe, nex: 5, recursos: {} });
      if (ATRIBUTOS.some(a => a.id === id) && aumentoPermitido(ficha, id, 3)) nova.atributos[id]++;
      for (const p of [...ids, ...(classe === 'ocultista' ? ['ocultismo', 'vontade'] : [])]) {
        if (PERICIA[p]) nova.pericias[p] = Math.max(1, nova.pericias[p] || 0);
      }
      nova.treinoOutrasFontes = [...new Set([...nova.treinoOutrasFontes, ...ids, ...(classe === 'ocultista' ? ['ocultismo', 'vontade'] : [])])];
      if (parcial) nova.notas += '\nTreinamento parcial: confira com o mestre quais benefícios de classe, recursos e proficiências foram concedidos.';
      ctx.adicionarFicha(nova); fecharModal(); location.hash = '#/agente/' + nova.id;
    },
    'poder-proprio': () => { const ficha = f(); const nome = prompt('Nome do poder (ex.: poder paranormal "Sangue de Ferro")'); if (!nome) return; ficha.poderes.push({ id: 'proprio', nome, resumo: '', uid: uid() }); salvar(); },
    'ritual-proprio': () => { const ficha = f(); ficha.rituais.push({ uid: uid(), nome: 'Novo ritual', elemento: 'conhecimento', circulo: 1 }); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); },
    'exportar-ficha': () => { const ficha = f(); baixarArquivo(`agente-${(ficha.nome || 'sem-nome').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`, JSON.stringify({ tipo: 'fichaoculta-ficha', versao: 1, ficha }, null, 2)); },
    'imprimir': () => print(),
    'duplicar-ficha': () => { const c = normalizar({ ...structuredClone(f()), id: uid(), nome: f().nome + ' (cópia)' }); ctx.adicionarFicha(c); location.hash = '#/agente/' + c.id; },
    'apagar-ficha': () => { const ficha = f(); if (!confirm(`Apagar "${ficha.nome || 'agente'}" para sempre? Exporte antes se quiser guardar.`)) return; ctx.apagarFicha(ficha.id); location.hash = '#/agentes'; },
  };
}

// Caixinhas (checkbox) da ficha
export function checksFicha(ctx) {
  const f = () => ctx.fichaAtual();
  return {
    // A caixinha do grimório não muda sozinha: abre a pré-visualização, e "Aprender"/"Esquecer" decidem.
    'ritual-catalogo': el => {
      const ficha = f(); const r = RITUAIS.find(x => x.id === el.dataset.id); if (!r) return;
      el.checked = !el.checked;
      janelaPreviaRitual(ficha, derivar(ficha), r);
    },
    'mochila-utilidades': el => { const ficha = f(); ficha.mochilaUtilidades = el.checked ? el.dataset.uid : ''; ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); },
    'afinidade-ativa': el => { const ficha = f(); ficha.afinidadeAtiva = el.checked; ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); },
    'ritual-esquecer': el => { const ficha = f(); const r = ficha.rituais[Number(el.dataset.i)]; if (!confirm(`Esquecer o ritual "${r.nome}"?`)) { el.checked = true; return; } ficha.rituais.splice(Number(el.dataset.i), 1); ctx.salvarFicha(ficha); ctx.render(); },
    'peso-idade': el => {
      const ficha = f(), id = el.dataset.id;
      if (!Object.hasOwn(PESOS_IDADE, id)) return;
      ficha.pesosIdade = el.checked ? [...new Set([...ficha.pesosIdade, id])].slice(0, faixaEtaria(ficha)?.peso || 0) : ficha.pesosIdade.filter(x => x !== id);
      ctx.salvarFicha(ficha); ctx.render();
    },
    'opcional': el => {
      const ficha = f(); ficha.opcionais[el.dataset.k] = el.checked;
      if (el.dataset.k === 'patentes' && el.checked) { ficha.opcionais.determinacao = true; ficha.opcionais.nivelExp = false; }
      if (el.dataset.k === 'nivelExp' && el.checked) ficha.opcionais.patentes = false;
      const n = normalizar(ficha); Object.assign(ficha, n); ctx.salvarFicha(ficha); ctx.render();
    },
  };
}
