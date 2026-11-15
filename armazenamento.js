// armazenamento.js — salva tudo no navegador (localStorage). Sem servidor, sem login.
// Chaves: fichaoculta-fichas (agentes), fichaoculta-mestre (Área do Mestre), fichaoculta-tema, fichaoculta-rolagens.
import { normalizar } from './regras.js?v=0.9';

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
export const carregarTema = () => { try { return localStorage.getItem('fichaoculta-tema') || 'noite'; } catch { return 'noite'; } };
export const salvarTema = t => { try { localStorage.setItem('fichaoculta-tema', t); } catch {} };
export const carregarRolagens = () => { const r = ler('fichaoculta-rolagens', []); return Array.isArray(r) ? r.slice(0, 60) : []; };
export const salvarRolagens = r => gravar('fichaoculta-rolagens', r.slice(0, 60));
export function espacoUsado() {
  try { let t = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('fichaoculta-')) t += (localStorage.getItem(k) || '').length; } return t; } catch { return 0; }
}
