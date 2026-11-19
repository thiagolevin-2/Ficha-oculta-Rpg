// Estado da tela da ficha que precisa ser lido e alterado por mais de um arquivo (abas, janelas e ações).
// Fica num objeto só, para ninguém ter uma cópia velha: quem muda, muda aqui.
export const estado = {
  dAtual: null,              // derivação da ficha que está sendo desenhada (para os botões "Usar")
  pelaVersatilidade: false,  // o próximo poder escolhido vem da Versatilidade
  conjAtual: null,           // ritual da janela de conjurar aberta ({ r, cat }), para a atualização ao vivo
  escolhaPendente: null,     // janela de escolha genérica aberta: { aoEscolher(valor) }
  macroExecutando: false,    // trava para não rodar duas macros ao mesmo tempo
};
