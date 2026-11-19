// Tela da FICHA: monta a página do agente e junta as ações e caixinhas de todas as abas.
// Cada aba fica no seu arquivo (ficha-agente.js, ficha-combate.js, ficha-rituais.js…); as peças comuns, em ficha-base.js.

import { faixaEtaria, PESOS_IDADE, derivar, normalizar, ehSobrevivente, temOpcional } from './regras.js?v=0.47';
import { MODOS, CLASSES, ORIGEM, RITUAIS } from './catalogo.js?v=0.47';
import { esc } from './util.js?v=0.47';
import { estado } from './ficha-estado.js?v=0.47';
import { abaAgente, acoesAgente } from './ficha-agente.js?v=0.47';
import { abaCombate, acoesCombate } from './ficha-combate.js?v=0.47';
import { abaMacros, abaRolagens, acoesMacros } from './ficha-macros.js?v=0.47';
import { abaHabilidades, abaPoderes, acoesPoderes } from './ficha-poderes.js?v=0.47';
import { abaRituais, acoesRituais, atualizarEtapaSimbolo, janelaPreviaRitual } from './ficha-rituais.js?v=0.47';
import { abaInventario, acoesInventario } from './ficha-inventario.js?v=0.47';
import { abaNotas, acoesNotas } from './ficha-notas.js?v=0.47';
import { ABAS, avisosDeRegra, ferramentasFicha } from './ficha-base.js?v=0.47';

// ---------- Tela ----------
// O app.js importa daqui: estas vêm de outros arquivos da ficha
export { carregarTextos } from './ficha-base.js?v=0.47';
export { filtrarRitualDesconhecido } from './ficha-rituais.js?v=0.47';

export function telaFicha(f, ui) {
  const d = derivar(f);
  estado.dAtual = d;
  const aba = ui.aba || 'agente';
  const corpo = ({ agente: abaAgente, combate: abaCombate, rolagens: abaRolagens, macros: (fx, dx) => abaMacros(fx, dx), habilidades: abaHabilidades, poderes: abaPoderes, rituais: abaRituais, inventario: abaInventario, notas: abaNotas }[aba] || abaAgente)(f, d, ui);
  return `<div class="pagina pagina-ficha">
  ${f.morto ? '<p class="etiqueta alerta" role="status">Agente morto</p>' : ''}
  <div class="ficha-identificador"><span>DOSSIÊ DE AGENTE / REGISTRO INDIVIDUAL</span><span class="selo">CONFIDENCIAL</span></div>
  ${cabecalho(f, d)}
  ${aba !== 'agente' ? avisosDeRegra(d) : ''}
  <nav class="abas" role="tablist" data-guardar-rolagem="abas">${ABAS.map(([id, nome]) => `<button role="tab" data-acao="aba" data-aba="${id}" aria-selected="${aba === id}">${nome}</button>`).join('')}</nav>
  <div class="secao-aba"><span>${String(ABAS.findIndex(([id]) => id === aba) + 1).padStart(2, '0')} / ${esc(ABAS.find(([id]) => id === aba)?.[1] || 'Agente')}</span><small>ARQUIVO PESSOAL · ALTERAÇÕES SALVAS AUTOMATICAMENTE</small></div>
  <div class="conteudo-aba">${corpo}</div></div>`;
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
// Junta as ações de todas as abas (cada aba guarda as suas no próprio arquivo)
export function acoesFicha(ctx) {
  const h = ferramentasFicha(ctx);
  return { ...acoesAgente(ctx, h), ...acoesMacros(ctx, h), ...acoesPoderes(ctx, h), ...acoesCombate(ctx, h), ...acoesNotas(ctx, h), ...acoesInventario(ctx, h), ...acoesRituais(ctx, h) };
}
// Caixinhas (checkbox) da ficha
export function checksFicha(ctx) {
  const f = () => ctx.fichaAtual();
  return {
    'conj-etapa': () => atualizarEtapaSimbolo(),
    // ritual desconhecido: o botão Conjurar só destrava com as informações confirmadas (SaH p. 117)
    'conj-info': el => { const b = document.querySelector('.modal [data-acao="conjurar-confirmar"][data-desconhecido]'); if (b) b.disabled = !el.checked; },
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
