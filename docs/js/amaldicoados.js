import { MODIFICACAO, PODER_PARANORMAL, RITUAIS } from './catalogo.js?v=0.45';
export const ELEMENTOS_MALDICAO = ['conhecimento', 'energia', 'morte', 'sangue', 'medo'];
export const PROTECAO_ELEMENTAL = 'Acessório amaldiçoado: Proteção Elemental';
// ═══════════ amaldicoados ═══════════
// amaldicoados.js — efeitos dos itens amaldiçoados e paranormais para a aba Combate › Itens amaldiçoados.
// Fontes: Livro de Regras (p. 147–151 impressas), Sobrevivendo ao Horror (p. 57–61) e Arquivos Secretos.
//
// Cada item pode ter:
//  el       elemento (sangue, morte, conhecimento, energia, medo, variavel)
//  vestir   rótulo da caixinha que liga o efeito passivo ("Vestido", "Empunhado"…)
//  passivo  efeito permanente enquanto a caixinha estiver marcada:
//           atr {agi,for,int,pre,vig}, pv, pe, defesa, desl, rd, resistencia, pericia {id: n},
//           rdMental, dtRitual, ataque, dano, todasPericias, dadosTodas, dadosPericia {id: n}
//  nota     regra passiva que o site não calcula (aparece no cartão)
//  usos     botões. Campos de um uso:
//           nome, acao, custo (PE), custoDia (custo sobe +1 por uso no dia), custoPorAtaque,
//           ef + dura ('cena' | 'rodada' | 'proxima')  → vira Efeito ativo
//           peTemp (n) | pvTemp (fórmula)               → recursos temporários
//           rolar { f, rotulo, aplicar: 'curaPV' | 'danoPV' | 'danoMental' | 'carga' | 'tabela' }
//           tabela { valor: { texto, destroi } }        → resultado do dado decide
//           teste { pericia, dt, porUso, falha: { texto, condicao, dano: { f, tipo }, destroi }, falhaPor5 }
//           pedeDano 'metade' | 'paraPV' | 'encher'      → pergunta o dano sofrido
//           usaCarga (gasta a carga guardada) · consome (gasta 1 unidade) · destroi
//           nota (texto exibido depois do uso)

const FIS = { acrobacia: 5, crime: 5, furtividade: 5, iniciativa: 5, pilotagem: 5, pontaria: 5, reflexos: 5, atletismo: 5, luta: 5, fortitude: 5 };

export const CONJURACAO = 'Acessório amaldiçoado: Conjuração';
export const AMALDICOADOS = {
  // ───────── Livro de Regras · Sangue ─────────
  'Pérola de Sangue': { el: 'sangue', usos: [
    { nome: 'Absorver a pérola', acao: 'movimento', ef: { pericia: FIS }, dura: 'cena', consome: true, nota: '+5 em testes de Agilidade, Força e Vigor até o fim da cena. No fim da cena, use "Fim da cena: Fortitude".' },
    { nome: 'Fim da cena: Fortitude DT 20', acao: 'livre', teste: { pericia: 'fortitude', dt: 20, falha: { texto: 'Fatigado até o fim do dia.', condicao: 'fatigado' }, falhaPor5: { texto: 'Parada cardíaca: fica morrendo. Se morrer assim, vira uma criatura de Sangue.', condicao: 'morrendo' } } },
  ] },
  'Coração Pulsante': { el: 'sangue', vestir: 'Empunhado', nota: 'Precisa ser drenado uma vez por dia.', usos: [
    { nome: 'Espremer: dano à metade', acao: 'reação', pedeDano: 'metade', teste: { pericia: 'fortitude', dt: 15, porUso: 5, falha: { texto: 'O coração é destruído.', destroi: true } } },
  ] },
  'Coroa de Espinhos': { el: 'sangue', vestir: 'Vestida (após 1 semana)', nota: 'Enquanto vestida, você não recupera Sanidade descansando.', usos: [
    { nome: 'Dano mental vira dano de Sangue', acao: 'reação', pedeDano: 'paraPV', nota: 'Uma vez por rodada.' },
  ] },
  'Frasco de Vitalidade': { el: 'sangue', usos: [
    { nome: 'Encher com seu sangue (até 20)', acao: '1 minuto', pedeDano: 'encher' },
    { nome: 'Beber o conteúdo', acao: 'padrão', usaCarga: 'curaPV', teste: { pericia: 'fortitude', dt: 20, falha: { texto: 'Enjoado por 1 rodada.', condicao: 'enjoado' } } },
  ] },
  'Punhos Enraivecidos': { el: 'sangue', vestir: 'Vestidos', nota: 'Ataques desarmados: +1d8 de dano de Sangue e dano letal.', usos: [
    { nome: 'Rolar +1d8 de Sangue', acao: 'livre', rolar: { f: '1d8', rotulo: 'DANO' } },
    { nome: 'Ataque desarmado extra', acao: 'livre', custoPorAtaque: 2, nota: 'Ao acertar: novo ataque contra o mesmo alvo. 2 PE por ataque já feito no turno (2, 4, 6…).' },
  ] },
  'Seringa de Transfiguração': { el: 'sangue', usos: [
    { nome: 'Sugar sangue de um adjacente', acao: 'padrão', nota: 'Alvo involuntário: acerte um ataque corpo a corpo.' },
    { nome: 'Fim do efeito: rolar 1d6', acao: 'livre', rolar: { f: '1d6', rotulo: 'EFEITO', aplicar: 'tabela' }, tabela: { 1: { texto: 'Resultado 1: volta traumática, o alvo perde 1 PV permanentemente.' } } },
  ] },
  // ───────── Livro de Regras · Morte ─────────
  'Amarras Mortais': { el: 'morte', usos: [
    { nome: 'Agarrar em alcance curto (+10)', acao: 'padrão', custo: 2, ef: { pericia: { luta: 10 } }, dura: 'proxima', nota: 'Alvo Grande ou menor. Ação de movimento para puxar o agarrado até ficar adjacente.' },
  ] },
  'Casaco de Lodo': { el: 'morte', vestir: 'Vestido', nota: 'Resistência 5 a corte, impacto, perfuração e Morte; vulnerável a balístico e Energia. Ajuste ao sofrer dano.' },
  'Vislumbre do Fim': { el: 'morte', vestir: 'Vestido', usos: [
    { nome: 'Ver a morte de um ser', acao: 'movimento', nota: 'Pessoas comuns: contador de tempo. Marcados e criaturas: pior resistência e vulnerabilidades (peça ao mestre).' },
  ] },
  'Frasco de Lodo': { el: 'morte', usos: [
    { nome: 'Ferimento recente: cura 6d8+20', acao: 'padrão', rolar: { f: '6d8+20', rotulo: 'CURA', aplicar: 'curaPV' }, consome: true },
    { nome: 'Ferimento antigo: moeda (d2)', acao: 'padrão', rolar: { f: '1d2', rotulo: 'EFEITO', aplicar: 'tabela' }, consome: true,
      tabela: { 1: { texto: 'Ímpar: a ferida infecciona.', segue: { f: '3d8+10', rotulo: 'DANO', aplicar: 'danoPV' } }, 2: { texto: 'Par: o Lodo cura.', segue: { f: '3d8+10', rotulo: 'CURA', aplicar: 'curaPV' } } } },
  ] },
  // ───────── Livro de Regras · Conhecimento ─────────
  'Coletora': { el: 'conhecimento', nota: 'Enquanto a portar, seu descanso é sempre ruim. Usar os PE exige portá-la há uma semana.', usos: [
    { nome: 'Apunhalar quem está morrendo', acao: 'completa', rolar: { f: '1d8', rotulo: 'PE', aplicar: 'carga' }, cargaMax: 20 },
    { nome: 'Usar os PE guardados', acao: 'livre', usaCarga: 'peTemp' },
  ] },
  'Crânio Espiral': { el: 'conhecimento', vestir: 'Empunhado', usos: [
    { nome: 'Ação padrão adicional', acao: 'livre', teste: { pericia: 'vontade', dt: 15, porUso: 5, falha: { texto: 'Recebe a ação, mas envelhece 1d4 anos e não pode mais usar o crânio hoje.', dano: { f: '1d4', tipo: 'anos' } } }, nota: 'Uma vez por rodada.' },
  ] },
  'Anéis do Elo Mental': { el: 'conhecimento', vestir: 'Ligados (após 24 h)', nota: 'Os dois portadores usam o melhor teste de Vontade, mas dividem dano mental e condições mentais e de medo.' },
  'Lanterna Reveladora': { el: 'conhecimento', usos: [
    { nome: 'Acender (luz de Terceiro Olho)', acao: 'padrão', custo: 1, dura: 'cena', ef: {}, nota: 'Criaturas de Sangue iluminadas preferem atacar você.' },
  ] },
  'Máscara das Pessoas nas Sombras': { el: 'conhecimento', vestir: 'Vestida', nota: 'Resistência a Conhecimento 10.', usos: [
    { nome: 'Saltar de sombra em sombra', acao: 'movimento', custo: 2, nota: 'Até outra sombra visível em alcance médio.' },
  ] },
  'Munição Jurada': { el: 'conhecimento', vestir: 'Em seu poder', passivo: { defesa: -2 }, nota: 'Obcecado: –2 na Defesa (já aplicado) e –2 em ataques contra outros alvos.', usos: [
    { nome: 'Disparar no alvo jurado', acao: 'padrão', ef: { ataque: 10 }, dura: 'proxima', rolar: { f: '6d12', rotulo: 'DANO' }, consome: true, nota: '+10 no ataque e margem de ameaça dobrada contra o alvo. O dano extra de Conhecimento foi rolado.' },
  ] },
  'Pergaminho da Pertinácia': { el: 'conhecimento', usos: [
    { nome: 'Encarar os sigilos (+5 PE temp.)', acao: 'padrão', peTemp: 5, teste: { pericia: 'ocultismo', dt: 15, porUso: 5, falha: { texto: 'O pergaminho se desfaz.', destroi: true } } },
  ] },
  // ───────── Livro de Regras · Energia ─────────
  'Arcabuz dos Moretti': { el: 'energia', nota: 'Também está em "Adicionar arma". +2 no ataque, dano de Energia, sem munição.', usos: [
    { nome: 'Rolar o dano do disparo (1d6)', acao: 'livre', rolar: { f: '1d6', rotulo: 'EFEITO', aplicar: 'tabela' }, tabela: Object.fromEntries(['2d4', '2d6', '2d8', '2d10', '2d12', '2d20'].map((f, i) => [i + 1, { texto: `Dano deste disparo: ${f}.`, segue: { f, rotulo: 'DANO' } }])) },
  ] },
  'Bateria Reversa': { el: 'energia', usos: [
    { nome: 'Drenar um aparelho', acao: 'padrão', custo: 2, teste: { pericia: 'ocultismo', dt: 15, porUso: 5, falha: { texto: 'A bateria explode: 12d6 de Energia em todos a até 3 m.', dano: { f: '12d6', tipo: 'pv' }, destroi: true } } },
    { nome: 'Recarregar um aparelho', acao: 'padrão', teste: { pericia: 'ocultismo', dt: 15, porUso: 5, falha: { texto: 'A bateria explode: 12d6 de Energia em todos a até 3 m.', dano: { f: '12d6', tipo: 'pv' }, destroi: true } } },
  ] },
  'Peitoral da Segunda Chance': { el: 'energia', vestir: 'Vestido', nota: 'Ao cair a 0 PV, usa 5 PE/PD. Em 1 no d10, o agente morre; do contrário, recupera 4d10 PV.' },
  'Relógio de Arnaldo': { el: 'energia', nota: 'Item único.', usos: [
    { nome: 'Rolar de novo um dado que deu 1', acao: 'livre', custo: 1, custoDia: true, nota: 'Uma vez por rodada. Custo +1 a cada uso no mesmo dia.' },
  ] },
  'Talismã da Sorte': { el: 'energia', vestir: 'Vestido', usos: [
    { nome: 'Sofri dano: tentar a sorte (1d4)', acao: 'reação', custo: 3, rolar: { f: '1d4', rotulo: 'EFEITO', aplicar: 'tabela' },
      tabela: { 1: { texto: 'Azar: você sofre o DOBRO do dano e o talismã vira cinzas.', destroi: true }, 2: { texto: 'Você evita todo o dano.' }, 3: { texto: 'Você evita todo o dano.' }, 4: { texto: 'Você evita o dano, mas o talismã vira cinzas.', destroi: true } } },
  ] },
  'Teclado de Conexão Neural': { el: 'energia', usos: [
    { nome: 'Plugar no computador', acao: 'movimento', ef: { pericia: { tecnologia: 10 } }, dura: 'cena', nota: '+10 para hackear, sem barreira de idioma, metade do tempo para achar arquivos.' },
    { nome: 'Rodada conectado: 1d6 mental', acao: 'livre', rolar: { f: '1d6', rotulo: 'DANO', aplicar: 'danoMental' } },
  ] },
  'Tela do Pesadelo': { el: 'energia', usos: [
    { nome: 'Armar a tela', acao: 'padrão', custo: 2, nota: 'Quem tocar faz Vontade (sua DT +5).' },
    { nome: 'Vítima falhou: 4d6 mental', acao: 'livre', rolar: { f: '4d6', rotulo: 'DANO' }, nota: 'A vítima fica atordoada e repete o teste a cada rodada.' },
  ] },
  'Veículo Energizado': { el: 'energia', usos: [
    { nome: 'Atravessar obstáculo', acao: 'reação', teste: { pericia: 'pilotagem', dt: 25, falha: { texto: 'O veículo não atravessa: colisão.' } } },
  ] },
  // ───────── Livro de Regras · Medo e variáveis ─────────
  'Jaqueta de Veríssimo': { el: 'medo', vestir: 'Vestida', nota: 'Resistência a dano paranormal 15. Item único.', usos: [
    { nome: 'Receber o dano de um aliado adjacente', acao: 'reação', custo: 2 },
  ] },
  'Dedo Decepado': { el: 'variavel', vestir: 'Vestido', nota: 'Após 7 dias contínuos, concede o poder vinculado. Dormir e relaxar resolvem o risco no Interlúdio. Se for visto, aplique −10 em Diplomacia.' },

  // ───────── Acessórios amaldiçoados (Livro de Regras p. 147) ─────────
  'Acessório amaldiçoado: Carisma': { el: 'conhecimento', vestir: 'Vestido', passivo: { atr: { pre: 1 }, semPE: 1 }, nota: 'Não dá PE. Preço: perde 2 SAN ao falhar em testes de Intelecto.' },
  'Acessório amaldiçoado: Sagacidade': { el: 'conhecimento', vestir: 'Vestido', passivo: { atr: { int: 1 } }, nota: 'Não dá perícias nem graus. Preço: perde 2 SAN ao falhar em testes de Intelecto.' },
  'Acessório amaldiçoado: Escudo Mental': { el: 'conhecimento', vestir: 'Vestido', passivo: { rdMental: 10 }, nota: 'Preço: perde 2 SAN ao falhar em testes de Intelecto.' },
  [CONJURACAO]: { el: 'conhecimento', vestir: 'Empunhado', nota: 'Guarda um ritual de 1º círculo (conjura como se conhecesse; se já conhece, –1 PE). Preço: perde 2 SAN ao falhar em testes de Intelecto.' },
  'Acessório amaldiçoado: Reflexão': { el: 'conhecimento', vestir: 'Vestido', nota: 'Preço: perde 2 SAN ao falhar em testes de Intelecto.', usos: [
    { nome: 'Refletir um ritual', acao: 'reação', custoPergunta: 'PE igual ao custo do ritual', nota: 'Uma vez por rodada.' },
  ] },
  'Acessório amaldiçoado: Defesa': { el: 'energia', vestir: 'Vestido', passivo: { defesa: 5 }, nota: 'Preço: perde 2 SAN ao falhar em testes de Agilidade.' },
  'Acessório amaldiçoado: Destreza': { el: 'energia', vestir: 'Vestido', passivo: { atr: { agi: 1 } }, nota: 'Preço: perde 2 SAN ao falhar em testes de Agilidade.' },
  'Acessório amaldiçoado: Potência': { el: 'energia', vestir: 'Vestido', passivo: { dtRitual: 1 }, nota: '+1 na DT de habilidades, poderes e rituais (o site soma nos rituais). Preço: perde 2 SAN ao falhar em testes de Agilidade.' },
  'Acessório amaldiçoado: Esforço Adicional': { el: 'morte', vestir: 'Vestido há 1 dia', diasMinimos: 1, passivo: { pe: 5 }, nota: 'Preço: perde 2 SAN ao falhar em testes de Presença.' },
  'Acessório amaldiçoado: Disposição': { el: 'sangue', vestir: 'Vestido', passivo: { atr: { vig: 1 } }, nota: 'Preço: perde 2 SAN ao falhar em testes de Vigor.' },
  'Acessório amaldiçoado: Pujança': { el: 'sangue', vestir: 'Vestido', passivo: { atr: { for: 1 } }, nota: 'Preço: perde 2 SAN ao falhar em testes de Vigor.' },
  'Acessório amaldiçoado: Vitalidade': { el: 'sangue', vestir: 'Vestido há 1 dia', diasMinimos: 1, passivo: { pv: 15 }, nota: 'Preço: perde 2 SAN ao falhar em testes de Vigor.' },
  [PROTECAO_ELEMENTAL]: { el: 'variavel', vestir: 'Vestido', nota: 'Resistência 10 contra o elemento escolhido. Preço: perde 2 SAN ao falhar em testes do atributo do elemento.' },

  // ───────── Sobrevivendo ao Horror (p. 57–61) ─────────
  'Conector de membros': { el: 'sangue', usos: [
    { nome: 'Religar membro decepado', acao: 'padrão', rolar: { f: '1d4', rotulo: 'EFEITO', aplicar: 'tabela' }, tabela: { 1: { texto: '25%: a parte ganha "vida própria" (perna: lento; braço: –1d20 em testes com ele; cabeça: 25% de ficar confuso em cenas tensas).' }, outro: { texto: 'Religado sem efeitos colaterais.' } }, nota: 'Até 3 rodadas após o ferimento. Morrendo ou morto: fica inconsciente com 1 PV.' },
  ] },
  "Dose d'A Praga": { el: 'sangue', usos: [
    { nome: 'Tomar a dose', acao: 'padrão', dura: 'cena', ef: {}, consome: true, nota: 'Arma de Sangue, Sangue de Ferro e Sangue Vivo até o fim da cena (anote os efeitos).' },
    { nome: 'Fim do efeito: Fortitude (DT 20 +5/dose)', acao: 'livre', teste: { pericia: 'fortitude', dt: 20, porUso: 5, falha: { texto: 'Mantém os poderes mais uma cena e fica sob Ódio Incontrolável.', dano: { f: '2d4', tipo: 'mental' } } } },
  ] },
  'Mandíbula agonizante': { el: 'sangue', usos: [
    { nome: 'Apertar e arremessar', acao: 'padrão', nota: 'Grita num raio de 30 m até o fim da cena. Criaturas de Sangue: Vontade DT 35 para não ir comê-la. Só reutilizável após uma cena de descanso.' },
  ] },
  'Retalho tenebroso': { el: 'sangue', vestir: 'No rosto', passivo: { dadosPericia: { diplomacia: -2, enganacao: -2, intimidacao: -2 } }, nota: 'Faro e visão no escuro; vulnerável a Morte; –2d20 em interação social (já aplicado). +1 cumulativo no dano por dia de uso.', usos: [
    { nome: 'Fim do dia: Fortitude (DT 15, +5/teste)', acao: 'livre', teste: { pericia: 'fortitude', dt: 15, porUso: 5, falha: { texto: 'O retalho se alimenta de você.', dano: { f: '1d6', tipo: 'pv' } } } },
    { nome: 'Arrancar o retalho', acao: 'padrão', teste: { pericia: 'fortitude', dt: 15, porUso: 5, falha: { texto: 'Não sai.', dano: { f: '1d6', tipo: 'pv' } } } },
  ] },
  'Ampulheta do tempo sofrido': { el: 'morte', vestir: 'Empunhada', usos: [
    { nome: 'Ganhar uma ação de interlúdio agora', acao: 'livre', custo: 5, nota: 'Não pode usar de novo até gastar uma ação de interlúdio para devolver o tempo.' },
  ] },
  'Injeção de Lodo': { el: 'morte', usos: [
    { nome: 'Injetar (você ou adjacente)', acao: 'padrão', dura: 'cena', ef: {}, consome: true, nota: 'Vulnerável a balístico e Energia; na próxima vez que cairia a 0 PV nesta cena, fica com 1 PV.' },
  ] },
  'Instantâneo mortal': { el: 'morte', vestir: 'Empunhado', usos: [
    { nome: 'Procurar pista com a foto (+1d20)', acao: 'livre', custo: 1, ef: { dadosTodas: 1 }, dura: 'proxima', nota: 'Só se a perícia tiver relação com a morte retratada (mestre decide).' },
  ] },
  'Projétil de Lodo, curto': { el: 'morte', nota: 'Todo o dano da arma vira Morte. No fim da cena a arma se degrada até se desfazer.', usos: [{ nome: 'Disparar', acao: 'padrão', consome: true }] },
  'Projétil de Lodo, longo': { el: 'morte', nota: 'Todo o dano da arma vira Morte. No fim da cena a arma se degrada até se desfazer.', usos: [{ nome: 'Disparar', acao: 'padrão', consome: true }] },
  'Rádio chiador': { el: 'morte', vestir: 'Ligado', nota: 'Chia se houver criatura paranormal em alcance extremo (direção e distância aproximadas). Atrai as criaturas que o ouvem. Pilhas: 12 h.' },
  'Câmera obscura': { el: 'conhecimento', usos: [
    { nome: 'Criatura falhou: 6d6 de frio', acao: 'livre', rolar: { f: '6d6', rotulo: 'DANO' }, nota: 'Só contra criaturas com invisibilidade, incorporeidade ou camuflagem. Lente de revelação com DT +10.' },
  ] },
  'Enxame fantasmagórico': { el: 'conhecimento', vestir: 'Vestido', nota: 'Invisível enquanto vestido.', usos: [
    { nome: 'Início do turno: 1 de dano mental', acao: 'automática', danoFixo: { n: 1, tipo: 'mental' } },
  ] },
  'Repositório do fracasso': { el: 'conhecimento', usos: [
    { nome: 'Criatura tirou 1 no d20 (+1 carga)', acao: 'automática', cargaMais: 1, cargaMax: 6 },
    { nome: 'Gastar 1 carga: recuperar 1d4 PE', acao: 'livre', usaCargaUm: true, rolar: { f: '1d4', rotulo: 'CURA', aplicar: 'curaPE' }, ef: { pericia: { vontade: -1 } }, dura: 'cena', nota: '–1 cumulativo em Vontade até o próximo interlúdio (desligue o efeito no interlúdio).' },
  ] },
  'Tablet do saber custoso': { el: 'conhecimento', vestir: 'Empunhado', usos: [
    { nome: 'Agir como treinado num teste', acao: 'livre', perdeSanAtributo: true, nota: 'Perde SAN igual ao atributo-chave da perícia.' },
  ] },
  'Arreio neural': { el: 'energia', vestir: 'Usando', usos: [
    { nome: 'Sofri 5+ de eletricidade/Energia: +1 PE', acao: 'automática', ganhaPE: 1, nota: 'Máximo por dia: o dobro do seu Vigor.' },
  ] },
  'Centrifugador existencial': { el: 'energia', usos: [
    { nome: 'Dividir-se: turno extra', acao: 'padrão', custo: 3, teste: { pericia: 'ocultismo', dt: 15, porUso: 5, falha: { texto: 'Separado em nível energético: perde metade dos atributos (recupera 1 de cada por interlúdio).' } }, nota: 'Turno extra na última contagem de iniciativa. No fim da rodada, sorteie qual versão some (moeda d2).' },
  ] },
  'Espelho refletor': { el: 'energia', usos: [
    { nome: 'Observar fora do ângulo (+1d20)', acao: 'movimento', ef: { dadosPericia: { percepcao: 1 } }, dura: 'proxima', nota: 'Ponto em alcance médio; chance de ver até atrás de cobertura total.' },
    { nome: 'Sacrificar: refletir dano de Energia', acao: 'reação', destroi: true },
  ] },
  'Fuzil alheio': { el: 'energia', nota: 'Também está em "Adicionar arma" (2d10, 17/x3, extremo, dano de Energia, sem munição).' },
  'A Primeira Adaga': { el: 'medo', usos: [
    { nome: 'Usar como componente ritualístico', acao: 'livre', perdeMetadePV: true, nota: 'O ritual recebe os efeitos dos catalisadores ampliador, perturbador, potencializador e prolongador, e conjura em 1 rodada.' },
  ] },

  // ───────── Arquivos Secretos ─────────
  'Faca Predadora': { el: 'sangue', nota: 'Também está em "Adicionar arma".', usos: [
    { nome: 'Acertou com 2 PE: recuperar 2d10 PV', acao: 'livre', custo: 2, rolar: { f: '2d10', rotulo: 'CURA', aplicar: 'curaPVExcesso' } },
  ] },
  'Machado do Mutilador': { el: 'sangue', nota: 'Também está em "Adicionar arma".', usos: [
    { nome: 'Deixar o alvo sangrando', acao: 'livre', custo: 1, nota: 'Acumula: 1d6 de dano por sangramento.' },
  ] },
  'Elmo do Colosso': { el: 'energia', vestir: 'Vestido', passivo: { rd: 5 }, nota: 'Com o escafandro completo, conta como traje de mergulho.' },
  'Manoplas do Colosso': { el: 'energia', nota: 'Também estão em "Adicionar arma". Seguem as regras de ataque desarmado.' },
  'Punhal X': { el: 'conhecimento', nota: 'Também está em "Adicionar arma".', usos: [
    { nome: 'Alvo desprevenido; cego se acertar', acao: 'livre', custo: 2, nota: 'Cego por 1 rodada, uma vez por cena por alvo.' },
  ] },
  'Sniper Fantasma': { el: 'morte', nota: 'Também está em "Adicionar arma". Veterano em Pontaria mirando: +5 na margem.' },
  'A Antena': { el: 'variavel', vestir: 'Empunhada', passivo: { dtRitual: 3 }, nota: 'DT dos rituais +3 (já aplicado). Pode guardar um ritual conjurado nela.', usos: [
    { nome: 'Liberar o ritual guardado', acao: 'padrão', nota: 'Sem gastar PE nem ações de conjuração.' },
  ] },
  'Catalisador Sofisticado e Horrorizado': { el: 'variavel', vestir: 'Vestido', usos: [
    { nome: 'Início da cena: receber 3d6', acao: 'livre', rolar: { f: '3d6', rotulo: 'EFEITO' }, nota: 'Gaste 1d6 por ritual: +1d6 no dano, na cura ou na DT. Sobras somem no fim da cena.' },
    { nome: 'Gastar 1d6 no ritual', acao: 'livre', rolar: { f: '1d6', rotulo: 'EFEITO' } },
  ] },
  'Crânio Dominador': { el: 'variavel', vestir: 'Empunhado', usos: [
    { nome: 'Correntes em até 2 alvos', acao: 'padrão', custo: 2, nota: 'Paralisados (Reflexos DT Pre evita). Corrente: Defesa 10, RD 10, 20 PV. Recarrega em 24 h.' },
  ] },
  'Gaiola do Corvo': { el: 'morte', usos: [
    { nome: 'Abrir a gaiola', acao: 'padrão', nota: '18 m viram Lodo (terreno difícil).' },
    { nome: 'Início da rodada: 3d10 de Morte', acao: 'livre', rolar: { f: '3d10', rotulo: 'DANO' }, nota: 'Em todos no Lodo (Fortitude DT Vig reduz à metade).' },
  ] },
  'Camiseta Psikolera': { el: 'sangue', vestir: 'Vestida', nota: 'Machucado: +2d8 de dano de Sangue em todas as rolagens de dano.', usos: [
    { nome: 'Rolar +2d8 de Sangue', acao: 'livre', rolar: { f: '2d8', rotulo: 'DANO' } },
  ] },
  'Dupla Obsessiva': { el: 'sangue', nota: 'Maça e florete também estão em "Adicionar arma".', usos: [
    { nome: 'Virar o alvo no lugar de um aliado', acao: 'reação', custo: 2 },
    { nome: 'Contra-atacar com a maça', acao: 'reação', custo: 2 },
  ] },
  'Bloody Mary Batizada': { el: 'sangue', usos: [
    { nome: 'Beber', acao: 'padrão', rolar: { f: '2d4', rotulo: 'DANO', aplicar: 'danoMental' }, consome: true, nota: 'Remove uma condição mental ou de medo (desmarque em Condições).' },
  ] },
  'Granada Ctrl+C Ctrl+V': { el: 'energia', usos: [
    { nome: 'Arremessar (8d6 de Energia)', acao: 'padrão', rolar: { f: '8d6', rotulo: 'DANO' }, consome: true, nota: 'Raio 6 m, Reflexos DT Agi reduz à metade.' },
    { nome: 'Copiar? (1d4: par explode de novo)', acao: 'livre', rolar: { f: '1d4', rotulo: 'EFEITO', aplicar: 'tabela' }, tabela: { 2: { texto: 'Par: nova explosão na área.', segue: { f: '8d6', rotulo: 'DANO' } }, 4: { texto: 'Par: nova explosão na área.', segue: { f: '8d6', rotulo: 'DANO' } }, outro: { texto: 'Ímpar: fim das cópias.' } } },
  ] },
  'Faixas da Vidência': { el: 'morte', vestir: 'Vestidas', passivo: { pericia: { intimidacao: 2 } }, nota: '+5 na Defesa e resistências contra efeitos de alcance médio, –5 contra efeitos de além de 9 m. +2 em Intimidação (já aplicado).', usos: [
    { nome: 'Procurar pista (+2)', acao: 'livre', custo: 1, ef: { todasPericias: 2 }, dura: 'proxima' },
  ] },
  'Joias da Mente': { el: 'conhecimento', vestir: 'Vestidas (as duas peças)', passivo: { pericia: { diplomacia: 2 }, rdMental: 10 } },
  'Larva da Fúria': { el: 'sangue', usos: [
    { nome: 'Engolir: fúria', acao: 'movimento', ef: { ataque: 4, dano: 4 }, dura: 'cena', consome: true, nota: '+4 em ataque e dano corpo a corpo; sem Furtividade nem rituais. Acaba se uma rodada passar sem atacar nem ser alvo hostil.' },
  ] },
  'Skate Caótico': { el: 'energia', usos: [
    { nome: 'Modo escudo (+5 Defesa)', acao: 'movimento', ef: { defesa: 5 }, dura: 'cena' },
    { nome: 'Modo transporte (+3 m)', acao: 'movimento', ef: { desl: 3 }, dura: 'cena', nota: 'Exige treino em Acrobacia, Atletismo ou Pilotagem.' },
  ] },
  'Tênis Lépidos': { el: 'energia', vestir: 'Vestidos', passivo: { pericia: { atletismo: 12 }, desl: 3 }, usos: [
    { nome: 'Mover-se sobrenaturalmente', acao: 'livre', custo: 2, nota: 'Até o fim do turno: ignora terreno difícil, escala e ignora queda de até 9 m.' },
  ] },
  'Anel Invertido': { el: 'morte', vestir: 'Vestido', usos: [
    { nome: 'Dano de nidere: RD 4d10', acao: 'reação', custo: 2, rolar: { f: '4d10', rotulo: 'EFEITO' } },
  ] },
  'Carranca Caçadora': { el: 'variavel', usos: [{ nome: 'Seguir o rastro (10 min)', acao: 'padrão', nota: 'O caminho indicado é sempre o mais perigoso.' }] },
  'Cajado da Cruz de Sangue': { el: 'sangue', vestir: 'Empunhado', nota: 'Ocultista que conhece ritual de Sangue: rituais e poderes de Sangue custam –1 PE, DT +1 e +1 dado de dano (ajuste ao conjurar).' },
  'Pé de Coelho': { el: 'variavel', vestir: 'Vestido', usos: [
    { nome: 'Soprar a pata (+1d4 nos testes)', acao: 'movimento', rolar: { f: '1d4', rotulo: 'EFEITO', aplicar: 'tabela' }, tabela: { 1: { texto: 'Ímpar: acidente com o pé.', segue: { f: '1d4', rotulo: 'DANO', aplicar: 'danoPV' } }, 3: { texto: 'Ímpar: acidente com o pé.', segue: { f: '1d4', rotulo: 'DANO', aplicar: 'danoPV' } }, outro: { texto: 'Par: sem acidente.' } }, nota: 'Uma vez por cena: some +1d4 em todos os testes até o fim da cena (use a bandeja).' },
  ] },
  'Sal Dourado': { el: 'conhecimento', usos: [{ nome: 'Fazer uma linha ou círculo', acao: 'padrão', nota: 'Criatura de Sangue VD 80 ou menos: Vontade DT 20 para atravessar.' }] },
  'Terço Maculado': { el: 'sangue', vestir: 'Vestido (não sai)', usos: [
    { nome: 'Agir pela súplica (+2d10)', acao: 'livre', rolar: { f: '2d10', rotulo: 'EFEITO' } },
    { nome: 'Agir contra a súplica / tentar tirar', acao: 'livre', rolar: { f: '2d10', rotulo: 'DANO', aplicar: 'danoPV' } },
  ] },
};

// lista de nomes, para o botão "Adicionar item amaldiçoado"
export const NOMES_AMALDICOADOS = Object.keys(AMALDICOADOS);

export function passivoAmaldicoado(item, nome, elemento) {
  const def = AMALDICOADOS[nome];
  if (def?.diasMinimos && (item.diasVestido || 0) < def.diasMinimos) return null;
  if (nome === PROTECAO_ELEMENTAL && ELEMENTOS_MALDICAO.includes(elemento)) return { rdElemento: { [elemento]: 10 } };
  return def?.passivo;
}

// efeito passivo dos itens marcados (ativo) — usado pelo motor de regras
export function passivosDeItens(ficha) {
  const out = [];
  const vistos = new Set();
  for (const it of ficha.itens || []) {
    if (!it.ativo || !it.qtd || vistos.has(it.nome)) continue;
    const passivo = passivoAmaldicoado(it, it.nome, it.elementoMaldicao);
    if (!passivo) continue;
    vistos.add(it.nome);
    out.push({ fonte: it.nome, ...passivo });
  }
  return out;
}

// ═══════════ preco-maldicao ═══════════
export function registrarMaldições(ficha, itemUsado) {
  const registrar = (chave, el) => {
    if (ELEMENTOS_MALDICAO.includes(el)) ficha.maldicoesAceitas[chave] ??= el;
  };
  const registrarCopias = (prefixo, entradas) => {
    const contagem = new Map();
    for (const [id, el] of entradas) {
      if (!ELEMENTOS_MALDICAO.includes(el)) continue;
      const chave = prefixo + id, n = (contagem.get(chave) || 0) + 1;
      contagem.set(chave, n);
      registrar(n === 1 ? chave : `${chave}:${n}`, el);
    }
  };
  for (const i of ficha.itens) {
    if (i.qtd && (i.escrito || i.ativo)) registrarCopias('item:' + i.uid + ':', (i.maldicoes || []).map((n, k) => {
      const nome = n.replace('Acessório amaldiçoado: ', '').replace(/\s+/g, '-');
      const el = n === PROTECAO_ELEMENTAL ? i.elementosMaldicoes?.[k] : AMALDICOADOS[n]?.el;
      return [n === PROTECAO_ELEMENTAL ? `${nome}:${el}` : nome, el];
    }));
    if (!i.qtd || (!i.ativo && i !== itemUsado)) continue;
    const el = AMALDICOADOS[i.nome]?.el;
    if (i.nome === PROTECAO_ELEMENTAL) { registrar(`item:${i.uid}:${i.elementoMaldicao}`, i.elementoMaldicao); continue; }
    registrar('item:' + i.uid, el === 'variavel' || !el
      ? PODER_PARANORMAL[i.poderDedo]?.elemento || RITUAIS.find(r => r.id === i.ritualSelo)?.elemento
      : el);
  }
  for (const p of ficha.protecoes.filter(p => p.vestida)) {
    registrarCopias('protecao:' + p.uid + ':', p.mods.map(m => [m, MODIFICACAO[m]?.maldicao]));
  }
  if (itemUsado && ficha.armas.some(a => a.uid === itemUsado.uid)) {
    registrarCopias('arma:' + itemUsado.uid + ':', (itemUsado.mods || []).map(m => [m, MODIFICACAO[m]?.maldicao]));
    if (itemUsado.maldicao?.tipo === 'propria') registrar('arma:' + itemUsado.uid + ':propria', itemUsado.maldicao.elemento);
  }
}

export function cobrarMaldição(ficha, derivada, atributo) {
  registrarMaldições(ficha);
  const elemento = { int: 'conhecimento', agi: 'energia', pre: 'morte', for: 'sangue', vig: 'sangue' }[atributo];
  const perda = 2 * Object.values(ficha.maldicoesAceitas).filter(el => el === elemento).length;
  if (perda) {
    const recurso = derivada.pd ? 'pd' : 'san';
    ficha.recursos[recurso] = derivada.atual[recurso] - perda;
  }
  return perda;
}
