export function parametrosFabricacao({ categoria, consumivel, improvisado, kit, mascate, propria }) {
  const improviso = Boolean(improvisado && !consumivel);
  return {
    acoes: consumivel || propria ? 1 : 2,
    quantidade: consumivel && propria ? 2 : 1,
    dt: 15 + 5 * categoria - (improviso ? mascate ? 10 : 5 : 0),
    penalidade: kit ? 0 : -5,
    improviso,
  };
}
