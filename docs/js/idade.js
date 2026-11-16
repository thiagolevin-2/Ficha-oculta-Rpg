export const FAIXAS_IDADE = [
  { id: 'crianca', nome: 'Criança', min: 9, max: 12, origem: 1, base: { for: 0, vig: 0 }, teto: { for: 1, vig: 1 } },
  { id: 'adolescente', nome: 'Adolescente', min: 13, max: 16, origem: 2, base: { for: 0 }, teto: { for: 2 } },
  { id: 'jovem', nome: 'Jovem', min: 17, max: 24 },
  { id: 'adulto', nome: 'Adulto', min: 25, max: 44, peso: 1 },
  { id: 'maduro', nome: 'Maduro', min: 45, max: 64, peso: 2, nex: 5 },
  { id: 'idoso', nome: 'Idoso', min: 65, max: Infinity, peso: 3, nex: 10 },
];

export const PESOS_IDADE = {
  catarata: ['Catarata', '−5 em Percepção e Pontaria.'],
  definhamento: ['Definhamento', '−5 em Fortitude e manobras.'],
  devagar: ['Devagar, Jovem!', '−3 m de deslocamento. Sem investidas.'],
  distraido: ['Distraído', 'Surpreendido na primeira rodada de ação e perde o primeiro turno de investigação.'],
  fragil: ['Frágil', '−2 PV por etapa de NEX.'],
  gota: ['Gota', 'Sofre 1d6 de dano ao testar Agilidade ou esquivar.'],
  juntas: ['Juntas Duras', '−5 em Acrobacia e Reflexos.'],
  melancolico: ['Melancólico', '−1 PE por etapa de NEX.'],
  meuTempo: ['No Meu Tempo', '−5 em Intuição e Vontade.'],
  pulmao: ['Pulmão Ruim', 'Sofre 1d6 de dano ao testar Força. Testa Fortitude desde a primeira rodada sem respirar. Investir causa fadiga até o fim da cena.'],
  rabugento: ['Rabugento', '−5 em testes de Presença, exceto Intimidação.'],
  recurvado: ['Recurvado', 'Tamanho Pequeno, sem bônus de Furtividade.'],
  sono: ['Sono Ruim', 'Qualidade do descanso uma categoria abaixo.'],
  teimoso: ['Teimoso', 'Sem bônus por ajuda, para dar ou receber.'],
  tosse: ['Tosse', 'Role 1d6 no começo da rodada de ação ou investigação. Em 1, perde o turno. Em interpretação, role em testes de perícia de Presença. Em 1, sofre −5.'],
};

export function faixaEtaria(ficha) {
  if (!ficha.opcionais?.idade || !/^\d+$/.test(String(ficha.idade).trim())) return undefined;
  const anos = Number(ficha.idade);
  return FAIXAS_IDADE.find(faixa => anos >= faixa.min && anos <= faixa.max);
}

export const temPeso = (ficha, id) => !!faixaEtaria(ficha)?.peso && ficha.pesosIdade?.includes(id);
export const origemAtiva = ficha => !faixaEtaria(ficha)?.origem || ficha.beneficiosOrigem?.includes('poder');
export const tetoEtario = (ficha, atributo, teto) => Math.min(teto, faixaEtaria(ficha)?.teto?.[atributo] ?? teto);
export const aumentoPermitido = (ficha, atributo, teto) => (
  (faixaEtaria(ficha)?.id !== 'idoso' || ['int', 'pre'].includes(atributo))
  && ficha.atributos[atributo] < tetoEtario(ficha, atributo, teto)
);
