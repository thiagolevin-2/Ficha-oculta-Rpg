// Elementos visuais: nenhuma ligação com regras ou afinidade da ficha.
export const ELEMENTOS_VISUAIS = [
  { id: 'sangue', nome: 'Sangue', fundo: '#120b0e' },
  { id: 'morte', nome: 'Morte', fundo: '#101113' },
  { id: 'conhecimento', nome: 'Conhecimento', fundo: '#14120b' },
  { id: 'energia', nome: 'Energia', fundo: '#100c19' },
  { id: 'medo', nome: 'Medo', fundo: '#10141a' },
];
export function aplicarElemento(id) {
  const e = ELEMENTOS_VISUAIS.find(e => e.id === id) || ELEMENTOS_VISUAIS[0];
  document.documentElement.dataset.tema = 'noite';
  document.documentElement.dataset.elemento = e.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', e.fundo);
}
