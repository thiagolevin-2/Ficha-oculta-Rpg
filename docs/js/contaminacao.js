// A exposição acompanha o NEX efetivo da ficha. A camada é só visual.
import { nexDaFicha } from './regras.js?v=0.23.3';

const ELEMENTOS = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];
const elementoVisual = id => ELEMENTOS.includes(id) ? id : 'sangue';

export function exposicaoVisual(ficha) {
  const valor = ficha ? Number(nexDaFicha(ficha)) : 0;
  const nex = Number.isFinite(valor) ? Math.max(0, Math.min(99, valor)) : 0;
  const etapa = Math.floor(nex / 10);
  return { nex, etapa, marcas: etapa * 3 };
}

export function aplicarContaminacao(ficha, elemento, raiz) {
  const { etapa } = exposicaoVisual(ficha);
  const el = elementoVisual(elemento);
  const chave = etapa ? `${el}:${etapa}` : '0';
  document.documentElement.dataset.contaminacao = String(etapa);
  document.documentElement.style?.setProperty('--nivel-infeccao', String(etapa));
  document.documentElement.style?.setProperty('--infeccao', String(etapa / 9));
  if (raiz && raiz.dataset.infeccao !== chave) {
    raiz.dataset.infeccao = chave;
    raiz.innerHTML = htmlContaminacao(ficha, el);
  }
}

const GEOMETRIA = {
  sangue: y => [
    `M-35 ${y - 18}C122 ${y - 146} 171 ${y + 98} 353 ${y + 23}S518 ${y - 58} 647 ${y + 16}S815 ${y + 113} 1035 ${y + 3}`,
    `M-15 ${y - 38}Q33 ${y - 26} 58 ${y + 38}T171 ${y + 93}M147 ${y + 4}Q212 ${y - 63} 247 ${y - 11}M821 ${y + 58}Q865 ${y + 122} 934 ${y + 142}M943 ${y + 38}Q959 ${y + 5} 1012 ${y - 24}`,
  ],
  morte: y => [
    `M-61 ${y + 38}C63 ${y - 114} 197 ${y + 130} 330 ${y + 43}S524 ${y - 80} 672 ${y + 6}S859 ${y + 122} 1054 ${y - 52}`,
    `M-20 ${y - 6}C82 ${y - 115} 166 ${y + 64} 222 ${y + 74}S475 ${y - 37} 521 ${y - 24}M737 ${y + 71}Q857 ${y + 134} 1017 ${y + 19}`,
  ],
  conhecimento: y => [
    `M-35 ${y + 22}H94L143 ${y - 17}H288L328 ${y + 40}H540L587 ${y + 4}H733L780 ${y + 57}H941L985 ${y + 18}H1040`,
    `M-14 ${y - 30}H56V${y - 78}H116M94 ${y + 22}V${y + 75}H231M733 ${y + 4}V${y - 57}H814M940 ${y + 57}V${y + 104}H1035`,
  ],
  energia: y => [
    `M-23 ${y - 71}L80 ${y + 10} 133 ${y - 6} 231 ${y + 61} 355 ${y + 22} 434 ${y + 45} 562 ${y - 32} 671 ${y + 8} 730 ${y - 35} 830 ${y + 58} 902 ${y + 32} 1023 ${y + 131}`,
    `M31 ${y - 29}L92 ${y - 53} 146 ${y - 29} 190 ${y - 85}M231 ${y + 61}L182 ${y + 90} 272 ${y + 113}M830 ${y + 58}L799 ${y + 111} 886 ${y + 124} 936 ${y + 210}M904 ${y + 33}L961 ${y - 7} 1015 ${y + 12}`,
  ],
  medo: y => [
    `M-88 ${y + 25}C187 ${y - 165} 233 ${y + 188} 531 ${y + 44}S823 ${y - 110} 1102 ${y + 77}`,
    `M-76 ${y + 62}C134 ${y - 41} 255 ${y + 145} 410 ${y + 106}S774 ${y - 39} 1072 ${y + 115}`,
  ],
};

function travessias(etapa, elemento) {
  const tracos = Array.from({ length: Math.ceil(etapa / 2) }, (_, i) => {
    const [eixo, ramo] = GEOMETRIA[elemento](99 + i * 185);
    return `<g style="--fase:${-2.4 * i}s">
      <path class="infeccao-halo" d="${eixo}"/>
      <path class="infeccao-eixo" d="${eixo}"/>
      <path class="infeccao-ramo" d="${ramo}"/>
      <path class="infeccao-fluxo" d="${eixo}" pathLength="100"/>
    </g>`;
  });
  return `<svg class="travessia-infeccao" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none">${tracos.join('')}</svg>`;
}

const RASTROS = {
  sangue: '<path d="M52 4C44 28 19 54 22 72c2 16 13 23 30 23 19 0 29-13 29-28C81 52 57 26 52 4Z" fill="currentColor"/><path d="M41 67q1 13 9 14" stroke="var(--surto-luz)" stroke-width="4" stroke-linecap="round"/>',
  morte: '<path d="M49 43c2-7 14-2 12 6-4 19-35 14-33-7 2-25 42-35 52-8 15 39-39 66-65 36C-4 48 8 14 33 6m35 87c19-7 28-22 30-39" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
  conhecimento: '<g stroke="currentColor" stroke-width="1.7" fill="none"><circle cx="50" cy="50" r="44" stroke-dasharray="2 4"/><circle cx="50" cy="50" r="35"/><path d="M50 11v78M11 50h78M25 25l50 50M75 25 25 75M50 27l19 23-19 23-19-23Z"/></g><circle cx="50" cy="50" r="4" fill="currentColor"/>',
  energia: '<path d="M44 9l-3 27L20 48l24 1-8 40 21-28 23-9-23-3L68 17 53 35Z" fill="currentColor"/><path d="M86 14v18m-9-9h18M14 65v17m-8-9h17" stroke="currentColor" stroke-width="2.4"/>',
  medo: '<g fill="none"><circle cx="50" cy="50" r="44" stroke="currentColor" stroke-width="1" opacity=".7"/><circle cx="50" cy="50" r="28" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="13" stroke="currentColor" stroke-width="4"/></g><circle cx="50" cy="50" r="9" fill="var(--fundo)"/>',
};

function rastros(etapa, elemento) {
  return Array.from({ length: etapa + 2 }, (_, i) => {
    const lado = i % 2;
    const x = lado ? 96 - (i % 3) * 3 : 2 + (i % 3) * 3;
    const y = 6 + (i * 19) % 87;
    const tamanho = 37 + etapa * 6 + (i % 3) * 16;
    return `<svg class="rastro-infeccao" viewBox="0 0 100 100" style="--x:${x}%;--y:${y}%;--tamanho:${tamanho}px;--fase:${-(i + 1) * 1.31}s">${RASTROS[elemento]}</svg>`;
  }).join('');
}

function camadaContaminacao(etapa, elemento) {
  if (!etapa) return '';
  const marcas = Array.from({ length: etapa * 3 }, (_, i) => {
    const lado = i % 3, linha = Math.floor(i / 3);
    const x = lado === 0 ? 2.4 + (linha % 3) * 3.1 : lado === 1 ? 96.8 - (linha % 3) * 3.1 : 19 + (linha * 19) % 68;
    const y = lado < 2 ? 9 + linha * 10 : 13 + (linha * 19) % 77;
    return `<i class="marca-infeccao" style="--x:${x}%;--y:${y}%;--rot:${(i * 37) % 120 - 60}deg;--fase:${-i * 1.41}s"></i>`;
  }).join('');
  return `<div class="contaminacao-site" data-infeccao-elemento="${elemento}" data-estagio="${etapa}" aria-hidden="true">
    <div class="atmosfera-infeccao"></div>${travessias(etapa, elemento)}${rastros(etapa, elemento)}${marcas}
  </div>`;
}

export function htmlContaminacao(ficha, elemento) {
  return camadaContaminacao(exposicaoVisual(ficha).etapa, elementoVisual(elemento));
}
