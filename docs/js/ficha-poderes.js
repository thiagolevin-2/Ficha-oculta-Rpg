// Abas HABILIDADES e PODERES: classe, trilha, origem, Versatilidade, afinidade, Transcender e poderes paranormais.

import { viaPoder, circuloDeAprender, origemAtiva, aumentoPermitido, derivar, normalizar, poderesParaFicha, cumpreRequisito, ehSobrevivente, temOpcional, poderesDeOutrasClasses } from './regras.js?v=0.47';
import { ATRIBUTOS, PERICIAS, PERICIA, GRAUS, NEX, CLASSES, ORIGEM, TRILHAS, TRILHA, PODER, RITUAIS, PODERES_PARANORMAIS, PODER_PARANORMAL, ORIGENS, TREINAMENTO_ESPECIAL } from './catalogo.js?v=0.47';
import { esc, sigilo, semAcento, uid } from './util.js?v=0.47';
import { estado } from './ficha-estado.js?v=0.47';
import { abrirModal, fecharModal } from './rolagem.js?v=0.47';
import { ELEM, ELEMENTOS_OPCOES, alfa, botaoUsar, botoesDados, fonteTag, hab, janelaEscolha, janelaMultipla, textoCompleto } from './ficha-base.js?v=0.47';
import { acoesFicha } from './fichaUI.js?v=0.47';

// ---------- Versatilidade (NEX 50%): quadro com o que foi escolhido ----------
export function versatilidadeEscolhida(f, d) {
  const t = TRILHA[f.escolhas.versatilidade];
  if (t) return { tipo: 'trilha', titulo: t.habilidades[0].nome, sub: `1ª habilidade da trilha ${t.nome}`, texto: t.habilidades[0].resumo };
  const p = f.poderes.find(x => x.deVersatilidade);
  if (p) {
    const nome = p.id === 'transcender' ? `Transcender${p.escolha ? ` · ${p.escolha}` : ''}` : p.id === 'proprio' ? p.nome : `${PODER[p.id]?.nome || p.id}${p.escolha ? ` (${p.escolha})` : ''}`;
    return { tipo: 'poder', titulo: nome, sub: 'poder de classe a mais', texto: p.id === 'transcender' ? 'Poder paranormal escolhido pelo Transcender.' : PODER[p.id]?.resumo || p.resumo || '' };
  }
  if (d.poderesEscolhidos > d.slotsPoder) return { tipo: 'antigo', titulo: 'Um poder de classe a mais', sub: 'usada num dos poderes de classe da lista', texto: '' };
  return null;
}
export function quadroVersatilidade(f, d) {
  if (!d.versatilidade) return '';
  const v = versatilidadeEscolhida(f, d), iv = f.poderes.findIndex(x => x.deVersatilidade);
  const aviso = !v ? '<p class="aviso-regra">⚠ Você chegou a NEX 50% e ganhou a <b>Versatilidade</b>: escolha <b>um poder de classe a mais</b> <b>ou</b> a 1ª habilidade de uma trilha da sua classe que não é a sua. Ela fica separada dos poderes de classe e não ocupa vaga deles.</p>'
    : v.tipo === 'antigo' ? '<p class="aviso-regra">⚠ Um dos poderes de classe da lista passa das vagas e provavelmente veio da Versatilidade. Toque em <b>É da Versatilidade</b> no poder certo para separá-lo.</p>' : '';
  return `<div class="quadro-versatilidade${v && v.tipo !== 'antigo' ? ' escolhida' : ''}"><div class="linha"><b>Versatilidade (NEX 50%)</b><span class="espaco"></span><button class="btn pequeno${v ? '' : ' sangue'}" data-acao="versatilidade">${v ? 'Trocar' : 'Escolher'}</button>${v?.tipo === 'poder' && iv >= 0 ? `<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${iv}" aria-label="Remover o poder da Versatilidade">✕</button>` : ''}</div>
    ${aviso}${v && v.tipo !== 'antigo' ? `<p class="quadro-versatilidade-escolha"><b>${esc(v.titulo)}</b> <span class="etiqueta">${esc(v.sub)}</span></p>${v.texto ? `<p class="apagado" style="font-size:.9rem">${esc(v.texto)}</p>` : ''}` : ''}</div>`;
}
// ---------- Aba PODERES (poderes de classe/gerais e paranormais) ----------
export function abaPoderes(f, d) {
  estado.dAtual = d;
  const transcender = registrosTranscender(f);
  const nPoderesClasse = f.poderes.filter(p => !(d.transcenderSeparado && p.id === 'transcender') && !p.deVersatilidade).length;
  const versEscolha = d.versatilidade ? versatilidadeEscolhida(f, d) : null, versOk = !!versEscolha && versEscolha.tipo !== 'antigo', versAntiga = versEscolha?.tipo === 'antigo';
  return `<div class="poderes-aba">
  ${d.versatilidade ? `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Versatilidade</h2><span class="contador ${versOk ? '' : 'erro'}">${versOk ? 1 : 0} / 1</span></div>${quadroVersatilidade(f, d)}${(() => { const i = f.poderes.findIndex(p => p.deVersatilidade && p.id === 'transcender'); return i >= 0 && !d.transcenderSeparado ? `<div class="lista-hab" style="margin-top:8px">${entradaTranscender(f.poderes[i], transcender.get(f.poderes[i].uid), i)}</div>` : ''; })()}</section>` : ''}
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Poderes de classe</h2><span class="contador ${nPoderesClasse > d.slotsPoder ? 'erro' : ''}">${nPoderesClasse} / ${d.slotsPoder}</span></div>
    <div class="lista-hab">${f.poderes.map((p, i) => { if (p.deVersatilidade && !(p.id === 'transcender' && d.transcenderSeparado)) return ''; const marcarV = versAntiga ? `<button class="btn pequeno" data-acao="marcar-versatilidade" data-i="${i}">É da Versatilidade</button>` : ''; if (p.id === 'transcender') return d.transcenderSeparado ? '' : entradaTranscender(p, transcender.get(p.uid), i); const def = PODER[p.id]; return def ? hab(def.nome + (p.escolha ? ` (${ELEM[p.escolha]?.nome || p.escolha})` : ''), def.resumo, `${PODERES_COM_ESCOLHA.includes(p.id) && !p.escolha ? `<button class="btn pequeno sangue" data-acao="poder-escolha" data-i="${i}">Escolher ${p.id.includes('elemento') ? 'elemento' : p.id === 'foco-em-pericia' ? 'perícia' : 'ritual'}</button>` : ''}${p.via ? `<span class="etiqueta">via ${esc(p.via)}</span>` : ''}${def.req ? `<small class="apagado">${esc(def.req)}</small>` : ''}${fonteTag(def.fonte)}${marcarV}<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button>`, 'poder-' + p.uid, f) : hab(p.nome, p.resumo, `${marcarV}<button class="icone-btn" data-acao="remover" data-lista="poderes" data-i="${i}" aria-label="Remover">✕</button>`, 'poder-' + p.uid, f); }).join('') || '<p class="apagado">Nenhum poder escolhido.</p>'}</div>
    <div class="linha" style="margin-top:10px"><button class="btn" data-acao="escolher-poder">+ Escolher poder</button><button class="btn fantasma" data-acao="poder-proprio">+ Poder próprio (homebrew)</button></div>
    <p class="apagado" style="font-size:.88rem;margin-top:6px">${f.modo === 'sah' ? 'No Sobrevivendo ao Horror, poderes gerais podem ser escolhidos no lugar de um poder de classe. ' : ''}Escolher <b>Transcender</b> abre a janela de poderes paranormais.</p>
  </section>
  ${secaoParanormais(f, d, transcender)}
  </div>`;
}
export function abaHabilidades(f, d) {
  const cls = CLASSES[f.classe];
  const o = ORIGEM[f.origem];
  const trilhas = TRILHAS.filter(t => t.classe === f.classe && (t.fonte !== 'SaH' || f.modo === 'sah' || t.classe === 'sobrevivente')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  return `<div class="grade c2">
  <section class="painel"><h2 class="faixa sangue">Classe · ${esc(cls.nome)}</h2>
    <div class="lista-hab">${d.habilidades.map(h => hab(h.nome, h.resumo, '', 'classe-' + h.nome, f)).join('') || '<p class="apagado">—</p>'}</div>
    ${escolhasClasse(f)}
    ${quadroVersatilidade(f, d)}
    ${f.classe === 'mundano' || ehSobrevivente(f) ? `<div class="hab" style="margin-top:10px"><span class="meta"><button class="btn pequeno usar" data-acao="treinamento-especial">Entrar para a Ordem</button></span><b>Treinamento Especial</b><p>Se a história levar o sobrevivente para a Ordem, ele vira NEX 5% de uma classe.</p></div>` : ''}
    ${f.poderes.some(p => p.id === 'flashback') && ORIGEM[f.escolhas.flashback] ? hab(`${ORIGEM[f.escolhas.flashback].poder} (Flashback)`, ORIGEM[f.escolhas.flashback].resumo, `<span class="etiqueta">${esc(ORIGEM[f.escolhas.flashback].nome)}</span>`, 'flashback', f) : ''}
    <h3 class="titulo-vermelho">Origem</h3>
    ${o ? `<button class="btn pequeno" data-acao="ver-origem" data-id="${o.id}">Ler origem no livro</button>` : ''}
    ${!origemAtiva(f) ? '<p>O poder de origem ficou fora dos benefícios escolhidos pela faixa etária.</p>' : o ? hab(o.poder, o.resumo, `<span class="etiqueta">${esc(o.nome)}</span>${fonteTag(o.fonte)}`, 'origem', f) : f.origem === 'propria' ? hab(f.origemPropria.poder || 'Poder da origem', f.origemPropria.resumo, `<span class="etiqueta">${esc(f.origemPropria.nome)}</span>`, 'origem', f) : '<p class="apagado">Sem origem.</p>'}
    <label class="campo" style="margin-top:10px"><span>Origem</span><select data-campo="origem">${['<option value="">—</option>', ...Object.values(ORIGEM).filter(x => x.fonte !== 'SaH' || f.modo === 'sah').sort((a, b) => a.nome.localeCompare(b.nome, 'pt')).map(x => `<option value="${x.id}" ${f.origem === x.id ? 'selected' : ''}>${esc(x.nome)}${x.fonte === 'SaH' ? ' (SaH)' : ''}</option>`), `<option value="propria" ${f.origem === 'propria' ? 'selected' : ''}>Origem própria</option>`].join('')}</select></label>
    ${f.origem === 'propria' ? `<div class="grade c2" style="margin-top:8px"><label class="campo"><span>Nome</span><input data-campo="origemPropria.nome" id="op-nome" value="${esc(f.origemPropria.nome)}"></label><label class="campo"><span>Poder</span><input data-campo="origemPropria.poder" id="op-poder" value="${esc(f.origemPropria.poder)}"></label><label class="campo" style="grid-column:1/-1"><span>Efeito</span><textarea data-campo="origemPropria.resumo" id="op-resumo">${esc(f.origemPropria.resumo)}</textarea></label></div>` : ''}
  </section>
  <section class="painel"><div class="titulo-secao"><h2 class="faixa">Trilha</h2>
    <select data-campo="trilha" style="max-width:240px" aria-label="Trilha"><option value="">— escolher —</option>${trilhas.map(t => `<option value="${t.id}" ${f.trilha === t.id ? 'selected' : ''}>${esc(t.nome)}${t.fonte === 'SaH' ? ' (SaH)' : ''}</option>`).join('')}</select></div>
    ${d.trilha ? `${d.trilha.aviso ? `<p class="apagado" style="font-size:.88rem">${esc(d.trilha.aviso)}</p>` : ''}<div class="lista-hab">${d.trilhaHabs.map(h => hab(h.nome, h.resumo, `<span class="etiqueta">${ehSobrevivente(f) ? `Estágio ${h.nivel}` : temOpcional(f, 'patentes') ? ['', '', 'Agente especial', '', '', '', '', '', 'Oficial', '', '', '', '', 'Elite', '', '', '', '', '', '', 'Elite'][h.nivel] : temOpcional(f, 'nivelExp') ? `Nível ${h.nivel}` : `NEX ${NEX[h.nivel - 1]}%`}</span>`, 'trilha-' + h.nome, f, !h.liberada)).join('')}</div>`
      : `<p class="apagado">Escolha a trilha ${ehSobrevivente(f) ? 'no estágio 2' : temOpcional(f, 'patentes') ? 'ao virar agente especial' : 'em NEX 10%'}.</p>`}
  </section></div>
  ${secaoAfinidade(f, d)}
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
// ---------- Afinidade elemental (Livro de Regras p. 110 e 114) ----------
// Elemento opressor (p. 98–107): Sangue oprime Conhecimento, Morte oprime Sangue, Energia oprime Morte, Conhecimento oprime Energia
export const OPRESSOR_DE = { conhecimento: 'sangue', sangue: 'morte', morte: 'energia', energia: 'conhecimento' };
export function secaoAfinidade(f, d) {
  const el = f.elementoAfinidade;
  if (!el && d.nexAtual < 50) return '';
  const nome = id => ELEM[id]?.nome || id;
  if (!el) return `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Afinidade elemental</h2><button class="btn pequeno sangue" data-acao="escolher-conexao">Escolher elemento</button></div>
    <p>NEX 50%: você se conecta a um elemento (Conhecimento, Energia, Morte ou Sangue). A escolha não muda depois. A afinidade se desenvolve no próximo poder paranormal que você receber.</p></section>`;
  const ativa = !!d.afinidade, op = OPRESSOR_DE[el];
  const comAfinidade = f.paranormais.filter(p => p.afinidade).map(p => PODER_PARANORMAL[p.id]).filter(Boolean);
  const podemReceber = f.paranormais.filter(p => !p.afinidade && poderParaAfinidade(f, PODER_PARANORMAL[p.id], el) === p).map(p => PODER_PARANORMAL[p.id]);
  const formas = f.rituais.map(r => [r, RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome))]).filter(([, c]) => c && (c.elementos?.length ? c.elementos : [c.elemento]).every(e => e === el))
    .flatMap(([r, c]) => [['discente', 'Discente'], ['verdadeiro', 'Verdadeiro']].filter(([k]) => c[k]?.afinidade).map(([, n]) => `${r.nome} (${n})`));
  const item = (titulo, texto, extra = '') => `<div class="hab${ativa ? '' : ' trancada'}"><b>${titulo}</b><p>${texto}</p>${extra}</div>`;
  return `<section class="painel painel-afinidade el-${el}${ativa ? ' ativa' : ''}" style="margin-top:14px">
    <div class="titulo-secao"><h2 class="faixa">${sigilo(el, 'var(--el)')} Afinidade · ${esc(nome(el))}</h2><span class="etiqueta">${ativa ? 'desenvolvida' : 'conectado: desenvolve no próximo poder paranormal'}</span></div>
    ${ativa ? '' : `<p class="apagado" style="font-size:.88rem">Você está conectado a ${esc(nome(el))}. Os benefícios abaixo começam quando você receber o próximo poder paranormal (Transcender, Versatilidade ou outra fonte).</p>`}
    <div class="lista-hab">
      ${item('Rituais sem componentes', `Conjura rituais de ${esc(nome(el))} sem componentes ritualísticos. Pode aprender rituais e formas que exigem afinidade com ${esc(nome(el))}.`,
        formas.length ? `<p class="apagado" style="font-size:.88rem">Formas que pedem afinidade nos seus rituais: ${formas.map(esc).join(', ')}.</p>` : '')}
      ${item('Resistência do elemento', `<b>+2d20</b> em testes contra efeitos de ${esc(nome(el))}.`)}
      ${item('Elemento opressor', `<b>−2d20</b> em testes contra efeitos de ${esc(nome(op))}, o elemento opressor de ${esc(nome(el))}.`)}
      ${item('Poderes com afinidade', `Pode escolher de novo um poder paranormal de ${esc(nome(el))} que já tem, para receber o benefício da linha “Afinidade”.`,
        `${comAfinidade.length ? `<p style="font-size:.9rem">Com afinidade: ${comAfinidade.map(p => `<b>${esc(p.nome)}</b> (${esc((p.afinidade || '').replace(/\.$/, ''))})`).join('; ')}.</p>` : ''}${podemReceber.length ? `<p class="aviso-afinidade" style="font-size:.88rem">Podem receber afinidade: ${podemReceber.map(p => esc(p.nome)).join(', ')} (aba Poderes).</p>` : ''}`)}
      ${d.progressaoNex ? item('Alterações do elemento', `Com NEX & Experiência, você recebe as alterações de ${esc(nome(el))} em NEX 60%, 75% e 90% (veja a Progressão de NEX abaixo).`) : ''}
    </div>
    <p class="apagado" style="font-size:.85rem;margin-top:8px">Livro de Regras p. 114. Os testes contra efeitos do elemento dependem da situação: some ou tire os dados na hora da rolagem.</p>
  </section>`;
}
export function secaoProgressaoNex(f, d) {
  const sel = (k, opcoes, nomes) => `<select data-campo="nexAlt.${k}" aria-label="Escolha" style="width:auto;min-height:32px;margin-top:6px"><option value="">— escolher —</option>${opcoes.map(o => `<option value="${o}" ${f.nexAlt[k] === o ? 'selected' : ''}>${esc(nomes(o))}</option>`).join('')}</select>`;
  const nomeP = id => PERICIA[id].nome, nomeA = id => ATRIBUTOS.find(a => a.id === id).nome;
  return `<section class="painel" style="grid-column:1/-1"><div class="titulo-secao"><h2 class="faixa sangue">Progressão de NEX</h2><span class="etiqueta">NEX ${d.nexAtual}%</span></div>
    <p class="apagado" style="font-size:.88rem">Mudanças que a exposição ao Outro Lado causa (Sobrevivendo ao Horror, p. 99–102). Os efeitos em números já entram na ficha.</p>
    <div class="lista-hab">${d.alteracoesNex.map(a => `<div class="hab ${a.atingida ? '' : 'trancada'}"><span class="meta"><span class="etiqueta">NEX ${a.nex}%</span></span><b>${esc(a.nome)}</b><p>${esc(a.resumo)}</p>
      ${a.atingida && a.escolha ? `<div class="linha">${sel(a.escolha, a.opcoes, nomeP)}${a.escolhaAtr ? sel(a.escolhaAtr, ['agi', 'for', 'int', 'vig'], nomeA) : ''}</div>` : ''}
      ${a.atingida && a.nex === 50 ? `<div class="linha"><select data-campo="elementoAfinidade" style="width:auto;min-height:32px;margin-top:6px" aria-label="Afinidade"><option value="">— afinidade —</option>${['sangue', 'morte', 'conhecimento', 'energia'].map(e => `<option value="${e}" ${f.elementoAfinidade === e ? 'selected' : ''}>${e[0].toUpperCase() + e.slice(1)}</option>`).join('')}</select></div>` : ''}</div>`).join('')}</div>
  </section>`;
}
export function escolhasClasse(f) {
  const perito = f.classe === 'especialista' || (f.trilha === 'esperto');
  const treinadas = PERICIAS.filter(p => (f.pericias[p.id] || 0) >= 1 && p.id !== 'luta' && p.id !== 'pontaria');
  const sel = i => `<select data-campo="escolhas.perito.${i}" aria-label="Perícia ${i + 1}" style="width:auto"><option value="">—</option>${treinadas.map(p => `<option value="${p.id}" ${f.escolhas.perito[i] === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select>`;
  let h = '';
  if (perito) h += `<div class="hab"><b>${f.classe === 'especialista' ? 'Perícias do Perito' : 'Perícias do Entendido'}</b><p>Escolha duas perícias treinadas. Ao rolá-las, aparece a opção de gastar ${f.classe === 'especialista' ? 'PE para somar o dado do Perito' : '1 PE para somar +1d4'}.</p><div class="linha" style="margin-top:6px">${sel(0)}${sel(1)}</div></div>`;
  if (ORIGEM[f.origem]?.id === 'jovem-mistico') h += `<div class="hab"><b>Números da sorte</b><p>Separe por vírgula. O botão "Usar" da origem rola 1d6 e ajusta os números sozinho.</p><input data-campo="escolhas.numeroSorte" id="esc-sorte" value="${esc(f.escolhas.numeroSorte)}" placeholder="ex.: 4" style="max-width:160px;margin-top:6px"></div>`;
  if (ORIGEM[f.origem]?.id === 'experimento') h += `<div class="hab"><b>Mutação: perícia com +2</b><div class="linha" style="margin-top:6px"><select data-campo="escolhas.experimento" style="width:auto" aria-label="Perícia da Mutação"><option value="">—</option>${PERICIAS.filter(p => ['for', 'agi', 'vig'].includes(p.atr)).map(p => `<option value="${p.id}" ${f.escolhas.experimento === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></div></div>`;
  return h ? `<div class="lista-hab" style="margin-top:10px">${h}</div>` : '';
}
export function registrosTranscender(f) {
  const escolhas = f.paranormais.filter(p => p.fonte === 'transcender');
  const porRegistro = new Map(escolhas.filter(p => p.transcenderUid).map(p => [p.transcenderUid, p]));
  const antigos = escolhas.filter(p => !p.transcenderUid);
  for (const p of f.poderes.filter(p => p.id === 'transcender' && p.escolha)) {
    if (porRegistro.has(p.uid)) continue;
    const i = antigos.findIndex(x => PODER_PARANORMAL[x.id].nome === p.escolha);
    if (i >= 0) porRegistro.set(p.uid, antigos.splice(i, 1)[0]);
  }
  return porRegistro;
}
// Uma linha curta por Transcender: o poder em si (com a descrição) aparece só em "Poderes paranormais"
export function entradaTranscender(registro, poder, i) {
  const def = PODER_PARANORMAL[poder?.id] || PODERES_PARANORMAIS.find(p => p.nome === registro.escolha);
  const nome = def?.nome || registro.escolha;
  const detalhe = poder?.escolha ? ` (${poder.escolha})` : '';
  return `<div class="hab registro-transcender"><span class="meta">${registro.deVersatilidade ? '<span class="etiqueta">Versatilidade</span>' : ''}${registro.via === 'trilha' ? '<span class="etiqueta">Ele Me Ensina</span>' : ''}<button class="icone-btn" data-acao="remover-transcender" data-i="${i}" aria-label="Remover este Transcender">✕</button></span>
    <b>Transcender → ${nome ? esc(nome + detalhe) : 'poder ainda não escolhido'}${poder?.afinidade ? ' <span class="etiqueta">afinidade</span>' : ''}</b>
    ${nome ? '<p class="apagado" style="font-size:.85rem">O poder e a descrição estão em “Poderes paranormais”, abaixo.</p>' : '<p class="apagado">Escolha o poder paranormal deste Transcender.</p><button class="btn pequeno" data-acao="transcender">Escolher poder</button>'}</div>`;
}
// Afinidade (Livro de Regras p. 110 e 114): com afinidade num elemento, escolher de novo um poder paranormal desse
// elemento dá o benefício de Afinidade. A afinidade se desenvolve na primeira vez que a personagem transcende depois
// da conexão (NEX 50%), e "transcender" é receber qualquer poder paranormal: nessa escolha o elemento já vale.
export function elementoAfinidadeDisponivel(f, d, fonte) {
  if (d.afinidade) return d.afinidade;
  return f.elementoAfinidade && d.nexAtual >= 50 ? f.elementoAfinidade : ''; // qualquer poder paranormal recebido conta como transcender
}
// O poder já escolhido que pode receber a afinidade agora (do elemento certo, ainda sem afinidade); null = não pode
export function poderParaAfinidade(f, def, el) {
  if (!el || !def?.afinidade) return null;
  const elDe = p => (def.elemento === 'variavel' ? semAcento(p.escolha || '') : def.elemento);
  const tem = f.paranormais.filter(x => x.id === def.id);
  if (tem.some(x => x.afinidade && elDe(x) === el)) return null;
  return tem.find(x => !x.afinidade && elDe(x) === el) || null;
}
// Possuído (SaH, Poder Não Desejado): a vaga de poder de ocultista só aceita Transcender (vivência de idade continua livre)
export const bloqueadoPossuido = (d, ficha, p) => !!d.possuido && p.id !== 'transcender' && viaPoder(ficha, d, p) === 'classe';
// Transcender e poderes paranormais têm contadores separados.
export function secaoParanormais(f, d, transcender) {
  const ELEM_COR = { conhecimento: 'conhecimento', energia: 'energia', morte: 'morte', sangue: 'sangue', variavel: 'variavel' };
  const lista = f.paranormais.map((p, i) => {
    const def = PODER_PARANORMAL[p.id];
    const el = def.elemento === 'variavel' ? (semAcento(p.escolha) || 'variavel') : def.elemento;
    const brilha = !p.afinidade && poderParaAfinidade(f, def, elementoAfinidadeDisponivel(f, d, 'transcender')) === p;
    return `<div class="hab el-${ELEM_COR[el] || 'variavel'}${brilha ? ' brilho-afinidade' : ''}" style="border-left-color:var(--el)"${brilha ? ` title="Afinidade disponível: 'escolha este poder de novo no próximo poder paranormal (Transcender ou + Poder paranormal)'"` : ''}><span class="meta">${sigilo(ELEM_COR[el] || 'variavel', 'var(--el)')}<span class="etiqueta">${p.fonte === 'transcender' ? 'Transcender' : p.fonte === 'origem' ? 'Origem' : 'Outro'}</span>${p.afinidade ? '<span class="etiqueta">afinidade</span>' : ''}${def.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}${estado.dAtual ? botaoUsar(def.nome, estado.dAtual) : ''}<button class="icone-btn" data-acao="remover-paranormal" data-i="${i}" aria-label="Remover ${esc(def.nome)}">✕</button></span>
      <b>${esc(def.nome)}${p.escolha ? ` (${esc(p.escolha)})` : ''}</b><p>${esc(p.afinidade ? 'Afinidade: ' + def.afinidade : def.resumo)}</p>${brilha ? `<p class="aviso-afinidade"><b>Afinidade disponível.</b> No próximo poder paranormal (Transcender ou + Poder paranormal), escolha este de novo para ganhar: ${esc(def.afinidade)}</p>` : ''}${(() => { const b = botoesDados(def.nome, def.resumo + ' ' + (p.afinidade ? def.afinidade : '') + ' ' + (textoCompleto('habilidades', def.nome) || '')); return b ? `<div class="linha" style="margin-top:6px">${b}</div>` : ''; })()}</div>`;
  }).join('');
  const T = d.transcenderes, LT = d.limiteTranscender;
  return `<section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa sangue">Poderes paranormais</h2>
      <div class="linha"><span class="contador ${T > LT ? 'erro' : ''}" title="Quantas vezes transcendeu">Transcender: ${T} usado(s) · ${d.transcenderLivres} ${d.transcenderSeparado ? 'disponível(is) pelo NEX' : 'poder(es) de classe livre(s)'}</span><span class="contador ${d.paranormaisUsados > d.limiteParanormais ? 'erro' : ''}" title="Poderes paranormais escolhidos">Paranormais: ${d.paranormaisUsados} / ${d.limiteParanormais}</span></div></div>
    <p class="apagado" style="font-size:.88rem">${d.transcenderSeparado
      ? 'Sobrevivendo ao Horror (NEX & Experiência, p. 98): Transcender não é poder de classe. Cada vez que seu NEX chega a uma faixa de alteração (25, 35, 50, 60, 75 ou 90%), você pode realizar o ritual de conexão e transcender uma vez (é opcional). Como a Sanidade vem do nível, transcender não a reduz (há uma opção mais dura na aba Notas).'
      : 'Livro de Regras: Transcender é um poder de classe. Cada um ocupa um poder de classe e você não ganha a Sanidade daquele aumento de NEX.'}
    ${d.possuido ? ` <b>Possuído:</b> ${d.pontosPossessao} pontos de possessão (3 + 2 por Transcender); novos poderes de ocultista viram Transcender.` : ''}
    ${f.elementoAfinidade ? (d.afinidade ? ` Afinidade com <b>${esc(f.elementoAfinidade)}</b> desenvolvida.` : ` Conectado a <b>${esc(f.elementoAfinidade)}</b>: a afinidade se desenvolve no próximo poder paranormal que você receber (Transcender, Versatilidade ou outra fonte).`) : ''}</p>
    ${d.transcenderSeparado && T ? `<h3 class="titulo-vermelho">Transcender</h3><div class="lista-hab">${f.poderes.map((p, i) => p.id === 'transcender' ? entradaTranscender(p, transcender.get(p.uid), i) : '').join('')}</div>` : ''}
    <div class="lista-hab">${lista || '<p class="apagado">Nenhum poder paranormal.</p>'}</div>
    <div class="linha" style="margin-top:10px"><button class="btn sangue" data-acao="transcender">Transcender</button><button class="btn" data-acao="janela-paranormal" data-fonte="${d.paranormalDaOrigem && !f.paranormais.some(p => p.fonte === 'origem') ? 'origem' : 'outro'}">+ Poder paranormal${d.paranormalDaOrigem && !f.paranormais.some(p => p.fonte === 'origem') ? ' (Traços do Outro Lado)' : ''}</button>
      <label class="campo" style="max-width:150px"><span>Extras (mestre)</span><input type="number" min="0" data-campo="bonus.paranormais" data-tipo="int" id="bonus-paranormais" value="${f.bonus.paranormais || 0}"></label></div>
  </section>`;
}
// Janela com a lista de poderes paranormais, por elemento, com pré-requisitos
export function janelaParanormal(f, d, fonte) {
  const ordem = ['variavel', 'conhecimento', 'energia', 'morte', 'sangue'];
  const nomesEl = { variavel: 'Qualquer elemento', conhecimento: 'Conhecimento', energia: 'Energia', morte: 'Morte', sangue: 'Sangue' };
  const grupos = ordem.map(el => {
    const ps = PODERES_PARANORMAIS.filter(p => p.elemento === el && (p.fonte !== 'SaH' || f.modo === 'sah')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    return `<h3 class="titulo-vermelho">${sigilo(el, 'var(--el)')} ${nomesEl[el]}</h3><div class="cartoes">${ps.map(p => {
      const tem = f.paranormais.filter(x => x.id === p.id);
      const baseAfin = poderParaAfinidade(f, p, elementoAfinidadeDisponivel(f, d, fonte));
      const afin = !!baseAfin;
      const faltas = Object.entries(p.req || {}).filter(([e, n]) => (d.porElemento[e] || 0) < n).map(([e, n]) => `${nomesEl[e]} ${n}`);
      const bloqueado = (tem.length && !p.repete && !afin) || faltas.length;
      return `<button class="cartao el-${el}${afin ? ' brilho-afinidade' : ''}" style="border-left:4px solid var(--el)" data-acao="add-paranormal" data-id="${p.id}" data-fonte="${fonte}" data-afinidade="${afin ? 1 : 0}"${afin && baseAfin.escolha ? ` data-escolha="${esc(baseAfin.escolha)}"` : ''} data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${bloqueado ? 'disabled' : ''}>
        <span class="linha"><b>${esc(p.nome)}</b><span class="espaco"></span>${p.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}</span>
        ${faltas.length ? `<small style="color:var(--perigo)">Pré: ${faltas.join(', ')} (poderes do elemento)</small>` : Object.keys(p.req || {}).length ? `<small style="color:var(--ok)">Pré: ${Object.entries(p.req).map(([e, n]) => `${nomesEl[e]} ${n}`).join(', ')}</small>` : ''}
        <small>${esc(afin ? 'AFINIDADE: ' + p.afinidade : p.resumo)}</small>${p.afinidade && !afin ? `<small class="apagado">Afinidade: ${esc(p.afinidade)}</small>` : ''}${tem.length && !afin && !p.repete ? '<small class="apagado">Já escolhido.</small>' : ''}</button>`;
    }).join('')}</div>`;
  }).join('');
  abrirModal(fonte === 'transcender' ? 'Transcender: escolha um poder paranormal' : 'Poder paranormal', `<p class="apagado">${fonte === 'transcender' ? 'Ao transcender você não ganha a Sanidade deste aumento de NEX. ' : ''}Pré-requisito "Morte 2" = já ter 2 poderes de Morte.</p><input type="search" placeholder="Procurar poder…" data-filtro-modal autofocus aria-label="Procurar poder paranormal" style="margin:8px 0">${grupos}`, '', true);
}
// Escolher um poder de OUTRA classe (Especialista Diletante, Expansão de Conhecimento)
export function janelaOutraClasse(ctx, ficha, via) {
  const d = derivar(ficha);
  janelaEscolha({ titulo: `${via}: poder de outra classe`, intro: 'Escolha um poder de classe que não é da sua classe (não vale poder de trilha nem paranormal). Ele não ocupa uma vaga de poder de classe.',
    opcoes: poderesDeOutrasClasses(ficha).map(p => ({ valor: p.id, nome: p.nome, desc: p.resumo, req: p.req, reqOk: cumpreRequisito(ficha, d, p.req), tag: `<span class="etiqueta">${CLASSES[p.classe].nome}</span>${p.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : ''}`, desabilitado: ficha.poderes.some(x => x.id === p.id) && !p.repete })),
    aoEscolher: id => { const f0 = ctx.fichaAtual(); if (!cumpreRequisito(f0, derivar(f0), PODER[id].req)) return; fecharModal(); escolhaDoPoder(ctx, f0, PODER[id], escolha => { const fx = ctx.fichaAtual(); fx.poderes.push({ id, escolha: escolha || '', via, uid: uid() }); ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`${PODER[id].nome} aprendido (${via}).`); }); } });
}
// Escolhas que alguns poderes pedem ao serem adicionados
export const PODERES_COM_ESCOLHA = ['especialista-em-elemento', 'mestre-em-elemento', 'foco-em-pericia', 'ritual-predileto'];
export function escolhaDoPoder(ctx, ficha, p, depois) {
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
// Ações (botões data-acao) da aba
export function acoesPoderes(ctx, h) {
  const { f, salvar } = h;
  return {
        'poder-escolha': el => { const ficha = f(), p = ficha.poderes[Number(el.dataset.i)]; if (!p || !PODER[p.id]) return;
      escolhaDoPoder(ctx, ficha, PODER[p.id], escolha => { const fx = f(), px = fx.poderes.find(x => x.uid === p.uid); if (px) px.escolha = escolha || ''; ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); }); },
        // ----- Poderes paranormais -----
    'transcender': el => {
      if (el?.dataset?.daLista !== '1') estado.pelaVersatilidade = false;
      const ficha = f(), d = derivar(ficha);
      const pendente = ficha.poderes.some(p => p.id === 'transcender' && !p.escolha);
      if (!pendente && !viaPoder(ficha, d, PODER.transcender)) return ctx.avisar('Não há vaga para Transcender.', true);
      janelaParanormal(ficha, d, 'transcender');
    },
        'janela-paranormal': el => janelaParanormal(f(), derivar(f()), el.dataset.fonte || 'outro'),
        'escolher-conexao': () => janelaEscolha({ titulo: 'Conexão elemental (NEX 50%)', ordenar: false,
      intro: 'Ao chegar em NEX 50%, você se conecta a uma entidade (Livro de Regras p. 124). A escolha não muda depois. A afinidade se desenvolve no próximo poder paranormal que você receber.',
      opcoes: ELEMENTOS_OPCOES.map(([v, n, x]) => ({ valor: v, nome: n, desc: x, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)' })),
      aoEscolher: v => { const ficha = f(); ficha.elementoAfinidade = v; ficha.afinidadeAtiva = false; fecharModal(); salvar(); ctx.avisar(`Conectado a ${v}.`); } }),
        'add-paranormal': el => {
      const ficha = f(), def = PODER_PARANORMAL[el.dataset.id];
      if (!def) return;
      let escolha = '';
      if (def.escolheElemento && !el.dataset.escolha) return janelaEscolha({ titulo: 'Resistir a Elemento', intro: 'Escolha o elemento: você recebe resistência 10 contra ele (20 com afinidade). Conta como poder desse elemento.',
        opcoes: ELEMENTOS_OPCOES.map(([v, n, x]) => ({ valor: n, nome: n, desc: x, classe: `el-${v}`, estilo: 'border-left:4px solid var(--el)' })),
        aoEscolher: n => acoesFicha(ctx)['add-paranormal']({ dataset: { ...el.dataset, escolha: n } }) });
      if (el.dataset.escolha) escolha = el.dataset.escolha;
      if (def.id === 'aprender-ritual' && ficha.paranormais.filter(p => p.id === def.id).length >= ficha.atributos.int) return ctx.avisar('O limite de Aprender Ritual é o Intelecto.', true);
      const fonte = el.dataset.fonte || 'outro';
      let registro;
      if (fonte === 'transcender') {
        registro = ficha.poderes.findLast(p => p.id === 'transcender' && !p.escolha);
        if (!registro) {
          if (!viaPoder(ficha, derivar(ficha), PODER.transcender)) return ctx.avisar('Não há vaga para Transcender.', true);
          registro = { id: 'transcender', escolha: '', uid: uid(), via: viaPoder(ficha, derivar(ficha), PODER.transcender) === 'trilha' ? 'trilha' : '', deVersatilidade: estado.pelaVersatilidade && !ficha.poderes.some(x => x.deVersatilidade) };
          estado.pelaVersatilidade = false;
          ficha.poderes.push(registro);
        }
        registro.escolha = def.nome;
      }
      ficha.paranormais.push({ uid: uid(), id: def.id, escolha, circuloAprender: def.id === 'aprender-ritual' ? circuloDeAprender(derivar(ficha).nexAtual) : 0, afinidade: el.dataset.afinidade === '1', fonte, transcenderUid: registro?.uid || '' });
      const desenvolveu = !!ficha.elementoAfinidade && !ficha.afinidadeAtiva && derivar(ficha).nexAtual >= 50; // LR p. 110: transcende sempre que recebe um poder paranormal
      if (desenvolveu) ficha.afinidadeAtiva = true;
      fecharModal(); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render();
      ctx.avisar(`${def.nome}${el.dataset.afinidade === '1' ? ' (afinidade)' : ''} adicionado.${desenvolveu ? ` Você transcendeu e desenvolveu afinidade com ${ficha.elementoAfinidade}.` : ''}`);
      if (def.acao === 'aprender-ritual') { ctx.estado.ui.aba = 'rituais'; ctx.render(); ctx.avisar('Aprender Ritual: marque o ritual na lista do Grimório.'); }
      if (def.id === 'expansao-de-conhecimento') janelaOutraClasse(ctx, f(), 'Expansão de Conhecimento');
    },
        'remover-paranormal': el => {
      const ficha = f(), i = Number(el.dataset.i), p = ficha.paranormais[i];
      if (!p) return;
      const porRegistro = registrosTranscender(ficha);
      const registro = ficha.poderes.find(t => porRegistro.get(t.uid) === p);
      if (!confirm(`Remover "${PODER_PARANORMAL[p.id].nome}"?${registro ? ' O Transcender que deu este poder também sai, e a vaga fica livre.' : ''}`)) return;
      if (registro) ficha.poderes = ficha.poderes.filter(t => t !== registro);
      ficha.paranormais.splice(i, 1); salvar();
    },
        'remover-transcender': el => {
      const ficha = f(), registro = ficha.poderes[Number(el.dataset.i)];
      if (registro?.id !== 'transcender') return;
      const associado = registrosTranscender(ficha).get(registro.uid);
      if (!confirm(associado ? `Remover este Transcender e o poder "${PODER_PARANORMAL[associado.id].nome}"? A vaga fica livre.` : 'Remover este Transcender? A vaga fica livre.')) return;
      if (associado) ficha.paranormais = ficha.paranormais.filter(p => p !== associado);
      ficha.poderes = ficha.poderes.filter(t => t !== registro); salvar();
    },
        'add-propria': () => { const ficha = f(); ficha.habilidadesProprias.push({ uid: uid(), nome: 'Nova habilidade', resumo: '', custo: '' }); salvar(); },
        'escolher-poder': el => {
      estado.pelaVersatilidade = el?.dataset?.versatilidade === '1';
      const ficha = f(), d = derivar(ficha);
      const lista = poderesParaFicha(ficha).filter(p => !(d.transcenderSeparado && p.id === 'transcender')).sort(alfa);
      const grupos = [['Classe', p => p.classe === ficha.classe], ['Todas as classes', p => p.classe === 'todas'], ['Gerais (SaH)', p => p.classe === 'geral' || (p.classe !== ficha.classe && p.classe !== 'todas')]];
      abrirModal(estado.pelaVersatilidade ? 'Versatilidade: escolha um poder de classe' : 'Escolher poder', `<input type="search" placeholder="Procurar poder…" data-filtro-modal autofocus aria-label="Procurar poder" style="margin-bottom:10px">
        ${grupos.map(([nome, fn]) => { const ps = lista.filter(fn); return ps.length ? `<h3 class="titulo-vermelho">${nome}</h3><div class="cartoes">${ps.map(p => { const tem = ficha.poderes.some(x => x.id === p.id); const ok = cumpreRequisito(ficha, d, p.req); return `<button class="cartao" data-acao="add-poder" data-id="${p.id}" data-busca="${esc(semAcento(p.nome + ' ' + p.resumo))}" ${!ok || !viaPoder(ficha, d, p) || (tem && !p.repete) || bloqueadoPossuido(d, ficha, p) ? 'disabled' : ''}><span class="linha"><b>${esc(p.nome)}</b><span class="espaco"></span>${fonteTag(p.fonte)}</span>${p.req ? `<small style="color:${ok ? 'var(--ok)' : 'var(--perigo)'}">Pré: ${esc(p.req)}</small>` : ''}<small>${esc(p.resumo)}</small>${bloqueadoPossuido(d, ficha, p) ? '<small class="apagado">Possuído: novos poderes de ocultista viram Transcender.</small>' : ''}</button>`; }).join('')}</div>` : ''; }).join('')}`, '', true);
    },
        'add-poder': el => {
      const ficha = f(), p = PODER[el.dataset.id], d = derivar(ficha);
      if (p && !p.repete && ficha.poderes.some(x => x.id === p.id)) return ctx.avisar('Este poder já foi aprendido.');
      if (!p || !poderesParaFicha(ficha).some(x => x.id === p.id) || !cumpreRequisito(ficha, d, p.req)) return ctx.avisar('Pré-requisitos do poder não cumpridos.', true);
      if (!viaPoder(ficha, d, p)) return ctx.avisar('Não há uma vaga disponível para este poder.', true);
      if (bloqueadoPossuido(d, ficha, p)) return ctx.avisar('Possuído (Poder Não Desejado): todo novo poder de ocultista vira Transcender.', true);
      if (p.id === 'transcender') { fecharModal(); return acoesFicha(ctx)['transcender']({ dataset: { daLista: '1' } }); }
      escolhaDoPoder(ctx, ficha, p, escolha => {
        const fx = f(), via = viaPoder(fx, derivar(fx), p);
        if (!via) return ctx.avisar('Não há uma vaga disponível para este poder.', true);
        fx.poderes.push({ id: p.id, escolha: escolha || '', via: via === 'vivencia' ? via : '', deVersatilidade: estado.pelaVersatilidade && !fx.poderes.some(x => x.deVersatilidade), uid: uid() }); estado.pelaVersatilidade = false;
        ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`${p.nome}${escolha ? ` (${escolha})` : ''} adicionado.`);
      });
    },
        'marcar-versatilidade': el => { const fx = f(), p = fx.poderes[Number(el.dataset.i)]; if (!p) return; for (const x of fx.poderes) x.deVersatilidade = false; p.deVersatilidade = true; fx.escolhas.versatilidade = ''; salvar(); ctx.avisar('Poder separado como Versatilidade.'); },
        // Versatilidade (NEX 50%): poder de classe OU 1ª habilidade de outra trilha da sua classe
    'versatilidade': () => { try {
      const ficha = f();
      const trilhas = TRILHAS.filter(t => t.classe === ficha.classe && t.id !== ficha.trilha && (t.fonte !== 'SaH' || ficha.modo === 'sah'));
      janelaEscolha({ titulo: 'Versatilidade', intro: 'Em NEX 50% você escolhe: um poder de classe extra, OU a primeira habilidade de uma trilha da sua classe que não é a sua.',
        opcoes: [{ valor: '__poder', nome: 'Um poder de classe a mais', desc: 'Abre a lista de poderes da sua classe. Ele usa a vaga da Versatilidade.' }, ...trilhas.map(t => ({ valor: t.id, nome: `${t.habilidades[0].nome} (trilha ${t.nome})`, desc: t.habilidades[0].resumo, tag: t.fonte === 'SaH' ? '<span class="etiqueta sah">SaH</span>' : '' }))],
        aoEscolher: v => { const fx = f(); for (const p of fx.poderes) p.deVersatilidade = false; if (v === '__poder') { fx.escolhas.versatilidade = ''; salvar(); fecharModal(); return acoesFicha(ctx)['escolher-poder']({ dataset: { versatilidade: '1' } }); } fx.escolhas.versatilidade = v; ctx.salvarFicha(normalizar(fx)); Object.assign(fx, normalizar(fx)); fecharModal(); ctx.render(); ctx.avisar(`Versatilidade: ${TRILHA[v].habilidades[0].nome}.`); } });
    } catch (e) { console.error(e); ctx.avisar('Não consegui abrir a Versatilidade: ' + e.message, true); } },
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
    'treinamento-especial': () => f().classe === 'mundano' ? janelaEscolha({
      titulo: 'Treinamento do Mundano', intro: 'Escolha a classe. Em seguida, escolha os benefícios do treinamento concluído. Uma nova ficha será criada.',
      opcoes: ['combatente', 'especialista', 'ocultista'].map(c => ({ valor: c, nome: CLASSES[c].nome })),
      aoEscolher: classe => acoesFicha(ctx)['mundano-beneficios']({ dataset: { classe } }),
    }) : janelaEscolha({ titulo: 'Treinamento Especial', intro: 'Quando a história levar o sobrevivente para a Ordem, ele vira NEX 5% de uma classe. Isto cria uma CÓPIA da ficha na classe escolhida (a original fica guardada). Ajuste os PV/PE extras em "Ajustes manuais" se o mestre pedir.',
      opcoes: ['combatente', 'especialista', 'ocultista'].map(c => ({ valor: c, nome: CLASSES[c].nome, desc: TREINAMENTO_ESPECIAL[c] })),
      aoEscolher: c => { const fx = f(); const nova = normalizar({ ...structuredClone(fx), id: uid(), classe: c, trilha: '', nex: 5, nivel: 1, nome: fx.nome, habilidadesProprias: [...fx.habilidadesProprias, { nome: 'Passado de Sobrevivente', resumo: `Estágio ${fx.estagio}, trilha ${TRILHA[fx.trilha]?.nome || '—'}. Mantém as habilidades já recebidas.` }], recursos: {} }); ctx.adicionarFicha(nova); fecharModal(); location.hash = '#/agente/' + nova.id; ctx.avisar(`Ficha de ${CLASSES[c].nome} criada a partir do sobrevivente.`); } }),
        'mundano-beneficios': el => {
      const ficha = f(), classe = el.dataset.classe;
      if (ficha.classe !== 'mundano' || !['combatente', 'especialista', 'ocultista'].includes(classe)) return;
      const opAtr = ATRIBUTOS.filter(a => aumentoPermitido(ficha, a.id, 3));
      const select = (id, titulo, opcoes) => `<label class="campo"><span>${titulo}</span><select id="${id}"><option value="">—</option>${opcoes.map(x => `<option value="${x.id}">${x.nome}</option>`).join('')}</select></label>`;
      const grupos = classe === 'combatente' ? [['luta', 'pontaria'], ['fortitude', 'reflexos']] : [];
      abrirModal('Benefícios do treinamento', `<div class="grade c2">${select('mund-atr', 'Atributo +1', opAtr)}
        ${grupos.map((ids, i) => select(`mund-fixa-${i}`, 'Perícia do treinamento', ids.map(id => PERICIA[id]))).join('')}</div>
        ${classe !== 'combatente' ? `<p>Escolha ${classe === 'especialista' ? 6 : 2} perícias adicionais disponíveis.</p><div class="grade c3">${PERICIAS.filter(p => !ficha.pericias[p.id] && !(classe === 'ocultista' && ['ocultismo', 'vontade'].includes(p.id))).map(p => `<label class="check"><input type="checkbox" data-mund-pericia="${p.id}"><span>${p.nome}</span></label>`).join('')}</div>` : ''}
        <label class="check"><input type="checkbox" id="mund-parcial"> Treinamento parcial aprovado pelo mestre</label>`,
        `<button class="btn sangue" data-acao="mundano-confirmar" data-classe="${classe}">Criar ficha de NEX 5%</button>`, true);
    },
        'mundano-confirmar': el => {
      const ficha = f(), classe = el.dataset.classe;
      if (ficha.classe !== 'mundano' || !['combatente', 'especialista', 'ocultista'].includes(classe)) return;
      const id = document.getElementById('mund-atr')?.value;
      const parcial = document.getElementById('mund-parcial')?.checked;
      const ids = classe === 'combatente' ? [0, 1].map(i => document.getElementById(`mund-fixa-${i}`)?.value).filter(Boolean)
        : [...new Set([...document.querySelectorAll('[data-mund-pericia]:checked')].map(x => x.dataset.mundPericia))];
      const n = classe === 'especialista' ? 6 : 2;
      if (ids.length > n || (!parcial && (ids.length !== n || !id))) return ctx.avisar(`Escolha o atributo e ${n} perícias para o treinamento completo.`, true);
      const nova = normalizar({ ...structuredClone(ficha), id: uid(), classe, nex: 5, recursos: {} });
      if (ATRIBUTOS.some(a => a.id === id) && aumentoPermitido(ficha, id, 3)) nova.atributos[id]++;
      for (const p of [...ids, ...(classe === 'ocultista' ? ['ocultismo', 'vontade'] : [])]) {
        if (PERICIA[p]) nova.pericias[p] = Math.max(1, nova.pericias[p] || 0);
      }
      nova.treinoOutrasFontes = [...new Set([...nova.treinoOutrasFontes, ...ids, ...(classe === 'ocultista' ? ['ocultismo', 'vontade'] : [])])];
      if (parcial) nova.notas += '\nTreinamento parcial: confira com o mestre quais benefícios de classe, recursos e proficiências foram concedidos.';
      ctx.adicionarFicha(nova); fecharModal(); location.hash = '#/agente/' + nova.id;
    },
        'poder-proprio': () => { const ficha = f(); const nome = prompt('Nome do poder (ex.: poder paranormal "Sangue de Ferro")'); if (!nome) return; ficha.poderes.push({ id: 'proprio', nome, resumo: '', uid: uid() }); salvar(); },
  };
}
