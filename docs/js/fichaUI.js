// fichaUI.js — as telas da ficha do agente e as ações delas.
import {
  MODOS, OPCIONAIS, ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, CLASSES, ORIGEM, TRILHAS, TRILHA, PODER, ELEMENTOS, CIRCULOS,
  ARMAS, PROTECOES, ITENS_GERAIS, CONDICOES, PATENTES, RITUAIS, TIPOS_DANO, FERIMENTOS, EXPOSICOES, PODERES_PARANORMAIS, PODER_PARANORMAL, USAVEIS, PODERES, ORIGENS, TREINAMENTO_ESPECIAL,
} from './catalogo.js?v=0.6';
import { derivar, normalizar, poderesParaFicha, cumpreRequisito, ehSobrevivente, temOpcional, usaPD, nexSeparado, opcoesGasto, poderesDeOutrasClasses } from './regras.js?v=0.6';
import { esc, comSinal, romano, sigilo, semAcento, inteiro, numero, uid, imagemOpcional, reduzirImagem, escolherArquivo, baixarArquivo } from './util.js?v=0.6';
import { pentagramaAtributos } from './criador.js?v=0.6';
import { textoTeste, d, rolar } from './dados.js?v=0.6';
import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal } from './rolagem.js?v=0.6';

export const ABAS = [['agente', 'Agente'], ['combate', 'Combate'], ['habilidades', 'Habilidades'], ['rituais', 'Rituais'], ['inventario', 'Inventário'], ['notas', 'Notas']];
const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
const fonteTag = f => f === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : '';
const cat = n => (n ? romano(n) : '0');

// ---------- Tela ----------
export function telaFicha(f, ui) {
  const d = derivar(f);
  dAtual = d;
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
  const nivelCampo = ehSobrevivente(f)
    ? `<label class="campo"><span>Estágio</span><select data-campo="estagio" data-tipo="int">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${f.estagio === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>${f.modo === 'sah' ? campoNexExposicao : ''}`
    : temOpcional(f, 'patentes') ? `<label class="campo"><span>Prestígio (PP)</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="f-pp" value="${f.pp}"></label>${campoNexExposicao}`
      : temOpcional(f, 'nivelExp') ? `<label class="campo"><span>Nível</span><select data-campo="nivel" data-tipo="int">${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${f.nivel === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>${campoNexExposicao}`
        : `<label class="campo"><span>NEX</span><select data-campo="nex" data-tipo="int">${NEX.map(n => `<option value="${n}" ${f.nex === n ? 'selected' : ''}>${n}%</option>`).join('')}</select></label>`;
  const botoesExposicao = nexSeparado(f) ? `<div class="linha" style="margin-top:8px"><span class="rotulo">Exposição ao paranormal:</span>${EXPOSICOES.map(e => `<button class="btn pequeno" data-acao="exposicao" data-nex="${e.nex}" title="${esc(e.resumo)}">${esc(e.nome)} +${e.nex}%</button>`).join('')}</div><p class="apagado" style="font-size:.85rem;margin-top:4px">O NEX aqui mede só a exposição (máximo 99%). Aprender um ritual soma o círculo dele no NEX. ${f.opcionais.progressaoNex ? 'A Progressão de NEX está na aba Habilidades.' : 'A Progressão de NEX (regra opcional) está desligada: ligue na aba Notas se quiser.'}</p>` : '';
  return `${efeitos ? `<div style="margin-bottom:14px">${efeitos}</div>` : ''}<div class="grade c2">
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
      ${ehSobrevivente(f) || temOpcional(f, 'patentes') ? '' : `<label class="campo"><span>Patente (PP: ${f.pp})</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="f-pp2" value="${f.pp}" aria-label="Pontos de prestígio"></label>`}
    </div>${botoesExposicao}
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
    ${d.ataques.map((a, i) => `<tr><td><b>${esc(a.nome)}</b><br><small>${esc(a.periciaNome)} · ${a.prof}${a.temProf ? '' : ' <span class="etiqueta alerta">sem proficiência −1D</span>'}${a.notas?.length ? `<br><small class="apagado">${a.notas.map(esc).join(' · ')}</small>` : ''}</small></td>
      <td><button class="rolavel" data-acao="rolar-ataque" data-i="${i}"><span class="d">${textoTeste(a.dados, a.bonus)}</span></button></td>
      <td><button class="rolavel" data-acao="rolar-dano" data-i="${i}"><span class="d">${esc(a.formula)}</span></button> <small>${esc(TIPOS_DANO[a.tipo] || a.tipo)}</small></td>
      <td class="num">${a.margem < 20 ? a.margem + '+' : '20'} / ×${a.mult}</td><td class="esconde-celular">${esc(a.alcance)}</td>
      <td>${a.automatica ? '' : `<button class="icone-btn" data-acao="editar-arma" data-i="${f.armas.findIndex(x => x.uid === a.uid)}" aria-label="Editar ${esc(a.nome)}">✎</button>`}</td></tr>`).join('')}
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
  ${painelEfeitos(f, d)}
  ${painelAcoes(f, d)}
  <section class="painel"><h2 class="faixa">Condições</h2>
    <div class="condicoes">${CONDICOES.map(c => `<button data-acao="condicao" data-id="${c.id}" aria-pressed="${f.condicoes.includes(c.id)}" title="${esc(c.resumo)}">${esc(c.nome)}</button>`).join('')}</div>
    ${f.condicoes.length ? `<ul style="margin-top:10px">${f.condicoes.map(id => CONDICOES.find(c => c.id === id)).filter(Boolean).map(c => `<li><b>${esc(c.nome)}:</b> ${esc(c.resumo)}</li>`).join('')}</ul>` : '<p class="apagado" style="margin-top:8px">Nenhuma condição. As penalidades de dados entram sozinhas nas rolagens.</p>'}
    ${temOpcional(f, 'ferimentos') ? `<h3 class="titulo-vermelho">Ferimentos debilitantes</h3>
      <p class="apagado" style="font-size:.9rem">Cada ferimento: −1 dado nos testes do atributo. Em Vigor, também reduz os PV máximos.</p>
      <div class="linha">${f.ferimentos.map((a, i) => `<span class="etiqueta alerta">${a.toUpperCase()} <button class="icone-btn" style="width:22px;height:22px" data-acao="remover" data-lista="ferimentos" data-i="${i}" aria-label="Curar ferimento">✕</button></span>`).join('')}
      <button class="btn pequeno" data-acao="rolar-ferimento">Rolar ferimento (1d6)</button></div>` : ''}
  </section></div>`;
}

// Painel de EFEITOS ATIVOS: tudo que dura a cena/rodada/próxima rolagem. O jogador desliga quando quiser.
const DURA = { cena: 'até o fim da cena', rodada: 'até o seu próximo turno', proxima: 'só na próxima rolagem' };
function descreverEf(ef, f) {
  const nomeV = v => (typeof v === 'string' ? `+${f.atributos[v]} (${v.toUpperCase()})` : (v >= 0 ? '+' : '') + v);
  const partes = [];
  const rot = { defesa: 'Defesa', resistencia: 'resistências', rd: 'RD', rdMental: 'RD mental', desl: 'desloc.', todasPericias: 'todas as perícias', dadosTodas: 'dado(s) em perícias', ataque: 'ataque', ataqueDados: 'dado(s) no ataque', dano: 'dano', margemTodas: 'margem de ameaça', dtRitual: 'DT de rituais' };
  for (const [k, v] of Object.entries(ef)) {
    if (k === 'pericia' || k === 'dadosPericia') { for (const [p, x] of Object.entries(v)) partes.push(`${nomeV(x)}${k === 'dadosPericia' ? 'D' : ''} ${PERICIA[p]?.nome || p}`); }
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
  if (ORIGEM[f.origem]) nomes.add(ORIGEM[f.origem].poder);
  for (const p of f.poderes) if (PODER[p.id]) nomes.add(PODER[p.id].nome);
  for (const p of f.paranormais) nomes.add(PODER_PARANORMAL[p.id].nome);
  return [...nomes].filter(n => USAVEIS[n]);
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
function botaoUsar(nome, d) {
  if (BOTOES_JANELA[nome]) return `<button class="btn pequeno usar" data-acao="${BOTOES_JANELA[nome][0]}">${BOTOES_JANELA[nome][1]}</button>`;
  const u = USAVEIS[nome]; if (!u) return '';
  const k = d.pd ? 'PD' : 'PE';
  const custo = typeof u.custo === 'number' ? (u.custo ? `−${u.custo} ${k}` : 'grátis') : u.custo === 'aliados' ? `${k} por alvo` : `${k} variável`;
  return `<button class="btn pequeno usar" data-acao="usar" data-nome="${esc(nome)}" title="${esc(u.nota || '')}">Usar (${custo})</button>`;
}

// ---------- Aba HABILIDADES ----------
let dAtual = null; // derivação da ficha que está sendo desenhada (para os botões "Usar")
function hab(nome, resumo, meta = '', chave = '', f = null, trancada = false) {
  const nota = chave && f ? f.notasHabilidade[chave] || '' : '';
  const base = String(nome).replace(/ \(.*\)$/, '');
  const usar = !trancada && dAtual ? botaoUsar(base, dAtual) : '';
  return `<div class="hab ${trancada ? 'trancada' : ''}"><span class="meta">${meta}${usar}</span><b>${esc(nome)}</b>${resumo ? `<p>${esc(resumo)}</p>` : ''}
    ${chave && !trancada ? `<details${nota ? ' open' : ''}><summary class="apagado" style="cursor:pointer;font-size:.85rem">Anotação</summary><textarea data-campo="notasHabilidade.${esc(chave)}" id="nota-${esc(chave)}" placeholder="Texto do livro, custo, detalhes…">${esc(nota)}</textarea></details>` : ''}</div>`;
}
function abaHabilidades(f, d) {
  const cls = CLASSES[f.classe];
  const o = ORIGEM[f.origem];
  const trilhas = TRILHAS.filter(t => t.classe === f.classe && (t.fonte !== 'SaH' || f.modo === 'sah')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  const disponiveis = poderesParaFicha(f);
  return `<div class="grade c2">
  <section class="painel"><h2 class="faixa sangue">Classe · ${esc(cls.nome)}</h2>
    <div class="lista-hab">${d.habilidades.map(h => hab(h.nome, h.resumo, '', 'classe-' + h.nome, f)).join('') || '<p class="apagado">—</p>'}</div>
    ${escolhasClasse(f)}
    ${d.versatilidade ? `<div class="hab" style="margin-top:10px"><span class="meta"><button class="btn pequeno usar" data-acao="versatilidade">${f.escolhas.versatilidade ? 'Trocar' : 'Escolher'}</button></span><b>Versatilidade (NEX 50%)</b><p>${f.escolhas.versatilidade ? `Escolhida: <b>${esc(TRILHA[f.escolhas.versatilidade].habilidades[0].nome)}</b> (trilha ${esc(TRILHA[f.escolhas.versatilidade].nome)}) — ${esc(TRILHA[f.escolhas.versatilidade].habilidades[0].resumo)}` : 'Um poder de classe a mais OU a 1ª habilidade de outra trilha da sua classe.'}</p></div>` : ''}
    ${ehSobrevivente(f) && f.modo === 'sah' ? `<div class="hab" style="margin-top:10px"><span class="meta"><button class="btn pequeno usar" data-acao="treinamento-especial">Entrar para a Ordem</button></span><b>Treinamento Especial</b><p>Se a história levar o sobrevivente para a Ordem, ele vira NEX 5% de uma classe.</p></div>` : ''}
    ${f.poderes.some(p => p.id === 'flashback') && ORIGEM[f.escolhas.flashback] ? hab(`${ORIGEM[f.escolhas.flashback].poder} (Flashback)`, ORIGEM[f.escolhas.flashback].resumo, `<span class="etiqueta">${esc(ORIGEM[f.escolhas.flashback].nome)}</span>`, 'flashback', f) : ''}
    <h3 class="titulo-vermelho">Origem</h3>
    ${o ? hab(o.poder, o.resumo, `<span class="etiqueta">${esc(o.nome)}</span>${fonteTag(o.fonte)}`, 'origem', f) : f.origem === 'propria' ? hab(f.origemPropria.poder || 'Poder da origem', f.origemPropria.resumo, `<span class="etiqueta">${esc(f.origemPropria.nome)}</span>`, 'origem', f) : '<p class="apagado">Sem origem.</p>'}
    <label class="campo" style="margin-top:10px"><span>Origem</span><select data-campo="origem">${['<option value="">—</option>', ...Object.values(ORIGEM).filter(x => x.fonte !== 'SaH' || f.modo === 'sah').sort((a, b) => a.nome.localeCompare(b.nome, 'pt')).map(x => `<option value="${x.id}" ${f.origem === x.id ? 'selected' : ''}>${esc(x.nome)}${x.fonte === 'SaH' ? ' (SaH)' : ''}</option>`), `<option value="propria" ${f.origem === 'propria' ? 'selected' : ''}>Origem própria</option>`].join('')}</select></label>
    ${f.origem === 'propria' ? `<div class="grade c2" style="margin-top:8px"><label class="campo"><span>Nome</span><input data-campo="origemPropria.nome" id="op-nome" value="${esc(f.origemPropria.nome)}"></label><label class="campo"><span>Poder</span><input data-campo="origemPropria.poder" id="op-poder" value="${esc(f.origemPropria.poder)}"></label><label class="campo" style="grid-column:1/-1"><span>Efeito</span><textarea data-campo="origemPropria.resumo" id="op-resumo">${esc(f.origemPropria.resumo)}</textarea></label></div>` : ''}
  </section>
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Trilha</h2>
    <select data-campo="trilha" style="max-width:240px" aria-label="Trilha"><option value="">— escolher —</option>${trilhas.map(t => `<option value="${t.id}" ${f.trilha === t.id ? 'selected' : ''}>${esc(t.nome)}${t.fonte === 'SaH' ? ' (SaH)' : ''}</option>`).join('')}</select></div>
    ${d.trilha ? `${d.trilha.aviso ? `<p class="apagado" style="font-size:.88rem">${esc(d.trilha.aviso)}</p>` : ''}<div class="lista-hab">${d.trilhaHabs.map(h => hab(h.nome, h.resumo, `<span class="etiqueta">${ehSobrevivente(f) ? `Estágio ${h.nivel}` : temOpcional(f, 'patentes') ? ['', '', 'Agente especial', '', '', '', '', '', 'Oficial', '', '', '', '', 'Elite', '', '', '', '', '', '', 'Elite'][h.nivel] : temOpcional(f, 'nivelExp') ? `Nível ${h.nivel}` : `NEX ${NEX[h.nivel - 1]}%`}</span>`, 'trilha-' + h.nome, f, !h.liberada)).join('')}</div>`
      : `<p class="apagado">Escolha a trilha ${ehSobrevivente(f) ? 'no estágio 2' : temOpcional(f, 'patentes') ? 'ao virar agente especial' : 'em NEX 10%'}.</p>`}
  </section></div>
  ${secaoParanormais(f, d)}
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Poderes de classe</h2><span class="contador ${f.poderes.filter(p => !(d.transcenderSeparado && p.id === 'transcender')).length > d.slotsPoder + (d.versatilidade ? 1 : 0) ? 'erro' : ''}">${f.poderes.filter(p => !(d.transcenderSeparado && p.id === 'transcender')).length} / ${d.slotsPoder}${d.versatilidade ? ' +1' : ''}</span></div>
    <div class="lista-hab">${f.poderes.map((p, i) => { const def = PODER[p.id]; return def ? hab(def.nome + (p.escolha ? ` (${p.escolha})` : ''), def.resumo, `${p.via ? `<span class="etiqueta">via ${esc(p.via)}</span>` : ''}${def.req ? `<small class="apagado">${esc(def.req)}</small>` : ''}${fonteTag(def.fonte)}<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button>`, 'poder-' + p.uid, f) : hab(p.nome, p.resumo, `<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover">✕</button>`, 'poder-' + p.uid, f); }).join('') || '<p class="apagado">Nenhum poder escolhido.</p>'}</div>
    <div class="linha" style="margin-top:10px"><button class="btn" data-acao="escolher-poder">+ Escolher poder</button><button class="btn fantasma" data-acao="poder-proprio">+ Poder próprio (homebrew)</button></div>
    <p class="apagado" style="font-size:.88rem;margin-top:6px">${f.modo === 'sah' ? 'No Sobrevivendo ao Horror, poderes gerais podem ser escolhidos no lugar de um poder de classe. ' : ''}Escolher <b>Transcender</b> abre a janela de poderes paranormais.</p>
  </section>
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

// Seção de PODERES PARANORMAIS: Transcender e poderes paranormais contados separados
function secaoParanormais(f, d) {
  const ELEM_COR = { conhecimento: 'conhecimento', energia: 'energia', morte: 'morte', sangue: 'sangue', variavel: 'variavel' };
  const lista = f.paranormais.map((p, i) => {
    const def = PODER_PARANORMAL[p.id];
    const el = def.elemento === 'variavel' ? (semAcento(p.escolha) || 'variavel') : def.elemento;
    return `<div class="hab el-${ELEM_COR[el] || 'variavel'}" style="border-left-color:var(--el)"><span class="meta">${sigilo(ELEM_COR[el] || 'variavel', 'var(--el)')}<span class="etiqueta">${p.fonte === 'transcender' ? 'Transcender' : p.fonte === 'origem' ? 'Origem' : 'Outro'}</span>${p.afinidade ? '<span class="etiqueta">afinidade</span>' : ''}${def.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}${dAtual ? botaoUsar(def.nome, dAtual) : ''}<button class="icone-btn" data-acao="remover-paranormal" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button></span>
      <b>${esc(def.nome)}${p.escolha ? ` (${esc(p.escolha)})` : ''}</b><p>${esc(p.afinidade ? 'Afinidade: ' + def.afinidade : def.resumo)}</p></div>`;
  }).join('');
  const T = d.transcenderes, LT = d.limiteTranscender;
  return `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa sangue">Poderes paranormais</h2>
      <div class="linha"><span class="contador ${T > LT ? 'erro' : ''}" title="Quantas vezes transcendeu">Transcender: ${T} / ${LT}</span><span class="contador ${d.paranormaisUsados > d.limiteParanormais ? 'erro' : ''}" title="Poderes paranormais escolhidos">Paranormais: ${d.paranormaisUsados} / ${d.limiteParanormais}</span></div></div>
    <p class="apagado" style="font-size:.88rem">${d.transcenderSeparado ? 'Com NEX separado (Sobrevivendo ao Horror), você pode transcender uma vez em cada faixa de NEX 25/35/50/60/75/90%, sem gastar poder de classe.' : 'Cada Transcender ocupa um poder de classe e não dá Sanidade naquele NEX.'} Cada Transcender dá 1 poder paranormal${d.paranormalDaOrigem ? '; a origem Cultista Arrependido dá mais 1' : ''}.${f.elementoAfinidade ? ` Afinidade: <b>${esc(f.elementoAfinidade)}</b> (pode escolher poderes desse elemento uma 2ª vez).` : ''}</p>
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
      const afin = tem.length === 1 && !tem[0].afinidade && f.elementoAfinidade === p.elemento && !!p.afinidade;
      const faltas = Object.entries(p.req || {}).filter(([e, n]) => (d.porElemento[e] || 0) < n).map(([e, n]) => `${nomesEl[e]} ${n}`);
      const bloqueado = (tem.length && !p.repete && !afin) || faltas.length;
      return `<button class="cartao el-${el}" style="border-left:4px solid var(--el)" data-acao="add-paranormal" data-id="${p.id}" data-fonte="${fonte}" data-afinidade="${afin ? 1 : 0}" data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${bloqueado ? 'disabled' : ''}>
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
    && (!filtro.elemento || r.elemento === filtro.elemento) && (!filtro.circulo || r.circulo === Number(filtro.circulo))
    && (!filtro.busca || semAcento(r.nome + ' ' + r.resumo).includes(semAcento(filtro.busca)))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
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
  const calc = d.rituais[i] || {}, custo = calc.custo ?? CIRCULOS[r.circulo - 1].custo;
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
    <div class="linha" style="margin-top:8px"><button class="btn pequeno sangue" data-acao="conjurar" data-i="${i}">Conjurar (−${custo} ${d.pd ? 'PD' : 'PE'})</button>${r.formula ? `<button class="btn pequeno" data-acao="rolar-ritual" data-i="${i}">Rolar ${esc(calc.formulaFinal || r.formula)}</button>` : ''}<span class="espaco"></span><span class="apagado dossie-txt">DT ${calc.dt ?? d.dtRitual}</span></div>
    ${calc.notas?.length ? `<p class="apagado" style="font-size:.82rem;margin:4px 0 0">${calc.notas.map(esc).join(' · ')}</p>` : ''}
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
    ${lim ? `<div class="grade c2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        <label class="campo"><span>Patente</span><select data-campo="patenteManual" data-tipo="int"><option value="0" ${!f.patenteManual ? 'selected' : ''}>Automática pelos PP (${esc(PATENTES.find(p => p.n === (PATENTES.filter(x => f.pp >= x.pp).at(-1) || PATENTES[0]).n).nome)})</option>${PATENTES.map(p => `<option value="${p.n}" ${f.patenteManual === p.n ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
        <label class="campo"><span>Pontos de prestígio</span><input type="number" min="0" data-campo="pp" data-tipo="int" id="inv-pp" value="${f.pp}"></label>
        <label class="campo"><span>Limite de crédito</span><select data-campo="creditoManual"><option value="" ${!f.creditoManual ? 'selected' : ''}>Da patente (${esc(PATENTES[d.patente.n - 1].credito)})</option>${['Baixo', 'Médio', 'Alto', 'Ilimitado'].map(c => `<option ${f.creditoManual === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
      <table class="tabela" style="margin-top:10px"><thead><tr><th>Categoria</th><th>I</th><th>II</th><th>III</th><th>IV</th></tr></thead><tbody>
        <tr><td>Em uso</td>${[1, 2, 3, 4].map(c => `<td class="num" style="${d.usoCategoria[c] > lim[c - 1] ? 'color:var(--perigo);font-weight:700' : ''}">${d.usoCategoria[c]}</td>`).join('')}</tr>
        <tr><td>Pode levar</td>${[1, 2, 3, 4].map(c => `<td><input type="number" min="0" max="20" style="width:64px;min-height:30px;padding:2px 6px" data-limite-item="${c - 1}" id="lim-${c}" value="${lim[c - 1]}" aria-label="Limite de itens de categoria ${romano(c)}"></td>`).join('')}</tr></tbody></table>
      <div class="linha" style="margin-top:8px"><small class="apagado">${d.patente.itensEditados ? 'Limites editados à mão.' : 'Limites da patente.'} Itens de categoria 0 não têm limite.</small>${d.patente.itensEditados ? '<button class="btn pequeno" data-acao="limites-padrao">Voltar ao padrão da patente</button>' : ''}</div>
      ${!f.patenteManual && PATENTES[d.patente.n] ? `<p class="apagado" style="margin-top:6px">Próxima: ${esc(PATENTES[d.patente.n].nome)} com ${PATENTES[d.patente.n].pp} PP.</p>` : ''}`
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

// ---------- Janela "Gastar PE" antes de rolar (passo 9) ----------
function janelaGasto(f, d, alvo, ops) {
  const k = d.pd ? 'PD' : 'PE';
  const titulo = alvo.tipo === 'pericia' ? d.PER[alvo.id].nome : `Ataque · ${d.ataques[alvo.i].nome}`;
  const linhas = ops.map(o => o.id === 'ataque-especial'
    ? `<div class="hab"><b>${esc(o.nome)}</b> <small class="apagado">até ${o.maxPassos}× +${o.valorPasso} · custo: ${Array.from({ length: o.maxPassos }, (_, j) => `${j + 1}× = ${o.custoPorPassos(j + 1)} ${k}`).join(', ')}</small>
        <div class="grade c2" style="margin-top:6px"><label class="campo"><span>+${o.valorPasso} no ATAQUE (vezes)</span><input type="number" id="ae-ataque" min="0" max="${o.maxPassos}" value="0"></label><label class="campo"><span>+${o.valorPasso} no DANO (vezes)</span><input type="number" id="ae-dano" min="0" max="${o.maxPassos}" value="0"></label></div>
        ${o.nota ? `<p>${esc(o.nota)}</p>` : ''}</div>`
    : `<label class="check hab"><input type="checkbox" id="gasto-${o.id}"><span><b>${esc(o.nome)}</b> — ${o.custo} ${k}: ${o.bonus ? `+${o.bonus}` : ''}${o.dados ? `+${o.dados}D` : ''}${o.dadoExtra ? `+${o.dadoExtra}` : ''}${o.nota ? ` <small class="apagado">(${esc(o.nota)})</small>` : ''}</span></label>`).join('');
  const dadosAlvo = JSON.stringify(alvo).replace(/"/g, '&quot;');
  abrirModal(titulo, `<p class="apagado">Você tem <b>${d.atual[d.pd ? 'pd' : 'pe']} ${k}</b> (limite ${d.limitePE} por turno). Marque o que quer gastar nesta rolagem:</p><div class="lista-hab">${linhas}</div>`,
    `<button class="btn fantasma" data-acao="rolar-sem-gasto" data-alvo="${dadosAlvo}">Rolar sem gastar</button><button class="btn sangue" data-acao="rolar-com-gasto" data-alvo="${dadosAlvo}">Gastar e rolar</button>`);
}

function janelaParamedico(f, d) {
  const max = 2 + ['paramedico'].length * 0 + (d.trilhaHabs.filter(h => h.liberada && h.nivel >= 8).length);
  abrirModal('Paramédico', `<p>Ação padrão: cura você ou um aliado adjacente. 2 PE para 2d10, +1 PE por dado extra (liberados em NEX 40%, 65% e 99%).</p>
    <label class="campo"><span>Dados de cura (d10)</span><select id="para-dados">${Array.from({ length: max - 1 }, (_, i) => i + 2).map(n => `<option value="${n}">${n}d10 (${2 + n - 2} PE)</option>`).join('')}</select></label>`,
    '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="paramedico">Curar</button>');
}
// Janela de CONJURAR: custo do ritual + extras (Ampliar, Acelerar, Camuflar, formas avançadas) + pagar com PV (Flagelador)
function janelaConjurar(f, d, i) {
  const r = d.rituais[i], k = d.pd ? 'PD' : 'PE';
  const tem = id => f.poderes.some(p => p.id === id);
  const op = [];
  if (f.trilha === 'conduite' && d.trilhaHabs.find(h => h.nome === 'Ampliar Ritual')?.liberada) op.push(['ampliar', 'Ampliar Ritual (+2): mais alcance ou área em dobro', 2]);
  if (f.trilha === 'conduite' && d.trilhaHabs.find(h => h.nome === 'Acelerar Ritual')?.liberada) op.push(['acelerar', 'Acelerar Ritual (+4): conjurar como ação livre', 4]);
  if (tem('camuflar-ocultismo')) op.push(['camuflar', 'Camuflar Ocultismo (+2): sem gestos nem palavras', 2]);
  if (f.trilha === 'lamina' && semAcento(r.nome) === 'amaldicoar arma') op.push(['lamina', 'Lâmina Maldita (+1): conjurar com ação de movimento', 1]);
  const flagelo = f.trilha === 'flagelador' && d.trilhaHabs.find(h => h.nome === 'Poder do Flagelo')?.liberada;
  abrirModal(`Conjurar · ${r.nome}`, `<p>Custo base: <b>${r.custo} ${k}</b> · DT ${r.dt} · limite ${d.limiteRitual} ${k}/turno.</p>
    <div class="lista-hab">${op.map(([id, n]) => `<label class="check hab"><input type="checkbox" id="conj-${id}" data-custo="${op.find(o => o[0] === id)[2]}"><span>${esc(n)}</span></label>`).join('')}
    <label class="campo hab"><span>Forma discente/verdadeira ou outro custo extra (${k})</span><input type="number" min="0" id="conj-extra" value="0"></label>
    ${flagelo ? `<label class="check hab"><input type="checkbox" id="conj-flagelo"><span><b>Poder do Flagelo:</b> pagar com PV (2 PV por ${k}). PV gastos assim só voltam com descanso.</span></label>` : ''}</div>`,
    `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="conjurar-confirmar" data-i="${i}">Conjurar</button>`);
}
// Janela de SOFRER DANO: reduções automáticas (RD, bloqueio, Duro de Matar, Abraçar a Dor, Acostumado ao Extremo, Escapar da Morte)
function janelaDano(f, d, qtd, recurso) {
  const op = [];
  const k = d.pd ? 'PD' : 'PE';
  if (recurso === 'pv') {
    if (d.rd) op.push(['rd', `Resistência a dano ${d.rd}`, 0]);
    if (d.bloqueio != null) op.push(['bloqueio', `Bloqueio (reação): RD ${d.bloqueio} contra ataque corpo a corpo`, 0]);
    if (f.trilha === 'tropa' && d.trilhaHabs.find(h => h.nome === 'Duro de Matar')?.liberada) op.push(['duro', `Duro de Matar (reação, 2 ${k}): dano à metade`, 2]);
    if (f.trilha === 'flagelador' && d.trilhaHabs.find(h => h.nome === 'Abraçar a Dor')?.liberada) op.push(['abracar', `Abraçar a Dor (reação, 2 ${k}): dano não paranormal à metade`, 2]);
    if (f.paranormais.some(p => p.id === 'escapar-da-morte') && !f.usosCena.escaparMorte) op.push(['escapar', 'Escapar da Morte (1×/cena): fica com 1 PV em vez de 0', 0]);
  } else if (d.rdMental) op.push(['rdmental', `Resistência a dano mental ${d.rdMental}`, 0]);
  if (ORIGEM[f.origem]?.id === 'astronauta') { const usos = f.usosCena.astronauta || 0; op.push(['astronauta', `Acostumado ao Extremo (${1 + usos} ${k}): −5 de dano de fogo, frio ou mental`, 1 + usos]); }
  abrirModal(recurso === 'pv' ? 'Sofrer dano' : 'Dano mental', `<label class="campo"><span>Dano recebido</span><input type="number" id="dano-qtd" min="0" value="${qtd}"></label>
    ${op.length ? `<div class="lista-hab" style="margin-top:8px">${op.map(([id, n]) => `<label class="check hab"><input type="checkbox" id="dano-${id}" ${id === 'rd' || id === 'rdmental' ? 'checked' : ''}><span>${esc(n)}</span></label>`).join('')}</div>` : ''}`,
    `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="aplicar-dano" data-rec="${recurso}">Aplicar</button>`);
}

// ---------- JANELA DE ESCOLHA genérica: opções clicáveis, cada uma explicada, em ordem alfabética ----------
let escolhaPendente = null; // { aoEscolher(valor) }
const alfa = (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt');
function janelaEscolha({ titulo, intro = '', opcoes, aoEscolher, ordenar = true, busca = true, largo = true }) {
  const lista = ordenar ? [...opcoes].sort(alfa) : opcoes;
  escolhaPendente = { aoEscolher };
  abrirModal(titulo, `${intro ? `<p class="apagado">${intro}</p>` : ''}${busca && lista.length > 8 ? '<input type="search" placeholder="Procurar…" data-filtro-modal autofocus aria-label="Procurar" style="margin:6px 0 10px">' : ''}
    <div class="cartoes">${lista.map((o, i) => `<button class="cartao ${o.classe || ''}" style="${o.estilo || ''}" data-acao="escolher-opcao" data-valor="${esc(o.valor)}" data-busca="${esc(semAcento(o.nome + ' ' + (o.desc || '')))}" ${o.desabilitado ? 'disabled' : ''}>
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
    aoEscolher: id => { const fx = ctx.fichaAtual(); fx.poderes.push({ id, escolha: '', via, uid: uid() }); ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`${PODER[id].nome} aprendido (${via}).`); } });
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

// Gasta PE (ou PD): primeiro os temporários. Devolve false se não tiver o bastante.
function gastar(ficha, d, custo) {
  const k = d.pd ? 'pd' : 'pe';
  const total = d.atual[k] + ficha.recursos.peTemp;
  if (custo > total) return false;
  const doTemp = Math.min(ficha.recursos.peTemp, custo);
  ficha.recursos.peTemp -= doTemp;
  ficha.recursos[k] = d.atual[k] - (custo - doTemp);
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
  return {
    'aba': el => { ctx.estado.ui.aba = el.dataset.aba; ctx.render(); },
    'rolar-pericia': el => {
      const d = derivar(f()); const p = d.PER[el.dataset.id];
      const ops = opcoesGasto(f(), d, { tipo: 'pericia', id: p.id });
      if (ops.length) return janelaGasto(f(), d, { tipo: 'pericia', id: p.id }, ops);
      if (p.bloqueada) ctx.avisar(`${p.nome} só pode ser usada se você for treinado.`);
      rolarTesteUI({ titulo: p.nome, quem: quem(), dados: p.dados, bonus: p.bonus }).then(() => consumirProximas(ctx));
    },
    'rolar-com-gasto': async el => {
      const ficha = f(), d = derivar(ficha), alvo = JSON.parse(el.dataset.alvo);
      const ops = opcoesGasto(ficha, d, alvo);
      let custo = 0, bonus = 0, dados = 0, danoExtra = 0, troca = null, atr = null, caos = 0, carga = false; const extras = [], danoDados = [], nomes = [];
      for (const o of ops) {
        if (o.id === 'ataque-especial') {
          const at = inteiro(document.getElementById('ae-ataque')?.value, 0, 8, 0), dn = inteiro(document.getElementById('ae-dano')?.value, 0, 8, 0);
          const k = Math.min(o.maxPassos, at + dn); if (!k) continue;
          custo += o.custoPorPassos(k); bonus += Math.min(at, k) * o.valorPasso; danoExtra += Math.max(0, k - at) * o.valorPasso; nomes.push(`${o.nome} ${k}×`);
        } else if (document.getElementById('gasto-' + o.id)?.checked) {
          custo += o.custo; bonus += o.bonus || 0; dados += o.dados || 0; nomes.push(o.nome.replace(/ \(.*\)$/, ''));
          if (o.dadoExtra) extras.push(o.dadoExtra); if (o.danoDados) danoDados.push(o.danoDados);
          if (o.troca) troca = o.troca; if (o.atr) atr = o.atr; if (o.caos) caos = o.caos; if (o.carga) carga = true;
        }
      }
      const k = d.pd ? 'PD' : 'PE';
      if (!gastar(ficha, d, custo)) return ctx.avisar(`${k} insuficiente (precisa de ${custo}).`, true);
      if (custo > Math.max(d.limitePE, 1)) ctx.avisar(`Atenção: ${custo} ${k} passa do limite por turno (${d.limitePE}).`);
      if (carga) ficha.cargasAntecipacao++;
      ctx.salvarFicha(ficha);
      for (const e of extras) { const r = rolar(e); bonus += r.total; nomes.push(`${e}=${r.total}`); }
      fecharModal();
      const sufixo = nomes.length ? ` (${nomes.join(', ')}${custo ? `; −${custo} ${k}` : ''})` : '';
      const pool = (dd, extra) => { const q = (dd.pior ? 2 - dd.qtd : dd.qtd) + extra; return q >= 1 ? { qtd: q, pior: false } : { qtd: 2 - q, pior: true }; };
      let item;
      if (alvo.tipo === 'pericia') {
        let p = d.PER[troca || alvo.id];
        let base = p.dados;
        if (atr) base = { qtd: Math.max(0, ficha.atributos[atr]), pior: false }, base = ficha.atributos[atr] >= 1 ? { qtd: ficha.atributos[atr] + p.ajuste, pior: false } : { qtd: 2, pior: true };
        item = await rolarTesteUI({ titulo: (troca ? `${d.PER[alvo.id].nome} → ${p.nome}` : p.nome) + sufixo, quem: quem(), dados: pool(base, dados), bonus: p.bonus + bonus });
      } else {
        const a = d.ataques[alvo.i];
        item = await rolarTesteUI({ titulo: `Ataque · ${a.nome}${sufixo}`, quem: quem(), dados: pool(a.dados, dados), bonus: a.bonus + bonus, margem: a.margem, mult: a.mult, tipo: 'ataque', formulaDano: a.formula + (danoExtra ? `+${danoExtra}` : '') + danoDados.map(x => '+' + x).join('') });
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
      const fim = () => consumirProximas(ctx);
      if (alvo.tipo === 'pericia') { const p = d.PER[alvo.id]; rolarTesteUI({ titulo: p.nome, quem: quem(), dados: p.dados, bonus: p.bonus }).then(fim); }
      else { const a = d.ataques[alvo.i]; rolarTesteUI({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, tipo: 'ataque', formulaDano: a.formula }).then(fim); }
    },
    // ----- Usar habilidade (gasta PE, liga efeito, rola o que precisar) -----
    'usar': async el => {
      const ficha = f(), d = derivar(ficha), nome = el.dataset.nome, u = USAVEIS[nome]; if (!u) return;
      const k = d.pd ? 'PD' : 'PE';
      let custo = typeof u.custo === 'number' ? u.custo : 0;
      if (u.custo === 'aliados' || u.custo === 'var') { const n = prompt(u.custo === 'aliados' ? `${nome}: quantos alvos/aliados?` : `${nome}: quantos ${k}?`, '1'); if (n == null) return; custo = inteiro(n, 0, 99, 0); }
      if (u.rolarCura) return janelaParamedico(ficha, d);
      if (custo && !gastar(ficha, d, custo)) return ctx.avisar(`${k} insuficiente (precisa de ${custo}).`, true);
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
        ficha.efeitos.push({ uid: uid(), nome, dura: u.dura, nota, ef: { ...(u.ef || {}), ...(u.arma ? { arma: true } : {}) } });
      }
      ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`${nome}${custo ? `: −${custo} ${k}` : ''}${u.ganhaPeTemp ? ` (+${ficha.recursos.peTemp} ${k} temporários)` : ''}${u.dura !== 'instante' ? ` · ativo ${DURA[u.dura]}` : ''}.`);
    },
    'desligar-efeito': el => { const ficha = f(); const e = ficha.efeitos[Number(el.dataset.i)]; ficha.efeitos.splice(Number(el.dataset.i), 1); salvar(); ctx.avisar(`${e?.nome || 'Efeito'} desligado.`); },
    'fim-cena': () => { const ficha = f(); ficha.efeitos = []; ficha.recursos.peTemp = 0; ficha.usosCena = {}; ficha.recursos.morrendo = 0; ficha.recursos.enlouquecendo = 0; salvar(); ctx.avisar('Fim da cena: efeitos desligados e PE temporários zerados.'); },
    'dormir-antecipar': () => { const ficha = f(); const perde = ficha.paranormais.some(p => p.id === 'antecipar-vitalidade' && p.afinidade) ? 2 : 1; ficha.cargasAntecipacao = Math.max(0, ficha.cargasAntecipacao - perde); salvar(); ctx.avisar(`Dormiu sem recuperar PV e perdeu ${perde} carga(s).`); },
    'paramedico': async () => {
      const ficha = f(), d0 = derivar(ficha), n = inteiro(document.getElementById('para-dados')?.value, 2, 5, 2), custo = 2 + (n - 2);
      if (!gastar(ficha, d0, custo)) return ctx.avisar('PE insuficiente.', true);
      ctx.salvarFicha(ficha); fecharModal(); ctx.render();
      const intBonus = ORIGEM[ficha.origem]?.id === 'agente-saude' ? `+${ficha.atributos.int}` : '';
      await rolarDanoUI({ titulo: `Paramédico (−${custo} PE)`, quem: quem(), formula: `${n}d10${intBonus}` });
    },
    // ----- Poderes paranormais -----
    'transcender': () => { const ficha = f(); const d0 = derivar(ficha); if (d0.transcenderes >= d0.limiteTranscender && !confirm('Você já usou todos os Transcender permitidos agora. Transcender mesmo assim?')) return; ficha.poderes.push({ id: 'transcender', escolha: '', uid: uid() }); ctx.salvarFicha(ficha); ctx.render(); janelaParanormal(ficha, derivar(ficha), 'transcender'); },
    'janela-paranormal': el => janelaParanormal(f(), derivar(f()), el.dataset.fonte || 'outro'),
    'add-paranormal': el => {
      const ficha = f(), def = PODER_PARANORMAL[el.dataset.id];
      let escolha = '';
      if (def.escolheElemento && !el.dataset.escolha) return janelaEscolha({ titulo: 'Resistir a Elemento', intro: 'Escolha o elemento: você recebe resistência 10 contra ele (20 com afinidade). Conta como poder desse elemento.',
        opcoes: ELEMENTOS_OPCOES.map(([v, n, x]) => ({ valor: n, nome: n, desc: x, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)' })),
        aoEscolher: n => acoesFicha(ctx)['add-paranormal']({ dataset: { ...el.dataset, escolha: n } }) });
      if (el.dataset.escolha) escolha = el.dataset.escolha;
      ficha.paranormais.push({ uid: uid(), id: def.id, escolha, afinidade: el.dataset.afinidade === '1', fonte: el.dataset.fonte || 'outro' });
      // marca a escolha no Transcender mais recente sem poder
      if (el.dataset.fonte === 'transcender') { const t = [...ficha.poderes].reverse().find(p => p.id === 'transcender' && !p.escolha); if (t) t.escolha = def.nome; }
      fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`${def.nome}${el.dataset.afinidade === '1' ? ' (afinidade)' : ''} adicionado.`);
      if (def.acao === 'aprender-ritual') { ctx.estado.ui.aba = 'rituais'; ctx.render(); ctx.avisar('Aprender Ritual: marque o ritual na lista do Grimório.'); }
      if (def.id === 'expansao-de-conhecimento') janelaOutraClasse(ctx, f(), 'Expansão de Conhecimento');
    },
    'remover-paranormal': el => { const ficha = f(); const p = ficha.paranormais[Number(el.dataset.i)]; if (!confirm(`Remover "${PODER_PARANORMAL[p.id].nome}"?`)) return; ficha.paranormais.splice(Number(el.dataset.i), 1); salvar(); },
    'ativo': el => { const ficha = f(); ficha.ativos[el.dataset.k] = !ficha.ativos[el.dataset.k]; salvar(); },
    'rolar-atributo': el => { const d = derivar(f()); const a = ATRIBUTOS.find(x => x.id === el.dataset.atr); const aj = d.ajusteDados[a.id] + d.ajusteDados.todos; const n = f().atributos[a.id] + aj; rolarTesteUI({ titulo: a.nome, quem: quem(), dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2 - n, pior: true }, bonus: 0 }); },
    'rolar-iniciativa': () => { const d = derivar(f()); rolarTesteUI({ titulo: 'Iniciativa', quem: quem(), dados: d.iniciativa.dados, bonus: d.iniciativa.bonus }); },
    'rolar-ataque': el => { const d0 = derivar(f()); const ops = opcoesGasto(f(), d0, { tipo: 'ataque', i: Number(el.dataset.i) }); if (ops.length) return janelaGasto(f(), d0, { tipo: 'ataque', i: Number(el.dataset.i) }, ops); const a = d0.ataques[Number(el.dataset.i)]; rolarTesteUI({ titulo: `Ataque · ${a.nome}`, quem: quem(), dados: a.dados, bonus: a.bonus, margem: a.margem, mult: a.mult, tipo: 'ataque', formulaDano: a.formula }); },
    'rolar-dano': el => { const a = derivar(f()).ataques[Number(el.dataset.i)]; rolarDanoUI({ titulo: `Dano · ${a.nome}`, quem: quem(), formula: a.formula }); },
    'rolar-ritual': el => { const i = Number(el.dataset.i), r = derivar(f()).rituais[i]; rolarDanoUI({ titulo: r.nome, quem: quem(), formula: r.formulaFinal || r.formula }); },
    'conjurar': el => janelaConjurar(f(), derivar(f()), Number(el.dataset.i)),
    'conjurar-confirmar': el => {
      const ficha = f(), d = derivar(ficha), i = Number(el.dataset.i), r = d.rituais[i], k = d.pd ? 'pd' : 'pe';
      let custo = r.custo + inteiro(document.getElementById('conj-extra')?.value, 0, 50, 0);
      document.querySelectorAll('[id^="conj-"][data-custo]').forEach(c => { if (c.checked) custo += Number(c.dataset.custo); });
      if (custo > d.limiteRitual) ctx.avisar(`Atenção: ${custo} passa do limite por turno (${d.limiteRitual}).`);
      if (document.getElementById('conj-flagelo')?.checked) {
        const pv = custo * 2; if (d.atual.pv <= pv) return ctx.avisar('PV insuficientes para pagar com o Flagelo.', true);
        ficha.recursos.pv = d.atual.pv - pv; fecharModal(); salvar(); return ctx.avisar(`${r.nome} conjurado pagando ${pv} PV (Poder do Flagelo).`);
      }
      if (!gastar(ficha, d, custo)) return ctx.avisar(`${k.toUpperCase()} insuficiente (precisa de ${custo}).`, true);
      fecharModal(); salvar(); ctx.avisar(`${r.nome} conjurado: −${custo} ${k.toUpperCase()} · DT ${r.dt}.`);
    },
    'aplicar-dano': el => {
      const ficha = f(), d = derivar(ficha), rec = el.dataset.rec; let q = inteiro(document.getElementById('dano-qtd')?.value, 0, 99999, 0);
      const marcado = id => document.getElementById('dano-' + id)?.checked; const notas = [];
      if (marcado('astronauta')) { const c = 1 + (ficha.usosCena.astronauta || 0); if (!gastar(ficha, d, c)) return ctx.avisar('PE insuficiente.', true); ficha.usosCena.astronauta = (ficha.usosCena.astronauta || 0) + 1; q = Math.max(0, q - 5); notas.push('Acostumado ao Extremo −5'); }
      if (marcado('rd')) { q = Math.max(0, q - d.rd); notas.push(`RD ${d.rd}`); }
      if (marcado('rdmental')) { q = Math.max(0, q - d.rdMental); notas.push(`RD mental ${d.rdMental}`); }
      if (marcado('bloqueio')) { q = Math.max(0, q - d.bloqueio); notas.push(`bloqueio ${d.bloqueio}`); }
      for (const id of ['duro', 'abracar']) if (marcado(id)) { if (!gastar(ficha, derivar(ficha), 2)) return ctx.avisar('PE insuficiente.', true); q = Math.floor(q / 2); notas.push(id === 'duro' ? 'Duro de Matar ½' : 'Abraçar a Dor ½'); }
      const atual = rec === 'pv' ? d.atual.pv : rec === 'san' ? d.atual.san : d.atual.pd;
      let novo = atual - q;
      if (rec === 'pv' && novo <= 0 && marcado('escapar')) { novo = 1; ficha.usosCena.escaparMorte = 1; notas.push('Escapar da Morte'); }
      ficha.recursos[rec] = novo; fecharModal(); salvar();
      if (rec === 'pv' && q > 0) { document.body.classList.remove('levou-dano'); void document.body.offsetWidth; document.body.classList.add('levou-dano'); setTimeout(() => document.body.classList.remove('levou-dano'), 750); }
      ctx.avisar(`Dano: ${q}${notas.length ? ` (${notas.join(', ')})` : ''}.`);
    },
    'gladiador': () => { const ficha = f(), d = derivar(ficha); const ganho = ficha.usosCena.gladiador || 0; if (ganho >= d.limitePE) return ctx.avisar('Limite de PE temporários do Gladiador nesta cena atingido.'); const g = Math.min(2, d.limitePE - ganho); ficha.recursos.peTemp += g; ficha.usosCena.gladiador = ganho + g; salvar(); ctx.avisar(`Gladiador Paranormal: +${g} PE temporários.`); },
    'rec-mudar': el => {
      const ficha = f(), d = derivar(ficha), k = el.dataset.rec, inp = document.getElementById('qtd-' + k);
      const q = inteiro(inp?.value, 0, 9999, 0); if (!q) { inp?.focus(); return; }
      if (Number(el.dataset.sinal) < 0 && (k === 'pv' || k === 'san' || (k === 'pd' && d.rdMental))) {
        const temReducao = (k === 'pv' && (d.rd || d.bloqueio != null || ['tropa', 'flagelador'].includes(ficha.trilha) || ficha.paranormais.some(p => p.id === 'escapar-da-morte'))) || ((k === 'san' || k === 'pd') && d.rdMental) || ORIGEM[ficha.origem]?.id === 'astronauta';
        if (temReducao) return janelaDano(ficha, d, q, k);
      }
      const max = { pv: d.pv, pe: d.pe, san: d.san, pd: d.pdMax }[k];
      const novo = d.atual[k] + q * Number(el.dataset.sinal);
      ficha.recursos[k] = Math.min(max, novo);
      if (k === 'pv' && Number(el.dataset.sinal) < 0) { document.body.classList.remove('levou-dano'); void document.body.offsetWidth; document.body.classList.add('levou-dano'); setTimeout(() => document.body.classList.remove('levou-dano'), 750); }
      if (k === 'pv' && ficha.recursos.pv > 0) ficha.recursos.morrendo = 0;
      if (k === 'san' && ficha.recursos.san > 0) ficha.recursos.enlouquecendo = 0;
      salvar();
    },
    'rec-cheio': el => { const ficha = f(); ficha.recursos[el.dataset.rec] = null; if (el.dataset.rec === 'pv') ficha.recursos.morrendo = 0; salvar(); },
    'contador': el => { const ficha = f(); ficha.recursos[el.dataset.c] = Math.min(3, ficha.recursos[el.dataset.c] + 1); salvar(); if (ficha.recursos[el.dataset.c] >= 3) ctx.avisar(el.dataset.c === 'morrendo' ? 'Três turnos morrendo: o agente morreu.' : 'Três turnos enlouquecendo: o agente ficou insano.', true); },
    'condicao': el => { const ficha = f(); const id = el.dataset.id; ficha.condicoes = ficha.condicoes.includes(id) ? ficha.condicoes.filter(c => c !== id) : [...ficha.condicoes, id]; salvar(); },
    'rolar-ferimento': () => { const ficha = f(); const n = d(6); const atr = FERIMENTOS[n - 1]; if (atr) { ficha.ferimentos.push(atr); salvar(); } ctx.avisar(`1d6 = ${n}: ${atr ? 'ferimento em ' + ATRIBUTOS.find(a => a.id === atr).nome : 'ferimento superficial (nenhum atributo)'}.`); },
    'remover': el => { const ficha = f(); const lista = ficha[el.dataset.lista]; const i = Number(el.dataset.i); const nome = lista[i]?.nome || ''; if (['poderes', 'protecoes', 'habilidadesProprias', 'itens'].includes(el.dataset.lista) && nome && !confirm(`Remover "${nome}"?`)) return; lista.splice(i, 1); salvar(); },
    'limites-padrao': () => { const ficha = f(); ficha.limitesItens = null; salvar(); },
    'exposicao': el => { const ficha = f(); const antes = ficha.nexExposicao; ficha.nexExposicao = Math.min(99, antes + Number(el.dataset.nex)); salvar(); ctx.avisar(`NEX ${antes}% → ${ficha.nexExposicao}%.`); },
    'subir-nivel': () => {
      const ficha = f();
      if (ehSobrevivente(ficha)) { if (ficha.estagio >= 5) return ctx.avisar('Estágio máximo. Se a Ordem o recrutar, crie a versão com a nova classe (Treinamento Especial).'); ficha.estagio++; }
      else if (temOpcional(ficha, 'patentes')) { if (ficha.patenteManual) { if (ficha.patenteManual >= 5) return ctx.avisar('Já é agente de elite.'); ficha.patenteManual++; } else { const p = PATENTES.find(x => x.pp > ficha.pp); if (!p) return ctx.avisar('Já é agente de elite.'); ficha.pp = p.pp; } }
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
      abrirModal('Adicionar arma', `<div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${ARMAS.map((a, i) => [a, i]).sort((x, y) => x[0].nome.localeCompare(y[0].nome, 'pt')).map(([a, i]) => `<button class="cartao" data-acao="add-arma-catalogo" data-i="${i}"><b>${esc(a.nome)}</b><small class="dossie-txt">${a.dano} ${TIPOS_DANO[a.tipo] || ''} · ${a.margem < 20 ? a.margem + '/' : ''}×${a.mult} · cat. ${cat(a.categoria)}</small><small>${a.prof === 'simples' ? 'Simples' : a.prof === 'taticas' ? 'Tática' : 'Pesada'} · ${a.uso === 'corpo' ? 'corpo a corpo' : a.uso === 'fogo' ? 'arma de fogo' : 'disparo'}${(a.prof === 'taticas' && !prof.taticas) || (a.prof === 'pesadas' && !prof.pesadas) ? ' · <span style="color:var(--perigo)">sem proficiência</span>' : ''}</small></button>`).join('')}
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
        ${c('alcance', 'Alcance')}${s('tipo', 'Tipo de dano', Object.entries(TIPOS_DANO))}${c('municao', 'Munição')}
        ${f().trilha === 'aniquilador' ? `<label class="check"><input type="checkbox" data-modal-arma-check="favorita" ${a.favorita ? 'checked' : ''}><span>Arma favorita (Aniquilador)</span></label>` : ''}
        ${ORIGEM[f().origem]?.id === 'operario' ? `<label class="check"><input type="checkbox" data-modal-arma-check="ferramenta" ${a.ferramenta ? 'checked' : ''}><span>Ferramenta de Trabalho (Operário): +1 ataque, dano e margem</span></label>` : ''}
        ${f().trilha === 'atirador' ? `<label class="check"><input type="checkbox" data-modal-arma-check="balasLongas" ${a.balasLongas ? 'checked' : ''}><span>Usa balas longas (Mira de Elite: +Intelecto no dano)</span></label>` : ''}${c('nota', 'Anotação (modificações, maldições…)')}</div>`,
        `<button class="btn perigo" data-acao="remover-arma" data-i="${i}">Remover</button><span class="espaco"></span><button class="btn sangue" data-acao="salvar-arma" data-i="${i}">Salvar</button>`, true);
    },
    'salvar-arma': el => {
      const ficha = f(), i = Number(el.dataset.i), a = { ...ficha.armas[i] };
      document.querySelectorAll('[data-modal-arma]').forEach(inp => { a[inp.dataset.modalArma] = inp.type === 'number' ? Number(inp.value) : inp.value; });
      document.querySelectorAll('[data-modal-arma-check]').forEach(inp => { a[inp.dataset.modalArmaCheck] = inp.checked; });
      a.categoria = Number(a.categoria);
      ficha.armas[i] = normalizar({ ...ficha, armas: [a] }).armas[0]; fecharModal(); salvar();
    },
    'remover-arma': el => { const ficha = f(); if (!confirm('Remover esta arma?')) return; ficha.armas.splice(Number(el.dataset.i), 1); fecharModal(); salvar(); },
    'add-protecao': () => abrirModal('Adicionar proteção', `<div class="cartoes">${PROTECOES.map((p, i) => `<button class="cartao" data-acao="add-protecao-catalogo" data-i="${i}"><b>${esc(p.nome)}</b><small>Defesa +${p.defesa}${p.rd ? `, RD ${p.rd} (balístico, corte, impacto, perfuração)` : ''}${p.penalidade ? `, −${p.penalidade} nas perícias de carga` : ''} · cat. ${cat(p.categoria)} · ${p.espacos} esp.</small></button>`).join('')}</div>`),
    'add-protecao-catalogo': el => { const ficha = f(); const p = PROTECOES[Number(el.dataset.i)]; ficha.protecoes.push({ ...p, rd: p.rd || 0, vestida: true, uid: uid() }); fecharModal(); salvar(); },
    'add-item': () => { const ficha = f(); ficha.itens.push({ uid: uid(), nome: 'Novo item', categoria: 0, espacos: 1, qtd: 1, nota: '' }); salvar(); },
    'add-item-lista': () => abrirModal('Adicionar item', `<div class="cartoes">${ITENS_GERAIS.map((it, i) => [it, i]).sort((x, y) => x[0].nome.localeCompare(y[0].nome, 'pt')).map(([it, i]) => `<button class="cartao" data-acao="add-item-catalogo" data-i="${i}"><b>${esc(it.nome)}</b><small>cat. ${cat(it.categoria)} · ${it.espacos} esp.</small></button>`).join('')}</div>`),
    'add-item-catalogo': el => { const ficha = f(); const it = ITENS_GERAIS[Number(el.dataset.i)]; ficha.itens.push({ ...it, qtd: 1, nota: '', uid: uid() }); fecharModal(); salvar(); },
    'add-propria': () => { const ficha = f(); ficha.habilidadesProprias.push({ uid: uid(), nome: 'Nova habilidade', resumo: '', custo: '' }); salvar(); },
    'escolher-poder': () => {
      const ficha = f(), d = derivar(ficha);
      const lista = poderesParaFicha(ficha).sort(alfa);
      const grupos = [['Classe', p => p.classe === ficha.classe], ['Todas as classes', p => p.classe === 'todas'], ['Gerais (SaH)', p => p.classe === 'geral' || (p.classe !== ficha.classe && p.classe !== 'todas')]];
      abrirModal('Escolher poder', `<input type="search" placeholder="Procurar poder…" data-filtro-modal autofocus aria-label="Procurar poder" style="margin-bottom:10px">
        ${grupos.map(([nome, fn]) => { const ps = lista.filter(fn); return ps.length ? `<h3 class="titulo-vermelho">${nome}</h3><div class="cartoes">${ps.map(p => { const tem = ficha.poderes.some(x => x.id === p.id); const ok = cumpreRequisito(ficha, d, p.req); return `<button class="cartao" data-acao="add-poder" data-id="${p.id}" data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${tem && !p.repete ? 'disabled' : ''}><span class="linha"><b>${esc(p.nome)}</b><span class="espaco"></span>${fonteTag(p.fonte)}</span>${p.req ? `<small style="color:${ok ? 'var(--ok)' : 'var(--perigo)'}">Pré: ${esc(p.req)}</small>` : ''}<small>${esc(p.resumo)}</small></button>`; }).join('')}</div>` : ''; }).join('')}`, '', true);
    },
    'add-poder': el => {
      const ficha = f(), p = PODER[el.dataset.id];
      if (p.id === 'transcender') { fecharModal(); return acoesFicha(ctx)['transcender'](); }
      escolhaDoPoder(ctx, ficha, p, escolha => {
        const fx = f(); fx.poderes.push({ id: p.id, escolha: escolha || '', uid: uid() });
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
    'treinamento-especial': () => janelaEscolha({ titulo: 'Treinamento Especial', intro: 'Quando a história levar o sobrevivente para a Ordem, ele vira NEX 5% de uma classe. Isto cria uma CÓPIA da ficha na classe escolhida (a original fica guardada). Ajuste os PV/PE extras em "Ajustes manuais" se o mestre pedir.',
      opcoes: ['combatente', 'especialista', 'ocultista'].map(c => ({ valor: c, nome: CLASSES[c].nome, desc: TREINAMENTO_ESPECIAL[c] })),
      aoEscolher: c => { const fx = f(); const nova = normalizar({ ...structuredClone(fx), id: uid(), classe: c, trilha: '', nex: 5, nivel: 1, nome: fx.nome, habilidadesProprias: [...fx.habilidadesProprias, { nome: 'Passado de Sobrevivente', resumo: `Estágio ${fx.estagio}, trilha ${TRILHA[fx.trilha]?.nome || '—'}. Mantém as habilidades já recebidas.` }], recursos: {} }); ctx.adicionarFicha(nova); fecharModal(); location.hash = '#/agente/' + nova.id; ctx.avisar(`Ficha de ${CLASSES[c].nome} criada a partir do sobrevivente.`); } }),
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
      if (el.checked) {
        ficha.rituais.push({ uid: uid(), nome: r.nome, elemento: r.elemento === 'variavel' ? 'variavel' : r.elemento, circulo: r.circulo, efeito: r.resumo });
        if (nexSeparado(ficha) && ficha.classe !== 'sobrevivente') { const antes = ficha.nexExposicao; ficha.nexExposicao = Math.min(99, antes + r.circulo); ctx.avisar(`Aprender ${r.nome} soma ${r.circulo}% de NEX: ${antes}% → ${ficha.nexExposicao}%.`); }
      }
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
