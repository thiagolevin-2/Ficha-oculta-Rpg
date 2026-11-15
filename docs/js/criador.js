// criador.js — criação de agente em passos.
// PASSO 0 (pedido do projeto): escolher as regras ANTES de criar a ficha — Regras Padrão ou Sobrevivendo ao Horror.
import { MODOS, OPCIONAIS, ATRIBUTOS, CRIACAO_ATRIBUTOS, CLASSES, ORIGENS, ORIGEM, PERICIAS, PERICIA, NEX, TREINAMENTO_ESPECIAL } from './catalogo.js?v=0.11';
import { novaFicha, normalizar, derivar } from './regras.js?v=0.11';
import { esc, semAcento, sigilo, imagemOpcional, inteiro } from './util.js?v=0.11';

export const PASSOS = [
  ['modo', 'Regras'], ['conceito', 'Conceito'], ['classe', 'Classe'], ['atributos', 'Atributos'], ['origem', 'Origem'], ['pericias', 'Perícias'], ['revisao', 'Revisão'],
];

export function novoRascunho() {
  return { passo: 0, modo: '', opcionais: { determinacao: false, nivelExp: false, patentes: false, ferimentos: false, progressaoNex: false }, ficha: novaFicha('padrao'), fixas: {}, livres: [], origemLivres: ['', ''], filtro: '' };
}

const fonteTag = f => f === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : '<span class="etiqueta lr">Livro</span>';

// ---------- Cálculo das perícias treinadas no criador ----------
export function periciasDoRascunho(r) {
  const f = r.ficha, cls = CLASSES[f.classe], o = ORIGEM[f.origem];
  const daOrigem = o ? o.pericias.map((p, i) => (p === '*' ? r.origemLivres[i] : p)).filter(Boolean) : [];
  const daClasse = cls.pericias.fixas.map((grupo, i) => (grupo.length === 1 ? grupo[0] : r.fixas[i])).filter(Boolean);
  const repetidas = daClasse.filter(p => daOrigem.includes(p)).length;
  const qtdLivres = Math.max(0, cls.pericias.livres + f.atributos.int + repetidas);
  const base = new Set([...daOrigem, ...daClasse]);
  const livres = r.livres.filter(p => !base.has(p)).slice(0, qtdLivres);
  return { daOrigem, daClasse, livres, qtdLivres, todas: new Set([...base, ...livres]), repetidas };
}

function aplicarNaFicha(r) {
  const f = r.ficha;
  f.modo = r.modo || 'padrao';
  f.opcionais = { ...r.opcionais };
  const { todas } = periciasDoRascunho(r);
  f.pericias = Object.fromEntries([...todas].map(p => [p, 1]));
  if (f.classe === 'sobrevivente') { f.estagio = f.estagio || 1; }
  return normalizar(f);
}

// ---------- Validação de cada passo ----------
export function problemasDoPasso(r, indice = r.passo) {
  const f = r.ficha;
  const p = [];
  const passo = PASSOS[indice][0];
  if (passo === 'modo' && !r.modo) p.push('Escolha as regras.');
  if (passo === 'conceito' && !f.nome.trim()) p.push('Dê um nome ao agente.');
  if (passo === 'atributos') {
    const pontos = f.classe === 'sobrevivente' ? CRIACAO_ATRIBUTOS.pontosSobrevivente : CRIACAO_ATRIBUTOS.pontos;
    const usados = ATRIBUTOS.reduce((s, a) => s + f.atributos[a.id] - 1, 0);
    const zeros = ATRIBUTOS.filter(a => f.atributos[a.id] === 0).length;
    if (zeros > 1) p.push('Só um atributo pode ficar em 0.');
    if (usados > pontos) p.push(`Você usou ${usados} pontos; o máximo é ${pontos}${zeros ? ' (já contando o +1 do atributo em 0)' : ''}.`);
    if (usados < pontos) p.push(`Ainda sobram ${pontos - usados} ponto(s) para distribuir.`);
  }
  if (passo === 'origem' && !f.origem) p.push('Escolha uma origem.');
  if (passo === 'origem' && f.origem === 'propria' && !f.origemPropria.nome.trim()) p.push('Dê um nome para a sua origem.');
  if (passo === 'origem' && ORIGEM[f.origem]) ORIGEM[f.origem].pericias.forEach((x, i) => { if (x === '*' && !r.origemLivres[i]) p.push('Escolha as perícias da origem.'); });
  if (passo === 'pericias') {
    const cls = CLASSES[f.classe];
    cls.pericias.fixas.forEach((g, i) => { if (g.length > 1 && !r.fixas[i]) p.push(`Escolha ${g.map(x => PERICIA[x].nome).join(' ou ')}.`); });
    const s = periciasDoRascunho(r);
    if (s.livres.length < s.qtdLivres) p.push(`Escolha mais ${s.qtdLivres - s.livres.length} perícia(s).`);
  }
  return [...new Set(p)];
}

// ---------- Telas ----------
export function telaCriador(r) {
  const passo = PASSOS[r.passo][0];
  const corpo = { modo: passoModo, conceito: passoConceito, atributos: passoAtributos, origem: passoOrigem, classe: passoClasse, pericias: passoPericias, revisao: passoRevisao }[passo](r);
  const problemas = problemasDoPasso(r);
  return `<div class="pagina">
    <div class="titulo-secao"><h1 class="faixa">Novo agente</h1>${r.modo ? `<span class="etiqueta ${r.modo === 'sah' ? 'sah' : 'lr'}">${esc(MODOS[r.modo].nome)}</span>` : ''}</div>
    <nav class="passos" aria-label="Passos da criação">${PASSOS.map(([id, nome], i) => `<button data-acao="cri-ir" data-passo="${i}" ${i === r.passo ? 'aria-current="step"' : ''} class="${i < r.passo ? 'feito' : ''}" ${i > r.passo && !podeAvancarAte(r, i) ? 'disabled' : ''}>${i + 1}. ${nome}</button>`).join('')}</nav>
    ${corpo}
    <div class="linha fim" style="margin-top:18px">
      <span class="apagado dossie-txt" role="status">${esc(problemas[0] || '')}</span>
      <span class="espaco"></span>
      ${r.passo > 0 ? '<button class="btn" data-acao="cri-voltar">← Voltar</button>' : '<a class="btn fantasma" href="#/agentes">Cancelar</a>'}
      ${r.passo < PASSOS.length - 1 ? `<button class="btn sangue" data-acao="cri-avancar" ${problemas.length ? 'disabled' : ''}>Avançar →</button>` : `<button class="btn sangue" data-acao="cri-criar">Criar agente</button>`}
    </div></div>`;
}
function podeAvancarAte(r, alvo) { for (let i = 0; i < alvo; i++) if (problemasDoPasso(r, i).length) return false; return true; }

function passoModo(r) {
  const op = Object.entries(OPCIONAIS).map(([k, o]) => `<label class="check opcional"><input type="checkbox" data-cri-op="${k}" ${r.opcionais[k] ? 'checked' : ''} ${k === 'determinacao' && r.opcionais.patentes ? 'disabled' : ''}>
     <span><b>${esc(o.nome)}</b> <small class="dossie-txt">${esc(o.pagina)}</small><small>${esc(o.resumo)}</small></span></label>`).join('');
  return `<p class="apagado">Antes de abrir a ficha, escolha com quais regras este agente vai existir. Dá para ter agentes dos dois tipos salvos ao mesmo tempo.</p>
  <div class="modos">
    <button class="modo" data-acao="cri-modo" data-modo="padrao" aria-pressed="${r.modo === 'padrao'}">
      <span class="sigilo sigilo-grande" style="--img:url(assets/sigilo-conhecimento.svg);--cor:var(--vela)"></span>
      <span class="selo">Livro de Regras</span><h2>Regras Padrão</h2>
      <ul><li>Agente da Ordem desde o início (NEX 5%).</li><li>Combatente, Especialista ou Ocultista.</li><li>26 origens, 15 trilhas, PV, PE e Sanidade.</li><li>Evolução por NEX até 99%.</li></ul>
    </button>
    <button class="modo sah" data-acao="cri-modo" data-modo="sah" aria-pressed="${r.modo === 'sah'}">
      <span class="sigilo sigilo-grande" style="--img:url(assets/sigilo-medo.svg);--cor:#c9a6f0"></span>
      <span class="selo" style="color:#c9a6f0">Sobrevivendo ao Horror</span><h2>Sobrevivendo ao Horror</h2>
      <ul><li>Tudo das regras padrão, mais:</li><li>Classe <b>Sobrevivente</b>: gente comum, por estágios.</li><li>20 novas origens e 9 novas trilhas.</li><li>Poderes gerais e regras opcionais de horror.</li></ul>
    </button>
  </div>
  ${r.modo === 'sah' ? `<section class="painel" style="margin-top:16px"><h3 class="titulo-vermelho">Regras opcionais do Sobrevivendo ao Horror</h3><p class="apagado">Combine com o mestre. Todas podem ficar desligadas.</p><div class="opcionais">${op}</div></section>` : ''}`;
}

function passoConceito(r) {
  const f = r.ficha;
  const campo = (k, rot, ph = '', tipo = 'text') => `<label class="campo"><span>${rot}</span><input type="${tipo}" data-cri="${k}" id="cri-${k}" value="${esc(f[k])}" placeholder="${esc(ph)}" maxlength="160"></label>`;
  return `<div class="painel"><div class="grade c2">${campo('nome', 'Nome do agente', 'Ex.: Joana Marques')}${campo('jogador', 'Jogador(a)')}${campo('conceito', 'Conceito em uma frase', 'Ex.: Legista cética que viu o morto levantar')}${campo('idade', 'Idade')}</div>
  <h3 class="titulo-vermelho">Perguntas para pensar</h3><ul class="apagado"><li>O que ele fazia antes do paranormal?</li><li>Qual foi o primeiro contato com o Outro Lado?</li><li>Como age numa investigação? E numa cena de ação?</li></ul></div>`;
}

function passoAtributos(r) {
  const f = r.ficha;
  const sobrev = f.classe === 'sobrevivente';
  const pontos = sobrev ? CRIACAO_ATRIBUTOS.pontosSobrevivente : CRIACAO_ATRIBUTOS.pontos;
  const usados = ATRIBUTOS.reduce((s, a) => s + f.atributos[a.id] - 1, 0);
  const resto = pontos - usados;
  return `<div class="grade c2"><div class="painel">
    <div class="titulo-secao"><h3>Distribua os pontos</h3><span class="contador ${resto < 0 ? 'erro' : ''}">${resto} ponto(s) livre(s)</span></div>
    ${pentagramaAtributos(f.atributos, true)}
  </div><div class="painel"><h3 class="titulo-vermelho">Como funciona</h3>
    <p>Todos começam em <b>1</b>. Você tem <b>${pontos} pontos</b>${sobrev ? ' (Sobrevivente recebe 3, não 4)' : ''} para somar onde quiser. O máximo inicial é <b>3</b>.</p>
    <p>Pode baixar <b>um</b> atributo para <b>0</b> e ganhar +1 ponto.</p>
    <p class="apagado">Nos testes você rola um d20 para cada ponto do atributo e fica com o melhor. Com 0, rola 2d20 e fica com o <b>pior</b>.</p>
    <ul class="apagado"><li><b>Agilidade</b>: reflexos, pontaria, furtividade, Defesa.</li><li><b>Força</b>: luta, atletismo, carga e dano corpo a corpo.</li><li><b>Intelecto</b>: estudo, investigação e perícias extras.</li><li><b>Presença</b>: vontade, social, PE e rituais.</li><li><b>Vigor</b>: PV e fortitude.</li></ul>
  </div></div>`;
}

export function pentagramaAtributos(at, editavel, rolavel = false) {
  // Roda dos atributos: 5 círculos de borda irregular em volta de uma engrenagem ornamentada (desenhos originais).
  // AGI em cima, INT à direita, VIG e PRE embaixo, FOR à esquerda. O nome fica DENTRO do círculo, com o valor grande.
  const pos = { agi: [50, 17], int: [83, 41], vig: [69.5, 80], pre: [30.5, 80], for: [17, 41] };
  return `<div class="roda-atr"><div class="roda-engrenagem" aria-hidden="true"></div>
  ${ATRIBUTOS.map(a => {
    const miolo = `<span class="roda-nome">${a.nome}<b>${a.sigla}</b></span><span class="roda-valor">${at[a.id]}</span>`;
    return `<div class="roda-item" style="left:${pos[a.id][0]}%;top:${pos[a.id][1]}%">
      ${rolavel ? `<button class="roda-circulo" data-acao="rolar-atributo" data-atr="${a.id}" title="Rolar ${a.nome}" aria-label="Rolar ${a.nome}: ${at[a.id]}">${miolo}</button>` : `<div class="roda-circulo" aria-label="${a.nome}: ${at[a.id]}">${miolo}</div>`}
      ${editavel ? `<span class="roda-ajuste"><button data-acao="cri-atr" data-atr="${a.id}" data-d="-1" aria-label="Diminuir ${a.nome}">−</button><button data-acao="cri-atr" data-atr="${a.id}" data-d="1" aria-label="Aumentar ${a.nome}">+</button></span>` : ''}
    </div>`;
  }).join('')}</div>`;
}

function passoOrigem(r) {
  const f = r.ficha;
  const lista = ORIGENS.filter(o => (o.fonte !== 'SaH' || r.modo === 'sah') && (!r.filtro || semAcento(o.nome + ' ' + o.poder).includes(semAcento(r.filtro)))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  const o = ORIGEM[f.origem];
  const escolhaLivre = o ? o.pericias.map((p, i) => p === '*' ? `<label class="campo"><span>Perícia da origem ${i + 1}</span><select data-cri-origem-livre="${i}"><option value="">Escolha…</option>${PERICIAS.map(x => `<option value="${x.id}" ${r.origemLivres[i] === x.id ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></label>` : '').join('') : '';
  return `<div class="linha" style="margin-bottom:10px"><input class="filtro" type="search" placeholder="Procurar origem…" data-cri-filtro id="cri-filtro" value="${esc(r.filtro)}" aria-label="Procurar origem"><span class="apagado">${lista.length} origens</span></div>
  ${escolhaLivre ? `<div class="painel grade c2" style="margin-bottom:12px">${escolhaLivre}</div>` : ''}
  ${f.origem === 'propria' ? `<div class="painel grade c2" style="margin-bottom:12px"><label class="campo"><span>Nome da origem</span><input data-cri="origemPropria.nome" id="cri-op-nome" value="${esc(f.origemPropria.nome)}"></label><label class="campo"><span>Poder</span><input data-cri="origemPropria.poder" id="cri-op-poder" value="${esc(f.origemPropria.poder)}"></label><label class="campo" style="grid-column:1/-1"><span>O que o poder faz</span><textarea data-cri="origemPropria.resumo" id="cri-op-resumo">${esc(f.origemPropria.resumo)}</textarea></label><p class="apagado">Escolha as perícias treinadas da origem no passo Perícias (como perícias livres).</p></div>` : ''}
  <div class="cartoes">${lista.map(x => `<button class="cartao" data-acao="cri-origem" data-id="${x.id}" aria-pressed="${f.origem === x.id}">
    ${imagemOpcional(`assets/imagens/origem-${x.id}.jpg`, 'img-classe')}
    <span class="linha"><b>${esc(x.nome)}</b><span class="espaco"></span>${fonteTag(x.fonte)}</span>
    <small class="dossie-txt">${x.pericias.map(p => p === '*' ? 'à escolha' : PERICIA[p].nome).join(' · ')}</small>
    <small><b>${esc(x.poder)}.</b> ${esc(x.resumo)}</small></button>`).join('')}
    <button class="cartao" data-acao="cri-origem" data-id="propria" aria-pressed="${f.origem === 'propria'}"><b>Origem própria</b><small>Crie a sua com o mestre (homebrew).</small></button>
  </div>`;
}

function passoClasse(r) {
  const f = r.ficha;
  const lista = Object.entries(CLASSES).filter(([, c]) => !c.soSah || r.modo === 'sah');
  return `<div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">${lista.map(([id, c]) => `<button class="cartao" data-acao="cri-classe" data-id="${id}" aria-pressed="${f.classe === id}">
    ${imagemOpcional(`assets/imagens/classe-${id}.jpg`, 'img-classe')}
    <span class="linha"><b style="font-size:1.2rem">${esc(c.nome)}</b><span class="espaco"></span>${fonteTag(c.fonte)}</span>
    <small>${esc(c.lema)}</small>
    <small class="dossie-txt">PV ${c.pv[0]}+VIG · ${r.opcionais.determinacao || r.opcionais.patentes ? `PD ${c.pd[0]}+PRE` : `PE ${c.pe[0]}+PRE · SAN ${c.san[0]}`}</small>
    <small class="dossie-txt">${c.porEstagio ? 'A cada estágio' : 'A cada NEX'}: +${c.pv[1]}${c.porEstagio ? '' : '+VIG'} PV${r.opcionais.determinacao || r.opcionais.patentes ? `, +${c.pd[1]}${c.porEstagio ? '' : '+PRE'} PD` : `, +${c.pe[1]}${c.porEstagio ? '' : '+PRE'} PE, +${c.san[1]} SAN`}</small>
    <small>Perícias: ${c.pericias.fixas.map(g => g.map(x => PERICIA[x].nome).join(' ou ')).concat(`${c.pericias.livres} + Int à escolha`).join('; ')}.</small>
    <small>${esc(c.proficiencias.join(', '))}.</small>
  </button>`).join('')}</div>
  ${f.classe === 'sobrevivente' ? `<div class="painel" style="margin-top:12px"><h3 class="titulo-vermelho">Sobrevivente</h3><p>Começa no <b>estágio 1</b> com NEX 0% e sobe um estágio por missão. Limite de PE sempre 1. Escolhe 1 item de categoria I e itens de categoria 0 compatíveis com a origem (não usa patente).</p><p class="apagado">Se for recrutado pela Ordem (Treinamento Especial), vira NEX 5% de outra classe. Combatente: ${esc(TREINAMENTO_ESPECIAL.combatente)} Especialista: ${esc(TREINAMENTO_ESPECIAL.especialista)} Ocultista: ${esc(TREINAMENTO_ESPECIAL.ocultista)}</p></div>` : ''}`;
}

function passoPericias(r) {
  const f = r.ficha, cls = CLASSES[f.classe];
  const s = periciasDoRascunho(r);
  const fixas = cls.pericias.fixas.map((g, i) => g.length === 1 ? `<span class="etiqueta">${PERICIA[g[0]].nome} (classe)</span>` : `<label class="campo"><span>Classe: escolha uma</span><select data-cri-fixa="${i}">${['<option value="">Escolha…</option>', ...g.map(x => `<option value="${x}" ${r.fixas[i] === x ? 'selected' : ''}>${PERICIA[x].nome}</option>`)].join('')}</select></label>`).join('');
  return `<div class="painel"><div class="linha">${fixas}</div>
    <p style="margin-top:10px">Da origem: ${s.daOrigem.map(p => `<span class="etiqueta">${PERICIA[p].nome}</span>`).join(' ') || '<span class="apagado">nenhuma</span>'}</p>
    ${s.repetidas ? `<p class="apagado">Uma perícia da classe repete a da origem: você ganha ${s.repetidas} escolha(s) a mais.</p>` : ''}
    <div class="titulo-secao" style="margin-top:12px"><h3>Perícias à escolha</h3><span class="contador ${s.livres.length > s.qtdLivres ? 'erro' : ''}">${s.livres.length} / ${s.qtdLivres}</span></div>
    <p class="apagado">${cls.pericias.livres} + Intelecto (${f.atributos.int})${s.repetidas ? ` + ${s.repetidas}` : ''}. Cada perícia treinada dá +5.</p>
    <div class="cartoes" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${PERICIAS.map(p => {
      const fixa = s.daOrigem.includes(p.id) || s.daClasse.includes(p.id);
      const marcada = fixa || s.livres.includes(p.id);
      return `<button class="cartao" data-acao="cri-pericia" data-id="${p.id}" aria-pressed="${marcada}" ${fixa ? 'disabled' : ''}><b>${p.nome}</b><small class="dossie-txt">${p.atr.toUpperCase()}${p.treinada ? ' · só treinada' : ''}${p.carga ? ' · carga' : ''}${fixa ? ' · já treinada' : ''}</small></button>`;
    }).join('')}</div></div>`;
}

function passoRevisao(r) {
  const f = aplicarNaFicha(structuredClone(r));
  const d = derivar(f);
  const cls = CLASSES[f.classe];
  const nivel = f.classe === 'sobrevivente'
    ? `<label class="campo"><span>Estágio inicial</span><select data-cri-num="estagio">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${r.ficha.estagio === n ? 'selected' : ''}>Estágio ${n}</option>`).join('')}</select></label>`
    : r.opcionais.patentes ? `<label class="campo"><span>Pontos de prestígio (patente)</span><input type="number" min="0" max="999" data-cri-num="pp" id="cri-pp" value="${r.ficha.pp}"></label>`
      : r.opcionais.nivelExp ? `<label class="campo"><span>Nível inicial</span><select data-cri-num="nivel">${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${r.ficha.nivel === i + 1 ? 'selected' : ''}>Nível ${i + 1}</option>`).join('')}</select></label>`
        : `<label class="campo"><span>NEX inicial</span><select data-cri-num="nex">${NEX.map(n => `<option value="${n}" ${r.ficha.nex === n ? 'selected' : ''}>NEX ${n}%</option>`).join('')}</select></label>`;
  return `<div class="grade c2"><div class="painel">
    <h2 style="text-transform:uppercase">${esc(f.nome)}</h2><p class="apagado">${esc(f.conceito)}</p>
    <p><span class="etiqueta">${esc(cls.nome)}</span> <span class="etiqueta">${esc(ORIGEM[f.origem]?.nome || f.origemPropria.nome || 'Origem própria')}</span> <span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}">${esc(MODOS[f.modo].nome)}</span></p>
    ${pentagramaAtributos(f.atributos, false)}
    ${nivel}
    <p class="apagado" style="margin-top:8px">Começar acima do nível inicial é para quando o mestre pedir. Poderes, trilha e aumentos de atributo você escolhe depois, na ficha.</p>
  </div><div class="painel">
    <div class="numeros-chave">
      <div class="chave"><b style="color:var(--pv)">${d.pv}</b><span>PV</span></div>
      ${d.pd ? `<div class="chave"><b style="color:var(--pd)">${d.pdMax}</b><span>PD</span></div>` : `<div class="chave"><b style="color:var(--pe)">${d.pe}</b><span>PE</span></div><div class="chave"><b style="color:var(--san)">${d.san}</b><span>SAN</span></div>`}
      <div class="chave"><b>${d.defesa}</b><span>Defesa</span></div><div class="chave"><b>${d.limitePE}</b><span>Limite ${d.pd ? 'PD' : 'PE'}</span></div>
    </div>
    <h3 class="titulo-vermelho">Perícias treinadas</h3><p>${d.pericias.filter(p => p.grau).map(p => `${p.nome} <span class="dossie-txt">+${p.bonus}</span>`).join(' · ')}</p>
    ${f.opcionais && Object.entries(f.opcionais).some(([, v]) => v) ? `<h3 class="titulo-vermelho">Regras opcionais</h3><ul>${Object.entries(f.opcionais).filter(([, v]) => v).map(([k]) => `<li>${esc(OPCIONAIS[k].nome)}</li>`).join('')}</ul>` : ''}
    <p class="apagado">Equipamento, rituais e retrato você adiciona na ficha.</p>
  </div></div>`;
}

// ---------- Ações do criador ----------
export function acoesCriador(ctx) {
  const r = () => ctx.estado.criador;
  const att = () => ctx.render();
  return {
    'cri-modo': el => { const x = r(); x.modo = el.dataset.modo; if (x.modo === 'padrao') { x.opcionais = { determinacao: false, nivelExp: false, patentes: false, ferimentos: false }; if (CLASSES[x.ficha.classe].soSah) x.ficha.classe = 'combatente'; if (ORIGEM[x.ficha.origem]?.fonte === 'SaH') x.ficha.origem = ''; } att(); },
    'cri-ir': el => { const i = Number(el.dataset.passo); if (i <= r().passo || podeAvancarAte(r(), i)) { r().passo = i; att(); scrollTo(0, 0); } },
    'cri-voltar': () => { r().passo = Math.max(0, r().passo - 1); att(); scrollTo(0, 0); },
    'cri-avancar': () => { if (!problemasDoPasso(r()).length) { r().passo++; att(); scrollTo(0, 0); } },
    'cri-atr': el => {
      const f = r().ficha, id = el.dataset.atr, dlt = Number(el.dataset.d);
      const novo = f.atributos[id] + dlt;
      if (novo < 0 || novo > CRIACAO_ATRIBUTOS.maximo) return;
      if (novo === 0 && Object.entries(f.atributos).some(([k, v]) => k !== id && v === 0)) { ctx.avisar('Só um atributo pode ficar em 0.'); return; }
      f.atributos[id] = novo; att();
    },
    'cri-origem': el => { r().ficha.origem = el.dataset.id; r().origemLivres = ['', '']; att(); },
    'cri-classe': el => { const x = r(); x.ficha.classe = el.dataset.id; x.ficha.trilha = ''; x.fixas = {}; if (problemasDoPasso(x, 3).some(t => t.startsWith('Você usou'))) { x.ficha.atributos = { agi: 1, for: 1, int: 1, pre: 1, vig: 1 }; ctx.avisar('Atributos reiniciados: o Sobrevivente tem só 3 pontos.'); } att(); },
    'cri-pericia': el => {
      const x = r(), id = el.dataset.id, s = periciasDoRascunho(x);
      if (x.livres.includes(id)) x.livres = x.livres.filter(p => p !== id);
      else if (s.livres.length < s.qtdLivres) x.livres.push(id);
      else { ctx.avisar(`Você já escolheu ${s.qtdLivres}. Desmarque uma antes.`); return; }
      att();
    },
    'cri-criar': () => {
      const x = r();
      for (let i = 0; i < PASSOS.length - 1; i++) if (problemasDoPasso(x, i).length) { x.passo = i; att(); ctx.avisar(problemasDoPasso(x, i)[0], true); return; }
      const ficha = aplicarNaFicha(x);
      if (ficha.classe === 'ocultista' && !ficha.rituais.length) ficha.notas = ficha.notas || 'Lembrete: escolha 3 rituais de 1º círculo na aba Rituais.';
      ctx.adicionarFicha(ficha);
      ctx.estado.criador = null;
      location.hash = `#/agente/${ficha.id}`;
      ctx.avisar('Agente criado. A ficha foi aberta.');
    },
  };
}

// Campos (input/change) do criador
export function campoCriador(ctx, el) {
  const x = ctx.estado.criador; if (!x) return false;
  if (el.dataset.cri) { const [a, b] = el.dataset.cri.split('.'); if (b) x.ficha[a][b] = el.value; else x.ficha[a] = el.value; return 'leve'; }
  if (el.dataset.criOp) {
    const k = el.dataset.criOp; x.opcionais[k] = el.checked;
    if (k === 'patentes' && el.checked) { x.opcionais.determinacao = true; x.opcionais.nivelExp = false; }
    if (k === 'nivelExp' && el.checked) x.opcionais.patentes = false;
    return 'cheio';
  }
  if ('criFiltro' in el.dataset) { x.filtro = el.value; return 'cheio'; }
  if (el.dataset.criOrigemLivre != null) { x.origemLivres[Number(el.dataset.criOrigemLivre)] = el.value; return 'cheio'; }
  if (el.dataset.criFixa != null) { x.fixas[Number(el.dataset.criFixa)] = el.value; return 'cheio'; }
  if (el.dataset.criNum) { x.ficha[el.dataset.criNum] = inteiro(el.value, 0, 999, 0); return 'cheio'; }
  return false;
}
