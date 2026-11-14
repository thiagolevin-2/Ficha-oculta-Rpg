// mestre.js — Área do Mestre (primeira versão): Ameaças, Combate (iniciativa), Anotações e Backup.
// Ideia do dm-manager do Arcana, com o "bloco de ameaça" do Ordem Paranormal.
import { ELEMENTOS, ATRIBUTOS } from './catalogo.js?v=0.1';
import { derivar } from './regras.js?v=0.1';
import { carregarMestre, salvarMestre } from './armazenamento.js?v=0.1';
import { esc, uid, inteiro, semAcento, sigilo, baixarArquivo, escolherArquivo, comSinal } from './util.js?v=0.1';
import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal } from './rolagem.js?v=0.1';
import { rolarTeste } from './dados.js?v=0.1';

const txt = (v, m = 200) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, m);
const FORMULA = /^[0-9d+\-\s]{0,40}$/i;
const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));
export const TIPOS_AMEACA = ['Criatura paranormal', 'Pessoa', 'Cultista', 'Animal', 'Outro'];

export function normalizarAmeaca(a) {
  a = a || {};
  return {
    id: txt(a.id, 60) || uid(), nome: txt(a.nome, 80) || 'Ameaça', tipo: TIPOS_AMEACA.includes(a.tipo) ? a.tipo : 'Criatura paranormal',
    elemento: ELEM[a.elemento] ? a.elemento : 'medo', vd: inteiro(a.vd, 0, 999, 20), tamanho: txt(a.tamanho, 20) || 'Médio',
    pv: inteiro(a.pv, 1, 99999, 20), defesa: inteiro(a.defesa, 0, 99, 15), desl: txt(a.desl, 30) || '9m',
    atributos: Object.fromEntries(ATRIBUTOS.map(x => [x.id, inteiro(a.atributos?.[x.id], 0, 10, 1)])),
    iniciativa: inteiro(a.iniciativa, -20, 60, 0), percepcao: inteiro(a.percepcao, -20, 60, 0),
    fortitude: inteiro(a.fortitude, -20, 60, 0), reflexos: inteiro(a.reflexos, -20, 60, 0), vontade: inteiro(a.vontade, -20, 60, 0),
    resistencias: txt(a.resistencias, 300), vulnerabilidades: txt(a.vulnerabilidades, 300), sentidos: txt(a.sentidos, 200),
    presenca: { dt: inteiro(a.presenca?.dt, 0, 99, 0), dano: FORMULA.test(txt(a.presenca?.dano, 30)) ? txt(a.presenca?.dano, 30) : '', nex: inteiro(a.presenca?.nex, 0, 99, 0) },
    ataques: (Array.isArray(a.ataques) ? a.ataques : []).slice(0, 12).map(x => ({ nome: txt(x?.nome, 60) || 'Ataque', dados: inteiro(x?.dados, 1, 10, 2), bonus: inteiro(x?.bonus, -20, 80, 10), dano: FORMULA.test(txt(x?.dano, 30)) && txt(x?.dano, 30) ? txt(x?.dano, 30) : '1d6', margem: inteiro(x?.margem, 2, 20, 20), mult: inteiro(x?.mult, 2, 6, 2), nota: txt(x?.nota, 200) })),
    habilidades: txt(a.habilidades, 4000), enigma: txt(a.enigma, 1000), notas: txt(a.notas, 2000),
  };
}
function normalizarMestre(m) {
  m = m && typeof m === 'object' ? m : {};
  return {
    aba: ['combate', 'ameacas', 'anotacoes'].includes(m.aba) ? m.aba : 'combate',
    ameacas: (Array.isArray(m.ameacas) ? m.ameacas : []).slice(0, 300).map(normalizarAmeaca),
    combate: {
      rodada: inteiro(m.combate?.rodada, 1, 999, 1), vez: inteiro(m.combate?.vez, 0, 99, 0), ativo: !!m.combate?.ativo,
      participantes: (Array.isArray(m.combate?.participantes) ? m.combate.participantes : []).slice(0, 40).map(p => ({
        uid: txt(p?.uid, 60) || uid(), nome: txt(p?.nome, 80) || '?', tipo: p?.tipo === 'agente' ? 'agente' : 'ameaca', ref: txt(p?.ref, 60),
        ini: p?.ini == null || p.ini === '' ? null : inteiro(p.ini, -50, 99, 0), pv: inteiro(p?.pv, -9999, 99999, 0), pvMax: inteiro(p?.pvMax, 1, 99999, 1), nota: txt(p?.nota, 200),
      })),
    },
    anotacoes: txt(m.anotacoes, 40000),
  };
}
let mestre = normalizarMestre(carregarMestre());
const gravar = () => salvarMestre(mestre);
export const pegarMestre = () => mestre;

// ---------- Telas ----------
export function telaMestre(fichas) {
  const abas = [['combate', 'Combate'], ['ameacas', `Ameaças (${mestre.ameacas.length})`], ['anotacoes', 'Anotações']];
  const corpo = mestre.aba === 'ameacas' ? abaAmeacas() : mestre.aba === 'anotacoes' ? abaAnotacoes() : abaCombate(fichas);
  return `<div class="pagina"><div class="titulo-secao"><h1 class="faixa sangue">Área do Mestre</h1><div class="linha"><button class="btn pequeno" data-acao="m-backup">Backup</button><button class="btn pequeno fantasma" data-acao="m-restaurar">Restaurar</button></div></div>
  <nav class="abas" role="tablist">${abas.map(([id, n]) => `<button role="tab" data-acao="m-aba" data-aba="${id}" aria-selected="${mestre.aba === id}">${n}</button>`).join('')}</nav>${corpo}</div>`;
}

function abaCombate(fichas) {
  const c = mestre.combate;
  const ordem = [...c.participantes];
  return `<div class="grade c2" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr)">
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Rodada ${c.rodada}</h2>
    <div class="linha"><button class="btn pequeno" data-acao="m-rolar-ini">Rolar iniciativa das ameaças</button><button class="btn pequeno" data-acao="m-ordenar">Ordenar</button><button class="btn pequeno sangue" data-acao="m-proximo">Próximo turno →</button></div></div>
    ${ordem.length ? `<div class="iniciativa">${ordem.map((p, i) => `<div class="ini-linha ${i === c.vez ? 'vez' : ''} ${p.pv <= 0 ? 'caido' : ''}">
      <input type="number" class="ini" data-m-part="${i}.ini" id="mp-ini-${i}" value="${p.ini ?? ''}" placeholder="—" aria-label="Iniciativa de ${esc(p.nome)}">
      <div><b>${esc(p.nome)}</b> <small class="apagado">${p.tipo === 'agente' ? 'agente' : 'ameaça'}</small>
        <div class="linha" style="gap:6px;margin-top:4px"><span class="dossie-txt">PV</span><input type="number" style="width:80px" data-m-part="${i}.pv" id="mp-pv-${i}" value="${p.pv}" aria-label="PV de ${esc(p.nome)}"><span class="apagado">/ ${p.pvMax}</span>
        <input type="number" style="width:70px" id="mp-q-${i}" placeholder="qtd" aria-label="Quantidade"><button class="btn pequeno" data-acao="m-dano" data-i="${i}" data-s="-1">Dano</button><button class="btn pequeno" data-acao="m-dano" data-i="${i}" data-s="1">Cura</button>
        ${p.tipo === 'ameaca' ? `<span class="etiqueta">${estadoPV(p)}</span>` : ''}</div>
        <input data-m-part="${i}.nota" id="mp-nota-${i}" value="${esc(p.nota)}" placeholder="condições, anotações…" style="margin-top:4px;min-height:30px;font-size:.9rem" aria-label="Anotação"></div>
      <div class="linha" style="flex-direction:column;gap:2px">${p.tipo === 'ameaca' ? `<button class="icone-btn" data-acao="m-ver" data-ref="${esc(p.ref)}" aria-label="Ver ficha">👁</button>` : ''}<button class="icone-btn" data-acao="m-tirar" data-i="${i}" aria-label="Tirar do combate">✕</button></div>
    </div>`).join('')}</div>` : '<p class="vazio">Ninguém no combate. Adicione agentes e ameaças ao lado.</p>'}
    ${ordem.length ? '<div class="linha fim" style="margin-top:10px"><button class="btn pequeno perigo" data-acao="m-encerrar">Encerrar combate</button></div>' : ''}
  </section>
  <section class="painel"><h2 class="faixa">Adicionar</h2>
    <h3 class="titulo-vermelho">Agentes deste navegador</h3>
    ${fichas.length ? fichas.map(f => `<button class="btn pequeno" style="margin:2px" data-acao="m-add-agente" data-id="${f.id}">+ ${esc(f.nome || 'Sem nome')}</button>`).join('') : '<p class="apagado">Nenhuma ficha salva aqui. Também dá para adicionar pelo nome:</p>'}
    <div class="linha" style="margin-top:6px"><input id="m-nome-livre" placeholder="Nome do jogador/NPC" aria-label="Nome"><button class="btn pequeno" data-acao="m-add-livre">+</button></div>
    <h3 class="titulo-vermelho">Ameaças</h3>
    ${mestre.ameacas.length ? mestre.ameacas.map(a => `<button class="btn pequeno el-${a.elemento}" style="margin:2px;border-color:var(--el)" data-acao="m-add-ameaca" data-id="${a.id}">${sigilo(a.elemento, 'var(--el)')} ${esc(a.nome)}</button>`).join('') : '<p class="apagado">Crie ameaças na aba Ameaças.</p>'}
  </section></div>`;
}
function estadoPV(p) { const r = p.pv / p.pvMax; return p.pv <= 0 ? 'Caído' : r <= 0.5 ? 'Machucado' : r < 1 ? 'Ferido' : 'Ileso'; }

function abaAmeacas() {
  return `<div class="linha" style="margin-bottom:12px"><button class="btn sangue" data-acao="m-nova-ameaca">+ Nova ameaça</button><button class="btn" data-acao="m-importar-ameaca">Importar</button></div>
  ${mestre.ameacas.length ? `<div class="grade c2">${mestre.ameacas.map(blocoAmeaca).join('')}</div>` : '<p class="vazio">Nenhuma ameaça. Crie a primeira com os números do livro (VD, PV, Defesa, ataques…).</p>'}`;
}
function blocoAmeaca(a) {
  const e = ELEM[a.elemento];
  return `<article class="ameaca-bloco el-${a.elemento}" style="border-top-color:var(--el)">
    <div class="titulo-secao"><div class="linha">${sigilo(a.elemento, 'var(--el)')}<h3>${esc(a.nome)}</h3></div><span class="etiqueta">VD ${a.vd}</span></div>
    <p class="apagado" style="margin:0">${esc(a.tipo)} · ${esc(e.nome)} · ${esc(a.tamanho)}</p>
    <div class="numeros-chave" style="margin:10px 0"><div class="chave"><b>${a.pv}</b><span>PV</span></div><div class="chave"><b>${a.defesa}</b><span>Defesa</span></div><div class="chave"><b>${esc(a.desl)}</b><span>Desloc.</span></div></div>
    <p class="linha-stat"><b>Atributos</b>${ATRIBUTOS.map(x => `${x.sigla} ${a.atributos[x.id]}`).join(' · ')}</p>
    <p class="linha-stat"><b>Perícias</b><button class="rolavel" data-acao="m-teste" data-id="${a.id}" data-k="iniciativa"><span class="d">Ini ${comSinal(a.iniciativa)}</span></button> <button class="rolavel" data-acao="m-teste" data-id="${a.id}" data-k="percepcao"><span class="d">Perc ${comSinal(a.percepcao)}</span></button> <button class="rolavel" data-acao="m-teste" data-id="${a.id}" data-k="fortitude"><span class="d">Fort ${comSinal(a.fortitude)}</span></button> <button class="rolavel" data-acao="m-teste" data-id="${a.id}" data-k="reflexos"><span class="d">Refl ${comSinal(a.reflexos)}</span></button> <button class="rolavel" data-acao="m-teste" data-id="${a.id}" data-k="vontade"><span class="d">Von ${comSinal(a.vontade)}</span></button></p>
    ${a.presenca.dt ? `<p class="linha-stat"><b>Presença perturbadora</b>DT ${a.presenca.dt}${a.presenca.dano ? `, ${esc(a.presenca.dano)} mental` : ''}${a.presenca.nex ? `, NEX ${a.presenca.nex}% imune` : ''}</p>` : ''}
    ${a.resistencias ? `<p class="linha-stat"><b>Resistências</b>${esc(a.resistencias)}</p>` : ''}${a.vulnerabilidades ? `<p class="linha-stat"><b>Vulnerab.</b>${esc(a.vulnerabilidades)}</p>` : ''}${a.sentidos ? `<p class="linha-stat"><b>Sentidos</b>${esc(a.sentidos)}</p>` : ''}
    ${a.ataques.map((x, i) => `<p class="linha-stat"><b>${esc(x.nome)}</b><button class="rolavel" data-acao="m-atacar" data-id="${a.id}" data-i="${i}"><span class="d">${x.dados}d20 ${comSinal(x.bonus)}</span></button> <button class="rolavel" data-acao="m-dano-ataque" data-id="${a.id}" data-i="${i}"><span class="d">${esc(x.dano)}</span></button> <small class="apagado">${x.margem < 20 ? x.margem + '/' : ''}×${x.mult} ${esc(x.nota)}</small></p>`).join('')}
    ${a.habilidades ? `<p style="white-space:pre-wrap;font-size:.95rem;margin-top:6px">${esc(a.habilidades)}</p>` : ''}
    ${a.enigma ? `<p class="linha-stat"><b>Enigma de medo</b>${esc(a.enigma)}</p>` : ''}
    <div class="linha fim" style="margin-top:8px"><button class="btn pequeno" data-acao="m-editar-ameaca" data-id="${a.id}">Editar</button><button class="btn pequeno" data-acao="m-duplicar-ameaca" data-id="${a.id}">Duplicar</button><button class="btn pequeno perigo" data-acao="m-apagar-ameaca" data-id="${a.id}">Apagar</button></div>
  </article>`;
}
function abaAnotacoes() {
  return `<section class="painel"><h2 class="faixa">Anotações do mestre</h2><textarea id="m-anotacoes" data-m-anotacoes style="min-height:50vh" placeholder="Pistas, NPCs, cronologia da missão, segredos…">${esc(mestre.anotacoes)}</textarea><p class="apagado">Salva sozinho, só neste navegador. Use Backup para guardar.</p></section>`;
}

function formAmeaca(a) {
  const c = (k, rot, tipo = 'text', v = a[k]) => `<label class="campo"><span>${rot}</span><input type="${tipo}" data-am="${k}" value="${esc(v)}"></label>`;
  return `<div class="grade c3">${c('nome', 'Nome')}<label class="campo"><span>Tipo</span><select data-am="tipo">${TIPOS_AMEACA.map(t => `<option ${a.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="campo"><span>Elemento</span><select data-am="elemento">${ELEMENTOS.map(e => `<option value="${e.id}" ${a.elemento === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
    ${c('vd', 'VD', 'number')}${c('tamanho', 'Tamanho')}${c('pv', 'PV', 'number')}${c('defesa', 'Defesa', 'number')}${c('desl', 'Deslocamento')}
    ${ATRIBUTOS.map(x => `<label class="campo"><span>${x.nome}</span><input type="number" data-am="atributos.${x.id}" value="${a.atributos[x.id]}"></label>`).join('')}
    ${c('iniciativa', 'Iniciativa (bônus)', 'number')}${c('percepcao', 'Percepção (bônus)', 'number')}${c('fortitude', 'Fortitude', 'number')}${c('reflexos', 'Reflexos', 'number')}${c('vontade', 'Vontade', 'number')}
    ${c('presenca.dt', 'Presença perturbadora: DT', 'number', a.presenca.dt)}${c('presenca.dano', 'Dano mental (ex.: 2d6)', 'text', a.presenca.dano)}${c('presenca.nex', 'NEX imune (%)', 'number', a.presenca.nex)}
    ${c('resistencias', 'Resistências')}${c('vulnerabilidades', 'Vulnerabilidades')}${c('sentidos', 'Sentidos')}</div>
    <h3 class="titulo-vermelho">Ataques</h3><div id="am-ataques">${a.ataques.map((x, i) => linhaAtaque(x, i)).join('')}</div>
    <button class="btn pequeno" data-acao="m-add-ataque-form">+ Ataque</button>
    <label class="campo" style="margin-top:10px"><span>Habilidades e ações</span><textarea data-am="habilidades" style="min-height:120px">${esc(a.habilidades)}</textarea></label>
    <label class="campo"><span>Enigma de medo / fraquezas</span><textarea data-am="enigma">${esc(a.enigma)}</textarea></label>`;
}
const linhaAtaque = (x, i) => `<div class="grade c3 am-ataque" style="padding:8px 0;border-bottom:1px solid var(--linha)"><label class="campo"><span>Nome</span><input data-at="nome" value="${esc(x.nome)}"></label><label class="campo"><span>Dados (d20)</span><input type="number" data-at="dados" value="${x.dados}"></label><label class="campo"><span>Bônus</span><input type="number" data-at="bonus" value="${x.bonus}"></label><label class="campo"><span>Dano</span><input data-at="dano" value="${esc(x.dano)}"></label><label class="campo"><span>Margem</span><input type="number" data-at="margem" value="${x.margem}"></label><label class="campo"><span>Multiplicador</span><input type="number" data-at="mult" value="${x.mult}"></label><label class="campo" style="grid-column:1/-1"><span>Nota</span><input data-at="nota" value="${esc(x.nota)}"></label></div>`;

function lerForm(base) {
  const a = structuredClone(base);
  document.querySelectorAll('[data-am]').forEach(i => { const [k, s] = i.dataset.am.split('.'); if (s) a[k][s] = i.value; else a[k] = i.value; });
  a.ataques = [...document.querySelectorAll('.am-ataque')].map(l => Object.fromEntries([...l.querySelectorAll('[data-at]')].map(i => [i.dataset.at, i.value])));
  return normalizarAmeaca(a);
}

// ---------- Ações ----------
export function acoesMestre(ctx) {
  const att = () => { gravar(); ctx.render(); };
  const ameaca = id => mestre.ameacas.find(a => a.id === id);
  let editando = null;
  return {
    'm-aba': el => { mestre.aba = el.dataset.aba; att(); },
    'm-nova-ameaca': () => { editando = normalizarAmeaca({ nome: 'Nova ameaça', ataques: [{ nome: 'Garras', dados: 2, bonus: 10, dano: '2d6+5' }] }); abrirModal('Nova ameaça', formAmeaca(editando), '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-salvar-ameaca">Salvar</button>', true); },
    'm-editar-ameaca': el => { editando = structuredClone(ameaca(el.dataset.id)); abrirModal(`Editar · ${editando.nome}`, formAmeaca(editando), '<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="m-salvar-ameaca">Salvar</button>', true); },
    'm-add-ataque-form': () => { const box = document.getElementById('am-ataques'); box.insertAdjacentHTML('beforeend', linhaAtaque({ nome: 'Ataque', dados: 2, bonus: 10, dano: '1d8', margem: 20, mult: 2, nota: '' }, box.children.length)); },
    'm-salvar-ameaca': () => { const a = lerForm(editando); const i = mestre.ameacas.findIndex(x => x.id === a.id); if (i >= 0) mestre.ameacas[i] = a; else mestre.ameacas.push(a); fecharModal(); att(); },
    'm-duplicar-ameaca': el => { const a = structuredClone(ameaca(el.dataset.id)); a.id = uid(); a.nome += ' (cópia)'; mestre.ameacas.push(a); att(); },
    'm-apagar-ameaca': el => { const a = ameaca(el.dataset.id); if (!confirm(`Apagar "${a.nome}"?`)) return; mestre.ameacas = mestre.ameacas.filter(x => x.id !== a.id); att(); },
    'm-ver': el => { const a = ameaca(el.dataset.ref); if (a) abrirModal(a.nome, blocoAmeaca(a), '', true); },
    'm-teste': el => { const a = ameaca(el.dataset.id); const k = el.dataset.k; const atr = { iniciativa: 'agi', percepcao: 'pre', fortitude: 'vig', reflexos: 'agi', vontade: 'pre' }[k]; const n = a.atributos[atr]; rolarTesteUI({ titulo: `${a.nome} · ${k}`, quem: 'Mestre', dados: n >= 1 ? { qtd: n, pior: false } : { qtd: 2, pior: true }, bonus: a[k] }); },
    'm-atacar': el => { const a = ameaca(el.dataset.id), x = a.ataques[Number(el.dataset.i)]; rolarTesteUI({ titulo: `${a.nome} · ${x.nome}`, quem: 'Mestre', dados: { qtd: x.dados, pior: false }, bonus: x.bonus, margem: x.margem, mult: x.mult, tipo: 'ataque', formulaDano: x.dano }); },
    'm-dano-ataque': el => { const a = ameaca(el.dataset.id), x = a.ataques[Number(el.dataset.i)]; rolarDanoUI({ titulo: `${a.nome} · ${x.nome}`, quem: 'Mestre', formula: x.dano }); },
    'm-importar-ameaca': async () => {
      const arq = await escolherArquivo('.json,application/json'); if (!arq) return;
      try { const j = JSON.parse(await arq.text()); const lista = Array.isArray(j) ? j : j.ameacas || [j]; lista.slice(0, 300).forEach(a => mestre.ameacas.push(normalizarAmeaca({ ...a, id: uid() }))); att(); ctx.avisar(`${lista.length} ameaça(s) importada(s).`); } catch { ctx.avisar('Arquivo inválido.', true); }
    },
    'm-add-agente': el => {
      const f = ctx.fichas().find(x => x.id === el.dataset.id); if (!f) return; const d = derivar(f);
      mestre.combate.participantes.push({ uid: uid(), nome: f.nome || 'Agente', tipo: 'agente', ref: f.id, ini: null, pv: d.atual.pv, pvMax: d.pv, nota: '' }); att();
    },
    'm-add-livre': () => { const i = document.getElementById('m-nome-livre'); const nome = i?.value.trim(); if (!nome) return i?.focus(); mestre.combate.participantes.push({ uid: uid(), nome, tipo: 'agente', ref: '', ini: null, pv: 1, pvMax: 1, nota: '' }); att(); },
    'm-add-ameaca': el => {
      const a = ameaca(el.dataset.id); const n = mestre.combate.participantes.filter(p => p.ref === a.id).length;
      mestre.combate.participantes.push({ uid: uid(), nome: a.nome + (n ? ` ${n + 1}` : ''), tipo: 'ameaca', ref: a.id, ini: null, pv: a.pv, pvMax: a.pv, nota: '' }); att();
    },
    'm-rolar-ini': () => {
      for (const p of mestre.combate.participantes) if (p.tipo === 'ameaca') { const a = ameaca(p.ref); if (!a) continue; const n = a.atributos.agi; p.ini = rolarTeste({ qtd: Math.max(1, n || 2), pior: n < 1, bonus: a.iniciativa }).total; }
      mestre.combate.participantes.sort((x, y) => (y.ini ?? -99) - (x.ini ?? -99)); mestre.combate.vez = 0; att(); ctx.avisar('Iniciativa das ameaças rolada. Peça aos jogadores as deles.');
    },
    'm-ordenar': () => { mestre.combate.participantes.sort((x, y) => (y.ini ?? -99) - (x.ini ?? -99)); mestre.combate.vez = 0; att(); },
    'm-proximo': () => { const c = mestre.combate; if (!c.participantes.length) return; c.vez++; if (c.vez >= c.participantes.length) { c.vez = 0; c.rodada++; } att(); },
    'm-dano': el => { const i = Number(el.dataset.i); const q = inteiro(document.getElementById('mp-q-' + i)?.value, 0, 99999, 0); if (!q) return; const p = mestre.combate.participantes[i]; p.pv = Math.min(p.pvMax, p.pv + q * Number(el.dataset.s)); att(); },
    'm-tirar': el => { mestre.combate.participantes.splice(Number(el.dataset.i), 1); mestre.combate.vez = Math.min(mestre.combate.vez, Math.max(0, mestre.combate.participantes.length - 1)); att(); },
    'm-encerrar': () => { if (!confirm('Encerrar o combate e limpar a lista?')) return; mestre.combate = { rodada: 1, vez: 0, ativo: false, participantes: [] }; att(); },
    'm-backup': () => baixarArquivo(`backup-mestre-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ tipo: 'fichaoculta-mestre', versao: 1, mestre }, null, 2)),
    'm-restaurar': async () => {
      const arq = await escolherArquivo('.json,application/json'); if (!arq) return;
      try { const j = JSON.parse(await arq.text()); if (j.tipo !== 'fichaoculta-mestre') throw 0; if (!confirm('Substituir a Área do Mestre atual pelo backup?')) return; mestre = normalizarMestre(j.mestre); att(); ctx.avisar('Backup restaurado.'); } catch { ctx.avisar('Esse arquivo não é um backup da Área do Mestre.', true); }
    },
  };
}
export function campoMestre(el) {
  if (el.dataset.mPart) { const [i, k] = el.dataset.mPart.split('.'); const p = mestre.combate.participantes[Number(i)]; if (!p) return false; p[k] = k === 'nota' ? txt(el.value, 200) : el.value === '' ? null : inteiro(el.value, -9999, 99999, 0); gravar(); return k === 'nota' ? 'leve' : 'leve'; }
  if ('mAnotacoes' in el.dataset) { mestre.anotacoes = txt(el.value, 40000); gravar(); return 'leve'; }
  return false;
}
