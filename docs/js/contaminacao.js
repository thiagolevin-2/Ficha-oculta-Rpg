// Decoração por NEX: não altera regras, atributos, recursos ou afinidade.
import { nexDaFicha } from './regras.js?v=0.18';
export function exposicaoVisual(ficha) {
  const valor = ficha ? Number(nexDaFicha(ficha)) : 0;
  const nex = Number.isFinite(valor) ? Math.max(0, Math.min(99, valor)) : 0;
  const etapa = Math.floor(nex / 10);
  return { nex, etapa, marcas: etapa * 3 };
}
export function aplicarContaminacao(ficha) {
  const { etapa } = exposicaoVisual(ficha);
  document.documentElement.dataset.contaminacao = String(etapa);
  document.documentElement.style?.setProperty('--nivel-infeccao', String(etapa));
  document.documentElement.style?.setProperty('--infeccao', String(etapa / 9));
}
function trama(etapa, elemento) {
  const d = 10 + etapa * 5;
  const partes = [];
  for (let n = 0; n < etapa; n++) {
    const y = 55 + n * 100;
    let path;
    if (elemento === 'sangue') path = `M0 ${y}C${d} ${y+10} ${d} ${y+45} ${d/2} ${y+65}S${d} ${y+100} ${d} ${y+125}`;
    else if (elemento === 'energia') path = `M0 ${y}L${d} ${y+15} ${d/3} ${y+32} ${d+10} ${y+54} ${d/2} ${y+75} M${d/3} ${y+32}L${d+15} ${y+22}`;
    else if (elemento === 'morte') path = `M0 ${y+20}C${d+30} ${y-20} ${d+40} ${y+75} ${d/2} ${y+65}S${d/2} ${y+5} ${d} ${y+25}S${d/2} ${y+55} ${d/2} ${y+38}`;
    else if (elemento === 'conhecimento') path = `M0 ${y}H${d}V${y+25}H${d/2}V${y+50}H${d+10} M${d/2} ${y+12}V${y+40}`;
    else path = `M0 ${y}C${d+30} ${y+20} 0 ${y+70} ${d} ${y+85}S0 ${y+110} 0 ${y+130}`;
    partes.push(`<path d="${path}"/><path d="${path}" transform="translate(1000 0) scale(-1 1)"/>`);
  }
  return `<svg class="trama-infeccao" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="1.2">${partes.join('')}</svg>`;
}
export function htmlContaminacao(ficha, elemento) {
  const { etapa, marcas } = exposicaoVisual(ficha);
  if (!etapa) return '';
  const elementos = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];
  const e = elementos.includes(elemento) ? elemento : 'sangue';
  const selos = Array.from({ length: marcas }, (_, i) => {
    const lado = i % 3, faixa = Math.floor(i / 3);
    // Somente a periferia do espaço de trabalho recebe marcas.
    const x = lado === 0 ? 1.5 + (faixa % 2) * .5 : lado === 1 ? 98 + (faixa % 2) * .5 : 18 + (faixa * 8) % 63;
    const y = lado < 2 ? 9 + faixa * 10 : faixa % 2 ? 97 : -4;
    return `<i class="marca-infeccao" style="--x:${x}%;--y:${y}%;--rot:${(i * 37) % 120 - 60}deg;--atraso:-${i * 1.7}s"></i>`;
  }).join('');
  return `<div class="contaminacao-site" aria-hidden="true" data-estagio="${etapa}">${trama(etapa, e)}${selos}</div>`;
}
