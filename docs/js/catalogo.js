import { ITENS_ESPECIAIS, ITENS_ARQUIVOS, MATERIAL_SAH } from './equipamentos.js?v=0.40.2';
import { ORIGENS_AS, TRILHAS_AS, PODERES_AS, PARANORMAIS_AS } from './catalogo-as.js?v=0.40.2';
// ═══════════ catalogo ═══════════
// catalogo.js — as regras do sistema escritas como DADOS.
// Tudo aqui são números e nomes das regras + resumos curtos, escritos com outras palavras.
// O texto oficial está nos livros (Livro de Regras = "LR"; Sobrevivendo ao Horror = "SaH").
// Para mudar uma regra, mude aqui: as telas e o motor (regras.js) leem deste arquivo.


export const NOME_DO_SITE = 'Ficha Oculta RPG';

// ---------- Modos de regra (escolhidos ANTES de criar a ficha) ----------
export const MODOS = {
  padrao: { nome: 'Regras Padrão', livro: 'Livro de Regras', resumo: 'Agentes da Ordem desde o início: NEX 5%, as três classes, PV, PE e Sanidade. Também permite a classe Sobrevivente (por estágios).' },
  sah: { nome: 'Sobrevivendo ao Horror', livro: 'Sobrevivendo ao Horror', resumo: 'Tudo do padrão + a classe Sobrevivente (gente comum), 20 novas origens, novas trilhas, poderes gerais e as regras opcionais de horror.' },
};

// Regras opcionais do Sobrevivendo ao Horror (só aparecem no modo "sah")
export const OPCIONAIS = {
  idade: { nome: 'Personagens de Idade Variada', pagina: 'LR pp. 172–174', resumo: 'A faixa etária altera atributos, origem, recursos e progressão.' },
  municao: { nome: 'Contagem de Munição', pagina: 'LR p. 174', resumo: 'Controla disparos, carregador e reserva por arma.' },
  determinacao: { nome: 'Jogando sem Sanidade (Determinação)', pagina: 'SaH p. 104', resumo: 'PE e Sanidade viram uma só reserva: Pontos de Determinação (PD). Dano mental e custos saem dos PD.' },
  nivelExp: { nome: 'NEX & Nível de Experiência', pagina: 'SaH p. 98', resumo: 'A evolução da classe passa a ser por nível (1 a 20). O NEX vira só a exposição ao paranormal e começa em 0%.' },
  patentes: { nome: 'Evolução por Patentes', pagina: 'SaH p. 108', resumo: 'Em vez de 20 níveis, o agente sobe por 5 patentes. Fichas mais leves e agentes menos poderosos. Exige Determinação.' },
  progressaoNex: { nome: 'Progressão de NEX', pagina: 'SaH p. 99', resumo: 'A exposição muda o agente: em NEX 25/35/50% e nas faixas 60/75/90% do elemento escolhido ele ganha poderes e penalidades. Desligada, o NEX só é anotado.' },
  ferimentos: { nome: 'Ferimentos Debilitantes', pagina: 'SaH p. 105', resumo: 'Falhar contra dano massivo causa um ferimento num atributo (–1 dado nos testes dele) em vez de cair a 0 PV.' },
};

// ---------- Atributos ----------
export const ATRIBUTOS = [
  { id: 'agi', nome: 'Agilidade', sigla: 'AGI' },
  { id: 'for', nome: 'Força', sigla: 'FOR' },
  { id: 'int', nome: 'Intelecto', sigla: 'INT' },
  { id: 'pre', nome: 'Presença', sigla: 'PRE' },
  { id: 'vig', nome: 'Vigor', sigla: 'VIG' },
];
// Criação: todos começam em 1, distribui pontos (4; o Sobrevivente só 3), pode baixar UM para 0 e ganhar +1. Máximo 3.
export const CRIACAO_ATRIBUTOS = { inicial: 1, pontos: 4, pontosSobrevivente: 3, maximo: 3, maximoAumento: 5, maximoAumentoPatente: 4 };

// ---------- Perícias ----------
// treinada: só pode ser usada se for treinado. carga: sofre penalidade de carga.
export const PERICIAS = [
  ['acrobacia', 'Acrobacia', 'agi', { carga: true }],
  ['adestramento', 'Adestramento', 'pre', { treinada: true }],
  ['artes', 'Artes', 'pre', { treinada: true }],
  ['atletismo', 'Atletismo', 'for', {}],
  ['atualidades', 'Atualidades', 'int', {}],
  ['ciencias', 'Ciências', 'int', { treinada: true }],
  ['crime', 'Crime', 'agi', { treinada: true, carga: true }],
  ['diplomacia', 'Diplomacia', 'pre', {}],
  ['enganacao', 'Enganação', 'pre', {}],
  ['fortitude', 'Fortitude', 'vig', {}],
  ['furtividade', 'Furtividade', 'agi', { carga: true }],
  ['iniciativa', 'Iniciativa', 'agi', {}],
  ['intimidacao', 'Intimidação', 'pre', {}],
  ['intuicao', 'Intuição', 'pre', {}],
  ['investigacao', 'Investigação', 'int', {}],
  ['luta', 'Luta', 'for', {}],
  ['medicina', 'Medicina', 'int', {}],
  ['ocultismo', 'Ocultismo', 'int', { treinada: true }],
  ['percepcao', 'Percepção', 'pre', {}],
  ['pilotagem', 'Pilotagem', 'agi', { treinada: true }],
  ['pontaria', 'Pontaria', 'agi', {}],
  ['profissao', 'Profissão', 'int', { treinada: true }],
  ['reflexos', 'Reflexos', 'agi', {}],
  ['religiao', 'Religião', 'pre', { treinada: true }],
  ['sobrevivencia', 'Sobrevivência', 'int', {}],
  ['tatica', 'Tática', 'int', { treinada: true }],
  ['tecnologia', 'Tecnologia', 'int', { treinada: true }],
  ['vontade', 'Vontade', 'pre', {}],
].map(([id, nome, atr, f]) => ({ id, nome, atr, treinada: !!f.treinada, carga: !!f.carga }));
export const PERICIA = Object.fromEntries(PERICIAS.map(p => [p.id, p]));

// Grau de treinamento → bônus. Veterano a partir de NEX 35% (nível 7); expert a partir de NEX 70% (nível 14).
export const GRAUS = [
  { id: 0, nome: 'Destreinado', bonus: 0, curto: '—' },
  { id: 1, nome: 'Treinado', bonus: 5, curto: 'T' },
  { id: 2, nome: 'Veterano', bonus: 10, curto: 'V', nivelMinimo: 7 },
  { id: 3, nome: 'Expert', bonus: 15, curto: 'E', nivelMinimo: 14 },
];

// ---------- NEX ----------
export const NEX = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];
export const nivelDoNex = nex => Math.max(1, NEX.indexOf(Number(nex)) + 1 || NEX.filter(n => n <= nex).length || 1);

// ---------- Elementos ----------
export const ELEMENTOS = [
  { id: 'sangue', nome: 'Sangue', cor: '#b3121f' },
  { id: 'morte', nome: 'Morte', cor: '#3a3a3a' },
  { id: 'conhecimento', nome: 'Conhecimento', cor: '#c9971c' },
  { id: 'energia', nome: 'Energia', cor: '#7b2cbf' },
  { id: 'medo', nome: 'Medo', cor: '#e9e6df' },
  { id: 'variavel', nome: 'Variável', cor: '#6b6b6b' },
];
export const CIRCULOS = [
  { n: 1, custo: 1 }, { n: 2, custo: 3 }, { n: 3, custo: 6 }, { n: 4, custo: 10 },
];

// ---------- Classes ----------
// prog: o que cada classe ganha em cada NEX (índice 1..20). Texto curto, usado na lista "Habilidades por NEX".
const progPadrao = extra => {
  const p = {};
  for (let n = 1; n <= 20; n++) p[n] = [];
  [2, 8, 13, 20].forEach(n => p[n].push('trilha'));
  [3, 6, 9, 12, 15, 18].forEach(n => p[n].push('poder'));
  [4, 10, 16, 19].forEach(n => p[n].push('atributo'));
  [7, 14].forEach(n => p[n].push('grau'));
  p[10].push('versatilidade');
  for (const [n, t] of Object.entries(extra)) p[n].unshift(...[].concat(t));
  return p;
};

export const CLASSES = {
  mundano: {
    nome: 'Mundano', fonte: 'LR', lema: 'Uma pessoa comum antes do primeiro contato.',
    pv: [8, 0], pe: [1, 0], san: [8, 0], pd: [4, 0],
    patente: { pv: [8, 0], pd: [4, 0] },
    pericias: { fixas: [], livres: 1 }, proficiencias: ['Armas simples'], prof: { simples: true },
    grauTreinamento: 0, prog: {},
    habilidades: [{ nome: 'Empenho', nivel: 1, resumo: 'Gaste 1 PE para receber +2 em um teste de perícia.' }],
  },
  combatente: {
    nome: 'Combatente', fonte: 'LR',
    lema: 'Linha de frente: armas, força e coragem.',
    pv: [20, 4], pe: [2, 2], san: [12, 3], pd: [6, 3],
    patente: { pv: [20, 10], pd: [8, 4] },
    pericias: { fixas: [['luta', 'pontaria'], ['fortitude', 'reflexos']], livres: 1 },
    proficiencias: ['Armas simples', 'Armas táticas', 'Proteções leves'],
    prof: { simples: true, taticas: true, leve: true },
    grauTreinamento: 2,
    prog: progPadrao({ 1: 'Ataque Especial (2 PE, +5)', 5: 'Ataque Especial (3 PE, +10)', 11: 'Ataque Especial (4 PE, +15)', 17: 'Ataque Especial (5 PE, +20)' }),
    habilidades: [
      { nome: 'Ataque Especial', nivel: 1, resumo: 'Ao atacar, gaste PE para somar +5 no ataque ou no dano. O custo e o bônus máximo crescem com o NEX (2 PE/+5 → 5 PE/+20); cada +5 vai onde você quiser.' },
    ],
  },
  especialista: {
    nome: 'Especialista', fonte: 'LR',
    lema: 'Perícia, técnica e jogo de cintura.',
    pv: [16, 3], pe: [3, 3], san: [16, 4], pd: [8, 4],
    patente: { pv: [16, 8], pd: [12, 6] },
    pericias: { fixas: [], livres: 7 },
    proficiencias: ['Armas simples', 'Proteções leves'],
    prof: { simples: true, leve: true },
    grauTreinamento: 5,
    prog: progPadrao({ 1: ['Eclético', 'Perito (2 PE, +1d6)'], 5: 'Perito (3 PE, +1d8)', 8: 'Engenhosidade', 11: 'Perito (4 PE, +1d10)', 17: 'Perito (5 PE, +1d12)' }),
    habilidades: [
      { nome: 'Eclético', nivel: 1, resumo: 'Gaste 2 PE para fazer um teste como se fosse treinado na perícia.' },
      { nome: 'Perito', nivel: 1, resumo: 'Escolha duas perícias treinadas (menos Luta e Pontaria). Gaste PE para somar um dado extra no teste: 2 PE/+1d6, depois 3/+1d8, 4/+1d10, 5/+1d12.' },
      { nome: 'Engenhosidade', nivel: 8, resumo: 'Com Eclético, pague +2 PE para ter os benefícios de veterano (e mais tarde expert).' },
    ],
  },
  ocultista: {
    nome: 'Ocultista', fonte: 'LR',
    lema: 'Rituais e conexão com o Outro Lado.',
    pv: [12, 2], pe: [4, 4], san: [20, 5], pd: [10, 5],
    patente: { pv: [12, 6], pd: [16, 8] },
    pericias: { fixas: [['ocultismo'], ['vontade']], livres: 3 },
    proficiencias: ['Armas simples'],
    prof: { simples: true },
    grauTreinamento: 3,
    prog: progPadrao({ 1: 'Escolhido pelo Outro Lado (1º círculo)', 5: 'Rituais de 2º círculo', 11: 'Rituais de 3º círculo', 17: 'Rituais de 4º círculo' }),
    habilidades: [
      { nome: 'Escolhido pelo Outro Lado', nivel: 1, resumo: 'Conjura rituais. Começa com 3 rituais de 1º círculo e aprende 1 novo a cada NEX. Libera o 2º círculo em NEX 25%, o 3º em 55% e o 4º em 85%.' },
    ],
  },
  sobrevivente: {
    nome: 'Sobrevivente', fonte: 'SaH', // disponível também nas Regras Padrão (pedido do usuário)
    lema: 'Gente comum diante do horror. Mais fraco de propósito.',
    pv: [8, 2], pe: [2, 1], san: [8, 2], pd: [4, 2], porEstagio: true,
    pericias: { fixas: [], livres: 1 },
    proficiencias: ['Armas simples'],
    prof: { simples: true },
    grauTreinamento: 0,
    habilidades: [
      { nome: 'Empenho', nivel: 1, resumo: 'Ao fazer um teste de perícia, gaste 1 PE para receber +2.' },
      { nome: 'Trilha (1ª habilidade)', nivel: 2, resumo: 'Escolha Durão, Esperto ou Esotérico.' },
      { nome: 'Aumento de atributo', nivel: 3, resumo: '+1 em um atributo (máximo 3).' },
      { nome: 'Trilha (2ª habilidade)', nivel: 4, resumo: 'Segunda e última habilidade da trilha.' },
      { nome: 'Cicatrizado', nivel: 5, resumo: 'Trauma contra um tipo de perigo paranormal (–1 dado para resistir), mas uma vez por sessão pode sacrificar 1 PV ou 1 PE permanente para ignorar um dano mental/gasto de PE ou reduzir um dano físico à metade.' },
    ],
  },
};

// Benefícios do Sobrevivente que entra para a Ordem (Treinamento Especial, SaH p. 32)
export const TREINAMENTO_ESPECIAL = {
  combatente: '+8 PV; Fortitude ou Reflexos e Luta ou Pontaria; armas táticas e proteções leves; Ataque Especial.',
  especialista: '+4 PV, +1 PE, +4 SAN; 6 perícias à escolha; proteções leves; Eclético e Perito.',
  ocultista: '+2 PE, +8 SAN; Ocultismo, Vontade e mais 2; Escolhido pelo Outro Lado.',
};

// ---------- Patentes ----------
export const PATENTES = [
  { n: 1, nome: 'Recruta', pp: 0, credito: 'Baixo', itens: [2, 0, 0, 0], limitePd: 1 },
  { n: 2, nome: 'Operador', pp: 20, credito: 'Médio', itens: [3, 1, 0, 0], limitePd: 3 },
  { n: 3, nome: 'Agente especial', pp: 50, credito: 'Médio', itens: [3, 2, 1, 0], limitePd: 6 },
  { n: 4, nome: 'Oficial de operações', pp: 100, credito: 'Alto', itens: [3, 3, 2, 1], limitePd: 10 },
  { n: 5, nome: 'Agente de elite', pp: 200, credito: 'Ilimitado', itens: [3, 3, 3, 2], limitePd: 15 },
];
export const patenteDosPP = pp => [...PATENTES].reverse().find(p => (pp || 0) >= p.pp) || PATENTES[0];
// Evolução por patentes (SaH): o que cada classe ganha ao chegar em cada patente
export const PROG_PATENTE = {
  combatente: { 1: ['Ataque Especial (1 PD, +5)'], 2: ['Aumento de atributo', 'Poder de combatente'], 3: ['Ataque Especial (2 PD, +10)', 'Grau de treinamento', 'Poder de combatente', 'Trilha (1ª habilidade)'], 4: ['Ataque Especial (3 PD, +15)', 'Aumento de atributo', 'Poder de combatente', 'Trilha (2ª habilidade)'], 5: ['Ataque Especial (4 PD, +20)', 'Grau de treinamento', 'Poder de combatente', 'Trilha (3ª ou 4ª habilidade)'] },
  especialista: { 1: ['Eclético', 'Perito (1 PD, +1d6)'], 2: ['Aumento de atributo', 'Poder de especialista'], 3: ['Perito (2 PD, +1d8)', 'Grau de treinamento', 'Poder de especialista', 'Trilha (1ª habilidade)'], 4: ['Perito (3 PD, +1d10)', 'Aumento de atributo', 'Poder de especialista', 'Trilha (2ª habilidade)'], 5: ['Perito (4 PD, +1d12)', 'Grau de treinamento', 'Poder de especialista', 'Trilha (3ª ou 4ª habilidade)'] },
  ocultista: { 1: ['Escolhido pelo Outro Lado (1º círculo)'], 2: ['Aumento de atributo', 'Poder de ocultista'], 3: ['Escolhido pelo Outro Lado (2º círculo)', 'Grau de treinamento', 'Poder de ocultista', 'Trilha (1ª habilidade)'], 4: ['Escolhido pelo Outro Lado (3º círculo)', 'Aumento de atributo', 'Poder de ocultista', 'Trilha (2ª habilidade)'], 5: ['Escolhido pelo Outro Lado (4º círculo)', 'Grau de treinamento', 'Poder de ocultista', 'Trilha (3ª ou 4ª habilidade)'] },
};

// ---------- Origens ----------
// pericias: as duas treinadas ('*' = escolha livre). ef: efeitos automáticos na ficha.
const O = (id, nome, pericias, poder, resumo, fonte = 'LR', ef = null) => ({ id, nome, pericias, poder, resumo, fonte, ef });
export const ORIGENS = [
  O('academico', 'Acadêmico', ['ciencias', 'investigacao'], 'Saber é Poder', 'Em um teste de Intelecto, gaste 2 PE para receber +5.'),
  O('agente-saude', 'Agente de Saúde', ['intuicao', 'medicina'], 'Técnica Medicinal', 'Quando cura alguém, soma seu Intelecto aos PV curados.'),
  O('amnesico', 'Amnésico', ['*', '*'], 'Vislumbres do Passado', 'Perícias escolhidas pelo mestre. Uma vez por sessão, um teste de Intelecto pode revelar algo do seu passado.'),
  O('artista', 'Artista', ['artes', 'enganacao'], 'Magnum Opus', 'Você é famoso por uma obra; uma vez por missão pode se beneficiar disso com quem a conhece.'),
  O('atleta', 'Atleta', ['acrobacia', 'atletismo'], '110%', 'Em testes de perícia de Força ou Agilidade (menos Luta e Pontaria), gaste 2 PE para +5.'),
  O('chef', 'Chef', ['fortitude', 'profissao'], 'Ingrediente Secreto', 'No interlúdio, prepara um prato que dá um bônus ao grupo.'),
  O('criminoso', 'Criminoso', ['crime', 'furtividade'], 'O Crime Compensa', 'Ao fim de cada missão, guarda um item extra que encontrou.'),
  O('cultista', 'Cultista Arrependido', ['ocultismo', 'religiao'], 'Traços do Outro Lado', 'Ganha um poder paranormal, mas começa com metade da Sanidade.', 'LR', { sanMetade: true }),
  O('desgarrado', 'Desgarrado', ['fortitude', 'sobrevivencia'], 'Calejado', '+1 PV para cada 5% de NEX.', 'LR', { pvPorNivel: 1 }),
  O('engenheiro', 'Engenheiro', ['profissao', 'tecnologia'], 'Ferramenta Favorita', 'Um item à sua escolha (menos armas) conta como uma categoria abaixo.'),
  O('executivo', 'Executivo', ['diplomacia', 'profissao'], 'Processo Otimizado', 'Em testes estendidos ou de revisar documentos, gaste 2 PE para somar +5.'),
  O('investigador', 'Investigador', ['investigacao', 'percepcao'], 'Faro para Pistas', 'Uma vez por cena, ao procurar pistas, gaste 1 PE para receber +5.'),
  O('lutador', 'Lutador', ['luta', 'reflexos'], 'Mão Pesada', '+2 no dano de ataques corpo a corpo.', 'LR', { danoCorpo: 2 }),
  O('magnata', 'Magnata', ['diplomacia', 'pilotagem'], 'Patrocinador da Ordem', 'Seu limite de crédito é sempre um acima da patente.'),
  O('mercenario', 'Mercenário', ['iniciativa', 'intimidacao'], 'Posição de Combate', 'Na primeira rodada de combate, gaste 2 PE para uma ação de movimento extra.'),
  O('militar', 'Militar', ['pontaria', 'tatica'], 'Para Bellum', '+2 no dano com armas de fogo.', 'LR', { danoFogo: 2 }),
  O('operario', 'Operário', ['fortitude', 'profissao'], 'Ferramenta de Trabalho', 'Escolhe uma arma simples ou tática que seja ferramenta do seu ofício: +1 em ataque, dano e margem de ameaça com ela.'),
  O('policial', 'Policial', ['percepcao', 'pontaria'], 'Patrulha', '+2 na Defesa.', 'LR', { defesa: 2 }),
  O('religioso', 'Religioso', ['religiao', 'vontade'], 'Acalentar', '+5 em Religião para acalmar; quem você acalma recupera Sanidade.'),
  O('servidor', 'Servidor Público', ['intuicao', 'vontade'], 'Espírito Cívico', 'Ao ajudar um aliado (facilitar), gaste 1 PE para aumentar o bônus em +2.'),
  O('teorico', 'Teórico da Conspiração', ['investigacao', 'ocultismo'], 'Eu Já Sabia', 'Resistência a dano mental igual ao seu Intelecto.'),
  O('ti', 'T.I.', ['investigacao', 'tecnologia'], 'Motor de Busca', 'Com internet, gaste 2 PE para trocar um teste de perícia por Tecnologia.'),
  O('rural', 'Trabalhador Rural', ['adestramento', 'sobrevivencia'], 'Desbravador', 'Em Adestramento ou Sobrevivência, gaste 2 PE para +5; ignora terreno difícil natural.'),
  O('trambiqueiro', 'Trambiqueiro', ['crime', 'enganacao'], 'Impostor', 'Uma vez por cena, gaste 2 PE para trocar um teste de perícia por Enganação.'),
  O('universitario', 'Universitário', ['atualidades', 'investigacao'], 'Dedicação', '+1 PE, e mais +1 PE a cada NEX ímpar (15%, 25%…).', 'LR', { peDedicacao: true }),
  O('vitima', 'Vítima', ['reflexos', 'vontade'], 'Cicatrizes Psicológicas', '+1 de Sanidade para cada 5% de NEX.', 'LR', { sanPorNivel: 1 }),
  // ----- Sobrevivendo ao Horror (origens da comunidade) -----
  O('amigo-animais', 'Amigo dos Animais', ['adestramento', 'percepcao'], 'Companheiro Animal', 'Entende animais e tem um companheiro animal (aliado com +2 numa perícia, melhora em NEX 35% e 70%). Perdê-lo custa Sanidade.', 'SaH'),
  O('astronauta', 'Astronauta', ['ciencias', 'fortitude'], 'Acostumado ao Extremo', 'Contra dano de fogo, frio ou mental, gaste 1 PE para reduzir 5 (o custo sobe a cada uso na cena).', 'SaH'),
  O('chef-outro-lado', 'Chef do Outro Lado', ['ocultismo', 'profissao'], 'Fome do Outro Lado', 'Cozinha partes de criaturas: o prato dá resistência ao elemento (ou vulnerabilidade, se falhar). Cada refeição custa Sanidade permanente.', 'SaH'),
  O('colegial', 'Colegial', ['atualidades', 'tecnologia'], 'Poder da Amizade', '+2 nos testes de perícia perto do seu melhor amigo. Se ele morrer, você perde PE até o fim da missão.', 'SaH'),
  O('cosplayer', 'Cosplayer', ['artes', 'vontade'], 'Não é Fantasia, é Cosplay!', 'Usa Artes para se disfarçar e ganha +2 em testes ligados ao cosplay que está vestindo.', 'SaH'),
  O('diplomata', 'Diplomata', ['atualidades', 'diplomacia'], 'Conexões', '+2 em Diplomacia; pode trocar um teste por Diplomacia contatando alguém que entende do assunto (2 PE).', 'SaH', { pericia: { diplomacia: 2 } }),
  O('explorador', 'Explorador', ['fortitude', 'sobrevivencia'], 'Manual do Sobrevivente', 'Gaste 2 PE para +5 ao resistir a clima, fome, veneno, armadilhas etc. Dorme bem em qualquer lugar.', 'SaH'),
  O('experimento', 'Experimento', ['atletismo', 'fortitude'], 'Mutação', 'Resistência a dano 2 e +2 numa perícia de FOR, AGI ou VIG; mas –1 dado em Diplomacia.', 'SaH', { rd: 2 }),
  O('fanatico', 'Fanático por Criaturas', ['investigacao', 'ocultismo'], 'Conhecimento Oculto', 'Identifica criaturas por pistas indiretas e ganha +2 contra elas pelo resto da missão.', 'SaH'),
  O('fotografo', 'Fotógrafo', ['artes', 'percepcao'], 'Através da Lente', 'Olhando por uma câmera ou fotos, gaste 2 PE para +5 em Investigação ou Percepção.', 'SaH'),
  O('inventor', 'Inventor Paranormal', ['profissao', 'vontade'], 'Invenção Paranormal', 'Tem um invento que reproduz um ritual de 1º círculo (teste de Profissão a cada uso).', 'SaH'),
  O('jovem-mistico', 'Jovem Místico', ['ocultismo', 'religiao'], 'A Culpa é das Estrelas', 'Tem um número da sorte: no início da cena, 1 PE e 1d6; se sair o número, +2 nos testes da cena.', 'SaH'),
  O('legista', 'Legista do Turno da Noite', ['ciencias', 'medicina'], 'Luto Habitual', 'Metade do dano mental por cenas de morte/cadáveres; 2 PE para +5 em primeiros socorros ou necropsia.', 'SaH'),
  O('mateiro', 'Mateiro', ['percepcao', 'sobrevivencia'], 'Mapa Celeste', 'Nunca se perde vendo o céu; 2 PE para rolar Sobrevivência de novo. Dorme bem em qualquer lugar.', 'SaH'),
  O('mergulhador', 'Mergulhador', ['atletismo', 'fortitude'], 'Fôlego de Nadador', '+5 PV, prende a respiração por mais tempo e nada no deslocamento normal.', 'SaH', { pv: 5 }),
  O('motorista', 'Motorista', ['pilotagem', 'reflexos'], 'Mãos no Volante', 'Sem penalidade para atacar em veículo; 2 PE para +5 em Pilotagem ou resistência pilotando.', 'SaH'),
  O('nerd', 'Nerd Entusiasta', ['ciencias', 'tecnologia'], 'O Inteligentão', 'A ação de interlúdio "ler" dá +2d6 em vez de +1d6.', 'SaH'),
  O('profetizado', 'Profetizado', ['vontade', '*'], 'Luta ou Fuga', 'Sabe como vai morrer. +2 em Vontade; quando um sinal da premonição aparece, ganha +2 PE temporários na cena.', 'SaH', { pericia: { vontade: 2 } }),
  O('psicologo', 'Psicólogo', ['intuicao', 'profissao'], 'Terapia', 'Usa Profissão (psicólogo) como Diplomacia; 2 PE para trocar uma resistência falha contra dano mental (sua ou de aliado).', 'SaH'),
  O('reporter', 'Repórter Investigativo', ['atualidades', 'investigacao'], 'Encontrar a Verdade', 'Usa Investigação para persuadir; 2 PE para +5 em Investigação.', 'SaH'),
];
// Origens que permitem GASTAR PE numa rolagem para ganhar bônus (aparece na janela "Gastar PE" ao rolar).
// atr: perícias baseadas nesses atributos; pericias: só essas; exceto: menos essas.
const GASTOS_ORIGEM = {
  academico: { custo: 2, bonus: 5, atr: ['int'] },
  atleta: { custo: 2, bonus: 5, atr: ['for', 'agi'], exceto: ['luta', 'pontaria'] },
  executivo: { custo: 2, bonus: 5, pericias: ['diplomacia', 'profissao', 'investigacao'], nota: 'testes estendidos e revisar documentos' },
  investigador: { custo: 1, bonus: 5, pericias: ['investigacao', 'percepcao'], nota: 'uma vez por cena, ao procurar pistas' },
  rural: { custo: 2, bonus: 5, pericias: ['adestramento', 'sobrevivencia'] },
  explorador: { custo: 2, bonus: 5, pericias: ['fortitude', 'sobrevivencia'], nota: 'contra clima, fome, sede, veneno, armadilhas…' },
  fotografo: { custo: 2, bonus: 5, pericias: ['investigacao', 'percepcao'], nota: 'olhando por uma câmera ou fotos' },
  legista: { custo: 2, bonus: 5, pericias: ['medicina'], nota: 'primeiros socorros ou necropsia' },
  motorista: { custo: 2, bonus: 5, pericias: ['pilotagem', 'fortitude', 'reflexos', 'vontade'], nota: 'pilotando' },
  reporter: { custo: 2, bonus: 5, pericias: ['investigacao'] },
  mateiro: { custo: 2, pericias: ['sobrevivencia'], rerrolar: true, nota: 'rola de novo e fica com o melhor' },
  'seguranca-ex-panacea': { custo: 2, bonus: 5, pericias: ['luta'], nota: 'teste de manobra de combate' },
};
for (const [id, g] of Object.entries(GASTOS_ORIGEM)) { const o = ORIGENS.find(x => x.id === id); if (o) o.gasto = g; }
// efeitos automáticos extras de origens
Object.assign(ORIGENS.find(o => o.id === 'teorico'), { ef: { rdMentalInt: true } });
Object.assign(ORIGENS.find(o => o.id === 'experimento'), { ef: { rd: 2, experimento: true } });
Object.assign(ORIGENS.find(o => o.id === 'operario'), { ef: { ferramenta: true } });
// Arquivos Secretos (catalogo-as.js)
ORIGENS.push(...ORIGENS_AS.map(o => O(o.id, o.nome, o.pericias, o.poder, o.resumo, o.fonte)));
for (const [id, g] of Object.entries(GASTOS_ORIGEM)) { const o = ORIGENS.find(x => x.id === id); if (o && !o.gasto) o.gasto = g; }
export const ORIGEM = Object.fromEntries(ORIGENS.map(o => [o.id, o]));

// ---------- Trilhas ----------
const T = (id, nome, classe, habilidades, fonte = 'LR', extra = {}) => ({ id, nome, classe, fonte, habilidades: habilidades.map(([nivel, nome, resumo, ef]) => ({ nivel, nome, resumo, ef })), ...extra });
export const TRILHAS = [
  // Combatente (LR)
  T('aniquilador', 'Aniquilador', 'combatente', [
    [2, 'A Favorita', 'Escolha uma arma favorita: a categoria dela cai em I.'],
    [8, 'Técnica Secreta', 'A favorita cai mais uma categoria. Gaste 2 PE por efeito ao atacar com ela: Amplo (atinge um alvo adjacente extra) ou Destruidor (+1 no multiplicador de crítico).'],
    [13, 'Técnica Sublime', 'Novos efeitos para a Técnica Secreta: Letal (+2 na margem de ameaça) e Perfurante (ignora até 5 de RD).'],
    [20, 'Máquina de Matar', 'A favorita cai mais uma categoria, ganha +2 na margem de ameaça e +1 dado de dano.'],
  ]),
  T('comandante', 'Comandante de Campo', 'combatente', [
    [2, 'Inspirar Confiança', 'Reação e 2 PE: um aliado em alcance curto rola de novo um teste que acabou de fazer.'],
    [8, 'Estrategista', 'Ação padrão e 1 PE por aliado (até seu Intelecto): eles ganham uma ação de movimento extra no próximo turno.'],
    [13, 'Brecha na Guarda', 'Uma vez por rodada, quando um aliado causa dano, reação e 2 PE para você ou outro aliado atacar o mesmo alvo.'],
    [20, 'Oficial Comandante', 'Ação padrão e 5 PE: cada aliado que você vê em alcance médio ganha uma ação padrão extra.'],
  ]),
  T('guerreiro', 'Guerreiro', 'combatente', [
    [2, 'Técnica Letal', '+2 na margem de ameaça em ataques corpo a corpo.', { margemCorpo: 2 }],
    [8, 'Revidar', 'Ao bloquear um ataque, reação e 2 PE para contra-atacar corpo a corpo.'],
    [13, 'Força Opressora', 'Ao acertar corpo a corpo, 1 PE para derrubar ou empurrar como ação livre.'],
    [20, 'Potência Máxima', 'Com Ataque Especial corpo a corpo, todos os bônus numéricos dobram.'],
  ]),
  T('operacoes', 'Operações Especiais', 'combatente', [
    [2, 'Iniciativa Aprimorada', '+5 em Iniciativa e uma ação de movimento extra na primeira rodada.', { pericia: { iniciativa: 5 } }],
    [8, 'Ataque Extra', 'Uma vez por rodada, ao atacar, gaste 2 PE para fazer um ataque adicional.'],
    [13, 'Surto de Adrenalina', 'Uma vez por rodada, 5 PE para uma ação padrão ou de movimento extra.'],
    [20, 'Sempre Alerta', 'Ganha uma ação padrão extra no início de cada combate.'],
  ]),
  T('tropa', 'Tropa de Choque', 'combatente', [
    [2, 'Casca Grossa', '+1 PV para cada 5% de NEX e soma o Vigor na RD quando bloqueia.', { pvPorNivel: 1 }],
    [8, 'Cai Dentro', 'Reação e 1 PE: um inimigo que ataca um aliado faz Vontade (DT Vig) ou tem que atacar você.'],
    [13, 'Duro de Matar', 'Reação e 2 PE para reduzir à metade um dano não paranormal (paranormal também a partir de NEX 85%).'],
    [20, 'Inquebrável', 'Machucado: +5 na Defesa e RD 5. Morrendo: continua agindo.'],
  ]),
  // Combatente (SaH)
  T('agente-secreto', 'Agente Secreto', 'combatente', [
    [2, 'Carteirada', 'Treina Diplomacia ou Enganação (ou +2 se já for treinado) e recebe documentos com privilégios especiais a cada missão.'],
    [8, 'O Sorriso', '+2 em Diplomacia e Enganação; 2 PE para repetir uma falha nelas. Pode se acalmar com Diplomacia uma vez por cena.', { pericia: { diplomacia: 2, enganacao: 2 } }],
    [13, 'Método Investigativo', 'A urgência das investigações aumenta em 1 rodada; 2 PE (crescente) para anular um evento de investigação.'],
    [20, 'Multifacetado', 'Uma vez por cena, 5 de Sanidade para ganhar as habilidades até NEX 65% de outra trilha de combatente ou especialista.'],
  ], 'SaH'),
  T('cacador', 'Caçador', 'combatente', [
    [2, 'Rastrear o Paranormal', 'Treina Sobrevivência (ou +2) e a usa para identificar criaturas e achar rastros paranormais.'],
    [8, 'Estudar Fraquezas', 'Ação de interlúdio estudando uma pista de um ser: descobre uma informação útil sobre ele, e cada pista dá +1 nos testes contra ele até o fim da missão.'],
    [13, 'Atacar das Sombras', 'Menos penalidades de Furtividade ao se mover e atacar em silêncio; começa as cenas de furtividade menos visível.'],
    [20, 'Estudar a Presa', 'Transforma um tipo de ser em sua "presa": +1 dado em perícias, +1 na margem e no multiplicador de crítico e RD 5 contra ele.'],
  ], 'SaH'),
  T('monstruoso', 'Monstruoso', 'combatente', [
    [2, 'Ser Amaldiçoado', 'Treina Ocultismo (ou +2) e escolhe um elemento; um ritual diário desse elemento dá benefícios (e mudanças) no corpo.'],
    [8, 'Ser Macabro', 'A transformação avança: RD da etapa ritualística sobe para 10 e a penalidade para –2 dados; novos efeitos ligados ao elemento.'],
    [13, 'Ser Assustador', 'RD da etapa ritualística sobe para 15, mas perde 1 de Presença para sempre; novos efeitos do elemento (mordida, voltar de morrendo, dados de bônus ou recarregar PE em eletricidade).'],
    [20, 'Ser Aterrorizante', 'Os efeitos da etapa ritualística ficam permanentes, RD 20 e você conta como criatura paranormal; muda atributos e ganha o efeito final do elemento (inclui aprender um ritual). Em NEX 75% a Ordem o bane; em 99% a Sanidade cai para 1.'],
  ], 'SaH', { aviso: 'O livro indica usar a Progressão de NEX nesta trilha (Sobrevivendo ao Horror, p. 98–102): ligue a regra opcional na aba Notas. Detalhes de cada elemento: livro Sobrevivendo ao Horror, p. 17–21.' }),
  // Especialista (LR)
  T('atirador', 'Atirador de Elite', 'especialista', [
    [2, 'Mira de Elite', 'Proficiência com armas de fogo de balas longas e soma o Intelecto no dano delas.'],
    [8, 'Disparo Letal', 'Ao mirar, 1 PE para +2 na margem de ameaça do próximo ataque.'],
    [13, 'Disparo Impactante', 'Ao atacar com arma de fogo, 2 PE para trocar o dano por uma manobra (derrubar, desarmar, empurrar ou quebrar).'],
    [20, 'Atirar para Matar', 'Crítico com arma de fogo causa dano máximo, sem rolar.'],
  ]),
  T('infiltrador', 'Infiltrador', 'especialista', [
    [2, 'Ataque Furtivo', 'Uma vez por rodada, contra alvo desprevenido ou flanqueado, 1 PE para +1d6 de dano (aumenta com o NEX).'],
    [8, 'Gatuno', '+5 em Atletismo e Crime; anda furtivo no deslocamento normal sem penalidade.', { pericia: { atletismo: 5, crime: 5 } }],
    [13, 'Assassinar', 'Ação de movimento e 3 PE para analisar um alvo: o próximo Ataque Furtivo contra ele tem os dados dobrados e o deixa inconsciente se falhar em Fortitude.'],
    [20, 'Sombra Fugaz', 'Ao fazer um teste de Furtividade após atacar ou fazer algo chamativo, 3 PE para não sofrer a penalidade.'],
  ]),
  T('medico', 'Médico de Campo', 'especialista', [
    [2, 'Paramédico', 'Ação padrão e 2 PE para curar 2d10 PV de um ser adjacente (melhora com o NEX). Exige kit de medicina e treino em Medicina.'],
    [8, 'Equipe de Trauma', 'Ação padrão e 2 PE para remover uma condição negativa (não paranormal) de um ser adjacente.'],
    [13, 'Resgate', 'Uma vez por rodada, se um aliado em alcance curto estiver machucado ou morrendo, se aproxima dele como ação livre; ao curar alguém, ele ganha +5 na Defesa.'],
    [20, 'Reanimação', 'Uma vez por cena, ação completa e 10 PE para trazer de volta um aliado que morreu na mesma rodada.'],
  ]),
  T('negociador', 'Negociador', 'especialista', [
    [2, 'Eloquência', 'Ação completa e 1 PE por alvo: pessoas que o ouvem podem ficar fascinadas (Vontade resiste).'],
    [8, 'Discurso Motivador', 'Ação padrão e 4 PE: aliados em alcance curto ganham +1 dado em testes até o fim da cena.'],
    [13, 'Eu Conheço um Cara', 'Uma vez por missão, aciona sua rede de contatos para conseguir ajuda ou um recurso.'],
    [20, 'Truque de Mestre', 'Gaste 5 PE para simular o efeito de uma habilidade que viu um aliado usar na cena.'],
  ]),
  T('tecnico', 'Técnico', 'especialista', [
    [2, 'Inventário Otimizado', 'Soma o Intelecto na Força para calcular a carga.', { cargaInt: true }],
    [8, 'Remendão', 'Ação completa e 1 PE para consertar um item quebrado; com um kit, conserta e melhora equipamentos.'],
    [13, 'Improvisar', 'Gaste PE para improvisar um equipamento geral que precise na hora.'],
    [20, 'Preparado para Tudo', 'Uma vez por rodada, ação de movimento e PE para "já ter" qualquer item de categoria permitida.'],
  ]),
  // Especialista (SaH)
  T('bibliotecario', 'Bibliotecário', 'especialista', [
    [2, 'Conhecimento Prático', 'Em testes de perícia (menos Luta e Pontaria), 2 PE para trocar o atributo-base por Intelecto.'],
    [8, 'Leitor Contumaz', 'O bônus da ação "ler" vira 1d8 por dado e vale em qualquer perícia; 2 PE para +1 dado.'],
    [13, 'Rato de Biblioteca', 'Num lugar cheio de livros, ganha os benefícios de "ler" ou "revisar caso" rapidamente, uma vez por cena.'],
    [20, 'A Força do Saber', '+1 em Intelecto e soma o Intelecto nos PE; uma perícia passa a usar Intelecto.'],
  ], 'SaH'),
  T('perseverante', 'Perseverante', 'especialista', [
    [2, 'Soluções Improvisadas', 'Quando um teste dá errado, pode rolar de novo dados desse teste (uma vez por teste) e ficar com o melhor resultado. O custo não saiu legível no livro digitalizado.'],
    [8, 'Fuga Obstinada', 'Bônus em testes para fugir de um inimigo (dentro ou fora de perseguição); como presa numa perseguição, aguenta até 4 falhas antes de ser pego.'],
    [13, 'Determinação Inquestionável', 'Uma vez por cena, uma ação padrão e 5 PE removem uma condição de medo, mental ou de paralisia permitida pelo mestre. SaH p. 24.'],
    [20, 'Só Mais um Passo', 'Uma vez por rodada, 5 PE deixam você com 1 PV quando um dano o reduziria a 0. Dano massivo ignora esta habilidade. SaH p. 24.'],
  ], 'SaH', { aviso: 'NEX 65% e 99%: o texto dessas habilidades não saiu no livro digitalizado; os resumos são aproximados. Confira no livro Sobrevivendo ao Horror, p. 24 (PDF p. 25).' }),
  T('muambeiro', 'Muambeiro', 'especialista', [
    [2, 'Mascate', 'Treina uma Profissão (armeiro, engenheiro ou químico), +5 de carga e fabrica itens improvisados mais fácil.', { carga: 5 }],
    [8, 'Fabricação Própria', 'Fabrica itens mundanos na metade do tempo.'],
    [13, 'Laboratório de Campo', 'Escolha treinamento em Profissão (armeiro, engenheiro ou químico), ou +5 numa delas se já tiver treino. Pode fabricar e consertar itens paranormais. A fabricação usa três ações de interlúdio, inclusive não consecutivas. SaH p. 25.'],
    [20, 'Achado Conveniente', 'Ação completa e 5 PE produzem um item não paranormal de até categoria III, com justificativa aprovada pelo mestre. O item deixa de funcionar ao fim da cena. SaH p. 25.'],
  ], 'SaH', { aviso: 'NEX 65% e 99%: o texto dessas habilidades não saiu no livro digitalizado; os resumos são aproximados. Confira no livro Sobrevivendo ao Horror, p. 25 (PDF p. 26).' }),
  // Ocultista (LR)
  T('conduite', 'Conduíte', 'ocultista', [
    [2, 'Ampliar Ritual', '+2 PE para aumentar alcance ou alvos de um ritual.'],
    [8, 'Acelerar Ritual', 'Uma vez por rodada, +4 PE para conjurar um ritual mais rápido (ação de movimento).'],
    [13, 'Anular Ritual', 'Reação e PE para tentar anular um ritual sendo conjurado perto de você.'],
    [20, 'Canalizar o Medo', 'Aprende o ritual Canalizar o Medo.'],
  ]),
  T('flagelador', 'Flagelador', 'ocultista', [
    [2, 'Poder do Flagelo', 'Pode pagar o custo de rituais com PV (2 PV por PE).'],
    [8, 'Abraçar a Dor', 'Ao sofrer dano não paranormal, reação e 2 PE para reduzi-lo à metade.'],
    [13, 'Absorver Agonia', 'Ao reduzir um inimigo a 0 PV com um ritual, ganha PE temporários.'],
    [20, 'Medo Tangível', 'Aprende o ritual Medo Tangível.'],
  ]),
  T('graduado', 'Graduado', 'ocultista', [
    [2, 'Saber Ampliado', 'Aprende um ritual de 1º círculo; a cada novo círculo, um ritual extra dele.'],
    [8, 'Grimório Ritualístico', 'Cria um grimório com rituais extras (até seu Intelecto) que pode consultar.'],
    [13, 'Rituais Eficientes', 'A DT para resistir aos seus rituais aumenta em +5.'],
    [20, 'Conhecendo o Medo', 'Aprende o ritual Conhecendo o Medo.'],
  ]),
  T('intuitivo', 'Intuitivo', 'ocultista', [
    [2, 'Mente Sã', 'Resistência paranormal +5 (bônus em testes contra efeitos paranormais).'],
    [8, 'Presença Poderosa', 'Soma a Presença no limite de PE por turno, só para conjurar rituais.'],
    [13, 'Inabalável', 'Resistência a dano mental e paranormal 10; ao passar numa resistência que reduz à metade, não sofre dano.'],
    [20, 'Presença do Medo', 'Aprende o ritual Presença do Medo.'],
  ]),
  T('lamina', 'Lâmina Paranormal', 'ocultista', [
    [2, 'Lâmina Maldita', 'Aprende Amaldiçoar Arma e pode usar Ocultismo nos ataques com a arma amaldiçoada.'],
    [8, 'Gladiador Paranormal', 'Ao acertar um ataque corpo a corpo, ganha 2 PE temporários (limite por cena).'],
    [13, 'Conjuração Marcial', 'Uma vez por rodada, ao conjurar um ritual com execução padrão, 2 PE para fazer um ataque corpo a corpo como ação livre.'],
    [20, 'Lâmina do Medo', 'Aprende o ritual Lâmina do Medo.'],
  ]),
  // Ocultista (SaH)
  T('exorcista', 'Exorcista', 'ocultista', [
    [2, 'Revelação do Mal', 'Treina Religião (ou +2) e a usa no lugar de Investigação, Percepção e Ocultismo para coisas paranormais.'],
    [8, 'Poder da Fé', 'Veterano em Religião; 2 PE para repetir uma resistência falha usando Religião.'],
    [13, 'Parareligiosidade', 'Ao conjurar, +2 PE para dar ao ritual o efeito de um catalisador ritualístico à sua escolha.'],
    [20, 'Chagas da Resistência', 'Quando a Sanidade chegaria a 0, gaste 10 PV para ficar com SAN 1.'],
  ], 'SaH'),
  T('possuido', 'Possuído', 'ocultista', [
    [2, 'Poder Não Desejado', 'Todo novo poder de ocultista vira Transcender. Ganha pontos de possessão (3 + 2 por Transcender): cada PP recupera 10 PV ou 2 PE (até sua Presença por turno); recupera 1 PP ao dormir.', { possuido: true }],
    [8, 'As Sombras Dentro de Mim', 'Recupera +2 PP ao dormir. 2 PE: a entidade guia seus músculos e você ganha +1 dado em Acrobacia, Atletismo e Furtividade por uma rodada (e ações chamam menos atenção em furtividade).'],
    [13, 'Ele Me Ensina', 'Escolha entre Transcender ou receber o primeiro poder de outra trilha de ocultista (cumprindo os pré-requisitos).', { transcenderExtra: 1 }],
    [20, 'Tornamo-nos Um', 'Ganha um “presente” do elemento de afinidade, por 6 PE: Sangue recupera 50 PV; Morte dá um turno extra; Conhecimento dá um poder qualquer na cena (custa Sanidade se falhar em Vontade); Energia teleporta em alcance médio.'],
  ], 'SaH', { aviso: 'Trilha com regras próprias (pontos de possessão): confira no livro Sobrevivendo ao Horror, p. 28.' }),
  T('parapsicologo', 'Parapsicólogo', 'ocultista', [
    [2, 'Terapia', 'Usa Profissão (psicólogo) como Diplomacia; 2 PE para trocar uma resistência falha contra dano mental (sua ou de aliado em alcance curto) por um teste de Profissão (psicólogo). Se já tiver pela origem: –1 PE no custo e +2 em Profissão (psicólogo).'],
    [8, 'Palavras-chave', 'Ao passar num teste para acalmar alguém, gaste PE (até seu limite): cada PE recupera 1 de Sanidade da pessoa (ou 1 PD com Determinação).'],
    [13, 'Reprogramação Mental', '5 PE e uma ação de interlúdio: outra pessoa voluntária ganha um poder geral, um da própria classe ou o 1º poder de outra trilha até o próximo interlúdio.'],
    [20, 'A Sanidade Está Lá Fora', 'Ação de movimento e 5 PE: remove todas as condições de medo e mentais de uma pessoa adjacente (ou de você).'],
  ], 'SaH', { aviso: 'Para escolher esta trilha é preciso ser treinado em Profissão (psicólogo).' }),
  // Sobrevivente (SaH): só 2 habilidades (estágios 2 e 4)
  T('durao', 'Durão', 'sobrevivente', [
    [2, 'Durão', '+4 PV (e +2 PV ao chegar no estágio 3).', { pvDurao: true }],
    [4, 'Pancada Forte', 'Ao atacar, 1 PE para +1 dado no teste de ataque.'],
  ], 'SaH'),
  T('esperto', 'Esperto', 'sobrevivente', [
    [2, 'Esperto', 'Treina uma perícia extra à sua escolha.'],
    [4, 'Entendido', 'Escolha duas perícias treinadas (menos Luta e Pontaria): 1 PE para somar +1d4.'],
  ], 'SaH'),
  T('esoterico', 'Esotérico', 'sobrevivente', [
    [2, 'Esotérico', 'Ação padrão e 1 PE para sentir energias paranormais em alcance curto.'],
    [4, 'Iniciado', 'Aprende e pode conjurar um ritual de 1º círculo.'],
  ], 'SaH'),
];
TRILHAS.push(...TRILHAS_AS.map(t => T(t.id, t.nome, t.classe, t.habilidades, t.fonte, t.aviso ? { aviso: t.aviso } : {})));
export const TRILHA = Object.fromEntries(TRILHAS.map(t => [t.id, t]));

// ---------- Poderes ----------
// classe: combatente | especialista | ocultista | geral. req: texto do pré-requisito. ef: efeito automático.
// ef.treinaOuMais: 'pericia' => vira treinado nela ou, se já era, +2.
const P = (nome, classe, resumo, req = '', fonte = 'LR', ef = null, repete = false) => ({ id: nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'), nome, classe, resumo, req, fonte, ef, repete });
export const PODERES = [
  // Combatente (LR)
  P('Armamento Pesado', 'combatente', 'Proficiência com armas pesadas.', 'For 2'),
  P('Artista Marcial', 'combatente', 'Ataques desarmados causam 1d6 letal e contam como armas ágeis (1d8 em NEX 35%, 1d10 em 70%).'),
  P('Ataque de Oportunidade', 'combatente', 'Quando alguém sai de um espaço adjacente, reação e 1 PE para atacá-lo.'),
  P('Combater com Duas Armas', 'combatente', 'Com duas armas (uma leve), faz dois ataques na ação agredir, com –1 dado em todos.', 'Agi 3, treinado em Luta ou Pontaria'),
  P('Combate Defensivo', 'combatente', 'Ao agredir, pode lutar na defensiva: –1 dado nos ataques e +5 na Defesa.', 'Int 2'),
  P('Golpe Demolidor', 'combatente', 'Ao quebrar ou atacar objeto, 1 PE para +2 dados de dano.', 'For 2, treinado em Luta'),
  P('Golpe Pesado', 'combatente', 'Armas corpo a corpo causam +1 dado de dano do mesmo tipo.', '', 'LR', { dadoCorpo: 1 }),
  P('Incansável', 'combatente', 'Uma vez por cena, 2 PE para uma ação de investigação extra usando Força ou Agilidade.'),
  P('Presteza Atlética', 'combatente', 'Ao facilitar a investigação, 1 PE para usar Força ou Agilidade; se passar, o próximo aliado ganha +1 dado.'),
  P('Proteção Pesada', 'combatente', 'Proficiência com proteções pesadas.', 'NEX 30%', 'LR', { profPesada: true }),
  P('Reflexos Defensivos', 'combatente', '+2 na Defesa e em testes de resistência.', 'Agi 2', 'LR', { defesa: 2, resistencia: 2 }),
  P('Saque Rápido', 'combatente', 'Saca e guarda itens como ação livre (e recarrega uma vez por rodada, com contagem de munição).', 'treinado em Iniciativa'),
  P('Segurar o Gatilho', 'combatente', 'Ao acertar com arma de fogo, pode atacar de novo o mesmo alvo pagando 2 PE por ataque já feito no turno.', 'NEX 60%'),
  P('Sentido Tático', 'combatente', 'Ação de movimento e 2 PE: soma o Intelecto na Defesa e resistências até o fim da cena.', 'Int 2, treinado em Percepção e Tática'),
  P('Tanque de Guerra', 'combatente', 'Com proteção pesada, a Defesa e a RD dela aumentam em +2.', 'Proteção Pesada', 'LR', { tanque: true }),
  P('Tiro Certeiro', 'combatente', 'Com arma de disparo, soma Agilidade no dano e ignora a penalidade de atirar em corpo a corpo.', 'treinado em Pontaria', 'LR', { agiDisparo: true }),
  P('Tiro de Cobertura', 'combatente', 'Ação padrão e 1 PE: Pontaria contra a Vontade do alvo; se vencer, ele não sai do lugar e sofre –5 nos ataques. Efeito de medo.'),
  // Especialista (LR)
  P('Balística Avançada', 'especialista', 'Proficiência com armas táticas de fogo e +2 no dano com armas de fogo.', '', 'LR', { danoFogo: 2 }),
  P('Conhecimento Aplicado', 'especialista', 'Em testes de perícia (menos Luta e Pontaria), 2 PE para usar Intelecto como atributo-base.', 'Int 2'),
  P('Hacker', 'especialista', '+5 em Tecnologia para invadir sistemas, que leva só uma ação completa.', 'treinado em Tecnologia'),
  P('Mãos Rápidas', 'especialista', '1 PE para fazer um teste de Crime como ação livre.', 'Agi 3, treinado em Crime'),
  P('Mochila de Utilidades', 'especialista', 'Um item (não arma) conta como uma categoria abaixo e ocupa 1 espaço a menos.'),
  P('Movimento Tático', 'especialista', '1 PE para ignorar terreno difícil e escalada até o fim do turno.', 'treinado em Atletismo'),
  P('Na Trilha Certa', 'especialista', 'Ao achar uma pista, 1 PE para +1 dado no próximo teste de procurar pistas (acumula).'),
  P('Nerd', 'especialista', 'Uma vez por cena, 2 PE para um teste de Atualidades (DT 20) que dá uma dica útil.'),
  P('Ninja Urbano', 'especialista', 'Proficiência com armas táticas de ataque corpo a corpo e de disparo (exceto de fogo) e +2 no dano com armas corpo a corpo e de disparo.'),
  P('Pensamento Ágil', 'especialista', 'Uma vez por rodada, numa investigação, 2 PE para uma ação de procurar pistas extra.'),
  P('Perito em Explosivos', 'especialista', 'Soma o Intelecto na DT dos seus explosivos e pode excluir aliados da área.'),
  P('Primeira Impressão', 'especialista', '+2 dados no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição com alguém.'),
  // Ocultista (LR)
  P('Camuflar Ocultismo', 'ocultista', '2 PE extras para conjurar sem gestos nem palavras; só quem passar em Ocultismo (DT 25) percebe.'),
  P('Criar Selo', 'ocultista', 'Fabrica selos de rituais que conhece (ação de interlúdio e PE).'),
  P('Envolto em Mistério', 'ocultista', '+5 em Enganação e Intimidação contra quem não é treinado em Ocultismo.'),
  P('Especialista em Elemento', 'ocultista', 'Escolha um elemento: a DT dos seus rituais dele aumenta em +2.', '', 'LR', null, true),
  P('Ferramentas Paranormais', 'ocultista', 'Reduz a categoria de um item paranormal em I e ativa itens paranormais sem pagar PE.'),
  P('Fluxo de Poder', 'ocultista', 'Pode manter dois efeitos sustentados de rituais ativos com uma só ação livre (pagando os custos).', 'NEX 60%'),
  P('Guiado pelo Paranormal', 'ocultista', 'Uma vez por cena, 2 PE para uma ação de investigação extra.'),
  P('Identificação Paranormal', 'ocultista', '+10 em Ocultismo para identificar criaturas, objetos ou rituais.'),
  P('Improvisar Componentes', 'ocultista', 'Uma vez por cena, ação completa e teste de Investigação (DT 15) para achar componentes de um elemento.'),
  P('Intuição Paranormal', 'ocultista', 'Ao facilitar a investigação, soma Intelecto ou Presença no teste.'),
  P('Mestre em Elemento', 'ocultista', 'Rituais do elemento escolhido custam –1 PE.', 'Especialista em Elemento no elemento, NEX 45%', 'LR', null, true),
  P('Ritual Potente', 'ocultista', 'Soma o Intelecto no dano ou na cura dos seus rituais.', 'Int 2'),
  P('Ritual Predileto', 'ocultista', 'Escolha um ritual conhecido: o custo dele cai em –1 PE.', '', 'LR', null, true),
  P('Tatuagem Ritualística', 'ocultista', 'Rituais pessoais que têm você como alvo custam –1 PE.'),
  // Todas as classes (LR)
  P('Transcender', 'todas', 'Escolha um poder paranormal. Você o recebe, mas não ganha Sanidade neste aumento de NEX.', '', 'LR', { transcender: true }, true),
  P('Treinamento em Perícia', 'todas', 'Treine duas perícias (veterano a partir de NEX 35%, expert a partir de 70%).', '', 'LR', null, true),
  // ----- Sobrevivendo ao Horror -----
  P('Apego Angustiado', 'combatente', 'Não fica inconsciente ao estar morrendo, mas perde 2 de Sanidade a cada rodada assim.', '', 'SaH'),
  P('Caminho para Forca', 'combatente', 'Melhora as ações sacrifício (perseguição) e chamar atenção (furtividade) por 1 PE.', '', 'SaH'),
  P('Ciente das Cicatrizes', 'combatente', 'Usa Luta ou Pontaria para achar pistas sobre armas e ferimentos.', 'treinado em Luta ou Pontaria', 'SaH'),
  P('Correria Desesperada', 'combatente', '+3m de deslocamento e +1 dado para fugir em perseguições.', '', 'SaH', { desl: 3 }),
  P('Engolir o Choro', 'combatente', 'Sem penalidades de condições para fugir e em Furtividade.', '', 'SaH'),
  P('Instinto de Fuga', 'combatente', '+2 em todos os testes de perícia durante perseguições.', 'treinado em Intuição', 'SaH'),
  P('Mochileiro', 'combatente', '+5 espaços de carga e pode usar uma vestimenta extra.', 'Vig 2', 'SaH', { carga: 5 }),
  P('Paranoia Defensiva', 'combatente', 'Uma vez por cena, uma rodada e 3 PE: você e aliados escolhem +5 na Defesa contra o próximo ataque ou +5 em um teste.', '', 'SaH'),
  P('Sacrificar os Joelhos', 'combatente', 'Uma vez por perseguição, 2 PE para passar direto no esforço extra.', 'treinado em Atletismo', 'SaH'),
  P('Sem Tempo, Irmão', 'combatente', 'Ajuda na investigação de forma apressada: passa no teste, mas rola mais um evento.', '', 'SaH'),
  P('Valentão', 'combatente', 'Usa Força em Intimidação; uma vez por cena, 1 PE para assustar como ação livre.', '', 'SaH'),
  P('Acolher o Terror', 'especialista', 'Pode se entregar ao medo uma vez a mais por sessão.', '', 'SaH'),
  P('Contatos Oportunos', 'especialista', 'Uma ação de interlúdio para ganhar um aliado local até o fim da missão.', 'treinado em Crime', 'SaH'),
  P('Disfarce Sutil', 'especialista', '1 PE para se disfarçar com uma ação completa, sem kit.', 'Pre 2, treinado em Enganação', 'SaH'),
  P('Esconderijo Desesperado', 'especialista', 'Sem penalidade em Furtividade ao se mover; esconder-se reduz a visibilidade em 2.', '', 'SaH'),
  P('Especialista Diletante', 'especialista', 'Aprende um poder de outra classe (não de trilha nem paranormal).', 'NEX 30%', 'SaH'),
  P('Flashback', 'especialista', 'Recebe o poder de outra origem.', '', 'SaH'),
  P('Leitura Fria', 'especialista', 'Faz três perguntas pessoais sobre um NPC; cada pergunta não respondida dá 2 PE temporários.', 'treinado em Intuição', 'SaH'),
  P('Mãos Firmes', 'especialista', '2 PE para +1 dado (+1d20) em Furtividade ao esconder-se ou mexer em objetos.', 'treinado em Furtividade', 'SaH'),
  P('Plano de Fuga', 'especialista', 'Usa Intelecto para criar obstáculos em perseguições; uma vez por cena, 2 PE para passar direto.', '', 'SaH'),
  P('Remoer Memórias', 'especialista', 'Uma vez por cena, 2 PE para trocar um teste de INT ou PRE por um teste de Intelecto (DT 15).', 'Int 1', 'SaH'),
  P('Resistir à Pressão', 'especialista', 'Uma vez por investigação, 5 PE: a urgência aumenta 1 rodada e todos ganham +2 nela.', 'treinado em Investigação', 'SaH'),
  P('Deixe os Sussurros Guiarem', 'ocultista', 'Uma vez por cena, 2 PE: +2 em perícias de investigação, mas cada falha custa 1 de Sanidade.', '', 'SaH'),
  P('Domínio Esotérico', 'ocultista', 'Combina os efeitos de até dois catalisadores ritualísticos num ritual.', 'Int 3', 'SaH'),
  P('Estalos Macabros', 'ocultista', '1 PE para usar Ocultismo para distrair ou fintar (+5 contra pessoas e animais).', '', 'SaH'),
  P('Minha Dor me Impulsiona', 'ocultista', 'Ferido, 1 PE para +1d6 em Acrobacia, Atletismo ou Furtividade.', 'Vig 2', 'SaH'),
  P('Nos Olhos do Monstro', 'ocultista', 'Uma rodada e 3 PE encarando a criatura: +5 nos testes contra ela (menos ataques) na cena.', '', 'SaH'),
  P('Olhar Sinistro', 'ocultista', 'Usa Presença em Ocultismo e pode usá-lo para coagir.', 'Pre 1', 'SaH'),
  P('Sentido Premonitório', 'ocultista', '3 PE (e 1 PE por rodada) para ver uma rodada à frente fora de combate.', '', 'SaH'),
  P('Sincronia Paranormal', 'ocultista', 'Ação padrão e 2 PE: distribui dados de bônus (até sua Presença) entre aliados a cada rodada.', 'Pre 2', 'SaH'),
  P('Traçado Conjuratório', 'ocultista', '1 PE e uma ação completa para traçar um símbolo: dentro dele, +2 em Ocultismo e resistências e +2 na DT dos rituais.', '', 'SaH'),
  // Poderes gerais (SaH) — qualquer classe pode escolher no lugar de um poder de classe
  P('Acrobático', 'geral', 'Treina Acrobacia (ou +2); terreno difícil não reduz seu deslocamento.', 'Agi 2', 'SaH', { treinaOuMais: 'acrobacia' }),
  P('Ás do Volante', 'geral', 'Treina Pilotagem (ou +2); pode evitar dano ao veículo com um teste.', 'Agi 2', 'SaH', { treinaOuMais: 'pilotagem' }),
  P('Atlético', 'geral', 'Treina Atletismo (ou +2) e +3m de deslocamento.', 'For 2', 'SaH', { treinaOuMais: 'atletismo', desl: 3 }),
  P('Atraente', 'geral', '+5 em Artes, Diplomacia, Enganação e Intimidação com quem se sente atraído por você.', 'Pre 2', 'SaH'),
  P('Dedos Ágeis', 'geral', 'Treina Crime (ou +2); arromba, furta e sabota mais rápido.', 'Agi 2', 'SaH', { treinaOuMais: 'crime' }),
  P('Detector de Mentiras', 'geral', 'Treina Intuição (ou +2); quem mente para você sofre –10.', 'Pre 2', 'SaH', { treinaOuMais: 'intuicao' }),
  P('Especialista em Emergências', 'geral', 'Treina Medicina (ou +2); aplica cicatrizantes e remédios mais rápido.', 'Int 2', 'SaH', { treinaOuMais: 'medicina' }),
  P('Estigmado', 'geral', 'Pode trocar dano mental de medo por perda de PV.', '', 'SaH'),
  P('Foco em Perícia', 'geral', 'Escolha uma perícia treinada (menos Luta e Pontaria): rola +1 dado nela.', 'treinado na perícia', 'SaH', null, true),
  P('Informado', 'geral', 'Treina Atualidades (ou +2) e a usa no lugar de outras perícias de informação.', 'Int 2', 'SaH', { treinaOuMais: 'atualidades' }),
  P('Interrogador', 'geral', 'Treina Intimidação (ou +2) e coage como ação padrão.', 'For 2', 'SaH', { treinaOuMais: 'intimidacao' }),
  P('Inventário Organizado', 'geral', 'Soma o Intelecto na carga; itens de meio espaço ocupam um quarto.', 'Int 2', 'SaH', { cargaIntExtra: true }),
  P('Mentiroso Nato', 'geral', 'Treina Enganação (ou +2); mentiras absurdas têm penalidade menor.', 'Pre 2', 'SaH', { treinaOuMais: 'enganacao' }),
  P('Observador', 'geral', 'Treina Investigação (ou +2) e soma o Intelecto em Intuição.', 'Int 2', 'SaH', { treinaOuMais: 'investigacao', intEmIntuicao: true }),
  P('Pai de Pet', 'geral', 'Treina Adestramento (ou +2) e tem um animal de estimação aliado.', 'Pre 2', 'SaH', { treinaOuMais: 'adestramento' }),
  P('Palavras de Devoção', 'geral', 'Treina Religião (ou +2); uma oração dá RD mental 5 ao grupo.', 'Pre 2', 'SaH', { treinaOuMais: 'religiao' }),
  P('Parceiro', 'geral', 'Tem um parceiro (aliado) que o acompanha nas missões.', 'treinado em Diplomacia, NEX 30%', 'SaH'),
  P('Pensamento Tático', 'geral', 'Treina Tática (ou +2); analisar terreno dá ação extra ao grupo.', 'Int 2', 'SaH', { treinaOuMais: 'tatica' }),
  P('Personalidade Esotérica', 'geral', '+3 PE e treina Ocultismo (ou +2).', 'Int 2', 'SaH', { treinaOuMais: 'ocultismo', pe: 3 }),
  P('Persuasivo', 'geral', 'Treina Diplomacia (ou +2); pedidos caros têm penalidade menor.', 'Pre 2', 'SaH', { treinaOuMais: 'diplomacia' }),
  P('Pesquisador Científico', 'geral', 'Treina Ciências (ou +2) e a usa para identificar criaturas e animais.', 'Int 2', 'SaH', { treinaOuMais: 'ciencias' }),
  P('Proativo', 'geral', 'Treina Iniciativa (ou +2); 19 ou 20 na Iniciativa dá uma ação padrão extra.', 'Agi 2', 'SaH', { treinaOuMais: 'iniciativa' }),
  P('Provisões de Emergência', 'geral', 'Uma vez por missão, recupera um esconderijo com equipamento novo.', '', 'SaH'),
  P('Racionalidade Inflexível', 'geral', 'Usa Intelecto no lugar de Presença em Vontade e no cálculo dos PE.', 'Int 3', 'SaH', { racional: true }),
  P('Rato de Computador', 'geral', 'Treina Tecnologia (ou +2); hackeia mais rápido e procura pistas no computador.', 'Int 2', 'SaH', { treinaOuMais: 'tecnologia' }),
  P('Resposta Rápida', 'geral', 'Treina Reflexos (ou +2); 2 PE para trocar uma Percepção falha contra surpresa por Reflexos.', 'Agi 2', 'SaH', { treinaOuMais: 'reflexos' }),
  P('Sentidos Aguçados', 'geral', 'Treina Percepção (ou +2); não fica desprevenido contra quem não vê.', 'Pre 2', 'SaH', { treinaOuMais: 'percepcao' }),
  P('Sobrevivencialista', 'geral', 'Treina Sobrevivência (ou +2); +2 contra clima e ignora terreno difícil natural.', 'Int 2', 'SaH', { treinaOuMais: 'sobrevivencia' }),
  P('Sorrateiro', 'geral', 'Treina Furtividade (ou +2) e se move furtivo sem penalidade.', 'Agi 2', 'SaH', { treinaOuMais: 'furtividade' }),
  P('Talentoso', 'geral', 'Treina Artes (ou +2); impressionar dá bônus maiores.', 'Pre 2', 'SaH', { treinaOuMais: 'artes' }),
  P('Teimosia Obstinada', 'geral', 'Treina Vontade (ou +2); 2 PE para +5 contra efeitos mentais.', 'Pre 2', 'SaH', { treinaOuMais: 'vontade' }),
  P('Tenacidade', 'geral', 'Treina Fortitude (ou +2); morrendo e consciente, pode tentar se estabilizar com Fortitude.', 'Vig 2', 'SaH', { treinaOuMais: 'fortitude' }),
  P('Vitalidade Reforçada', 'geral', '+1 PV para cada 5% de NEX e +2 em Fortitude.', 'Vig 2', 'SaH', { pvPorNivel: 1, pericia: { fortitude: 2 } }),
  P('Vontade Inabalável', 'geral', '+1 PE para cada 10% de NEX e +2 em Vontade.', 'Pre 2', 'SaH', { pePor2Niveis: 1, pericia: { vontade: 2 } }),
];
PODERES.push(...PODERES_AS.map(p => P(p.nome, p.classe, p.resumo, p.req, p.fonte, null, p.repete)));
export const PODER = Object.fromEntries(PODERES.map(p => [p.id, p]));
// No SaH estes poderes de combatente passam a ser gerais
export const VIRARAM_GERAIS = ['artista-marcial', 'combater-com-duas-armas', 'saque-rapido', 'tiro-certeiro'];

// ---------- Equipamento ----------
// Dados do Livro de Regras (Tabela 3.3 e 3.6). tipo de dano: B balístico, C corte, I impacto, P perfuração, F fogo.
// prof: simples | taticas | pesadas. uso: corpo | disparo | fogo | arremesso.
const A = (nome, prof, uso, cat, dano, critico, alcance, tipo, espacos, maos = 1) => {
  const [margem, mult] = String(critico).includes('/') ? [Number(critico.split('/')[0]), Number(critico.split('/')[1].slice(1))] : critico.startsWith('x') ? [20, Number(critico.slice(1))] : [Number(critico), 2];
  return { nome, prof, uso, categoria: cat, dano, margem, mult, alcance, tipo, espacos, maos };
};
const ASaH = (...args) => ({ ...A(...args), fonte: 'SaH' });
export const ARMAS = [
  A('Coronhada', 'simples', 'corpo', 0, '1d4', 'x2', '—', 'I', 0),
  A('Faca', 'simples', 'corpo', 0, '1d4', '19', 'Curto', 'C', 1),
  A('Martelo', 'simples', 'corpo', 0, '1d6', 'x2', '—', 'I', 1),
  A('Punhal', 'simples', 'corpo', 0, '1d4', 'x3', '—', 'P', 1),
  A('Bastão', 'simples', 'corpo', 0, '1d6', 'x2', '—', 'I', 1),
  A('Machete', 'simples', 'corpo', 0, '1d6', '19', '—', 'C', 1),
  A('Lança', 'simples', 'corpo', 0, '1d6', 'x2', 'Curto', 'P', 1),
  A('Cajado', 'simples', 'corpo', 0, '1d6', 'x2', '—', 'I', 2, 2),
  A('Arco', 'simples', 'disparo', 0, '1d6', 'x3', 'Médio', 'P', 2, 2),
  A('Besta', 'simples', 'disparo', 0, '1d8', '19', 'Médio', 'P', 2, 2),
  A('Pistola', 'simples', 'fogo', 1, '1d12', '18', 'Curto', 'B', 1),
  A('Revólver', 'simples', 'fogo', 1, '2d6', '19/x3', 'Curto', 'B', 1),
  A('Fuzil de caça', 'simples', 'fogo', 1, '2d8', '19/x3', 'Médio', 'B', 2, 2),
  A('Machadinha', 'taticas', 'corpo', 0, '1d6', 'x3', 'Curto', 'C', 1),
  A('Nunchaku', 'taticas', 'corpo', 0, '1d8', 'x2', '—', 'I', 1),
  A('Corrente', 'taticas', 'corpo', 0, '1d8', 'x2', '—', 'I', 1),
  A('Espada', 'taticas', 'corpo', 1, '1d8', '19', '—', 'C', 1),
  A('Florete', 'taticas', 'corpo', 1, '1d6', '18', '—', 'C', 1),
  A('Machado', 'taticas', 'corpo', 1, '1d8', 'x3', '—', 'C', 1),
  A('Maça', 'taticas', 'corpo', 1, '2d4', 'x2', '—', 'I', 1),
  A('Acha', 'taticas', 'corpo', 1, '1d12', 'x3', '—', 'C', 2, 2),
  A('Gadanho', 'taticas', 'corpo', 1, '2d4', 'x4', '—', 'C', 2, 2),
  A('Katana', 'taticas', 'corpo', 1, '1d10', '19', '—', 'C', 2, 2),
  A('Marreta', 'taticas', 'corpo', 1, '3d4', 'x2', '—', 'I', 2, 2),
  A('Montante', 'taticas', 'corpo', 1, '2d6', '19', '—', 'C', 2, 2),
  A('Motosserra', 'taticas', 'corpo', 1, '3d6', 'x2', '—', 'C', 2, 2),
  A('Arco composto', 'taticas', 'disparo', 1, '1d10', 'x3', 'Médio', 'P', 2, 2),
  A('Balestra', 'taticas', 'disparo', 1, '1d12', '19', 'Médio', 'P', 2, 2),
  A('Submetralhadora', 'taticas', 'fogo', 1, '2d6', '19/x3', 'Curto', 'B', 1),
  A('Espingarda', 'taticas', 'fogo', 1, '4d6', 'x3', 'Curto', 'B', 2, 2),
  A('Fuzil de assalto', 'taticas', 'fogo', 2, '2d10', '19/x3', 'Médio', 'B', 2, 2),
  A('Fuzil de precisão', 'taticas', 'fogo', 3, '2d10', '19/x3', 'Longo', 'B', 2, 2),
  A('Bazuca', 'pesadas', 'fogo', 3, '10d8', 'x2', 'Médio', 'I', 2, 2),
  A('Lança-chamas', 'pesadas', 'fogo', 3, '6d6', 'x2', 'Curto', 'F', 2, 2),
  A('Metralhadora', 'pesadas', 'fogo', 2, '2d12', '19/x3', 'Médio', 'B', 2, 2),
  { ...A('Machado do Mutilador', 'taticas', 'corpo', 4, '1d8+1d8', 'x3', '—', 'C', 1), extraMultiplica: true, fonte: 'AS02', nota: 'Item amaldiçoado de Sangue: +1d8 de Sangue (multiplica no crítico). 1 PE ao acertar: alvo sangrando (acumula). AS02 p. 41.' },
  { ...A('Manoplas do Colosso', 'taticas', 'corpo', 4, '1d6+1d10', 'x2', '—', 'I', 2), fonte: 'AS02', nota: 'Par amaldiçoado de Energia (+1d10 Energia). Seguem as regras de ataque desarmado. AS02 p. 47.' },
  { ...A('Punhal X', 'simples', 'corpo', 4, '1d4+1d6', '19', 'Curto', 'P', 1), fonte: 'AS02', nota: 'Ágil, amaldiçoado de Conhecimento (+1d6). 2 PE: alvo desprevenido; se acertar, cego 1 rodada (1x por cena). AS02 p. 53.' },
  { ...A('Sniper Fantasma', 'taticas', 'fogo', 4, '2d10+2d4', '19/x3', 'Longo', 'B', 2, 2), fonte: 'AS02', municao: 'Balas longas', nota: 'Amaldiçoado de Morte (+2d4). Veterano em Pontaria mirando: +5 na margem. Alvo a 0 PV morre após 2 turnos. AS02 p. 59.' },
  { ...A('A Antena', 'simples', 'corpo', 4, '1d6', 'x2', '—', 'I', 2, 2), fonte: 'AS02', nota: 'Improvisada (–1 dado no ataque). DT dos rituais +3; guarda um ritual para liberar depois. AS02 p. 67.' },
  { ...A('Faca Predadora', 'simples', 'corpo', 4, '1d4+2d10', '19/x3', 'Curto', 'P', 1), fonte: 'AS02', nota: 'Ágil, amaldiçoada de Sangue (+2d10). 2 PE: se acertar, recupera 2d10 PV. AS02 p. 93.' },
  { ...A('Maça (Dupla Obsessiva)', 'taticas', 'corpo', 3, '2d4+1d6', 'x3', '—', 'P', 1), extraMultiplica: true, fonte: 'AS03', nota: 'Amaldiçoada de Sangue (+1d6). Use com o florete: ação padrão = um ataque de cada. AS03 p. 114.' },
  { ...A('Florete (Dupla Obsessiva)', 'taticas', 'corpo', 0, '1d6+2d4', '18', '—', 'P', 1), extraMultiplica: true, fonte: 'AS03', nota: 'Ágil, amaldiçoado de Sangue (+2d4). O par conta como um item (cat. III, 2 espaços). AS03 p. 114.' },
  { ...A('Cajado da Cruz de Sangue', 'simples', 'corpo', 3, '1d12', 'x2', '—', 'C', 2, 2), fonte: 'AS07', nota: 'Ágil; vale com Combater com Duas Armas. Ocultista com ritual de Sangue: –1 PE, +1 DT e +1 dado nos rituais e poderes de Sangue. AS07 p. 78.' },
  { ...A('Arcabuz dos Moretti', 'simples', 'fogo', 2, '2d8', 'x3', 'Curto', 'E', 1), fonte: 'LR', bonusAtaque: 2, nota: 'Item amaldiçoado de Energia: +2 no ataque, sem munição. A cada disparo role 1d6 para o dano: 2d4, 2d6, 2d8, 2d10, 2d12 ou 2d20 (ajuste a rolagem). LR p. 150.' },
  { ...A('Garra do Harpia', 'taticas', 'corpo', 1, '2d8', '19', 'Curto', 'C', 2, 2), fonte: 'AS03', nota: 'Ágil e arremessável. A manobra adicional depende da ação do usuário.' },
  { ...A('Lança-nitrogênio', 'pesadas', 'fogo', 3, '6d6', 'x2', 'Curto', 'Fr', 2, 2), fonte: 'AS06', municao: 'Combustível', nota: 'Ataque em linha; Fortitude pode reduzir a condição, conforme AS06 p. 73.' },
  { ...A('Designated Marksman Rifle', 'taticas', 'fogo', 3, '2d10', '19/x3', 'Médio', 'B', 3, 2), fonte: 'AS09', municao: 'Balas longas', nota: 'Bônus de mira para Pontaria veterana segundo AS09 p. 43.' },
  { ...A('Pistola Taser', 'taticas', 'disparo', 2, '2d6', 'x3', 'Curto', 'E', 1), fonte: 'AS09', nota: 'Em acerto, confira o teste de resistência e efeito de atordoamento no AS09 p. 48.' },
  { ...A('Espingarda Serrada', 'taticas', 'fogo', 1, '3d6', 'x3', 'Curto', 'B', 1), fonte: 'AS09', nota: 'Metade do dano em alcance superior ao indicado no AS09 p. 46.' },
  { ...A('Machado Tático', 'taticas', 'corpo', 2, '1d8', 'x3', 'Curto', 'C', 1), fonte: 'AS09', nota: 'Ágil. Contra-ataque e bloqueio têm opções extras no AS09 p. 47.' },
  ASaH('Pregador pneumático', 'simples', 'disparo', 0, '1d4', 'x4', 'Curto', 'P', 1),
  ASaH('Estilingue', 'simples', 'disparo', 0, '1d4', 'x2', 'Curto', 'I', 1, 2),
  ASaH('Revólver compacto', 'simples', 'fogo', 1, '2d4', '19/x3', 'Curto', 'P', 1),
  ASaH('Baioneta', 'taticas', 'corpo', 0, '1d4', '19', '—', 'P', 1),
  ASaH('Faca tática', 'taticas', 'corpo', 1, '1d6', '19', 'Curto', 'C', 1),
  ASaH('Gancho de carne', 'taticas', 'corpo', 0, '1d4', 'x4', '—', 'P', 1),
  ASaH('Bastão policial', 'taticas', 'corpo', 1, '1d6', 'x2', 'Curto', 'I', 1),
  ASaH('Picareta', 'taticas', 'corpo', 0, '1d6', 'x4', '—', 'P', 1),
  ASaH('Shuriken', 'taticas', 'arremesso', 1, '1d4', 'x2', 'Curto', 'P', 0.5),
  ASaH('Pistola pesada', 'taticas', 'fogo', 1, '2d8', '18', 'Curto', 'B', 1),
  ASaH('Espingarda de cano duplo', 'taticas', 'fogo', 2, '4d6', 'x3', 'Curto', 'B', 2, 2),
  { ...ASaH('Fuzil alheio', 'taticas', 'fogo', 4, '2d10', '17/x3', 'Extremo', 'E', 2, 2), nota: 'Inclui mira laser e telescópica. Sem munição.' },
];
export const PROTECOES = [
  { nome: 'Proteção leve', defesa: 5, categoria: 1, espacos: 2, peso: 'leve' },
  { nome: 'Proteção pesada', defesa: 10, categoria: 2, espacos: 5, peso: 'pesada', rd: 2, penalidade: 5 },
  { nome: 'Escudo', defesa: 2, categoria: 1, espacos: 2, peso: 'escudo' },
  { nome: 'Armadura dos Couraças', defesa: 10, categoria: 3, espacos: 0, peso: 'pesada', nota: 'RD B/I/P 5, Sangue 10. Vulnerável a Morte. +1 Defesa por semana, até +20. AS03 p. 115.' },
  { nome: 'Capacete Tático', defesa: 0, categoria: 2, espacos: 1, peso: 'pesada', nota: '25% de chance de ignorar dano extra de crítico ou furtivo. AS09 p. 43.' },
  { nome: 'Escudo Balístico LED', defesa: 2, categoria: 2, espacos: 2, peso: 'escudo', nota: 'RD balístico 10 e efeitos de cobertura e luz. AS09 p. 46.' },
];
export const ITENS_GERAIS = [
  { nome: 'Balas curtas', categoria: 0, espacos: 1 }, { nome: 'Balas longas', categoria: 1, espacos: 1 },
  { nome: 'Cartuchos', categoria: 1, espacos: 1 }, { nome: 'Flechas', categoria: 0, espacos: 1 },
  { nome: 'Combustível', categoria: 1, espacos: 1 }, { nome: 'Foguete', categoria: 1, espacos: 1 },
  { nome: 'Kit de perícia', categoria: 0, espacos: 1 }, { nome: 'Kit de medicina', categoria: 0, espacos: 1 },
  { nome: 'Algemas', categoria: 0, espacos: 1 }, { nome: 'Arpéu', categoria: 0, espacos: 1 },
  { nome: 'Cicatrizante', categoria: 1, espacos: 1 }, { nome: 'Granada incendiária', categoria: 1, espacos: 1 },
  { nome: 'Lanterna tática', categoria: 1, espacos: 1 }, { nome: 'Taser', categoria: 1, espacos: 1 },
  { nome: 'Pistola de dardos', categoria: 1, espacos: 1 }, { nome: 'Celular', categoria: 0, espacos: 1 },
];
// Equipamentos do Livro de Regras que faltavam (tabelas 3.8 e 3.10, p. 73–77 do PDF)
export const ITENS_LR = [
  { nome: 'Utensílio', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Acessórios (Livro de Regras)', resumo: 'Item comum com uma utilidade (canivete, lupa, smartphone…): +2 em uma perícia (menos Luta e Pontaria) enquanto empunhado.' },
  { nome: 'Vestimenta', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Acessórios (Livro de Regras)', resumo: 'Peça de roupa que dá +2 em uma perícia (menos Luta e Pontaria), ex.: botas militares em Atletismo.' },
  { nome: 'Granada de atordoamento', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Explosivos (Livro de Regras)', resumo: 'Flash-bang: quem está na área fica atordoado 1 rodada (Fortitude DT Agi reduz para ofuscado e surdo por 1 rodada).' },
  { nome: 'Granada de fragmentação', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Explosivos (Livro de Regras)', resumo: '8d6 de dano de perfuração na área (Reflexos DT Agi reduz à metade).' },
  { nome: 'Granada de fumaça', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Explosivos (Livro de Regras)', resumo: 'Fumaça espessa: quem está na área fica cego e com camuflagem total por 2 rodadas.' },
  { nome: 'Mina antipessoal', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Explosivos (Livro de Regras)', resumo: 'Instalar: ação completa e Tática DT 15. Detonada à distância (alcance longo): cone de 6m, 12d6 de perfuração (Reflexos DT Int reduz à metade).' },
  { nome: 'Bandoleira', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: 'Uma vez por rodada, saca ou guarda um item como ação livre.' },
  { nome: 'Binóculos', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '+5 em Percepção para observar coisas distantes.' },
  { nome: 'Bloqueador de sinal', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: 'Impede que celulares em alcance médio se conectem.' },
  { nome: 'Corda', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '10 metros: +5 em Atletismo para descer ou subir com ela, amarrar pessoas etc.' },
  { nome: 'Equipamento de sobrevivência', categoria: 0, espacos: 2, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '+5 em Sobrevivência para acampar e se orientar, e permite esses testes sem treino.' },
  { nome: 'Máscara de gás', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '+10 em Fortitude contra efeitos que dependem de respiração.' },
  { nome: 'Mochila militar', categoria: 1, espacos: 0, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: 'Não ocupa espaço e aumenta a capacidade de carga em 2 espaços.' },
  { nome: 'Óculos de visão térmica', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: 'Elimina a penalidade por camuflagem.' },
  { nome: 'Pé de cabra', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '+5 em Força para arrombar portas; em combate, conta como bastão.' },
  { nome: 'Pistola sinalizadora', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: 'Sinalizador luminoso; como arma de disparo leve, alcance curto, 2d6 de fogo. Vem com 2 cargas.' },
  { nome: 'Soqueira', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '+1 no dano desarmado e o torna letal; aceita modificações e maldições de arma corpo a corpo.' },
  { nome: 'Spray de pimenta', categoria: 1, espacos: 1, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: 'Ação padrão contra um ser adjacente: fica cego 1d4 rodadas (Fortitude DT Agi evita). Dois usos.' },
  { nome: 'Traje hazmat', categoria: 1, espacos: 2, fonte: 'LR', grupo: 'Itens operacionais (Livro de Regras)', resumo: '+5 em resistências contra efeitos ambientais e resistência a químico 10.' },
  { nome: 'Amarras de (elemento)', categoria: 2, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Cordas ou correntes de um elemento, feitas para prender criaturas vulneráveis a ele.' },
  { nome: 'Câmera de aura paranormal', categoria: 2, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Ação padrão e 1 PE por foto: revela auras paranormais em pessoas e objetos, na cor do elemento.' },
  { nome: 'Componentes ritualísticos (elemento)', categoria: 0, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Necessários para conjurar rituais do elemento (não existem de Medo).' },
  { nome: 'Emissor de pulsos paranormais', categoria: 2, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Ação completa e 1 PE: emite um pulso de um elemento que atrai criaturas dele e afasta as do elemento oposto (Vontade DT Pre evita).' },
  { nome: 'Escuta de ruídos paranormais', categoria: 2, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Ação completa e 2 PE: grava ruídos paranormais por 24 horas; ouvir dá +5 em Ocultismo para identificar criatura.' },
  { nome: 'Medidor de estabilidade da membrana', categoria: 2, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Com treino em Ocultismo, avalia o estado da Membrana numa área (indício, não certeza, de manifestação).' },
  { nome: 'Scanner de manifestação paranormal (elemento)', categoria: 2, espacos: 1, fonte: 'LR', grupo: 'Itens paranormais (Livro de Regras)', resumo: 'Ação padrão e 1 PE por rodada: indica a direção de manifestações do elemento em alcance longo.' },
];
// Itens do Sobrevivendo ao Horror (cap. 1, "Equipamento"). Resumos com outras palavras; página = página do PDF digitalizado.
const IS = (nome, grupo, pagina, resumo, extra = {}) => {
  const [categoria, espacos] = MATERIAL_SAH[nome] || [null, null];
  return { nome, categoria, espacos, fonte: 'SaH', grupo, pagina, resumo, ...extra };
};
export const ITENS_SAH = [
  // Acessórios (p. 40)
  IS('Amuleto sagrado', 'Acessórios', 40, 'Objeto de fé (rosário, contas, shimenawa…). Conta como item vestido: +2 em Religião e Vontade.'),
  IS('Chave de fenda universal', 'Acessórios', 40, '+2 em testes para criar ou consertar objetos; também vale como item de apoio (ex.: mexer em cabos para hackear).'),
  IS('Chaves', 'Acessórios', 40, 'Jogar o molho de chaves para distrair alguém dá +2 em Furtividade na mesma rodada.'),
  IS('Documentos falsos', 'Acessórios', 40, 'Identidade falsa completa: +2 em Diplomacia, Enganação e Intimidação para se passar por essa pessoa.'),
  IS('Manual operacional', 'Acessórios', 40, 'Um por perícia. Uma ação de interlúdio lendo: usa a perícia como treinado até o próximo interlúdio (o aprimorado dá também +5). Só um manual por vez.'),
  IS('Notebook', 'Acessórios', 40, 'Com internet, +2 em testes para obter informações. Ao relaxar no interlúdio, recupera +1 de Sanidade. A tela ilumina um cone de 4,5m. Inclui tablets.'),
  // Modificação de acessório cadastrada no editor de itens.
  // Explosivos (p. 42)
  IS('Dinamite', 'Explosivos', 42, 'Ação padrão para acender e arremessar (alcance médio). Raio de 6m: 4d6 de impacto + 4d6 de fogo e fica em chamas (Reflexos DT Agi: metade e sem chamas).'),
  IS('Explosivo plástico', 'Explosivos', 42, 'Duas rodadas para preparar; detona por controle (alcance longo) ou com fogo/eletricidade. Raio de 3m: 16d6 de impacto (Reflexos DT Int: metade). Nas mãos de especialista, dano dobrado em estruturas e ignora RD.'),
  IS('Galão vermelho', 'Explosivos', 42, 'Explode ao sofrer dano de fogo ou balístico: esfera de 6m, 12d6 de fogo e em chamas (Reflexos DT 25: metade e sem chamas). A área continua queimando (1d6/rodada).'),
  IS('Granada de gás sonífero', 'Explosivos', 42, 'Fumaça em raio de 6m por 2 rodadas: quem começa o turno nela fica inconsciente (ou exausto, se em atividade intensa). Fortitude DT Agi reduz para fatigado por 1d4 rodadas.'),
  IS('Granada de PEM', 'Explosivos', 42, 'Desliga todo equipamento elétrico num raio de 18m até o fim da cena. Criaturas de Energia: 6d6 de impacto e atordoadas 1 rodada (Fortitude DT Agi: metade e sem condição).'),
  // Itens operacionais (p. 43–45)
  IS('Alarme de movimento', 'Itens operacionais', 43, 'Ação completa para instalar: avisa no celular (ou com sirene) quando algo Pequeno ou maior se move num cone de 30m.'),
  IS('Alimento energético', 'Itens operacionais', 43, 'Ação padrão para consumir: recupera 1d4 PE.'),
  IS('Aplicador de medicamentos', 'Itens operacionais', 43, 'Preso ao braço ou perna: aplica cicatrizante ou medicamento com ação de movimento. Guarda 3 doses; recarregar uma dose é ação padrão.'),
  IS('Braçadeira reforçada', 'Itens operacionais', 43, '+2 na RD que você recebe ao bloquear.'),
  IS('Cão adestrado', 'Itens operacionais', 43, 'Aliado para quem é treinado em Adestramento: +2 em Investigação e Percepção; 1 PE para o cão protegê-lo (+2 na Defesa por 1 rodada).'),
  IS('Coldre saque rápido', 'Itens operacionais', 43, 'Uma vez por rodada, saca ou guarda uma arma de fogo leve como ação livre.'),
  IS('Equipamento de escuta', 'Itens operacionais', 43, 'Receptor (90m) e 3 transmissores (ouvem 9m). Instalar: Crime DT 20 (o resultado é a DT para achá-lo). Discretamente: ação completa, Furtividade contra Percepção e +5 na DT.'),
  IS('Estrepes (saco)', 'Itens operacionais', 43, 'Ação padrão cobre um quadrado de 1,5m: quem pisa sofre 1d4 de perfuração e fica lento por um dia (Reflexos DT Agi evita). Também atrapalha perseguidores.'),
  IS('Faixa de pregos', 'Itens operacionais', 44, 'Como estrepes, mas numa linha de 9m; fura pneus de veículos (deslocamento pela metade).'),
  IS('Isqueiro', 'Itens operacionais', 44, 'Ação de movimento para acender: chama pequena, ilumina 3m.'),
  IS('Antibiótico', 'Medicamentos', 44, 'Ação padrão: +5 no próximo teste de Fortitude contra doença feito até o fim do dia.'),
  IS('Antídoto', 'Medicamentos', 44, 'Ação padrão: +5 no próximo teste de Fortitude contra veneno até o fim do dia. O antídoto específico remove o veneno.'),
  IS('Antiemético', 'Medicamentos', 44, 'Remove a condição enjoado e dá +5 para evitá-la até o fim da cena.'),
  IS('Anti-histamínico', 'Medicamentos', 44, '+5 no próximo teste contra efeitos de alergia até o fim do dia.'),
  IS('Anti-inflamatório', 'Medicamentos', 44, 'Dá 1d8+2 PV temporários.'),
  IS('Antitérmico', 'Medicamentos', 44, 'Permite um novo teste contra uma condição mental (uma vez por cena).'),
  IS('Broncodilatador', 'Medicamentos', 44, '+5 para evitar as condições asfixiado ou fatigado até o fim do dia.'),
  IS('Coagulante', 'Medicamentos', 44, '+5 para se estabilizar da condição sangrando até o fim do dia; +5 também no teste de Medicina para tirar alguém de morrendo.'),
  IS('Óculos escuros', 'Itens operacionais', 44, 'Quem usa não pode ficar ofuscado.'),
  IS('Óculos de visão noturna', 'Itens operacionais', 44, 'Dá visão no escuro, mas –1d20 em testes de resistência contra ofuscado e efeitos baseados em luz (como granada de atordoamento).'),
  IS('Pá', 'Itens operacionais', 44, '+5 em testes de Força para cavar e mover entulho; em combate, conta como bastão.'),
  IS('Paraquedas', 'Itens operacionais', 44, 'Anula dano de queda. Sem ser veterano em Acrobacia, Pilotagem, Reflexos, Tática ou Profissão adequada: Reflexos DT 20 (falha: dano só pela metade).'),
  IS('Traje de mergulho', 'Itens operacionais', 45, 'Ocupa o espaço de vestimenta (vestir é ação completa). 1 hora de oxigênio; +5 em resistências contra efeitos ambientais e RD química 5.'),
  IS('Traje espacial', 'Itens operacionais', 45, 'Ocupa o espaço de vestimenta (2 rodadas para vestir). 8 horas de água e oxigênio; +10 em resistências contra efeitos ambientais e RD química 20.'),
  // Itens paranormais (p. 45–46)
  IS('Catalisador ritualístico ampliador', 'Catalisadores', 45, 'Consumido ao usar (empunhado, um por ritual). Aumenta o alcance do ritual em um passo ou dobra a área. Existe um de cada elemento.'),
  IS('Catalisador ritualístico perturbador', 'Catalisadores', 45, 'Consumido ao usar (empunhado, um por ritual). +2 na DT para resistir ao ritual. Existe um de cada elemento.'),
  IS('Catalisador ritualístico potencializador', 'Catalisadores', 45, 'Consumido ao usar (empunhado, um por ritual). O dano do ritual aumenta em um dado do mesmo tipo. Existe um de cada elemento.'),
  IS('Catalisador ritualístico prolongador', 'Catalisadores', 45, 'Consumido ao usar (empunhado, um por ritual). Dobra a duração (não vale para instantâneos ou sustentados). Existe um de cada elemento.'),
  IS('Ligação direta infernal', 'Itens paranormais', 45, 'Ação completa para ligar um veículo: ele ganha RD 20 e imunidade a Sangue, e você +5 em Pilotagem; mas falhas na pilotagem têm consequências ampliadas (em geral dobradas).'),
  IS('Medidor de condição vertebral', 'Itens paranormais', 45, 'Conectar à coluna é ação completa e deixa atordoado 1 rodada. Conta como vestimenta: +2 em Fortitude, mostra a saúde por cores e pisca lilás sob efeito paranormal; dá bônus em Medicina para tratar o usuário.'),
  IS('Pé de morto', 'Itens paranormais', 46, 'Botas de pele amaldiçoada: +5 em Furtividade; em cenas de furtividade, se mover de forma chamativa aumenta a visibilidade em só +1.'),
  IS('Pen drive selado', 'Itens paranormais', 46, 'Protegido por sigilos de Conhecimento: não pode ser invadido nem afetado por Energia; serve para invadir outros aparelhos sem contaminação.'),
  IS('Valete da salvação', 'Itens paranormais', 46, 'Ação padrão para jogar a carta: ela aponta a melhor rota de fuga em alcance médio e some. Numa perseguição, você consegue cortar caminho automaticamente.'),
  // Modificação de acessório cadastrada no editor de itens.
  // Itens amaldiçoados por elemento (p. 58–62)
  IS('Conector de membros', 'Itens amaldiçoados', 58, 'Ação padrão para religar braço, perna ou cabeça decepados (até 3 rodadas). Quem estava morrendo ou morto fica inconsciente com 1 PV. 25% de a parte ganhar “vida própria”: perna deixa lento; braço dá –1d20 em testes com ele; cabeça dá 25% de ficar confuso no início de cenas de grande tensão.', { elemento: 'sangue' }),
  IS("Dose d'A Praga", 'Itens amaldiçoados', 58, 'Ação padrão: você ou alguém adjacente recebe Arma de Sangue, Sangue de Ferro e Sangue Vivo até o fim da cena. Depois, Fortitude (DT 20 +5 por dose anterior desde o interlúdio): se falhar, 2d4 de dano mental, mantém os poderes mais uma cena e fica sob Ódio Incontrolável.', { elemento: 'sangue' }),
  IS('Mandíbula agonizante', 'Itens amaldiçoados', 58, 'Ação padrão para apertar e arremessar (alcance médio): grita alto num raio de 30m até o fim da cena. Em furtividade, passa automaticamente num teste para distrair. Criaturas de Sangue precisam de Vontade DT 35 para não ir comê-la.', { elemento: 'sangue' }),
  IS('Retalho tenebroso', 'Itens amaldiçoados', 58, 'Ação padrão para usar como máscara: faro e visão no escuro, mas vulnerabilidade a Morte e –2d20 em perícias de interação social. +1 cumulativo no dano por dia de uso; perde 1d6 PV por dia (Fortitude DT 15, +5 por teste seguido, evita). Tirar exige ação padrão e Fortitude.', { elemento: 'sangue' }),
  IS('Ampulheta do tempo sofrido', 'Itens amaldiçoados', 59, 'Empunhada: 5 PE para receber na hora os benefícios de uma ação de interlúdio. Só pode usar de novo depois de gastar uma ação de interlúdio para “devolver o tempo”.', { elemento: 'morte' }),
  IS('Injeção de Lodo', 'Itens amaldiçoados', 60, 'Ação padrão, em você ou alguém adjacente que aceite: até o fim da cena, vulnerabilidade a balístico e Energia, mas na próxima vez que cairia a 0 PV fica com 1 PV.', { elemento: 'morte' }),
  IS('Instantâneo mortal', 'Itens amaldiçoados', 60, 'Foto dos últimos momentos de alguém. Ao procurar pistas com uma perícia ligada àquela morte, 1 PE: a imagem aponta uma direção útil (+1d20 no teste). O mestre decide quais perícias se relacionam à foto.', { elemento: 'morte' }),
  IS('Projétil de Lodo, curto', 'Itens amaldiçoados', 60, 'Munição (curta ou longa) forjada com Lodo: todo o dano da arma vira Morte. No fim da cena a arma se degrada até se desfazer. Poderosa contra criaturas de Sangue.', { elemento: 'morte' }),
  IS('Projétil de Lodo, longo', 'Itens amaldiçoados', 60, 'Munição (curta ou longa) forjada com Lodo: todo o dano da arma vira Morte. No fim da cena a arma se degrada até se desfazer. Poderosa contra criaturas de Sangue.', { elemento: 'morte' }),
  IS('Rádio chiador', 'Itens amaldiçoados', 60, 'Ligado, chia se houver criatura paranormal em alcance extremo, mais alto quanto mais perto (dá direção e distância aproximadas). Atrai as criaturas que o ouvem. Pilhas duram 12 horas.', { elemento: 'morte' }),
  IS('Câmera obscura', 'Itens amaldiçoados', 60, 'Câmera de aura que já vem com a lente de revelação, com +10 na DT; se a criatura falhar, também sofre 6d6 de dano de frio (só criaturas com invisibilidade, incorporeidade ou camuflagem).', { elemento: 'conhecimento' }),
  IS('Enxame fantasmagórico', 'Itens amaldiçoados', 61, 'Manto de traças: vestido, deixa você invisível, mas sofre 1 de dano mental (ignora resistência) no início de cada turno.', { elemento: 'conhecimento' }),
  IS('Repositório do fracasso', 'Itens amaldiçoados', 61, 'Cada 1 tirado no d20 por uma criatura paranormal em alcance médio vira uma carga (máx. 6). Uma vez por rodada, gaste uma carga para recuperar 1d4 PE, com –1 cumulativo em Vontade até o próximo interlúdio.', { elemento: 'conhecimento' }),
  IS('Tablet do saber custoso', 'Itens amaldiçoados', 61, 'Empunhada: age como treinado numa perícia por um teste, perdendo Sanidade igual ao atributo-chave dessa perícia.', { elemento: 'conhecimento' }),
  IS('Arreio neural', 'Itens amaldiçoados', 61, 'Usando o arreio, ao sofrer 5 ou mais de dano de eletricidade ou Energia, recupera 1 PE (máximo por dia: o dobro do seu Vigor).', { elemento: 'energia' }),
  IS('Centrifugador existencial', 'Itens amaldiçoados', 61, 'Ação padrão e 3 PE: você se divide e ganha um turno extra no fim da rodada; sorteie qual versão some. Ocultismo DT 15 (+5 por uso no dia): se falhar, perde metade dos atributos (recupera 1 de cada por interlúdio).', { elemento: 'energia' }),
  IS('Espelho refletor', 'Itens amaldiçoados', 62, 'Ação de movimento para ver um ponto fora do seu ângulo em alcance médio, com +1d20 em Percepção e chance de ver até atrás de cobertura total. Ao sofrer dano de Energia, pode sacrificá-lo para evitar o dano e refleti-lo de volta à origem.', { elemento: 'energia' }),
  IS('Fuzil alheio', 'Itens amaldiçoados', 62, 'Fuzil de precisão alienígena com mira telescópica e laser: causa dano de Energia e não precisa de munição. Está na lista de armas: 2d10, crítico 17/x3, alcance extremo, categoria IV, 2 espaços.', { elemento: 'energia' }),
  IS('A Primeira Adaga', 'Itens amaldiçoados', 62, 'Usada como componente, dá ao ritual os efeitos de todos os catalisadores (ampliador, perturbador, potencializador e prolongador) e conjuração em 1 rodada; o conjurador perde metade dos PV totais (conta para dano massivo).', { elemento: 'medo' }),
];
// Maldições para acessórios (utensílios e vestimentas), Livro de Regras p. 147
export const ACESSORIOS_AMALDICOADOS = [
  { nome: 'Acessório amaldiçoado: Carisma', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+1 em Presença (não dá PE). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'conhecimento', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Conjuração', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: 'Guarda um ritual de 1º círculo: empunhando, conjura como se conhecesse (se já conhece, –1 PE). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'conhecimento', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Escudo Mental', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: 'Resistência mental 10. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'conhecimento', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Reflexão', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: 'Uma vez por rodada, PE igual ao custo para refletir um ritual no conjurador. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'conhecimento', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Sagacidade', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+1 em Intelecto (não dá perícias nem graus). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'conhecimento', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Defesa', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+5 na Defesa. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'energia', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Destreza', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+1 em Agilidade. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'energia', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Potência', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+1 na DT das suas habilidades, poderes e rituais. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'energia', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Esforço Adicional', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+5 PE (depois de um dia de uso). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'morte', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Disposição', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+1 em Vigor. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'sangue', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Pujança', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+1 em Força. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'sangue', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Vitalidade', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: '+15 PV (depois de um dia de uso). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'sangue', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
  { nome: 'Acessório amaldiçoado: Proteção Elemental', categoria: null, espacos: null, fonte: 'LR', grupo: 'Acessórios amaldiçoados (Livro de Regras)', resumo: 'Resistência 10 contra um elemento (conta como item desse elemento). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.', elemento: 'variavel', notaCategoria: 'Categoria: a do acessório base +1 por maldição (Livro de Regras p. 147).' },
];
export const ITENS_CATALOGO = [...ITENS_GERAIS, ...ITENS_LR, ...ITENS_SAH, ...ITENS_ESPECIAIS, ...ITENS_ARQUIVOS, ...ACESSORIOS_AMALDICOADOS];
export const ITEM_INFO = Object.fromEntries([...ITENS_LR, ...ITENS_SAH, ...ITENS_ESPECIAIS, ...ITENS_ARQUIVOS, ...ACESSORIOS_AMALDICOADOS].map(i => [i.nome, i])); // itens com descrição (botão ? na mochila)
export const DESLOCAMENTO_BASE = 9; // metros
export const TIPOS_DANO = { B: 'balístico', C: 'corte', I: 'impacto', P: 'perfuração', F: 'fogo', E: 'Energia', Fr: 'frio' };

// ---------- Condições (resumos curtos) ----------
// "–1D" = um dado a menos no teste.
export const CONDICOES = [
  ['abalado', 'Abalado', '–1D em testes.'], ['agarrado', 'Agarrado', 'Desprevenido e imóvel; –1D em ataques, só armas leves.'],
  ['alquebrado', 'Alquebrado', 'Habilidades e rituais custam +1 PE.'], ['apavorado', 'Apavorado', '–2D em perícias e foge da fonte do medo.'],
  ['asfixiado', 'Asfixiado', 'Não respira; aguenta algumas rodadas e depois faz Fortitude.'], ['atordoado', 'Atordoado', 'Desprevenido e não age.'],
  ['caido', 'Caído', 'No chão: pior contra corpo a corpo, melhor contra distância, desloca pouco.'], ['cego', 'Cego', 'Desprevenido e lento; –2D em perícias de AGI e FOR.'],
  ['confuso', 'Confuso', 'Age de forma aleatória.'], ['debilitado', 'Debilitado', '–2D em AGI, FOR e VIG.'],
  ['doente', 'Doente', 'Sob efeito de uma doença.'], ['desprevenido', 'Desprevenido', '–5 na Defesa e –1D em Reflexos.'], ['em-chamas', 'Em chamas', 'Sofre dano de fogo por rodada até apagar.'],
  ['enjoado', 'Enjoado', 'Só uma ação padrão OU de movimento por rodada.'], ['enlouquecendo', 'Enlouquecendo', 'Sanidade 0. Três turnos assim na cena e o personagem fica insano.'],
  ['enredado', 'Enredado', 'Lento, vulnerável e –1D em ataques.'], ['envenenado', 'Envenenado', 'Depende do veneno.'],
  ['esmorecido', 'Esmorecido', '–2D em INT e PRE.'], ['exausto', 'Exausto', 'Debilitado, lento e vulnerável.'],
  ['fascinado', 'Fascinado', '–2D em Percepção e não age, até ser balançado ou ameaçado.'], ['fatigado', 'Fatigado', 'Fraco e vulnerável.'],
  ['fraco', 'Fraco', '–1D em AGI, FOR e VIG.'], ['frustrado', 'Frustrado', '–1D em INT e PRE.'],
  ['imovel', 'Imóvel', 'Deslocamento 0.'], ['inconsciente', 'Inconsciente', 'Indefeso e não age.'],
  ['indefeso', 'Indefeso', 'Desprevenido, –10 na Defesa e falha em Reflexos.'], ['lento', 'Lento', 'Deslocamento pela metade; não corre.'],
  ['machucado', 'Machucado', 'Metade dos PV ou menos.'], ['morrendo', 'Morrendo', '0 PV. Três turnos assim na cena e o personagem morre.'],
  ['ofuscado', 'Ofuscado', '–1D em ataques e Percepção.'], ['paralisado', 'Paralisado', 'Imóvel e indefeso; só ações mentais.'],
  ['pasmo', 'Pasmo', 'Não age.'], ['perturbado', 'Perturbado', 'Metade da Sanidade ou menos: sofre um efeito de insanidade.'],
  ['petrificado', 'Petrificado', 'Inconsciente, com RD 10.'], ['sangrando', 'Sangrando', 'Teste de Vigor DT 20 no início do turno. Se falhar, perde 1d6 PV.'],
  ['surdo', 'Surdo', 'Não ouve; –2D em Iniciativa.'], ['surpreendido', 'Surpreendido', 'Desprevenido e não age na rodada.'],
  ['vulneravel', 'Vulnerável', '–2 na Defesa.'],
].map(([id, nome, resumo]) => ({ id, nome, resumo }));
// penalidades automáticas: dados a menos por atributo, e Defesa

// Tabela 5.1: Efeitos de Insanidade (Livro de Regras, p. 113). Role 1d20 na primeira vez que ficar perturbado na cena.
// Temporário enquanto perturbado; se ficar enlouquecendo, dura até o fim da missão.
export const EFEITOS_INSANIDADE = [
  'Você busca dor. Seja sentir dor ou causar dor.',
  'Quando você olha o rosto de uma pessoa, vê sua imagem distorcida, com pedaços de animais ou monstros mesclados à face dela.',
  'Todas as vozes ficam deturpadas, como se fossem faladas por um monstro.',
  'Você fica escutando uma voz na sua cabeça, que repete constantemente que você está mentindo.',
  'O seu sangue parece estar quente, como se quisesse sair de dentro do seu corpo.',
  'Você vê rostos humanos e monstruosos nas sombras, sempre encarando você.',
  'Uma fome constante domina seu corpo, como se você não pudesse ser saciado.',
  'Um gosto permanente de ferro domina seu paladar, como se sua boca estivesse tomada por sangue.',
  'A luz incomoda seus olhos a ponto de você precisar escondê-los o tempo todo. É como se seus olhos queimassem.',
  'Falar é praticamente impossível. É como se algo externo estivesse controlando o que você fala.',
  'Seus olhos coçam violentamente, e só parece que vão parar quando forem arrancados de sua cabeça.',
  'Sua memória começa a falhar, lentamente. Qualquer evento ocorrido há mais de uma hora começa a ficar nebuloso.',
  'As emoções começam a se tornar confusas. Algo feliz desperta raiva e algo dolorido desperta felicidade.',
  'Você sente a necessidade constante de descrever todas as ações da maneira mais grotesca possível.',
  'Existem vermes dentro de seu corpo, correndo por suas veias e órgãos. Você tem certeza disso. Você sente debaixo de sua pele.',
  'Você acha que está sob efeito constante de um ritual que o deixa mais poderoso.',
  'Suas mãos estão furadas e as coisas caem de seus bolsos.',
  'Você acredita puramente que tudo é fruto da sorte, deixando suas decisões para o acaso.',
  'As coisas estão fervendo, mas você gosta da dor.',
  'Apenas o fim das coisas deve ser celebrado. E você precisa dar fim.',
];

// Sobrevivendo ao Horror p. 82–83: eventos de investigação (2d6 no início da rodada; repetido = sem evento).
export const EVENTOS_INVESTIGACAO = {
  2: ['Indício traumático', 'Algo horripilante que não dá pista, mas reforça os riscos. Cada personagem faz Presença DT 15; quem falhar perde uma ação no próximo interlúdio.'],
  3: ['Atenção inesperada', 'Interrupção (alarme, vizinho, cão latindo). Um personagem gasta a ação desta rodada lidando com ela, ou a urgência diminui em 1 rodada.'],
  4: ['Lembrança opressiva', 'Algo lembra tudo o que está em jogo. Até o fim da cena, quem falhar num teste de ação de investigação perde 1 PE.'],
  5: ['Momento de tensão', 'Um susto mundano agravado pela tensão. Cada personagem sofre 1d4 de dano mental por medo (Vontade DT 15 evita).'],
  6: ['Sem evento', 'Nada acontece (além das ações dos personagens…).'], 7: ['Sem evento', 'Nada acontece (além das ações dos personagens…).'], 8: ['Sem evento', 'Nada acontece (além das ações dos personagens…).'],
  9: ['Distração', 'Um indício falso atrai um agente aleatório: ele sofre –1d20 em testes nesta rodada.'],
  10: ['Ferimento', 'Um personagem aleatório se machuca: role 1d10 para o atributo (1–2 Agi, 3–4 For, 5–6 Int, 7–8 Pre, 9–10 Vig). Enquanto machucado, –2 em testes desse atributo. Curar: Medicina DT 20 (gasta a ação dos dois) ou uma ação de interlúdio de dormir.'],
  11: ['Complicação', 'Uma complicação (queda de luz, janela que se abre…). Todos sofrem –1d20 nos testes até alguém gastar a ação e passar num teste da perícia apropriada (DT 20).'],
  12: ['Auxílio inesperado', 'Os agentes encontram uma informação útil: todos recebem +2 em testes de investigação nesta rodada.'],
};
// Sobrevivendo ao Horror p. 88–89, Tabela 2.2: efeitos de medo (2d10, +1 por efeito anterior na cena; se entregar ao medo: +5).
// Duram até o personagem recuperar pelo menos 1 ponto de Sanidade, salvo indicação.
export const EFEITOS_MEDO = [
  [2, 'Encorajamento', 'Recupera 1 SAN para cada 5% de NEX e recebe +1d20 num teste à escolha até o fim da cena.', null],
  [3, 'Surto de adrenalina', '+5 em ataques e dano até o fim da cena; para qualquer ação que não seja agredir, Vontade DT 20 (se falhar, perde a ação).', null],
  [4, 'Hesitação', 'Você balbucia e vacila: atordoado por 1 rodada.', 'atordoado'],
  [5, 'Fraqueza', 'Começa a passar mal e suar: fraco.', 'fraco'],
  [6, 'Lapso', 'A memória falha (eventos de mais de uma hora ficam nebulosos): frustrado.', 'frustrado'],
  [7, 'Ansiedade', 'Falha automaticamente no próximo teste (pode gastar uma ação padrão em algo "inútil" para se livrar disso).', null],
  [8, 'Desorientação', 'Não entende onde está nem o que acontece: desprevenido.', 'desprevenido'],
  [9, 'Desespero', 'Tristeza avassaladora: falha automaticamente em qualquer teste de Vontade.', null],
  [10, 'Histeria', 'Ri ou chora descontroladamente por 1d4 rodadas: –1d20 em todos os testes.', null],
  [11, 'Abalo', 'Tremendo e ofegante: abalado.', 'abalado'],
  [12, 'Alucinação', 'Vê e ouve coisas que não existem. Em todo teste, se o maior d20 sair ímpar, o teste falha automaticamente.', null],
  [13, 'Susto', 'Treme e arfa sem controle: apavorado.', 'apavorado'],
  [14, 'Confusão', 'Perde o controle das ações: confuso.', 'confuso'],
  [15, 'Paralisia', '"Congela": paralisado por 1d4 rodadas e depois abalado.', 'paralisado'],
  [16, 'Pavor', 'Pânico: gasta todas as ações para fugir da fonte do medo; ações de concentração têm 50% de falha. Se não conseguir fugir, fica encolhido; se fugir, fica abalado.', null],
  [17, 'Desmaio', 'A mente se desliga: inconsciente.', 'inconsciente'],
  [18, 'Trauma', 'Paralisado (como 15) e role 1d6: de 1 a 5 perde 1 ponto permanente no atributo (1 Agi, 2 For, 3 Int, 4 Pre, 5 Vig); 6 não perde.', 'paralisado'],
  [19, 'Loucura', 'A mente sucumbe: enlouquecendo.', 'enlouquecendo'],
  [20, 'Choque sistêmico', 'O corpo entra em choque (parada cardiorrespiratória): morrendo.', 'morrendo'],
];
export const EFEITO_CONDICAO = {
  abalado: { todos: -1 }, apavorado: { pericias: -2 }, cego: { agi: -2, for: -2 }, debilitado: { agi: -2, for: -2, vig: -2 },
  fraco: { agi: -1, for: -1, vig: -1 }, esmorecido: { int: -2, pre: -2 }, frustrado: { int: -1, pre: -1 },
  exausto: { agi: -2, for: -2, vig: -2, defesa: -2 }, fatigado: { agi: -1, for: -1, vig: -1, defesa: -2 },
  desprevenido: { defesa: -5 }, vulneravel: { defesa: -2 }, enredado: { defesa: -2 }, indefeso: { defesa: -10 },
};

// Ferimentos debilitantes (SaH): 1d6
export const FERIMENTOS = ['agi', 'for', 'int', 'pre', 'vig', null];

// ---------- Rituais (lista para escolher) ----------
// Só nome, elemento, círculo e um resumo de uma linha (com outras palavras). Execução, alcance, alvo,
// duração, resistência e as formas discente/verdadeira: consulte o livro e anote na ficha.
const R = (nome, elemento, circulo, resumo, fonte = 'LR') => ({ id: nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-') + (elemento === 'variavel' ? '' : ''), nome, elemento, circulo, resumo, fonte });
export const RITUAIS = [
  // 1º círculo
  R('Amaldiçoar Arma', 'variavel', 1, 'Uma arma passa a causar dano extra do elemento escolhido.'),
  R('Compreensão Paranormal', 'conhecimento', 1, 'Entende qualquer idioma falado ou escrito.'),
  R('Enfeitiçar', 'conhecimento', 1, 'Deixa uma pessoa mais amigável e prestativa com você.'),
  R('Ouvir os Sussurros', 'conhecimento', 1, 'Pergunta às vozes do Outro Lado e recebe pistas.'),
  R('Perturbação', 'conhecimento', 1, 'Dá uma ordem curta que o alvo é forçado a cumprir.'),
  R('Tecer Ilusão', 'conhecimento', 1, 'Cria uma imagem ou som falso.'),
  R('Terceiro Olho', 'conhecimento', 1, 'Enxerga auras e manifestações paranormais.'),
  R('Amaldiçoar Tecnologia', 'energia', 1, 'Turbina um aparelho ou arma tecnológica.'),
  R('Coincidência Forçada', 'energia', 1, 'O acaso conspira a favor: bônus em testes.'),
  R('Eletrocussão', 'energia', 1, 'Descarga elétrica que fere e pode atordoar.'),
  R('Embaralhar', 'energia', 1, 'Cópias ilusórias suas confundem os ataques.'),
  R('Luz', 'energia', 1, 'Um objeto passa a brilhar como lâmpada.'),
  R('Polarização Caótica', 'energia', 1, 'Atrai ou repele objetos de metal.'),
  R('Cicatrização', 'morte', 1, 'Acelera o tempo de um ferimento e cura PV.'),
  R('Consumir Manancial', 'morte', 1, 'Rouba tempo de vida ao redor e ganha PV temporários.'),
  R('Decadência', 'morte', 1, 'Envelhece os órgãos do alvo, causando dano.'),
  R('Definhar', 'morte', 1, 'Deixa o alvo fatigado ou vulnerável.'),
  R('Espirais da Perdição', 'morte', 1, 'Inimigos próximos atacam pior.'),
  R('Nuvem de Cinzas', 'morte', 1, 'Nuvem que esconde e dá camuflagem.'),
  R('Arma Atroz', 'sangue', 1, 'Arma corpo a corpo acerta melhor e critica mais.'),
  R('Armadura de Sangue', 'sangue', 1, 'Sangue endurece sobre a pele e aumenta a Defesa.'),
  R('Corpo Adaptado', 'sangue', 1, 'O corpo se ajusta a frio, calor, água e escuro.'),
  R('Distorcer Aparência', 'sangue', 1, 'Muda o rosto e o corpo de alguém.'),
  R('Fortalecimento Sensorial', 'sangue', 1, 'Sentidos e percepção ficam mais afiados.'),
  R('Ódio Incontrolável', 'sangue', 1, 'Fúria: mais dano e força, menos calma.'),
  R('Cinerária', 'medo', 1, 'Névoa que fortalece os rituais feitos dentro dela.'),
  // 2º círculo
  R('Aprimorar Mente', 'conhecimento', 2, 'Bônus em Intelecto ou Presença.'),
  R('Detecção de Ameaças', 'conhecimento', 2, 'Sente seres hostis e armadilhas na área.'),
  R('Esconder dos Olhos', 'conhecimento', 2, 'Fica invisível para olhos comuns.'),
  R('Invadir Mente', 'conhecimento', 2, 'Rajada mental ou ligação telepática.'),
  R('Localização', 'conhecimento', 2, 'Indica a direção de um ser ou objeto.'),
  R('Chamas do Caos', 'energia', 2, 'Manipula o fogo.'),
  R('Contenção Fantasmagórica', 'energia', 2, 'Laços de energia prendem o alvo.'),
  R('Dissonância Acústica', 'energia', 2, 'Área onde nenhum som se propaga.'),
  R('Sopro do Caos', 'energia', 2, 'Move o ar de formas impossíveis.'),
  R('Tela de Ruído', 'energia', 2, 'Película de estática que absorve dano.'),
  R('Desacelerar Impacto', 'morte', 2, 'Reduz dano de queda e de projéteis.'),
  R('Eco Espiral', 'morte', 2, 'Repete contra o alvo o dano que ele causou.'),
  R('Miasma Entrópico', 'morte', 2, 'Nuvem tóxica que corrói quem está nela.'),
  R('Paradoxo', 'morte', 2, 'Distorção no tempo que fere tudo na área.'),
  R('Velocidade Mortal', 'morte', 2, 'Age mais rápido: ação extra.'),
  R('Aprimorar Físico', 'sangue', 2, 'Bônus em Agilidade ou Força.'),
  R('Descarnar', 'sangue', 2, 'Abre cortes profundos na pele do alvo.'),
  R('Flagelo de Sangue', 'sangue', 2, 'O alvo obedece a uma ordem ou sofre.'),
  R('Hemofagia', 'sangue', 2, 'Suga o sangue do alvo e cura você.'),
  R('Transfusão Vital', 'sangue', 2, 'Passa seus PV para curar outra pessoa.'),
  R('Proteção contra Rituais', 'medo', 2, 'Resistência contra rituais e criaturas paranormais.'),
  R('Rejeitar Névoa', 'medo', 2, 'Enfraquece rituais conjurados na área.'),
  // 3º círculo
  R('Alterar Memória', 'conhecimento', 3, 'Apaga ou muda memórias recentes.'),
  R('Contato Paranormal', 'conhecimento', 3, 'Barganha com o Outro Lado por ajuda.'),
  R('Mergulho Mental', 'conhecimento', 3, 'Vasculha os pensamentos do alvo.'),
  R('Vidência', 'conhecimento', 3, 'Vê e ouve um alvo à distância.'),
  R('Convocação Instantânea', 'energia', 3, 'Teletransporta para sua mão um objeto marcado.'),
  R('Salto Fantasma', 'energia', 3, 'Teletransporta você e outros por perto.'),
  R('Transfigurar Água', 'energia', 3, 'Água e gelo se comportam de forma caótica.'),
  R('Transfigurar Terra', 'energia', 3, 'Terra, lama e pedra se comportam de forma caótica.'),
  R('Âncora Temporal', 'morte', 3, 'Prende o alvo a um ponto no espaço.'),
  R('Poeira da Podridão', 'morte', 3, 'Poeira que apodrece o que toca.'),
  R('Tentáculos de Lodo', 'morte', 3, 'Tentáculos negros atacam e agarram.'),
  R('Zerar Entropia', 'morte', 3, 'Deixa o alvo lento ou paralisado.'),
  R('Ferver Sangue', 'sangue', 3, 'O sangue do alvo ferve: dano e fraqueza.'),
  R('Forma Monstruosa', 'sangue', 3, 'Vira uma criatura monstruosa.'),
  R('Purgatório', 'sangue', 3, 'Poça de sangue: quem está nela sofre mais dano.'),
  R('Vomitar Pestes', 'sangue', 3, 'Vomita um enxame de criaturinhas de Sangue.'),
  R('Dissipar Ritual', 'medo', 3, 'Cancela rituais num alvo ou área.'),
  // 4º círculo
  R('Controle Mental', 'conhecimento', 4, 'Controla a mente de alguém.'),
  R('Inexistir', 'conhecimento', 4, 'Apaga um alvo da existência.'),
  R('Possessão', 'conhecimento', 4, 'Sua mente toma o corpo do alvo.'),
  R('Alterar Destino', 'energia', 4, 'Vê o futuro próximo e muda um resultado.'),
  R('Deflagração de Energia', 'energia', 4, 'Explosão de energia bruta.'),
  R('Teletransporte', 'energia', 4, 'Leva você e outros para longe.'),
  R('Convocar o Algoz', 'morte', 4, 'O maior medo do alvo surge para caçá-lo.'),
  R('Distorção Temporal', 'morte', 4, 'Você age livremente por um instante.'),
  R('Fim Inevitável', 'morte', 4, 'Uma ruptura que suga tudo ao redor.'),
  R('Capturar o Coração', 'sangue', 4, 'Faz o alvo se apaixonar por você.'),
  R('Invólucro de Carne', 'sangue', 4, 'Cria uma cópia de carne sua.'),
  R('Vínculo de Sangue', 'sangue', 4, 'Liga você a um alvo: o que um sofre, o outro sente.'),
  R('Canalizar o Medo', 'medo', 4, 'Ritual exclusivo da trilha Conduíte.'),
  R('Conhecendo o Medo', 'medo', 4, 'Ritual exclusivo da trilha Graduado.'),
  R('Lâmina do Medo', 'medo', 4, 'Ritual exclusivo da trilha Lâmina Paranormal.'),
  R('Medo Tangível', 'medo', 4, 'Ritual exclusivo da trilha Flagelador.'),
  R('Presença do Medo', 'medo', 4, 'Ritual exclusivo da trilha Intuitivo.'),
  // Conteúdo extra dos Arquivos Secretos fornecidos pelo usuário
  R('Mapa Sanguíneo', 'sangue', 2, 'Um mapa de gotas de sangue mostra em tempo real onde estão os seres num raio de 1 km.', 'AS02'),
  R('Labirinto Mental', 'conhecimento', 2, 'Prende a mente do alvo num labirinto: ele gasta as ações andando a esmo.', 'AS02'),
  R('Rajada Caótica', 'energia', 2, 'Dispara um raio de estática caótica: 8d6 de Energia.', 'AS02'),
  R('Capturar Momento', 'morte', 2, 'Marca um símbolo invisível que capta imagens e sons à distância. (O livro imprimiu o texto do Mapa Sanguíneo aqui; o efeito vem da ficha do Labirinto, p. 63.)', 'AS02'),
  R('Backup', 'energia', 2, 'Cria uma cópia de Energia sua; com uma reação você troca de lugar com ela (perde 2d4 SAN).', 'AS04'),
  R('Hesitação Forçada', 'conhecimento', 1, 'Enche o alvo de dúvidas: ele rola de novo o maior dado dos testes.', 'AS06'),
  R('Vampirismo', 'sangue', 2, 'Transforma o corpo de uma pessoa numa refeição paranormal: quem comer recebe efeitos conforme a parte consumida.', 'AS07'),
  { ...R('Passagem de Conhecimento', 'conhecimento', 2, 'Permite trocar de corpo ou compartilhar o corpo do alvo.', 'AS01'), elementos: ['sangue', 'conhecimento'], execucao: 'completa', alcance: 'toque', alvo: '1 pessoa', duracao: 'cena', resistencia: 'Vontade evita' },
  { ...R('Passagem de Conhecimento Expandido', 'conhecimento', 4, 'Troca consciências entre dois grupos de pessoas.', 'AS01'), elementos: ['sangue', 'conhecimento'], execucao: '1 dia', alcance: 'curto', alvo: 'até 10 pessoas', duracao: 'permanente', ritualExigido: 'Passagem de Conhecimento' },
  // Sobrevivendo ao Horror
  R('Esfolar', 'sangue', 1, 'Lâminas de sangue cortam o alvo, que sangra.', 'SaH'),
  R('Sede de Adrenalina', 'sangue', 2, 'Reação: refaz um teste físico ou reduz dano de impacto.', 'SaH'),
  R('Odor da Caçada', 'sangue', 3, 'Faro sobrenatural para rastrear e caçar.', 'SaH'),
  R('Martírio de Sangue', 'sangue', 4, 'Entrega-se ao Sangue: muito mais forte, mas perde a si mesmo.', 'SaH'),
  R('Apagar as Luzes', 'morte', 1, 'Apaga as luzes ao redor e você enxerga no escuro.', 'SaH'),
  R('Língua Morta', 'morte', 2, 'Faz um cadáver responder perguntas.', 'SaH'),
  R('Fedor Pútrido', 'morte', 3, 'Seu corpo parece um cadáver: engana e se esconde.', 'SaH'),
  R('Singularidade Temporal', 'morte', 4, 'Avança o tempo de um objeto até ele se desfazer.', 'SaH'),
  R('Desfazer Sinapses', 'conhecimento', 1, 'Dano mental que pode deixar o alvo esmorecido.', 'SaH'),
  R('Aurora da Verdade', 'conhecimento', 2, 'Luz que obriga todos na área a dizer a verdade.', 'SaH'),
  R('Relembrar Fragmento', 'conhecimento', 3, 'Restaura um objeto ou texto danificado a partir de um pedaço.', 'SaH'),
  R('Pronunciar Sigilo', 'conhecimento', 4, 'Diz um sigilo proibido: esquecer, cegar ou "inexistir" por instantes.', 'SaH'),
  R('Overclock', 'energia', 1, 'Força um aparelho a revelar informações.', 'SaH'),
  R('Tremeluzir', 'energia', 2, 'Seu corpo vira luz e atravessa objetos.', 'SaH'),
  R('Mutar', 'energia', 3, 'Nenhum som sai de você: furtividade enorme.', 'SaH'),
  R('Milagre Ionizante', 'energia', 3, 'Cura condições e venenos do alvo, com um preço.', 'SaH'),
];

// ---------- Progressão de NEX (Sobrevivendo ao Horror, p. 99–102) ----------
// Vale quando o NEX é separado da experiência (regras NEX & Experiência, Patentes, Sobrevivente) e na trilha Monstruoso.
// ef: dados a mais/menos em perícias (+1 = +1D). Resumos curtos; os detalhes estão no livro.
export const EXPOSICOES = [
  { nome: 'Exposição moderada', nex: 1, resumo: 'Contato concreto: manusear algo paranormal, estar onde a Membrana está danificada.' },
  { nome: 'Exposição profunda', nex: 2, resumo: 'Contato direto com criaturas de até VD 300 ou manifestações parecidas.' },
  { nome: 'Exposição total', nex: 5, resumo: 'Membrana arruinada ou criaturas acima de VD 300.' },
];
export const ALTERACOES_GERAIS = [
  { nex: 25, nome: 'Arrepios e déjà vus', resumo: 'Pode usar Ocultismo sem ser treinado (se for treinado, +2). Mas sofre −5 em uma perícia à escolha: Diplomacia, Enganação ou Intimidação.', escolha: 'pen25', opcoes: ['diplomacia', 'enganacao', 'intimidacao'] },
  { nex: 35, nome: 'Escolhido pelo Outro Lado', resumo: 'Soma um atributo (menos Presença) no total de PE. Mas sofre −5 em uma perícia à escolha: Atletismo, Fortitude ou Reflexos.', escolha: 'pen35', opcoes: ['atletismo', 'fortitude', 'reflexos'], escolhaAtr: 'atr35' },
  { nex: 50, nome: 'Mais Outro Lado que Realidade', resumo: 'Na próxima vez que Transcender, ganha afinidade com Conhecimento, Energia, Morte ou Sangue, e passa a sofrer as alterações desse elemento.' },
];
export const ALTERACOES_ELEMENTO = {
  sangue: [
    { nex: 60, resumo: '+1 dado em Sobrevivência; imune a calor e frio extremos; não pode "escolher 10".', ef: { sobrevivencia: 1 } },
    { nex: 75, resumo: 'Pode conjurar Aprimorar Físico em si mesmo (−1 PE se já conhece). −1 dado em Ciências, Medicina e Tecnologia.', ef: { ciencias: -1, medicina: -1, tecnologia: -1 } },
    { nex: 90, resumo: 'A penalidade vira −2 dados. Pode conjurar Forma Monstruosa (−1 PE se já conhece).', ef: { ciencias: -1, medicina: -1, tecnologia: -1 } },
  ],
  morte: [
    { nex: 60, resumo: '+1 dado em Iniciativa e Reflexos; −1 dado em Diplomacia e Intuição.', ef: { iniciativa: 1, reflexos: 1, diplomacia: -1, intuicao: -1 } },
    { nex: 75, resumo: 'Ganha um ritual de Morte; a penalidade vira −2 dados e passa a valer também em Enganação e Intimidação.', ef: { diplomacia: -1, intuicao: -1, enganacao: -2, intimidacao: -2 } },
    { nex: 90, resumo: 'O tempo se distorce ainda mais (veja o Sobrevivendo ao Horror, p. 101).' },
  ],
  conhecimento: [
    { nex: 60, resumo: 'Vê auras paranormais o tempo todo (como Terceiro Olho; −1 PE se já conhece), mas a luz forte o deixa ofuscado.' },
    { nex: 75, resumo: 'Sente perigos o tempo todo (como Detecção de Ameaças; −1 PE se já conhece).' },
    { nex: 90, resumo: 'Na luz fica cego em vez de ofuscado. Pode conjurar Vidência.' },
  ],
  energia: [
    { nex: 60, resumo: 'Pode conjurar Coincidência Forçada. O mestre rola um efeito colateral caótico (tiques, convulsões, sorte…), que piora em 75% e 90%.' },
    { nex: 75, resumo: 'Os efeitos colaterais de Energia ficam mais fortes.' },
    { nex: 90, resumo: 'Os efeitos colaterais de Energia ficam no máximo.' },
  ],
};

// ---------- Poderes paranormais (Transcender; Livro de Regras p. 114–116; Sobrevivendo ao Horror p. 46–47) ----------
// req: { elemento: quantos poderes desse elemento já precisa ter } ou { nex }. afinidade: o que muda ao escolher de novo com afinidade.
// ef: efeitos automáticos (por: 'nivel' = vezes o nível/NEX). repete: pode escolher várias vezes.
const PP = (nome, elemento, resumo, afinidade, extra = {}) => ({ id: nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'), nome, elemento, resumo, afinidade, fonte: 'LR', req: {}, ...extra });
export const PODERES_PARANORMAIS = [
  PP('Aprender Ritual', 'variavel', 'Aprende um ritual de 1º círculo (2º a partir de NEX 45%, 3º a partir de 75%) e pode trocar um ritual conhecido. Conta como poder do elemento do ritual.', '', { repete: true, acao: 'aprender-ritual' }),
  PP('Resistir a Elemento', 'variavel', 'Resistência 10 contra Conhecimento, Energia, Morte ou Sangue (escolha). Conta como poder desse elemento.', 'A resistência sobe para 20.', { repete: true, escolheElemento: true }),
  PP('Expansão de Conhecimento', 'conhecimento', 'Aprende um poder de classe de outra classe (cumprindo os pré-requisitos).', 'Aprende um segundo poder de outra classe.', { req: { conhecimento: 1 } }),
  PP('Percepção Paranormal', 'conhecimento', 'Ao procurar pistas, pode rolar de novo um dado abaixo de 10 (fica com o novo).', 'Até dois dados.'),
  PP('Precognição', 'conhecimento', '+2 na Defesa e nos testes de resistência.', 'Fica imune a ser desprevenido.', { req: { conhecimento: 1 }, ef: { defesa: 2, resistencia: 2 } }),
  PP('Sensitivo', 'conhecimento', '+5 em Diplomacia, Intimidação e Intuição.', 'Em testes opostos com essas perícias, o oponente sofre −1 dado.', { ef: { pericia: { diplomacia: 5, intimidacao: 5, intuicao: 5 } } }),
  PP('Visão do Oculto', 'conhecimento', '+5 em Percepção e enxerga no escuro.', 'Ignora camuflagem.', { ef: { pericia: { percepcao: 5 } } }),
  PP('Afortunado', 'energia', 'Uma vez por rolagem, rola de novo um 1 em dados que não sejam d20.', 'Também uma vez por teste em um 1 no d20.'),
  PP('Campo Protetor', 'energia', 'Ao esquivar, 1 PE para +5 na Defesa.', 'Também +5 em Reflexos e, se passar num Reflexos que reduz à metade, não sofre dano.', { req: { energia: 1 } }),
  PP('Causalidade Fortuita', 'energia', 'Em investigações, a DT para procurar pistas cai 5 até achar uma pista.', 'A DT sempre cai 5.'),
  PP('Golpe de Sorte', 'energia', '+1 na margem de ameaça dos ataques.', '+1 no multiplicador de crítico.', { req: { energia: 1 }, ef: { margemTodas: 1 }, efAfinidade: { multTodas: 1 } }),
  PP('Manipular Entropia', 'energia', '2 PE: um ser em alcance curto rola de novo um dado de um teste de perícia.', 'Rola de novo todos os dados que você escolher.', { req: { energia: 1 } }),
  PP('Encarar a Morte', 'morte', 'Em cenas de ação, o limite de PE por turno aumenta em +1 (não muda DTs).', 'Aumenta em +3 no total.', { ef: { limiteAcao: 1 }, efAfinidade: { limiteAcao: 2 } }),
  PP('Escapar da Morte', 'morte', 'Uma vez por cena, um dano que o deixaria com 0 PV o deixa com 1 PV (não vale contra dano massivo).', 'Evita o dano todo; contra dano massivo fica com 1 PV.', { req: { morte: 1 } }),
  PP('Potencial Aprimorado', 'morte', '+1 PE por NEX (cresce quando o NEX sobe).', '+2 PE por NEX no total.', { ef: { pePorNivel: 1 }, efAfinidade: { pePorNivel: 1 } }),
  PP('Potencial Reaproveitado', 'morte', 'Uma vez por rodada, ao passar num teste de resistência, ganha 2 PE temporários (somem no fim da cena).', 'Ganha 3 PE temporários.'),
  PP('Surto Temporal', 'morte', 'Uma vez por cena, no seu turno, 3 PE para uma ação padrão extra.', 'Uma vez por turno.', { req: { morte: 2 } }),
  PP('Anatomia Insana', 'sangue', '50% de chance (par em 1d4) de ignorar o dano extra de crítico ou ataque furtivo.', 'Imune a críticos e ataques furtivos.', { req: { sangue: 2 } }),
  PP('Arma de Sangue', 'sangue', 'Movimento e 2 PE: cria uma arma de sangue (simples, corpo a corpo, leve, 1d6 de Sangue) até o fim da cena; 1 PE por ataque extra com ela ao agredir.', 'A arma vira parte de você e causa 1d10.'),
  PP('Sangue de Ferro', 'sangue', '+2 PV por NEX (cresce quando o NEX sobe).', '+5 em Fortitude e imune a venenos e doenças.', { ef: { pvPorNivel: 2 }, efAfinidade: { pericia: { fortitude: 5 } } }),
  PP('Sangue Fervente', 'sangue', 'Machucado: +1 em Agilidade ou Força (escolha a cada vez).', 'O bônus vira +2.', { req: { sangue: 2 } }),
  PP('Sangue Vivo', 'sangue', 'Na primeira vez que fica machucado na cena, ganha cura acelerada 2 (nunca passa da metade dos PV).', 'Cura acelerada 5.', { req: { sangue: 1 } }),
  // Sobrevivendo ao Horror
  PP('Espreitar da Besta', 'sangue', '+5 em Furtividade; pode usá-la no lugar de Atletismo ao caçar em perseguições; sem penalidade em ações discretas.', 'O bônus vira +10.', { fonte: 'SaH', ef: { pericia: { furtividade: 5 } }, efAfinidade: { pericia: { furtividade: 5 } } }),
  PP('Instintos Sanguinários', 'sangue', 'Visão no escuro e faro.', 'Não pode ser flanqueado nem fica desprevenido; +5 contra armadilhas.', { fonte: 'SaH' }),
  PP('Antecipar Vitalidade', 'morte', 'Num teste, acumula uma carga para ganhar +1 dado (máximo de cargas = Vigor). Cada carga faz o próximo "dormir" não recuperar PV.', '+2 cargas máximas, mas perde 2 por noite.', { fonte: 'SaH' }),
  PP('Aura de Pavor', 'morte', 'Movimento e 2 PE: uma pessoa ou animal em alcance médio fica apavorado (Vontade DT Pre reduz para abalado).', 'DT +5 e afeta quantos alvos quiser.', { fonte: 'SaH' }),
  PP('Absorver Conhecimento', 'conhecimento', 'Segurando um texto, ação completa e 1 PE para fazer uma pergunta a ele; melhora o dado da ação "ler".', 'Rituais de Conhecimento em 1 pessoa que você toca custam −1 PE.', { fonte: 'SaH' }),
  PP('Apatia Herege', 'conhecimento', 'Contra condições de medo, 2 PE para rolar de novo (fica com o novo).', 'Pode decidir depois de ver o resultado e fica com o melhor.', { fonte: 'SaH', req: { conhecimento: 1 } }),
  PP('Conexão Empática', 'energia', 'Ação completa e 2 PE: conversa com um aparelho elétrico ligado até o fim da cena.', '+5 em perícias de Int/Pre com o aparelho.', { fonte: 'SaH', req: { energia: 1 } }),
  PP('Valer-se do Caos', 'energia', 'Num teste, rola +1 dado (de outra cor). Se falhar ou esse dado der 5 ou menos, perde 1d4 de Sanidade.', 'Só perde Sanidade se falhar ou se o dado extra der 1 ou 2.', { fonte: 'SaH' }),
];
PODERES_PARANORMAIS.push(...PARANORMAIS_AS.map(p => PP(p.nome, p.elemento, p.resumo, p.afinidade, { fonte: p.fonte, req: p.req })));
export const PODER_PARANORMAL = Object.fromEntries(PODERES_PARANORMAIS.map(p => [p.id, p]));

// ---------- Habilidades USÁVEIS (botão "Usar") ----------
// Chave = nome da habilidade/poder/origem. custo: PE (ou PD); 'aliados' = 1 por aliado; 'pv' = paga com PV.
// dura: 'instante' (só gasta), 'rodada', 'cena' (vira efeito ativo até o jogador desligar ou "Fim da cena"), 'proxima' (vale na próxima rolagem).
// ef: bônus enquanto ativo — defesa, resistencia, rd, rdMental, desl, todasPericias, dadosTodas, pericia:{id:n}, dadosPericia:{id:n},
//     ataque, ataqueDados, dano, margemTodas, dtRitual. Valores 'int'/'pre'/'vig'/'agi'/'for' = o atributo.
// ganhaPeTemp: PE temporários ganhos. rolar: fórmula rolada ao usar. nivelMin: só a partir desse nível da trilha/NEX.
export const USAVEIS = {
  'Determinação Inquestionável': { custo: 5, dura: 'instante' },
  'Achado Conveniente': { custo: 5, dura: 'instante' },
  // Combatente (trilhas)
  'Inspirar Confiança': { custo: 2, dura: 'instante', nota: 'reação: um aliado rola de novo' },
  'Estrategista': { custo: 'aliados', dura: 'instante', nota: 'aliados ganham ação de movimento' },
  'Brecha na Guarda': { custo: 2, dura: 'instante' },
  'Oficial Comandante': { custo: 5, dura: 'instante' },
  'Revidar': { custo: 2, dura: 'instante' },
  'Força Opressora': { custo: 1, dura: 'instante' },
  'Ataque Extra': { custo: 2, dura: 'instante' },
  'Surto de Adrenalina': { custo: 5, dura: 'instante' },
  'Cai Dentro': { custo: 1, dura: 'instante' },
  'Técnica Secreta': { custo: 2, dura: 'instante', nota: '+2 PE por efeito extra' },
  // Especialista (trilhas)
  'Disparo Letal': { custo: 1, dura: 'proxima', ef: { margemTodas: 2 }, nota: 'próximo ataque: +2 na margem' },
  'Disparo Impactante': { custo: 2, dura: 'instante' },
  'Assassinar': { custo: 3, dura: 'instante' },
  'Sombra Fugaz': { custo: 3, dura: 'instante' },
  'Paramédico': { custo: 2, dura: 'instante' },
  'Equipe de Trauma': { custo: 2, dura: 'instante' },
  'Reanimação': { custo: 10, dura: 'instante' },
  'Eloquência': { custo: 'aliados', dura: 'instante', nota: '1 PE por alvo' },
  'Discurso Motivador': { custo: 4, dura: 'cena', ef: { dadosTodas: 1 }, nota: 'você e aliados: +1 dado em perícias' },
  'Remendão': { custo: 1, dura: 'instante' },
  // Ocultista (trilhas)
  'Anular Ritual': { custo: 'var', dura: 'instante', nota: 'PE igual ao custo do ritual inimigo' },
  'Abraçar a Dor': { custo: 2, dura: 'instante', nota: 'reduz um dano não paranormal à metade' },
  'Conjuração Marcial': { custo: 2, dura: 'instante' },
  // Poderes de classe
  'Ataque de Oportunidade': { custo: 1, dura: 'instante' },
  'Golpe Demolidor': { custo: 1, dura: 'instante' },
  'Incansável': { custo: 2, dura: 'instante' },
  'Presteza Atlética': { custo: 1, dura: 'instante' },
  'Sentido Tático': { custo: 2, dura: 'cena', ef: { defesa: 'int', resistencia: 'int' } },
  'Combate Defensivo': { custo: 0, dura: 'rodada', ef: { defesa: 5, ataqueDados: -1 } },
  'Tiro de Cobertura': { custo: 1, dura: 'instante' },
  'Mãos Rápidas': { custo: 1, dura: 'instante' },
  'Movimento Tático': { custo: 1, dura: 'rodada' },
  'Na Trilha Certa': { custo: 1, dura: 'proxima', ef: { dadosPericia: { investigacao: 1, percepcao: 1 } }, nota: 'próximo teste de procurar pistas: +1 dado' },
  'Nerd': { custo: 2, dura: 'instante' },
  'Pensamento Ágil': { custo: 2, dura: 'instante' },
  'Guiado pelo Paranormal': { custo: 2, dura: 'instante' },
  'Paranoia Defensiva': { custo: 3, dura: 'cena', escolhePericia: 5, podeDefesa: true, nota: '+5 na Defesa contra o próximo ataque OU +5 em um teste de perícia' },
  'Valentão': { custo: 1, dura: 'instante' },
  'Sacrificar os Joelhos': { custo: 2, dura: 'instante' },
  'Disfarce Sutil': { custo: 1, dura: 'instante' },
  'Remoer Memórias': { custo: 2, dura: 'instante' },
  'Resistir à Pressão': { custo: 5, dura: 'cena', ef: { todasPericias: 2 }, nota: 'rodada extra de investigação com +2' },
  'Deixe os Sussurros Guiarem': { custo: 2, dura: 'cena', ef: { pericia: { investigacao: 2, percepcao: 2, intuicao: 2, ocultismo: 2 } }, nota: 'cada falha custa 1 de Sanidade' },
  'Estalos Macabros': { custo: 1, dura: 'instante' },
  'Nos Olhos do Monstro': { custo: 3, dura: 'cena', ef: { todasPericias: 5 }, nota: 'só contra a criatura encarada (não vale em ataques)' },
  'Sentido Premonitório': { custo: 3, dura: 'cena', nota: '+1 PE no início de cada rodada para manter' },
  'Sincronia Paranormal': { custo: 2, dura: 'cena', nota: '1 PE por rodada para manter' },
  'Traçado Conjuratório': { custo: 1, dura: 'cena', ef: { pericia: { ocultismo: 2 }, resistencia: 2, dtRitual: 2 }, nota: 'enquanto estiver dentro do símbolo' },
  'Palavras de Devoção': { custo: 3, dura: 'cena', ef: { rdMental: 5 }, nota: 'você e quem rezou junto' },
  'Teimosia Obstinada': { custo: 2, dura: 'proxima', ef: { pericia: { vontade: 5 } }, nota: 'contra efeito mental' },
  'Resposta Rápida': { custo: 2, dura: 'instante' },
  // SaH trilhas
  'O Sorriso': { custo: 2, dura: 'instante', nota: 'repete Diplomacia/Enganação' },
  'Método Investigativo': { custo: 2, dura: 'instante' },
  'Conhecimento Prático': { custo: 2, dura: 'instante' },
  'Poder da Fé': { custo: 2, dura: 'instante', nota: 'repete uma resistência com Religião' },
  'Pancada Forte': { custo: 1, dura: 'instante' },
  'Esotérico': { custo: 1, dura: 'instante' },
  // Origens
  'Posição de Combate': { custo: 2, dura: 'instante', nota: 'ação de movimento extra na 1ª rodada' },
  'Espírito Cívico': { custo: 1, dura: 'instante', nota: '+2 no bônus de ajuda' },
  'Motor de Busca': { custo: 2, dura: 'instante' },
  'Impostor': { custo: 2, dura: 'instante' },
  'Conexões': { custo: 2, dura: 'instante' },
  'A Culpa é das Estrelas': { custo: 1, dura: 'instante', rolarSorte: true },
  'Poder da Amizade': { custo: 0, dura: 'cena', ef: { todasPericias: 2 }, nota: 'perto do melhor amigo' },
  'Não é Fantasia, é Cosplay!': { custo: 0, dura: 'cena', ef: { todasPericias: 2 }, nota: 'testes ligados ao cosplay' },
  'Conhecimento Oculto': { custo: 0, dura: 'cena', ef: { todasPericias: 2 }, nota: 'contra a criatura identificada (vale a missão toda)' },
  'Luta ou Fuga': { custo: 0, dura: 'cena', ganhaPeTemp: 2, nota: 'quando surge um sinal da premonição' },
  'Acalentar': { custo: 0, dura: 'proxima', ef: { pericia: { religiao: 5 } }, nota: 'para acalmar' },
  // Poderes paranormais
  'Campo Protetor': { custo: 1, dura: 'rodada', ef: { defesa: 5 } },
  'Manipular Entropia': { custo: 2, dura: 'instante' },
  'Surto Temporal': { custo: 3, dura: 'instante' },
  'Arma de Sangue': { custo: 2, dura: 'cena', arma: true },
  'Potencial Reaproveitado': { custo: 0, dura: 'instante', ganhaPeTemp: 2, nota: 'passou numa resistência' },
  'Aura de Pavor': { custo: 2, dura: 'instante' },
  'Absorver Conhecimento': { custo: 1, dura: 'instante' },
  'Apatia Herege': { custo: 2, dura: 'instante' },
  'Conexão Empática': { custo: 2, dura: 'cena' },
  'Escapar da Morte': { custo: 0, dura: 'instante', nota: 'uma vez por cena' },
};
// Trocar a perícia de um teste (aparece na janela "Gastar PE" ao rolar). de: perícias de origem (vazio = qualquer). para: perícia usada.
export const TROCAS_PERICIA = [
  { fonte: 'origem:ti', nome: 'Motor de Busca', custo: 2, para: 'tecnologia', nota: 'com internet' },
  { fonte: 'origem:trambiqueiro', nome: 'Impostor', custo: 2, para: 'enganacao', nota: 'uma vez por cena' },
  { fonte: 'origem:psicologo', nome: 'Terapia', custo: 0, de: ['diplomacia'], para: 'profissao' },
  { fonte: 'origem:reporter', nome: 'Encontrar a Verdade', custo: 0, de: ['diplomacia'], para: 'investigacao', nota: 'persuadir' },
  { fonte: 'origem:cosplayer', nome: 'Disfarce com Artes', custo: 0, de: ['enganacao'], para: 'artes', nota: 'disfarce' },
  { fonte: 'origem:diplomata', nome: 'Conexões', custo: 2, para: 'diplomacia', nota: 'contato que entende do assunto' },
];

// Dados de regra de cada ritual (execução, alcance, alvo/área, duração, resistência, dados e custo das formas avançadas).
// Só números e termos de regra; o texto de efeito fica no livro (ou em dados/textos.json, se você tiver permissão).
export const RITUAL_DADOS = {"Alterar Destino":{"execucao":"reação","alcance":"pessoal","alvo":"você","duracao":"instantânea","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Alterar Memória":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"instantânea","resistencia":"Vontade anula","dados":"1d4","tipoDados":"cura","verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Amaldiçoar Arma":{"execucao":"padrão","alcance":"toque","alvo":"1 arma corpo a corpo ou pacote de munição","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"dados":"1d6","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Amaldiçoar Tecnologia":{"execucao":"padrão","alcance":"toque","alvo":"1 acessório ou arma de fogo","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Âncora Temporal":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"cena","resistencia":"Vontade parcial","verdadeiro":{"custo":4,"circulo":4,"afinidade":false}},"Aprimorar Físico":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"cena","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Aprimorar Mente":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"cena","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Arma Atroz":{"execucao":"padrão","alcance":"toque","alvo":"1 arma corpo a corpo","duracao":"sustentada","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Armadura de Sangue":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":5,"circulo":3,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Canalizar o Medo":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"permanen te até ser descarregada"},"Capturar o Coração":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"cena","resistencia":"Vontade parcial"},"Chamas do Caos":{"execucao":"padrão","alcance":"curto","alvo":"veja texto","duracao":"cena","dados":"1d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"resistencia":"Reflexos reduz à metade"},"Cicatrização":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","discente":{"custo":2,"circulo":2,"afinidade":false},"dados":"3d8+3","tipoDados":"cura","verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Cinerária":{"execucao":"padrão","alcance":"curto","area":"nuvem de 6m de raio","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Coincidência Forçada":{"execucao":"padrão","alcance":"curto","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Compreensão Paranormal":{"execucao":"padrão","alcance":"toque","alvo":"1 ser ou objeto","duracao":"cena","resistencia":"Vontade anula","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Conhecendo o Medo":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"instantânea","resistencia":"Vontade parcial","dados":"10d6","tipoDados":"dano"},"Consumir Manancial":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"instantânea","dados":"3d6","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Contato Paranormal":{"execucao":"completa","alcance":"pessoal","alvo":"você","duracao":"1 dia","discente":{"custo":4,"circulo":4,"afinidade":false},"verdadeiro":{"custo":9,"circulo":4,"afinidade":false}},"Contenção Fantasmagórica":{"execucao":"padrão","alcance":"médio","alvo":"1 ser","duracao":"cena","resistencia":"Reflexos anula","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Controle Mental":{"execucao":"padrão","alcance":"médio","alvo":"1 pessoa ou animal","resistencia":"Vonta de parcial","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false},"duracao":"sustentada"},"Convocação Instantânea":{"execucao":"padrão","alcance":"ilimita do","alvo":"1 objeto de até 2 espaços","resistencia":"Vontade anula","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false},"duracao":"instantânea"},"Convocar o Algoz":{"execucao":"padrão","alcance":"1,5m","alvo":"1 pessoa","duracao":"sustentada","resistencia":"Vonta de parcial,","dados":"6d6","tipoDados":"dano"},"Corpo Adaptado":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa ou animal","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Decadência":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Fortitude reduz à metade","dados":"2d8+2","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Definhar":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false},"resistencia":"Fortitude parcial"},"Deflagração de Energia":{"execucao":"completa","alcance":"pes soal","area":"explosão de 15m de raio","resistencia":"Fortitude parcial","dados":"3d10","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Desacelerar Impacto":{"execucao":"reação","alcance":"curto","duracao":"até chegar ao solo ou cena, o que vier primeiro","verdadeiro":{"custo":3,"circulo":null,"afinidade":false}},"Descarnar":{"execucao":"padrão","alcance":"toque","duracao":"instantânea","resistencia":"Fortitude parcial","discente":{"custo":3,"circulo":3,"afinidade":false},"dados":"6d8","tipoDados":"dano","verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Detecção de Ameaças":{"execucao":"padrão","alcance":"pessoal","area":"esfera de 18m de raio","duracao":"cena","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Dissipar Ritual":{"execucao":"padrão","alcance":"médio","duracao":"instantânea","alvo":"1 ser ou objeto, ou esfera com 3m de raio"},"Dissonância Acústica":{"execucao":"padrão","alcance":"médio","area":"esfera com 6m de raio","discente":{"custo":1,"circulo":null,"afinidade":false},"verdadeiro":{"custo":3,"circulo":null,"afinidade":false},"duracao":"sustentada"},"Distorção Temporal":{"execucao":"padrão","alcance":"pessoal","alvo":"veja texto","duracao":"veja texto"},"Distorcer Aparência":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"resistencia":"Vontade desacredita"},"Eco Espiral":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"2 rodadas","resistencia":"Fortitude reduz à metade","discente":{"custo":3,"circulo":4,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":false}},"Eletrocussão":{"execucao":"padrão","alcance":"curto","alvo":"1 ser ou objeto","duracao":"instantânea","resistencia":"Fortitude parcial","discente":{"custo":2,"circulo":2,"afinidade":false},"dados":"3d6","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Embaralhar":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Enfeitiçar":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"cena","resistencia":"Vontade anula","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Esconder dos Olhos":{"execucao":"livre","alcance":"pessoal","alvo":"você","duracao":"1 rodada","verdadeiro":{"custo":7,"circulo":4,"afinidade":false},"discente":{"custo":3,"circulo":null,"afinidade":false}},"Espirais da Perdição":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":8,"circulo":null,"afinidade":false}},"Ferver Sangue":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"sustentada","resistencia":"Fortitude parcial","dados":"4d8","tipoDados":"dano","verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Fim Inevitável":{"execucao":"completa","alcance":"extremo","efeitoArea":"buraco negro com 1,5m de diâmetro","duracao":"4 ro dadas","resistencia":"Fortitude parcial","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false}},"Flagelo de Sangue":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"cena","resistencia":"Fortitude parcial","discente":{"custo":3,"circulo":3,"afinidade":false},"dados":"10d6","tipoDados":"dano","verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Forma Monstruosa":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Fortalecimento Sensorial":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Hemofagia":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Fortitude reduz à metade","dados":"6d6","tipoDados":"cura","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Inexistir":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Vontade parcial","dados":"10d12+10","tipoDados":"dano","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false}},"Invadir Mente":{"execucao":"padrão","alcance":"médio ou toque","alvo":"1 ser ou 2 pessoas voluntárias","resistencia":"Vontade parcial ou nenhuma","discente":{"custo":3,"circulo":3,"afinidade":false},"dados":"6d6","tipoDados":"dano","verdadeiro":{"custo":7,"circulo":null,"afinidade":false},"duracao":"instantânea ou 1 dia"},"Invólucro de Carne":{"execucao":"padrão","alcance":"curto","efeitoArea":"1 clone seu","duracao":"cena"},"Lâmina do Medo":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Fortitude parcial","dados":"10d8","tipoDados":"dano"},"Localização":{"execucao":"padrão","alcance":"pessoal","area":"círculo com 90m de raio","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false},"duracao":"cena"},"Luz":{"execucao":"padrão","alcance":"curto","alvo":"1 objeto","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"resistencia":"Vontade anula (veja texto)"},"Medo Tangível":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena"},"Mergulho Mental":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","resistencia":"Vontade parcial","verdadeiro":{"custo":4,"circulo":null,"afinidade":false},"duracao":"sustentada"},"Miasma Entrópico":{"execucao":"padrão","alcance":"médio","area":"nuvem com 6m de raio","resistencia":"Fortit ude parcial","dados":"4d8","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false},"duracao":"instantânea"},"Nuvem de Cinzas":{"execucao":"padrão","alcance":"curto","efeitoArea":"nuvem com 6m de raio e 6m de altura","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Ódio Incontrolável":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"cena","discente":{"custo":2,"circulo":3,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Ouvir os Sussurros":{"execucao":"completa","alcance":"pessoal","alvo":"você","duracao":"instantânea","dados":"1d6","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Paradoxo":{"execucao":"padrão","alcance":"médio","area":"esfera com 6m de raio","resistencia":"Fortitude reduz à metade","dados":"6d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false},"duracao":"instantânea"},"Perturbação":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"1 rodada","resistencia":"Vontade anula","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Poeira da Podridão":{"execucao":"padrão","alcance":"médio","area":"nuvem com 6m de raio","resistencia":"Fortitude (veja texto)","dados":"4d8","tipoDados":"dano","duracao":"sustentada","verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Polarização Caótica":{"execucao":"padrão","alcance":"curto","alvo":"você","duracao":"sustentada","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"resistencia":"Vontade anula"},"Possessão":{"execucao":"padrão","alcance":"longo","alvo":"1 pessoa viva ou morta","duracao":"1 dia","resistencia":"Vontade anula"},"Presença do Medo":{"execucao":"padrão","alcance":"pessoal","area":"emanação de 9m de raio","dados":"5d8","tipoDados":"dano","duracao":"sustentada"},"Proteção contra Rituais":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"cena","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":6,"circulo":4,"afinidade":false}},"Purgatório":{"execucao":"padrão","alcance":"curto","alvo":"área de 6m de raio","duracao":"sustentada","resistencia":"Fortitude parcial","dados":"6d6","tipoDados":"dano"},"Rejeitar Névoa":{"execucao":"padrão","alcance":"curto","area":"nuvem de 6m de raio","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false}},"Salto Fantasma":{"execucao":"padrão","alcance":"médio","alvo":"você","duracao":"instantânea","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Sopro do Caos":{"execucao":"padrão","alcance":"médio","area":"varia","resistencia":"veja texto","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false},"duracao":"sustentada"},"Tecer Ilusão":{"execucao":"padrão","alcance":"médio","efeitoArea":"ilusão que se estende a até 4 cubos de 1,5m","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"resistencia":"Vontade desacredita"},"Tela de Ruído":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Teletransporte":{"execucao":"padrão","alcance":"toque","alvo":"até 5 seres voluntários","dados":"1d10","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"duracao":"instantânea"},"Tentáculos de Lodo":{"execucao":"padrão","alcance":"médio","area":"círculo com 6m de raio","dados":"4d6","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"duracao":"cena"},"Terceiro Olho":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Transfigurar Água":{"execucao":"padrão","alcance":"longo","area":"esfera com 30m de raio","resistencia":"veja texto","dados":"5d8","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"duracao":"cena"},"Transfigurar Terra":{"execucao":"padrão","alcance":"longo","area":"9 cubos com 1,5m de lado","duracao":"instantânea","resistencia":"veja texto","dados":"10d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Transfusão Vital":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Velocidade Mortal":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"sustentada","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Vidência":{"execucao":"completa","alcance":"ilimitado","alvo":"1 ser","duracao":"5 rodadas","resistencia":"Vontade anula"},"Vínculo de Sangue":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","resistencia":"Fortitude anula","duracao":"cena"},"Vomitar Pestes":{"execucao":"padrão","alcance":"médio","efeitoArea":"1 enxame Grande","duracao":"sustentada","dados":"5d12","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false},"resistencia":"Reflexos reduz à metade"},"Zerar Entropia":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"cena","resistencia":"Vontade parcial","discente":{"custo":4,"circulo":4,"afinidade":false},"verdadeiro":{"custo":11,"circulo":4,"afinidade":false}},"Esfolar":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"instantânea","resistencia":"Reflexos parcial","dados":"3d4+3","tipoDados":"dano","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Sede de Adrenalina":{"execucao":"reação","alcance":"pessoal","alvo":"você","duracao":"instantânea","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":true}},"Odor da Caçada":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Martírio de Sangue":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"veja texto","discente":{"custo":5,"circulo":null,"afinidade":true}},"Apagar as Luzes":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"instantânea","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Língua Morta":{"execucao":"padrão","alcance":"toque","alvo":"1 cadáver","duracao":"sustentada","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":true}},"Fedor Pútrido":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"sustentada","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Singularidade Temporal":{"execucao":"padrão","alcance":"curto","alvo":"1 objeto não paranormal Médio","duracao":"instantânea","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false},"resistencia":"veja texto"},"Desfazer Sinapses":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"instantânea","resistencia":"Vontade parcial","dados":"2d6+2","tipoDados":"dano","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Aurora da Verdade":{"execucao":"padrão","alcance":"curto","duracao":"sustentada","resistencia":"Vontade parcial","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":true},"area":"esfera com 3m de raio"},"Relembrar Fragmento":{"execucao":"padrão","alcance":"toque","alvo":"1 objeto","duracao":"instantânea","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Pronunciar Sigilo":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"instantânea","resistencia":"Vontade parcial","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":true}},"Overclock":{"execucao":"reação","alcance":"pessoal","alvo":"você","duracao":"instantânea","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Tremeluzir":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"sustentada","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":false}},"Mutar":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Milagre Ionizante":{"execucao":"completa","alcance":"toque","alvo":"1 ser","duracao":"instantânea"},"Mapa Sanguíneo":{"execucao":"padrão","alcance":"toque","alvo":"1 superfície","duracao":"cena","resistencia":"Vontade evita","discente":{"custo":3,"circulo":2,"afinidade":false}},"Labirinto Mental":{"execucao":"padrão","alcance":"médio","alvo":"1 pessoa","duracao":"1d4 rodadas","resistencia":"Vontade evita","discente":{"custo":3,"circulo":2,"afinidade":false},"verdadeiro":{"custo":7,"circulo":3,"afinidade":false}},"Capturar Momento":{"execucao":"padrão","alcance":"médio","area":"esfera de 18m de raio","duracao":"cena","discente":{"custo":3,"circulo":2,"afinidade":false},"verdadeiro":{"custo":7,"circulo":3,"afinidade":false}},"Backup":{"execucao":"padrão","alcance":"curto","alvo":"veja texto","duracao":"24 horas","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Hesitação Forçada":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"sustentada","resistencia":"Vontade parcial","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":true}},"Rajada Caótica":{"execucao":"padrão","alcance":"médio","alvo":"1 ser","duracao":"instantânea","resistencia":"Reflexos reduz o dano à metade","dados":"8d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":3,"afinidade":false}},"Vampirismo":{"execucao":"completa","alcance":"toque","alvo":"1 pessoa","duracao":"cena","discente":{"custo":5,"circulo":3,"afinidade":false},"verdadeiro":{"custo":10,"circulo":4,"afinidade":true}}};
for (const r of RITUAIS) Object.assign(r, RITUAL_DADOS[r.nome] || {});

// ---------- Modificações (Livro de Regras, Tabelas de modificações) — cada uma aumenta a categoria do item em +1 ----------
// para: 'corpo' (armas corpo a corpo e de disparo), 'fogo' (armas de fogo), 'municao', 'protecao'. ef: efeito automático.
export const MODIFICACOES = [
  { id: 'certeira', nome: 'Certeira', para: ['corpo', 'disparo', 'arremesso'], resumo: '+2 nos testes de ataque.', ef: { ataque: 2 } },
  { id: 'cruel', nome: 'Cruel', para: ['corpo', 'disparo', 'arremesso'], resumo: '+2 no dano.', ef: { dano: 2 } },
  { id: 'discreta', nome: 'Discreta', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: '+5 para esconder a arma e ocupa 1 espaço a menos.', ef: { espacos: -1 } },
  { id: 'perigosa', nome: 'Perigosa', para: ['corpo', 'disparo', 'arremesso'], resumo: '+2 na margem de ameaça.', ef: { margem: 2 } },
  { id: 'tatica', nome: 'Tática', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Pode sacar como ação livre.' },
  { id: 'alongada', nome: 'Alongada', para: ['fogo'], resumo: '+2 nos testes de ataque.', ef: { ataque: 2 } },
  { id: 'calibre-grosso', nome: 'Calibre Grosso', para: ['fogo'], resumo: '+1 dado de dano do mesmo tipo.', ef: { dados: 1 } },
  { id: 'compensador', nome: 'Compensador', para: ['fogo'], resumo: 'Só em armas automáticas: anula a penalidade de rajadas.' },
  { id: 'ferrolho', nome: 'Ferrolho Automático', para: ['fogo'], resumo: 'A arma vira automática.' },
  { id: 'mira-laser', nome: 'Mira Laser', para: ['fogo'], resumo: '+2 na margem de ameaça.', ef: { margem: 2 } },
  { id: 'mira-telescopica', nome: 'Mira Telescópica', para: ['fogo'], resumo: 'Aumenta o alcance da arma e do Ataque Furtivo.' },
  { id: 'silenciador', nome: 'Silenciador', para: ['fogo'], resumo: 'Menos penalidade em Furtividade para se esconder depois de atirar.' },
  { id: 'visao-calor', nome: 'Visão de Calor', para: ['fogo'], resumo: 'Ignora camuflagem.' },
  { id: 'dum-dum', nome: 'Munição Dum Dum', para: ['fogo'], resumo: '+1 no multiplicador de crítico.', ef: { mult: 1 } },
  { id: 'explosiva', nome: 'Munição Explosiva', para: ['fogo'], resumo: '+2d6 de dano.', ef: { danoDados: '2d6' } },
  { id: 'antibombas', nome: 'Antibombas', para: ['pesada'], resumo: 'Só proteção pesada: protege contra explosões e efeitos de área.' },
  { id: 'blindada', nome: 'Blindada', para: ['pesada'], resumo: 'Só proteção pesada: RD sobe para 5 e ocupa +1 espaço.', ef: { rdPara: 5, espacos: 1 } },
  { id: 'discreta-p', nome: 'Discreta', para: ['leve'], resumo: 'Só proteção leve: +5 para esconder e ocupa 1 espaço a menos.', ef: { espacos: -1 } },
  { id: 'reforcada', nome: 'Reforçada', para: ['leve', 'pesada', 'escudo'], resumo: '+2 na Defesa e ocupa +1 espaço.', ef: { defesa: 2, espacos: 1 } },
  // Sobrevivendo ao Horror p. 39 (só com a regra opcional de contagem de munição)
  { id: 'rapido', nome: 'Carregador Rápido', para: ['fogo', 'disparo'], fonte: 'SaH', resumo: 'Com contagem de munição: recarrega a arma de fogo como ação livre uma vez por rodada; em bestas e balestras, até cinco recargas como ação livre com uma mão.' },
  // Maldições do Livro de Regras (p. 145–147): cada uma conta como modificação (+1 categoria). Preço: perde 2 SAN ao falhar em testes do atributo do elemento.
  { id: 'mal-antielemento', maldicao: 'conhecimento', nome: 'Antielemento', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Contra criaturas de um elemento (role 1d4 ou escolha): 2 PE ao atacar; se acertar, +4d8 de dano.' },
  { id: 'mal-ritualistica', maldicao: 'conhecimento', nome: 'Ritualística', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Guarda um ritual (pago ao armazenar) e o descarrega como ação livre ao acertar, centrado no ser atingido.' },
  { id: 'mal-senciente', maldicao: 'conhecimento', nome: 'Senciente', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Movimento e 2 PE: a arma flutua e ataca sozinha uma vez por rodada em alcance curto; 1 PE por turno para manter.' },
  { id: 'mal-empuxo', maldicao: 'energia', nome: 'Empuxo', para: ['corpo'], resumo: 'Só corpo a corpo: pode ser arremessada (alcance curto), +1 dado de dano ao arremessar e volta para sua mão.' },
  { id: 'mal-energetica', maldicao: 'energia', nome: 'Energética', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: '2 PE por ataque: +5 no ataque, ignora RD e todo o dano vira Energia.' },
  { id: 'mal-vibrante', maldicao: 'energia', nome: 'Vibrante', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Recebe Ataque Extra (operações especiais); se já tiver, ele custa –1 PE.' },
  { id: 'mal-consumidora', maldicao: 'morte', nome: 'Consumidora', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Alvos atingidos ficam lentos até o fim da cena; 2 PE ao atacar: se acertar, o alvo fica imóvel por 1 rodada.' },
  { id: 'mal-erosiva', maldicao: 'morte', nome: 'Erosiva', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: '+1d8 de dano de Morte; 2 PE ao atacar: se acertar, 2d4 de Morte no início dos turnos do alvo por 2 rodadas.', ef: { danoDados: '1d8' } },
  { id: 'mal-repulsora', maldicao: 'morte', nome: 'Repulsora', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: '+2 na Defesa enquanto empunhada; ao bloquear, 2 PE para +5 na Defesa.' },
  { id: 'mal-lancinante', maldicao: 'sangue', nome: 'Lancinante', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: '+1d8 de dano de Sangue, multiplicado no crítico (o site soma o +1d8; no crítico, multiplique também este dado).', ef: { danoDados: '1d8', criticoDados: true } },
  { id: 'mal-predadora', maldicao: 'sangue', nome: 'Predadora', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Ignora camuflagem e cobertura leves; à distância, +1 categoria de alcance; a margem de ameaça dobra (antes de outros aumentos).', ef: { margemDobro: true } },
  { id: 'mal-sanguinaria', maldicao: 'sangue', nome: 'Sanguinária', para: ['corpo', 'disparo', 'arremesso', 'fogo'], resumo: 'Quem é atingido fica sangrando (cumulativo); no crítico, o alvo fica fraco e você ganha 2d10 PV temporários.' },
  { id: 'mal-abascanta', maldicao: 'conhecimento', nome: 'Abascanta', para: ['leve', 'pesada', 'escudo'], resumo: '+5 em resistências contra rituais; uma vez por cena, reação e PE igual ao custo para refletir um ritual no conjurador.' },
  { id: 'mal-profetica', maldicao: 'conhecimento', nome: 'Profética', para: ['leve', 'pesada', 'escudo'], resumo: 'Resistência a Conhecimento 10; 2 PE para rolar de novo um teste de resistência.' },
  { id: 'mal-sombria', maldicao: 'conhecimento', nome: 'Sombria', para: ['leve', 'pesada', 'escudo'], resumo: '+5 em Furtividade e ignora a penalidade de carga nela; movimento e 1 PE para parecer roupa comum.' },
  { id: 'mal-cinetica', maldicao: 'energia', nome: 'Cinética', para: ['leve', 'pesada', 'escudo'], resumo: '+2 na Defesa e RD 2 (leve ou escudo) ou 5 (pesada). O site soma a Defesa; anote a RD.', ef: { defesa: 2 }, rdCinetica: true },
  { id: 'mal-lepida', maldicao: 'energia', nome: 'Lépida', para: ['leve', 'pesada', 'escudo'], resumo: '+10 em Atletismo e +3m de deslocamento; 2 PE: ignora terreno difícil, escala e cai até 9m sem dano até o fim do turno.' },
  { id: 'mal-voltaica', maldicao: 'energia', nome: 'Voltaica', para: ['leve', 'pesada', 'escudo'], resumo: 'Resistência a Energia 10; movimento e 2 PE: até o fim da cena, 2d6 de Energia nos seres adjacentes no fim dos seus turnos.' },
  { id: 'mal-letargica', maldicao: 'morte', nome: 'Letárgica', para: ['leve', 'pesada', 'escudo'], resumo: '+2 na Defesa; 25% (leve/escudo) ou 50% (pesada) de ignorar o dano extra de críticos e ataques furtivos.', ef: { defesa: 2 } },
  { id: 'mal-repulsiva', maldicao: 'morte', nome: 'Repulsiva', para: ['leve', 'pesada', 'escudo'], resumo: 'Resistência a Morte 10; movimento e 2 PE: quem o ataca corpo a corpo sofre 2d8 de Morte até o fim da cena.' },
  { id: 'mal-regenerativa', maldicao: 'sangue', nome: 'Regenerativa', para: ['leve', 'pesada', 'escudo'], resumo: 'Resistência a Sangue 10; movimento e 1 PE para recuperar 1d12 PV.' },
  { id: 'mal-sadica', maldicao: 'sangue', nome: 'Sádica', para: ['leve', 'pesada', 'escudo'], resumo: 'No início do turno, +1 em ataque e dano para cada 10 de dano sofrido desde o seu último turno.' },
];
export const MODIFICACAO = Object.fromEntries(MODIFICACOES.map(m => [m.id, m]));
// Maldição de arma (ritual Amaldiçoar Arma ou item amaldiçoado): dano extra do elemento escolhido
export const MALDICOES_ARMA = [
  { id: '', nome: 'Sem maldição' },
  { id: 'basica', nome: 'Amaldiçoar Arma (básico)', dados: '1d6', resumo: '+1d6 de dano do elemento.' },
  { id: 'discente', nome: 'Amaldiçoar Arma (discente)', dados: '2d6', resumo: '+2d6 de dano do elemento.' },
  { id: 'verdadeiro', nome: 'Amaldiçoar Arma (verdadeiro)', dados: '', resumo: 'Escreva o dano extra conforme o livro.' },
  { id: 'propria', nome: 'Maldição própria (item amaldiçoado)', dados: '', resumo: 'Escreva o efeito e o dano extra, se houver.' },
];
// Requisito de círculo não lido do livro: padrão seguro (discente 2º, verdadeira 3º). Corrija em RITUAL_DADOS se o livro disser outro.
for (const r of RITUAIS) {
  if (r.discente && !r.discente.circulo) r.discente.circulo = Math.max(2, r.circulo + 1 > 4 ? 4 : 2);
  if (r.verdadeiro && !r.verdadeiro.circulo) r.verdadeiro.circulo = Math.min(4, Math.max(3, r.circulo + 1));
}

// Livro de Regras v1.3, p. 126: a forma verdadeira exige 4º círculo e afinidade.
Object.assign(RITUAIS.find(r => r.id === 'cicatrizacao').verdadeiro, { circulo: 4, afinidade: true });

// ═══════════ biblioteca ═══════════
export const LIVROS_DIGITALIZADOS = [
  { id: 'base', titulo: 'Livro de Regras v1.3', paginas: 332 },
  { id: 'as01', titulo: 'Arquivos Secretos #01', paginas: 74 },
  { id: 'as02', titulo: 'Arquivos Secretos #02', paginas: 108 },
  { id: 'as03', titulo: 'Arquivos Secretos #03', paginas: 142 },
  { id: 'as04', titulo: 'Arquivos Secretos #04', paginas: 79 },
  { id: 'as05', titulo: 'Arquivos Secretos #05', paginas: 72 },
  { id: 'as06', titulo: 'Arquivos Secretos #06', paginas: 84 },
  { id: 'as07', titulo: 'Arquivos Secretos #07', paginas: 93 },
  { id: 'as09', titulo: 'Arquivos Secretos #09', paginas: 66 },
  { id: 'sah', titulo: 'Sobrevivendo ao Horror · OCR', paginas: 226 },
];
