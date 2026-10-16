/* Shared touch activation; keep the real anchor, click handlers and URL.
   Some animated scenes suppress the browser's compatibility click on touch. */
(() => {
    'use strict';
    const selector = 'a[href="../../home.html"]:not(.complete-home):not(.home-link)';
    const recent = new WeakMap();
    let touch = null;
    const linkAt = target => target.closest?.(selector);
    document.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        if (!event.isPrimary) { touch = null; return; }
        const link = linkAt(event.target);
        touch = event.button === 0 && link
            ? { link, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
            : null;
    }, true);
    document.addEventListener('pointermove', event => {
        if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 12) touch.moved = true;
    }, true);
    document.addEventListener('pointerup', event => {
        if (touch?.id !== event.pointerId) return;
        const last = touch; touch = null;
        const rect = last.link.getBoundingClientRect();
        if (last.moved || !last.link.isConnected || linkAt(event.target) !== last.link ||
            Math.hypot(event.clientX - last.x, event.clientY - last.y) > 12 ||
            event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) return;
        event.preventDefault();
        recent.set(last.link, performance.now());
        last.link.click();
    }, { capture: true, passive: false });
    document.addEventListener('click', event => {
        const link = linkAt(event.target), at = link && recent.get(link);
        if (link && event.isTrusted && event.detail > 0 && at !== undefined && performance.now() - at < 800) {
            event.preventDefault(); event.stopImmediatePropagation();
        }
    }, true);
    document.addEventListener('pointercancel', event => { if (touch?.id === event.pointerId) touch = null; }, true);
    window.addEventListener('pagehide', () => { touch = null; });
})();
