export function iniciarTurno(ficha) {
  ficha.gastoTurno = 0;
  ficha.efeitos = ficha.efeitos.filter(efeito => efeito.dura !== 'rodada');
}

export function encerrarTurno(ficha) {
  for (const [id, prazo] of Object.entries(ficha.prazosCondicao || {})) {
    if (prazo > 1) ficha.prazosCondicao[id]--;
    else {
      ficha.condicoes = ficha.condicoes.filter(c => c !== id);
      delete ficha.prazosCondicao[id];
    }
  }
}

export function fimDeCena(ficha) {
  ficha.efeitos = [];
  const permanentes = new Set(['doente', 'petrificado', 'envenenado', 'asfixiado', 'inconsciente', 'morrendo', 'enlouquecendo']);
  ficha.condicoes = ficha.condicoes.filter(c => permanentes.has(c) && !ficha.prazosCondicao?.[c]);
  ficha.prazosCondicao = {};
  ficha.turnoManualIniciado = false;
  ficha.itens = ficha.itens.filter(i => !i.expiraCena);
  ficha.gastoTurno = 0;
  ficha.recursos.peTemp = 0;
  ficha.usosCena = {};
  ficha.recursos.morrendo = 0;
  ficha.recursos.enlouquecendo = 0;
}
