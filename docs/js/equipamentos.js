// Valores das tabelas 1.5 e 1.6 de Sobrevivendo ao Horror.
export const MATERIAL_SAH = {
 'Amuleto sagrado': [0, 1], Celular: [0, 1], 'Chave de fenda universal': [0, 1], Chaves: [0, 1],
 'Documentos falsos': [1, 1], 'Manual operacional': [1, 1], Notebook: [0, 2],
 Dinamite: [1, 1], 'Explosivo plástico': [1, 1], 'Galão vermelho': [0, 2],
 'Granada de gás sonífero': [1, 1], 'Granada de PEM': [1, 1],
 'Alarme de movimento': [0, 1], 'Alimento energético': [2, 1], 'Aplicador de medicamentos': [1, 1],
 'Braçadeira reforçada': [1, 1], 'Cão adestrado': [1, 0], 'Coldre saque rápido': [1, 1],
 'Equipamento de escuta': [1, 1], 'Estrepes (saco)': [0, 1], 'Faixa de pregos': [1, 2], Isqueiro: [0, 0.5],
 Antibiótico: [1, 0.5], Antídoto: [1, 0.5], Antiemético: [1, 0.5], 'Anti-histamínico': [1, 0.5],
 'Anti-inflamatório': [1, 0.5], Antitérmico: [1, 0.5], Broncodilatador: [1, 0.5], Coagulante: [1, 0.5],
 'Óculos escuros': [0, 1], 'Óculos de visão noturna': [1, 1], Pá: [0, 2], Paraquedas: [1, 2],
 'Traje de mergulho': [1, 2], 'Traje espacial': [2, 5],
 'Catalisador ritualístico ampliador': [1, 0.5], 'Catalisador ritualístico perturbador': [1, 0.5],
 'Catalisador ritualístico potencializador': [1, 0.5], 'Catalisador ritualístico prolongador': [1, 0.5],
 'Ligação direta infernal': [2, 1], 'Medidor de condição vertebral': [2, 1], 'Pé de morto': [2, 1],
 'Pen drive selado': [2, 0.5], 'Valete da salvação': [1, 0.5],
 'Conector de membros': [3, 1], "Dose d'A Praga": [3, 1], 'Mandíbula agonizante': [2, 1], 'Retalho tenebroso': [2, 1],
 'Ampulheta do tempo sofrido': [2, 1], 'Injeção de Lodo': [2, 0.5], 'Instantâneo mortal': [2, 0.5],
 'Projétil de Lodo, curto': [1, 1], 'Projétil de Lodo, longo': [2, 1], 'Rádio chiador': [2, 1],
 'Câmera obscura': [3, 1], 'Enxame fantasmagórico': [3, 1], 'Repositório do fracasso': [2, 1],
 'Tablet do saber custoso': [2, 1], 'Arreio neural': [2, 1], 'Centrifugador existencial': [3, 1],
 'Espelho refletor': [2, 1], 'Fuzil alheio': [4, 2], 'A Primeira Adaga': [3, 1],
};

export const CAPACIDADE_ARMAS = {
  Pistola: 12, Revólver: 6, 'Fuzil de caça': 4, Submetralhadora: 20, Espingarda: 6,
  'Fuzil de assalto': 30, 'Fuzil de precisão': 1, Metralhadora: 50,
  'Espingarda de cano duplo': 2, 'Pistola pesada': 10, 'Revólver compacto': 5,
};


// Efeitos resumidos com outras palavras (conferidos nos PDFs do Livro de Regras, p. 148–151 impressas, e dos Arquivos Secretos).
export const RESUMO_ITENS = {
  // Livro de Regras — itens amaldiçoados especiais (Sangue)
  'Pérola de Sangue': 'Sangue. Ação de movimento para absorver: +5 em testes de Agi, For e Vig (e perícias deles) até o fim da cena. No fim, Fortitude DT 20: falha = fatigado no dia; falha por 5+ = parada cardíaca (morrendo). Quem morre assim vira criatura de Sangue.',
  'Coração Pulsante': 'Sangue. Empunhado: ao sofrer dano, reação para espremê-lo e reduzir o dano à metade. Cada uso pede Fortitude DT 15 (+5 por uso extra no dia); falhou, o item se destrói. Precisa ser drenado todo dia.',
  'Coroa de Espinhos': 'Sangue. Uma vez por rodada, reação para converter dano mental que sofreria em dano de Sangue. Vestido, você não recupera Sanidade descansando. Só funciona depois de uma semana vestido.',
  'Frasco de Vitalidade': 'Sangue. Gaste 1 minuto e sofra até 20 de dano para guardar o próprio sangue. Ação padrão para beber e recuperar os PV guardados (Fortitude DT 20 ou fica enjoado 1 rodada).',
  'Punhos Enraivecidos': 'Sangue. Ataques desarmados: +1d8 de Sangue e dano letal. Ao acertar, pode atacar de novo o mesmo alvo pagando 2 PE por ataque já feito no turno (2, 4, 6…), até errar ou acabar o PE.',
  'Seringa de Transfiguração': 'Sangue. Ação padrão para tirar sangue de um adjacente (ataque se involuntário) e outra para injetar em alguém: ele fica com a aparência do dono do sangue (Distorcer Aparência por 1 dia). No fim, 1d6; resultado 1 = perde 1 PV permanente.',
  // Morte
  'Amarras Mortais': 'Morte. Uma vez por rodada, ação padrão e 2 PE: agarrar um alvo Grande ou menor em alcance curto com +10 no teste. Ação de movimento para puxar o agarrado até ficar adjacente.',
  'Casaco de Lodo': 'Morte. Resistência 5 a corte, impacto, perfuração e Morte; vulnerável a balístico e Energia.',
  'Vislumbre do Fim': 'Morte. Ação de movimento olhando um ser: em pessoas comuns, mostra quanto falta para morrerem; em Marcados e criaturas, revela a pior resistência (Fort, Ref ou Von) e as vulnerabilidades.',
  'Frasco de Lodo': 'Morte. Uso único, ação padrão. Ferimento da última rodada: cura 6d8+20 PV. Ferimento mais antigo: role um dado; par cura 3d8+10, ímpar causa 3d8+10 de dano de Morte.',
  // Conhecimento
  'Coletora': 'Conhecimento. Ação completa para apunhalar quem está morrendo (mata): guarda 1d8 PE, até 20, usáveis como seus após 1 semana portando. Enquanto portar, descanso sempre ruim.',
  'Crânio Espiral': 'Conhecimento. Uma vez por rodada, ação livre: ganha uma ação padrão extra. Vontade DT 15 (+5 por uso extra no dia); falha = envelhece 1d4 anos e não usa mais nesse dia (o efeito acontece mesmo assim).',
  'Anéis do Elo Mental': 'Conhecimento. Par de anéis; após 24 h, liga os dois portadores por telepatia. Ambos usam o melhor teste de Vontade, mas dano mental e condições mentais/de medo de um atingem o outro também.',
  'Lanterna Reveladora': 'Conhecimento. Ação padrão e 1 PE: luz por uma cena com o efeito de Terceiro Olho. Criaturas de Sangue iluminadas passam a atacar você de preferência.',
  'Máscara das Pessoas nas Sombras': 'Conhecimento. Resistência a Conhecimento 10. Ação de movimento e 2 PE: entra numa sombra adjacente e sai em outra visível em alcance médio. Atrai o interesse das Máscaras…',
  'Munição Jurada': 'Conhecimento. Ritual de 1 hora vincula a bala a um ser conhecido: contra ele, +10 no ataque, margem de ameaça dobrada e +6d12 de Conhecimento. Enquanto a possuir: –2 na Defesa e nos ataques contra outros alvos.',
  'Pergaminho da Pertinácia': 'Conhecimento. Ação padrão: +5 PE temporários até o fim da cena. Ocultismo DT 15 (+5 por uso extra no dia); falhou, o pergaminho se desfaz.',
  // Energia
  'Arcabuz dos Moretti': 'Energia. Arma simples de fogo, uma mão, alcance curto, x3, +2 no ataque, dano de Energia, sem munição. A cada disparo role 1d6 para o dano: 2d4, 2d6, 2d8, 2d10, 2d12 ou 2d20.',
  'Bateria Reversa': 'Energia. Ação padrão e 2 PE: descarrega um aparelho em alcance curto; com carga, ação padrão para recarregar outro. Ocultismo DT 15 (+5 por uso extra no dia); falhou, explode (12d6 de Energia em 3 m).',
  'Peitoral da Segunda Chance': 'Energia. Ao cair a 0 PV, gasta 5 PE seus e reanima você com 4d10 PV (falha sem PE). Em cada ativação, 1 chance em 1d10 de a descarga matar você na hora.',
  'Relógio de Arnaldo': 'Energia. Uma vez por rodada, 1 PE para rolar de novo qualquer dado que deu 1; o custo sobe +1 a cada uso no mesmo dia. Item único.',
  'Talismã da Sorte': 'Energia. Ao sofrer dano, reação e 3 PE: role 1d4. 2–3 evita o dano; 4 evita e o talismã vira cinzas; 1 sofre o dobro e o talismã vira cinzas.',
  'Teclado de Conexão Neural': 'Energia. Plugar (ação de movimento): usa o computador sem barreiras técnicas ou de idioma, +10 para hackear e metade do tempo para achar arquivos, mas sofre 1d6 de dano mental por rodada de uso.',
  'Tela do Pesadelo': 'Energia. Ação padrão e 2 PE para armar. Quem tocar a tela faz Vontade (sua DT +5): falha = atordoado e 4d6 de dano mental, repetindo a cada rodada até passar ou enlouquecer.',
  'Veículo Energizado': 'Energia. Não precisa de combustível. O motorista pode usar reação e Pilotagem DT 25 para o veículo atravessar um obstáculo como energia pura, sem colidir.',
  // Medo e variáveis
  'Jaqueta de Veríssimo': 'Medo. Categoria IV, item único. Resistência a dano paranormal 15. Quando um aliado adjacente for sofrer dano, reação e 2 PE para receber o dano no lugar dele.',
  'Dedo Decepado': 'Elemento variável. Dá um poder paranormal que o dono do dedo tinha. Ao dormir ou relaxar, 1d4: resultado 1 = não recupera PV, PE nem Sanidade. –10 em Diplomacia se o virem. Funciona após 1 semana vestido.',
  // Arquivos Secretos #02
  'Bandagem': 'Ação padrão e o item: cura 2d4+2 PV e remove sangrando (você ou alguém adjacente).',
  'Dose de Álcool': 'Ação padrão e o item: +2 contra infecções e doenças de contato. Com bandagem, a cura vira 2d8+2. Inflamável.',
  'Bússola': 'Utensílio: +2 em Sobrevivência para se orientar.',
  'Caixa de Ferramentas': 'Utensílio: +2 em Profissão quando as ferramentas ajudam no teste.',
  'Incenso': 'Ação de interlúdio queimando o incenso: todos no interlúdio recuperam 1d4 PE (uma vez por dia).',
  'Pedra de Amolar': 'Ação de interlúdio para amolar arma de corte ou perfuração: +1d4 de dano na primeira cena em que for usada.',
  'Kit de Escalada': 'Utensílio: +2 em Atletismo para escalar.',
  'Faca Predadora': 'Sangue. Arma simples, ágil, arremessável (curto): 1d4 perfuração + 2d10 Sangue, 19/x3. Ao atacar, 2 PE: se acertar, recupera 2d10 PV (o excesso vira PV temporário). Use "Adicionar arma" para atacar com ela.',
  'Machado do Mutilador': 'Sangue. Arma tática, uma mão: 1d8 corte + 1d8 Sangue (multiplica no crítico), 20/x3. Ao acertar, 1 PE deixa o alvo sangrando (acumula: 1d6 por sangramento).',
  'Elmo do Colosso': 'Energia. Vestimenta com RD 5. Com o resto do escafandro, conta como traje de mergulho.',
  'Manoplas do Colosso': 'Energia. Par de armas táticas (só funcionam juntas): 1d6 impacto + 1d10 Energia, 20/x2. Valem as regras de ataque desarmado, mas Artista Marcial não aumenta o dano.',
  'Punhal X': 'Conhecimento. Arma simples, ágil, arremessável (curto): 1d4 perfuração + 1d6 Conhecimento, 19/x2. Ao atacar, 2 PE deixam o alvo desprevenido; se acertar, fica cego 1 rodada (uma vez por cena por alvo).',
  'Sniper Fantasma': 'Morte. Arma de fogo tática, duas mãos, alcance longo: 2d10 balístico + 2d4 Morte, 19/x3. Veterano em Pontaria mirando: +5 na margem de ameaça. Quem cair a 0 PV por ela morre após 2 turnos morrendo.',
  'A Antena': 'Amaldiçoado (elemento não indicado; "transmite medo primal"). Arma simples improvisada (–1 dado no ataque), duas mãos: 1d6 impacto, x2. DT dos seus rituais +3. Pode guardar um ritual conjurado nela e liberá-lo depois com ação padrão, sem gastar PE.',
  'Catalisador Sofisticado e Horrorizado': 'Item paranormal vestido, não se consome. Uma vez por cena recebe 3d6; gaste 1d6 (ação livre, um por ritual, ao conjurar) para +1d6 no dano, na cura ou na DT do ritual. Sobras somem no fim da cena.',
  // #03
  'Bloody Mary Batizada': 'Ao beber, remove uma condição mental ou de medo, mas sofre 2d4 de dano mental.',
  'Paçoca': 'Conta como prato rápido; em ocasiões especiais (mestre), uma vez por dia recupera 1d8+1 PV, PE e Sanidade.',
  'Crânio Dominador': 'Empunhado: ação padrão e 2 PE prendem até 2 alvos em alcance curto com correntes (paralisados; Reflexos DT Pre evita). Corrente: Defesa 10, RD 10, 20 PV. Recarrega em 24 h.',
  'Gaiola do Corvo': 'Ação padrão para pôr no chão e abrir: raio de 18 m vira Lodo (terreno difícil) e quem está nele sofre 3d10 de Morte por rodada (Fortitude DT Vig reduz à metade). Quem ficar morrendo ali é consumido e a gaiola se fecha. Fechar: ação padrão.',
  'Camiseta Psikolera': 'Sangue. Vestida e machucado: +2d8 de dano de Sangue em todas as suas rolagens de dano.',
  'Dupla Obsessiva': 'Sangue. Maça (2d4 perf. + 1d6 Sangue, 20/x3) e florete ágil (1d6 perf. + 2d4 Sangue, 18/x2). Com as duas, ação padrão = um ataque com cada. Reação e 2 PE para virar o alvo de um ataque contra aliado em alcance curto (+2 PE para contra-atacar com a maça se a fonte estiver adjacente).',
  // #04
  'Granada Ctrl+C Ctrl+V': 'Energia. Arremesso em alcance médio, raio 6 m: 8d6 de Energia (Reflexos DT Agi reduz à metade). Role 1d4: par gera outra explosão na área, até 4 explosões ou sair ímpar.',
  'Granada de Gás Lacrimogêneo': 'Raio 6 m: 4d6 de dano químico, enjoado e dificuldade de respirar (por 1d4 rodadas após sair; enjoado até o fim da cena). Fortitude DT Agi reduz à metade e evita enjoado.',
  'Granada de Tinta': 'Raio 6 m: alvos ficam vulneráveis e com –2 dados em Furtividade até o fim da cena (Reflexos DT Agi evita).',
  'Lançador de Granadas': 'Arma de fogo pesada, duas mãos, alcance longo, 6 granadas 40 mm (recarregar 1: ação de movimento). Acerta o alvo e a área da granada; pode mirar num ponto sem rolar ataque.',
  // #05
  'Câmera Filmadora': 'Utensílio: +2 em Investigação e Percepção; serve de lanterna (cone de 9 m) ou visão no escuro.',
  'Faixas da Vidência': 'Morte. +5 na Defesa e resistências contra efeitos vindos de alcance médio, –5 contra efeitos de além de 9 m. +2 em Intimidação; 1 PE para +2 ao procurar pista.',
  'Joias da Mente': 'Conhecimento. Piercing e brinco (as duas peças): +2 em Diplomacia e resistência a dano mental 10.',
  'Larva da Fúria': 'Sangue. Engolir (ação de movimento): fúria até o fim da cena, +4 em ataque e dano corpo a corpo, sem ações de calma (Furtividade, rituais). Acaba se passar uma rodada sem atacar nem ser alvo hostil.',
  'Skate Caótico': 'Energia. Três modos (trocar: ação de movimento): +3 m de deslocamento (se treinado em Acrobacia, Atletismo ou Pilotagem); arma improvisada de duas mãos 1d12 impacto x2; ou escudo com +5 na Defesa, sem exigir proficiência.',
  'Tênis Lépidos': 'Energia. +12 em Atletismo e +3 m de deslocamento. 2 PE: até o fim do turno ignora terreno difícil, escala com o deslocamento normal e ignora queda de até 9 m.',
  // #06
  'Anel Invertido': 'Morte. Ao sofrer dano de um nidere, reação e 2 PE para RD 4d10 contra esse dano.',
  'Aplicador de Adrenalina': 'Medicamento. Ação padrão (você ou adjacente): 2d8+2 PV temporários, +3 m de deslocamento e +2 em testes de For, Agi e Vig até o fim da cena; depois fica fatigado por uma cena.',
  // #07
  'Carranca Caçadora': 'Item paranormal. Com material de uma criatura na boca, aponta o caminho (sempre o mais perigoso) até ela ou até onde sumiu, por 10 minutos; depois não serve mais para essa criatura.',
  'Cajado da Cruz de Sangue': 'Sangue. Arma simples, ágil, duas mãos: 1d12 corte, x2 (vale com Combater com Duas Armas). Ocultista que conhece ritual de Sangue: rituais e poderes de Sangue custam –1 PE, DT +1 e +1 dado de dano.',
  'Pé de Coelho': 'Item paranormal vestido. Uma vez por cena, ação de movimento: +1d4 em todos os testes até o fim da cena; se o d4 sair ímpar, perde 1d4 PV num acidente com o pé.',
  'Sal Dourado': 'Linha numa porta/janela (3 usos) ou um círculo (1 uso). Criatura de Sangue VD 80 ou menos faz Vontade DT 20: passa = frustrada; falha = frustrada e não atravessa até o fim da cena.',
  'Terço Maculado': 'Sangue. Vestido, herda uma súplica (mestre): +2d10 em testes a favor dela. Não pode ser retirado (tentar = –2d10 PV); agir contra a súplica = –2d10 PV. Sai cortando a parte do corpo ou cumprindo a súplica.',
  // #09
  'Boroscópio Articulado': 'Duas mãos. Câmera num cabo de 3 m com visão no escuro: permite Investigação e Percepção sem entrar no ambiente.',
  'Drone de Combate Tático': 'Aliado drone (duas mãos para operar): deslocamento 6 m, voo 12 m, raio de 5 km. Escolha um tipo: Atirador, Espião, Hacker, Inteligente, Médico, Protetor ou Utilitário. Cada modificação adiciona outro tipo (+I de categoria).',
  'Lançador de Granadas Portátil': 'Como o lançador de granadas do AS #04, mas comporta uma granada por vez.',
  'Dardos Condutores': 'Munição da pistola taser: pacote para 20 ataques; a pistola guarda 10 dardos.',
};

const ESPECIAIS = [
  [158, 'Coração Pulsante', 'Coroa de Espinhos', 'Frasco de Vitalidade', 'Pérola de Sangue', 'Punhos Enraivecidos', 'Seringa de Transfiguração', 'Amarras Mortais'],
  [159, 'Casaco de Lodo', 'Coletora', 'Crânio Espiral', 'Frasco de Lodo', 'Vislumbre do Fim', 'Anéis do Elo Mental', 'Lanterna Reveladora', 'Máscara das Pessoas nas Sombras'],
  [160, 'Munição Jurada', 'Pergaminho da Pertinácia', 'Arcabuz dos Moretti', 'Bateria Reversa', 'Peitoral da Segunda Chance', 'Relógio de Arnaldo', 'Talismã da Sorte', 'Teclado de Conexão Neural'],
  [161, 'Tela do Pesadelo', 'Veículo Energizado', 'Jaqueta de Veríssimo', 'Dedo Decepado'],
];

export const ITENS_ESPECIAIS = ESPECIAIS.flatMap(([pagina, ...nomes]) => nomes.map(nome => ({
  nome, fonte: 'LR', categoria: nome === 'Jaqueta de Veríssimo' ? 4 : 2, espacos: 1,
  grupo: 'Itens amaldiçoados especiais', paginaLivro: pagina,
  resumo: RESUMO_ITENS[nome] || 'Consulte o efeito e as condições de uso no Livro de Regras.',
}))).concat([1, 2, 3, 4].map(circulo => ({
  nome: `Selo Paranormal (${circulo}º círculo)`, fonte: 'LR', categoria: circulo, espacos: 1,
  grupo: 'Itens amaldiçoados especiais', paginaLivro: 161, resumo: 'Contém um ritual (categoria = círculo). Empunhe e leia (ação padrão ou a do ritual): conjura o ritual sem PE e o selo vira cinzas. Precisa conhecer o ritual ou passar em Ocultismo DT 20 + custo. Sofre O Custo do Paranormal. Anote o ritual.',
})));

export const MOD_ACESSORIOS = [
  ['aprimorado', 'Aprimorado', 'Aumenta o bônus principal da perícia para +5.'],
  ['discreto', 'Discreto', 'Reduz em 1 espaço. +5 para ocultar com Crime, mesmo sem treino.'],
  ['aprimorado-extra', 'Aprimorado (função adicional)', 'Aumenta o bônus de perícia da função adicional para +5.'],
  ['bateria', 'Bateria Potente (SaH)', 'A bateria do dispositivo dura o dobro. Consulte as aplicações no suplemento.'],
  ['lente', 'Lente de Revelação (SaH)', 'Modificação de câmera ou visor. Consulte as aplicações no suplemento.'],
  ['funcao', 'Função Adicional', 'Fornece +2 em outra perícia.'],
  ['instrumental', 'Instrumental', 'Funciona como kit para a perícia escolhida.'],
];

export const ITENS_ARQUIVOS = [
  [2, 21, 'Bandagem', 1, 0.5], [2, 21, 'Dose de Álcool', 1, 0.5],
  [2, 21, 'Bússola', 1, 1], [2, 21, 'Caixa de Ferramentas', 1, 2], [2, 21, 'Incenso', 1, 0.5], [2, 21, 'Pedra de Amolar', 1, 0.5], [2, 21, 'Kit de Escalada', 1, 2],
  [2, 41, 'Machado do Mutilador', 4, 1], [2, 47, 'Elmo do Colosso', 3, 2], [2, 47, 'Manoplas do Colosso', 4, 2],
  [2, 53, 'Punhal X', 4, 1], [2, 59, 'Sniper Fantasma', 4, 2], [2, 67, 'A Antena', 4, 2],
  [2, 75, 'Catalisador Sofisticado e Horrorizado', 3, 1],
  [2, 93, 'Faca Predadora', 4, 1],
  [3, 112, 'Bloody Mary Batizada', 2, 1], [3, 112, 'Paçoca', 0, 0.5],
  [3, 113, 'Crânio Dominador', 3, 1], [3, 114, 'Camiseta Psikolera', 2, 1],
  [3, 113, 'Gaiola do Corvo', 4, 2], [3, 114, 'Dupla Obsessiva', 3, 2],
  [4, 70, 'Granada Ctrl+C Ctrl+V', 2, 1], [4, 70, 'Granada de Gás Lacrimogêneo', 1, 1],
  [4, 70, 'Granada de Tinta', 0, 1], [4, 71, 'Lançador de Granadas', 2, 2],
  [5, 60, 'Câmera Filmadora', 1, 1], [5, 60, 'Faixas da Vidência', 3, 1], [5, 60, 'Joias da Mente', 3, 1],
  [5, 61, 'Larva da Fúria', 2, 1], [5, 61, 'Skate Caótico', 2, 2], [5, 61, 'Tênis Lépidos', 3, 1],
  [6, 73, 'Anel Invertido', 2, 0.5], [6, 73, 'Aplicador de Adrenalina', 1, 1],
  [7, 78, 'Carranca Caçadora', 2, 2], [7, 78, 'Cajado da Cruz de Sangue', 3, 2],
  [7, 79, 'Pé de Coelho', 1, 1], [7, 79, 'Sal Dourado', 1, 1], [7, 79, 'Terço Maculado', 2, 1],
  [9, 43, 'Boroscópio Articulado', 1, 1], [9, 44, 'Drone de Combate Tático', 3, 2],
  [9, 47, 'Lançador de Granadas Portátil', 2, 1], [9, 48, 'Dardos Condutores', 1, 1],
].map(([volume, paginaLivro, nome, categoria, espacos]) => ({
  nome, categoria, espacos, paginaLivro, fonte: `AS${String(volume).padStart(2, '0')}`,
  grupo: `Arquivos Secretos · ${String(volume).padStart(2, '0')}`, resumo: RESUMO_ITENS[nome] || 'Consulte as ações e os efeitos no acervo.',
}));


const MUNICAO_CONHECIDA = {
  'revólver compacto': 'Balas curtas', 'pistola pesada': 'Balas curtas', pistola: 'Balas curtas', revólver: 'Balas curtas', submetralhadora: 'Balas curtas',
  'fuzil de assalto': 'Balas longas', 'fuzil de precisão': 'Balas longas', 'fuzil de caça': 'Balas longas', metralhadora: 'Balas longas',
  'designated marksman rifle': 'Balas longas', espingarda: 'Cartuchos', 'espingarda de cano duplo': 'Cartuchos', 'espingarda serrada': 'Cartuchos',
  'lança-nitrogênio': 'Combustível', 'pistola taser': 'Dardos Condutores',
};

export function moverPacoteParaReserva(ficha, arma, item) {
  const municao = arma.municao.trim() || MUNICAO_CONHECIDA[arma.nome.toLowerCase()];
  const lista = Object.values(MUNICAO_CONHECIDA);
  if (!municao || !item || item.qtd < 1 || !lista.some(n => n.toLowerCase() === item.nome.toLowerCase())
    || municao.toLowerCase() !== item.nome.toLowerCase() || arma.reserva + 20 > 9999) return false;
  item.qtd--;
  arma.reserva += 20;
  return true;
}
