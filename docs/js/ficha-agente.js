// Aba AGENTE: sinais vitais, Status operacional (condições e efeitos), defesa, pendências e níveis. Ações gerais da ficha.

import { registrarMaldições } from './amaldicoados.js?v=0.47';
import { abrirOrigem, pentagramaAtributos } from './criador.js?v=0.47';
import { faixaEtaria, temPeso, origemAtiva, aumentoPermitido, tetoEtario, derivar, normalizar, ehSobrevivente, temOpcional, nexSeparado, opcoesGasto, periciaComAtributo } from './regras.js?v=0.47';
import { sofrerDano, recuperar, resolverCondicoesDoTurno, marcarCondicao, perderFoco, iniciarTurno, encerrarTurno, fimDeCena, textoTeste, d as dado, rolar } from './combate.js?v=0.47';
import { ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, ORIGEM, PODER, ITENS_CATALOGO, CONDICOES, PATENTES, FERIMENTOS, EXPOSICOES, PODER_PARANORMAL, USAVEIS, CRIACAO_ATRIBUTOS, EFEITOS_INSANIDADE, EFEITOS_MEDO } from './catalogo.js?v=0.47';
import { esc, inteiro, uid, reduzirImagem, escolherArquivo, baixarArquivo } from './util.js?v=0.47';
import { estado } from './ficha-estado.js?v=0.47';
import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal } from './rolagem.js?v=0.47';
import { DURA, HABILIDADES_MANUAIS, ICONE_D20, avisosDeRegra, botaoUsar, consumirProximas, descreverEf, gastar, janelaEscolha, janelaGasto, janelaMultipla } from './ficha-base.js?v=0.47';
import { acoesFicha } from './fichaUI.js?v=0.47';
import { janelaDano } from './ficha-combate.js?v=0.47';
import { registrosTranscender } from './ficha-poderes.js?v=0.47';

// ---------- Aba AGENTE ----------
export function recurso(sigla, nome, cor, atual, max, campo, extra = '') {
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
export function caixaTemp(f, d) {
  const k = d.pd ? 'PD' : 'PE';
  return `<div class="linha" style="margin-top:8px"><span class="rotulo">${k} temporários</span><input type="number" min="0" style="width:72px;min-height:32px" data-campo="recursos.peTemp" data-tipo="int" id="rec-petemp" value="${f.recursos.peTemp}" aria-label="${k} temporários"><small class="apagado">gastos primeiro; somem no fim da cena</small></div>`;
}
export function opcoesAtributos(atual) {
  return ATRIBUTOS.map(a => `<option value="${a.id}" ${atual === a.id ? 'selected' : ''}>${a.id.toUpperCase()}</option>`).join('');
}
export function abaAgente(f, d) {
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
    ${pentagramaAtributos(d.atributosEfetivos, false, true)}
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
    ${painelStatus(f, d)}
  </section>
  ${efeitos ? `<div class="ficha-acompanhamento">${efeitos}</div>` : ''}
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Perícias</h2><span class="apagado dossie-txt">Toque no dado para rolar</span></div>
    ${(() => { const cont = [0, 1, 2, 3].map(g => d.pericias.filter(p => (f.pericias[p.id] || 0) === g).length);
      return `<div class="pericias-legenda">${GRAUS.map((g, k) => `<span class="grau-chip grau-${g.id}"><i></i>${g.nome}${g.bonus ? ` +${g.bonus}` : ''} <b>${cont[k]}</b></span>`).join('')}</div>`; })()}
    <div class="pericias-grade" role="table" aria-label="Perícias">
      <div class="pericia-linha pericia-cabeca" role="row"><span role="columnheader">Perícia</span><span role="columnheader">Atr.</span><span role="columnheader">Grau</span><span role="columnheader" class="esconde-celular">Outros</span><span role="columnheader">Rolar</span></div>
    ${d.pericias.map(p => { const g = f.pericias[p.id] || 0; return `<div class="pericia-linha grau-${g}${p.bloqueada ? ' pericia-bloq' : ''}" role="row">
      <span class="pericia-nome" role="cell">${esc(p.nome)}${p.id === 'profissao' && f.profissao ? ` <small>(${esc(f.profissao)})</small>` : ''}${p.treinada ? ' <small title="Só treinada">*</small>' : ''}${p.carga ? ' <small title="Penalidade de carga">+</small>' : ''}</span>
      <span class="pericia-atr" role="cell"><select data-campo="atributosPericias.${p.id}" aria-label="Atributo padrão de ${esc(p.nome)}"><option value="">Auto${f.atributosPericias[p.id] ? '' : ` · ${p.atrUsado.toUpperCase()}`}</option>${opcoesAtributos(f.atributosPericias[p.id])}</select></span>
      <span role="cell"><select class="pericia-grau" data-campo="pericias.${p.id}" data-tipo="int" aria-label="Grau em ${esc(p.nome)}">${GRAUS.map(x => `<option value="${x.id}" ${g === x.id ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></span>
      <span class="esconde-celular" role="cell"><input type="number" class="pericia-outros" data-campo="bonusPericia.${p.id}" data-tipo="int" id="bp-${p.id}" value="${f.bonusPericia[p.id] || ''}" placeholder="0" aria-label="Bônus extra em ${esc(p.nome)}"></span>
      <span class="pericia-rolar" role="cell"><button class="rolavel rolar-d20" data-acao="rolar-pericia" data-id="${p.id}" title="${p.bloqueada ? 'Só pode ser usada se treinado. ' : ''}Rolar ${esc(p.nome)}" aria-label="Rolar ${esc(p.nome)}: ${textoTeste(p.dados, p.bonus)}">${ICONE_D20}<span class="d">${textoTeste(p.dados, p.bonus)}</span></button><button class="btn pequeno fantasma" data-acao="pericia-atributo" data-id="${p.id}" aria-label="Escolher atributo de ${esc(p.nome)}" title="Escolher atributo para esta rolagem">Atributo</button></span>
    </div>`; }).join('')}
    </div>
    <label class="campo" style="max-width:320px;margin-top:10px"><span>Especialização de Profissão</span><input data-campo="profissao" id="f-prof" value="${esc(f.profissao)}" placeholder="Ex.: cozinheiro, engenheiro"></label>
    <p class="apagado" style="font-size:.88rem;margin-top:8px">* só treinada · + sofre penalidade de carga${d.penalCarga ? ` (agora: −${d.penalCarga})` : ''}. Veterano a partir de NEX 35%, expert a partir de 70%.</p>
  </section>`;
}
export function usaveisDaFicha(f, d) {
  const nomes = new Set();
  for (const h of d.habilidades) nomes.add(h.nome);
  for (const h of d.trilhaHabs) if (h.liberada) nomes.add(h.nome);
  if (ORIGEM[f.origem] && origemAtiva(f)) nomes.add(ORIGEM[f.origem].poder);
  for (const p of f.poderes) if (PODER[p.id]) nomes.add(PODER[p.id].nome);
  for (const p of f.paranormais) nomes.add(PODER_PARANORMAL[p.id].nome);
  return [...nomes].filter(n => USAVEIS[n] && !HABILIDADES_MANUAIS.has(n));
}
export function painelAcoes(f, d) {
  const lista = usaveisDaFicha(f, d);
  const gladiador = f.trilha === 'lamina' && d.trilhaHabs.find(h => h.nome === 'Gladiador Paranormal')?.liberada;
  if (!lista.length && !gladiador) return '';
  return `<section class="painel"><h2 class="faixa">Ações rápidas</h2><div class="acoes-rapidas">
    ${lista.map(n => `<div class="acao-rapida"><b>${esc(n)}</b>${botaoUsar(n, d)}</div>`).join('')}
    ${gladiador ? `<div class="acao-rapida"><b>Gladiador Paranormal</b><button class="btn pequeno usar" data-acao="gladiador">Acertei corpo a corpo (+2 PE temp.)</button></div>` : ''}
  </div><p class="apagado" style="font-size:.85rem;margin-top:6px">O botão desconta PE/PD (temporários primeiro). O que dura a cena aparece em "Efeitos ativos", onde você desliga.</p></section>`;
}
// Condições e efeitos que estão valendo, no Status operacional (aba Agente): de onde vieram, até quando, e botão para tirar
export function painelStatus(f, d) {
  const nomeAtr = id => ATRIBUTOS.find(a => a.id === id)?.nome || id;
  const quando = (m) => m.dura === 'permanente' ? 'permanente' : m.dura === 'turno' ? `por ${m.turnos} fim(ns) de turno` : 'até o fim da cena';
  const itens = [
    ...f.condicoes.map(id => { const c = CONDICOES.find(x => x.id === id); if (!c) return ''; const prazo = f.prazosCondicao[id];
      return `<div class="status-item negativo"><div><b>${esc(c.nome)}</b> <span class="etiqueta">condição</span>${f.origemCondicao[id] ? ` <small class="status-origem">${esc(f.origemCondicao[id])}</small>` : ''}
        <small>${esc(c.resumo)}${prazo ? ` · ${prazo} turno(s)` : ''}</small></div><button class="btn pequeno" data-acao="status-tirar-condicao" data-id="${id}" aria-label="Tirar ${esc(c.nome)}">Tirar</button></div>`; }),
    ...f.marcadores.map(m => `<div class="status-item ${m.tipo}"><div><b>${esc(m.nome)}</b> <span class="etiqueta">${quando(m)}</span>${m.origem ? ` <small class="status-origem">${esc(m.origem)}</small>` : ''}
        ${m.texto ? `<small>${esc(m.texto)}</small>` : ''}${m.desfazer ? `<small>Ao tirar, você escolhe se devolve ${m.desfazer.valor > 0 ? '+' : ''}${m.desfazer.valor} de ${esc(nomeAtr(m.desfazer.atributo))}.</small>` : ''}</div><button class="btn pequeno" data-acao="status-tirar-marcador" data-uid="${esc(m.uid)}" aria-label="Tirar ${esc(m.nome)}">Tirar</button></div>`),
    ...f.efeitos.map((e, i) => `<div class="status-item positivo"><div><b>${esc(e.nome)}</b> <span class="etiqueta">${DURA[e.dura]}</span>
        <small>${esc(descreverEf(e.ef, f) || 'sem bônus automático')}</small></div><button class="btn pequeno" data-acao="desligar-efeito" data-i="${i}" aria-label="Tirar ${esc(e.nome)}">Tirar</button></div>`),
  ].filter(Boolean);
  return `<h3 class="titulo-vermelho" style="margin-top:14px">Condições e efeitos</h3>
    ${itens.length ? `<div class="status-lista">${itens.join('')}</div>` : '<p class="apagado" style="font-size:.9rem">Nenhuma condição ou efeito valendo agora. Condições de rituais, desastres e da aba Combate aparecem aqui.</p>'}`;
}
export function painelEfeitos(f, d) {
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
// ---------- Defesa e Esquiva por partes ----------
// Base, itens equipados, habilidades/poderes e efeitos ativos são calculados; "Outros" é o ajuste do jogador
// (rituais e fontes que o site não calcula sozinho).
export function blocoDefesa(f, d) {
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
// Depois de subir de nível: abre a janela do que ganhou (aumento de atributo, grau de treinamento)
export function abrirPendenciaDeNivel(ctx) {
  const d = derivar(ctx.fichaAtual());
  if (d.pendencias.some(p => p.id === 'atributo')) return janelaAumento(ctx);
  if (d.pendencias.some(p => p.id === 'grau')) return janelaGrau(ctx);
}
// Limite de aumento de atributo pela regra: sobrevivente 3 (SaH p. 32), patentes 4, padrão 5.
export function limiteAumentoAtributo(f) {
  return ehSobrevivente(f) ? 3 : temOpcional(f, 'patentes') ? CRIACAO_ATRIBUTOS.maximoAumentoPatente : CRIACAO_ATRIBUTOS.maximoAumento;
}
export function janelaAumento(ctx) {
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
export function podeSubirGrau(f, d, id) {
  const g = f.pericias[id] || 0;
  return g >= 1 && g < 3 && d.nivelEq >= (GRAUS[g + 1].nivelMinimo || 0);
}
export function janelaGrau(ctx) {
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
// Ações (botões data-acao) da aba
export function acoesAgente(ctx, h) {
  const { f, salvar, quem, testar, ataqueValido, consumirDisparo, danoDaIdade } = h;
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
      const partesGasto = [];
      let custo = 0, minimo = 0, bonus = 0, dados = 0, danoExtra = 0, troca = null, atr = null, caos = 0, carga = false, margemExtra = 0, rerrolar = false, furtivoD8 = false; const extras = [], danoDados = [], nomes = [];
      for (const o of ops) {
        if (o.id === 'ataque-especial') {
          const at = inteiro(document.getElementById('ae-ataque')?.value, 0, 8, 0), dn = inteiro(document.getElementById('ae-dano')?.value, 0, 8, 0);
          const k = Math.min(o.maxPassos, at + dn); if (!k) continue;
          custo += o.custoPorPassos(k); minimo = Math.max(minimo, o.custoPorPassos(1)); partesGasto.push([o.nome, o.custoPorPassos(k)]); bonus += Math.min(at, k) * o.valorPasso; danoExtra += Math.max(0, k - at) * o.valorPasso; nomes.push(`${o.nome} ${k}×`);
        } else if (document.getElementById('gasto-' + o.id)?.checked) {
          custo += o.custo; minimo = Math.max(minimo, o.custo); partesGasto.push([o.nome.replace(/ \(.*\)$/, ''), o.custo]); bonus += o.bonus || 0; dados += o.dados || 0; nomes.push(o.nome.replace(/ \(.*\)$/, ''));
          if (o.dadoExtra) extras.push(o.dadoExtra); if (o.danoDados) danoDados.push(o.danoDados);
          if (o.troca) troca = o.troca; if (o.atr) atr = o.atr; if (o.caos) caos = o.caos; if (o.carga) carga = true; if (o.margem) margemExtra += o.margem; if (o.rerrolar) rerrolar = true; if (o.furtivoD8) furtivoD8 = true;
        }
      }
      const k = d.pd ? 'PD' : 'PE';
      if (custo) { custo += d.custoCondicao; minimo += d.custoCondicao; }
      if (!gastar(ficha, d, custo, d.limiteAcao, minimo, partesGasto)) return ctx.avisar(`${k} insuficiente ou limite por turno excedido.`, true);
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
        if (rerrolar) { // rolar de novo e ficar com o melhor (ex.: Mapa Celeste, do Mateiro)
          const segundo = await testar({ titulo: `${nome}${atributo} · 2ª rolagem`, quem: quem(), dados: pool(p.dados, dados), bonus: p.bonus + bonus }, p.atrUsado);
          if (segundo.total > item.total) item = segundo;
          ctx.avisar(`Rolou duas vezes: fica o melhor, ${item.total}.`);
        }
        danoDaIdade(p.atrUsado);
      } else {
        const a = d.ataques[alvo.i];
        const dadosFurtivos = danoDados.map(x => (furtivoD8 ? x.replace(/d6$/, 'd8') : x));
        item = await rolarTesteUI({ titulo: `Ataque · ${a.nome}${sufixo}`, quem: quem(), dados: pool(a.dados, dados), bonus: a.bonus + bonus, margem: Math.max(2, a.margem - margemExtra), mult: a.mult, gruposCritico: a.gruposCritico, tipo: 'ataque', criticoExtra: a.criticoExtra, formulaDano: a.formula + (danoExtra ? `+${danoExtra}` : '') + dadosFurtivos.map(x => '+' + x).join('') });
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
      else { const a = d.ataques[alvo.i]; if (!ataqueValido(a)) return; consumirDisparo(a); rolarTesteUI({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, gruposCritico: a.gruposCritico, tipo: 'ataque', criticoExtra: a.criticoExtra, formulaDano: a.formula }).then(fim); }
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
            if (!gastar(ficha, derivar(ficha), 5 + d.custoCondicao, undefined, undefined, [[nome, 5]])) return ctx.avisar('PE/PD insuficiente ou limite de turno.');
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
      if (custo && !gastar(ficha, d, custo, d.limiteAcao, minimo, [[nome, custo - d.custoCondicao]])) return ctx.avisar(`${k} insuficiente (precisa de ${custo}).`, true);
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
      if (e[3]) marcarCondicao(ficha, e[3], `Efeito de medo: ${e[1]}`);
      const d0 = derivar(ficha);
      if (n === 2 && !d0.pd) { const ganho = Math.max(1, Math.floor((ficha.nex || 5) / 5)); recuperar(ficha, d0, 'san', ganho); ficha.efeitos.push({ uid: uid(), nome: 'Encorajamento', dura: 'proxima', nota: '+1d20 num teste à escolha', ef: { dadosTodas: 1 } }); }
      if (n === 3) ficha.efeitos.push({ uid: uid(), nome: 'Surto de adrenalina (medo)', dura: 'cena', nota: 'outras ações: Vontade DT 20', ef: { ataque: 5, dano: 5 } });
      if (n === 10) ficha.efeitos.push({ uid: uid(), nome: 'Histeria (medo)', dura: 'cena', nota: 'dura 1d4 rodadas', ef: { dadosTodas: -1, ataqueDados: -1 } });
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`Medo ${n}: ${e[1]}. ${e[2]}`);
      if (n === 18) await rolarDanoUI({ titulo: 'Trauma: atributo (1d6)', quem: quem(), formula: '1d6', rotulo: 'TRAUMA' });
    },
        'status-tirar-condicao': el => {
      const ficha = f(), id = el.dataset.id, nome = CONDICOES.find(c => c.id === id)?.nome || id;
      ficha.condicoes = ficha.condicoes.filter(c => c !== id); delete ficha.prazosCondicao[id]; delete ficha.origemCondicao[id];
      salvar(); ctx.avisar(`${nome} tirada.`);
    },
        'status-tirar-marcador': el => {
      const ficha = f(), m = ficha.marcadores.find(x => x.uid === el.dataset.uid); if (!m) return;
      let msg = `${m.nome}: aviso tirado.`;
      if (m.desfazer) {
        const atr = ATRIBUTOS.find(a => a.id === m.desfazer.atributo);
        if (confirm(`Devolver ${m.desfazer.valor > 0 ? '+' : ''}${m.desfazer.valor} de ${atr?.nome} também?\n\nOK = devolve o atributo e tira o aviso\nCancelar = só tira o aviso (a perda continua)`)) {
          ficha.atributos[m.desfazer.atributo] = Math.max(0, (ficha.atributos[m.desfazer.atributo] || 0) + m.desfazer.valor);
          msg = `${m.nome}: ${atr?.nome} devolvido.`;
        }
      }
      ficha.marcadores = ficha.marcadores.filter(x => x !== m);
      salvar(); ctx.avisar(msg);
    },
        'desligar-efeito': el => { const ficha = f(); const e = ficha.efeitos[Number(el.dataset.i)]; ficha.efeitos.splice(Number(el.dataset.i), 1); salvar(); ctx.avisar(`${e?.nome || 'Efeito'} desligado.`); },
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
        'ativo': el => { const ficha = f(); ficha.ativos[el.dataset.k] = !ficha.ativos[el.dataset.k]; salvar(); },
        'rolar-atributo': el => { const d = derivar(f()); const a = ATRIBUTOS.find(x => x.id === el.dataset.atr); const aj = d.ajusteDados[a.id] + d.ajusteDados.todos; const n = d.atributosEfetivos[a.id] + aj; testar({ titulo: a.nome, quem: quem(), dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2 - n, pior: true }, bonus: a.id === 'pre' && temPeso(f(), 'rabugento') ? -5 : 0 }, a.id).then(() => danoDaIdade(a.id)); },
        'rolar-iniciativa': () => acoesFicha(ctx)['rolar-pericia']({ dataset: { id: 'iniciativa' } }), // abre os gastos (Eclético, origem…) como qualquer perícia
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
        'aplicar-dano': el => {
      const ficha = f(), d = derivar(ficha), rec = el.dataset.rec; let q = inteiro(document.getElementById('dano-qtd')?.value, 0, 99999, 0);
      const rdGeral = document.getElementById('dano-aplicar-rd')?.checked ? (rec === 'pv' ? d.rd : d.rdMental) : 0;
      const elemento = document.getElementById('dano-elemento')?.value;
      const rd = Math.max(rdGeral, rec === 'pv' ? d.rdElemento[elemento] || 0 : 0);
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
        const temReducao = k === 'pv' ? d.rd || Object.keys(d.rdElemento).length : d.rdMental;
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
        delete ficha.prazosCondicao[id]; delete ficha.origemCondicao[id];
      } else { ficha.condicoes.push(id); const n = perderFoco(ficha); if (n) ctx.avisar(`Perdeu o foco: ${n} ritual(is) retido(s) soltos. Os ${derivar(ficha).pd ? 'PD' : 'PE'} máximos voltaram; os atuais não.`, true); }
      salvar(); },
        'rolar-ferimento': () => { const ficha = f(); const n = dado(6); const atr = FERIMENTOS[n - 1]; if (atr) { ficha.ferimentos.push(atr); salvar(); } ctx.avisar(`1d6 = ${n}: ${atr ? 'ferimento em ' + ATRIBUTOS.find(a => a.id === atr).nome : 'ferimento superficial (nenhum atributo)'}.`); },
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
      abrirModal('Atributos', `<p class="apagado">Edite os valores base para aumentos de atributo (NEX 20%, 50%, 80%, 95%) ou correções. Os bônus dos itens equipados entram automaticamente na roda.</p><div class="grade c3">${ATRIBUTOS.map(a => `<label class="campo"><span>${a.nome}</span><input type="number" min="0" max="7" data-modal-atr="${a.id}" value="${at[a.id]}"></label>`).join('')}</div>`, '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="salvar-atributos">Salvar</button>');
    },
        'salvar-atributos': () => { const ficha = f(); document.querySelectorAll('[data-modal-atr]').forEach(i => { ficha.atributos[i.dataset.modalAtr] = inteiro(i.value, 0, tetoEtario(ficha, i.dataset.modalAtr, 7), 1); }); fecharModal(); salvar(); },
        'retrato': async () => {
      const arq = await escolherArquivo('image/png,image/jpeg,image/webp'); if (!arq) return;
      try { f().retrato = await reduzirImagem(arq); salvar(); } catch (e) { ctx.avisar(e.message, true); }
    },
        'escolher-opcao': el => { const e = estado.escolhaPendente; if (!e?.aoEscolher) return; estado.escolhaPendente = null; e.aoEscolher(el.dataset.valor); },
        'confirmar-multipla': () => { const e = estado.escolhaPendente; if (!e?.aoConfirmar) return; const ids = [...document.querySelectorAll('[data-multi]:checked')].map(c => c.dataset.multi); if (e.max && ids.length > e.max) return ctx.avisar(`Escolha no máximo ${e.max}.`, true); if (!ids.length) return ctx.avisar('Marque pelo menos uma opção.', true); estado.escolhaPendente = null; e.aoConfirmar(ids); },
        'exportar-ficha': () => { const ficha = f(); baixarArquivo(`agente-${(ficha.nome || 'sem-nome').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.json`, JSON.stringify({ tipo: 'fichaoculta-ficha', versao: 1, ficha }, null, 2)); },
        'imprimir': () => print(),
        'duplicar-ficha': () => { const c = normalizar({ ...structuredClone(f()), id: uid(), nome: f().nome + ' (cópia)' }); ctx.adicionarFicha(c); location.hash = '#/agente/' + c.id; },
        'apagar-ficha': () => { const ficha = f(); if (!confirm(`Apagar "${ficha.nome || 'agente'}" para sempre? Exporte antes se quiser guardar.`)) return; ctx.apagarFicha(ficha.id); location.hash = '#/agentes'; },
  };
}
