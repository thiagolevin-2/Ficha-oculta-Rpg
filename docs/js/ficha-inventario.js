// Aba INVENTÁRIO: itens, proteções, modificações e maldições, componentes e acessórios.
import { carregarModelosItens, salvarModelosItens } from './armazenamento.js?v=0.47';
import { registrarMaldições, AMALDICOADOS, CONJURACAO, PROTECAO_ELEMENTAL, ELEMENTOS_MALDICAO, passivoAmaldicoado } from './amaldicoados.js?v=0.47';
import { derivar, normalizar, ehSobrevivente, temOpcional, TIPOS_EFEITO_ITEM, quantidadeMaldicoes, categoriaEquipamento } from './regras.js?v=0.47';
import { sofrerDano } from './combate.js?v=0.47';
import { ATRIBUTOS, PERICIAS, PERICIA, CIRCULOS, ITENS_CATALOGO, ITEM_INFO, PATENTES, RITUAIS, PODERES_PARANORMAIS, PODER_PARANORMAL, MODIFICACOES, MODIFICACAO } from './catalogo.js?v=0.47';
import { MOD_ACESSORIOS, moverPacoteParaReserva, PASSIVOS_ITENS } from './equipamentos.js?v=0.47';
import { esc, comSinal, romano, sigilo, semAcento, uid } from './util.js?v=0.47';


import { rolarTesteUI, abrirModal, fecharModal } from './rolagem.js?v=0.47';
import { NOME_EL, descreverPassivo } from './ficha-combate.js?v=0.47';
import { ELEM, alfa, cat, fonteTag, janelaEscolha } from './ficha-base.js?v=0.47';
import { acoesFicha } from './fichaUI.js?v=0.47';

// ---------- Modificar e Amaldiçoar (cartões que abrem janelas; a ficha recalcula categoria, espaços e carga) ----------
export const MALDICOES_ACESSORIO = Object.keys(AMALDICOADOS).filter(n => n.startsWith('Acessório amaldiçoado: '));
export const NOME_EL_MALDICAO = { conhecimento: 'Conhecimento', energia: 'Energia', morte: 'Morte', sangue: 'Sangue', variavel: 'Elemento à escolha' };
export const alvoMod = (f, tipo, i) => (tipo === 'arma' ? f.armas[i] : tipo === 'protecao' ? f.protecoes[i] : f.itens[i]);
export const campoMod = (tipo, modo) => (tipo === 'item' && modo === 'amaldicoar' ? 'maldicoes' : 'mods');
export const itemEspecial = it => Object.hasOwn(AMALDICOADOS, it.nome) || /^Itens amaldiçoados/i.test(ITEM_INFO[it.nome]?.grupo || '');
export const botaoDiasMaldicao = it => `<button class="btn pequeno" data-acao="dias-maldicao" data-uid="${esc(it.uid)}">Dias de uso: ${it.diasVestido || 0}</button>`;
export const botaoElementoMaldicao = (it, i, k = -1) => {
  const el = k < 0 ? it.elementoMaldicao : it.elementosMaldicoes?.[k];
  return `<button class="btn pequeno" data-acao="elemento-maldicao" data-i="${i}" data-k="${k}">${el ? `Elemento: ${NOME_EL[el]}` : 'Escolher elemento'}</button>`;
};
// Opções da janela: modificações comuns ou maldições (arma pelo tipo de ataque, proteção pelo peso, acessório: maldições de acessório)
export function opcoesMod(f, tipo, alvo, modo) {
  if (tipo === 'item') return modo === 'amaldicoar'
    && !itemEspecial(alvo) ? MALDICOES_ACESSORIO.map(n => ({ id: n, nome: n.replace('Acessório amaldiçoado: ', ''), el: AMALDICOADOS[n].el, resumo: ITEM_INFO[n]?.resumo || AMALDICOADOS[n].nota || '' }))
    : [];
  const chave = tipo === 'arma' ? (modo === 'amaldicoar' ? 'corpo' : alvo.uso) : alvo.peso;
  return MODIFICACOES.filter(m => m.para.includes(chave) && (modo === 'amaldicoar' ? !!m.maldicao : !m.maldicao) && (m.fonte !== 'SaH' || f.modo === 'sah'))
    .sort((x, y) => x.nome.localeCompare(y.nome, 'pt'))
    .map(m => ({ id: m.id, nome: m.nome, el: m.maldicao, resumo: m.resumo, fonte: m.fonte, espacos: m.ef?.espacos || 0 }));
}
// Categoria efetiva e espaços do alvo, do mesmo jeito que a ficha calcula
export function numerosAlvo(d, tipo, alvo) {
  const mods = alvo.mods || [];
  const espMods = mods.reduce((x, m) => x + (MODIFICACAO[m]?.ef?.espacos || 0), 0);
  const mochila = tipo === 'item' && d.itemMochila === alvo.uid ? 1 : 0;
  const categoria = tipo === 'arma' ? d.ataques.find(x => x.uid === alvo.uid)?.categoriaEfetiva : undefined;
  return {
    cat: categoria ?? Math.max(0, categoriaEquipamento(alvo) - mochila),
    esp: Math.max(0, alvo.espacos + espMods - Number(tipo === 'item' && mods.includes('discreto')) - mochila),
  };
}
// Os dois cartões: Modificar e Amaldiçoar
export function cartoesMod(d, tipo, i, alvo, daJanelaEditar = false) {
  const mods = alvo.mods || [];
  const nMal = quantidadeMaldicoes(alvo);
  const nMod = tipo === 'item' ? mods.length : mods.length - nMal;
  const n = numerosAlvo(d, tipo, alvo);
  const plural = (k, um, varios, nada) => (k ? `${k} ${k === 1 ? um : varios}` : nada);
  return `<div class="cartoes cartoes-mod">
      ${tipo !== 'item' || ehAcessorio(alvo) ? `<button class="cartao" data-acao="${tipo === 'item' ? 'acessorio' : daJanelaEditar ? 'editar-para-mod' : 'janela-mod'}" data-tipo="${tipo}" data-i="${i}" data-modo="modificar"><b>Modificar</b><small>${plural(nMod, 'modificação', 'modificações', 'Nenhuma modificação')}${tipo === 'item' ? ' · perícia' : ''}</small></button>` : ''}
      <button class="cartao cartao-amaldicoar" data-acao="${daJanelaEditar ? 'editar-para-mod' : 'janela-mod'}" data-tipo="${tipo}" data-i="${i}" data-modo="amaldicoar"><b>Amaldiçoar</b><small>${plural(nMal, 'maldição', 'maldições', 'Sem maldição')}</small></button>
    </div><small class="apagado">Categoria ${cat(n.cat)} · ${n.esp} espaço(s)</small>`;
}
export function janelaMod(f, tipo, i, modo) {
  const alvo = alvoMod(f, tipo, i); if (!alvo) return;
  const d = derivar(f), n = numerosAlvo(d, tipo, alvo), marcadas = alvo[campoMod(tipo, modo)] || [], ops = opcoesMod(f, tipo, alvo, modo);
  const amaldicoar = modo === 'amaldicoar';
  const aumentoMal = quantidadeMaldicoes(alvo) ? '+I' : '+II';
  const lim = ehSobrevivente(f) ? null : d.patente?.itens;
  const painel = `<div class="numeros-chave numeros-mod">
      <div class="chave"><b>${cat(n.cat)}</b><span>Categoria</span></div><div class="chave"><b>${n.esp}</b><span>Espaços</span></div>
      <div class="chave"><b class="${d.sobrecarregado ? 'erro' : ''}">${d.cargaUsada}/${d.cargaMax}</b><span>Carga da ficha</span></div>
      ${n.cat && lim ? `<div class="chave"><b class="${d.usoCategoria[n.cat] > lim[n.cat - 1] ? 'erro' : ''}">${d.usoCategoria[n.cat]}/${lim[n.cat - 1]}</b><span>Itens cat. ${cat(n.cat)}</span></div>` : ''}</div>`;
  const cartao = o => {
    const on = marcadas.includes(o.id), el = o.el ? (NOME_EL_MALDICAO[o.el] ? o.el : 'variavel') : '';
    return `<button class="cartao${el ? ` el-${el}` : ''}" ${el ? 'style="border-left:4px solid var(--el)"' : ''} ${amaldicoar ? '' : `aria-pressed="${on}"`} data-acao="alternar-mod" data-tipo="${tipo}" data-i="${i}" data-modo="${modo}" data-id="${esc(o.id)}">
      <span class="linha"><b>${esc(o.nome)}</b><span class="espaco"></span>${fonteTag(o.fonte || '')}<span class="etiqueta">${amaldicoar ? `Adicionar · ${aumentoMal} categoria` : on ? '✓ aplicada' : '+1 categoria'}</span></span>
      <small>${esc(o.resumo)}</small>${o.espacos ? `<small class="apagado">${o.espacos > 0 ? '+' : '−'}${Math.abs(o.espacos)} espaço</small>` : ''}</button>`;
  };
  const aplicadas = amaldicoar ? marcadas.map((id, k) => {
    if (tipo !== 'item' && !MODIFICACAO[id]?.maldicao) return '';
    const nome = MODIFICACAO[id]?.nome || id.replace('Acessório amaldiçoado: ', '');
    return `<div class="def-linha"><span>${esc(nome)}</span><span class="linha">${id === PROTECAO_ELEMENTAL ? botaoElementoMaldicao(alvo, i, k) : ''}<button class="btn pequeno" data-acao="alternar-mod" data-tipo="${tipo}" data-i="${i}" data-modo="${modo}" data-id="${esc(id)}" data-k="${k}" aria-label="Remover ${esc(nome)}">Remover</button></span></div>`;
  }).join('') : '';
  const corpo = modo === 'amaldicoar'
    ? `${aplicadas ? `<h3 class="titulo-vermelho">Maldições aplicadas</h3>${aplicadas}` : ''}${['conhecimento', 'energia', 'morte', 'sangue', 'variavel'].map(el => { const g = ops.filter(o => o.el === el); return g.length ? `<h3 class="titulo-vermelho el-${el}">${sigilo(el, 'var(--el)')} ${NOME_EL_MALDICAO[el]}</h3><div class="cartoes">${g.map(cartao).join('')}</div>` : ''; }).join('')}
       <p class="apagado" style="font-size:.85rem;margin-top:10px">Preço das maldições: ao falhar num teste do atributo do elemento (Int para Conhecimento, Agi para Energia, Pre para Morte, For ou Vig para Sangue), perde 2 de Sanidade por maldição desse elemento.${tipo === 'arma' ? ' O ritual Amaldiçoar Arma (dano extra do elemento) fica em Editar.' : ''}${tipo === 'item' ? ' Equipe o item para ativar os efeitos passivos.' : ''}</p>`
    : `<div class="cartoes">${ops.map(cartao).join('') || '<p class="apagado">Não há modificações para este tipo.</p>'}</div>`;
  abrirModal(`${modo === 'amaldicoar' ? 'Amaldiçoar' : 'Modificar'} · ${alvo.nome}`,
    `<p class="apagado">${amaldicoar ? 'A primeira maldição soma +II à categoria, e as seguintes somam +I. A categoria exibida vai até IV.' : 'Clique para aplicar ou tirar. Cada modificação soma +I à categoria, até IV.'}</p>${painel}${ops.length || aplicadas ? corpo : '<p class="apagado">Não há opções para este item.</p>'}`,
    '<button class="btn sangue" data-acao="fechar-modal">Pronto</button>', true);
}
// ---------- Componentes ritualísticos: cada pacote é de um elemento (não existem de Medo) ----------
export const ELEMENTOS_COMPONENTE = [['sangue', 'Sangue'], ['morte', 'Morte'], ['conhecimento', 'Conhecimento'], ['energia', 'Energia']];
export const ehComponente = it => /^Componentes ritualísticos/.test(it.nome);
export const nomeComponente = el => `Componentes ritualísticos (${ELEMENTOS_COMPONENTE.find(([id]) => id === el)?.[1] || 'elemento'})`;
export const infoItem = it => ITEM_INFO[it.nome] || (ehComponente(it) ? ITEM_INFO['Componentes ritualísticos (elemento)'] : null);
export function escolherElementoComponente(ctx, i) {
  janelaEscolha({ titulo: 'Componentes ritualísticos', intro: 'De qual elemento são estes componentes? Eles servem para conjurar rituais desse elemento.', ordenar: false, busca: false, largo: false,
    opcoes: ELEMENTOS_COMPONENTE.map(([v, n]) => ({ valor: v, nome: n, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)' })),
    aoEscolher: v => { const ficha = ctx.fichaAtual(), it = ficha.itens[i]; if (!it) return; it.elemento = v; it.nome = nomeComponente(v); fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); } });
}
// ---------- Itens do inventário (cartões que abrem como os rituais) ----------
// Cartões abertos continuam abertos depois de salvar (o evento "toggle" não sobe, por isso a captura).
export const ITENS_ABERTOS = new Set();
export const ROTULO_EFEITO = { pericia: 'Perícia', atributo: 'Atributo', defesa: 'Defesa', desl: 'Deslocamento (m)', rd: 'RD (redução de dano)', carga: 'Espaços de carga', pv: 'PV máximos', pe: 'PE máximos', resistencia: 'Testes de resistência' };
export const ehAcessorio = it => ['Utensílio', 'Vestimenta'].includes(it.nome) || it.escrito;
// Como o item é equipado: 'acessorio' (Utensílio/Vestimenta, campo escrito), 'amaldicoado' ou 'comum' (campo ativo).
// '' = o item não muda nada na ficha (não precisa de botão).
export function tipoEquipar(it) {
  const am = AMALDICOADOS[it.nome];
  if (am) return am.vestir || am.passivo ? 'amaldicoado' : '';
  if (ehAcessorio(it)) return 'acessorio';
  return PASSIVOS_ITENS[it.nome] || it.efeitos?.length || it.maldicoes?.length ? 'comum' : '';
}
export const estaEquipado = it => (tipoEquipar(it) === 'acessorio' ? it.escrito : it.ativo);
export const temConjuracao = it => it && (it.nome === CONJURACAO || it.maldicoes?.includes(CONJURACAO));
export function botoesConjuracao(it) {
  if (!temConjuracao(it)) return '';
  const ritual = RITUAIS.find(r => r.id === it.ritualConjuracao);
  const habilitado = it.qtd && estaEquipado(it) ? '' : 'disabled title="Equipe o item para conjurar"';
  return `<div class="linha" style="margin-top:8px"><button class="btn pequeno" data-acao="vincular-conjuracao" data-uid="${esc(it.uid)}">${ritual ? 'Trocar ritual de Conjuração' : 'Vincular ritual de 1º círculo'}</button>
    ${ritual ? `<button class="btn pequeno sangue" data-acao="conjurar-item" data-uid="${esc(it.uid)}" ${habilitado}>Conjurar ${esc(ritual.nome)} (empunhado)</button>` : ''}
    ${ritual && /sustentad/i.test(ritual.duracao) ? `<button class="btn pequeno" data-acao="sustentar-ritual" data-item-uid="${esc(it.uid)}" ${habilitado}>Sustentar</button>` : ''}</div>`;
}
export function botoesUsosMaldicoes(it) {
  if (!it.qtd || !estaEquipado(it)) return '';
  const usos = (it.maldicoes || []).flatMap((nome, indice) =>
    (AMALDICOADOS[nome]?.usos || []).map((u, k) =>
      `<button class="btn pequeno" data-acao="usar-amaldicoado" data-uid="${esc(it.uid)}" data-mal="${indice}" data-u="${k}" title="${esc(u.nota || '')}">${esc(u.nome)}</button>`));
  return usos.length ? `<div class="linha">${usos.join(' ')}</div>` : '';
}
export function descreverEfeitosItem(efeitos) {
  return efeitos.map(e => `${comSinal(e.valor)} ${e.tipo === 'pericia' ? PERICIA[e.alvo]?.nome : e.tipo === 'atributo' ? ATRIBUTOS.find(a => a.id === e.alvo)?.nome : ROTULO_EFEITO[e.tipo]}`).join(', ');
}
// O que o item muda na ficha, em texto curto
export function efeitoDoItem(it) {
  const partes = [], mods = it.mods || [];
  if (ehAcessorio(it) && it.pericia) {
    partes.push(`${mods.includes('aprimorado') ? '+5' : '+2'} ${PERICIA[it.pericia].nome}`);
    if (mods.includes('funcao') && it.periciaExtra) partes.push(`${mods.includes('aprimorado-extra') ? '+5' : '+2'} ${PERICIA[it.periciaExtra].nome}`);
  }
  const am = passivoAmaldicoado(it, it.nome, it.elementoMaldicao);
  if (am) partes.push(descreverPassivo(am));
  const def = PASSIVOS_ITENS[it.nome];
  if (def) {
    const { acessorio, exige, ...ef } = def;
    partes.push(descreverPassivo({ ...ef, pericia: { ...(ef.pericia || {}), ...(acessorio || {}) } }) + (exige ? ` (se for treinado em ${PERICIA[exige].nome})` : ''));
  }
  for (const [k, n] of (it.maldicoes || []).entries()) {
    const p = passivoAmaldicoado(it, n, it.elementosMaldicoes?.[k]);
    const espera = AMALDICOADOS[n]?.diasMinimos && !p ? ' · exige 1 dia de uso' : '';
    partes.push(`${n.replace('Acessório amaldiçoado: ', '')} (maldição)${p ? ': ' + descreverPassivo(p) : espera}`);
  }
  if (it.efeitos?.length) partes.push(descreverEfeitosItem(it.efeitos));
  return partes.filter(Boolean).join(' · ');
}
export function cartaoItem(f, d, itemSalvo, i) {
  const it = { mods: [], efeitos: [], ...itemSalvo }; // item recém-adicionado ainda não passou por normalizar()
  const tipo = tipoEquipar(it), eq = estaEquipado(it), info = infoItem(it), comp = ehComponente(it);
  const pendente = tipo === 'acessorio' && !it.pericia;
  const naMochila = d.itemMochila === it.uid;
  const efeito = efeitoDoItem(it);
  const { cat: catEf, esp: espEf } = numerosAlvo(d, 'item', it);
  const linhaResumo = pendente ? 'Clique para escolher a perícia que este acessório melhora.'
    : efeito ? `Na ficha: ${efeito}${tipo && !eq ? ' (desligado enquanto estiver desequipado)' : ''}`
    : comp && !it.elemento ? 'Escolha o elemento destes componentes.' : info?.resumo || it.nota || 'Clique para ver e editar.';
  return `<details class="ritual ritual-compacto item-cartao${eq ? ' equipado' : ''}${pendente ? ' pendente' : ''}${comp ? ` componente${it.elemento ? ` comp-${it.elemento}` : ''}` : ''}" data-item-uid="${esc(it.uid)}" ${ITENS_ABERTOS.has(it.uid) ? 'open' : ''}>
    <summary${pendente ? ` data-acao="item-escolher" data-i="${i}"` : ''}><span class="cab">${comp && it.elemento ? sigilo(it.elemento, 'var(--el)') : ''}<b>${esc(it.nome)}</b>${it.qtd !== 1 ? `<span class="etiqueta">×${it.qtd}</span>` : ''}</span>
      <span class="linha resumo-rit"><span class="etiqueta">cat. ${cat(catEf)}</span><span class="etiqueta">${espEf} esp.</span>${tipo ? `<span class="etiqueta ${eq ? 'estado-equipado' : 'estado-desequipado'}">${eq ? 'Equipado' : 'Desequipado'}</span>` : ''}${naMochila ? '<span class="etiqueta">Mochila de Utilidades</span>' : ''}</span>
      <small class="apagado">${esc(linhaResumo)}</small>
      <span class="linha" style="margin-top:6px">${comp ? `<button class="btn pequeno${it.elemento ? '' : ' sangue'}" data-acao="componente-elemento" data-i="${i}">${it.elemento ? 'Trocar elemento' : 'Escolher elemento'}</button>` : ''}${tipo ? `<button class="btn pequeno${eq ? '' : ' sangue'}" data-acao="item-equipar" data-i="${i}" aria-pressed="${eq}">${eq ? 'Desequipar' : 'Equipar'}</button>` : ''}${pendente ? `<button class="btn pequeno" data-acao="item-escolher" data-i="${i}">Escolher perícia</button>` : ''}${info ? `<button class="icone-btn" data-acao="item-info" data-nome="${esc(it.nome)}" aria-label="O que faz ${esc(it.nome)}" title="O que este item faz">?</button>` : ''}</span>
    </summary>
    <div class="detalhes-rit">
      ${info?.resumo ? `<p>${esc(info.resumo)}</p>` : ''}
      ${efeito ? `<p><b>Efeito na ficha:</b> ${esc(efeito)}${tipo && !eq ? ' <span class="apagado">(só vale equipado)</span>' : ''}</p>` : ''}
      ${it.efeitos?.length ? `<div class="linha" style="flex-wrap:wrap">${it.efeitos.map((e, k) => `<span class="etiqueta">${esc(descreverEfeitosItem([e]))} <button class="icone-btn" data-acao="item-efeito-remover" data-i="${i}" data-k="${k}" aria-label="Tirar o efeito ${esc(descreverEfeitosItem([e]))}">✕</button></span>`).join('')}</div>` : ''}
      <div class="linha" style="margin-top:8px;flex-wrap:wrap">
        ${AMALDICOADOS[it.nome] || tipo === 'acessorio' ? '' : `<button class="btn pequeno" data-acao="item-efeito" data-i="${i}">+ Efeito na ficha</button>`}

        ${it.nome.startsWith('Selo Paranormal') || it.nome === 'Dedo Decepado' ? `<button class="btn pequeno" data-acao="vincular-item" data-i="${i}">Vincular</button>` : ''}
        ${it.ritualSelo && it.qtd > 0 ? `<button class="btn pequeno sangue" data-acao="usar-selo" data-i="${i}">Ativar selo</button>` : ''}
        ${(it.maldicoes || []).some(n => AMALDICOADOS[n]?.diasMinimos) || AMALDICOADOS[it.nome]?.diasMinimos ? botaoDiasMaldicao(it) : ''}
        ${it.nome === PROTECAO_ELEMENTAL ? botaoElementoMaldicao(it, i) : ''}
      </div>
      ${!itemEspecial(it) || it.maldicoes?.length ? cartoesMod(d, 'item', i, it) : ''}
      ${botoesUsosMaldicoes(it)}
      ${botoesConjuracao(it)}
      ${d.temMochilaUtil ? `<label class="check" style="margin-top:8px"><input type="checkbox" data-acao-check="mochila-utilidades" data-uid="${esc(it.uid)}" ${naMochila ? 'checked' : ''}><span><b>Guardar na Mochila de Utilidades</b><small>Este item ocupa 1 espaço a menos e conta como uma categoria abaixo. Só um item por vez.</small></span></label>` : ''}
      <div class="grade-mini" style="margin-top:8px">
        <label class="campo"><span>Nome</span><input data-campo="itens.${i}.nome" id="it-n-${i}" value="${esc(it.nome)}" aria-label="Nome do item"></label>
        <label class="campo"><span>Quantidade</span><input type="number" min="0" data-campo="itens.${i}.qtd" data-tipo="int" id="it-q-${i}" value="${it.qtd}" aria-label="Quantidade"></label>
        <label class="campo"><span>Categoria</span><select data-campo="itens.${i}.categoria" data-tipo="int" aria-label="Categoria">${[0, 1, 2, 3, 4].map(c => `<option value="${c}" ${it.categoria === c ? 'selected' : ''}>${cat(c)}</option>`).join('')}</select></label>
        <label class="campo"><span>Espaços</span><input type="number" min="0" step="0.25" data-campo="itens.${i}.espacos" data-tipo="num" id="it-e-${i}" value="${it.espacos}" aria-label="Espaços"></label>
      </div>
      <label class="campo" style="margin-top:6px"><span>Anotação</span><input data-campo="itens.${i}.nota" id="it-o-${i}" value="${esc(it.nota)}" placeholder="anotação" aria-label="Anotação"></label>
      <div class="linha fim" style="margin-top:6px"><button class="btn pequeno" data-acao="item-salvar-modelo" data-uid="${esc(it.uid)}">Salvar em Meus Itens</button><button class="btn pequeno perigo" data-acao="remover" data-lista="itens" data-i="${i}" aria-label="Remover ${esc(it.nome)}">Remover item</button></div>
    </div></details>`;
}
// ---------- Aba INVENTÁRIO ----------
export function abaInventario(f, d) {
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
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa sangue">Itens</h2><div class="linha"><button class="btn pequeno" data-acao="add-arma">+ Arma</button><button class="btn pequeno" data-acao="add-protecao">+ Proteção</button><button class="btn pequeno" data-acao="add-item-lista">+ Item da lista</button><button class="btn pequeno" data-acao="add-item">+ Item personalizado</button><button class="btn pequeno" data-acao="item-modelos">Meus Itens</button></div></div>
    ${f.itens.length ? `<div class="lista-itens">${f.itens.map((it, i) => cartaoItem(f, d, it, i)).join('')}</div>` : '<p class="vazio">Mochila vazia.</p>'}
    ${f.armas.length || f.protecoes.length ? `<h3 class="titulo-vermelho">Armas e proteções</h3><div class="lista-hab">${f.armas.map((a, i) => `<div class="hab"><span class="meta"><button class="btn pequeno" data-acao="editar-arma" data-i="${i}">Editar</button></span><b>${esc(a.nome)}</b><p>${esc(a.dano)}${a.mods.length ? ' · ' + a.mods.map(m => MODIFICACAO[m].nome).join(', ') : ''}${a.maldicao?.tipo ? ' · Amaldiçoar Arma' : ''}</p>${cartoesMod(d, 'arma', i, a)}</div>`).join('')}
      ${f.protecoes.map((p, i) => `<div class="hab"><span class="meta"><button class="btn pequeno" data-acao="editar-protecao" data-i="${i}">Editar</button></span><b>${esc(p.nome)}</b><p>Defesa +${p.defesa}${p.mods.length ? ' · ' + p.mods.map(m => MODIFICACAO[m].nome).join(', ') : ''}</p>${cartoesMod(d, 'protecao', i, p)}</div>`).join('')}</div>` : ''}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">Clique num item para ver o que ele faz, equipar ou desequipar, escolher perícias e editar. Itens desequipados continuam ocupando espaço e categoria. Armas e proteções também aparecem na aba Combate e contam na carga. Cada modificação aumenta a categoria em +1.</p>
  </section>`;
}
// Ações (botões data-acao) da aba
export function acoesInventario(ctx, h) {
  const { f, salvar, quem } = h;
  return {
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
        'add-item': () => { const ficha = f(); ficha.itens.push({ uid: uid(), nome: 'Novo item', categoria: 0, espacos: 1, qtd: 1, nota: '' }); salvar(); },
        'item-salvar-modelo': el => {
      const item = f().itens.find(it => it.uid === el.dataset.uid);
      if (!item) return;
      const modelos = carregarModelosItens();
      const i = modelos.findIndex(modelo => modelo.uid === item.uid);
      if (i < 0 && modelos.length >= 120) return ctx.avisar('Meus Itens atingiu o limite de 120 modelos.', true);
      const modelo = normalizar({ itens: [{ ...item, qtd: 1, diasVestido: 0, ativo: false, escrito: false, carga: 0, usosDia: 0, expiraCena: false }] }).itens[0];
      if (i >= 0) modelos[i] = modelo;
      else modelos.push(modelo);
      if (!salvarModelosItens(modelos)) return ctx.avisar('Não foi possível salvar este modelo.', true);
      ctx.avisar(`${item.nome} salvo em Meus Itens.`);
    },
        'item-modelos': () => {
      const modelos = carregarModelosItens().sort(alfa);
      abrirModal('Meus Itens', modelos.length ? `<input type="search" placeholder="Procurar modelo…" data-filtro-modal aria-label="Procurar modelo"><div class="lista-hab">${modelos.map(it => `<div class="hab" data-busca="${esc(semAcento(it.nome + ' ' + it.nota))}"><b>${esc(it.nome)}</b><p class="apagado">cat. ${cat(it.categoria)} · ${it.espacos} esp.</p><div class="linha"><button class="btn pequeno sangue" data-acao="item-adicionar-modelo" data-uid="${esc(it.uid)}">Adicionar à ficha</button><button class="btn pequeno perigo" data-acao="item-excluir-modelo" data-uid="${esc(it.uid)}">Excluir modelo</button></div></div>`).join('')}</div>` : '<p class="vazio">Abra um item do inventário e use Salvar em Meus Itens para reutilizá-lo em outras fichas deste navegador.</p>', '<button class="btn" data-acao="add-item-lista">Catálogo</button>', true);
    },
        'item-adicionar-modelo': el => {
      const ficha = f(), item = carregarModelosItens().find(it => it.uid === el.dataset.uid);
      if (!item) return;
      if (ficha.itens.length >= 120) return ctx.avisar('O inventário atingiu o limite de 120 itens.', true);
      const novo = { ...item, uid: uid() };
      ficha.itens.push(novo);
      ITENS_ABERTOS.add(novo.uid);
      fecharModal(); salvar();
    },
        'item-excluir-modelo': el => {
      const modelos = carregarModelosItens();
      const item = modelos.find(it => it.uid === el.dataset.uid);
      if (!item || !confirm(`Excluir o modelo ${item.nome} de Meus Itens?`)) return;
      if (!salvarModelosItens(modelos.filter(it => it.uid !== item.uid))) return ctx.avisar('Não foi possível excluir este modelo.', true);
      acoesFicha(ctx)['item-modelos']();
    },
        'add-item-lista': () => {
      const ficha = f();
      const lista = ITENS_CATALOGO.map((it, i) => [it, i]).filter(([it]) => it.fonte !== 'SaH' || ficha.modo === 'sah');
      const grupos = [...new Set(lista.map(([it]) => it.grupo || 'Itens gerais'))];
      const fontes = [...new Set(lista.map(([it]) => it.fonte || 'LR'))];
      const filtro = (rotulo, campo, valores) => `<label class="campo"><span>${rotulo}</span><select data-filtro-itens="${campo}"><option value="">Todos</option>${valores.map(v => `<option>${esc(v)}</option>`).join('')}</select></label>`;
      const cartao = ([it, i]) => `<button class="cartao" data-acao="add-item-catalogo" data-i="${i}" data-fonte="${esc(it.fonte || 'LR')}" data-grupo="${esc(it.grupo || 'Itens gerais')}" data-busca="${esc(semAcento(it.nome + ' ' + (it.resumo || '')))}"><b>${esc(it.nome)}</b>${fonteTag(it.fonte || '')}<small>${it.categoria == null ? (it.notaCategoria ? 'cat.: a do acessório +1' : 'cat. e espaços: confira no livro') : `cat. ${cat(it.categoria)} · ${it.espacos} esp.`}${it.pagina ? ` · SaH p. ${it.pagina}` : ''}</small>${it.resumo ? `<small class="apagado">${esc(it.resumo)}</small>` : ''}</button>`;
      abrirModal('Adicionar item', `<div class="grade c2"><label class="campo"><span>Busca</span><input type="search" placeholder="Nome ou descrição" data-filtro-itens="busca" autofocus></label>
        ${filtro('Fonte', 'fonte', fontes)}${filtro('Tipo', 'grupo', grupos)}</div>
        <p class="vazio" id="catalogo-itens-vazio" hidden>Nenhum item com esses filtros.</p>
        ${grupos.map(g => `<section class="grupo-itens"><h3 class="titulo-vermelho">${esc(g)}</h3><div class="cartoes">${lista.filter(([it]) => (it.grupo || 'Itens gerais') === g).sort((x, y) => x[0].nome.localeCompare(y[0].nome, 'pt')).map(cartao).join('')}</div></section>`).join('')}
`, '<button class="btn" data-acao="item-modelos">Meus Itens</button>', true);
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
      if (ehComponente(novo)) escolherElementoComponente(ctx, ficha.itens.length - 1); // e o elemento dos componentes
    },
        'componente-elemento': el => escolherElementoComponente(ctx, Number(el.dataset.i)),
        'item-equipar': el => {
      const ficha = f(), it = ficha.itens[Number(el.dataset.i)]; if (!it) return;
      if (tipoEquipar(it) === 'acessorio') it.escrito = !it.escrito;
      else it.ativo = !it.ativo;
      if (estaEquipado(it)) registrarMaldições(ficha);
      salvar();
      ctx.avisar(`${it.nome} ${estaEquipado(it) ? 'equipado: o efeito vale na ficha.' : 'desequipado: o efeito saiu da ficha.'}`);
    },
        'editar-para-mod': el => { // salva o que foi editado na janela e abre Modificar/Amaldiçoar
      acoesFicha(ctx)[el.dataset.tipo === 'arma' ? 'salvar-arma' : 'salvar-protecao']({ dataset: { i: el.dataset.i } });
      janelaMod(f(), el.dataset.tipo, Number(el.dataset.i), el.dataset.modo);
    },
        'janela-mod': el => janelaMod(f(), el.dataset.tipo, Number(el.dataset.i), el.dataset.modo),
        'elemento-maldicao': el => {
      const i = Number(el.dataset.i), k = Number(el.dataset.k), item = f().itens[i];
      if (!item || (k < 0 ? item.nome !== PROTECAO_ELEMENTAL : item.maldicoes?.[k] !== PROTECAO_ELEMENTAL)) return;
      janelaEscolha({
        titulo: `Proteção Elemental · ${item.nome}`, opcoes: ELEMENTOS_MALDICAO.map(id => ({ valor: id, nome: NOME_EL[id] })), busca: false,
        aoEscolher: id => {
          const ficha = f();
          if (k < 0) item.elementoMaldicao = id;
          else {
            item.elementosMaldicoes ||= [];
            item.elementosMaldicoes[k] = id;
          }
          registrarMaldições(ficha);
          fecharModal(); salvar();
          if (k >= 0) janelaMod(ficha, 'item', i, 'amaldicoar');
        },
      });
    },
        'alternar-mod': el => {
      const ficha = f(), { tipo, modo, id } = el.dataset, i = Number(el.dataset.i), alvo = alvoMod(ficha, tipo, i); if (!alvo) return;
      const campo = campoMod(tipo, modo), lista = [...(alvo[campo] || [])];
      const amaldicoar = modo === 'amaldicoar';
      const k = amaldicoar ? (el.dataset.k == null ? -1 : Number(el.dataset.k)) : lista.indexOf(id);
      if (el.dataset.k != null && lista[k] !== id) return;
      if (k >= 0) lista.splice(k, 1);
      else {
        if (!opcoesMod(ficha, tipo, alvo, modo).some(o => o.id === id)) return;
        if (!amaldicoar && numerosAlvo(derivar(ficha), tipo, alvo).cat >= 4) return ctx.avisar('Este item já está na categoria IV: tire uma modificação ou maldição antes.', true);
        lista.push(id);
      }
      if (tipo === 'item' && amaldicoar) {
        const elementos = Array.from({ length: (alvo.maldicoes || []).length }, (_, j) => alvo.elementosMaldicoes?.[j] || '');
        if (k >= 0) elementos.splice(k, 1);
        else elementos.push('');
        alvo.elementosMaldicoes = elementos;
      }
      alvo[campo] = lista;
      if (amaldicoar && k < 0) registrarMaldições(ficha);
      const atualizada = normalizar(ficha);
      ctx.salvarFicha(atualizada); ctx.render();
      janelaMod(atualizada, tipo, i, modo);
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
      if (item.escrito) registrarMaldições(f());
      fecharModal(); salvar();
    },
        'vincular-conjuracao': el => {
      const item = f().itens.find(it => it.uid === el.dataset.uid);
      if (!temConjuracao(item)) return;
      janelaEscolha({ titulo: `Conjuração · ${item.nome}`, intro: 'Vincule um ritual de 1º círculo. Equipe e empunhe o item para conjurá-lo.',
        opcoes: RITUAIS.filter(r => r.circulo === 1 && (r.fonte !== 'SaH' || f().modo === 'sah')).map(r => ({ valor: r.id, nome: r.nome, desc: r.resumo })),
        aoEscolher: id => {
          const atual = f().itens.find(it => it.uid === el.dataset.uid);
          if (!temConjuracao(atual)) return;
          atual.ritualConjuracao = id; fecharModal(); salvar();
        } });
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
  };
}
