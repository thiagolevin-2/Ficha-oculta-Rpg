// Decoração por NEX: não altera regras, atributos, recursos ou afinidade.
import { nexDaFicha } from './regras.js?v=0.23';
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
// As tramas cruzam o dossiê por baixo dos cartões e aparecem nos vãos.
function travessias(etapa, elemento) {
  const partes = [];
  for (let i = 0; i < Math.ceil(etapa / 2); i++) {
    const y = 105 + i * 168;
    let eixo, ramo;
    if (elemento === 'sangue') {
      eixo = `M-45 ${y}C128 ${y - 90} 255 ${y + 94} 448 ${y + 66}S715 ${y - 35} 1045 ${y + 92}`;
      ramo = `M270 ${y + 34}Q299 ${y + 110} 395 ${y + 125}M698 ${y + 25}Q800 ${y - 70} 865 ${y - 67}`;
    } else if (elemento === 'energia') {
      eixo = `M-45 ${y}L166 ${y + 40} 258 ${y - 10} 390 ${y + 100} 588 ${y + 31} 681 ${y + 118} 812 ${y + 43} 1045 ${y + 96}`;
      ramo = `M390 ${y + 100}L457 ${y + 140} 565 ${y + 157}M812 ${y + 43}L871 ${y - 28} 976 ${y - 43}`;
    } else if (elemento === 'morte') {
      eixo = `M-60 ${y}C154 ${y - 100} 236 ${y + 164} 493 ${y + 68}S773 ${y - 54} 1050 ${y + 114}`;
      ramo = `M174 ${y + 22}c87 -81 181 15 112 63s-115 -19 -75 -47s78 16 42 25M812 ${y + 21}c90 -76 159 19 86 63s-119 -21 -64 -38`;
    } else if (elemento === 'conhecimento') {
      eixo = `M-45 ${y}H180V${y + 42}H348V${y + 84}H570V${y + 35}H790V${y + 106}H1045`;
      ramo = `M113 ${y}V${y + 101}H278M651 ${y + 35}V${y - 34}H740M854 ${y + 106}V${y + 152}H1000`;
    } else {
      eixo = `M-110 ${y}C230 ${y - 130} 338 ${y + 190} 630 ${y + 24}S891 ${y - 130} 1090 ${y + 102}`;
      ramo = `M-20 ${y + 40}C220 ${y - 35} 366 ${y + 217} 654 ${y + 82}S920 ${y - 24} 1050 ${y + 141}`;
    }
    partes.push(`<path class="infeccao-halo" d="${eixo}"/><path class="infeccao-eixo" d="${eixo}"/><path class="infeccao-ramo" d="${ramo}"/>`);
  }
  return `<svg class="travessia-infeccao" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none" stroke="currentColor">${partes.join('')}</svg>`;
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
    const x = lado === 0 ? 1.5 + (faixa % 2) * .5 : lado === 1 ? 98 + (faixa % 2) * .5 : 18 + (faixa * 8) % 63;
    const y = lado < 2 ? 9 + faixa * 10 : 13 + (faixa * 19) % 77;
    return `<i class="marca-infeccao" style="--x:${x}%;--y:${y}%;--rot:${(i * 37) % 120 - 60}deg;--atraso:-${i * 1.7}s"></i>`;
  }).join('');
  return `<div class="contaminacao-site" aria-hidden="true" data-estagio="${etapa}">${travessias(etapa, e)}${trama(etapa, e)}${selos}</div>`;
}
