// id estável de uma fase de quebra-cabeça: um resumo (FNV-1a) do que a define (tabuleiro, peças e metas). A mesma fase
// tem sempre o mesmo id; nome e número não entram. Usado por quebra_monta.mjs (campo id de src/quebra_fases.js) e na
// migração do progresso (QJ_ANTIGA).
export function idFase(f){
  const k=JSON.stringify([f.mapa, f.pecas, f.muretas||[], f.carroPos||null, f.alvosPos||null, f.terraPos||null, f.presasPos||null, f.objs||[f.obj], f.char||'rola']);
  let h=0x811c9dc5; for(let i=0;i<k.length;i++){ h^=k.charCodeAt(i); h=Math.imul(h,0x01000193)>>>0; }
  return 'q'+h.toString(36).padStart(7,'0');
}
