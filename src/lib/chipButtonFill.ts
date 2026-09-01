// Rastreia a posição do cursor sobre qualquer .chip-btn e atualiza
// --fill-x/--fill-y (lidas pelo CSS em index.css) pra animar o preenchimento
// radial saindo exatamente de onde o mouse entrou/está — mesma ideia do
// "origin button" pedido, via delegação de evento (um listener só, pro site
// inteiro) em vez de embrulhar cada botão num componente.
let installed = false;

export function installChipButtonFillEffect() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  function updateOrigin(e: PointerEvent) {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('.chip-btn');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--fill-x', `${x}%`);
    target.style.setProperty('--fill-y', `${y}%`);
  }

  // pointerover/pointermove borbulham (ao contrário de pointerenter), então
  // dá pra "delegar" num único listener no document em vez de um por botão.
  document.addEventListener('pointerover', updateOrigin);
  document.addEventListener('pointermove', updateOrigin);
}
