// Peças comuns da ficha: textos dos livros, cartões de habilidade, janelas de escolha, gasto de PE e as ferramentas das ações.

import { registrarMaldições, cobrarMaldição } from './amaldicoados.js?v=0.47';
import { perfilRitual, temPeso, derivar, temOpcional } from './regras.js?v=0.47';
import { sofrerDano, recuperar, rolar } from './combate.js?v=0.47';
import { PERICIA, ELEMENTOS, USAVEIS } from './catalogo.js?v=0.47';
import { esc, romano, semAcento } from './util.js?v=0.47';
import { estado } from './ficha-estado.js?v=0.47';
import { rolarTesteUI, abrirModal } from './rolagem.js?v=0.47';
import { ITENS_ABERTOS } from './ficha-inventario.js?v=0.47';

// fichaUI.js — as telas da ficha do agente e as ações delas.

// Textos transcritos dos livros fornecidos pelo usuário, para consulta pessoal. Os não localizados permanecem pendentes.
export let TEXTOS = {};
export let FONTES_SAH = {rituais:{},habilidades:{}};
export async function carregarTextos() {
  try { const r = await fetch('dados/textos.json?v=0.47', { cache: 'no-cache' }); if (r.ok) TEXTOS = await r.json(); } catch {}
  try { const r = await fetch('dados/sah_referencias_verificadas.json?v=0.47', {cache:'no-cache'}); if (r.ok) FONTES_SAH = await r.json(); } catch {}
  // Os textos do Sobrevivendo ao Horror foram conferidos com o PDF e estão em dados/textos.json (v0.23).
}
// Textos do Sobrevivendo ao Horror tirados do OCR (não revisados): aparecem com aviso, separados dos textos conferidos.
export let OCR_SAH = { rituais: {}, habilidades: {} };
export const textoOcr = (tipo, nome) => { const o = OCR_SAH?.[tipo]?.[nome]; return o && typeof o.texto === 'string' && o.texto ? o : null; };
export function blocoOcr(o) {
  return `<div class="texto-completo texto-ocr">${esc(o.texto)}</div>
    <p class="aviso-ocr">Texto do OCR do <i>Sobrevivendo ao Horror</i> (PDF p. ${o.pagina}): pode ter erros de leitura e “[…]” marca trecho ilegível. Confira no livro.</p>
    <a class="fonte-sah-link" href="#/acervo/sah/${o.pagina}">Abrir a página ${o.pagina} do livro digitalizado</a>`;
}
export function abrirPaginaSah(tipo,nome) {
  const pagina = FONTES_SAH?.[tipo]?.[nome]?.pagina;
  return pagina ? `<a class="fonte-sah-link" href="#/acervo/sah/${pagina}" title="Abrir transcrição digitalizada de Sobrevivendo ao Horror · página ${pagina}">Consultar fonte · Sobrevivendo ao Horror, PDF p. ${pagina}</a>` : '';
}
export const textoCompleto = (tipo, nome) => { const t = TEXTOS?.[tipo]?.[nome]; return typeof t === 'string' ? t.slice(0, 20000) : ''; };
// Ícone de d20 (desenho simples, original)
export const ICONE_D20 = '<svg class="icone-d20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8 21.6 7.2v9.6L12 22.2 2.4 16.8V7.2Z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6.3 17.6 15.8H6.4Z M12 1.8V6.3 M2.4 7.2l4 8.6 M21.6 7.2l-4 8.6 M6.4 15.8 12 22.2l5.6-6.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
export const ABAS = [['agente', 'Agente'], ['combate', 'Combate'], ['rolagens', 'Rolagens'], ['macros', 'Macros'], ['habilidades', 'Habilidades'], ['poderes', 'Poderes'], ['rituais', 'Rituais'], ['inventario', 'Inventário'], ['notas', 'Notas']];
export const nomesElementos = r => (r.elementos?.length ? r.elementos : [r.elemento]).map(id => ELEM[id]?.nome || id).join(' + ');
export const alvoDeFicha = (ctx, id) => ctx.fichas().find(f => f.id === id);
export const opcoesAlvos = (ctx, atual) => ctx.fichas().map(f =>
  `<option value="${esc(f.id)}" ${f.id === atual.id ? 'selected' : ''}>${esc(f.nome || 'Agente')}</option>`).join('');
export const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
export const fonteTag = f => f === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : String(f).startsWith('AS') ? `<span class="etiqueta">${esc(f)}</span>` : '';
export const cat = n => (n ? romano(n) : '0');
export function avisosDeRegra(d) {
  return d.avisos.length ? `<details class="avisos-ficha" open><summary class="ui">⚠ ${d.avisos.length} aviso(s) de regra</summary><ul>${d.avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul></details>` : '';
}
// Painel de EFEITOS ATIVOS: tudo que dura a cena/rodada/próxima rolagem. O jogador desliga quando quiser.
export const DURA = { cena: 'até o fim da cena', rodada: 'até o seu próximo turno', proxima: 'só na próxima rolagem' };
export function descreverEf(ef, f) {
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
// Botão "Usar" de uma habilidade com custo (catálogo USAVEIS)
export const BOTOES_JANELA = { 'Multifacetado': ['multifacetado', 'Usar (5 SAN)'], 'A Força do Saber': ['forca-saber', 'Escolher perícia'] };
export const HABILIDADES_MANUAIS = new Set([
  'Abraçar a Dor', 'Acostumado ao Extremo', 'Anular Ritual', 'Ataque de Oportunidade',
  'Ataque Extra', 'Aura de Pavor', 'Brecha na Guarda', 'Cai Dentro', 'Determinação Inquestionável',
  'Disparo Impactante', 'Duro de Matar', 'Equipe de Trauma', 'Escapar da Morte', 'Estrategista',
  'Força Opressora', 'Inspirar Confiança', 'Oficial Comandante', 'Paramédico', 'Reanimação',
  'Remendão', 'Revidar', 'Só Mais um Passo', 'Surto de Adrenalina',
]);
export function botaoUsar(nome, d) {
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
export function botoesDados(nome, texto) {
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
export function formulaDaForma(r, cat, forma) {
  const { nome, formula: base, formulaFinal: final } = r;
  const escolhida = forma === 'basica' ? (base && (r.proprio || base !== (cat.dados || '')) ? base : '') : r.formulasAvancadas?.[forma];
  if (escolhida) return escolhida + (r.bonusFormula ? `+${r.bonusFormula}` : '');
  if (nome === 'Capturar Momento' || (forma !== 'basica' && r.proprio && !cat[forma])) return '';
  let f = final || base || '';
  const perfil = perfilRitual(cat.id, forma);
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
export function hab(nome, resumo, meta = '', chave = '', f = null, trancada = false) {
  const nota = chave && f ? f.notasHabilidade[chave] || '' : '';
  const base = String(nome).replace(/ \(.*\)$/, '');
  const usar = !trancada && estado.dAtual ? botaoUsar(base, estado.dAtual) : '';
  const dadosBtn = !trancada ? botoesDados(base, resumo + ' ' + (textoCompleto('habilidades', base) || textoOcr('habilidades', base)?.texto || '')) : '';
  const completo = textoCompleto('habilidades', base);
  const ocr = !completo ? textoOcr('habilidades', base) : null;
  const pendente = !completo && Object.hasOwn(TEXTOS?.habilidades || {},base);
  return `<div class="hab ${trancada ? 'trancada' : ''}"><span class="meta">${meta}${usar}${dadosBtn}</span><b>${esc(nome)}</b>${completo ? `<div class="texto-completo">${esc(completo)}</div>` : ocr ? blocoOcr(ocr) : pendente ? `<p class="apagado">Descrição ainda não conferida palavra por palavra. O livro digitalizado pode conter erros de OCR.</p>${abrirPaginaSah('habilidades',base)}` : (resumo ? `<p>${esc(resumo)}</p>` : '')}
    ${chave && !trancada ? `<details${nota ? ' open' : ''}><summary class="apagado" style="cursor:pointer;font-size:.85rem">Anotação</summary><textarea data-campo="notasHabilidade.${esc(chave)}" id="nota-${esc(chave)}" placeholder="Texto do livro, custo, detalhes…">${esc(nota)}</textarea></details>` : ''}</div>`;
}
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('toggle', ev => {
  const uidItem = ev.target?.dataset?.itemUid;
  if (uidItem) ev.target.open ? ITENS_ABERTOS.add(uidItem) : ITENS_ABERTOS.delete(uidItem);
}, true);
// ---------- Janela "Gastar PE" antes de rolar (passo 9) ----------
export function janelaGasto(f, d, alvo, ops) {
  const k = d.pd ? 'PD' : 'PE';
  const titulo = alvo.tipo === 'pericia' ? d.PER[alvo.id].nome : `Ataque · ${d.ataques[alvo.i].nome}`;
  const linhas = ops.map(o => o.id === 'ataque-especial'
    ? `<div class="hab"><b>${esc(o.nome)}</b> <small class="apagado">até ${o.maxPassos}× +${o.valorPasso} · custo: ${Array.from({ length: o.maxPassos }, (_, j) => `${j + 1}× = ${o.custoPorPassos(j + 1)} ${k}`).join(', ')}</small>
        <div class="grade c2" style="margin-top:6px"><label class="campo"><span>+${o.valorPasso} no ATAQUE (vezes)</span><input type="number" id="ae-ataque" min="0" max="${o.maxPassos}" value="0"></label><label class="campo"><span>+${o.valorPasso} no DANO (vezes)</span><input type="number" id="ae-dano" min="0" max="${o.maxPassos}" value="0"></label></div>
        ${o.nota ? `<p>${esc(o.nota)}</p>` : ''}</div>`
    : `<label class="check hab"><input type="checkbox" id="gasto-${o.id}"><span><b>${esc(o.nome)}</b> — ${o.custo} ${k}: ${o.bonus ? `+${o.bonus}` : ''}${o.dados ? `+${o.dados}d20` : ''}${o.dadoExtra ? `+${o.dadoExtra}` : ''}${o.margem ? `+${o.margem} na margem` : ''}${o.rerrolar ? 'rolar de novo' : ''}${o.furtivoD8 ? 'furtivo em d8' : ''}${o.nota ? ` <small class="apagado">(${esc(o.nota)})</small>` : ''}</span></label>`).join('');
  const dadosAlvo = JSON.stringify(alvo).replace(/"/g, '&quot;');
  abrirModal(titulo, `<p class="apagado">Você tem <b>${d.atual[d.pd ? 'pd' : 'pe']} ${k}</b> (limite ${d.limitePE} por turno). Marque o que quer gastar nesta rolagem:</p><div class="lista-hab">${linhas}</div>`,
    `<button class="btn fantasma" data-acao="rolar-sem-gasto" data-alvo="${dadosAlvo}">Rolar sem gastar</button><button class="btn sangue" data-acao="rolar-com-gasto" data-alvo="${dadosAlvo}">Gastar e rolar</button>`);
}
// ---------- JANELA DE ESCOLHA genérica: opções clicáveis, cada uma explicada, em ordem alfabética ----------
export const alfa = (a, b) => String(a.nome).localeCompare(String(b.nome), 'pt');
export function janelaEscolha({ titulo, intro = '', opcoes, aoEscolher, ordenar = true, busca = true, largo = true }) {
  const lista = ordenar ? [...opcoes].sort(alfa) : opcoes;
  estado.escolhaPendente = { aoEscolher };
  abrirModal(titulo, `${intro ? `<p class="apagado">${intro}</p>` : ''}${busca && lista.length > 8 ? '<input type="search" placeholder="Procurar…" data-filtro-modal autofocus aria-label="Procurar" style="margin:6px 0 10px">' : ''}
    <div class="cartoes">${lista.map((o, i) => `<button class="cartao ${o.classe || ''}" style="${o.estilo || ''}" data-acao="escolher-opcao" data-valor="${esc(o.valor)}" data-busca="${esc(semAcento(o.nome + ' ' + (o.desc || '')))}" ${o.desabilitado || o.reqOk === false ? 'disabled' : ''}>
      <span class="linha"><b>${esc(o.nome)}</b><span class="espaco"></span>${o.tag || ''}</span>${o.req ? `<small style="color:${o.reqOk === false ? 'var(--perigo)' : 'var(--ok)'}">Pré: ${esc(o.req)}</small>` : ''}<small>${esc(o.desc || '')}</small>${o.obs ? `<small class="apagado">${esc(o.obs)}</small>` : ''}</button>`).join('')}</div>`, '', largo);
}
// Janela de várias escolhas (caixinhas) — ex.: Treinamento em Perícia
export function janelaMultipla({ titulo, intro, opcoes, max, aoConfirmar }) {
  estado.escolhaPendente = { aoConfirmar, max };
  abrirModal(titulo, `<p class="apagado">${intro}</p><div class="lista-hab">${[...opcoes].sort(alfa).map(o => `<label class="check hab"><input type="checkbox" data-multi="${esc(o.valor)}" ${o.desabilitado ? 'disabled' : ''}><span><b>${esc(o.nome)}</b> <small class="apagado">${esc(o.desc || '')}</small></span></label>`).join('')}</div>`,
    `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="confirmar-multipla">Confirmar</button>`);
}
export const ELEMENTOS_OPCOES = [
  ['conhecimento', 'Conhecimento', 'Mente, informação, sigilos e verdades proibidas.'], ['energia', 'Energia', 'Caos, eletricidade, sorte e mudança.'],
  ['morte', 'Morte', 'Tempo, decadência, lodo e o fim das coisas.'], ['sangue', 'Sangue', 'Corpo, dor, emoção e fome.'],
];
// Gasta PE (ou PD): primeiro os temporários. Devolve false se não tiver o bastante.
// Desconta PE/PD (temporários primeiro). O limite por turno NÃO bloqueia: o site só conta o gasto do turno e
// mostra em vermelho quando passa do limite (não há botão de cena/turno sempre à mão para zerar a conta).
// rotulo: nome da habilidade, ou lista [[nome, custo], …] quando vários gastos saem juntos (o resto vai como "Condição/outros")
export function gastar(ficha, d, custo, limite = d.limiteAcao, minimoDaAcao = custo, rotulo = 'Outros gastos') { // eslint-disable-line no-unused-vars
  if (!custo) return true;
  const k = d.pd ? 'pd' : 'pe';
  const total = d.atual[k] + ficha.recursos.peTemp;
  if (custo > total) return false;
  const doTemp = Math.min(ficha.recursos.peTemp, custo);
  ficha.recursos.peTemp -= doTemp;
  ficha.recursos[k] = d.atual[k] - (custo - doTemp);
  ficha.gastoTurno += custo;
  registrarGasto(ficha, rotulo, custo);
  return true;
}
export function registrarGasto(ficha, rotulo, custo) {
  const partes = Array.isArray(rotulo) ? rotulo.filter(([, c]) => c > 0) : [[rotulo || 'Outros gastos', custo]];
  const resto = custo - partes.reduce((s, [, c]) => s + c, 0);
  if (resto > 0) partes.push([d0Nome(ficha), resto]);
  ficha.gastosPE = [...(ficha.gastosPE || []), ...partes.map(([nome, c]) => ({ nome: String(nome).slice(0, 60), custo: c, turno: ficha.numTurno || 0, cena: ficha.numCena || 0 }))].slice(-300);
}
export const d0Nome = ficha => (derivar(ficha).custoCondicao ? 'Condição (custo extra)' : 'Outros gastos');
// Depois de qualquer rolagem, efeitos "só na próxima rolagem" se desligam sozinhos
export function consumirProximas(ctx) {
  const ficha = ctx.fichaAtual(); if (!ficha) return;
  const antes = ficha.efeitos.length;
  ficha.efeitos = ficha.efeitos.filter(e => e.dura !== 'proxima');
  if (ficha.efeitos.length !== antes) { ctx.salvarFicha(ficha); ctx.render(); }
}
// Ferramentas que as ações de todas as abas usam (antes ficavam dentro de acoesFicha)
export function ferramentasFicha(ctx) {
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
  return { f, salvar, quem, cobrar, testar, mudarPv, ataqueValido, consumirDisparo, danoDaIdade };
}
