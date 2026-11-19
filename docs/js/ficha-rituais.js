// Aba RITUAIS: grimório, prévia, cartões e a janela de conjurar (conjuração complexa, reter, ritual desconhecido) em etapas.

import { perfilRitual, podeResolverRitual, problemaAoAprender, derivar, normalizar, temOpcional, opcoesGasto } from './regras.js?v=0.47';
import { sofrerDano, recuperar, marcarCondicao, adicionarMarcador, rolar, analisar } from './combate.js?v=0.47';
import { ATRIBUTOS, ELEMENTOS, CIRCULOS, CONDICOES, RITUAIS } from './catalogo.js?v=0.47';
import { esc, sigilo, semAcento, inteiro, uid } from './util.js?v=0.47';
import { faltasDaForma, formaLiberada, protecaoVestida, requisitoForma, formaRitual, custoDaForma, duracaoCena, MATERIAL_ELEMENTO, efeitoElemental, V, VERSOES_RITUAL, NOME_FORMA, versoesDoRitual, versaoEscolhida, motivoEfeito, ondeEfeitoVale, maisUmDado, DESASTRES } from './rituais-regras.js?v=0.47';
import { estado } from './ficha-estado.js?v=0.47';
import { rolarTesteUI, rolarDanoUI, oferecerEfeitoRitual, abrirModal, fecharModal, proxima } from './rolagem.js?v=0.47';
import { ELEM, abrirPaginaSah, alvoDeFicha, blocoOcr, fonteTag, formulaDaForma, gastar, janelaEscolha, nomesElementos, opcoesAlvos, textoCompleto, textoOcr } from './ficha-base.js?v=0.47';
import { estaEquipado, temConjuracao } from './ficha-inventario.js?v=0.47';
import { acoesFicha } from './fichaUI.js?v=0.47';

// ---------- Aba RITUAIS ----------
// Pedido do projeto: cada ritual tem a SUA caixinha de seleção na cor do elemento.
export function abaRituais(f, d, ui) {
  const filtro = ui.ritFiltro || { busca: '', elemento: '', circulo: '' };
  const conhecidos = new Set(f.rituais.map(r => semAcento(r.nome) + '|' + r.elemento));
  const lista = RITUAIS.filter(r => (r.fonte !== 'SaH' || f.modo === 'sah')
    && (!filtro.elemento || (r.elementos || [r.elemento]).includes(filtro.elemento)) && (!filtro.circulo || r.circulo === Number(filtro.circulo))
    && (!filtro.busca || semAcento(r.nome + ' ' + r.resumo).includes(semAcento(filtro.busca)))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  const podeConjurar = f.classe === 'ocultista' || f.rituais.length > 0 || (f.trilha === 'esoterico');
  const porCirculo = [1, 2, 3, 4].map(c => ({ c, itens: f.rituais.map((r, i) => [r, i]).filter(([r]) => r.circulo === c) }));
  const lim = d.limiteRituais, qtd = f.rituais.length;
  const kR = d.pd ? 'PD' : 'PE';
  const retidos = temOpcional(f, 'reterRitual') && f.rituaisRetidos.length ? `<section class="painel" style="margin-bottom:14px"><div class="titulo-secao"><h2 class="faixa">Rituais retidos</h2><span class="etiqueta">${d.peRetido} ${kR} retidos · máximo ${d.pd ? d.pdMax : d.pe}</span></div>
    <div class="lista-hab">${f.rituaisRetidos.map((r, i) => `<div class="hab"><span class="meta"><button class="btn pequeno" data-acao="soltar-ritual" data-i="${i}" title="Ação livre ou reação">Soltar</button><button class="btn pequeno sangue" data-acao="soltar-ritual-calma" data-i="${i}" title="Ação padrão">Soltar com calma (Ocultismo DT ${20 + r.custo})</button></span><b>${esc(r.nome)}</b><p>${r.custo} ${kR} retidos. Enquanto estiver retido, o efeito continua.</p></div>`).join('')}</div>
    <p class="apagado" style="font-size:.88rem">Reter Ritual (AS #01 p. 58): soltar devolve os ${kR} máximos, mas não os atuais; com calma, se passar no Ocultismo, devolve os dois. Ficar atordoado, exausto ou pasmo solta tudo. Os ${kR} retidos não contam no limite por turno.</p></section>` : '';
  return `${retidos}<section class="painel"><div class="titulo-secao"><h2 class="faixa sangue">Rituais conhecidos</h2>
    <div class="linha"><span class="contador marcador-rituais ${lim && qtd > lim ? 'erro' : ''}" title="Rituais conhecidos / que pode conhecer">${qtd} / ${lim || '—'} rituais</span><span class="etiqueta">DT ${d.dtRitual}</span><span class="etiqueta">Círculo máx. ${d.circuloMax}º</span>${f.poderes.filter(p => p.id === 'especialista-em-elemento' && p.escolha).map(p => `<span class="etiqueta el-${p.escolha}" style="border-color:var(--el)">Especialista em ${esc(ELEM[p.escolha]?.nome || p.escolha)}: +2 DT</span>`).join('')}${f.poderes.filter(p => p.id === 'mestre-em-elemento' && p.escolha).map(p => `<span class="etiqueta el-${p.escolha}" style="border-color:var(--el)">Mestre em ${esc(ELEM[p.escolha]?.nome || p.escolha)}: −1 ${d.pd ? 'PD' : 'PE'}</span>`).join('')}<button class="btn pequeno" data-acao="ritual-proprio">+ Ritual próprio</button></div></div>
    ${quadroCirculos(f, d)}
    ${temOpcional(f, 'conjuracaoComplexa') ? `<button class="btn sangue btn-desconhecido" data-acao="ritual-desconhecido-lista">${sigilo('medo', 'currentColor')}<span><b>Conjurar ritual que não conheço</b><small>Conjuração complexa · treinado em Ocultismo · DT +5 · desastre paranormal se falhar</small></span><span class="seta" aria-hidden="true">›</span></button>` : ''}
    ${!podeConjurar ? '<p class="apagado">Só ocultistas conjuram rituais desde o início (outros podem aprender por poderes, trilhas ou origem).</p>' : ''}
    ${qtd ? porCirculo.filter(g => g.itens.length).map(g => `<h3 class="titulo-vermelho">${g.c}º círculo <small class="apagado">· ${CIRCULOS[g.c - 1].custo} ${d.pd ? 'PD' : 'PE'}</small></h3><div class="rituais-compactos">${g.itens.map(([r, i]) => cartaoRitual(f, d, r, i)).join('')}</div>`).join('') : '<p class="vazio">Nenhum ritual. Marque as caixinhas na lista abaixo.</p>'}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">Toque num ritual para ver tudo. Conjurar faz sozinho o teste de Ocultismo (DT 20 + custo; menos para Medo). ${f.classe === 'ocultista' && !temOpcional(f, 'patentes') ? 'Ocultista: 3 rituais de 1º círculo no início e +1 a cada NEX.' : ''}</p>
    <label class="campo" style="max-width:200px"><span>Rituais extras (mestre)</span><input type="number" min="0" data-campo="bonus.rituais" data-tipo="int" id="bonus-rituais" value="${f.bonus.rituais || 0}"></label>
  </section>
  <section class="painel" style="margin-top:14px"><div class="titulo-secao"><h2 class="faixa">Grimório</h2><span class="apagado">${lista.length} rituais · toque num ritual para ver tudo antes de aprender</span></div>
    <div class="linha" style="margin-bottom:12px">
      <input type="search" class="filtro" placeholder="Procurar ritual…" data-rit-filtro="busca" id="rit-busca" value="${esc(filtro.busca)}" aria-label="Procurar ritual">
      <select data-rit-filtro="elemento" style="width:auto" aria-label="Elemento"><option value="">Todos os elementos</option>${ELEMENTOS.map(e => `<option value="${e.id}" ${filtro.elemento === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
      <select data-rit-filtro="circulo" style="width:auto" aria-label="Círculo"><option value="">Todos os círculos</option>${CIRCULOS.map(c => `<option value="${c.n}" ${Number(filtro.circulo) === c.n ? 'selected' : ''}>${c.n}º círculo</option>`).join('')}</select>
    </div>
    <div class="caixas-ritual">${lista.map(r => {
      const marcado = conhecidos.has(semAcento(r.nome) + '|' + r.elemento);
      const acima = r.circulo > d.circuloMax;
      return `<label class="caixa-ritual el-${r.elemento} ${marcado ? 'marcada' : ''} ${acima ? 'acima' : ''}">
        <input type="checkbox" data-acao-check="ritual-catalogo" data-id="${r.id}" data-elemento="${r.elemento}" ${marcado ? 'checked' : ''} aria-label="${esc(r.nome)} (${nomesElementos(r)}, ${r.circulo}º círculo)">
        <span class="caixa-check" aria-hidden="true"></span>
        ${sigilo(r.elemento, 'var(--el)')}
        <span class="txt"><b>${esc(r.nome)}</b> <small class="dossie-txt">${nomesElementos(r)} ${r.circulo}${fonteTag(r.fonte)}</small><small>${textoCompleto('rituais', r.nome) ? 'Texto integral disponível' : textoOcr('rituais', r.nome) ? 'Texto do OCR disponível (conferir)' : 'Descrição integral pendente — consulte o livro'}</small>${acima ? '<small class="aviso-circulo">Círculo acima do seu acesso</small>' : ''}</span>
      </label>`;
    }).join('')}</div>
  </section>`;
}
// Janela de PRÉ-VISUALIZAÇÃO (grimório): tocar num ritual mostra tudo antes de ele entrar nos rituais conhecidos.
export const chaveRitual = r => semAcento(r.nome) + '|' + r.elemento;
export function janelaPreviaRitual(f, d, r) {
  const k = d.pd ? 'PD' : 'PE';
  const conhecido = f.rituais.some(x => chaveRitual(x) === chaveRitual(r));
  const custo = CIRCULOS[r.circulo - 1]?.custo ?? 0;
  const texto = textoCompleto('rituais', r.nome), ocr = !texto ? textoOcr('rituais', r.nome) : null;
  const afinidade = (r.elementos?.length ? r.elementos : [r.elemento]).every(el => d.afinidade === el);
  const lim = d.limiteRituais, qtd = f.rituais.length;
  const ficha = [['Execução', r.execucao], ['Alcance', r.alcance], ['Alvo', r.alvo], ['Área', r.area], ['Efeito', r.efeitoArea], ['Duração', r.duracao], ['Resistência', r.resistencia]].filter(([, v]) => v);
  const formas = [['discente', 'Discente'], ['verdadeiro', 'Verdadeiro']].filter(([id]) => r[id]).map(([id, nome]) => {
    const fo = r[id], pode = formaLiberada(faltasDaForma(fo, r, d));
    const req = requisitoForma(fo, r);
    return `<li><b>${nome}</b> +${fo.custo} ${k} <span class="apagado">(total ${custo + fo.custo} ${k})</span> · <small>${req ? `requer ${req}` : 'sem requisito adicional'}</small>${pode ? '' : ' <small class="aviso-circulo">você ainda não pode usar</small>'}</li>`;
  });
  const problema = conhecido ? '' : problemaAoAprender(f, d, r);
  const avisos = [
    problema,
    r.circulo > d.circuloMax ? `Este ritual é de ${r.circulo}º círculo e seu acesso hoje vai até o ${d.circuloMax}º.` : '',
    r.ritualExigido && !f.rituais.some(x => x.nome === r.ritualExigido) ? `Exige conhecer ${r.ritualExigido}.` : '',
    !conhecido && lim && qtd >= lim ? `Você já conhece ${qtd} de ${lim} rituais possíveis.` : '',
    r.elemento === 'variavel' ? 'Elemento variável: escolha o elemento no cartão do ritual depois de aprender.' : '',
  ].filter(Boolean);
  const corpo = `<div class="previa-ritual el-${r.elemento}">
    <div class="cab-previa">${sigilo(r.elemento, 'var(--el)')}<div><b>${esc(nomesElementos(r))} · ${r.circulo}º círculo</b>${fonteTag(r.fonte)}
      <p class="apagado">${esc(r.resumo || '')}</p></div></div>
    <div class="linha"><span class="etiqueta">Custo ${custo} ${k}</span><span class="etiqueta">DT ${d.dtRitual}</span>${conhecido ? '<span class="etiqueta">Já conhecido</span>' : ''}</div>
    ${ficha.length ? `<dl class="ficha-ritual">${ficha.map(([rot, v]) => `<dt>${rot}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
    ${r.dados ? `<div class="linha dano-previa"><span class="etiqueta">${r.tipoDados === 'cura' ? 'Cura' : 'Dano'} ${esc(r.dados)}</span><button class="btn pequeno" data-acao="rolar-ritual-previa" data-id="${r.id}">Rolar ${esc(r.dados)}</button></div>` : ''}
    ${formas.length ? `<h3 class="titulo-vermelho">Formas avançadas</h3><ul class="formas-previa">${formas.join('')}</ul>` : ''}
    ${avisos.map(a => `<p class="aviso-previa">${esc(a)}</p>`).join('')}
    <h3 class="titulo-vermelho">Descrição</h3>
    ${texto ? `<div class="texto-completo">${esc(texto)}</div>` : ocr ? blocoOcr(ocr) : `<p class="apagado">Descrição integral ainda não disponível nos livros anexados.</p>${abrirPaginaSah('rituais', r.nome)}`}
  </div>`;
  const troca = !conhecido && f.paranormais.some(p => p.id === 'aprender-ritual' && !p.trocaRitualUsada) && f.rituais.length
    ? `<button class="btn" data-acao="ritual-substituir" data-id="${r.id}">Substituir ritual conhecido</button>` : '';
  const rodape = conhecido
    ? `<button class="btn fantasma" data-acao="fechar-modal">Fechar</button><button class="btn perigo" data-acao="ritual-catalogo-esquecer" data-id="${r.id}">Esquecer ritual</button>`
    : `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button>${troca}<button class="btn sangue" data-acao="ritual-aprender" data-id="${r.id}" ${problema ? 'disabled' : ''}>Aprender ritual</button>`;
  abrirModal(`Ritual · ${r.nome}`, corpo, rodape, true);
}
export function adicionarRitualCatalogo(ficha, r) {
  if (ficha.rituais.some(x => chaveRitual(x) === chaveRitual(r))) return false;
  ficha.rituais.push({ uid: uid(), elementos: r.elementos || [], nome: r.nome, elemento: r.elemento === 'variavel' ? 'variavel' : r.elemento, circulo: r.circulo, efeito: r.resumo,
    execucao: r.execucao || '', alcance: r.alcance || '', alvo: r.alvo || r.area || r.efeitoArea || '', duracao: r.duracao || '', resistencia: r.resistencia || '', formula: r.dados || '' });
  return true;
}
export function cartaoRitual(f, d, r, i) {
  const calc = d.rituais[i] || {}, custo = calc.custo ?? CIRCULOS[r.circulo - 1].custo, k = d.pd ? 'PD' : 'PE';
  const cat = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {};
  const exemplo = { execucao: 'ex.: padrão', alcance: 'ex.: curto', alvo: 'ex.: 1 ser', duracao: 'ex.: cena', resistencia: 'ex.: Vontade anula' };
  const campo = (c, rot) => `<label class="campo"><span>${rot}</span><input data-campo="rituais.${i}.${c}" id="rit-${i}-${c}" value="${esc(r[c])}" placeholder="${exemplo[c] || ''}"></label>`;
  const forma = (fo, nome) => fo ? `<span class="etiqueta">${nome} +${fo.custo} ${k}${fo.circulo ? ` · ${fo.circulo}º` : ''}${fo.afinidade ? ' · afinidade' : ''}${!fo.circulo && !fo.afinidade ? ' · sem requisito' : ''}</span>` : '';
  const especial = cat.id === 'capturar-momento'
    ? '<button class="btn pequeno" data-acao="capturar-explodir" data-forma="discente">Explodir símbolo discente · 4d8</button><button class="btn pequeno" data-acao="capturar-explodir" data-forma="verdadeiro">Explodir símbolo verdadeiro · 8d8</button>'
    : cat.id === 'presenca-do-medo' ? '<button class="btn pequeno" data-acao="presenca-dano">Rolar os dois danos da área</button>' : '';
  const formula = especial ? '' : formulaDaForma(calc, cat, 'basica');
  const texto = textoCompleto('rituais', r.nome);
  const ocr = !texto ? textoOcr('rituais', r.nome) : null;
  return `<details class="ritual ritual-compacto el-${r.elemento}">
    <summary><span class="cab">${sigilo(r.elemento, 'var(--el)')}<b>${esc(r.nome)}</b></span>
      <span class="linha resumo-rit"><span class="etiqueta">${custo} ${k}</span>${formula ? `<span class="etiqueta">${r.tipoDados === 'cura' ? 'cura' : 'dano'} ${esc(formula)}</span>` : ''}<span class="etiqueta">DT ${calc.dt ?? d.dtRitual}</span></span>
      <small class="apagado">${texto ? 'Descrição disponível abaixo' : ocr ? 'Texto do OCR abaixo (conferir no livro)' : 'Transcrição ainda não revisada'}</small>
      <span class="linha" style="margin-top:6px"><button class="btn pequeno sangue" data-acao="conjurar" data-i="${i}">Conjurar</button>${/sustentad/i.test(r.duracao) ? `<button class="btn pequeno" data-acao="sustentar-ritual" data-i="${i}">Sustentar</button>` : ''}${formula ? `<button class="btn pequeno" data-acao="rolar-ritual" data-i="${i}">Rolar ${esc(formula)}</button>` : ''}</span></summary>
    <div class="detalhes-rit">
      ${especial}
      ${!texto && !ocr ? `<p class="apagado">Descrição integral pendente de conferência: compare os dados com o PDF original.</p>${abrirPaginaSah('rituais',r.nome)}` : ''}
      <div class="grade-mini">
        ${r.proprio ? campo('nome', 'Nome') : ''}
        <label class="campo"><span>Elemento</span><select data-campo="rituais.${i}.elemento">${ELEMENTOS.map(x => `<option value="${x.id}" ${r.elemento === x.id ? 'selected' : ''}>${x.nome}</option>`).join('')}</select></label>
        <label class="campo"><span>Círculo</span><select data-campo="rituais.${i}.circulo" data-tipo="int">${CIRCULOS.map(c => `<option value="${c.n}" ${r.circulo === c.n ? 'selected' : ''}>${c.n}º</option>`).join('')}</select></label>
        ${campo('execucao', 'Execução')}${campo('alcance', 'Alcance')}${campo('alvo', 'Alvo/Área')}${campo('duracao', 'Duração')}${campo('resistencia', 'Resistência')}
        ${!especial ? `<label class="campo"><span>Fórmula básica</span><input data-campo="rituais.${i}.formula" maxlength="40" id="rit-${i}-formula" value="${esc(r.formula)}" placeholder="ex.: 3d6+3"></label>
        ${[['discente', 'discente'], ['verdadeiro', 'verdadeira']].filter(([id]) => r.proprio || cat[id]).map(([id, rotulo]) => `
          <label class="campo"><span>Fórmula ${rotulo}</span><input data-campo="rituais.${i}.formulasAvancadas.${id}" maxlength="40" value="${esc(r.formulasAvancadas?.[id] || '')}" placeholder="ex.: 5d6+5"></label>
          ${!cat[id] ? `<label class="campo"><span>Custo extra da forma ${rotulo} (${k})</span><input type="number" min="0" max="30" data-campo="rituais.${i}.custosAvancados.${id}" data-tipo="int" value="${r.custosAvancados[id]}"></label>` : ''}`).join('')}
        ${r.proprio ? `<label class="campo"><span>Tipo de resultado</span><select data-campo="rituais.${i}.tipoDados"><option value="dano">Dano</option><option value="cura" ${r.tipoDados === 'cura' ? 'selected' : ''}>Cura</option></select></label>` : ''}` : ''}
        <label class="campo"><span>Outra rolagem após conjurar</span><input data-campo="rituais.${i}.rolagemExtra" value="${esc(r.rolagemExtra)}" placeholder="ex.: 1d4"></label>
      </div>
      <p class="linha" style="margin-top:8px">${forma(cat.discente, 'Discente')}${forma(cat.verdadeiro, 'Verdadeiro')}</p>
      ${calc.notas?.length ? `<p class="apagado" style="font-size:.85rem">${calc.notas.map(esc).join(' · ')}</p>` : ''}
      ${texto ? `<div class="texto-completo">${esc(texto)}</div>` : ocr ? blocoOcr(ocr) : '<p class="apagado">O texto completo deste ritual ainda não está disponível nos livros anexados.</p>'}
      <label class="campo" style="margin-top:8px"><span>Efeito / anotações (cole aqui o texto do seu livro, se quiser)</span><textarea data-campo="rituais.${i}.efeito" id="rit-${i}-efeito">${esc(r.efeito)}</textarea></label>
      ${r.proprio ? `<div class="grade-mini">${[['discente', 'discente'], ['verdadeiro', 'verdadeira']].map(([id, rotulo]) => `<label class="campo"><span>Efeito da forma ${rotulo}</span><textarea data-campo="rituais.${i}.${id}" maxlength="400">${esc(r[id])}</textarea></label>`).join('')}</div>` : ''}
      <div class="linha fim" style="margin-top:6px"><button class="btn pequeno perigo" data-acao="esquecer-ritual" data-i="${i}">Esquecer ritual</button></div>
    </div></details>`;
}
// Quantos rituais de cada círculo a personagem pode ter. Cada ritual ganho tem um círculo máximo (o que ela podia
// conjurar quando ganhou); um ritual menor pode ocupar o lugar de um maior, então o máximo de cada círculo é
// "quantos ganhos aceitam este círculo ou maior".
export function quadroCirculos(f, d) {
  const vagas = d.vagasRituais || [];
  if (!vagas.length) return '';
  const k = d.pd ? 'PD' : 'PE';
  const deCada = [1, 2, 3, 4].map(c => vagas.filter(v => v === c).length);
  const origem = deCada.map((n, i) => (n ? `${n} de até ${i + 1}º` : '')).filter(Boolean).join(' + ');
  return `<div class="circulos-quadro">${[1, 2, 3, 4].map(c => {
    const conhecidos = f.rituais.filter(r => r.circulo === c && !r.proprio).length, max = vagas.filter(v => v >= c).length;
    const travado = c > d.circuloMax;
    return `<div class="circulo-cartao${travado ? ' travado' : ''}${conhecidos > max ? ' erro' : ''}"><b>${c}º círculo</b><span class="circulo-num">${conhecidos}<small> / ${max}</small></span>
      <small>${travado ? 'ainda não liberado' : `pode ter até ${max}`} · ${CIRCULOS[c - 1].custo} ${k}</small></div>`;
  }).join('')}</div>
  <p class="apagado" style="font-size:.82rem;margin:2px 0 8px">Conhecidos / máximo de cada círculo. Seus ${vagas.length} rituais vêm de: ${origem}${d.vagasEspecificas?.length ? ` (mais ${d.vagasEspecificas.length} ritual(is) específico(s) da trilha)` : ''}. Um ritual de círculo menor pode ocupar o lugar de um maior, por isso o máximo de um círculo inclui os ganhos dos círculos acima, e os máximos não se somam: o total é ${vagas.length + (d.vagasEspecificas?.length || 0)}.</p>`;
}
export const ritualDeToque = (ritual, catalogo) =>
  /\btoque\b/i.test(ritual.alcance || catalogo.alcance || '');
// Janela de CONJURAR: custo do ritual + extras (Ampliar, Acelerar, Camuflar, formas avançadas) + pagar com PV (Flagelador)
// Habilidades de gasto que servem no teste de Ocultismo da conjuração (bônus, dados a mais ou dado extra;
// trocar de perícia ou de atributo não se aplica ao Custo do Paranormal)
export function gastosOcultismo(f, d) {
  return opcoesGasto(f, d, { tipo: 'pericia', id: 'ocultismo' }).filter(o => !o.troca && !o.atr && !o.caos && !o.carga && typeof o.custo === 'number' && (o.bonus || o.dados || o.dadoExtra));
}
export function conjuracaoDoItem(f, itemUid) {
  const item = f.itens.find(it => it.uid === itemUid);
  if (!temConjuracao(item) || !item.qtd || !estaEquipado(item)) return null;
  const cat = RITUAIS.find(r => r.id === item.ritualConjuracao && r.circulo === 1);
  if (!cat) return null;
  const conhecida = f.rituais.find(r => r.idCatalogo === cat.id && r.circulo === 1);
  if (conhecida) return { cat, r: derivar(f).rituais.find(r => r.uid === conhecida.uid), desconto: 1, item };
  const ritualExtra = normalizar({ rituais: [{ nome: cat.nome, elemento: cat.elemento, circulo: cat.circulo }] }).rituais[0];
  return { cat, r: derivar(f, { ritualExtra }).rituais.at(-1), desconto: 0, item };
}
// Filtro da janela "Conjurar ritual que não conheço" (independente do filtro do catálogo de itens)
export function filtrarRitualDesconhecido() {
  const valor = c => document.querySelector(`.modal [data-filtro-desconhecido="${c}"]`)?.value || '';
  const busca = semAcento(valor('busca')).toLowerCase().trim(), el = valor('elemento'), circ = valor('circulo');
  let n = 0;
  for (const c of document.querySelectorAll('#desconhecido-lista [data-texto]')) {
    c.hidden = (el && c.dataset.elemento !== el) || (circ && c.dataset.circulo !== circ) || !c.dataset.texto.includes(busca);
    if (!c.hidden) n++;
  }
  const vazio = document.getElementById('desconhecido-vazio'); if (vazio) vazio.hidden = n > 0;
}
// Ritual que a pessoa NÃO conhece (SaH p. 117): montado do catálogo só para esta conjuração
export function ritualDesconhecido(f, id) {
  const cat = RITUAIS.find(r => r.id === id);
  if (!cat || f.rituais.some(r => semAcento(r.nome) === semAcento(cat.nome))) return null;
  const ritualExtra = normalizar({ rituais: [{ nome: cat.nome, elemento: cat.elemento, circulo: cat.circulo }] }).rituais[0];
  return { cat, r: derivar(f, { ritualExtra }).rituais.at(-1) };
}
// ---------- Reter Ritual (AS #01 p. 58) e Conjuração Complexa (SaH pp. 114–117) ----------
export function secaoReterRitual(f, r, cat, k) {
  if (!temOpcional(f, 'reterRitual') || !duracaoCena(r, cat)) return '';
  return `<h3 class="titulo-vermelho">Reter Ritual</h3><label class="check hab"><input type="checkbox" id="conj-reter"><span><b>Mudar a duração para retida</b> — os ${k} gastos ficam presos (saem também do máximo) enquanto o ritual durar, e você perde 1 ${k === 'PD' ? 'PD' : 'SAN'}. Solte depois na aba Rituais.</span></label>`;
}
// Guardado ao abrir a janela de conjurar, para a atualização sem redesenhar o modal
// Seletor de modo (só para rituais em que o jogador escolhe um efeito ao conjurar)
export function blocoModos(r, cat) {
  const versoes = versoesDoRitual(r, cat, fo => formulaDaForma(r, cat, fo)), modos = new Map();
  for (const [forma, lista] of Object.entries(versoes)) for (const [m, v] of lista) if (m) { const x = modos.get(m) || { formas: [], v }; x.formas.push(forma); modos.set(m, x); }
  if (!modos.size) return '';
  const desc = v => [v.dano.length ? `dano de ${v.dano.join(' e ')}${v.formula ? ` (${v.formula})` : ''}` : 'sem dano', v.res ? `${v.res}` : 'sem teste de resistência'].join(' · ');
  return `<h3 class="titulo-vermelho">Modo</h3><div class="lista-hab">${[...modos].map(([m, x], j) => `<label class="check hab"><input type="radio" name="conj-modo" value="${esc(m)}" data-formas="${x.formas.join(',')}" data-acao-check="conj-etapa" ${j === 0 ? 'checked' : ''}><span><b>${esc(m)}</b> <small class="apagado">${esc(x.formas.map(fo => `${NOME_FORMA[fo]}: ${desc(versoes[fo].find(([n]) => n === m)[1])}`).join(' | '))}</small></span></label>`).join('')}</div>`;
}
export function secaoConjuracaoComplexa(f, d, r, cat) {
  const k = d.pd ? 'PD' : 'PE';
  const tatuagem = f.poderes.some(p => p.id === 'tatuagem-ritualistica');
  const mesclar = f.trilha === 'conduite' && !!d.trilhaHabs.find(h => h.nome === 'Anular Ritual')?.liberada;
  const tipoInput = mesclar ? 'checkbox' : 'radio';
  const caixas = Object.entries(MATERIAL_ELEMENTO).map(([el, m]) => `<div class="caixa-elemento" style="--el-claro:${m.claro};--el-escuro:${m.escuro}">
      <div class="caixa-elemento-topo">${sigilo(el)}<b>${esc(m.nome)}</b><small>${esc(m.material)}</small></div>
      ${m.efeitos.map(([id, nome, quando, req]) => `<label class="efeito-op"><input type="${tipoInput}" name="conj-efeito" value="${el}:${id}" data-req="${req}" data-acao-check="conj-etapa"><span>
        <span class="efeito-mais">+ ${esc(nome)}</span><small class="apagado">${esc(quando)}</small><small class="efeito-motivo"></small></span></label>`).join('')}
      <p class="efeito-menos">− 1d20 no teste de Ocultismo para conjurar</p></div>`).join('');
  return `<h3 class="titulo-vermelho">Conjuração Complexa</h3>
    <p class="apagado" style="font-size:.88rem">3 rodadas: 1ª símbolo, 2ª componentes, 3ª invocação. Você fica desprevenido e faz Vontade para manter a concentração ao sofrer dano (use o campo de concentração abaixo, se precisar). Se falhar no Ocultismo, o ritual <b>não funciona</b>, mas os custos são pagos.</p>
    <div class="lista-hab">
      ${tatuagem ? `<label class="check hab"><input type="checkbox" id="conj-tatuagem" data-acao-check="conj-etapa"><span><b>Tatuagem Ritualística · pular a 1ª etapa</b> — só para o ritual tatuado. Se pular, não pode adicionar efeito elemental.</span></label>` : ''}
      <label class="check hab"><input type="checkbox" id="conj-efeito-el" data-acao-check="conj-etapa"><span><b>1ª etapa · Adicionar efeito elemental ao símbolo</b> — Escolha um efeito. Você rola 1d20 a menos no teste de Ocultismo para conjurar.</span></label>
      <div class="janela-efeitos" id="conj-efeitos" data-mesclar="${mesclar ? 1 : 0}" hidden>
        ${mesclar ? '<p class="apagado" style="font-size:.85rem;margin:0 0 8px"><b>Mesclar Elemento</b> (substitui Anular Ritual na conjuração complexa): você pode escolher um segundo efeito de outro elemento. O poder não fala em segunda penalidade, então continua −1d20.</p>' : ''}
        <div class="efeitos-grade">${caixas}</div>
        <p class="apagado" id="conj-efeito-resumo" style="font-size:.85rem;margin:8px 0 0">Escolha um efeito. A penalidade de −1d20 só entra depois da escolha.</p>
        <p class="apagado" style="font-size:.78rem;margin:4px 0 0">Sobrevivendo ao Horror, pp. 115–116. O dado extra e os efeitos de resistência valem pelo que a versão e o modo escolhidos fazem (tipo de dano e teste de resistência), não pelo elemento do ritual. Você pode escolher o efeito antes e decidir a versão no fim; o site confere antes de rolar.</p>
      </div>
      <label class="check hab"><input type="checkbox" id="conj-componente"><span><b>2ª etapa · consumir o componente</b> (ou um catalisador): +1d20 no Ocultismo. ${r.elemento === 'medo' || d.afinidade === r.elemento ? 'Você dispensa componentes neste ritual, mas pode consumir um para fortalecê-lo.' : ''}</span></label>
      <label class="check hab"><input type="checkbox" id="conj-extrapolar" data-acao-check="conj-etapa"><span><b>Extrapolar os limites</b> — some sua Presença (+${f.atributos.pre}) ao limite de ${k} neste ritual e use aprimoramentos como se tivesse acesso a um círculo a mais. Mais poderoso, mais arriscado.</span></label>
    </div>`;
}
// Atualiza a janela de efeitos elementais quando muda a caixinha, a forma ou a escolha (sem redesenhar o modal)
export function atualizarModos() {
  // modos que existem na versão escolhida (ex.: Chamas do Caos normal = Chamejar/Esquentar/Extinguir/Modelar; discente = Labareda)
  const forma = document.querySelector('[name="conj-forma"]:checked')?.value || 'basica';
  const modos = [...document.querySelectorAll('[name="conj-modo"]')];
  if (!modos.length) return;
  for (const m of modos) { const ok = m.dataset.formas.split(',').includes(forma); m.disabled = !ok; m.closest('label').hidden = !ok; }
  if (!modos.some(m => m.checked && !m.disabled)) { const prim = modos.find(m => !m.disabled); if (prim) prim.checked = true; }
}
export function atualizarEtapaSimbolo() {
  atualizarModos();
  const box = document.getElementById('conj-efeitos'), liga = document.getElementById('conj-efeito-el');
  if (!box || !liga) return;
  const tat = document.getElementById('conj-tatuagem');
  liga.disabled = !!tat?.checked; if (tat?.checked) liga.checked = false;
  box.hidden = !liga.checked;
  // formas acima do círculo ou sem afinidade: liberadas só por Extrapolar (+1 círculo) ou Ignorar um requisito (tinta dourada)
  const extrapolar = !!document.getElementById('conj-extrapolar')?.checked;
  const ignora = liga.checked && !!box.querySelector('[name="conj-efeito"][value="conhecimento:requisito"]:checked');
  for (const fo of document.querySelectorAll('[name="conj-forma"][data-trava]')) {
    const falta = JSON.parse(fo.dataset.trava);
    const ok = formaLiberada(falta, { extrapolar, ignora });
    const porExtrapolar = extrapolar && falta.circulo && falta.extrapola, porIgnorar = ignora && !formaLiberada(falta, { extrapolar });
    fo.disabled = !ok;
    if (!ok && fo.checked) { fo.checked = false; const b = document.querySelector('[name="conj-forma"][value="basica"]'); if (b) b.checked = true; }
    const dica = fo.closest('label')?.querySelector('.forma-dica');
    if (dica) {
      const caminhos = [falta.circulo && falta.extrapola ? 'marque "Extrapolar os limites"' : '', 'escolha "Ignorar um requisito de aprimoramento" (Conhecimento)'].filter(Boolean);
      dica.textContent = ok ? `Liberada por ${[porExtrapolar ? 'Extrapolar os limites' : '', porIgnorar ? 'Ignorar um requisito' : ''].filter(Boolean).join(' + ')}.`
        : falta.circulo && falta.afinidade && falta.extrapola ? 'Para liberar: marque "Extrapolar os limites" E escolha "Ignorar um requisito" (afinidade).'
        : `Para liberar: ${caminhos.join(' ou ')}.`;
    }
  }
  const formaId = document.querySelector('[name="conj-forma"]:checked')?.value || 'basica';
  const modo = document.querySelector('[name="conj-modo"]:checked')?.value || '';
  const versoes = estado.conjAtual ? versoesDoRitual(estado.conjAtual.r, estado.conjAtual.cat, fo => formulaDaForma(estado.conjAtual.r, estado.conjAtual.cat, fo)) : { basica: [['', V()]] };
  const atual = (versoes[formaId]?.find(([m]) => m === modo) || versoes[formaId]?.[0] || ['', V()])[1];
  const mesclar = box.dataset.mesclar === '1';
  const ops = [...box.querySelectorAll('[name="conj-efeito"]')];
  if (!liga.checked) ops.forEach(o => { o.checked = false; });
  const incompativeis = [];
  for (const o of ops) {
    const [el, ef] = o.value.split(':'), req = o.dataset.req;
    // Só fica apagado o efeito que não vale em NENHUMA versão/modo do ritual; os outros mostram onde valem
    const onde = req ? ondeEfeitoVale(el, ef, versoes) : ['*'];
    const nunca = !onde.length;
    const agora = !motivoEfeito(el, ef, atual);
    let texto = '';
    const notaVersao = req === 'dano' && Object.values(versoes).flat().map(([, v]) => v.nota).find(Boolean);
    if (nunca) texto = notaVersao || (req === 'dano' ? `Este ritual não causa dano de ${MATERIAL_ELEMENTO[el].nome} em nenhuma versão.` : 'Este ritual não tem teste de resistência em nenhuma versão.');
    else if (!agora) texto = `Requer ${onde.join(' ou ')}.`;
    else if (req === 'dano' && atual.dano.includes('?')) texto = 'Confira no livro se o dano deste ritual é deste tipo.';
    o.disabled = nunca; if (nunca) o.checked = false;
    const lbl = o.closest('.efeito-op'); lbl?.classList.toggle('indisponivel', nunca); lbl?.classList.toggle('requer', !nunca && !agora);
    const m = lbl?.querySelector('.efeito-motivo'); if (m) m.textContent = texto;
    if (o.checked && !agora) incompativeis.push(`"${efeitoElemental(el, ef)?.[1]}" ${texto.charAt(0).toLowerCase() + texto.slice(1)}`);
  }
  if (mesclar) { // até 2 efeitos, de elementos diferentes
    const marcados = ops.filter(o => o.checked);
    for (const o of ops) if (!o.checked && !o.closest('.efeito-op')?.classList.contains('indisponivel'))
      o.disabled = marcados.length >= 2 || marcados.some(m => m.value.split(':')[0] === o.value.split(':')[0]);
  }
  const escolhidos = ops.filter(o => o.checked).map(o => efeitoElemental(...o.value.split(':'))?.[1]).filter(Boolean);
  const resumo = document.getElementById('conj-efeito-resumo');
  if (resumo) {
    resumo.classList.toggle('efeito-alerta', incompativeis.length > 0);
    resumo.textContent = incompativeis.length ? `⚠ Não combina com a versão escolhida (${NOME_FORMA[formaId]}${modo ? ` · ${modo}` : ''}): ${incompativeis.join('; ')} Mude a versão/modo ou troque o efeito.`
      : escolhidos.length ? `Escolhido: ${escolhidos.join(' + ')}. Penalidade: −1d20 no teste de Ocultismo.` : 'Escolha um efeito. A penalidade de −1d20 só entra depois da escolha.';
  }
}
export function janelaConjurar(ctx, f, d, i, origem = null, desconhecido = null) {
  const r = desconhecido?.r || origem?.r || d.rituais[i], k = d.pd ? 'PD' : 'PE';
  if (!r) return;
  const desconto = origem?.desconto || 0;
  const cat = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {};
  const tem = id => f.poderes.some(p => p.id === id);
  const complexa = temOpcional(f, 'conjuracaoComplexa');
  const formas = [['basica', 'Forma básica', 0, true, '']];
  for (const [id, nome] of [['discente', 'Forma discente'], ['verdadeiro', 'Forma verdadeira']]) {
    const fo = formaRitual(r, cat, id); if (!fo) continue;
    // Na conjuração complexa, a forma travada só libera com "Extrapolar os limites" ou "Ignorar um requisito"
    const falta = faltasDaForma(fo, r, d), pode = formaLiberada(falta);
    const alcancavel = pode || complexa && formaLiberada(falta, { extrapolar: true, ignora: true });
    const travas = complexa && !pode && alcancavel ? falta : null;
    formas.push([id, nome, fo.custo, pode, `${requisitoForma(fo, r) ? `requer ${requisitoForma(fo, r)}` : 'sem requisito adicional'}${!alcancavel ? ' (você ainda não pode)' : ''}`, travas]);
  }
  const op = [];
  if (f.trilha === 'conduite' && d.trilhaHabs.find(h => h.nome === 'Ampliar Ritual')?.liberada) op.push(['ampliar', 'Ampliar Ritual: mais alcance ou área em dobro', 2]);
  if (f.trilha === 'conduite' && d.trilhaHabs.find(h => h.nome === 'Acelerar Ritual')?.liberada) op.push(['acelerar', 'Acelerar Ritual: conjurar como ação livre', 4]);
  if (tem('camuflar-ocultismo')) op.push(['camuflar', 'Camuflar Ocultismo: sem gestos nem palavras', 2]);
  if (f.trilha === 'lamina' && semAcento(r.nome) === 'amaldicoar arma') op.push(['lamina', 'Lâmina Maldita: conjurar com ação de movimento', 1]);
  const flagelo = f.trilha === 'flagelador' && d.trilhaHabs.find(h => h.nome === 'Poder do Flagelo')?.liberada;
  const armadura = protecaoVestida(f);
  const avisoDesconhecido = desconhecido ? `<div class="aviso-regra" style="margin-top:0"><b>Ritual que você não conhece</b> (Sobrevivendo ao Horror, p. 117): segue as etapas da conjuração complexa, com <b>DT +5</b> no teste de Ocultismo. Se falhar, o ritual não funciona, os custos são pagos e você sofre um <b>desastre paranormal</b> (1d8).</div>
    <label class="check hab"><input type="checkbox" id="conj-info" data-acao-check="conj-info"><span><b>Obrigatório · Tenho as informações básicas sobre o ritual</b> — vi alguém conjurá-lo com sucesso, ou tenho um texto ou gravação explicando como executá-lo — e o mestre considerou suficiente.</span></label>
    <p class="apagado" style="font-size:.82rem;margin:4px 0 10px">O livro <b>exige</b> essas informações: sem elas não dá para tentar (não existe versão com penalidade). O botão Conjurar só destrava depois de marcar.</p>` : '';
  abrirModal(`Conjurar · ${r.nome}${desconhecido ? ' (desconhecido)' : ''}`, `${avisoDesconhecido}${origem ? `<p>Conjuração de ${esc(origem.item.nome)}${desconto ? ` · −1 ${k} por conhecer o ritual, com mínimo de 1 ${k}` : ''}.</p>` : ''}<p>${esc(cat.execucao ? `Execução ${cat.execucao} · alcance ${cat.alcance || '—'} · ${cat.alvo || cat.area || cat.efeitoArea || ''} · ${cat.duracao || ''}` : '')}</p>
    ${ritualDeToque(r, cat) ? '<p class="apagado">Confirme o toque e aplique o efeito ao alvo na mesa. Os dados do ritual são rolados normalmente.</p>' : podeResolverRitual(cat.id, r.formula || Object.values(r.formulasAvancadas || {}).find(Boolean), r.resistencia) ? `<label class="campo"><span>Alvo para resolver resistência e dano</span><select id="conj-alvo"><option value="">Apenas conjurar</option>${opcoesAlvos(ctx, f).replace(' selected', '')}</select></label><label class="campo"><span>Recurso do alvo</span><select id="conj-recurso"><option value="pv">PV</option><option value="mental">Sanidade / PD</option></select></label>` : ''}
    <h3 class="titulo-vermelho">Forma</h3><div class="lista-hab">${formas.map(([id, nome, c, ok, req, travas], j) => `<label class="check hab"><input type="radio" name="conj-forma" value="${id}" data-custo="${c}" data-acao-check="conj-etapa"${travas ? ` data-trava='${JSON.stringify(travas)}'` : ''} ${j === 0 ? 'checked' : ''} ${ok ? '' : 'disabled'}><span><b>${nome}</b> — total <b>${custoDaForma(r, c, desconto)} ${k}</b>${req ? ` <small class="apagado">${esc(req)}</small>` : ''}${travas ? '<br><small class="forma-dica"></small>' : ''}${r.proprio && id !== 'basica' && r[id] ? `<br><small>${esc(r[id])}</small>` : ''}</span></label>`).join('')}</div>
    ${blocoModos(r, cat)}
    ${op.length ? `<h3 class="titulo-vermelho">Extras</h3><div class="lista-hab">${op.map(([id, n, c]) => `<label class="check hab"><input type="checkbox" id="conj-${id}" data-custo-extra="${c}"><span>${esc(n)} <b>+${c} ${k}</b></span></label>`).join('')}</div>` : ''}
    ${(() => { if (r.elemento === 'medo') return ''; const ops = gastosOcultismo(f, d); return ops.length ? `<h3 class="titulo-vermelho">Teste de Ocultismo (Custo do Paranormal)</h3><div class="lista-hab">${ops.map(o => `<label class="check hab"><input type="checkbox" id="conj-oc-${o.id}" data-gasto-oc="${o.id}"><span><b>${esc(o.nome)}</b> +${o.custo} ${k}: ${[o.bonus ? `+${o.bonus}` : '', o.dados ? `+${o.dados}d20` : '', o.dadoExtra ? `+${o.dadoExtra}` : ''].filter(Boolean).join(' ')} no teste${o.nota ? ` <small class="apagado">(${esc(o.nota)})</small>` : ''}</span></label>`).join('')}</div><p class="apagado" style="font-size:.82rem">Este gasto é à parte do custo do ritual: não muda a DT.</p>` : ''; })()}
    ${secaoReterRitual(f, r, cat, k)}${complexa ? secaoConjuracaoComplexa(f, d, r, cat) : ''}
    <div class="grade c2" style="margin-top:8px"><label class="campo"><span>Outro custo (${k})</span><input type="number" min="0" id="conj-outro" value="0"></label>
      <label class="campo"><span>Concentração: DT de Vontade (0 = sem teste)</span><input type="number" min="0" id="conj-vontade" value="0"></label></div>
    ${flagelo ? `<label class="check hab"><input type="checkbox" id="conj-flagelo"><span><b>Poder do Flagelo:</b> pagar com PV (2 PV por ${k}).</span></label>` : ''}
    <p class="apagado" style="font-size:.88rem;margin-top:8px">${r.elemento === 'medo' && complexa ? 'Conjuração complexa: rituais de Medo também rolam Ocultismo (DT 20 + custo) e, se falhar, não funcionam. Não há Custo do Paranormal, mas você perde Sanidade (ou PD) igual ao custo, além de 1 a 3 pontos permanentes pela forma usada.' : r.elemento === 'medo' ? 'Rituais de Medo dispensam Ocultismo. Perca Sanidade (ou PD) igual ao custo, além de 1 a 3 pontos permanentes pela forma usada.' : `O site rola Ocultismo contra DT 20 + custo. Se falhar, você perde Sanidade igual ao custo (e 1 permanente se falhar por 5 ou mais).${armadura && !origem ? ` Você está de proteção ${armadura === 2 ? 'pesada (condição terrível)' : 'leve (condição ruim)'}: o site rola Vontade contra DT ${armadura === 2 ? 20 : 15} + custo para manter a concentração; se falhar, o ritual não funciona e os ${k} são perdidos.` : ''}`} Limite: ${d.limiteRitual} ${k}/turno.</p>`,
    `<button class="btn fantasma" data-acao="fechar-modal">Cancelar</button><button class="btn sangue" data-acao="conjurar-confirmar" data-i="${i}" ${desconhecido ? `data-desconhecido="${esc(desconhecido.cat.id)}" disabled title="Marque antes que você tem as informações sobre o ritual"` : ''} ${origem ? `data-item-uid="${esc(origem.item.uid)}" data-ritual-id="${esc(origem.cat.id)}"` : ''}>Conjurar</button>`, true);
  estado.conjAtual = { r, cat };
  atualizarEtapaSimbolo(); // escreve as dicas das formas travadas e mostra os modos da versão
}
// ---------- Ações da ficha ----------
// ═══════════ Conjurar um ritual, em etapas ═══════════
// h = ferramentas da ficha aberta (f, gastar, testar, quem, acoes). c = o que foi escolhido na janela. e = efeitos do ritual.
// 1. Lê o que foi escolhido na janela e confere as regras. Nada é gasto aqui; devolve null se algo não vale.
export function lerConjuracao(ctx, el, h) {
  const { f } = h;
  const ficha = f(), d = derivar(ficha), i = Number(el.dataset.i), k = d.pd ? 'pd' : 'pe', K = k.toUpperCase();
  const origem = el.dataset.itemUid ? conjuracaoDoItem(ficha, el.dataset.itemUid) : null;
  const desc = el.dataset.desconhecido ? ritualDesconhecido(ficha, el.dataset.desconhecido) : null;
  const r0 = desc ? desc.r : el.dataset.itemUid ? (origem?.cat.id === el.dataset.ritualId ? origem?.r : null) : d.rituais[i];
  if (!r0 || d.semAcoes) return ctx.avisar('A conjuração está indisponível.', true);
  // Conjuração Complexa (SaH pp. 114–117)
  const complexa = temOpcional(ficha, 'conjuracaoComplexa');
  // Ritual que não conhece (SaH p. 117): exige conjuração complexa, treino em Ocultismo e informação sobre o ritual
  const desconhecido = !!desc;
  if (desconhecido && !complexa) return ctx.avisar('Conjurar um ritual que você não conhece exige a regra de Conjuração Complexa (aba Notas).', true);
  if (desconhecido && !(d.PER.ocultismo?.grau >= 1)) return ctx.avisar('Para conjurar um ritual que você não conhece é preciso ser treinado em Ocultismo.', true);
  if (desconhecido && !document.getElementById('conj-info')?.checked) return ctx.avisar('Confirme que você tem as informações básicas sobre o ritual (e que o mestre aprovou).', true);
  const ligaEl = complexa && !!document.getElementById('conj-efeito-el')?.checked && !document.getElementById('conj-tatuagem')?.checked;
  const efs = ligaEl ? [...document.querySelectorAll('[name="conj-efeito"]:checked')].map(o => o.value.split(':')) : [];
  if (ligaEl && !efs.length) return ctx.avisar('Escolha um efeito elemental ou desmarque "Adicionar efeito elemental ao símbolo".', true);
  const temEf = (el, ef) => efs.some(([a, b]) => (!el || a === el) && b === ef);
  const extrapolar = complexa && !!document.getElementById('conj-extrapolar')?.checked;
  const componente = complexa && !!document.getElementById('conj-componente')?.checked;
  const reter = temOpcional(ficha, 'reterRitual') && !!document.getElementById('conj-reter')?.checked;
  const r = temEf('morte', 'dt') ? { ...r0, dt: r0.dt + 2 } : r0;
  const alvoMental = document.getElementById('conj-recurso')?.value === 'mental';
  const forma = document.querySelector('[name="conj-forma"]:checked');
  const catR = RITUAIS.find(x => semAcento(x.nome) === semAcento(r.nome)) || {};
  const alvoId = ritualDeToque(r, catR) ? '' : document.getElementById('conj-alvo')?.value;
  const formaId = forma?.value || 'basica';
  const avancada = ['discente', 'verdadeiro'].includes(formaId) ? formaRitual(r, catR, formaId) : null;
  if (formaId !== 'basica' && (!avancada || !formaLiberada(faltasDaForma(avancada, r0, d), { extrapolar, ignora: temEf('conhecimento', 'requisito') }))) {
    return ctx.avisar('Pré-requisitos da forma avançada não cumpridos.', true);
  }
  // versão + modo que o jogador vai conjurar de fato (dano e resistência daquela combinação)
  const modo = document.querySelector('[name="conj-modo"]:checked:not(:disabled)')?.value || '';
  const versao = versaoEscolhida(r0, catR, formaId, modo, fo => formulaDaForma(r0, catR, fo));
  const temTabela = !!VERSOES_RITUAL[catR.id];
  const extraFormula = r.formulaFinal && r.formula && r.formulaFinal.startsWith(r.formula) ? r.formulaFinal.slice(r.formula.length) : '';
  const formulaBase = temTabela && !r.proprio && versao.formula ? versao.formula + extraFormula : temTabela && modo && !versao.dano.length ? '' : formulaDaForma(r, catR, formaId);
  // valida os efeitos elementais na combinação final, antes de gastar PE e rolar Ocultismo
  for (const [el, ef] of efs) {
    const motivo = motivoEfeito(el, ef, versao);
    if (!motivo) continue;
    const onde = ondeEfeitoVale(el, ef, versoesDoRitual(r0, catR, fo => formulaDaForma(r0, catR, fo)));
    return ctx.avisar(`"${efeitoElemental(el, ef)?.[1]}" não vale em ${NOME_FORMA[formaId]}${modo ? ` (modo ${modo})` : ''}: ${motivo}.${onde.length ? ` Requer ${onde.join(' ou ')}.` : ''} Revise a escolha ou desmarque "Adicionar efeito elemental".`, true);
  }
  let formulaD = formulaBase;
  for (const [, ef] of efs) if (ef === 'dado') formulaD = maisUmDado(formulaD);
  if (formulaD) {
    try { analisar(formulaD); } catch (e) { return ctx.avisar(`Fórmula do ritual: ${e.message}`, true); }
  }
  let custo = custoDaForma(r, avancada?.custo || 0, origem?.desconto) + d.custoCondicao + inteiro(document.getElementById('conj-outro')?.value, 0, 50, 0);
  document.querySelectorAll('.modal [data-custo-extra]:checked').forEach(c => { custo += Number(c.dataset.custoExtra); });
  // Proteção leve/pesada = condição ruim/terrível: Vontade DT 15/20 + custo (Livro de Regras, "Gestos e Componentes" e "Concentração").
  // Não tira dados do Ocultismo. Conjurar por item não exige gestos.
  const protecao = origem ? 0 : protecaoVestida(ficha);
  const dtProtecao = protecao ? (protecao === 2 ? 20 : 15) + custo : 0;
  const dtVontade = Math.max(inteiro(document.getElementById('conj-vontade')?.value, 0, 99, 0), dtProtecao);
  const marcadosOc = new Set([...document.querySelectorAll('[data-gasto-oc]:checked')].map(c => c.dataset.gastoOc));
  const opsOc = r.elemento === 'medo' ? [] : gastosOcultismo(ficha, d).filter(o => marcadosOc.has(o.id));
  const gastoOc = opsOc.reduce((s, o) => s + o.custo, 0);
  return { ficha, d, k, K, origem, desc, r0, complexa, desconhecido, efs, temEf, extrapolar, componente, reter, r, alvoMental, forma, catR, alvoId, formaId, avancada, modo, versao, temTabela, formulaD, custo, protecao, dtProtecao, dtVontade, opsOc, gastoOc };
}
// 2. Paga o custo em PE/PD (ou em PV, com o Poder do Flagelo). Devolve false se não deu para pagar.
export function pagarConjuracao(ctx, c, h) {
  const { ficha, d, K, temEf, extrapolar, r, custo, opsOc, gastoOc } = c;
  const { gastar } = h;
  if (document.getElementById('conj-flagelo')?.checked) { const pv = custo * 2; if (d.atual.pv <= pv) return ctx.avisar('PV insuficientes.', true); ficha.recursos.pv = d.atual.pv - pv; ficha.gastoTurno += custo; }
  else if (!gastar(ficha, d, custo + gastoOc, d.limiteRitual + (extrapolar ? ficha.atributos.pre : 0) + (temEf('conhecimento', 'limite') ? 2 : 0), 0, [[`Ritual: ${r.nome}`, custo - d.custoCondicao], ...opsOc.map(o => [o.nome, o.custo])])) return ctx.avisar(`${K} insuficiente (precisa de ${custo + gastoOc}).`, true);
  if (gastoOc && document.getElementById('conj-flagelo')?.checked && !gastar(ficha, derivar(ficha), gastoOc, undefined, undefined, opsOc.map(o => [o.nome, o.custo]))) return ctx.avisar(`${K} insuficiente para ${opsOc.map(o => o.nome).join(', ')}.`, true);
  ctx.salvarFicha(ficha); fecharModal(); ctx.render();
  return true;
}
// 3. Prepara o que acontece quando o ritual funciona: dano/cura, alvo e resistência, efeitos elementais, retenção e desastre.
export function efeitosDaConjuracao(ctx, c, h) {
  const { ficha, K, efs, temEf, reter, r, alvoMental, forma, catR, alvoId, formaId, modo, versao, temTabela, formulaD, custo } = c;
  const { f } = h;
  const nomeForma = (forma?.value === 'discente' ? ' (discente)' : forma?.value === 'verdadeiro' ? ' (verdadeira)' : '') + (modo ? ` · ${modo}` : '');
  const rotuloD = r.tipoDados === 'cura' ? 'CURA' : 'DANO';
  const rolarFormula = (alvo = '') => rolarDanoUI({
    titulo: `${r.nome}${nomeForma} · ${alvo || (rotuloD === 'CURA' ? 'cura' : 'dano')}`,
    quem: ficha.nome, formula: formulaD, rotulo: rotuloD,
  });
  const aplicarAoAlvo = async () => {
    const alvo = alvoId ? alvoDeFicha(ctx, alvoId) : null;
    if (!alvo) {
      if (formulaD) await rolarFormula();
      return;
    }
    const perfil = perfilRitual(catR.id, formaId);
    if (perfil?.exigeAtaque) {
      if (formulaD) await rolarFormula(alvo.nome);
      return ctx.avisar('A forma discente de Decadência exige acertar com uma arma. Some o dano do ritual após confirmar o acerto.');
    }
    if (temTabela && !perfil && !versao.res) {
      if (formulaD) await rolarFormula(alvo.nome);
      return ctx.avisar(`${r.nome}${nomeForma}: esta versão não tem teste de resistência. Aplique o efeito conforme a descrição.`);
    }
    const resistencia = r.resistencia.toLowerCase();
    if (!perfil && ((formaId !== 'basica' && !r.proprio) || !/^(fortitude|reflexos|vontade) (reduz|anula|evita)/.test(resistencia))) {
      if (formulaD) await rolarFormula(alvo.nome);
      return ctx.avisar('Resolva a resistência e os demais efeitos conforme a descrição desta forma.');
    }
    const id = perfil ? perfil.teste : resistencia.split(' ')[0];
    const da = derivar(alvo), p = da.PER[id];
    let passou = false;
    if (p && !(id === 'reflexos' && da.reflexosFalha)) {
      proxima.dt = String(r.dt);
      try { passou = (await rolarTesteUI({ titulo: `${p.nome} · ${alvo.nome}`, quem: alvo.nome, dados: p.dados, bonus: p.bonus })).total >= r.dt; }
      finally { proxima.dt = ''; }
    }
    if (passou && !perfil && /anula|evita/.test(resistencia)) return ctx.avisar(`${alvo.nome} resistiu ao ritual.`);
    const atual = alvoDeFicha(ctx, alvoId) || alvo;
    const defesa = derivar(atual);
    const condicao = passou ? perfil?.condicaoNoSucesso : perfil?.condicao;
    let mensagem = condicao ? CONDICOES.find(c => c.id === condicao)?.nome : '';
    if (condicao) {
      marcarCondicao(atual, condicao, `${r.nome}${nomeForma} (de ${ficha.nome || 'conjurador'})`);
      if (perfil.turnos) atual.prazosCondicao[condicao] = Math.max(atual.prazosCondicao[condicao] || 0, perfil.turnos);
    }
    if (!passou && p) for (const [el, ef] of efs) {
      if (ef !== 'cond') continue;
      const cm = { sangue: 'sangrando', energia: 'ofuscado' }[el];
      if (cm) { marcarCondicao(atual, cm, `Efeito de ${MATERIAL_ELEMENTO[el].nome} · ${r.nome} (de ${ficha.nome || 'conjurador'})`); mensagem = [mensagem, CONDICOES.find(c => c.id === cm)?.nome].filter(Boolean).join(' · '); }
      else if (el === 'morte') {
        adicionarMarcador(atual, { tipo: 'negativo', nome: '−2 em testes', texto: 'Até o fim da cena.', origem: `Efeito de Morte · ${r.nome} (de ${ficha.nome || 'conjurador'})`, dura: 'cena' });
        mensagem = [mensagem, '−2 em testes até o fim da cena'].filter(Boolean).join(' · ');
      }
    }
    if (formulaD) {
      const resultado = await rolarFormula(alvo.nome);
      if (!resultado) return;
      const metade = passou && (perfil?.sucesso === 'metade' || !perfil) ? 1 : 0;
      if (rotuloD === 'CURA') {
        recuperar(atual, defesa, 'pv', resultado.total);
        if (perfil?.envelhece && /^\d+$/.test(atual.idade.trim())) atual.idade = String(Number(atual.idade) + 1);
        mensagem = `${resultado.total} de cura${perfil?.envelhece ? ' e +1 ano de idade' : ''}`;
      } else {
        const tipo = !perfil && alvoMental ? 'mental' : 'pv';
        const dano = sofrerDano(atual, defesa, resultado.total, { tipo, metade, rd: tipo === 'mental' ? defesa.rdMental : defesa.rd });
        mensagem = [`${dano.total} de dano`, mensagem].filter(Boolean).join(' · ');
      }
    }
    ctx.salvarFicha(atual); ctx.render(); ctx.avisar(`${alvo.nome}: ${mensagem || 'sem efeito'}.`);
  };
  const presencaMedo = catR.id === 'presenca-do-medo';
  const capturar = catR.id === 'capturar-momento';
  const temResolucao = !!(alvoId || formulaD || r.rolagemExtra || presencaMedo || capturar);
  const aposConjurar = async () => {
    const fx = f(), dx = derivar(fx), notas = [];
    if (reter) {
      fx.rituaisRetidos = [...(fx.rituaisRetidos || []), { uid: uid(), nome: r.nome, custo }].slice(-20);
      if (dx.pd) fx.recursos.pd = dx.atual.pd - 1; else fx.recursos.san = dx.atual.san - 1;
      notas.push(`ritual retido (${custo} ${K} presos, −1 ${dx.pd ? 'PD' : 'SAN'})`);
    }
    if (temEf('sangue', 'cura')) {
      const c = await rolarDanoUI({ titulo: `${r.nome} · material de Sangue`, quem: fx.nome, formula: '2d6', rotulo: 'CURA' });
      if (c) { const fy = f(); recuperar(fy, derivar(fy), 'pv', c.total); ctx.salvarFicha(fy); notas.push(`+${c.total} PV`); }
      ctx.salvarFicha(f()); ctx.render();
    } else { ctx.salvarFicha(fx); ctx.render(); }
    if (temEf('energia', 'acao')) {
      const fy = f(); adicionarMarcador(fy, { tipo: 'positivo', nome: 'Ação de movimento extra', texto: 'No seu próximo turno.', origem: `Efeito de Energia · ${r.nome}`, dura: 'turno', turnos: 2 });
      ctx.salvarFicha(fy); ctx.render(); notas.push('ação de movimento extra no próximo turno');
    }
    if (notas.length) ctx.avisar(`${r.nome}: ${notas.join(' · ')}.`);
  };
  const desastre = async () => {
    const fx = f(), circ = r.circulo || 1, n = rolar('1d8').total, [nome, txt, atr, cond] = DESASTRES[n];
    let extra = '';
    const origem = `Desastre paranormal: ${nome} (${r.nome})`;
    if (atr) {
      fx.atributos[atr] = Math.max(0, (fx.atributos[atr] || 0) - 1);
      marcarCondicao(fx, cond, `${origem} · até o fim da cena`);
      adicionarMarcador(fx, { tipo: 'negativo', nome: `−1 de ${ATRIBUTOS.find(a => a.id === atr)?.nome} (permanente)`, texto: txt, origem, dura: 'permanente', desfazer: { atributo: atr, valor: 1 } });
    } else adicionarMarcador(fx, { tipo: 'negativo', nome, texto: txt, origem, dura: n === 1 ? 'permanente' : 'cena' });
    ctx.salvarFicha(fx); ctx.render();
    if (n === 3) { const t = await rolarDanoUI({ titulo: `Desastre paranormal · ${nome}`, quem: fx.nome, formula: `${2 * circ}d10`, rotulo: 'DANO' }); if (t) { const fy = f(); sofrerDano(fy, derivar(fy), t.total, { tipo: 'mental' }); ctx.salvarFicha(fy); ctx.render(); extra = ` (${t.total} de dano mental)`; } }
    if (n === 2) { const t = await rolarDanoUI({ titulo: `Desastre paranormal · ${nome}`, quem: fx.nome, formula: `${3 * circ}d12`, rotulo: 'DANO' }); if (t) { const fy = f(); sofrerDano(fy, derivar(fy), t.total, { tipo: 'pv' }); ctx.salvarFicha(fy); ctx.render(); extra = ` (${t.total} de dano em você)`; } }
    abrirModal(`Desastre paranormal · ${n} · ${esc(nome)}`, `<p>${esc(txt)}${esc(extra)}</p><p class="apagado" style="font-size:.88rem">Sobrevivendo ao Horror, p. 117–118. ${atr ? 'O atributo e a condição já foram aplicados e aparecem no Status operacional (aba Agente), onde dá para tirar.' : ''}</p>`, '<button class="btn" data-acao="fechar-modal">Fechar</button>');
  };
  const resolver = async () => {
    if (capturar) ctx.avisar(formaId === 'basica' ? 'Símbolo criado para captar imagens e sons.' : 'Símbolo criado. Use a rolagem da forma correspondente quando decidir explodi-lo na mesa.');
    else if (presencaMedo) await acoesFicha(ctx)['presenca-dano']();
    else if (alvoId && catR.id !== 'capturar-momento') await aplicarAoAlvo();
    else if (formulaD) await rolarFormula();
    if (r.rolagemExtra) await rolarDanoUI({ titulo: `${r.nome}${nomeForma} · rolagem do efeito`, quem: ficha.nome, formula: r.rolagemExtra, rotulo: 'EFEITO' });
  };
  return { nomeForma, rolarFormula, aplicarAoAlvo, temResolucao, aposConjurar, desastre, resolver };
}
// 4. Concentração: Vontade contra a DT da situação ou da proteção vestida. Devolve false se perdeu o ritual.
export async function testarConcentracao(ctx, c, e, h) {
  const { d, K, r, protecao, dtProtecao, dtVontade } = c;
  const { quem } = h;
  // concentração
  if (dtVontade) { const pv = d.PER.vontade; proxima.dt = String(dtVontade); let t; try { t = await rolarTesteUI({ titulo: `Concentração · ${r.nome}${protecao && dtVontade === dtProtecao ? ` (proteção ${protecao === 2 ? 'pesada' : 'leve'})` : ''}`, quem: quem(), dados: pv.dados, bonus: pv.bonus }); } finally { proxima.dt = ''; } if (t.total < dtVontade) { ctx.avisar(`Falhou na concentração (${t.total} < ${dtVontade}): o ritual não funciona e os ${K} foram perdidos.`, true); return; } }
  return true;
}
// 5. Teste de Ocultismo (Custo do Paranormal; Medo e ritual desconhecido na conjuração complexa) e resolução do efeito.
export async function testarOcultismo(ctx, c, e, h) {
  const { ficha, d, K, complexa, desconhecido, efs, componente, r, forma, custo, opsOc } = c;
  const { nomeForma, temResolucao, aposConjurar, desastre, resolver } = e;
  const { f, testar, quem } = h;
  // Custo de Sanidade dos rituais de Medo (pago sempre, mesmo se o ritual falhar na conjuração complexa)
  const pagarMedo = () => {
    const fx = f(), dx = derivar(fx);
    const perda = forma?.value === 'verdadeiro' ? 3 : forma?.value === 'discente' ? 2 : 1;
    const recurso = dx.pd ? 'pd' : 'san';
    fx.recursos[recurso] = dx.atual[recurso] - custo - perda;
    fx.penalidadeSanPermanente += perda;
    ctx.salvarFicha(fx); ctx.render();
    return `−${custo} ${recurso.toUpperCase()}, mais ${perda} permanente`;
  };
  const medo = r.elemento === 'medo';
  // O Custo do Paranormal (menos Medo). Na conjuração complexa, todo ritual rola Ocultismo (SaH p. 116).
  if (!medo || complexa) {
    const oc = d.PER.ocultismo, dt = 20 + custo + (desconhecido ? 5 : 0);
    const base = oc.dados.pior ? 2 - oc.dados.qtd : oc.dados.qtd, q = base + opsOc.reduce((s, o) => s + (o.dados || 0), 0) - (efs.length ? 1 : 0) + (componente ? 1 : 0);
    let bonusOc = opsOc.reduce((s, o) => s + (o.bonus || 0), 0);
    const notasOc = [...opsOc.map(o => o.nome), ...(efs.length ? [`efeito elemental −1d20`] : []), ...(componente ? ['componente +1d20'] : []), ...(desconhecido ? ['ritual desconhecido DT +5'] : [])];
    for (const o of opsOc) if (o.dadoExtra) { const x = rolar(o.dadoExtra).total; bonusOc += x; notasOc.push(`${o.dadoExtra}=${x}`); }
    proxima.dt = String(dt);
    const t = await testar({ titulo: `${medo ? 'Ocultismo' : 'Custo do Paranormal'} · ${r.nome}${nomeForma}${notasOc.length ? ` (${notasOc.join(', ')})` : ''}`, quem: quem(), dados: q >= 1 ? { qtd: q, pior: false } : { qtd: 2 - q, pior: true }, bonus: oc.bonus + bonusOc }, oc.atrUsado, ficha, dt);
    proxima.dt = '';
    if (t.total < dt && medo) {
      // Medo: sem Custo do Paranormal, mas o ritual não funciona e os custos (PE e Sanidade do Medo) são pagos
      const pago = pagarMedo();
      ctx.avisar(`Falhou no Ocultismo (${t.total} < ${dt}): ${pago}. Na conjuração complexa o ritual não funciona.`, true);
      if (desconhecido) await desastre();
      return;
    }
    if (t.total < dt) {
      const fx = ficha, dx = derivar(fx); const perm = t.total <= dt - 5;
      if (dx.pd) fx.recursos.pd = dx.atual.pd - custo; else fx.recursos.san = dx.atual.san - custo;
      if (perm) {
        fx.penalidadeSanPermanente++;
        if (dx.pd) fx.recursos.pd--; else fx.recursos.san--;
      }
      ctx.salvarFicha(fx); ctx.render();
      if (complexa) {
        // Conjuração complexa: falhar significa que o ritual não funciona (custos pagos mesmo assim)
        ctx.avisar(`Falhou no Ocultismo (${t.total} < ${dt}): −${custo} ${dx.pd ? 'PD' : 'Sanidade'}${perm ? ' e −1 de Sanidade permanente' : ''}. Na conjuração complexa o ritual não funciona.`, true);
        if (desconhecido) await desastre();
        return;
      }
      ctx.avisar(`Falhou no Ocultismo (${t.total} < ${dt}): −${custo} ${dx.pd ? 'PD' : 'Sanidade'}${perm ? ' e −1 de Sanidade permanente' : ''}. O ritual funciona mesmo assim.`, true);
      await aposConjurar();
      if (temResolucao) oferecerEfeitoRitual(t, resolver);
      return;
    }
    ctx.avisar(`${r.nome}${nomeForma} conjurado: −${custo} ${K}${medo ? `, ${pagarMedo()}` : ''}. Passou no Ocultismo (${t.total}).`);
    await aposConjurar();
  } else {
    ctx.avisar(`${r.nome}${nomeForma}: −${custo} ${K} de conjuração e ${pagarMedo()}.`);
    await aposConjurar();
  }
  if (temResolucao) await resolver();
}
export async function conjurarRitual(ctx, el, h) {
  const c = lerConjuracao(ctx, el, h); if (!c) return;
  if (!pagarConjuracao(ctx, c, h)) return;
  const e = efeitosDaConjuracao(ctx, c, h);
  if (!(await testarConcentracao(ctx, c, e, h))) return;
  await testarOcultismo(ctx, c, e, h);
}
// Ações (botões data-acao) da aba
export function acoesRituais(ctx, h) {
  const { f, salvar, quem, testar } = h;
  return {
        'soltar-ritual': el => {
      const ficha = f(), r = ficha.rituaisRetidos[Number(el.dataset.i)]; if (!r) return;
      ficha.rituaisRetidos.splice(Number(el.dataset.i), 1); salvar();
      ctx.avisar(`${r.nome} solto: +${r.custo} ${derivar(ficha).pd ? 'PD' : 'PE'} máximos (os atuais voltam com descanso).`);
    },
        'soltar-ritual-calma': async el => {
      const ficha = f(), d = derivar(ficha), i = Number(el.dataset.i), r = ficha.rituaisRetidos[i]; if (!r) return;
      const oc = d.PER.ocultismo, dt = 20 + r.custo;
      proxima.dt = String(dt);
      let t; try { t = await rolarTesteUI({ titulo: `Soltar ${r.nome} com calma · Ocultismo DT ${dt}`, quem: quem(), dados: oc.dados, bonus: oc.bonus }); } finally { proxima.dt = ''; }
      const fx = f(), j = fx.rituaisRetidos.findIndex(x => x.uid === r.uid); if (j < 0) return;
      fx.rituaisRetidos.splice(j, 1);
      const k = d.pd ? 'pd' : 'pe';
      if (t && t.total >= dt) { const dx = derivar(fx); recuperar(fx, dx, k, r.custo); }
      salvar();
      ctx.avisar(t && t.total >= dt ? `Passou (${t.total}): ${r.nome} solto com calma, +${r.custo} ${k.toUpperCase()} máximos e atuais.` : `Falhou (${t?.total}): ${r.nome} solto, só os ${k.toUpperCase()} máximos voltaram.`);
    },
        'ritual-aprender': el => {
      const ficha = f(); const r = RITUAIS.find(x => x.id === el.dataset.id); if (!r) return;
      const problema = problemaAoAprender(ficha, derivar(ficha), r);
      if (problema) return ctx.avisar(problema, true);
      const novo = adicionarRitualCatalogo(ficha, r);
      const n = normalizar(ficha); Object.assign(ficha, n); ctx.salvarFicha(ficha); fecharModal();
      if (novo) ctx.avisar(`Ritual "${r.nome}" adicionado aos conhecidos.`);
      ctx.render();
    },
        'ritual-substituir': el => {
      const ficha = f(), ritual = RITUAIS.find(r => r.id === el.dataset.id);
      const poder = ficha.paranormais.find(p => p.id === 'aprender-ritual' && !p.trocaRitualUsada);
      if (!ritual || !poder) return;
      const candidatos = ficha.rituais.filter(anterior => {
        if (anterior.proprio || ritual.ritualExigido === anterior.nome) return false;
        if (ficha.rituais.some(r => RITUAIS.find(x => x.id === r.idCatalogo)?.ritualExigido === anterior.nome)) return false;
        const teste = { ...ficha, rituais: ficha.rituais.filter(r => r.uid !== anterior.uid) };
        return !problemaAoAprender(teste, derivar(teste), ritual);
      });
      if (!candidatos.length) return ctx.avisar('Nenhuma troca atende às vagas e requisitos do novo ritual.', true);
      janelaEscolha({ titulo: 'Qual ritual substituir?', opcoes: candidatos.map(r => ({ valor: r.uid, nome: r.nome })),
        aoEscolher: id => {
          const teste = { ...ficha, rituais: ficha.rituais.filter(r => r.uid !== id) };
          if (poder.trocaRitualUsada || teste.rituais.length === ficha.rituais.length || problemaAoAprender(teste, derivar(teste), ritual)) return;
          if (!adicionarRitualCatalogo(teste, ritual)) return;
          poder.trocaRitualUsada = true;
          Object.assign(ficha, normalizar(teste)); fecharModal(); salvar();
        } });
    },
        'ritual-catalogo-esquecer': el => {
      const ficha = f(); const r = RITUAIS.find(x => x.id === el.dataset.id); if (!r) return;
      ficha.rituais = ficha.rituais.filter(x => chaveRitual(x) !== chaveRitual(r));
      const n = normalizar(ficha); Object.assign(ficha, n); ctx.salvarFicha(ficha); fecharModal();
      ctx.avisar(`Ritual "${r.nome}" removido dos conhecidos.`);
      ctx.render();
    },
        'rolar-efeito': el => { rolarDanoUI({ titulo: `${el.dataset.nome} · ${el.dataset.formula}`, quem: quem(), formula: el.dataset.formula, rotulo: el.dataset.rotulo || 'DADOS' }); },
        'presenca-dano': async () => {
      await rolarDanoUI({ titulo: 'Presença do Medo · dano mental', quem: quem(), formula: '5d8', rotulo: 'DANO' });
      await rolarDanoUI({ titulo: 'Presença do Medo · dano de Medo', quem: quem(), formula: '5d8', rotulo: 'DANO' });
      ctx.avisar('Vontade reduz os dois danos à metade. Repita no início do turno dos alvos que estiverem na área.');
    },
        'rolar-ritual-previa': el => { const r = RITUAIS.find(x => x.id === el.dataset.id); if (r?.dados) rolarDanoUI({ titulo: `${r.nome} (prévia)`, quem: quem(), formula: r.dados, rotulo: r.tipoDados === 'cura' ? 'CURA' : 'DANO' }); },
        'capturar-explodir': el => {
      if (!f().rituais.some(r => r.idCatalogo === 'capturar-momento')) return;
      if (el.dataset.forma === 'verdadeiro' && derivar(f()).circuloMax < 3) return ctx.avisar('A forma verdadeira exige 3º círculo.', true);
      const formula = el.dataset.forma === 'verdadeiro' ? '8d8' : '4d8';
      return rolarDanoUI({ titulo: 'Capturar Momento · explosão de Morte (Fortitude reduz à metade)', quem: quem(), formula, rotulo: 'DANO' });
    },
        'rolar-ritual': el => {
      const r = derivar(f()).rituais[Number(el.dataset.i)]; if (!r) return;
      const cat = RITUAIS.find(x => x.id === r.idCatalogo) || {};
      return rolarDanoUI({ titulo: r.nome, quem: quem(), formula: formulaDaForma(r, cat, 'basica'), rotulo: r.tipoDados === 'cura' ? 'CURA' : 'DANO' });
    },
        'sustentar-ritual': el => {
      const ficha = f(), d = derivar(ficha);
      const r = el.dataset.itemUid ? conjuracaoDoItem(ficha, el.dataset.itemUid)?.r : d.rituais[Number(el.dataset.i)];
      if (!r || !/sustentad/i.test(r.duracao)) return;
      const custo = 1 + d.custoCondicao;
      if (!gastar(ficha, d, custo, d.limiteRitual, 0, `Sustentar ${r.nome}`)) return ctx.avisar('Sem recurso ou limite de gasto para sustentar.', true);
      salvar(); ctx.avisar(`Sustentou ${r.nome} neste turno.`);
    },
        'conjurar': el => {
      const d = derivar(f());
      if (d.semAcoes) return ctx.avisar('As condições atuais impedem a conjuração.', true);
      janelaConjurar(ctx, f(), d, Number(el.dataset.i));
    },
        'ritual-desconhecido-lista': () => {
      const ficha = f(), d = derivar(ficha);
      const treinado = d.PER.ocultismo?.grau >= 1, k = d.pd ? 'PD' : 'PE';
      const conhecidos = new Set(ficha.rituais.map(r => semAcento(r.nome)));
      const lista = RITUAIS.filter(r => (r.fonte !== 'SaH' || ficha.modo === 'sah') && !conhecidos.has(semAcento(r.nome))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
      // Mesmo visual do Grimório (aba Rituais): cartões na cor do elemento, com os mesmos filtros
      abrirModal('Conjurar ritual que não conheço', `<p class="apagado" style="font-size:.9rem;margin-top:0">Sobrevivendo ao Horror, p. 117: qualquer personagem <b>treinado em Ocultismo</b> pode tentar, se tiver informações básicas sobre o ritual (viu alguém conjurá-lo com sucesso, ou tem um texto ou gravação explicando), a critério do mestre. Segue as etapas da conjuração complexa com <b>DT +5</b> no Ocultismo; se falhar, além dos custos, sofre um <b>desastre paranormal</b>.</p>
        ${treinado ? '' : '<p class="aviso-regra">⚠ Você não é treinado em Ocultismo, então não pode tentar.</p>'}
        <div class="linha" style="margin:10px 0 12px">
          <input type="search" class="filtro" placeholder="Procurar ritual…" data-filtro-desconhecido="busca" aria-label="Procurar ritual">
          <select data-filtro-desconhecido="elemento" style="width:auto" aria-label="Elemento"><option value="">Todos os elementos</option>${ELEMENTOS.map(e => `<option value="${e.id}">${e.nome}</option>`).join('')}</select>
          <select data-filtro-desconhecido="circulo" style="width:auto" aria-label="Círculo"><option value="">Todos os círculos</option>${CIRCULOS.map(c => `<option value="${c.n}">${c.n}º círculo</option>`).join('')}</select>
        </div>
        <div class="caixas-ritual" id="desconhecido-lista">${lista.map(r => `<button type="button" class="caixa-ritual caixa-desconhecido el-${r.elemento}" data-acao="conjurar-desconhecido" data-id="${r.id}" data-elemento="${r.elemento}" data-circulo="${r.circulo}" data-texto="${esc(semAcento(r.nome + ' ' + (r.resumo || '')).toLowerCase())}" ${treinado ? '' : 'disabled'} aria-label="Conjurar ${esc(r.nome)} (${nomesElementos(r)}, ${r.circulo}º círculo)">
          <span class="caixa-check" aria-hidden="true"></span>
          ${sigilo(r.elemento, 'var(--el)')}
          <span class="txt"><b>${esc(r.nome)}</b> <small class="dossie-txt">${nomesElementos(r)} ${r.circulo}${fonteTag(r.fonte)}</small><small>${esc(r.resumo || '')}</small><small class="custo-desconhecido">${CIRCULOS[r.circulo - 1].custo} ${k} · Ocultismo DT ${20 + CIRCULOS[r.circulo - 1].custo + 5}${r.elemento === 'medo' ? '' : ' · Custo do Paranormal'}</small></span>
        </button>`).join('')}</div>
        <p id="desconhecido-vazio" class="vazio" hidden>Nenhum ritual encontrado com esses filtros.</p>`,
        '<button class="btn fantasma" data-acao="fechar-modal">Fechar</button>', true);
    },
        'conjurar-desconhecido': el => {
      const ficha = f(), d = derivar(ficha), desc = ritualDesconhecido(ficha, el.dataset.id);
      if (!desc || d.semAcoes) return ctx.avisar('A conjuração está indisponível.', true);
      janelaConjurar(ctx, ficha, d, -1, null, desc);
    },
        'conjurar-item': el => {
      const ficha = f(), d = derivar(ficha), origem = conjuracaoDoItem(ficha, el.dataset.uid);
      if (!origem || d.semAcoes) return ctx.avisar('A conjuração pelo item está indisponível.', true);
      janelaConjurar(ctx, ficha, d, -1, origem);
    },
        'conjurar-confirmar': el => conjurarRitual(ctx, el, { f, gastar, testar, quem }),
        'esquecer-ritual': el => { const ficha = f(); const r = ficha.rituais[Number(el.dataset.i)]; if (!confirm(`Esquecer o ritual "${r.nome}"?`)) return; ficha.rituais.splice(Number(el.dataset.i), 1); salvar(); },
        'ritual-proprio': () => { const ficha = f(); ficha.rituais.push({ uid: uid(), nome: 'Novo ritual', elemento: 'conhecimento', circulo: 1 }); ctx.salvarFicha(normalizar(ficha)); Object.assign(ficha, normalizar(ficha)); ctx.render(); },
  };
}
