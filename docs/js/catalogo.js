// catalogo.js — as regras do sistema escritas como DADOS.
// Tudo aqui são números e nomes das regras + resumos curtos, escritos com outras palavras.
// O texto oficial está nos livros (Livro de Regras = "LR"; Sobrevivendo ao Horror = "SaH").
// Para mudar uma regra, mude aqui: as telas e o motor (regras.js) leem deste arquivo.

export const NOME_DO_SITE = 'Ficha Oculta RPG';

// ---------- Modos de regra (escolhidos ANTES de criar a ficha) ----------
export const MODOS = {
  padrao: { nome: 'Regras Padrão', livro: 'Livro de Regras', resumo: 'Agentes da Ordem desde o início: NEX 5%, as três classes, PV, PE e Sanidade.' },
  sah: { nome: 'Sobrevivendo ao Horror', livro: 'Sobrevivendo ao Horror', resumo: 'Tudo do padrão + a classe Sobrevivente (gente comum), 20 novas origens, novas trilhas, poderes gerais e as regras opcionais de horror.' },
};

// Regras opcionais do Sobrevivendo ao Horror (só aparecem no modo "sah")
export const OPCIONAIS = {
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
export const nexDoNivel = n => NEX[Math.min(20, Math.max(1, n)) - 1];

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
    nome: 'Sobrevivente', fonte: 'SaH', soSah: true,
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
export const CLASSES_LISTA = Object.keys(CLASSES);

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
};
for (const [id, g] of Object.entries(GASTOS_ORIGEM)) { const o = ORIGENS.find(x => x.id === id); if (o) o.gasto = g; }
// efeitos automáticos extras de origens
Object.assign(ORIGENS.find(o => o.id === 'teorico'), { ef: { rdMentalInt: true } });
Object.assign(ORIGENS.find(o => o.id === 'experimento'), { ef: { rd: 2, experimento: true } });
Object.assign(ORIGENS.find(o => o.id === 'operario'), { ef: { ferramenta: true } });
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
    [8, 'Estudar Fraquezas', 'Uma ação de interlúdio estudando uma pista de um ser revela uma fraqueza dele.'],
    [13, 'Atacar das Sombras', 'Menos penalidades de Furtividade ao se mover e atacar em silêncio; começa as cenas de furtividade menos visível.'],
    [20, 'Estudar a Presa', 'Transforma um tipo de ser em sua "presa": +1 dado em perícias, +1 na margem e no multiplicador de crítico e RD 5 contra ele.'],
  ], 'SaH'),
  T('monstruoso', 'Monstruoso', 'combatente', [
    [2, 'Ser Amaldiçoado', 'Treina Ocultismo (ou +2) e escolhe um elemento; um ritual diário desse elemento dá benefícios (e mudanças) no corpo.'],
    [8, 'Ser Maldito', 'A transformação avança: novos benefícios ligados ao elemento.'],
    [13, 'Ser Assustador', 'A transformação avança ainda mais.'],
    [20, 'Ser Aterrorizante', 'Transformação completa. Agentes que chegam aqui costumam perder o controle.'],
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
    [2, 'Soluções Improvisadas', 'Gaste PE para tirar recursos e soluções do nada em situações de sobrevivência.'],
    [8, 'Fuga Obstinada', 'Bônus para fugir e se esconder em perseguições e cenas de furtividade.'],
    [13, 'Determinação Inquestionável', 'Resiste melhor a condições e efeitos que o derrubariam.'],
    [20, 'Só Mais um Passo', 'Mesmo à beira da morte, continua de pé por mais um pouco.'],
  ], 'SaH', { aviso: 'Resumos aproximados: confira os efeitos exatos no livro Sobrevivendo ao Horror, p. 24.' }),
  T('muambeiro', 'Muambeiro', 'especialista', [
    [2, 'Mascate', 'Treina uma Profissão (armeiro, engenheiro ou químico), +5 de carga e fabrica itens improvisados mais fácil.', { carga: 5 }],
    [8, 'Fabricação Própria', 'Fabrica itens mundanos na metade do tempo.'],
    [13, 'Laboratório de Campo', 'Pode fabricar e consertar itens paranormais em campo.'],
    [20, 'Achado Conveniente', 'Consegue o item certo na hora certa, com mais frequência.'],
  ], 'SaH', { aviso: 'Habilidades de NEX 65% e 99% resumidas de forma aproximada: confira no livro Sobrevivendo ao Horror, p. 25.' }),
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
    [13, 'Parareligiosidade', 'Usa elementos da sua fé para reforçar rituais e proteger aliados.'],
    [20, 'Chagas da Resistência', 'Pode sacrificar a si mesmo (Sanidade/PV) para resistir ao Outro Lado.'],
  ], 'SaH'),
  T('possuido', 'Possuído', 'ocultista', [
    [2, 'Poder Não Desejado', 'Uma entidade vive em você: tem uma reserva de pontos de possessão para efeitos paranormais.'],
    [8, 'As Sombras Dentro de Mim', 'A entidade ajuda em combate e em testes, com um custo.'],
    [13, 'Ele Me Ensina', 'A entidade lhe ensina poderes paranormais.'],
    [20, 'Tornamo-nos Um', 'Você e a entidade se fundem, por um tempo, num ser mais poderoso.'],
  ], 'SaH', { aviso: 'Trilha com regras próprias (pontos de possessão): confira no livro Sobrevivendo ao Horror, p. 28.' }),
  T('parapsicologo', 'Parapsicólogo', 'ocultista', [
    [2, 'Terapia', 'Usa Profissão (psicólogo) para ajudar aliados a resistir e se recuperar de dano mental.'],
    [8, 'Palavras-chave', 'Combina psicologia e paranormal para acalmar ou desestabilizar mentes.'],
    [13, 'Reprogramação Mental', 'Pode remover ou implantar condições mentais com sessões de terapia.'],
    [20, 'A Sanidade Está Lá Fora', 'Grande poder de proteger e restaurar a sanidade do grupo.'],
  ], 'SaH', { aviso: 'Resumos aproximados: confira no livro Sobrevivendo ao Horror, p. 29.' }),
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
  P('Mãos Firmes', 'especialista', '2 PE para +2 dados em Furtividade ao esconder-se ou mexer em objetos.', 'treinado em Furtividade', 'SaH'),
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
];
export const PROTECOES = [
  { nome: 'Proteção leve', defesa: 5, categoria: 1, espacos: 2, peso: 'leve' },
  { nome: 'Proteção pesada', defesa: 10, categoria: 2, espacos: 5, peso: 'pesada', rd: 2, penalidade: 5 },
  { nome: 'Escudo', defesa: 2, categoria: 1, espacos: 2, peso: 'escudo' },
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
export const DESLOCAMENTO_BASE = 9; // metros
export const TIPOS_DANO = { B: 'balístico', C: 'corte', I: 'impacto', P: 'perfuração', F: 'fogo' };

// ---------- Condições (resumos curtos) ----------
// "–1D" = um dado a menos no teste.
export const CONDICOES = [
  ['abalado', 'Abalado', '–1D em testes.'], ['agarrado', 'Agarrado', 'Desprevenido e imóvel; –1D em ataques, só armas leves.'],
  ['alquebrado', 'Alquebrado', 'Habilidades e rituais custam +1 PE.'], ['apavorado', 'Apavorado', '–2D em perícias e foge da fonte do medo.'],
  ['asfixiado', 'Asfixiado', 'Não respira; aguenta algumas rodadas e depois faz Fortitude.'], ['atordoado', 'Atordoado', 'Desprevenido e não age.'],
  ['caido', 'Caído', 'No chão: pior contra corpo a corpo, melhor contra distância, desloca pouco.'], ['cego', 'Cego', 'Desprevenido e lento; –2D em perícias de AGI e FOR.'],
  ['confuso', 'Confuso', 'Age de forma aleatória.'], ['debilitado', 'Debilitado', '–2D em AGI, FOR e VIG.'],
  ['desprevenido', 'Desprevenido', '–5 na Defesa e –1D em Reflexos.'], ['em-chamas', 'Em chamas', 'Sofre dano de fogo por rodada até apagar.'],
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
  ['petrificado', 'Petrificado', 'Inconsciente, com RD 10.'], ['sangrando', 'Sangrando', 'Fortitude a cada turno; se falhar perde 1d6 PV.'],
  ['surdo', 'Surdo', 'Não ouve; –2D em Iniciativa.'], ['surpreendido', 'Surpreendido', 'Desprevenido e não age na rodada.'],
  ['vulneravel', 'Vulnerável', '–2 na Defesa.'],
].map(([id, nome, resumo]) => ({ id, nome, resumo }));
// penalidades automáticas: dados a menos por atributo, e Defesa
export const EFEITO_CONDICAO = {
  abalado: { todos: -1 }, apavorado: { pericias: -2 }, cego: { agi: -2, for: -2 }, debilitado: { agi: -2, for: -2, vig: -2 },
  fraco: { agi: -1, for: -1, vig: -1 }, esmorecido: { int: -2, pre: -2 }, frustrado: { int: -1, pre: -1 },
  exausto: { agi: -2, for: -2, vig: -2, defesa: -2 }, fatigado: { agi: -1, for: -1, vig: -1, defesa: -2 },
  desprevenido: { defesa: -5 }, vulneravel: { defesa: -2 }, enredado: { defesa: -2 }, indefeso: { defesa: -15 },
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
  R('Mapa Sanguíneo', 'sangue', 2, '', 'AS02'),
  R('Labirinto Mental', 'conhecimento', 2, '', 'AS02'),
  R('Capturar Momento', 'morte', 2, '', 'AS02'),
  R('Backup', 'energia', 2, '', 'AS04'),
  R('Hesitação Forçada', 'conhecimento', 1, '', 'AS06'),
  R('Vampirismo', 'sangue', 2, '', 'AS07'),
  // Passagem de Conhecimento e versão Expandida (AS01) são bi-elementais;
  // permanecem no Acervo, pois o motor atual representa um só elemento por ritual.
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
export const PODER_PARANORMAL = Object.fromEntries(PODERES_PARANORMAIS.map(p => [p.id, p]));

// ---------- Habilidades USÁVEIS (botão "Usar") ----------
// Chave = nome da habilidade/poder/origem. custo: PE (ou PD); 'aliados' = 1 por aliado; 'pv' = paga com PV.
// dura: 'instante' (só gasta), 'rodada', 'cena' (vira efeito ativo até o jogador desligar ou "Fim da cena"), 'proxima' (vale na próxima rolagem).
// ef: bônus enquanto ativo — defesa, resistencia, rd, rdMental, desl, todasPericias, dadosTodas, pericia:{id:n}, dadosPericia:{id:n},
//     ataque, ataqueDados, dano, margemTodas, dtRitual. Valores 'int'/'pre'/'vig'/'agi'/'for' = o atributo.
// ganhaPeTemp: PE temporários ganhos. rolar: fórmula rolada ao usar. nivelMin: só a partir desse nível da trilha/NEX.
export const USAVEIS = {
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
  'Paramédico': { custo: 2, dura: 'instante', rolarCura: true },
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
export const RITUAL_DADOS = {"Alterar Destino":{"execucao":"reação","alcance":"pessoal","alvo":"você","duracao":"instantânea","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Alterar Memória":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"instantânea","resistencia":"Vontade anula","dados":"1d4","tipoDados":"cura","verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Amaldiçoar Arma":{"execucao":"padrão","alcance":"toque","alvo":"1 arma corpo a corpo ou pacote de munição","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"dados":"1d6","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Amaldiçoar Tecnologia":{"execucao":"padrão","alcance":"toque","alvo":"1 acessório ou arma de fogo","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Âncora Temporal":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"cena","resistencia":"Vontade parcial","verdadeiro":{"custo":4,"circulo":4,"afinidade":false}},"Aprimorar Físico":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"cena","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Aprimorar Mente":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"cena","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Arma Atroz":{"execucao":"padrão","alcance":"toque","alvo":"1 arma corpo a corpo","duracao":"sustentada","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Armadura de Sangue":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":5,"circulo":3,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Canalizar o Medo":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"permanen te até ser descarregada"},"Capturar o Coração":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"cena","resistencia":"Vontade parcial"},"Chamas do Caos":{"execucao":"padrão","alcance":"curto","alvo":"veja texto","duracao":"cena","dados":"1d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false}},"Cicatrização":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","discente":{"custo":2,"circulo":2,"afinidade":false},"dados":"3d8+3","tipoDados":"cura","verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Cinerária":{"execucao":"padrão","alcance":"curto","area":"nuvem de 6m de raio","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Coincidência Forçada":{"execucao":"padrão","alcance":"curto","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Compreensão Paranormal":{"execucao":"padrão","alcance":"toque","alvo":"1 ser ou objeto","duracao":"cena","resistencia":"Vontade anula","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Conhecendo o Medo":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"instantânea","resistencia":"Vontade parcial","dados":"10d6","tipoDados":"dano"},"Consumir Manancial":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"instantânea","dados":"3d6","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Contato Paranormal":{"execucao":"completa","alcance":"pessoal","alvo":"você","duracao":"1 dia","discente":{"custo":4,"circulo":4,"afinidade":false},"verdadeiro":{"custo":9,"circulo":4,"afinidade":false}},"Contenção Fantasmagórica":{"execucao":"padrão","alcance":"médio","alvo":"1 ser","duracao":"cena","resistencia":"Reflexos anula","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Controle Mental":{"execucao":"padrão","alcance":"médio","alvo":"1 pessoa ou animal","resistencia":"Vonta de parcial","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false}},"Convocação Instantânea":{"execucao":"padrão","alcance":"ilimita do","alvo":"1 objeto de até 2 espaços","resistencia":"Vontade anula","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Convocar o Algoz":{"execucao":"padrão","alcance":"1,5m","alvo":"1 pessoa","duracao":"sustentada","resistencia":"Vonta de parcial,","dados":"6d6","tipoDados":"dano"},"Corpo Adaptado":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa ou animal","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Decadência":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Fortitude reduz à metade","dados":"2d8+2","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Definhar":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Deflagração de Energia":{"execucao":"completa","alcance":"pes soal","area":"explosão de 15m de raio","resistencia":"Fortitude parcial","dados":"3d10","tipoDados":"dano"},"Desacelerar Impacto":{"execucao":"reação","alcance":"curto","duracao":"até chegar ao solo ou cena, o que vier primeiro","verdadeiro":{"custo":3,"circulo":null,"afinidade":false}},"Descarnar":{"execucao":"padrão","alcance":"toque","duracao":"instantânea","resistencia":"Fortitude parcial","discente":{"custo":3,"circulo":3,"afinidade":false},"dados":"6d8","tipoDados":"dano","verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Detecção de Ameaças":{"execucao":"padrão","alcance":"pessoal","area":"esfera de 18m de raio","duracao":"cena","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Dissipar Ritual":{"execucao":"padrão","alcance":"médio","duracao":"instantânea"},"Dissonância Acústica":{"execucao":"padrão","alcance":"médio","area":"esfera com 6m de raio","discente":{"custo":1,"circulo":null,"afinidade":false},"verdadeiro":{"custo":3,"circulo":null,"afinidade":false}},"Distorção Temporal":{"execucao":"padrão","alcance":"pessoal","alvo":"veja texto","duracao":"veja texto"},"Distorcer Aparência":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Eco Espiral":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"2 rodadas","resistencia":"Fortitude reduz à metade","discente":{"custo":3,"circulo":4,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":false}},"Eletrocussão":{"execucao":"padrão","alcance":"curto","alvo":"1 ser ou objeto","duracao":"instantânea","resistencia":"Fortitude parcial","discente":{"custo":2,"circulo":2,"afinidade":false},"dados":"3d6","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Embaralhar":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Enfeitiçar":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"cena","resistencia":"Vontade anula","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Esconder dos Olhos":{"execucao":"livre","alcance":"pessoal","alvo":"você","duracao":"1 rodada","verdadeiro":{"custo":7,"circulo":4,"afinidade":false},"discente":{"custo":3,"circulo":null,"afinidade":false}},"Espirais da Perdição":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":8,"circulo":null,"afinidade":false}},"Ferver Sangue":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"sustentada","resistencia":"Fortitude parcial","dados":"4d8","tipoDados":"dano","verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Fim Inevitável":{"execucao":"completa","alcance":"extremo","efeitoArea":"buraco negro com 1,5m de diâmetro","duracao":"4 ro dadas","resistencia":"Fortitude parcial","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false}},"Flagelo de Sangue":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"cena","resistencia":"Fortitude parcial","discente":{"custo":3,"circulo":3,"afinidade":false},"dados":"10d6","tipoDados":"dano","verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Forma Monstruosa":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Fortalecimento Sensorial":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Hemofagia":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Fortitude reduz à metade","dados":"6d6","tipoDados":"cura","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Inexistir":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Vontade parcial","dados":"10d12+10","tipoDados":"dano","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false}},"Invadir Mente":{"execucao":"padrão","alcance":"médio ou toque","alvo":"1 ser ou 2 pessoas voluntárias","resistencia":"Vontade parcial ou nenhuma","discente":{"custo":3,"circulo":3,"afinidade":false},"dados":"6d6","tipoDados":"dano","verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Invólucro de Carne":{"execucao":"padrão","alcance":"curto","efeitoArea":"1 clone seu","duracao":"cena"},"Lâmina do Medo":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","resistencia":"Fortitude parcial","dados":"10d8","tipoDados":"dano"},"Localização":{"execucao":"padrão","alcance":"pessoal","area":"círculo com 90m de raio","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Luz":{"execucao":"padrão","alcance":"curto","alvo":"1 objeto","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Medo Tangível":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena"},"Mergulho Mental":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","resistencia":"Vontade parcial","verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Miasma Entrópico":{"execucao":"padrão","alcance":"médio","area":"nuvem com 6m de raio","resistencia":"Fortit ude parcial","dados":"4d8","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Nuvem de Cinzas":{"execucao":"padrão","alcance":"curto","efeitoArea":"nuvem com 6m de raio e 6m de altura","duracao":"cena","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Ódio Incontrolável":{"execucao":"padrão","alcance":"toque","alvo":"1 pessoa","duracao":"cena","discente":{"custo":2,"circulo":3,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Ouvir os Sussurros":{"execucao":"completa","alcance":"pessoal","alvo":"você","duracao":"instantânea","dados":"1d6","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Paradoxo":{"execucao":"padrão","alcance":"médio","area":"esfera com 6m de raio","resistencia":"Fortitude reduz à metade","dados":"6d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Perturbação":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"1 rodada","resistencia":"Vontade anula","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Poeira da Podridão":{"execucao":"padrão","alcance":"médio","area":"nuvem com 6m de raio","resistencia":"Fortitude (veja texto)","dados":"4d8","tipoDados":"dano"},"Polarização Caótica":{"execucao":"padrão","alcance":"curto","alvo":"você","duracao":"sustentada","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Possessão":{"execucao":"padrão","alcance":"longo","alvo":"1 pessoa viva ou morta","duracao":"1 dia","resistencia":"Vontade anula"},"Presença do Medo":{"execucao":"padrão","alcance":"pessoal","area":"emanação de 9m de raio","dados":"5d8","tipoDados":"dano"},"Proteção contra Rituais":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"cena","discente":{"custo":3,"circulo":null,"afinidade":false}},"Purgatório":{"execucao":"padrão","alcance":"curto","alvo":"área de 6m de raio","duracao":"sustentada","resistencia":"Fortitude parcial","dados":"6d6","tipoDados":"dano"},"Rejeitar Névoa":{"execucao":"padrão","alcance":"curto","area":"nuvem de 6m de raio","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false}},"Salto Fantasma":{"execucao":"padrão","alcance":"médio","alvo":"você","duracao":"instantânea","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":4,"circulo":null,"afinidade":false}},"Sopro do Caos":{"execucao":"padrão","alcance":"médio","area":"varia","resistencia":"veja texto","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":false}},"Tecer Ilusão":{"execucao":"padrão","alcance":"médio","efeitoArea":"ilusão que se estende a até 4 cubos de 1,5m","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false}},"Tela de Ruído":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Teletransporte":{"execucao":"padrão","alcance":"toque","alvo":"até 5 seres voluntários","dados":"1d10","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Tentáculos de Lodo":{"execucao":"padrão","alcance":"médio","area":"círculo com 6m de raio","dados":"4d6","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Terceiro Olho":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Transfigurar Água":{"execucao":"padrão","alcance":"longo","area":"esfera com 30m de raio","resistencia":"veja texto","dados":"5d8","tipoDados":"dano","verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Transfigurar Terra":{"execucao":"padrão","alcance":"longo","area":"9 cubos com 1,5m de lado","duracao":"instantânea","resistencia":"veja texto","dados":"10d6","tipoDados":"dano","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Transfusão Vital":{"execucao":"padrão","alcance":"toque","alvo":"1 ser","duracao":"instantânea","discente":{"custo":3,"circulo":3,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Velocidade Mortal":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"sustentada","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":null,"afinidade":false}},"Vidência":{"execucao":"completa","alcance":"ilimitado","alvo":"1 ser","duracao":"5 rodadas","resistencia":"Vontade anula"},"Vínculo de Sangue":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","resistencia":"Fortitude anula"},"Vomitar Pestes":{"execucao":"padrão","alcance":"médio","efeitoArea":"1 enxame Grande","duracao":"sustentada","dados":"5d12","tipoDados":"dano","discente":{"custo":2,"circulo":null,"afinidade":false},"verdadeiro":{"custo":5,"circulo":null,"afinidade":false}},"Zerar Entropia":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"cena","resistencia":"Vontade parcial","discente":{"custo":4,"circulo":4,"afinidade":false},"verdadeiro":{"custo":11,"circulo":4,"afinidade":false}},"Esfolar":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"instantânea","resistencia":"Reflexos parcial","dados":"3d4+3","tipoDados":"dano","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Sede de Adrenalina":{"execucao":"reação","alcance":"pessoal","alvo":"você","duracao":"instantânea","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":true}},"Odor da Caçada":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Martírio de Sangue":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"veja o livro","discente":{"custo":5,"circulo":null,"afinidade":true}},"Apagar as Luzes":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"instantânea","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Língua Morta":{"execucao":"padrão","alcance":"toque","alvo":"1 cadáver","duracao":"sustentada","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":true}},"Fedor Pútrido":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"sustentada","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Singularidade Temporal":{"execucao":"padrão","alcance":"curto","alvo":"1 objeto não paranormal Médio","duracao":"instantânea","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":false}},"Desfazer Sinapses":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"instantânea","resistencia":"Vontade parcial","dados":"2d6+2","tipoDados":"dano","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Aurora da Verdade":{"execucao":"padrão","alcance":"curto","alvo":"esfera de 3m de raio","duracao":"sustentada","resistencia":"Vontade parcial","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":true}},"Relembrar Fragmento":{"execucao":"padrão","alcance":"toque","alvo":"1 objeto","duracao":"instantânea","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Pronunciar Sigilo":{"execucao":"padrão","alcance":"curto","alvo":"1 ser","duracao":"instantânea","resistencia":"Vontade parcial","discente":{"custo":5,"circulo":null,"afinidade":false},"verdadeiro":{"custo":10,"circulo":null,"afinidade":true}},"Overclock":{"execucao":"reação","alcance":"pessoal","alvo":"você","duracao":"instantânea","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Tremeluzir":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"sustentada","discente":{"custo":3,"circulo":null,"afinidade":false},"verdadeiro":{"custo":7,"circulo":4,"afinidade":false}},"Mutar":{"execucao":"padrão","alcance":"pessoal","alvo":"você","duracao":"cena","discente":{"custo":4,"circulo":null,"afinidade":false},"verdadeiro":{"custo":9,"circulo":null,"afinidade":true}},"Milagre Ionizante":{"execucao":"completa","alcance":"toque","alvo":"1 ser","duracao":"instantânea"},"Mapa Sanguíneo":{"execucao":"padrão","alcance":"toque","alvo":"1 superfície","duracao":"cena","resistencia":"Vontade evita","discente":{"custo":3,"circulo":2,"afinidade":false}},"Labirinto Mental":{"execucao":"padrão","alcance":"médio","alvo":"1 pessoa","duracao":"1d4 rodadas","resistencia":"Vontade evita","discente":{"custo":3,"circulo":2,"afinidade":false},"verdadeiro":{"custo":7,"circulo":3,"afinidade":false}},"Capturar Momento":{"execucao":"padrão","alcance":"médio","area":"esfera de 18m de raio","duracao":"cena","discente":{"custo":3,"circulo":2,"afinidade":false},"verdadeiro":{"custo":7,"circulo":3,"afinidade":false}},"Backup":{"execucao":"padrão","alcance":"curto","alvo":"veja texto","duracao":"24 horas","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":false}},"Hesitação Forçada":{"execucao":"padrão","alcance":"curto","alvo":"1 pessoa","duracao":"sustentada","resistencia":"Vontade parcial","discente":{"custo":2,"circulo":2,"afinidade":false},"verdadeiro":{"custo":5,"circulo":3,"afinidade":true}},"Vampirismo":{"execucao":"completa","alcance":"toque","alvo":"1 pessoa","duracao":"cena","discente":{"custo":5,"circulo":3,"afinidade":false},"verdadeiro":{"custo":10,"circulo":4,"afinidade":true}}};
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
