import { useEffect } from 'react';

// Porta de setPageScrollLocked() (script.js:1321-1346): trava o scroll da
// página enquanto algum modal está aberto, compensando a largura da
// scrollbar para não haver layout shift. Não usa `position:fixed` no body —
// isso fazia os gráficos ApexCharts recalcularem largura e "pularem".
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (locked) {
      if (!body.classList.contains('modal-open')) {
        const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
        body.style.setProperty('--scrollbar-compensation', `${scrollbarWidth}px`);
      }
      html.classList.add('modal-open');
      body.classList.add('modal-open');
    } else {
      html.classList.remove('modal-open');
      body.classList.remove('modal-open');
      body.style.removeProperty('--scrollbar-compensation');
    }
  }, [locked]);
}
