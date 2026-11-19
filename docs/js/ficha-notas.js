// Aba NOTAS: anotações e ações de interlúdio (fabricação).

import { parametrosFabricacao, faixaEtaria, temPeso, PESOS_IDADE, derivar, nexSeparado } from './regras.js?v=0.47';
import { OPCIONAIS_LIVRES, MODOS, OPCIONAIS, ELEMENTOS } from './catalogo.js?v=0.47';
import { esc, inteiro, uid } from './util.js?v=0.47';


import { rolarTesteUI, rolarDanoUI, abrirModal, fecharModal, proxima } from './rolagem.js?v=0.47';
import { cat } from './ficha-base.js?v=0.47';

// ---------- Aba NOTAS ----------
export const ACOES_INTERLUDIO = {
  dormir: 'Dormir', relaxar: 'Relaxar', revisar: 'Revisar caso', manutencao: 'Manutenção',
  alimentar: 'Alimentar-se', exercitar: 'Exercitar-se', ler: 'Ler',
};
export function blocoInterludio(f) {
  return `<section class="painel"><h2 class="faixa">Interlúdio</h2>
    <p>${f.interludio.acoes.map(a => ACOES_INTERLUDIO[a]).join(' · ') || 'Nenhuma ação usada'} · ${f.interludio.acoes.length}/2</p>
    <label class="campo"><span>Qualidade do descanso</span><select data-campo="interludio.descanso" data-tipo="int">${['Precária', 'Normal', 'Confortável', 'Luxuosa'].map((q, i) => `<option value="${i}" ${f.interludio.descanso === i ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
    <div class="linha" style="margin-top:8px">${Object.entries(ACOES_INTERLUDIO).map(([id, nome]) => `<button class="btn pequeno" data-acao="interludio-acao" data-id="${id}" ${f.interludio.acoes.length >= 2 || (id === 'relaxar' && f.interludio.acoes.includes(id)) ? 'disabled' : ''}>${nome}</button>`).join('')}
      <button class="btn pequeno fantasma" data-acao="interludio-reiniciar">Novo interlúdio</button></div>
    ${f.modo === 'sah' ? `<div class="linha"><button class="btn pequeno" data-acao="novo-projeto-fabricacao">Planejar fabricação</button></div>${f.projetosFabricacao.map((p, i) => `<div class="hab"><b>${esc(p.nome)}</b> · DT ${p.dt} · ${p.feitas}/${p.exigidas} ações ${p.improviso ? '· improvisado' : ''} <button class="btn pequeno" data-acao="avancar-fabricacao" data-i="${i}">${p.feitas >= p.exigidas ? 'Testar Profissão' : 'Gastar manutenção'}</button></div>`).join('')}` : ''}
    <p class="apagado">Dormir e relaxar calculam a recuperação da ficha. As outras ações ficam registradas para o mestre resolver.</p>
  </section>`;
}
export function abaNotas(f) {
  const area = (k, rot, ph, alto = 140) => `<label class="campo"><span>${rot}</span><textarea data-campo="${k}" id="f-${k}" placeholder="${esc(ph)}" style="min-height:${alto}px">${esc(f[k])}</textarea></label>`;
  return `<section class="painel"><h2 class="faixa">Dossiê do agente</h2>
    <div class="grade c2"><label class="campo"><span>Jogador(a)</span><input data-campo="jogador" id="f-jogador" value="${esc(f.jogador)}"></label><label class="campo"><span>Conceito</span><input data-campo="conceito" id="f-conceito" value="${esc(f.conceito)}"></label><label class="campo"><span>Idade</span><input data-campo="idade" id="f-idade" value="${esc(f.idade)}"></label>
    <label class="campo"><span>Elemento de conexão (NEX 50%)</span><select data-campo="elementoAfinidade"><option value="">Nenhum</option>${ELEMENTOS.filter(e => e.id !== 'variavel').map(e => `<option value="${e.id}" ${f.elementoAfinidade === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label></div>
    <div class="grade" style="margin-top:12px">${area('aparencia', 'Aparência', 'Como o agente se parece, marcas, roupas…', 90)}${area('historia', 'História', 'O que fazia antes, o primeiro contato com o paranormal…')}${area('notas', 'Anotações da missão', 'Pistas, nomes, lugares…', 220)}</div>
  </section>${blocoInterludio(f)}
  <section class="painel" style="margin-top:14px"><h2 class="faixa">Regras desta ficha</h2>
    <p><span class="etiqueta ${f.modo === 'sah' ? 'sah' : 'lr'}">${esc(MODOS[f.modo].nome)}</span></p>
    ${`<div class="opcionais">${Object.entries(OPCIONAIS).filter(([k]) => f.modo === 'sah' || OPCIONAIS_LIVRES.includes(k)).map(([k, o]) => `<label class="check opcional"><input type="checkbox" data-acao-check="opcional" data-k="${k}" ${f.opcionais[k] ? 'checked' : ''}><span><b>${esc(o.nome)}</b><small>${esc(o.resumo)}</small></span></label>`).join('')}</div>`}
      ${f.opcionais.idade ? `<div class="painel"><h3>${faixaEtaria(f)?.nome || 'Idade inválida ou em branco'}</h3>
      ${faixaEtaria(f)?.origem ? `<p>Benefícios da origem: ${f.beneficiosOrigem.length}/${faixaEtaria(f).origem}. <button class="btn pequeno" data-acao="revisar-origem-idade">Revisar benefícios</button></p>` : ''}
      ${faixaEtaria(f)?.peso ? `<p>${f.pesosIdade.length}/${faixaEtaria(f).peso} desvantagens</p><div class="grade c2">${Object.entries(PESOS_IDADE).map(([id, [nome, efeito]]) => `<label class="check hab"><input type="checkbox" data-acao-check="peso-idade" data-id="${id}" ${f.pesosIdade.includes(id) ? 'checked' : ''} ${f.pesosIdade.length >= faixaEtaria(f).peso && !f.pesosIdade.includes(id) ? 'disabled' : ''}><span><b>${nome}</b> <small>${efeito}</small></span></label>`).join('')}</div>` : ''}
    </div>` : ''}
    ${f.elementoAfinidade ? `<label class="check opcional"><input type="checkbox" data-acao-check="afinidade-ativa" ${f.afinidadeAtiva ? 'checked' : ''}><span><b>Afinidade desenvolvida</b><small>Livro de Regras p. 124: depois de se conectar ao elemento em NEX 50%, a afinidade se desenvolve na primeira vez que você transcende (recebe um poder paranormal). O site marca sozinho; use para corrigir.</small></span></label>` : ''}
    ${nexSeparado(f) ? `<label class="check opcional"><input type="checkbox" data-acao-check="opcional" data-k="transcenderSan" ${f.opcionais.transcenderSan ? 'checked' : ''}><span><b>Transcender custa Sanidade (interpretação mais dura)</b><small>Com NEX separado, a Sanidade vem do nível e o livro não diz o que o Transcender tira. Padrão do site: não tira nada. Marcando, cada Transcender tira a Sanidade de um nível.</small></span></label>` : ''}
    <div class="linha" style="margin-top:14px"><button class="btn" data-acao="duplicar-ficha">Duplicar ficha</button><button class="btn perigo" data-acao="apagar-ficha">Apagar agente</button></div>
  </section>`;
}
// Ações (botões data-acao) da aba
export function acoesNotas(ctx, h) {
  const { f, salvar, quem } = h;
  return {
        'novo-projeto-fabricacao': () => {
      const ficha = f(), d = derivar(ficha);
      if (ficha.modo !== 'sah' || !d.PER.profissao.grau) return ctx.avisar('Fabricação em campo exige treino na Profissão apropriada.');
      if (ficha.projetosFabricacao.length >= 20) return ctx.avisar('Finalize um projeto antes de começar outro.');
      abrirModal('Fabricação de equipamento geral', `<p>O mestre aprova a profissão, materiais e equipamento. O resultado é um item de inventário.</p>
        <label class="campo"><span>Nome</span><input id="fabricacao-nome" maxlength="80"></label>
        <label class="campo"><span>Categoria</span><select id="fabricacao-categoria">${[0,1,2,3,4].map(c => `<option value="${c}">${cat(c)}</option>`).join('')}</select></label>
        <label class="campo"><span>Espaços</span><input type="number" min="0" max="20" id="fabricacao-espacos" value="1"></label>
        <label class="check"><input type="checkbox" id="fabricacao-kit"> Kit da profissão</label>
        <label class="check"><input type="checkbox" id="fabricacao-consumivel"> Consumível</label>
        <label class="check"><input type="checkbox" id="fabricacao-improvisada"> Improvisado</label>`,
        '<button class="btn sangue" data-acao="registrar-fabricacao">Registrar projeto</button>');
    },
        'registrar-fabricacao': () => {
      const ficha = f(), d = derivar(ficha);
      const nome = document.getElementById('fabricacao-nome')?.value.trim();
      if (!nome || ficha.projetosFabricacao.length >= 20 || ficha.modo !== 'sah' || !d.PER.profissao.grau) return;
      const categoria = inteiro(document.getElementById('fabricacao-categoria').value, 0, 4);
      const espacos = inteiro(document.getElementById('fabricacao-espacos').value, 0, 20, 1);
      const tem = nome => d.trilhaHabs.some(h => h.liberada && h.nome === nome);
      const p = parametrosFabricacao({ categoria, kit: document.getElementById('fabricacao-kit').checked || d.PER.profissao.kitAcessorio,
        consumivel: document.getElementById('fabricacao-consumivel').checked, improvisado: document.getElementById('fabricacao-improvisada').checked,
        mascate: tem('Mascate'), propria: tem('Fabricação Própria') });
      ficha.projetosFabricacao.push({ uid: uid(), nome, categoria, espacos, dt: p.dt, penalidade: p.penalidade, exigidas: p.acoes, feitas: 0, qtd: p.quantidade, improviso: p.improviso });
      fecharModal(); salvar();
    },
        'avancar-fabricacao': async el => {
      const ficha = f(), p = ficha.projetosFabricacao[Number(el.dataset.i)], per = derivar(ficha).PER.profissao;
      if (!p || !per.grau) return;
      if (p.feitas < p.exigidas) {
        if (ficha.interludio.acoes.length >= 2) return ctx.avisar('Sem ações de interlúdio disponíveis.');
        ficha.interludio.acoes.push('manutencao');
        p.feitas++; salvar(); return;
      }
      if (ficha.itens.length >= 120) return ctx.avisar('O inventário está cheio.');
      ficha.projetosFabricacao = ficha.projetosFabricacao.filter(x => x.uid !== p.uid);
      salvar();
      proxima.dt = String(p.dt);
      let resultado;
      try { resultado = await rolarTesteUI({ titulo: `Fabricar · ${p.nome}`, quem: quem(), dados: per.dados, bonus: per.bonus + p.penalidade }); }
      finally { proxima.dt = ''; }
      if (resultado.total >= p.dt) {
        ficha.itens.push({ uid: uid(), nome: p.nome, categoria: p.categoria, espacos: p.espacos, qtd: p.qtd,
          mods: [], expiraCena: p.improviso, nota: p.improviso ? 'Improvisado, dura uma cena.' : 'Fabricado em campo.' });
        salvar();
      }
    },
        'interludio-reiniciar': () => { f().interludio.acoes = []; salvar(); },
        'interludio-acao': async el => {
      const ficha = f(), id = el.dataset.id;
      if (!Object.hasOwn(ACOES_INTERLUDIO, id) || ficha.interludio.acoes.length >= 2 || (id === 'relaxar' && ficha.interludio.acoes.includes(id))) return;
      const d = derivar(ficha);
      if (['dormir', 'relaxar'].includes(id) && ficha.itens.some(i => i.nome === 'Dedo Decepado' && i.ativo && i.qtd && i.diasVestido >= 7)) {
        ficha.interludio.acoes.push(id); salvar();
        const risco = await rolarDanoUI({ titulo: 'Dedo Decepado · descanso', quem: quem(), formula: '1d4', rotulo: 'EFEITO' });
        if (risco?.total === 1) return ctx.avisar('O Dedo Decepado impediu a recuperação deste descanso.', true);
      } else ficha.interludio.acoes.push(id);
      const qualidade = ficha.interludio.descanso - (temPeso(ficha, 'sono') ? 1 : 0);
      const qtd = Math.floor(d.limitePE * ([0.5, 1, 2, 3][qualidade] ?? 0));
      const recuperar = (k, max) => { ficha.recursos[k] = Math.min(max, d.atual[k] + qtd); };
      if (id === 'dormir') { recuperar('pv', d.pv); recuperar(d.pd ? 'pd' : 'pe', d.pd ? d.pdMax : d.pe); if (ficha.recursos.pv > 0) ficha.recursos.morrendo = 0; }
      if (id === 'relaxar') recuperar(d.pd ? 'pd' : 'san', d.pd ? d.pdMax : d.san);
      salvar();
      ctx.avisar(['dormir', 'relaxar'].includes(id) ? `${ACOES_INTERLUDIO[id]} · recuperação de até ${qtd} por recurso.` : `${ACOES_INTERLUDIO[id]} registrada.`);
    },
  };
}
