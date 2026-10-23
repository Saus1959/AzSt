import { create } from 'zustand';

export const useLang = create((set) => ({
  lang: 'az',
  setLang: (lang) => {
    try { localStorage.setItem('lang', lang); } catch {}
    set({ lang });
  },
}));
