// armazenamento.js — salva tudo no navegador (localStorage). Sem servidor, sem login.
// Chaves: fichaoculta-fichas (agentes), fichaoculta-mestre (Área do Mestre), fichaoculta-tema, fichaoculta-rolagens.
import { normalizar } from './regras.js?v=0.40.0';
const CHAVE_FICHAS = 'fichaoculta-fichas';
const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v == null ? padrao : JSON.parse(v); } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn('Não consegui salvar', e); return false; } };

export function carregarFichas() {
  const lista = ler(CHAVE_FICHAS, []);
  return Array.isArray(lista) ? lista.slice(0, 200).map(normalizar) : [];
}
export function salvarFichas(fichas) { return gravar(CHAVE_FICHAS, fichas); }
export const carregarMestre = () => ler('fichaoculta-mestre', null);
export const salvarMestre = m => gravar('fichaoculta-mestre', m);
// A escolha é estética, global e independente da afinidade do personagem.
const ELEMENTOS_VISUAIS_VALIDOS = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];
export const carregarElemento = () => {
  try { const e = localStorage.getItem('fichaoculta-elemento'); return ELEMENTOS_VISUAIS_VALIDOS.includes(e) ? e : 'sangue'; }
  catch { return 'sangue'; }
};
// Animações: 'sistema' (segue o "reduzir movimento" do sistema) ou 'sempre' (ligadas mesmo assim)
export const carregarAnimacoes = () => { try { return localStorage.getItem('fichaoculta-animacoes') === 'sempre' ? 'sempre' : 'sistema'; } catch { return 'sistema'; } };
export const salvarAnimacoes = v => { try { localStorage.setItem('fichaoculta-animacoes', v === 'sempre' ? 'sempre' : 'sistema'); } catch {} };
export const salvarElemento = e => { if (!ELEMENTOS_VISUAIS_VALIDOS.includes(e)) return; try { localStorage.setItem('fichaoculta-elemento', e); } catch {} };
export const carregarRolagens = () => { const r = ler('fichaoculta-rolagens', []); return Array.isArray(r) ? r.slice(0, 60) : []; };
export const salvarRolagens = r => gravar('fichaoculta-rolagens', r.slice(0, 60));
export function espacoUsado() {
  try { let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('fichaoculta-')) t += (localStorage.getItem(k) || '').length; } return t; } catch { return 0; }
}
