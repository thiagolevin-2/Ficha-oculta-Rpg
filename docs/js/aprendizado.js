export const RITUAIS_DE_TRILHA = {
  'canalizar-o-medo': 'conduite',
  'conhecendo-o-medo': 'graduado',
  'lamina-do-medo': 'lamina',
  'medo-tangivel': 'flagelador',
  'presenca-do-medo': 'intuitivo',
};

export const circuloDeAprender = nex => nex >= 75 ? 3 : nex >= 45 ? 2 : 1;

function cabemNosLimites(rituais, vagas) {
  const limites = vagas.slice().sort((a, b) => b - a);
  return rituais.slice().sort((a, b) => b - a).every((c, i) => c <= (limites[i] ?? 0));
}

export function problemaAoAprender(ficha, derivada, ritual) {
  const trilha = RITUAIS_DE_TRILHA[ritual.id];
  if (ficha.rituais.some(r => r.nome === ritual.nome)) return 'Ritual já conhecido.';
  if (ritual.fonte === 'SaH' && ficha.modo !== 'sah') return 'Este ritual pertence ao modo Sobrevivendo ao Horror.';
  if (trilha) return ficha.trilha === trilha && derivada.trilhaHabs.some(h => h.nivel === 20 && h.liberada)
    ? '' : 'Este ritual exige a habilidade final da trilha correspondente.';
  if (ritual.ritualExigido && !ficha.rituais.some(r => r.nome === ritual.ritualExigido)) return `Exige conhecer ${ritual.ritualExigido}.`;
  if (ritual.requerAfinidades && !ritual.requerAfinidades.every(el => derivada.afinidade === el)) return 'Falta afinidade com os elementos exigidos.';
  if (derivada.vagasEspecificas.includes(ritual.id)) return '';
  const niveis = ficha.rituais.filter(r => !r.proprio && !derivada.vagasEspecificas.includes(r.idCatalogo)).map(r => r.circulo);
  return cabemNosLimites([...niveis, ritual.circulo], derivada.vagasRituais)
    ? '' : 'Nenhuma vaga permite este círculo neste momento.';
}

export function viaPoder(ficha, d, poder) {
  if (poder.id === 'transcender' && d.transcenderSeparado) return d.transcenderes < d.limiteTranscender ? 'nex' : '';
  const possuiVivencia = d.faixa?.id === 'adulto' && ficha.classe !== 'mundano';
  const vivenciaUsada = ficha.poderes.some(p => p.via === 'vivencia');
  const vagasComuns = d.slotsPoder - Number(possuiVivencia) + Number(d.versatilidade && !ficha.escolhas.versatilidade);
  const comuns = ficha.poderes.filter(p => !p.via && p.id !== 'proprio' && !(p.id === 'transcender' && d.transcenderSeparado)).length;
  const total = comuns + Number(vivenciaUsada);
  if (total >= vagasComuns + Number(possuiVivencia)) return '';
  const elegivelVivencia = poder.classe === ficha.classe || poder.classe === 'todas';
  if (possuiVivencia && !vivenciaUsada && elegivelVivencia && poder.id !== 'transcender') return 'vivencia';
  return comuns + Number(!possuiVivencia && vivenciaUsada) < vagasComuns ? 'classe' : '';
}
