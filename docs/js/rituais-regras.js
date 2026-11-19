// Regras de RITUAIS que não dependem da tela: requisitos das formas, versões e modos (dano e resistência),
// efeitos elementais da conjuração complexa, desastres paranormais e custos.
// Livro de Regras v1.3, Arquivos Secretos e Sobrevivendo ao Horror (pp. 114–118). Sem DOM: dá para testar no Node.
import { ELEMENTOS, CIRCULOS } from './catalogo.js?v=0.47';

const ELEM = Object.fromEntries(ELEMENTOS.map(e => [e.id, e]));

// ===== Regras únicas usadas pela prévia, pela janela de conjurar, pela atualização ao vivo e pelo botão Conjurar =====
// O que falta para usar uma forma (aprimoramento): círculo (e se extrapolar alcança) e afinidade
export const temAfinidadeRitual = (r, d) => (r.elementos?.length ? r.elementos : [r.elemento]).every(el => d.afinidade === el);
export const faltasDaForma = (fo, r, d) => ({
  circulo: !!fo.circulo && d.circuloMax < fo.circulo,
  extrapola: !!fo.circulo && d.circuloMax + 1 >= fo.circulo,
  afinidade: !!fo.afinidade && !temAfinidadeRitual(r, d),
});
// Conjuração complexa (SaH pp. 115–116): extrapolar = +1 círculo; "Ignorar um requisito" (tinta dourada) = ignora 1 requisito
export function formaLiberada(falta, { extrapolar = false, ignora = false } = {}) {
  const resta = (falta.circulo && !(extrapolar && falta.extrapola) ? 1 : 0) + (falta.afinidade ? 1 : 0);
  return resta <= (ignora ? 1 : 0);
}
// Proteção vestida: 0 nenhuma, 1 leve, 2 pesada (conjurar de proteção = condição ruim/terrível, Livro de Regras)
export const protecaoVestida = f => { const v = f.protecoes.filter(p => p.vestida); return v.some(p => p.peso === 'pesada') ? 2 : v.some(p => p.peso === 'leve') ? 1 : 0; };
// Requisito de uma forma (aprimoramento) como o livro escreve; sem "Requer" = sem requisito adicional
export const requisitoForma = (fo, r) => [fo.circulo ? `${fo.circulo}º círculo` : '', fo.afinidade ? `afinidade com ${(r.elementos?.length ? r.elementos : [r.elemento]).map(e => ELEM[e]?.nome || e).join(' + ')}` : ''].filter(Boolean).join(' e ');

export function formaRitual(r, cat, id) {
  if (cat[id]) return cat[id];
  if (r.proprio && (r.formulasAvancadas?.[id] || r[id]?.trim())) return { custo: r.custosAvancados[id] };
  return null;
}

export const custoDaForma = (r, adicional, desconto) =>
  desconto ? Math.max(1, CIRCULOS[r.circulo - 1].custo + adicional - desconto) : r.custo + adicional;

export const duracaoCena = (r, cat) => /^cena\b/i.test(String(r.duracao || cat.duracao || '').trim());

// 1ª etapa da Conjuração Complexa (SaH pp. 115–116): efeito elemental no símbolo, −1d20 no Ocultismo
// [id, efeito, quando se aplica, requisito ('dano' = o ritual causa dano do elemento; 'resistencia' = tem teste de resistência)]
export const MATERIAL_ELEMENTO = {
  sangue: { nome: 'Sangue', material: 'sangue', claro: '#f2708d', escuro: '#b3121f', efeitos: [
    ['cura', 'Recuperar 2d6 PV', 'Você recupera os PV se passar no teste de Ocultismo.', ''],
    ['dado', '+1 dado de dano de Sangue', 'O ritual precisa causar dano de Sangue.', 'dano'],
    ['cond', 'Causar Sangrando', 'Afeta quem falhar no teste de resistência do ritual.', 'resistencia']] },
  morte: { nome: 'Morte', material: 'cinzas ou carvão', claro: '#c3b5df', escuro: '#3a3a3a', efeitos: [
    ['dt', '+2 na DT de resistência', 'O ritual precisa ter teste de resistência. O bônus vai na DT que o alvo enfrenta.', 'resistencia'],
    ['dado', '+1 dado de dano de Morte', 'O ritual precisa causar dano de Morte.', 'dano'],
    ['cond', '−2 em testes até o fim da cena', 'Afeta quem falhar no teste de resistência do ritual.', 'resistencia']] },
  conhecimento: { nome: 'Conhecimento', material: 'tinta dourada', claro: '#e9c96b', escuro: '#9a7210', efeitos: [
    ['limite', '+2 no limite de PE do ritual', 'Aumenta quanto você pode gastar nesta conjuração.', ''],
    ['dado', '+1 dado de dano de Conhecimento', 'O ritual precisa causar dano de Conhecimento.', 'dano'],
    ['requisito', 'Ignorar um requisito de aprimoramento', 'Ignora um requisito de uma forma do ritual, como afinidade ou círculo.', '']] },
  energia: { nome: 'Energia', material: 'desenho luminoso ou incendiado', claro: '#c28afa', escuro: '#7b2cbf', efeitos: [
    ['acao', 'Uma ação de movimento extra', 'Você recebe a ação no próximo turno se passar no teste de Ocultismo.', ''],
    ['dado', '+1 dado de dano de Energia', 'O ritual precisa causar dano de Energia.', 'dano'],
    ['cond', 'Causar Ofuscado', 'Afeta quem falhar no teste de resistência do ritual.', 'resistencia']] },
};
export const efeitoElemental = (el, ef) => MATERIAL_ELEMENTO[el]?.efeitos.find(e => e[0] === ef);
// Tipo de dano da versão básica de cada ritual (texto dos livros), usado quando o ritual não está em VERSOES_RITUAL.
export const TIPO_DANO_BASE = {
  'eco-espiral': 'morte', 'flagelo-de-sangue': 'sangue', 'poeira-da-podridao': 'morte', 'ferver-sangue': 'sangue', 'purgatorio': 'sangue',
  'vomitar-pestes': 'sangue', 'inexistir': 'conhecimento', 'deflagracao-de-energia': 'energia', 'convocar-o-algoz': 'morte',
  'conhecendo-o-medo': 'mental', 'lamina-do-medo': 'medo', 'rajada-caotica': 'energia', 'esfolar': 'corte', 'desfazer-sinapses': 'conhecimento',
};
// Dano e resistência POR VERSÃO e POR MODO (Livro de Regras v1.3, Arquivos Secretos e Sobrevivendo ao Horror).
// O cabeçalho do ritual diz o elemento, mas só o texto de cada versão diz se ela causa dano daquele tipo e se o alvo faz teste de resistência.
// dano: tipos de dano que a versão causa nos alvos · res: teste de resistência que o alvo pode falhar ('' = nenhum)
// formula: dano daquela versão/modo (quando difere do cadastro) · modos: efeitos que o jogador escolhe ao conjurar.
export const V = (dano = [], res = '', formula = '', nota = '') => ({ dano, res, formula, nota });
export const comandosPerturbacao = extra => ({ modos: { Fuja: V([], 'Vontade'), Largue: V([], 'Vontade'), Pare: V([], 'Vontade'), 'Sente-se': V([], 'Vontade'), Venha: V([], 'Vontade'), ...extra } });
export const modosAgua = evaporar => ({ modos: { Congelar: V(), Derreter: V(), Enchente: V(), Evaporar: V(['energia'], 'Fortitude', evaporar), Partir: V() } });
export const modosTerra = { modos: { Amolecer: V(['impacto'], 'Reflexos', '10d6'), Modelar: V(), Solidificar: V() } };
export const modosSopro = { modos: { Ascender: V([], 'Fortitude'), Sopro: V(), Vento: V() } };
export const VERSOES_RITUAL = {
  // Chamas do Caos: os modos normais causam fogo, sem resistência; a labareda (discente/verdadeiro) causa Energia, Reflexos reduz à metade
  'chamas-do-caos': { basica: { modos: { Chamejar: V(['fogo'], '', '1d6'), Esquentar: V(['fogo'], '', '1d6'), Extinguir: V(), Modelar: V(['fogo'], '', '3d6') } },
    discente: { modos: { Labareda: V(['energia'], 'Reflexos', '4d6') } }, verdadeiro: { modos: { Labareda: V(['energia'], 'Reflexos', '8d6') } } },
  // Consumir Manancial: normal e discente dão PV temporários; só o verdadeiro causa dano de Morte (Fortitude)
  'consumir-manancial': { basica: V(), discente: V(), verdadeiro: V(['morte'], 'Fortitude', '3d6') },
  // Decadência: discente resolve com ataque corpo a corpo, sem teste de resistência
  'decadencia': { basica: V(['morte'], 'Fortitude'), discente: V(['morte'], ''), verdadeiro: V(['morte'], 'Fortitude') },
  // Contenção Fantasmagórica: só o verdadeiro causa dano (onda de choque de cada laço destruído)
  'contencao-fantasmagorica': { basica: V([], 'Reflexos'), discente: V([], 'Reflexos'), verdadeiro: V(['energia'], 'Reflexos', '2d6+2') },
  // Invadir Mente: rajada mental causa Conhecimento (Vontade); ligação telepática não causa dano (Vontade só no discente, alvo involuntário)
  'invadir-mente': { basica: { modos: { 'Rajada mental': V(['conhecimento'], 'Vontade', '6d6'), 'Ligação telepática': V() } },
    discente: { modos: { 'Rajada mental': V(['conhecimento'], 'Vontade', '10d6'), 'Ligação telepática': V([], 'Vontade (só alvo involuntário)') } },
    verdadeiro: { modos: { 'Rajada mental': V(['conhecimento'], 'Vontade', '10d6'), 'Ligação telepática': V() } } },
  // Tecer Ilusão: Vontade em todas; só o verdadeiro causa dano de Conhecimento
  'tecer-ilusao': { basica: V([], 'Vontade'), discente: V([], 'Vontade'), verdadeiro: V(['conhecimento'], 'Vontade', '6d6') },
  // Transfigurar Água: Evaporar causa Energia (Fortitude); Atletismo de Congelar e Pilotagem de Partir não são resistência
  'transfigurar-agua': { basica: modosAgua('5d8'), verdadeiro: modosAgua('10d8') },
  // Transfigurar Terra: Amolecer causa impacto (Reflexos); Atletismo de Solidificar não é resistência
  'transfigurar-terra': { basica: modosTerra, discente: modosTerra, verdadeiro: modosTerra },
  // Perturbação: Sofra (discente) causa Conhecimento; o verdadeiro adiciona Ataque
  'perturbacao': { basica: comandosPerturbacao(), discente: comandosPerturbacao({ Sofra: V(['conhecimento'], 'Vontade', '3d8') }), verdadeiro: comandosPerturbacao({ Ataque: V([], 'Vontade') }) },
  // Eletrocussão: a básica causa eletricidade; discente e verdadeiro causam Energia
  'eletrocussao': { basica: V(['eletricidade'], 'Fortitude'), discente: V(['energia'], 'Fortitude', '6d6'), verdadeiro: V(['energia'], 'Fortitude', '8d6') },
  // Miasma Entrópico: a básica causa dano químico; discente e verdadeiro, Morte
  'miasma-entropico': { basica: V(['quimico'], 'Fortitude'), discente: V(['morte'], 'Fortitude', '6d8'), verdadeiro: V(['morte'], 'Fortitude', '6d8') },
  'paradoxo': { basica: V(['morte'], 'Fortitude'), discente: V(['morte'], 'Fortitude', '4d6'), verdadeiro: V(['morte'], 'Fortitude', '13d6') },
  // Descarnar: metade corte, metade Sangue; o verdadeiro dá +4d8 de Sangue nos seus ataques
  'descarnar': { basica: V(['sangue', 'corte'], 'Fortitude'), discente: V(['sangue', 'corte'], 'Fortitude', '10d8'), verdadeiro: V(['sangue'], 'Fortitude', '4d8') },
  // Hemofagia causa dano de Sangue (você recupera metade); o discente usa ataque corpo a corpo, sem resistência
  'hemofagia': { basica: V(['sangue'], 'Fortitude'), discente: V(['sangue'], ''), verdadeiro: V(['sangue'], 'Fortitude', '4d6') },
  'compreensao-paranormal': { basica: V([], 'Vontade'), discente: V([], 'Vontade'), verdadeiro: V() },
  'luz': { basica: V([], 'Vontade'), discente: V(), verdadeiro: V() },
  'polarizacao-caotica': { basica: V([], 'Vontade'), discente: V(['impacto'], 'Reflexos'), verdadeiro: V([], 'Vontade') },
  'dissonancia-acustica': { basica: V(), discente: V([], 'Vontade'), verdadeiro: V() },
  'tela-de-ruido': { basica: V(), discente: V(), verdadeiro: V([], 'Reflexos') },
  'sopro-do-caos': { basica: modosSopro, discente: modosSopro, verdadeiro: modosSopro },
  'tentaculos-de-lodo': { basica: V(['impacto', 'morte'], ''), verdadeiro: V(['impacto', 'morte'], '', '6d6') },
  'capturar-momento': { basica: V(), discente: V(['morte'], 'Fortitude', '4d8'), verdadeiro: V(['morte'], 'Fortitude', '8d8') },
  'backup': { basica: V(), discente: V(), verdadeiro: V(['energia'], 'Reflexos', '6d6') },
  'presenca-do-medo': { basica: V(['mental', 'medo'], 'Vontade') },
  'amaldicoar-arma': { basica: V(['variavel']), discente: V(['variavel']), verdadeiro: V(['variavel']) },
  // Fim Inevitável: 100 de dano de Morte FIXO — não há dado para aumentar; a Fortitude continua valendo para os efeitos de resistência
  'fim-inevitavel': ((n) => ({ basica: V([], 'Fortitude', '', n), discente: V([], 'Fortitude', '', n), verdadeiro: V([], 'Fortitude', '', n) }))('O dano de Morte deste ritual é fixo (100), sem dado para aumentar. Se o mestre permitir o bônus, resolva à mão.'),
  // Tremeluzir / Fedor Pútrido: o 1d4 por rodada é consequência de manter o efeito (em você e, no discente/verdadeiro, nos seres voluntários).
  // Interpretação para a automação: o dado extra fica desligado; o mestre pode liberar e resolver à mão.
  'tremeluzir': ((n) => ({ basica: V([], '', '', n), discente: V([], '', '', n), verdadeiro: V([], '', '', n) }))('O 1d4 de Energia por rodada é consequência de manter o efeito (em quem está sob ele). Por interpretação, o site não soma o dado extra; se o mestre permitir, resolva à mão.'),
  'fedor-putrido': ((n) => ({ basica: V([], '', '', n), discente: V([], '', '', n), verdadeiro: V([], '', '', n) }))('O 1d4 de Morte por rodada é consequência de manter o efeito (em quem está sob ele). Por interpretação, o site não soma o dado extra; se o mestre permitir, resolva à mão.'),
  // redução de dano / rolagem que não é dano
  'sede-de-adrenalina': { basica: V(), discente: V(), verdadeiro: V() }, 'ouvir-os-sussurros': { basica: V(), discente: V(), verdadeiro: V() },
  'teletransporte': { basica: V(), verdadeiro: V() }, // o 1d10 é a distância do erro (x 10 km), não dano
};
export const NOME_FORMA = { basica: 'Básica', discente: 'Discente', verdadeiro: 'Verdadeiro' };
// Versão padrão (ritual fora da tabela): tipo de dano do cadastro e resistência do cabeçalho
export function versaoPadrao(r, cat, formaId, formula) {
  const res = String(r.resistencia || cat.resistencia || '').trim();
  const tipo = !formula || r.tipoDados === 'cura' ? '' : TIPO_DANO_BASE[cat.id] || (r.proprio ? r.elemento || '?' : '?');
  return V(tipo ? [tipo] : [], res);
}
// { basica: [[modo, versão], ...], discente: [...], verdadeiro: [...] } só com as formas que o ritual tem
export function versoesDoRitual(r, cat, formulaDe = () => '') {
  const t = VERSOES_RITUAL[cat.id], out = {};
  for (const forma of ['basica', 'discente', 'verdadeiro']) {
    if (forma !== 'basica' && !formaRitual(r, cat, forma)) continue;
    const e = t?.[forma];
    out[forma] = e ? (e.modos ? Object.entries(e.modos) : [['', e]]) : [['', versaoPadrao(r, cat, forma, formulaDe(forma))]];
  }
  return out;
}
export function versaoEscolhida(r, cat, formaId, modo, formulaDe) {
  const lista = versoesDoRitual(r, cat, formulaDe)[formaId] || [];
  return (lista.find(([m]) => m === modo) || lista[0] || ['', V()])[1];
}
// O efeito elemental vale nesta versão? Devolve o motivo quando não vale ('' = vale).
export function motivoEfeito(el, ef, v) {
  const [, , , req] = efeitoElemental(el, ef) || [];
  if (req === 'dano') {
    if (!v.dano.length) return 'nesta versão o ritual não causa dano';
    if (!v.dano.some(t => t === el || t === 'variavel' || t === '?')) return `nesta versão o dano é de ${v.dano.join(' e ')}`;
  }
  if (req === 'resistencia' && !v.res) return 'nesta versão o alvo não faz teste de resistência';
  return '';
}
// "Requer Discente ou Verdadeiro" / "Requer Básica (modo Evaporar) ou Verdadeiro (modo Evaporar)"
export function ondeEfeitoVale(el, ef, versoes) {
  const partes = [], modosOk = [];
  for (const [forma, lista] of Object.entries(versoes)) {
    const ok = lista.filter(([, v]) => !motivoEfeito(el, ef, v));
    modosOk.push(ok.length === lista.length ? '*' : ok.map(([m]) => m).join('|'));
    if (!ok.length) continue;
    partes.push(ok.length === lista.length ? NOME_FORMA[forma] : `${NOME_FORMA[forma]} (${ok.map(([m]) => `modo ${m}`).join(' ou ')})`);
  }
  // mesmo modo em todas as versões → "o modo Evaporar"
  if (modosOk.length > 1 && modosOk.every(x => x && x !== '*' && x === modosOk[0])) return [`o modo ${modosOk[0].split('|').join(' ou ')}`];
  return partes;
}

// Aumenta em 1 o primeiro grupo de dados de uma fórmula ("3d6+3" → "4d6+3")
export const maisUmDado = formula => formula ? formula.replace(/^(\s*)(\d*)d(\d+)/, (_, s, n, l) => `${s}${(Number(n) || 1) + 1}d${l}`) : formula;
export const DESASTRES = {
  1: ['Consumido pelo Outro Lado', 'Você morre e se torna uma criatura do elemento do ritual (VD ≈ 4× seu NEX), controlada pelo mestre a partir da próxima rodada.', null, null],
  2: ['Surto Elemental', 'Explosão do elemento: você e todos a até 9 m sofrem 3d12 por círculo do ritual (os outros fazem Reflexos DT do ritual +5 para metade).', null, null],
  3: ['Assalto Psíquico', 'Você sofre 2d10 de dano mental por círculo do ritual.', null, null],
  4: ['Decrepitude Motora', 'Perde 1 de Agilidade permanentemente e fica desprevenido até o fim da cena.', 'agi', 'desprevenido'],
  5: ['Definhamento Muscular', 'Perde 1 de Força permanentemente e fica debilitado até o fim da cena.', 'for', 'debilitado'],
  6: ['Oblívio Mental', 'Perde 1 de Intelecto permanentemente e fica esmorecido até o fim da cena.', 'int', 'esmorecido'],
  7: ['Eu Perdido', 'Perde 1 de Presença permanentemente e fica alquebrado até o fim da cena.', 'pre', 'alquebrado'],
  8: ['Dor Profunda', 'Perde 1 de Vigor permanentemente e fica enjoado até o fim da cena.', 'vig', 'enjoado'],
};
