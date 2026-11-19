// Abas MACROS e ROLAGENS: macros de ataque/teste/dano e a bandeja de dados.

import { derivar, normalizar, LIMITE_DANOS_EXTRAS_MACRO } from './regras.js?v=0.47';
import { rolar, analisar } from './combate.js?v=0.47';
import { PERICIAS, PERICIA, TIPOS_DANO } from './catalogo.js?v=0.47';
import { esc, comSinal, inteiro, uid } from './util.js?v=0.47';
import { estado } from './ficha-estado.js?v=0.47';
import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal, proxima } from './rolagem.js?v=0.47';
import { opcoesAtributos } from './ficha-agente.js?v=0.47';
import { ITENS_ABERTOS } from './ficha-inventario.js?v=0.47';
import { acoesFicha } from './fichaUI.js?v=0.47';
import { gastar } from './ficha-base.js?v=0.47';

// Rolagens personalizadas: todos os dados (d2 = moeda, d100 = percentual), fórmulas livres, teste do Ordem e rolagens salvas na ficha.
export const DADOS_LIVRES = [[2, 'Moeda'], [4, 'd4'], [6, 'd6'], [8, 'd8'], [10, 'd10'], [12, 'd12'], [20, 'd20'], [100, 'd100']];
// ---------- Aba MACROS: sequências de rolagens com um clique ----------
export const TIPOS_PASSO = [['ataque', 'Ataque com arma'], ['acerto', 'Ataque personalizado'], ['pericia', 'Teste de perícia'], ['formula', 'Rolagem livre (fórmula)'], ['gasto', 'Gastar PE/PD']];
export const USOS_ARMA_MACRO = [['corpo', 'Corpo a corpo'], ['disparo', 'Disparo'], ['arremesso', 'Arremesso'], ['fogo', 'Armas de fogo']];
// Tipos de dano e elementos para o ataque personalizado da macro
export const TIPOS_DANO_MACRO = [['corte', 'Corte'], ['impacto', 'Impacto'], ['perfuracao', 'Perfuração'], ['balistico', 'Balístico'], ['fogo', 'Fogo'], ['frio', 'Frio'], ['eletricidade', 'Eletricidade'], ['quimico', 'Químico'], ['mental', 'Mental'],
  ['sangue', 'Sangue'], ['morte', 'Morte'], ['conhecimento', 'Conhecimento'], ['energia', 'Energia'], ['medo', 'Medo']];
export const nomeTipoDano = id => TIPOS_DANO_MACRO.find(([v]) => v === id)?.[1] || '';
export const periciaAtaqueLivre = p => Object.hasOwn(PERICIA, p.alvo) ? p.alvo : p.alcanceAtaque === 'distancia' ? 'pontaria' : 'luta';
export const tituloAtaqueLivre = p => p.alcanceAtaque === 'distancia' ? 'Ataque à distância' : 'Ataque corpo a corpo';
export const formulaAtaque = p => (p.tipo === 'ataque' ? p.danoArma : p.formula).trim();
export const novoPassoMacro = f => derivar(f).ataques.length ? { tipo: 'ataque' } : { tipo: 'acerto', formula: '1d6' };
export function textoPasso(d, p, k) {
  if (p.tipo === 'pericia') return `Teste de ${PERICIA[p.alvo]?.nome || '(escolha a perícia)'}`;
  if (p.tipo === 'ataque') {
    const a = d.ataques.find(x => x.uid === p.alvo);
    if (!a) return 'Ataque com arma (escolha a arma)';
    return `${a.nome} · ${PERICIA[p.pericia || a.pericia].nome} · ${formulaAtaque(p) || a.formula}`;
  }
  if (p.tipo === 'acerto') return [p.rotulo || tituloAtaqueLivre(p), PERICIA[periciaAtaqueLivre(p)]?.nome, formulaAtaque(p)].filter(Boolean).join(' · ');
  if (p.tipo === 'gasto') return `Gastar ${p.valor} ${k}`;
  return `Rolar ${p.formula || '(escreva a fórmula)'}${p.rotulo ? ` · ${p.rotulo}` : ''}`;
}
export function abaMacros(f, d, noCombate = false) {
  const k = d.pd ? 'PD' : 'PE';
  const gruposArmas = USOS_ARMA_MACRO.map(([uso, nome]) => [nome, d.ataques.filter(a => a.uso === uso)]).filter(([, armas]) => armas.length);
  const selTipoDano = (campo, atual, padrao) => `<label class="mini"><span>Tipo ou elemento</span><select data-campo="${campo}"><option value="">${padrao}</option>${TIPOS_DANO_MACRO.map(([v, n]) => `<option value="${v}" ${atual === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
  const editorPasso = (i, p, j) => {
    const base = `macros.${i}.passos.${j}`;
    const comArma = p.tipo === 'ataque';
    const arma = comArma ? d.ataques.find(a => a.uid === p.alvo) : null;
    const selPericia = (campo, padrao) => `<label class="mini"><span>Perícia</span><select data-campo="${base}.${campo}"><option value="">${esc(padrao)}</option>${PERICIAS.map(x => `<option value="${x.id}" ${p[campo] === x.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>`;
    const editorAtaque = () => {
      const campoDano = comArma ? 'danoArma' : 'formula';
      const campoTipo = comArma ? 'tipoDanoArma' : 'tipoDano';
      return `${comArma
        ? `<label class="mini"><span>Arma</span><select data-campo="${base}.alvo"><option value="">Escolha a arma</option>${gruposArmas.map(([grupo, armas]) => `<optgroup label="${grupo}">${armas.map(a => `<option value="${esc(a.uid)}" ${p.alvo === a.uid ? 'selected' : ''}>${esc(a.nome)}</option>`).join('')}</optgroup>`).join('')}</select></label>`
        : `<label class="mini"><span>Alcance</span><select data-campo="${base}.alcanceAtaque"><option value="corpo">Corpo a corpo</option><option value="distancia" ${p.alcanceAtaque === 'distancia' ? 'selected' : ''}>À distância</option></select></label>
           <label class="mini"><span>Nome do ataque (opcional)</span><input data-campo="${base}.rotulo" maxlength="40" value="${esc(p.rotulo)}" placeholder="Ex.: Tiro oculto"></label>`}
      ${comArma ? selPericia('pericia', arma ? `Da arma (${arma.periciaNome})` : 'Padrão da arma') : selPericia('alvo', p.alcanceAtaque === 'distancia' ? 'Padrão (Pontaria)' : 'Padrão (Luta)')}
      <label class="mini"><span>Dano base</span><input data-campo="${base}.${campoDano}" list="macro-dados-dano" maxlength="40" value="${esc(p[campoDano])}" placeholder="${esc(arma ? `Da arma: ${arma.formula}` : 'Ex.: 2d6+3')}"></label>
      <label class="mini"><span>Atributo somado ao dano</span><select data-campo="${base}.atributoDano"><option value="">${comArma ? 'Padrão da arma' : 'Nenhum (padrão)'}</option><option value="nenhum" ${p.atributoDano === 'nenhum' ? 'selected' : ''}>Nenhum</option>${opcoesAtributos(p.atributoDano)}</select></label>
      ${selTipoDano(`${base}.${campoTipo}`, p[campoTipo], comArma ? 'Padrão da arma' : 'Sem tipo definido')}
      ${comArma ? `<label class="check macro-critico"><input type="checkbox" data-campo="${base}.criticoProprio" data-tipo="bool" ${p.criticoProprio ? 'checked' : ''}>
        <span>Personalizar crítico${arma ? ` (da arma: ${arma.margem}+ ×${arma.mult})` : ''}</span></label>` : ''}
      ${!comArma || p.criticoProprio ? `<label class="mini"><span>Margem de crítico</span><input type="number" min="2" max="20" data-campo="${base}.margem" data-tipo="int" value="${p.margem}"></label>
        <label class="mini"><span>Multiplicador de crítico</span><input type="number" min="2" max="6" data-campo="${base}.mult" data-tipo="int" value="${p.mult}"></label>` : ''}
      ${comArma && !d.ataques.length ? '<small class="apagado macro-dica">Adicione uma arma na aba Inventário para vinculá-la.</small>' : ''}
      <div class="macro-danos-extras">
        ${p.danosExtras.map((extra, n) => {
          const campo = `${base}.danosExtras.${n}`;
          return `<div class="macro-dano-extra">
            <label class="mini"><span>Dano extra ${n + 1}</span><input data-campo="${campo}.formula" list="macro-dados-dano" maxlength="40" value="${esc(extra.formula)}" placeholder="Ex.: 1d6 ou 3"></label>
            ${selTipoDano(`${campo}.tipo`, extra.tipo, 'Sem tipo definido')}
            <button class="icone-btn" data-acao="macro-dano-remover" data-i="${i}" data-j="${j}" data-n="${n}" aria-label="Remover dano extra ${n + 1}">✕</button>
            <label class="check macro-critico"><input type="checkbox" data-campo="${campo}.multiplicaCritico" data-tipo="bool" aria-label="Multiplicar dano extra ${n + 1} no crítico" ${extra.multiplicaCritico ? 'checked' : ''}><span>Multiplicar no crítico</span></label>
          </div>`;
        }).join('')}
        <button class="btn pequeno" data-acao="macro-dano-add" data-i="${i}" data-j="${j}" ${p.danosExtras.length >= LIMITE_DANOS_EXTRAS_MACRO ? 'disabled' : ''}>+ Dano extra</button>
      </div>`;
    };
    const alvo = p.tipo === 'pericia' ? selPericia('alvo', 'Escolha a perícia')
      : p.tipo === 'acerto' || comArma ? editorAtaque()
        : p.tipo === 'gasto'
          ? `<label class="mini"><span>Quanto gastar (${k})</span><input type="number" min="0" max="99" data-campo="${base}.valor" data-tipo="int" value="${p.valor}"></label>`
          : `<input data-campo="${base}.formula" value="${esc(p.formula)}" placeholder="ex.: 2d6+3" aria-label="Fórmula"><input data-campo="${base}.rotulo" value="${esc(p.rotulo)}" placeholder="nome (opcional)" aria-label="Nome da rolagem">`;
    return `<div class="macro-passo"><span class="macro-num">${j + 1}</span><select data-campo="${base}.tipo" aria-label="Tipo do passo">${TIPOS_PASSO.map(([v, n]) => `<option value="${v}" ${p.tipo === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="icone-btn" data-acao="macro-passo-remover" data-i="${i}" data-j="${j}" aria-label="Tirar o passo ${j + 1}">✕</button><div class="macro-alvo">${alvo}</div></div>`;
  };
  const cartao = (m, i) => `<details class="ritual ritual-compacto macro-cartao" data-item-uid="${esc(m.uid)}" ${ITENS_ABERTOS.has(m.uid) ? 'open' : ''}>
    <summary><span class="cab"><b>${esc(m.nome)}</b><span class="etiqueta">${m.passos.length} passo(s)</span>${m.usaPd && m.pd ? `<span class="etiqueta">${m.pd} ${k}</span>` : ''}</span>
      <small class="apagado">${m.passos.map(p => esc(textoPasso(d, p, k))).join(' → ') || 'Sem passos ainda.'}</small>
      <span class="linha" style="margin-top:6px"><button class="btn pequeno sangue" data-acao="macro-executar" data-i="${i}" ${m.passos.length ? '' : 'disabled'}>${noCombate && m.passos.some(p => ['acerto', 'ataque'].includes(p.tipo)) ? 'Rolar ataque' : '▶ Executar'}</button></span></summary>
    <div class="detalhes-rit">
      <div class="grade-mini"><label class="campo"><span>Nome</span><input data-campo="macros.${i}.nome" id="mac-n-${i}" value="${esc(m.nome)}"></label>
        <label class="campo"><span>Nota (aparece no resultado)</span><input data-campo="macros.${i}.nota" id="mac-o-${i}" value="${esc(m.nota)}" placeholder="ex.: só com a arma empunhada"></label></div>
      <label class="check macro-gasto"><input type="checkbox" data-campo="macros.${i}.usaPd" data-tipo="bool" ${m.usaPd ? 'checked' : ''}><span><b>Gastar ${k} ao executar</b></span>
        <input type="number" min="0" max="99" data-campo="macros.${i}.pd" data-tipo="int" value="${m.pd}" aria-label="Quantos ${k} gastar" ${m.usaPd ? '' : 'disabled'}><small class="apagado">${k}</small></label>
      <label class="check macro-gasto"><input type="checkbox" data-campo="macros.${i}.noCombate" data-tipo="bool" ${m.noCombate ? 'checked' : ''}><span>Mostrar em Combate</span></label>
      <div class="macro-passos">${m.passos.map((p, j) => editorPasso(i, p, j)).join('')}</div>
      <div class="linha" style="margin-top:8px"><button class="btn pequeno" data-acao="macro-passo-add" data-i="${i}" ${m.passos.length >= 8 ? 'disabled' : ''}>+ Passo</button><span class="espaco"></span><button class="btn pequeno perigo" data-acao="macro-remover" data-i="${i}">Remover macro</button></div>
    </div></details>`;
  const cartoes = f.macros.map((m, i) => !noCombate || (m.noCombate) ? cartao(m, i) : '').join('');
  return `<section class="painel" ${noCombate ? 'style="margin-top:14px"' : ''}><div class="titulo-secao"><h2 class="faixa sangue">${noCombate ? 'Ataques personalizados' : 'Macros'}</h2><button class="btn pequeno sangue" data-acao="macro-nova" ${noCombate ? 'data-combate="1"' : ''}>${noCombate ? '+ Ataque personalizado' : '+ Nova macro'}</button></div>
    <p class="apagado" style="font-size:.9rem">Em <b>+ Dano extra</b>, adicione dados ou valores fixos. Marque <b>Multiplicar no crítico</b> para aplicar o multiplicador do ataque àquela parcela inteira.</p>
    <datalist id="macro-dados-dano">${[4, 6, 8, 10, 12, 20, 100].map(lados => `<option value="1d${lados}"></option>`).join('')}<option value="2d6"></option><option value="2d8"></option></datalist>
    ${cartoes ? `<div class="lista-macros">${cartoes}</div>` : `<p class="vazio">${noCombate ? 'Crie um ataque ou marque Mostrar em Combate numa macro de ataque.' : 'Nenhuma macro. Crie uma para rolar ataque e dano com um clique.'}</p>`}
  </section>`;
}
export function abaRolagens(f) {
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
// Ações (botões data-acao) da aba
export function acoesMacros(ctx, h) {
  const { f, salvar, quem, testar } = h;
  return {
        'rol-dado': async el => {
      const lados = Number(el.dataset.lados), qtd = inteiro(document.getElementById('rol-qtd')?.value, 1, 100, 1), mod = inteiro(document.getElementById('rol-mod')?.value, -999, 999, 0);
      const formula = `${qtd}d${lados}${mod ? (mod > 0 ? '+' : '') + mod : ''}`;
      const r = await rolarDanoUI({ titulo: lados === 2 ? `Moeda (${formula})` : `Rolagem ${formula}`, quem: quem(), formula, rotulo: lados === 2 ? 'MOEDA' : 'ROLAGEM' });
      if (r && lados === 2 && qtd === 1 && !mod) ctx.avisar(r.total === 1 ? 'Deu 1: cara.' : 'Deu 2: coroa.');
    },
        'rol-moeda': async () => { const r = await rolarDanoUI({ titulo: 'Cara ou coroa', quem: quem(), formula: '1d2', rotulo: 'MOEDA' }); if (r) ctx.avisar(r.total === 1 ? 'Cara (1).' : 'Coroa (2).'); },
        'rol-somar': el => { const i = document.getElementById('rol-formula'); if (!i) return; const v = i.value.trim(); const m = v.match(new RegExp(`(^|\\+)(\\d*)d${el.dataset.lados}(?!\\d)`)); i.value = m ? v.replace(m[0], `${m[1]}${(Number(m[2]) || 1) + 1}d${el.dataset.lados}`) : (v ? v + '+' : '') + `1d${el.dataset.lados}`; i.focus(); },
        'rol-limpar': () => { const i = document.getElementById('rol-formula'); if (i) { i.value = ''; i.focus(); } },
        // Janela de macros (botão flutuante): executar de qualquer aba
    'janela-macros': () => {
      const ficha = f(); if (!ficha) return;
      const d = derivar(ficha), k = d.pd ? 'PD' : 'PE', macros = ficha.macros || [];
      abrirModal('Macros', `${macros.length ? `<div class="lista-hab">${macros.map((m, i) => `<div class="hab macro-linha"><span class="meta"><button class="btn pequeno sangue" data-acao="macro-executar" data-i="${i}" ${m.passos.length ? '' : 'disabled'}>▶ Executar</button></span>
          <b>${esc(m.nome)}</b><p class="apagado" style="font-size:.88rem">${m.passos.map(p => esc(textoPasso(d, p, k))).join(' → ') || 'Sem passos ainda.'}</p></div>`).join('')}</div>`
        : '<p class="vazio">Nenhuma macro ainda. Crie uma: ela faz várias rolagens seguidas com um clique.</p>'}`,
        '<button class="btn" data-acao="macros-editar">Criar ou editar macros</button><span class="espaco"></span><button class="btn sangue" data-acao="fechar-modal">Fechar</button>');
    },
        'macros-editar': () => { fecharModal(); ctx.estado.ui.aba = 'macros'; if (!(f().macros || []).length) return acoesFicha(ctx)['macro-nova'](); ctx.render(); },
        'macro-nova': el => {
      const ficha = f();
      if (ficha.macros.length >= 30) return ctx.avisar('Limite de 30 macros por ficha.', true);
      const noCombate = el?.dataset?.combate === '1';
      const passo = noCombate ? { tipo: 'acerto', formula: '1d6' } : novoPassoMacro(ficha);
      const m = { uid: uid(), nome: noCombate ? 'Novo ataque' : 'Nova macro', noCombate, passos: [passo] };
      ficha.macros.push(m);
      ITENS_ABERTOS.add(m.uid);
      ctx.salvarFicha(normalizar(ficha)); ctx.render();
    },
        'macro-remover': el => { const ficha = f(), m = ficha.macros[Number(el.dataset.i)]; if (!m || !confirm(`Remover a macro "${m.nome}"?`)) return; ficha.macros.splice(Number(el.dataset.i), 1); salvar(); },
        'macro-passo-add': el => {
      const ficha = f(), m = ficha.macros[Number(el.dataset.i)];
      if (!m || m.passos.length >= 8) return;
      m.passos.push(novoPassoMacro(ficha));
      ctx.salvarFicha(normalizar(ficha)); ctx.render();
    },
        'macro-passo-remover': el => { const m = f().macros[Number(el.dataset.i)]; if (!m) return; m.passos.splice(Number(el.dataset.j), 1); salvar(); },
        'macro-dano-add': el => {
      const passo = f().macros[Number(el.dataset.i)]?.passos[Number(el.dataset.j)];
      if (!passo || passo.danosExtras.length >= LIMITE_DANOS_EXTRAS_MACRO) return;
      passo.danosExtras.push({ formula: '', tipo: '', multiplicaCritico: false });
      salvar();
    },
        'macro-dano-remover': el => {
      const passo = f().macros[Number(el.dataset.i)]?.passos[Number(el.dataset.j)];
      const n = Number(el.dataset.n);
      if (!passo?.danosExtras[n]) return;
      passo.danosExtras.splice(n, 1);
      salvar();
    },
        'macro-executar': async el => {
      if (estado.macroExecutando) return;
      const ficha = f(), m = ficha.macros[Number(el.dataset.i)];
      if (!m?.passos.length) return ctx.avisar('Esta macro ainda não tem passos.', true);
      const passos = m.passos.map(p => ({ ...p, danosExtras: p.danosExtras.map(e => ({ ...e, formula: e.formula.trim() })) }));
      for (const [j, p] of passos.entries()) {
        if (p.tipo !== 'ataque' && p.tipo !== 'acerto') continue;
        const formula = formulaAtaque(p);
        const partes = p.danosExtras.map((e, n) => [`dano extra ${n + 1}`, e.formula]);
        if (formula) partes.unshift(['dados de dano', formula]);
        for (const [campo, expressao] of partes) {
          try { analisar(expressao); } catch (e) {
            return ctx.avisar(`Passo ${j + 1}, ${campo}: ${e.message}`, true);
          }
        }
      }
      estado.macroExecutando = true;
      try {
        const linhas = [], autor = ficha.nome || 'Agente';
        if (m.usaPd && m.pd > 0) {
          const dx = derivar(ficha), K = dx.pd ? 'PD' : 'PE';
          if (!gastar(ficha, dx, m.pd, undefined, undefined, `Macro: ${m.nome || 'sem nome'}`)) return ctx.avisar(`${K} insuficiente para a macro (precisa de ${m.pd}).`, true);
          ctx.salvarFicha(ficha); linhas.push([`Gastou ${m.pd} ${K}`, '']);
        }
        for (const p of passos) {
          const comArma = p.tipo === 'ataque';
          const dx = derivar(ficha, comArma ? { armaUid: p.alvo, periciaAtaque: p.pericia, atributoDano: p.atributoDano } : undefined);
          const K = dx.pd ? 'PD' : 'PE';
          if (p.tipo === 'pericia') {
            const per = Object.hasOwn(dx.PER, p.alvo) ? dx.PER[p.alvo] : null;
            if (!per) { linhas.push(['Perícia não escolhida', '—']); continue; }
            const r = await testar({ titulo: `${m.nome} · ${per.nome}`, quem: autor, dados: per.dados, bonus: per.bonus }, per.atrUsado, ficha);
            linhas.push([per.nome, r.total, r.critico ? 'crítico' : '']);
          } else if (comArma || p.tipo === 'acerto') {
            const arma = comArma ? dx.ataques.find(a => a.uid === p.alvo) : null;
            if (comArma && !arma) { linhas.push(['Arma não escolhida ou removida do inventário', '—']); continue; }
            const pericia = arma?.pericia || periciaAtaqueLivre(p);
            const per = Object.hasOwn(dx.PER, pericia) ? dx.PER[pericia] : null;
            if (!per) { linhas.push(['Ataque: perícia não escolhida', '—']); continue; }
            const acerto = arma || per;
            const nome = arma?.nome || p.rotulo || tituloAtaqueLivre(p);
            const ataque = `${nome} (${per.nome})`;
            const margem = arma && !p.criticoProprio ? arma.margem : p.margem;
            const mult = arma && !p.criticoProprio ? arma.mult : p.mult;
            const danoProprio = formulaAtaque(p);
            const bonusAtributo = dx.atributosEfetivos[p.atributoDano] || 0;
            const formula = (danoProprio || arma?.formula || '') + (danoProprio && bonusAtributo ? comSinal(bonusAtributo) : '');
            const gruposCritico = danoProprio ? 1 : arma?.gruposCritico;
            const tipoPadrao = arma && Object.hasOwn(TIPOS_DANO, arma.tipo) ? TIPOS_DANO[arma.tipo] : '';
            const tipoBase = nomeTipoDano(arma ? p.tipoDanoArma : p.tipoDano) || tipoPadrao;
            const r = await testar({ titulo: `${m.nome} · ${ataque}`, quem: autor, dados: acerto.dados, bonus: acerto.bonus, margem, mult, gruposCritico, tipo: 'ataque' }, per.atrUsado, ficha);
            linhas.push([ataque, r.total, r.critico ? 'crítico' : '']);
            const danos = p.danosExtras.map(extra => {
              const multiplica = r.critico && extra.multiplicaCritico;
              return {
                formula: extra.formula, tipo: nomeTipoDano(extra.tipo), titulo: 'Dano extra',
                multiplicador: multiplica ? mult : 1, multiplicarExpressao: multiplica,
              };
            });
            if (formula) danos.unshift({ formula, tipo: tipoBase, multiplicador: r.critico && /d/i.test(formula) ? mult : 1, gruposCritico, titulo: 'Dano' });
            let totalDano = 0;
            for (const parte of danos) {
              const tituloDano = `${parte.titulo} · ${nome}${parte.tipo ? ` (${parte.tipo})` : ''}`;
              const dano = await rolarDanoUI({
                titulo: `${m.nome} · ${tituloDano}`, quem: autor, formula: parte.formula,
                multiplicador: parte.multiplicador, gruposCritico: parte.gruposCritico, multiplicarExpressao: parte.multiplicarExpressao,
                rotulo: parte.tipo ? `DANO DE ${parte.tipo.toUpperCase()}` : 'DANO',
              });
              if (!dano) continue;
              totalDano += dano.total;
              linhas.push([tituloDano, dano.total, parte.multiplicador > 1 ? `crítico ×${parte.multiplicador}` : '']);
            }
            if (danos.length > 1) linhas.push([`Dano total · ${nome}`, totalDano]);
          } else if (p.tipo === 'gasto') {
            if (!gastar(ficha, dx, p.valor, undefined, undefined, `Macro: ${m.nome || 'sem nome'}`)) { linhas.push([`Gastar ${p.valor} ${K}`, `sem ${K} suficiente`]); break; }
            ctx.salvarFicha(ficha); linhas.push([`Gastou ${p.valor} ${K}`, '']);
          } else {
            if (!p.formula) { linhas.push(['Fórmula vazia', '—']); continue; }
            const r = await rolarDanoUI({ titulo: `${m.nome} · ${p.rotulo || p.formula}`, quem: autor, formula: p.formula, rotulo: (p.rotulo || 'Rolagem').toUpperCase() });
            if (r) linhas.push([p.rotulo || p.formula, r.total, '']);
          }
        }
        ctx.render();
        abrirModal(`Macro · ${m.nome}`, `<div class="macro-resultado">${linhas.map(([n, t, x]) => `<div class="def-linha"><span>${esc(n)}${x ? `<small class="apagado">${esc(x)}</small>` : ''}</span><b>${esc(String(t))}</b></div>`).join('')}</div>${m.nota ? `<p class="apagado" style="margin-top:8px">${esc(m.nota)}</p>` : ''}`,
          '<button class="btn sangue" data-acao="fechar-modal">Fechar</button>');
      } catch (e) {
        console.error(e);
        ctx.avisar('Erro ao executar a macro: ' + e.message, true);
      } finally {
        estado.macroExecutando = false;
      }
    },
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
  };
}
