// fichaUI.js — as telas da ficha do agente e as ações delas.
import {
  MODOS, OPCIONAIS, ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, CLASSES, ORIGEM, TRILHAS, TRILHA, PODER, ELEMENTOS, CIRCULOS,
  ARMAS, PROTECOES, ITENS_GERAIS, CONDICOES, PATENTES, RITUAIS, TIPOS_DANO, FERIMENTOS,
} from './catalogo.js?v=0.1';
import { derivar, normalizar, poderesParaFicha, cumpreRequisito, ehSobrevivente, temOpcional, usaPD } from './regras.js?v=0.1';
import { esc, comSinal, romano, sigilo, semAcento, inteiro, numero, uid, imagemOpcional, reduzirImagem, escolherArquivo, baixarArquivo } from './util.js?v=0.1';
import { pentagramaAtributos } from './criador.js?v=0.1';
import { textoTeste, d } from './dados.js?v=0.1';
import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal } from './rolagem.js?v=0.1';

export const ABAS = [['agente', 'Agente'], ['combate', 'Combate'], ['habilidades', 'Habilidades'], ['rituais', 'Rituais'], ['inventario', 'Inventário'], ['notas', 'Notas']];
const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
const fonteTag = f => f === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : '';
const cat = n => (n ? romano(n) : '0');

// ---------- Tela ----------
export function telaFicha(f, ui) {
  const d = derivar(f);
  const aba = ui.aba || 'agente';
  const corpo = { agente: abaAgente, combate: abaCombate, habilidades: abaHabilidades, rituais: abaRituais, inventario: abaInventario, notas: abaNotas }[aba](f, d, ui);
  return `<div class="pagina">
  ${cabecalho(f, d)}
  ${d.avisos.length ? `<details class="avisos-ficha" style="margin-top:12px"><summary class="ui" style="cursor:pointer">⚠ ${d.avisos.length} aviso(s) de regra</summary><ul>${d.avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></details>` : ''}
  <nav class="abas" role="tablist" data-guardar-rolagem="abas">${ABAS.map(([id, nome]) => `<button role="tab" data-acao="aba" data-aba="${id}" aria-selected="${aba === id}">${nome}</button>`).join('')}</nav>
  ${corpo}</div>`;
}

function cabecalho(f, d) {
  const cls = CLASSES[f.classe];
  const origem = ORIGEM[f.origem]?.nome || (f.origem === 'propria' ? f.origemPropria.nome || 'Origem própria' : 'Sem origem');
  return `<header class="ficha-cabeca">
    <button class="retrato" data-acao="retrato" style="${f.retrato ? `background-image:url(${esc(f.retrato)})` : ''}" aria-label="Trocar retrato">${f.retrato ? '' : 'Retrato'}</button>
    <div><h1><input data-campo="nome" id="f-nome" value="${esc(f.nome)}" placeholder="Nome do agente" aria-label="Nome do agente" maxlength="80"></h1>
      <div class="sub-cabeca">
        <span class="etiqueta">${esc(cls.nome)}</span>${d.trilha ? `<span class="etiqueta">${esc(d.trilha.nome)}</span>` : ''}<span class="etiqueta">${esc(origem)}</span>
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

function abaAgente(f, d) {
  const recursos = [recurso('PV', 'Vida', 'var(--pv)', d.atual.pv, d.pv, 'pv', d.machucado ? '<small class="etiqueta alerta" style="margin-top:6px">Machucado</small>' : '')];
  if (d.pd) recursos.push(recurso('PD', 'Determinação', 'var(--pd)', d.atual.pd, d.pdMax, 'pd'));
  else { recursos.push(recurso('PE', 'Esforço', 'var(--pe)', d.atual.pe, d.pe, 'pe')); recursos.push(recurso('SAN', 'Sanidade', 'var(--san)', d.atual.san, d.san, 'san')); }
  const nivelCampo = ehSobrevivente(f)
    ? `<label class="campo"><span>Estágio</span><select data-campo="estagio" data-tipo="int">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${f.estagio === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`
    : temOpcional(f, 'patentes') ? `<label class="campo"><span>Prestígio (PP)</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="f-pp" value="${f.pp}"></label>`
      : temOpcional(f, 'nivelExp') ? `<label class="campo"><span>Nível</span><select data-campo="nivel" data-tipo="int">${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${f.nivel === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label><label class="campo"><span>NEX (exposição)</span><input type="number" min="0" max="99" data-campo="nexExposicao" data-tipo="int" id="f-nexexp" value="${f.nexExposicao}"></label>`
        : `<label class="campo"><span>NEX</span><select data-campo="nex" data-tipo="int">${NEX.map(n => `<option value="${n}" ${f.nex === n ? 'selected' : ''}>${n}%</option>`).join('')}</select></label>`;
  return `<div class="grade c2">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Atributos</h2><button class="btn pequeno fantasma" data-acao="editar-atributos">Editar</button></div>
    ${pentagramaAtributos(f.atributos, false, true)}
    <p class="apagado" style="text-align:center;font-size:.9rem">Toque num atributo para rolar. ${d.slotsAtributo ? `Aumentos de atributo liberados: ${d.slotsAtributo}.` : ''}</p>
  </section>
  <section class="painel"><h2 class="faixa">Estado</h2>
    <div class="recursos">${recursos.join('')}</div>
    <div class="numeros-chave" style="margin-top:12px">
      <div class="chave"><b>${d.defesa}</b><span>Defesa</span></div>
      <div class="chave"><b>${d.desl}m</b><span>Desloc.</span></div>
      <div class="chave"><b>${d.limitePE}</b><span>Limite ${d.pd ? 'PD' : 'PE'}/turno</span></div>
      <div class="chave"><b>${d.rd || 0}</b><span>RD</span></div>
      ${d.bloqueio != null ? `<div class="chave"><b>${d.bloqueio}</b><span>Bloqueio (RD)</span></div>` : ''}
      ${d.esquiva != null ? `<div class="chave"><b>+${d.esquiva}</b><span>Esquiva</span></div>` : ''}
    </div>
    <div class="grade c2" style="margin-top:12px">${nivelCampo}
      ${ehSobrevivente(f) ? '' : `<label class="campo"><span>Patente (PP: ${f.pp})</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="f-pp2" value="${f.pp}" aria-label="Pontos de prestígio"></label>`}
    </div>
    <div class="linha" style="margin-top:12px"><button class="btn" data-acao="rolar-iniciativa">Iniciativa ${textoTeste(d.iniciativa.dados, d.iniciativa.bonus)}</button>
      ${d.atual.pv <= 0 ? `<span class="etiqueta alerta">Morrendo ${f.recursos.morrendo}/3</span><button class="btn pequeno" data-acao="contador" data-c="morrendo">+1 turno morrendo</button>` : ''}
      ${!d.pd && d.atual.san <= 0 ? `<span class="etiqueta alerta">Enlouquecendo ${f.recursos.enlouquecendo}/3</span><button class="btn pequeno" data-acao="contador" data-c="enlouquecendo">+1 turno</button>` : ''}
    </div>
  </section></div>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Perícias</h2><span class="apagado dossie-txt">Toque no dado para rolar</span></div>
    <div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Perícia</th><th>Atr.</th><th>Grau</th><th class="esconde-celular">Outros</th><th>Rolar</th></tr></thead><tbody>
    ${d.pericias.map(p => `<tr class="${p.bloqueada ? 'pericia-bloq' : ''}"><td>${esc(p.nome)}${p.id === 'profissao' && f.profissao ? ` <small>(${esc(f.profissao)})</small>` : ''}${p.treinada ? ' <small title="Só treinada">*</small>' : ''}${p.carga ? ' <small title="Penalidade de carga">+</small>' : ''}</td>
      <td class="num">${p.atrUsado.toUpperCase()}</td>
      <td><select data-campo="pericias.${p.id}" data-tipo="int" aria-label="Grau em ${esc(p.nome)}">${GRAUS.map(g => `<option value="${g.id}" ${(f.pericias[p.id] || 0) === g.id ? 'selected' : ''}>${g.nome}</option>`).join('')}</select></td>
      <td class="esconde-celular"><input type="number" style="width:64px;min-height:30px;padding:2px 6px" data-campo="bonusPericia.${p.id}" data-tipo="int" id="bp-${p.id}" value="${f.bonusPericia[p.id] || ''}" placeholder="0" aria-label="Bônus extra em ${esc(p.nome)}"></td>
      <td><button class="rolavel" data-acao="rolar-pericia" data-id="${p.id}" ${p.bloqueada ? 'title="Só pode ser usada se treinado"' : ''}><span class="d">${textoTeste(p.dados, p.bonus)}</span></button></td></tr>`).join('')}
    </tbody></table></div>
    <label class="campo" style="max-width:320px;margin-top:10px"><span>Especialização de Profissão</span><input data-campo="profissao" id="f-prof" value="${esc(f.profissao)}" placeholder="Ex.: cozinheiro, engenheiro"></label>
    <p class="apagado" style="font-size:.88rem;margin-top:8px">* só treinada · + sofre penalidade de carga${d.penalCarga ? ` (agora: −${d.penalCarga})` : ''}. Veterano a partir de NEX 35%, expert a partir de 70%.</p>
  </section>`;
}

// ---------- Aba COMBATE ----------
function abaCombate(f, d) {
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Ataques</h2><button class="btn pequeno" data-acao="add-arma">+ Arma</button></div>
    ${d.ataques.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th><th>Crítico</th><th class="esconde-celular">Alcance</th><th></th></tr></thead><tbody>
    ${d.ataques.map((a, i) => `<tr><td><b>${esc(a.nome)}</b><br><small>${esc(a.periciaNome)} · ${a.prof}${a.temProf ? '' : ' <span class="etiqueta alerta">sem proficiência −1D</span>'}</small></td>
      <td><button class="rolavel" data-acao="rolar-ataque" data-i="${i}"><span class="d">${textoTeste(a.dados, a.bonus)}</span></button></td>
      <td><button class="rolavel" data-acao="rolar-dano" data-i="${i}"><span class="d">${esc(a.formula)}</span></button> <small>${esc(TIPOS_DANO[a.tipo] || a.tipo)}</small></td>
      <td class="num">${a.margem < 20 ? a.margem + '+' : '20'} / ×${a.mult}</td><td class="esconde-celular">${esc(a.alcance)}</td>
      <td><button class="icone-btn" data-acao="editar-arma" data-i="${i}" aria-label="Editar ${esc(a.nome)}">✎</button></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="vazio">Nenhuma arma. Adicione uma da lista do livro ou crie a sua.</p>'}
    <p class="apagado" style="font-size:.88rem">Corpo a corpo e arremesso somam Força no dano. No crítico, os dados da arma são multiplicados (bônus fixos não).${CLASSES[f.classe].nome === 'Combatente' ? ' Ataque Especial: gaste PE para +5 no ataque ou dano (use a bandeja de dados para somar o bônus).' : ''}</p>
  </section>
  <div class="grade c2" style="margin-top:14px">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Proteção</h2><button class="btn pequeno" data-acao="add-protecao">+ Proteção</button></div>
    ${f.protecoes.length ? f.protecoes.map((p, i) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--linha)"><label class="check"><input type="checkbox" data-campo="protecoes.${i}.vestida" data-tipo="bool" ${p.vestida ? 'checked' : ''}> <span><b>${esc(p.nome)}</b> <small>Defesa +${p.defesa}${p.rd ? `, RD ${p.rd}` : ''} · cat. ${cat(p.categoria)} · ${p.espacos} esp.</small></span></label><span class="espaco"></span><button class="icone-btn" data-acao="remover" data-lista="protecoes" data-i="${i}" aria-label="Remover ${esc(p.nome)}">✕</button></div>`).join('') : '<p class="apagado">Sem proteção.</p>'}
    <h3 class="titulo-vermelho">Ajustes manuais</h3>
    <div class="grade c3">${[['defesa', 'Defesa'], ['rd', 'RD'], ['desl', 'Desloc. (m)'], ['resistencia', 'Testes de resist.'], ['pv', 'PV máx.'], [usaPD(f) ? 'pd' : 'pe', usaPD(f) ? 'PD máx.' : 'PE máx.'], ...(usaPD(f) ? [] : [['san', 'SAN máx.']]), ['carga', 'Carga']].map(([k, n]) => `<label class="campo"><span>${n}</span><input type="number" data-campo="bonus.${k}" data-tipo="int" id="bonus-${k}" value="${f.bonus[k] || 0}"></label>`).join('')}</div>
    <p class="apagado" style="font-size:.88rem">Para efeitos que o site não calcula sozinho (itens, rituais ativos, poderes paranormais…).</p>
  </section>
  <section class="painel"><h2 class="faixa">Condições</h2>
    <div class="condicoes">${CONDICOES.map(c => `<button data-acao="condicao" data-id="${c.id}" aria-pressed="${f.condicoes.includes(c.id)}" title="${esc(c.resumo)}">${esc(c.nome)}</button>`).join('')}</div>
    ${f.condicoes.length ? `<ul style="margin-top:10px">${f.condicoes.map(id => CONDICOES.find(c => c.id === id)).filter(Boolean).map(c => `<li><b>${esc(c.nome)}:</b> ${esc(c.resumo)}</li>`).join('')}</ul>` : '<p class="apagado" style="margin-top:8px">Nenhuma condição. As penalidades de dados entram sozinhas nas rolagens.</p>'}
    ${temOpcional(f, 'ferimentos') ? `<h3 class="titulo-vermelho">Ferimentos debilitantes</h3>
      <p class="apagado" style="font-size:.9rem">Cada ferimento: −1 dado nos testes do atributo. Em Vigor, também reduz os PV máximos.</p>
      <div class="linha">${f.ferimentos.map((a, i) => `<span class="etiqueta alerta">${a.toUpperCase()} <button class="icone-btn" style="width:22px;height:22px" data-acao="remover" data-lista="ferimentos" data-i="${i}" aria-label="Curar ferimento">✕</button></span>`).join('')}
      <button class="btn pequeno" data-acao="rolar-ferimento">Rolar ferimento (1d6)</button></div>` : ''}
  </section></div>`;
}

// ---------- Aba HABILIDADES ----------
function hab(nome, resumo, meta = '', chave = '', f = null, trancada = false) {
  const nota = chave && f ? f.notasHabilidade[chave] || '' : '';
  return `<div class="hab ${trancada ? 'trancada' : ''}"><span class="meta">${meta}</span><b>${esc(nome)}</b>${resumo ? `<p>${esc(resumo)}</p>` : ''}
    ${chave && !trancada ? `<details${nota ? ' open' : ''}><summary class="apagado" style="cursor:pointer;font-size:.85rem">Anotação</summary><textarea data-campo="notasHabilidade.${esc(chave)}" id="nota-${esc(chave)}" placeholder="Texto do livro, custo, detalhes…">${esc(nota)}</textarea></details>` : ''}</div>`;
}
function abaHabilidades(f, d) {
  const cls = CLASSES[f.classe];
  const o = ORIGEM[f.origem];
  const trilhas = TRILHAS.filter(t => t.classe === f.classe && (t.fonte !== 'SaH' || f.modo === 'sah'));
  const disponiveis = poderesParaFicha(f);
  return `<div class="grade c2">
  <section class="painel"><h2 class="faixa sangue">Classe · ${esc(cls.nome)}</h2>
    <div class="lista-hab">${d.habilidades.map(h => hab(h.nome, h.resumo, '', 'classe-' + h.nome, f)).join('') || '<p class="apagado">—</p>'}</div>
    <h3 class="titulo-vermelho">Origem</h3>
    ${o ? hab(o.poder, o.resumo, `<span class="etiqueta">${esc(o.nome)}</span>${fonteTag(o.fonte)}`, 'origem', f) : f.origem === 'propria' ? hab(f.origemPropria.poder || 'Poder da origem', f.origemPropria.resumo, `<span class="etiqueta">${esc(f.origemPropria.nome)}</span>`, 'origem', f) : '<p class="apagado">Sem origem.</p>'}
    <label class="campo" style="margin-top:10px"><span>Origem</span><select data-campo="origem">${['<option value="">—</option>', ...Object.values(ORIGEM).filter(x => x.fonte !== 'SaH' || f.modo === 'sah').map(x => `<option value="${x.id}" ${f.origem === x.id ? 'selected' : ''}>${esc(x.nome)}${x.fonte === 'SaH' ? ' (SaH)' : ''}</option>`), `<option value="propria" ${f.origem === 'propria' ? 'selected' : ''}>Origem própria</option>`].join('')}</select></label>
    ${f.origem === 'propria' ? `<div class="grade c2" style="margin-top:8px"><label class="campo"><span>Nome</span><input data-campo="origemPropria.nome" id="op-nome" value="${esc(f.origemPropria.nome)}"></label><label class="campo"><span>Poder</span><input data-campo="origemPropria.poder" id="op-poder" value="${esc(f.origemPropria.poder)}"></label><label class="campo" style="grid-column:1/-1"><span>Efeito</span><textarea data-campo="origemPropria.resumo" id="op-resumo">${esc(f.origemPropria.resumo)}</textarea></label></div>` : ''}
  </section>
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Trilha</h2>
    <select data-campo="trilha" style="max-width:240px" aria-label="Trilha"><option value="">— escolher —</option>${trilhas.map(t => `<option value="${t.id}" ${f.trilha === t.id ? 'selected' : ''}>${esc(t.nome)}${t.fonte === 'SaH' ? ' (SaH)' : ''}</option>`).join('')}</select></div>
    ${d.trilha ? `${d.trilha.aviso ? `<p class="apagado" style="font-size:.88rem">${esc(d.trilha.aviso)}</p>` : ''}<div class="lista-hab">${d.trilhaHabs.map(h => hab(h.nome, h.resumo, `<span class="etiqueta">${ehSobrevivente(f) ? `Estágio ${h.nivel}` : temOpcional(f, 'patentes') ? ['', '', 'Agente especial', '', '', '', '', '', 'Oficial', '', '', '', '', 'Elite', '', '', '', '', '', '', 'Elite'][h.nivel] : temOpcional(f, 'nivelExp') ? `Nível ${h.nivel}` : `NEX ${NEX[h.nivel - 1]}%`}</span>`, 'trilha-' + h.nome, f, !h.liberada)).join('')}</div>`
      : `<p class="apagado">Escolha a trilha ${ehSobrevivente(f) ? 'no estágio 2' : temOpcional(f, 'patentes') ? 'ao virar agente especial' : 'em NEX 10%'}.</p>`}
  </section></div>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Poderes</h2><span class="contador ${f.poderes.length > d.slotsPoder + (d.versatilidade ? 1 : 0) ? 'erro' : ''}">${f.poderes.length} / ${d.slotsPoder}${d.versatilidade ? ' +1' : ''}</span></div>
    <div class="lista-hab">${f.poderes.map((p, i) => { const def = PODER[p.id]; return def ? hab(def.nome + (p.escolha ? ` (${p.escolha})` : ''), def.resumo, `${def.req ? `<small class="apagado">${esc(def.req)}</small>` : ''}${fonteTag(def.fonte)}<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button>`, 'poder-' + p.uid, f) : hab(p.nome, p.resumo, `<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover">✕</button>`, 'poder-' + p.uid, f); }).join('') || '<p class="apagado">Nenhum poder escolhido.</p>'}</div>
    <div class="linha" style="margin-top:10px"><button class="btn" data-acao="escolher-poder">+ Escolher poder</button><button class="btn fantasma" data-acao="poder-proprio">+ Poder paranormal / próprio</button></div>
    <p class="apagado" style="font-size:.88rem;margin-top:6px">${f.modo === 'sah' ? 'No Sobrevivendo ao Horror, poderes gerais podem ser escolhidos no lugar de um poder de classe. ' : ''}Poderes paranormais (Transcender) e homebrews entram como "poder próprio".</p>
  </section>
  <div class="grade c2" style="margin-top:14px">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Habilidades próprias</h2><button class="btn pequeno" data-acao="add-propria">+ Adicionar</button></div>
    ${f.habilidadesProprias.map((h, i) => `<div class="hab"><span class="meta"><button class="icone-btn" data-acao="remover" data-lista="habilidadesProprias" data-i="${i}" aria-label="Remover">✕</button></span>
      <input data-campo="habilidadesProprias.${i}.nome" id="hp-n-${i}" value="${esc(h.nome)}" aria-label="Nome" style="font-weight:700"><input data-campo="habilidadesProprias.${i}.custo" id="hp-c-${i}" value="${esc(h.custo)}" placeholder="Custo (ex.: 2 PE)" style="margin-top:4px" aria-label="Custo"><textarea data-campo="habilidadesProprias.${i}.resumo" id="hp-r-${i}" placeholder="O que faz">${esc(h.resumo)}</textarea></div>`).join('') || '<p class="apagado">Itens amaldiçoados, bênçãos do mestre, homebrews…</p>'}
  </section>
  <section class="painel"><h2 class="faixa">Progressão</h2>
    <ul class="progressao">${d.progressao.map(l => `<li class="${l.atingido ? 'atingido' : ''}"><span class="n">${esc(l.rotulo)}</span><span>${l.itens.map(esc).join(', ')}</span></li>`).join('')}</ul>
  </section></div>`;
}

// ---------- Aba RITUAIS ----------
// Pedido do projeto: cada ritual tem a SUA caixinha de seleção na cor do elemento.
function abaRituais(f, d, ui) {
  const filtro = ui.ritFiltro || { busca: '', elemento: '', circulo: '' };
  const conhecidos = new Set(f.rituais.map(r => semAcento(r.nome) + '|' + r.elemento));
  const lista = RITUAIS.filter(r => (r.fonte !== 'SaH' || f.modo === 'sah')
    && (!filtro.elemento || r.elemento === filtro.elemento) && (!filtro.circulo || r.circulo === Number(filtro.circulo))
    && (!filtro.busca || semAcento(r.nome + ' ' + r.resumo).includes(semAcento(filtro.busca))));
  const podeConjurar = f.classe === 'ocultista' || f.rituais.length > 0 || (f.trilha === 'esoterico');
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Rituais conhecidos</h2>
    <div class="linha"><span class="etiqueta">DT ${d.dtRitual}</span><span class="etiqueta">Círculo máx. ${d.circuloMax}º</span><button class="btn pequeno" data-acao="ritual-proprio">+ Ritual próprio</button></div></div>
    ${!podeConjurar ? '<p class="apagado">Só ocultistas conjuram rituais desde o início (outros podem aprender por poderes, trilhas ou origem).</p>' : ''}
    <div class="grade c2">${f.rituais.map((r, i) => cartaoRitual(f, d, r, i)).join('') || '<p class="vazio" style="grid-column:1/-1">Nenhum ritual. Marque as caixinhas na lista abaixo.</p>'}</div>
    <p class="apagado" style="font-size:.88rem;margin-top:8px">Custo: 1º círculo 1 PE · 2º 3 PE · 3º 6 PE · 4º 10 PE. DT = 10 + limite de ${d.pd ? 'PD' : 'PE'} + Presença.${f.classe === 'ocultista' && !temOpcional(f, 'patentes') ? ' Ocultista: 3 rituais de 1º círculo no início e +1 a cada NEX.' : ''}</p>
  </section>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Grimório</h2><span class="apagado">${lista.length} rituais</span></div>
    <div class="linha" style="margin-bottom:12px">
      <input type="search" class="filtro" placeholder="Procurar ritual…" data-rit-filtro="busca" id="rit-busca" value="${esc(filtro.busca)}" aria-label="Procurar ritual">
      <select data-rit-filtro="elemento" style="width:auto" aria-label="Elemento"><option value="">Todos os elementos</option>${ELEMENTOS.map(e => `<option value="${e.id}" ${filtro.elemento === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
      <select data-rit-filtro="circulo" style="width:auto" aria-label="Círculo"><option value="">Todos os círculos</option>${CIRCULOS.map(c => `<option value="${c.n}" ${Number(filtro.circulo) === c.n ? 'selected' : ''}>${c.n}º círculo</option>`).join('')}</select>
    </div>
    <div class="caixas-ritual">${lista.map(r => {
      const marcado = conhecidos.has(semAcento(r.nome) + '|' + r.elemento);
      const acima = r.circulo > d.circuloMax;
      return `<label class="caixa-ritual el-${r.elemento} ${marcado ? 'marcada' : ''} ${acima ? 'acima' : ''}">
        <input type="checkbox" data-acao-check="ritual-catalogo" data-id="${r.id}" data-elemento="${r.elemento}" ${marcado ? 'checked' : ''} aria-label="${esc(r.nome)} (${ELEM[r.elemento].nome}, ${r.circulo}º círculo)">
        <span class="caixa-check" aria-hidden="true"></span>
        ${sigilo(r.elemento, 'var(--el)')}
        <span class="txt"><b>${esc(r.nome)}</b> <small class="dossie-txt">${ELEM[r.elemento].nome} ${r.circulo}${fonteTag(r.fonte)}</small><small>${esc(r.resumo)}</small>${acima ? '<small class="aviso-circulo">Círculo acima do seu acesso</small>' : ''}</span>
      </label>`;
    }).join('')}</div>
  </section>`;
}
function cartaoRitual(f, d, r, i) {
  const e = ELEM[r.elemento] || ELEM.variavel;
  const custo = CIRCULOS[r.circulo - 1].custo;
  const campo = (k, rot) => `<label class="campo"><span>${rot}</span><input data-campo="rituais.${i}.${k}" id="rit-${i}-${k}" value="${esc(r[k])}"></label>`;
  return `<article class="ritual el-${r.elemento}">
    <div class="cab"><label class="caixa-mini"><input type="checkbox" data-acao-check="ritual-esquecer" data-i="${i}" checked aria-label="Conhecido: desmarque para esquecer ${esc(r.nome)}"><span class="caixa-check" aria-hidden="true"></span></label>
      ${sigilo(r.elemento, 'var(--el)')}<div style="flex:1"><input data-campo="rituais.${i}.nome" id="rit-${i}-nome" value="${esc(r.nome)}" aria-label="Nome do ritual" style="font-family:var(--fonte-titulo);font-weight:700"></div>
      <span class="etiqueta" style="border-color:var(--el)">${r.circulo}º · ${custo} ${d.pd ? 'PD' : 'PE'}</span></div>
    <div class="grade-mini">
      <label class="campo"><span>Elemento</span><select data-campo="rituais.${i}.elemento">${ELEMENTOS.map(x => `<option value="${x.id}" ${r.elemento === x.id ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></label>
      <label class="campo"><span>Círculo</span><select data-campo="rituais.${i}.circulo" data-tipo="int">${CIRCULOS.map(c => `<option value="${c.n}" ${r.circulo === c.n ? 'selected' : ''}>${c.n}º</option>`).join('')}</select></label>
      ${campo('execucao', 'Execução')}${campo('alcance', 'Alcance')}${campo('alvo', 'Alvo/Área')}${campo('duracao', 'Duração')}${campo('resistencia', 'Resistência')}
      <label class="campo"><span>Dano/cura</span><input data-campo="rituais.${i}.formula" id="rit-${i}-formula" value="${esc(r.formula)}" placeholder="ex.: 3d6+3"></label>
    </div>
    <label class="campo" style="margin-top:8px"><span>Efeito</span><textarea data-campo="rituais.${i}.efeito" id="rit-${i}-efeito" placeholder="Resumo do efeito, formas discente e verdadeira…">${esc(r.efeito)}</textarea></label>
    <div class="linha" style="margin-top:8px"><button class="btn pequeno sangue" data-acao="conjurar" data-i="${i}">Conjurar (−${custo} ${d.pd ? 'PD' : 'PE'})</button>${r.formula ? `<button class="btn pequeno" data-acao="rolar-ritual" data-i="${i}">Rolar ${esc(r.formula)}</button>` : ''}<span class="espaco"></span><span class="apagado dossie-txt">DT ${d.dtRitual}</span></div>
  </article>`;
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
    ${lim ? `<table class="tabela"><thead><tr><th>Categoria</th><th>I</th><th>II</th><th>III</th><th>IV</th></tr></thead><tbody><tr><td>Em uso / limite</td>${[1, 2, 3, 4].map(c => `<td class="num" style="${d.usoCategoria[c] > lim[c - 1] ? 'color:var(--perigo)' : ''}">${d.usoCategoria[c]} / ${lim[c - 1]}</td>`).join('')}</tr></tbody></table><p style="margin-top:8px">Crédito: <b>${esc(d.patente.credito)}</b> · ${f.pp} PP${PATENTES[d.patente.n] ? ` (próxima: ${PATENTES[d.patente.n].nome} com ${PATENTES[d.patente.n].pp} PP)` : ''}</p>`
      : '<p>Um item de categoria I e itens de categoria 0 compatíveis com a origem. Não usa patente.</p>'}
  </section></div>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa sangue">Itens</h2><div class="linha"><button class="btn pequeno" data-acao="add-item-lista">+ Da lista</button><button class="btn pequeno" data-acao="add-item">+ Item livre</button></div></div>
    ${f.itens.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Item</th><th>Qtd</th><th>Cat.</th><th>Esp.</th><th></th></tr></thead><tbody>${f.itens.map((it, i) => `<tr>
      <td><input data-campo="itens.${i}.nome" id="it-n-${i}" value="${esc(it.nome)}" aria-label="Nome do item"><input data-campo="itens.${i}.nota" id="it-o-${i}" value="${esc(it.nota)}" placeholder="anotação" style="margin-top:3px;font-size:.88rem;min-height:30px" aria-label="Anotação"></td>
      <td><input type="number" min="0" style="width:64px" data-campo="itens.${i}.qtd" data-tipo="int" id="it-q-${i}" value="${it.qtd}" aria-label="Quantidade"></td>
      <td><select data-campo="itens.${i}.categoria" data-tipo="int" aria-label="Categoria">${[0, 1, 2, 3, 4].map(c => `<option value="${c}" ${it.categoria === c ? 'selected' : ''}>${cat(c)}</option>`).join('')}</select></td>
      <td><input type="number" min="0" step="0.25" style="width:70px" data-campo="itens.${i}.espacos" data-tipo="num" id="it-e-${i}" value="${it.espacos}" aria-label="Espaços"></td>
      <td><button class="icone-btn" data-acao="remover" data-lista="itens" data-i="${i}" aria-label="Remover ${esc(it.nome)}">✕</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Mochila vazia.</p>'}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">Armas e proteções ficam na aba Combate e também contam na carga.</p>
  </section>`;
}

// ---------- Aba NOTAS ----------
function abaNotas(f) {
  const area = (k, rot, ph, alto = 140) => `<label class="campo"><span>${rot}</span><textarea data-campo="${k}" id="f-${k}" placeholder="${esc(ph)}" style="min-height:${alto}px">${esc(f[k])}</textarea></label>`;
  return `<section class="painel"><h2 class="faixa">Dossiê do agente</h2>
    <div class="grade c2"><label class="campo"><span>Jogador(a)</span><input data-campo="jogador" id="f-jogador" value="${esc(f.jogador)}"></label><label class="campo"><span>Conceito</span><input data-campo="conceito" id="f-conceito" value="${esc(f.conceito)}"></label><label class="campo"><span>Idade</span><input data-campo="idade" id="f-idade" value="${esc(f.idade)}"></label>
    <label class="campo"><span>Afinidade elemental</span><select data-campo="elementoAfinidade"><option value="">Nenhuma</option>${ELEMENTOS.filter(e => e.id !== 'variavel').map(e => `<option value="${e.id}" ${f.elementoAfinidade === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label></div>
    <div class="grade" style="margin-top:12px">${area('aparencia', 'Aparência', 'Como o agente se parece, marcas, roupas…', 90)}${area('historia', 'História', 'O que fazia antes, o primeiro contato com o paranormal…')}${area('notas', 'Anotações da missão', 'Pistas, nomes, lugares…', 220)}</div>
  </section>
  <section class="painel" style="margin-top:14px"><h2 class="faixa">Regras desta ficha</h2>
    <p><span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}">${esc(MODOS[f.modo].nome)}</span></p>
    ${f.modo === 'sah' ? `<div class="opcionais">${Object.entries(OPCIONAIS).map(([k, o]) => `<label class="check opcional"><input type="checkbox" data-acao-check="opcional" data-k="${k}" ${f.opcionais[k] ? 'checked' : ''}><span><b>${esc(o.nome)}</b><small>${esc(o.resumo)}</small></span></label>`).join('')}</div>` : '<p class="apagado">Ficha nas regras padrão do Livro de Regras.</p>'}
    <div class="linha" style="margin-top:14px"><button class="btn" data-acao="duplicar-ficha">Duplicar ficha</button><button class="btn perigo" data-acao="apagar-ficha">Apagar agente</button></div>
  </section>`;
}

// ---------- Ações da ficha ----------
export function acoesFicha(ctx) {
  const f = () => ctx.fichaAtual();
  const salvar = (render = true) => { ctx.salvarFicha(f()); if (render) ctx.render(); };
  const quem = () => f().nome || 'Agente';
  return {
    'aba': el => { ctx.estado.ui.aba = el.dataset.aba; ctx.render(); },
    'rolar-pericia': el => { const d = derivar(f()); const p = d.PER[el.dataset.id]; if (p.bloqueada) ctx.avisar(`${p.nome} só pode ser usada se você for treinado.`); rolarTesteUI({ titulo: p.nome, quem: quem(), dados: p.dados, bonus: p.bonus }); },
    'rolar-atributo': el => { const d = derivar(f()); const a = ATRIBUTOS.find(x => x.id === el.dataset.atr); const aj = d.ajusteDados[a.id] + d.ajusteDados.todos; const n = f().atributos[a.id] + aj; rolarTesteUI({ titulo: a.nome, quem: quem(), dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2 - n, pior: true }, bonus: 0 }); },
    'rolar-iniciativa': () => { const d = derivar(f()); rolarTesteUI({ titulo: 'Iniciativa', quem: quem(), dados: d.iniciativa.dados, bonus: d.iniciativa.bonus }); },
    'rolar-ataque': el => { const a = derivar(f()).ataques[Number(el.dataset.i)]; rolarTesteUI({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, tipo: 'ataque', formulaDano: a.formula }); },
    'rolar-dano': el => { const a = derivar(f()).ataques[Number(el.dataset.i)]; rolarDanoUI({ titulo: `Dano · ${a.nome}`, quem: quem(), formula: a.formula }); },
    'rolar-ritual': el => { const r = f().rituais[Number(el.dataset.i)]; rolarDanoUI({ titulo: r.nome, quem: quem(), formula: r.formula }); },
    'conjurar': el => {
      const ficha = f(), d = derivar(ficha), r = ficha.rituais[Number(el.dataset.i)], custo = CIRCULOS[r.circulo - 1].custo;
      const k = d.pd ? 'pd' : 'pe'; const atual = d.atual[k];
      if (custo > Math.max(d.limiteRitual, CIRCULOS[0].custo)) ctx.avisar(`Atenção: o custo (${custo}) passa do seu limite por turno (${d.limiteRitual}).`);
      if (atual < custo) { ctx.avisar(`${k.toUpperCase()} insuficiente.`, true); return; }
      ficha.recursos[k] = atual - custo; salvar(); ctx.avisar(`${r.nome} conjurado: −${custo} ${k.toUpperCase()}.`);
    },
    'rec-mudar': el => {
      const ficha = f(), d = derivar(ficha), k = el.dataset.rec, inp = document.getElementById('qtd-' + k);
      const q = inteiro(inp?.value, 0, 9999, 0); if (!q) { inp?.focus(); return; }
      const max = { pv: d.pv, pe: d.pe, san: d.san, pd: d.pdMax }[k];
      const novo = d.atual[k] + q * Number(el.dataset.sinal);
      ficha.recursos[k] = Math.min(max, novo);
      if (k === 'pv' && ficha.recursos.pv > 0) ficha.recursos.morrendo = 0;
      if (k === 'san' && ficha.recursos.san > 0) ficha.recursos.enlouquecendo = 0;
      salvar();
    },
    'rec-cheio': el => { const ficha = f(); ficha.recursos[el.dataset.rec] = null; if (el.dataset.rec === 'pv') ficha.recursos.morrendo = 0; salvar(); },
    'contador': el => { const ficha = f(); ficha.recursos[el.dataset.c] = Math.min(3, ficha.recursos[el.dataset.c] + 1); salvar(); if (ficha.recursos[el.dataset.c] >= 3) ctx.avisar(el.dataset.c === 'morrendo' ? 'Três turnos morrendo: o agente morreu.' : 'Três turnos enlouquecendo: o agente ficou insano.', true); },
    'condicao': el => { const ficha = f(); const id = el.dataset.id; ficha.condicoes = ficha.condicoes.includes(id) ? ficha.condicoes.filter(c => c !== id) : [...ficha.condicoes, id]; salvar(); },
    'rolar-ferimento': () => { const ficha = f(); const n = d(6); const atr = FERIMENTOS[n - 1]; if (atr) { ficha.ferimentos.push(atr); salvar(); } ctx.avisar(`1d6 = ${n}: ${atr ? 'ferimento em ' + ATRIBUTOS.find(a => a.id === atr).nome : 'ferimento superficial (nenhum atributo)'}.`); },
    'remover': el => { const ficha = f(); const lista = ficha[el.dataset.lista]; const i = Number(el.dataset.i); const nome = lista[i]?.nome || ''; if (['poderes', 'protecoes', 'habilidadesProprias', 'itens'].includes(el.dataset.lista) && nome && !confirm(`Remover "${nome}"?`)) return; lista.splice(i, 1); salvar(); },
    'subir-nivel': () => {
      const ficha = f();
      if (ehSobrevivente(ficha)) { if (ficha.estagio >= 5) return ctx.avisar('Estágio máximo. Se a Ordem o recrutar, crie a versão com a nova classe (Treinamento Especial).'); ficha.estagio++; }
      else if (temOpcional(ficha, 'patentes')) { const p = PATENTES.find(x => x.pp > ficha.pp); if (!p) return ctx.avisar('Já é agente de elite.'); ficha.pp = p.pp; }
      else if (temOpcional(ficha, 'nivelExp')) { if (ficha.nivel >= 20) return; ficha.nivel++; }
      else { const i = NEX.indexOf(ficha.nex); if (i >= NEX.length - 1) return ctx.avisar('NEX 99% é o máximo.'); ficha.nex = NEX[i + 1]; }
      ficha.recursos.pv = ficha.recursos.pe = ficha.recursos.san = ficha.recursos.pd = null;
      salvar(); const dd = derivar(ficha); ctx.avisar(`Agora: ${dd.textoNivel}. Veja a Progressão na aba Habilidades.`);
    },
    'editar-atributos': () => {
      const at = f().atributos;
      abrirModal('Atributos', `<p class="apagado">Use para aumentos de atributo (NEX 20%, 50%, 80%, 95%) ou correções.</p><div class="grade c3">${ATRIBUTOS.map(a => `<label class="campo"><span>${a.nome}</span><input type="number" min="0" max="7" data-modal-atr="${a.id}" value="${at[a.id]}"></label>`).join('')}</div>`, '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="salvar-atributos">Salvar</button>');
    },
    'salvar-atributos': () => { const ficha = f(); document.querySelectorAll('[data-modal-atr]').forEach(i => { ficha.atributos[i.dataset.modalAtr] = inteiro(i.value, 0, 7, 1); }); fecharModal(); salvar(); },
    'retrato': async () => {
      const arq = await escolherArquivo('image/png,image/jpeg,image/webp'); if (!arq) return;
      try { f().retrato = await reduzirImagem(arq); salvar(); } catch (e) { ctx.avisar(e.message, true); }
    },
    'add-arma': () => {
      const ficha = f(); const prof = derivar(ficha).prof;
      abrirModal('Adicionar arma', `<div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${ARMAS.map((a, i) => `<button class="cartao" data-acao="add-arma-catalogo" data-i="${i}"><b>${esc(a.nome)}</b><small class="dossie-txt">${a.dano} ${TIPOS_DANO[a.tipo] || ''} · ${a.margem < 20 ? a.margem + '/' : ''}×${a.mult} · cat. ${cat(a.categoria)}</small><small>${a.prof === 'simples' ? 'Simples' : a.prof === 'taticas' ? 'Tática' : 'Pesada'} · ${a.uso === 'corpo' ? 'corpo a corpo' : a.uso === 'fogo' ? 'arma de fogo' : 'disparo'}${(a.prof === 'taticas' && !prof.taticas) || (a.prof === 'pesadas' && !prof.pesadas) ? ' · <span style="color:var(--perigo)">sem proficiência</span>' : ''}</small></button>`).join('')}
        <button class="cartao" data-acao="add-arma-catalogo" data-i="-1"><b>Arma própria</b><small>Preencha os números você mesmo.</small></button></div>`, '', true);
    },
    'add-arma-catalogo': el => {
      const i = Number(el.dataset.i); const ficha = f();
      const base = i >= 0 ? { ...ARMAS[i] } : { nome: 'Arma improvisada', prof: 'simples', uso: 'corpo', categoria: 0, dano: '1d6', margem: 20, mult: 2, alcance: '—', tipo: 'I', espacos: 1 };
      ficha.armas.push({ ...base, uid: uid() }); fecharModal(); ctx.salvarFicha(ficha); ctx.render();
      acoesFicha(ctx)['editar-arma']({ dataset: { i: String(ficha.armas.length - 1) } });
    },
    'editar-arma': el => {
      const i = Number(el.dataset.i), a = f().armas[i];
      const c = (k, rot, tipo = 'text', extra = '') => `<label class="campo"><span>${rot}</span><input type="${tipo}" data-modal-arma="${k}" value="${esc(a[k])}" ${extra}></label>`;
      const s = (k, rot, ops) => `<label class="campo"><span>${rot}</span><select data-modal-arma="${k}">${ops.map(([v, n]) => `<option value="${v}" ${String(a[k]) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
      abrirModal(`Arma · ${a.nome}`, `<div class="grade c2">${c('nome', 'Nome')}${s('uso', 'Tipo de ataque', [['corpo', 'Corpo a corpo (Luta)'], ['arremesso', 'Arremesso (Pontaria + For no dano)'], ['disparo', 'Disparo (Pontaria)'], ['fogo', 'Arma de fogo (Pontaria)']])}
        ${s('prof', 'Proficiência', [['simples', 'Simples'], ['taticas', 'Tática'], ['pesadas', 'Pesada']])}${c('dano', 'Dano (ex.: 2d6)')}
        ${c('margem', 'Margem de ameaça', 'number', 'min="2" max="20"')}${c('mult', 'Multiplicador', 'number', 'min="2" max="6"')}
        ${c('bonusAtaque', 'Bônus no ataque', 'number')}${c('bonusDano', 'Bônus no dano', 'number')}
        ${s('categoria', 'Categoria', [[0, '0'], [1, 'I'], [2, 'II'], [3, 'III'], [4, 'IV']])}${c('espacos', 'Espaços', 'number', 'min="0" step="0.5"')}
        ${c('alcance', 'Alcance')}${s('tipo', 'Tipo de dano', Object.entries(TIPOS_DANO))}${c('municao', 'Munição')}${c('nota', 'Anotação (modificações, maldições…)')}</div>`,
        `<button class="btn perigo" data-acao="remover-arma" data-i="${i}">Remover</button><span class="espaco"></span><button class="btn sangue" data-acao="salvar-arma" data-i="${i}">Salvar</button>`, true);
    },
    'salvar-arma': el => {
      const ficha = f(), i = Number(el.dataset.i), a = { ...ficha.armas[i] };
      document.querySelectorAll('[data-modal-arma]').forEach(inp => { a[inp.dataset.modalArma] = inp.type === 'number' ? Number(inp.value) : inp.value; });
      a.categoria = Number(a.categoria);
      ficha.armas[i] = normalizar({ ...ficha, armas: [a] }).armas[0]; fecharModal(); salvar();
    },
    'remover-arma': el => { const ficha = f(); if (!confirm('Remover esta arma?')) return; ficha.armas.splice(Number(el.dataset.i), 1); fecharModal(); salvar(); },
    'add-protecao': () => abrirModal('Adicionar proteção', `<div class="cartoes">${PROTECOES.map((p, i) => `<button class="cartao" data-acao="add-protecao-catalogo" data-i="${i}"><b>${esc(p.nome)}</b><small>Defesa +${p.defesa}${p.rd ? `, RD ${p.rd} (balístico, corte, impacto, perfuração)` : ''}${p.penalidade ? `, −${p.penalidade} nas perícias de carga` : ''} · cat. ${cat(p.categoria)} · ${p.espacos} esp.</small></button>`).join('')}</div>`),
    'add-protecao-catalogo': el => { const ficha = f(); const p = PROTECOES[Number(el.dataset.i)]; ficha.protecoes.push({ ...p, rd: p.rd || 0, vestida: true, uid: uid() }); fecharModal(); salvar(); },
    'add-item': () => { const ficha = f(); ficha.itens.push({ uid: uid(), nome: 'Novo item', categoria: 0, espacos: 1, qtd: 1, nota: '' }); salvar(); },
    'add-item-lista': () => abrirModal('Adicionar item', `<div class="cartoes">${ITENS_GERAIS.map((it, i) => `<button class="cartao" data-acao="add-item-catalogo" data-i="${i}"><b>${esc(it.nome)}</b><small>cat. ${cat(it.categoria)} · ${it.espacos} esp.</small></button>`).join('')}</div>`),
    'add-item-catalogo': el => { const ficha = f(); const it = ITENS_GERAIS[Number(el.dataset.i)]; ficha.itens.push({ ...it, qtd: 1, nota: '', uid: uid() }); fecharModal(); salvar(); },
    'add-propria': () => { const ficha = f(); ficha.habilidadesProprias.push({ uid: uid(), nome: 'Nova habilidade', resumo: '', custo: '' }); salvar(); },
    'escolher-poder': () => {
      const ficha = f(), d = derivar(ficha);
      const lista = poderesParaFicha(ficha);
      const grupos = [['Classe', p => p.classe === ficha.classe], ['Todas as classes', p => p.classe === 'todas'], ['Gerais (SaH)', p => p.classe === 'geral' || (p.classe !== ficha.classe && p.classe !== 'todas')]];
      abrirModal('Escolher poder', `<input type="search" placeholder="Procurar poder…" data-filtro-modal autofocus aria-label="Procurar poder" style="margin-bottom:10px">
        ${grupos.map(([nome, fn]) => { const ps = lista.filter(fn); return ps.length ? `<h3 class="titulo-vermelho">${nome}</h3><div class="cartoes">${ps.map(p => { const tem = ficha.poderes.some(x => x.id === p.id); const ok = cumpreRequisito(ficha, d, p.req); return `<button class="cartao" data-acao="add-poder" data-id="${p.id}" data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${tem && !p.repete ? 'disabled' : ''}><span class="linha"><b>${esc(p.nome)}</b><span class="espaco"></span>${fonteTag(p.fonte)}</span>${p.req ? `<small style="color:${ok ? 'var(--ok)' : 'var(--perigo)'}">Pré: ${esc(p.req)}</small>` : ''}<small>${esc(p.resumo)}</small></button>`; }).join('')}</div>` : ''; }).join('')}`, '', true);
    },
    'add-poder': el => {
      const ficha = f(), p = PODER[el.dataset.id];
      let escolha = '';
      if (p.id === 'foco-em-pericia') { escolha = prompt('Qual perícia? (escreva o nome, ex.: Investigação)') || ''; const per = PERICIAS.find(x => semAcento(x.nome) === semAcento(escolha)); if (!per) return ctx.avisar('Perícia não encontrada.', true); escolha = per.id; }
      else if (['especialista-em-elemento', 'mestre-em-elemento', 'ritual-predileto', 'treinamento-em-pericia', 'transcender'].includes(p.id)) escolha = prompt(p.id === 'treinamento-em-pericia' ? 'Quais perícias? (anote; marque o grau na aba Agente)' : p.id === 'transcender' ? 'Qual poder paranormal?' : 'Qual elemento/ritual?') || '';
      ficha.poderes.push({ id: p.id, escolha, uid: uid() }); fecharModal(); salvar(); ctx.avisar(`${p.nome} adicionado.`);
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
    'ritual-catalogo': el => {
      const ficha = f(); const r = RITUAIS.find(x => x.id === el.dataset.id);
      const chave = semAcento(r.nome) + '|' + r.elemento;
      if (el.checked) ficha.rituais.push({ uid: uid(), nome: r.nome, elemento: r.elemento === 'variavel' ? 'variavel' : r.elemento, circulo: r.circulo, efeito: r.resumo });
      else ficha.rituais = ficha.rituais.filter(x => semAcento(x.nome) + '|' + x.elemento !== chave);
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
    },
    'ritual-esquecer': el => { const ficha = f(); const r = ficha.rituais[Number(el.dataset.i)]; if (!confirm(`Esquecer o ritual "${r.nome}"?`)) { el.checked = true; return; } ficha.rituais.splice(Number(el.dataset.i), 1); ctx.salvarFicha(ficha); ctx.render(); },
    'opcional': el => {
      const ficha = f(); ficha.opcionais[el.dataset.k] = el.checked;
      if (el.dataset.k === 'patentes' && el.checked) { ficha.opcionais.determinacao = true; ficha.opcionais.nivelExp = false; }
      if (el.dataset.k === 'nivelExp' && el.checked) ficha.opcionais.patentes = false;
      const n = normalizar(ficha); Object.assign(ficha, n); ctx.salvarFicha(ficha); ctx.render();
    },
  };
}
