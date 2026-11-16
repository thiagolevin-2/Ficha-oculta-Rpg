// Fichas de referência. As habilidades de texto são resolvidas pelo mestre.
export const AMEACAS_BASE = [
  {
    nome: 'Zumbi de Sangue', elemento: 'sangue', vd: 20,
    pv: 45, defesa: 17, desl: '9 m', atributos: { agi: 2, for: 2, int: 0, pre: 1, vig: 2 },
    iniciativa: 5, percepcao: 10, fortitude: 5, reflexos: 5, vontade: 5,
    sentidos: 'Percepção às cegas', resistencias: 'Balístico, impacto e perfuração 5, Sangue 10', vulnerabilidades: 'Morte',
    presenca: { dt: 15, dano: '2d6', nex: 25 },
    ataques: [{ nome: 'Garras (dois ataques na ação)', dados: 2, bonus: 5, dano: '1d6+5', alcance: 'Corpo a corpo' }],
    notas: 'Livro de Regras p. 202.',
  },
  {
    nome: 'Esqueleto de Lodo', elemento: 'morte', vd: 20,
    pv: 40, defesa: 14, desl: '6 m', atributos: { agi: 2, for: 2, int: 0, pre: 1, vig: 1 },
    reflexos: 5, sentidos: 'Percepção às cegas', resistencias: 'Corte, impacto e perfuração 5, Morte 10', vulnerabilidades: 'Energia',
    presenca: { dt: 14, dano: '2d4', nex: 25 },
    ataques: [{ nome: 'Garras (dois ataques na ação)', dados: 2, bonus: 5, dano: '2d6+2', alcance: 'Corpo a corpo' }],
    habilidades: 'Imortalidade: volta com 20 PV após 1d3 rodadas, salvo se a poça sofrer Fogo ou Energia. Espiral de Lodo: ação completa, atravessa até 9 m em linha reta e causa 2d10 de Morte no trajeto (Reflexos DT 14 reduz à metade).',
    notas: 'Livro de Regras p. 217.',
  },
  {
    tipo: 'Animal', nome: 'Cão de Guarda', vd: 10,
    pv: 12, defesa: 14, desl: '12 m', atributos: { agi: 2, for: 2, int: 0, pre: 1, vig: 2 },
    iniciativa: 5, percepcao: 10, fortitude: 5, reflexos: 5, sentidos: 'Faro e visão na penumbra',
    ataques: [{ nome: 'Mordida', dados: 2, bonus: 5, dano: '1d6+2', alcance: 'Corpo a corpo' }],
    habilidades: 'Se acertar a mordida, pode tentar derrubar com 2d20 +5.',
    notas: 'Livro de Regras p. 288. Sobrevivência +10.',
  },
];

AMEACAS_BASE.push({
  nome: 'Anulado', elemento: 'sangue', vd: 100,
  pv: 190, defesa: 25, desl: '9 m', atributos: { agi: 2, for: 3, int: 1, pre: 1, vig: 3 },
  iniciativa: 10, percepcao: 10, fortitude: 10, reflexos: 5, vontade: 10,
  sentidos: 'Visão no escuro. Percepção usa 3d20+10.',
  presenca: { dt: 20, dano: '4d6', nex: 45 },
  ataques: [
    { nome: 'Braços grotescos (dois ataques)', dados: 3, bonus: 15, dano: '1d8+10', nota: 'Impacto' },
    { nome: 'Mordida asquerosa', dados: 3, bonus: 15, dano: '1d10+10', nota: 'Sangue' },
  ],
  habilidades: 'Corpo Oscilante: olhar diretamente pela primeira vez causa 2d6 mental. Evitar olhar impõe −1 dado ao agir contra ele. Pode dividir os ataques entre até três alvos. Errar um ataque contra ele exige Reflexos DT 25 para evitar ser agarrado. Ao iniciar turno com um agarrado, causa 4d10 de Sangue e recupera metade do dano em PV.',
  notas: 'Arquivos Secretos nº 01, p. 53.',
});
