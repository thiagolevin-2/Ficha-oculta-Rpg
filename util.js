// util.js — pequenos ajudantes usados em todo o site (ideia do util.js do Arcana).
export const $ = (s, raiz = document) => raiz.querySelector(s);
export const $$ = (s, raiz = document) => [...raiz.querySelectorAll(s)];
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

// Escapa texto para colocar dentro de HTML (protege contra arquivos maliciosos)
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const comSinal = n => (n >= 0 ? '+' : '−') + Math.abs(n);
export const romano = n => ['0', 'I', 'II', 'III', 'IV'][n] ?? String(n);
export const numero = (v, min, max, padrao = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao; };
export const inteiro = (v, min, max, padrao = 0) => Math.round(numero(v, min, max, padrao));
export const semAcento = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function avisar(texto, erro = false) {
  const caixa = $('#avisos');
  if (!caixa) return;
  while (caixa.children.length >= 3) caixa.firstChild.remove();
  const a = document.createElement('div');
  a.className = 'aviso' + (erro ? ' erro' : '');
  a.textContent = texto;
  caixa.append(a);
  setTimeout(() => a.remove(), erro ? 6000 : 3200);
}

// Redesenha um elemento SEM tirar o foco do campo em que a pessoa está digitando
// (lição do Arcana: senão o teclado do celular fecha a cada letra).
export function htmlMantendoFoco(alvo, html) {
  const ativo = document.activeElement;
  const chave = ativo && alvo.contains(ativo) ? (ativo.id || ativo.dataset.campo || ativo.name) : null;
  const sel = chave && 'selectionStart' in ativo ? [ativo.selectionStart, ativo.selectionEnd] : null;
  const rolagens = $$('[data-guardar-rolagem]', alvo).map(e => [e.dataset.guardarRolagem, e.scrollLeft, e.scrollTop]);
  alvo.innerHTML = html;
  for (const [k, l, t] of rolagens) { const e = alvo.querySelector(`[data-guardar-rolagem="${k}"]`); if (e) { e.scrollLeft = l; e.scrollTop = t; } }
  if (!chave) return;
  const novo = alvo.querySelector(`#${CSS.escape(chave)}`) || alvo.querySelector(`[data-campo="${CSS.escape(chave)}"]`) || alvo.querySelector(`[name="${CSS.escape(chave)}"]`);
  if (novo) { novo.focus({ preventScroll: true }); if (sel && 'setSelectionRange' in novo) try { novo.setSelectionRange(...sel); } catch {} }
}

// Lê/grava num caminho "a.b.0.c" de um objeto
export function pegar(obj, caminho) { return caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
export function definir(obj, caminho, valor) {
  const partes = caminho.split('.');
  let o = obj;
  for (let i = 0; i < partes.length - 1; i++) { if (o[partes[i]] == null) o[partes[i]] = /^\d+$/.test(partes[i + 1]) ? [] : {}; o = o[partes[i]]; }
  o[partes.at(-1)] = valor;
}

export function baixarArquivo(nome, texto, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function escolherArquivo(aceita) {
  return new Promise(ok => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = aceita;
    i.addEventListener('change', () => ok(i.files[0] || null)); i.click();
  });
}
// Reduz uma imagem (retratos) para caber no localStorage
export function reduzirImagem(arquivo, lado = 360, qualidade = 0.82) {
  return new Promise((ok, erro) => {
    if (!arquivo || !/^image\/(png|jpeg|webp)$/.test(arquivo.type)) return erro(new Error('Use uma imagem PNG, JPG ou WEBP.'));
    const img = new Image(); const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => { URL.revokeObjectURL(url); erro(new Error('Não consegui abrir a imagem.')); };
    img.src = url;
  });
}
export const sigilo = (elemento, cor) => `<span class="sigilo" style="--img:url(assets/sigilo-${esc(elemento)}.svg);${cor ? `--cor:${cor}` : ''}" aria-hidden="true"></span>`;
// Imagem opcional (coloque o arquivo em docs/assets/imagens/): se não existir, some sem quebrar a tela
export const imagemOpcional = (src, classe = '', alt = '') => `<img src="${esc(src)}" class="${esc(classe)}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">`;
