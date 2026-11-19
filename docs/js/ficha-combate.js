// Aba COMBATE: armas, ataques e dano (normal, crítico, médio), itens amaldiçoados, PE gastos por habilidade.

import { registrarMaldições, AMALDICOADOS, NOMES_AMALDICOADOS, PROTECAO_ELEMENTAL, passivoAmaldicoado } from './amaldicoados.js?v=0.47';
import { origemAtiva, derivar, normalizar, temOpcional, usaPD, opcoesGasto } from './regras.js?v=0.47';
import { sofrerDano, recuperar, marcarCondicao, textoTeste, media } from './combate.js?v=0.47';
import { ATRIBUTOS, PERICIA, CLASSES, ORIGEM, PODER, ARMAS, PROTECOES, ITENS_CATALOGO, ITEM_INFO, CONDICOES, TIPOS_DANO, PODER_PARANORMAL, USAVEIS, MALDICOES_ARMA, EFEITOS_INSANIDADE, EFEITOS_MEDO } from './catalogo.js?v=0.47';
import { esc, comSinal, sigilo, semAcento, inteiro, uid } from './util.js?v=0.47';


import { rolarDanoUI, abrirModal, fecharModal } from './rolagem.js?v=0.47';
import { botaoDiasMaldicao, botaoElementoMaldicao, botoesConjuracao, botoesUsosMaldicoes, cartoesMod, efeitoDoItem, estaEquipado } from './ficha-inventario.js?v=0.47';
import { painelAcoes, painelEfeitos } from './ficha-agente.js?v=0.47';
import { abaMacros } from './ficha-macros.js?v=0.47';
import { DURA, cat, consumirProximas, gastar, janelaEscolha, janelaGasto } from './ficha-base.js?v=0.47';
import { acoesFicha } from './fichaUI.js?v=0.47';

// ---------- Aba COMBATE ----------
export function abaCombate(f, d, ui = {}) {
  const sub = ui.subCombate === 'amaldicoados' ? 'amaldicoados' : 'armas';
  const qtd = f.itens.filter(it => AMALDICOADOS[it.nome]).length;
  const nav = `<div class="condicoes" role="tablist" aria-label="Seções de combate" style="margin-bottom:14px">
    <button role="tab" data-acao="sub-combate" data-sub="armas" aria-pressed="${sub === 'armas'}" aria-selected="${sub === 'armas'}">Armas e combate</button>
    <button role="tab" data-acao="sub-combate" data-sub="amaldicoados" aria-pressed="${sub === 'amaldicoados'}" aria-selected="${sub === 'amaldicoados'}">Itens amaldiçoados${qtd ? ` (${qtd})` : ''}</button></div>`;
  return nav + (sub === 'amaldicoados' ? abaAmaldicoados(f, d) : abaCombateArmas(f, d));
}
// Itens amaldiçoados e paranormais do inventário: efeito passivo (caixinha), botões de uso, testes e rolagens.
export const COR_EL = { conhecimento: 'conhecimento', energia: 'energia', morte: 'morte', sangue: 'sangue', medo: 'medo', variavel: 'variavel' };
export const NOME_EL = { conhecimento: 'Conhecimento', energia: 'Energia', morte: 'Morte', sangue: 'Sangue', medo: 'Medo', variavel: 'Variável' };
export function descreverPassivo(p) {
  const partes = [];
  for (const [k, v] of Object.entries(p.atr || {})) partes.push(`${comSinal(v)} ${k.toUpperCase()}`);
  if (p.pv) partes.push(`${comSinal(p.pv)} PV máx.`); if (p.pe) partes.push(`${comSinal(p.pe)} PE máx.`);
  if (p.defesa) partes.push(`${comSinal(p.defesa)} Defesa`); if (p.desl) partes.push(`${comSinal(p.desl)} m desloc.`);
  if (p.carga) partes.push(`${comSinal(p.carga)} espaços de carga`); if (p.bloqueio) partes.push(`${comSinal(p.bloqueio)} no Bloqueio`); if (p.resistencia) partes.push(`${comSinal(p.resistencia)} em resistências`);
  if (p.rd) partes.push(`RD ${p.rd}`); if (p.rdMental) partes.push(`RD mental ${p.rdMental}`); if (p.dtRitual) partes.push(`${comSinal(p.dtRitual)} DT de rituais`);
  for (const [el, valor] of Object.entries(p.rdElemento || {})) partes.push(`RD ${valor} a ${NOME_EL[el]}`);
  if (p.ataque) partes.push(`${comSinal(p.ataque)} ataque`); if (p.dano) partes.push(`${comSinal(p.dano)} dano`);
  for (const [k, v] of Object.entries(p.pericia || {})) partes.push(`${comSinal(v)} ${PERICIA[k]?.nome || k}`);
  for (const [k, v] of Object.entries(p.dadosPericia || {})) partes.push(`${v > 0 ? '+' : '−'}${Math.abs(v)}d20 ${PERICIA[k]?.nome || k}`);
  return partes.join(', ');
}
export function custoDoUso(u, it) {
  if (u.custoPorAtaque) return `${u.custoPorAtaque} PE por ataque já feito`;
  if (u.custoPergunta) return u.custoPergunta;
  const c = (u.custo || 0) + (u.custoDia ? it.usosDia : 0);
  return c ? `${c} PE` : '';
}
export function abaAmaldicoados(f, d) {
  const lista = f.itens.map((it, i) => [it, i]).filter(([it]) => AMALDICOADOS[it.nome]);
  const aplicadas = f.itens.filter(it => !AMALDICOADOS[it.nome] && it.maldicoes?.length && it.qtd).map(it =>
    `<div class="hab"><b>${esc(it.nome)}</b><p>${esc(efeitoDoItem(it))}</p>${botoesUsosMaldicoes(it)}${botoesConjuracao(it)}</div>`);
  const outros = f.itens.filter(it => !AMALDICOADOS[it.nome] && /amaldiço|paranormal/i.test(ITEM_INFO[it.nome]?.grupo || ''));
  const cartao = ([it, i]) => {
    const def = AMALDICOADOS[it.nome], el = COR_EL[def.el] || 'variavel', info = ITEM_INFO[it.nome];
    const ef = passivoAmaldicoado(it, it.nome, it.elementoMaldicao);
    const passivo = ef ? descreverPassivo(ef) : '';
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
      ${def.diasMinimos ? botaoDiasMaldicao(it) : ''}
      ${it.nome === PROTECAO_ELEMENTAL ? botaoElementoMaldicao(it, i) : ''}
      ${usos ? `<div class="linha" style="margin-top:8px;flex-wrap:wrap">${usos}</div>` : ''}
      ${botoesConjuracao(it)}
      ${it.usosDia || it.carga ? `<div class="linha" style="margin-top:6px">${it.usosDia ? `<button class="btn pequeno fantasma" data-acao="zerar-usos-amaldicoado" data-uid="${esc(it.uid)}">Novo dia (zerar usos)</button>` : ''}</div>` : ''}
    </div>`;
  };
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Itens amaldiçoados</h2><button class="btn pequeno" data-acao="add-amaldicoado-lista">+ Item amaldiçoado</button></div>
    <p class="apagado" style="font-size:.88rem">Equipe o item para ativar seus efeitos passivos. Quando disponível, o botão do efeito cobra o custo e resolve as rolagens.</p>
    <div class="linha"><button class="btn pequeno" data-acao="preco-maldicao">Registrar falha na mesa</button>
      <button class="btn pequeno" data-acao="fim-maldicao">Rever maldições entre missões</button></div>
    ${lista.length || aplicadas.length ? `<div class="lista-hab">${lista.map(cartao).join('')}${aplicadas.join('')}</div>` : '<p class="vazio">Nenhum item amaldiçoado no inventário. Use "+ Item amaldiçoado" ou adicione pela aba Inventário.</p>'}
    ${outros.length ? `<p class="apagado" style="margin-top:10px">Outros itens paranormais no inventário (sem automação): ${outros.map(it => esc(it.nome)).join(', ')}.</p>` : ''}
  </section>
  ${painelEfeitos(f, d)}`;
}
export function abaCombateArmas(f, d) {
  return `<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Ataques</h2><div class="linha"><span class="etiqueta${f.gastoTurno > d.limitePE ? ' alerta' : ''}" title="Só conta: o site não bloqueia gastos acima do limite.">Neste turno: ${f.gastoTurno}/${d.limitePE} ${d.pd ? 'PD' : 'PE'}${f.gastoTurno > d.limitePE ? ' (acima do limite)' : ''}</span><button class="btn pequeno" data-acao="novo-turno">Novo turno</button><button class="btn pequeno fantasma" data-acao="fim-cena">Fim da cena</button><button class="btn pequeno" data-acao="add-arma">+ Arma</button></div></div>
    ${d.ataques.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Arma</th><th>Ataque</th><th>Dano</th><th>Crítico</th><th class="esconde-celular">Alcance</th><th></th></tr></thead><tbody>
    ${d.ataques.map((a, i) => `<tr><td><b>${esc(a.nome)}</b><br><small>${esc(a.periciaNome)} · ${a.prof}${a.temProf ? '' : ' <span class="etiqueta alerta">sem proficiência −1d20</span>'}${a.notas?.length ? `<br><small class="apagado">${a.notas.map(esc).join(' · ')}</small>` : ''}</small></td>
      <td><button class="rolavel" data-acao="rolar-ataque" data-i="${i}" ${a.bloqueadaTamanho ? 'disabled title="Arma de duas mãos para personagem Pequeno"' : ''}><span class="d">${textoTeste(a.dados, a.bonus)}</span></button></td>
      <td>${(() => { const m = mediaAtaque(a); return `<button class="rolavel" data-acao="rolar-dano" data-i="${i}" data-crit="0" title="Dano normal · média ${m.normal}"><span class="d">${esc(a.formula)}</span></button> <small>${esc(TIPOS_DANO[a.tipo] || a.tipo)} · média ${m.normal}</small>
        <br><button class="rolavel" data-acao="rolar-dano" data-i="${i}" data-crit="1" title="Dano crítico · média ${m.critico}"><span class="d">crítico ×${a.mult}${a.criticoExtra ? ` +${esc(a.criticoExtra)}` : ''}</span></button> <small>média ${m.critico}</small>`; })()}</td>
      <td class="num">${a.margem < 20 ? a.margem + '+' : '20'} / ×${a.mult}</td><td class="esconde-celular">${esc(a.alcance)}</td>
      <td>${temOpcional(f, 'municao') && a.capacidade ? `<small>${a.carregada}/${a.capacidade} · reserva ${a.reserva}</small> <button class="btn pequeno" data-acao="recarregar" data-i="${i}">Recarregar</button> <button class="btn pequeno" data-acao="adicionar-pacote" data-i="${i}">Usar pacote</button>` : ''}${a.automatica ? '' : `<button class="icone-btn" data-acao="editar-arma" data-i="${f.armas.findIndex(x => x.uid === a.uid)}" aria-label="Editar ${esc(a.nome)}">✎</button>`}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="vazio">Nenhuma arma. Adicione uma da lista do livro ou crie a sua.</p>'}
    <p class="apagado">Controle ações e reações na mesa. Resolva manobras, testes opostos e ataques concedidos com o outro jogador.</p>
    <p class="apagado" style="font-size:.88rem">Corpo a corpo e arremesso somam Força no dano. No crítico, os dados da arma são multiplicados (bônus fixos não) e entra o extra do crítico da arma, se houver. A média é o valor de cada dado pela metade, para economizar rolagens (ligue "Dano médio" em Sobre para não rolar).${CLASSES[f.classe].nome === 'Combatente' ? ' Ataque Especial: gaste PE para +5 no ataque ou dano (use a bandeja de dados para somar o bônus).' : ''}</p>
  </section>
  ${painelGastosPE(f, d)}
  ${abaMacros(f, d, true)}
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
    ${f.condicoes.length ? `<ul style="margin-top:10px">${f.condicoes.map(id => CONDICOES.find(c => c.id === id)).filter(Boolean).map(c => `<li><b>${esc(c.nome)}:</b> ${esc(c.resumo)}${f.origemCondicao[c.id] ? ` <small class="status-origem">(${esc(f.origemCondicao[c.id])})</small>` : ''}</li>`).join('')}</ul>` : '<p class="apagado" style="margin-top:8px">Nenhuma condição. As penalidades de dados entram sozinhas nas rolagens.</p>'}
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
// Todas as habilidades "usáveis" que a ficha tem agora (para o painel de Ações rápidas)
// ---------- Gastos de PE por habilidade (Combate) ----------
// Resume o registro gravado por gastar(): neste turno, nesta cena e no total, separado por habilidade.
export function painelGastosPE(f, d) {
  const k = d.pd ? 'PD' : 'PE', por = new Map();
  for (const g of f.gastosPE) {
    const x = por.get(g.nome) || { turno: 0, cena: 0, total: 0, usos: 0 };
    if (g.turno === f.numTurno && g.cena === f.numCena) x.turno += g.custo;
    if (g.cena === f.numCena) x.cena += g.custo;
    x.total += g.custo; x.usos++; por.set(g.nome, x);
  }
  const linhas = [...por].sort((a, b) => b[1].total - a[1].total);
  const soma = c => linhas.reduce((s, [, x]) => s + x[c], 0);
  return `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Gastos de ${k}</h2><div class="linha"><button class="btn pequeno sangue" data-acao="gastar-pe-escolher">Gastar ${k}…</button>${linhas.length ? `<button class="btn pequeno fantasma" data-acao="gastos-pe-limpar">Limpar registro</button>` : ''}</div></div>
    ${linhas.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Habilidade</th><th class="num">Turno</th><th class="num">Cena</th><th class="num">Total</th><th class="num esconde-celular">Usos</th></tr></thead><tbody>
      ${linhas.map(([nome, x]) => `<tr><td>${esc(nome)}</td><td class="num">${x.turno || '—'}</td><td class="num">${x.cena || '—'}</td><td class="num"><b>${x.total}</b></td><td class="num esconde-celular">${x.usos}</td></tr>`).join('')}
      <tr><td><b>Total</b></td><td class="num"><b>${soma('turno')}</b></td><td class="num"><b>${soma('cena')}</b></td><td class="num"><b>${soma('total')}</b></td><td class="esconde-celular"></td></tr>
    </tbody></table></div>` : `<p class="vazio">Nenhum gasto registrado. Os gastos feitos pelo site (rolagens, "Usar", rituais, itens) entram aqui sozinhos; use "Gastar ${k}…" para os que você resolve na mesa.</p>`}
    <p class="apagado" style="font-size:.88rem">"Turno" zera em Novo turno e "Cena" em Fim da cena. O registro guarda os últimos 300 gastos.</p>
  </section>`;
}
// Tudo o que a ficha pode usar, com o custo sugerido (para a janela "Gastar PE…")
export function opcoesDeGastoManual(f, d) {
  const nomes = new Map();
  const add = (nome, fonte) => { if (nome && !nomes.has(nome) && !/^Trilha \(|^Aumento de atributo|^Grau de treinamento/.test(nome)) nomes.set(nome, fonte); };
  for (const h of d.habilidades) add(h.nome, 'Classe');
  for (const h of d.trilhaHabs) if (h.liberada) add(h.nome, 'Trilha');
  if (ORIGEM[f.origem] && origemAtiva(f)) add(ORIGEM[f.origem].poder, 'Origem');
  for (const p of f.poderes) if (PODER[p.id]) add(PODER[p.id].nome, 'Poder');
  for (const p of f.paranormais) add(PODER_PARANORMAL[p.id]?.nome, 'Paranormal');
  for (const r of d.rituais || []) add(`Ritual: ${r.nome}`, 'Ritual');
  const custoRitual = n => { const r = (d.rituais || []).find(x => `Ritual: ${x.nome}` === n); return r ? [0, 1, 3, 6, 10][r.circulo] || 1 : 0; };
  return [...nomes].map(([nome, fonte]) => ({ nome, fonte, custo: typeof USAVEIS[nome]?.custo === 'number' ? USAVEIS[nome].custo : custoRitual(nome) || 1 })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}
// Dano médio de um ataque: normal e crítico (dados da arma multiplicados + extra do crítico)
export function mediaAtaque(a) {
  try {
    const normal = media(a.formula).total;
    const critico = media(a.formula, { multiplicador: a.mult, gruposCritico: a.gruposCritico }).total + (a.criticoExtra ? media(a.criticoExtra).total : 0);
    return { normal, critico };
  } catch { return { normal: '—', critico: '—' }; }
}
export function janelaDano(d, qtd, recurso) {
  const rd = recurso === 'pv' ? d.rd : d.rdMental;
  const resistencias = recurso === 'pv' ? Object.entries(d.rdElemento) : [];
  abrirModal(recurso === 'pv' ? 'Sofrer dano' : 'Dano mental', `<p class="apagado">Resolva as reações na mesa e informe o dano resultante.</p>
    <label class="campo"><span>Dano a registrar</span><input type="number" id="dano-qtd" min="0" value="${qtd}"></label>
    ${rd ? `<label class="check hab"><input type="checkbox" id="dano-aplicar-rd"><span>Aplicar RD ${rd}</span></label>` : ''}
    ${resistencias.length ? `<label class="campo"><span>Resistência elemental</span><select id="dano-elemento"><option value="">Sem resistência elemental</option>${resistencias.map(([el, valor]) => `<option value="${el}">${NOME_EL[el]} · RD ${valor}</option>`).join('')}</select></label>` : ''}`,
    '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="aplicar-dano" data-rec="' + recurso + '">Aplicar</button>');
}
// Ações (botões data-acao) da aba
export function acoesCombate(ctx, h) {
  const { f, salvar, quem, cobrar, testar, ataqueValido, consumirDisparo, danoDaIdade } = h;
  return {
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
        'dias-maldicao': el => {
      const it = f().itens.find(i => i.uid === el.dataset.uid);
      if (!it) return;
      const dias = prompt('Dias de uso do item:', String(it.diasVestido || 0));
      if (dias == null) return;
      it.diasVestido = inteiro(dias, 0, 999, it.diasVestido || 0); salvar();
    },
        'zerar-usos-amaldicoado': el => { const it = f().itens.find(x => x.uid === el.dataset.uid); if (!it) return; it.usosDia = 0; salvar(); ctx.avisar(`${it.nome}: usos do dia zerados.`); },
        'usar-amaldicoado': async el => {
      const ficha = f(); let d = derivar(ficha);
      const it = ficha.itens.find(x => x.uid === el.dataset.uid);
      const aplicada = el.dataset.mal != null;
      if (!it || (aplicada && !estaEquipado(it))) return;
      const def = AMALDICOADOS[aplicada ? it.maldicoes?.[Number(el.dataset.mal)] : it.nome];
      const u = def?.usos?.[Number(el.dataset.u)];
      if (!u) return;
      if (!it.qtd) return ctx.avisar('Esse item está sem unidades.', true);
      const titulo = `${it.nome}: ${u.nome}`, k = d.pd ? 'PD' : 'PE', msgs = [];
      if (d.semAcoes && !['reação', 'automática', 'livre', 'interlúdio'].includes(u.acao)) return ctx.avisar('As condições atuais impedem a ação.', true);
      const pedir = (pergunta, padrao = '1', max = 999) => { const r = prompt(pergunta, padrao); return r == null ? null : inteiro(r, 0, max, 0); };
      // custo
      let custo = (u.custo || 0) + (u.custoDia ? it.usosDia : 0);
      if (u.custoPorAtaque) { const n = pedir('Quantos ataques você já fez neste turno?'); if (n == null) return; custo = u.custoPorAtaque * n; }
      if (u.custoPergunta) { const n = pedir(`${titulo}: ${u.custoPergunta}?`); if (n == null) return; custo = n; }
      if (custo) { custo += d.custoCondicao; if (!gastar(ficha, d, custo, d.limiteAcao, custo, [[`${it.nome}: ${u.nome}`, custo - d.custoCondicao]])) return ctx.avisar(`${k} insuficiente ou limite do turno (precisa de ${custo}).`, true); msgs.push(`−${custo} ${k}`); d = derivar(ficha); }
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
          if (t.condicao) marcarCondicao(ficha, t.condicao, `Item amaldiçoado: ${it.nome}`);
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
          if (falha.condicao) marcarCondicao(ficha, falha.condicao, `Item amaldiçoado: ${it.nome} (falhou no teste)`);
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
      testar({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, gruposCritico: a.gruposCritico, tipo: 'ataque', criticoExtra: a.criticoExtra, formulaDano: a.formula }, d0.PER[a.pericia].atrUsado).then(() => { danoDaIdade(d0.PER[a.pericia].atrUsado); consumirProximas(ctx); ctx.render(); });
    },
        'gastar-pe-escolher': () => {
      const ficha = f(), d = derivar(ficha), k = d.pd ? 'PD' : 'PE', ops = opcoesDeGastoManual(ficha, d);
      abrirModal(`Gastar ${k}: o que você vai usar?`, `<p class="apagado">Você tem <b>${d.atual[d.pd ? 'pd' : 'pe']} ${k}</b>${ficha.recursos.peTemp ? ` + ${ficha.recursos.peTemp} temporários` : ''} · neste turno: ${ficha.gastoTurno}/${d.limitePE}. Marque o que vai usar e ajuste o custo se precisar. Os temporários são gastos primeiro.</p>
        <input type="search" placeholder="Procurar habilidade…" data-filtro-modal aria-label="Procurar habilidade" style="margin-bottom:8px">
        <div class="lista-hab">${ops.map((o, j) => `<label class="check hab" data-busca="${esc(semAcento(o.nome))}"><input type="checkbox" data-gasto-man="${j}" data-gasto-nome="${esc(o.nome)}"><span><b>${esc(o.nome)}</b> <small class="apagado">${esc(o.fonte)}</small></span><input type="number" min="0" max="99" value="${o.custo}" data-gasto-man-custo="${j}" aria-label="Custo de ${esc(o.nome)}" style="width:70px;margin-left:auto"></label>`).join('')}
          <label class="check hab"><input type="checkbox" data-gasto-man="outro"><span><input data-gasto-man-nome placeholder="Outro (escreva o nome)" maxlength="60" style="width:100%"></span><input type="number" min="0" max="99" value="1" data-gasto-man-custo="outro" aria-label="Custo do outro gasto" style="width:70px;margin-left:auto"></label></div>`,
        `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="gastar-pe-confirmar">Gastar</button>`, true);
    },
        'gastar-pe-confirmar': () => {
      const ficha = f(), d = derivar(ficha), k = d.pd ? 'PD' : 'PE';
      const partes = [...document.querySelectorAll('[data-gasto-man]:checked')].map(c => {
        const j = c.dataset.gastoMan, custo = inteiro(document.querySelector(`[data-gasto-man-custo="${j}"]`)?.value, 0, 99, 0);
        const nome = j === 'outro' ? (document.querySelector('[data-gasto-man-nome]')?.value.trim() || 'Outros gastos') : c.dataset.gastoNome;
        return [nome, custo];
      }).filter(([n, c]) => n && c > 0);
      const total = partes.reduce((s, [, c]) => s + c, 0);
      if (!total) return ctx.avisar('Marque o que vai usar (com custo maior que 0).', true);
      if (!gastar(ficha, d, total, d.limiteAcao, total, partes)) return ctx.avisar(`${k} insuficiente (precisa de ${total}).`, true);
      fecharModal(); salvar(); ctx.avisar(`−${total} ${k}: ${partes.map(([n, c]) => `${n} ${c}`).join(', ')}.`);
    },
        'gastos-pe-limpar': () => { if (!confirm('Limpar todo o registro de gastos?')) return; f().gastosPE = []; salvar(); },
        'rolar-dano': el => {
      const a = derivar(f()).ataques[Number(el.dataset.i)]; if (!a) return;
      const crit = el.dataset.crit === '1';
      rolarDanoUI({ titulo: `${crit ? 'Dano crítico' : 'Dano'} · ${a.nome}`, quem: quem(), formula: a.formula, multiplicador: crit ? a.mult : 1, gruposCritico: a.gruposCritico, adicional: crit ? a.criticoExtra : '' });
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
        <div style="grid-column:1/-1">
          <h3 class="titulo-vermelho">Crítico</h3>
          <div class="grade c2">${c('criticoExtra', 'Extra só no crítico (ex.: 1d8, 2d6+2)', 'text', 'placeholder="vazio = nada a mais"')}
          <p class="apagado" style="font-size:.88rem;margin:0">No crítico, os dados da arma são multiplicados por ×${a.mult}. Coloque aqui dados ou bônus que só entram no crítico (poderes, maldições, itens); eles somam sem multiplicar.</p></div>
        </div>
        <div style="grid-column:1/-1">
          <h3 class="titulo-vermelho">Por que a categoria diminuiu</h3>
          ${(() => { const at = derivar(f()).ataques.find(x => x.uid === a.uid); return at ? `<p class="apagado" style="font-size:.88rem">Categoria com modificações e maldições: <b>${cat(at.categoriaSemReducao)}</b>${at.reducoesCategoria.length ? ` · reduções: ${at.reducoesCategoria.map(([n, v]) => `${esc(n)} −${v}`).join(', ')} · conta como <b>${cat(at.categoriaEfetiva)}</b>` : ' · sem redução'} (salve para atualizar).</p>` : ''; })()}
          <div class="lista-hab">
          ${f().trilha === 'aniquilador' ? `<label class="check hab"><input type="checkbox" data-modal-arma-check="favorita" ${a.favorita ? 'checked' : ''}><span><b>Arma favorita (Aniquilador)</b> <small class="apagado">A Favorita −I; Técnica Secreta −II; Máquina de Matar −III</small></span></label>` : ''}
          ${f().poderes.some(p => p.id === 'ferramentas-paranormais') ? `<label class="check hab"><input type="checkbox" data-modal-arma-reducao="ferramentas-paranormais" ${(a.reducaoMotivos || []).includes('ferramentas-paranormais') ? 'checked' : ''}><span><b>Ferramentas Paranormais</b> <small class="apagado">item paranormal: −I</small></span></label>` : ''}
          </div>
          <div class="grade c2">${c('reducaoOutraNome', 'Outro motivo (ex.: presente do mestre, patente)', 'text', 'maxlength="60"')}${s('reducaoOutra', 'Reduz quantas categorias', [[0, 'nenhuma'], [1, '−I'], [2, '−II'], [3, '−III'], [4, '−IV']])}</div>
          <p class="apagado" style="font-size:.85rem">"Ferramenta Favorita" (Engenheiro) e "Mochila de Utilidades" não valem para armas.</p>
        </div>
        ${ORIGEM[f().origem]?.id === 'operario' ? `<label class="check"><input type="checkbox" data-modal-arma-check="ferramenta" ${a.ferramenta ? 'checked' : ''}><span>Ferramenta de Trabalho (Operário): +1 ataque, dano e margem</span></label>` : ''}
        ${f().trilha === 'atirador' ? `<label class="check"><input type="checkbox" data-modal-arma-check="balasLongas" ${a.balasLongas ? 'checked' : ''}><span>Usa balas longas (Mira de Elite: +Intelecto no dano)</span></label>` : ''}${c('nota', 'Anotação (modificações, maldições…)')}</div>`,
        `<button class="btn perigo" data-acao="remover-arma" data-i="${i}">Remover</button><span class="espaco"></span><button class="btn sangue" data-acao="salvar-arma" data-i="${i}">Salvar</button>`, true);
    },
        'salvar-arma': el => {
      const ficha = f(), i = Number(el.dataset.i), a = { ...ficha.armas[i] };
      document.querySelectorAll('[data-modal-arma]').forEach(inp => { a[inp.dataset.modalArma] = inp.type === 'number' ? Number(inp.value) : inp.value; });
      document.querySelectorAll('[data-modal-arma-check]').forEach(inp => { a[inp.dataset.modalArmaCheck] = inp.checked; });
      a.reducaoMotivos = [...document.querySelectorAll('[data-modal-arma-reducao]:checked')].map(x => x.dataset.modalArmaReducao);
      a.reducaoOutra = Number(a.reducaoOutra) || 0;
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
  };
}
