"use strict";
// Run before styles load. A narrow desktop window is still a desktop window.
const MobileLayout = (() => {
  const active = /[?&]touch=1/.test(location.search) ||
    (matchMedia('(pointer: coarse)').matches && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window));
  if (!active) return {active:false};
  const root = document.documentElement;
  root.classList.add('mobile-ui');
  let frame = 0;
  function fit() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const v = window.visualViewport;
      // Keep intentional menu pinch-zoom intact. Only correct the unzoomed viewport.
      if (v && Math.abs(v.scale - 1) > .01) return;
      root.style.setProperty('--mobile-height', (v ? v.height : innerHeight) + 'px');
      root.style.setProperty('--mobile-top', (v ? v.offsetTop : 0) + 'px');
    });
  }
  fit();
  addEventListener('resize', fit, {passive:true});
  window.visualViewport?.addEventListener('resize', fit, {passive:true});
  window.visualViewport?.addEventListener('scroll', fit, {passive:true});
  addEventListener('pageshow', fit);
  document.addEventListener('focusin', fit);
  document.addEventListener('focusout', () => {setTimeout(fit, 100);setTimeout(fit, 350);});
  // Safari's gesture fallback is restricted to gameplay, where two thumbs are controls.
  for (const event of ['gesturestart','gesturechange']) document.addEventListener(event, e => {
    if (document.body.classList.contains('playing') || document.querySelector('#tc.mobile-flight')) e.preventDefault();
  }, {passive:false});
  return {active:true,fit};
})();
