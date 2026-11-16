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

const ESPECIAIS = [
  [158, 'Coração Pulsante', 'Coroa de Espinhos', 'Frasco de Vitalidade', 'Pérola de Sangue', 'Punhos Enraivecidos', 'Seringa de Transfiguração', 'Amarras Mortais'],
  [159, 'Casaco de Lodo', 'Coletora', 'Crânio Espiral', 'Frasco de Lodo', 'Vislumbre do Fim', 'Anéis do Elo Mental', 'Lanterna Reveladora', 'Máscara das Pessoas nas Sombras'],
  [160, 'Munição Jurada', 'Pergaminho da Pertinácia', 'Arcabuz dos Moretti', 'Bateria Reversa', 'Peitoral da Segunda Chance', 'Relógio de Arnaldo', 'Talismã da Sorte', 'Teclado de Conexão Neural'],
  [161, 'Tela do Pesadelo', 'Veículo Energizado', 'Jaqueta de Veríssimo', 'Dedo Decepado'],
];

export const ITENS_ESPECIAIS = ESPECIAIS.flatMap(([pagina, ...nomes]) => nomes.map(nome => ({
  nome, fonte: 'LR', categoria: nome === 'Jaqueta de Veríssimo' ? 4 : 2, espacos: 1,
  grupo: 'Itens amaldiçoados especiais', paginaLivro: pagina,
  resumo: 'Consulte o efeito e as condições de uso no Livro de Regras.',
}))).concat([1, 2, 3, 4].map(circulo => ({
  nome: `Selo Paranormal (${circulo}º círculo)`, fonte: 'LR', categoria: circulo, espacos: 1,
  grupo: 'Itens amaldiçoados especiais', paginaLivro: 161, resumo: 'Anote o ritual contido no selo.',
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
  [2, 93, 'Faca Predadora', 4, 1],
  [3, 112, 'Bloody Mary Batizada', 2, 1], [3, 112, 'Paçoca', 0, 0.5],
  [3, 113, 'Crânio Dominador', 3, 1], [3, 114, 'Camiseta Psikolera', 2, 1],
  [3, 114, 'Dupla Obsessiva', 3, 2],
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
  grupo: `Arquivos Secretos · ${String(volume).padStart(2, '0')}`, resumo: 'Consulte as ações e os efeitos no acervo.',
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
