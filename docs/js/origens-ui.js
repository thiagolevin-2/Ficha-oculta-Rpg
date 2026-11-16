import { ORIGEM, PERICIA } from './catalogo.js?v=0.23';
import { abrirModal } from './rolagem.js?v=0.23';
import { esc } from './util.js?v=0.23';

let consulta;
function carregarOrigens() {
  consulta ||= fetch(new URL('../dados/origens-texto.json?v=0.23', import.meta.url))
    .then(resposta => {
      if (!resposta.ok) throw new Error('Descrições indisponíveis.');
      return resposta.json();
    }).catch(() => { consulta = undefined; return {}; });
  return consulta;
}

export function corpoOrigem(origem, fonte) {
  const pericias = origem.pericias.map(id => PERICIA[id]?.nome || 'À escolha').join(' · ');
  const livro = fonte?.livro === 'base' ? 'Livro de Regras v1.3'
    : fonte?.livro === 'sah' ? 'Sobrevivendo ao Horror'
    : fonte?.livro ? `Arquivos Secretos nº ${fonte.livro.slice(2)}` : '';
  const pagina = fonte ? fonte.pagina - (fonte.livro === 'base' ? 10 : fonte.livro === 'sah' ? 1 : 0) : 0;
  const detalhe = fonte?.texto
    ? `<p class="texto-completo" style="white-space:pre-line">${esc(fonte.texto)}</p>`
    : fonte?.imagens?.length
      ? `<p>${esc(origem.resumo)}</p><div class="origem-facsimile">${fonte.imagens.map((img, i) => `<img loading="eager" src="assets/origens-sah/${esc(img)}" alt="${esc(origem.nome)} — texto do livro${fonte.imagens.length > 1 ? `, parte ${i + 1}` : ''}">`).join('')}</div>`
      : `<p>${esc(origem.resumo)}</p><p class="apagado">A descrição do livro ficou indisponível. Abra o Acervo para consultar a origem.</p>`;
  return `<p><b>Perícias:</b> ${esc(pericias)}<br><b>Poder:</b> ${esc(origem.poder)}</p>${detalhe}
    ${fonte ? `<p><a href="#/acervo/${esc(fonte.livro)}/${Number(fonte.pagina)}">${esc(livro)} · p. ${pagina}</a></p>` : ''}`;
}

export async function abrirOrigem(id, noCriador = false) {
  const origem = ORIGEM[id];
  if (!origem) return;
  const fontes = await carregarOrigens();
  const rodape = noCriador
    ? `<button class="btn fantasma" data-acao="fechar-modal">Voltar</button><button class="btn sangue" data-acao="cri-origem" data-id="${esc(id)}">Escolher esta origem</button>`
    : '<button class="btn sangue" data-acao="fechar-modal">Fechar</button>';
  abrirModal(origem.nome, corpoOrigem(origem, fontes[id]), rodape, true);
}
