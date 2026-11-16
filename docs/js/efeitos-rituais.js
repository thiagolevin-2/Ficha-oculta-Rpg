const PERFIS = {
  'cicatrizacao': {
    basica: { formula: '3d8+3', cura: true, envelhece: true },
    discente: { formula: '5d8+5', cura: true, envelhece: true },
    verdadeiro: { formula: '7d8+7', cura: true, envelhece: true },
  },
  'decadencia': {
    basica: { formula: '2d8+2', teste: 'fortitude', sucesso: 'metade' },
    discente: { formula: '3d8+3', exigeAtaque: true },
    verdadeiro: { formula: '8d8+8', teste: 'fortitude', sucesso: 'metade' },
  },
  'esfolar': {
    basica: { formula: '3d4+3', teste: 'reflexos', sucesso: 'metade', condicao: 'sangrando' },
    discente: { formula: '5d4+5', teste: 'reflexos', sucesso: 'metade', condicao: 'sangrando' },
    verdadeiro: { formula: '10d4+10', teste: 'reflexos', sucesso: 'metade', condicao: 'sangrando', condicaoNoSucesso: 'sangrando' },
  },
  'desfazer-sinapses': {
    basica: { formula: '2d6+2', teste: 'vontade', sucesso: 'metade', condicao: 'frustrado', turnos: 1 },
    discente: { formula: '3d6+3', teste: 'vontade', sucesso: 'metade', condicao: 'frustrado', turnos: 1 },
    verdadeiro: { formula: '8d6+8', teste: 'vontade', sucesso: 'metade', condicao: 'esmorecido', condicaoNoSucesso: 'frustrado', turnos: 1 },
  },
  'eletrocussao': {
    basica: { formula: '3d6', teste: 'fortitude', sucesso: 'metade', condicao: 'vulneravel', turnos: 1 },
  },
  'definhar': {
    basica: { teste: 'fortitude', condicao: 'fatigado', condicaoNoSucesso: 'vulneravel' },
    discente: { teste: 'fortitude', condicao: 'exausto', condicaoNoSucesso: 'fatigado' },
    verdadeiro: { teste: 'fortitude', condicao: 'exausto', condicaoNoSucesso: 'fatigado' },
  },
};

export function perfilRitual(id, forma) {
  return PERFIS[id]?.[forma || 'basica'];
}

export function podeResolverRitual(id, formula, resistencia) {
  return Object.hasOwn(PERFIS, id) || !!(formula && /^(Fortitude|Reflexos|Vontade) (reduz|anula|evita)/i.test(resistencia));
}
