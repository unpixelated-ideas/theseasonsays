// Delegation survives date/language renders without accumulating listeners.
export function bindAllowedOverlaps(root) {
  let current = null, pinned = false, timer;
  const close = () => {
    clearTimeout(timer);
    if (current) {
      current.querySelector('button').setAttribute('aria-expanded', 'false');
      current.querySelector('.overlap-popup').hidden = true;
    }
    current = null;
    pinned = false;
  };
  const position = () => {
    if (!current) return;
    const popup = current.querySelector('.overlap-popup');
    const anchor = current.querySelector('button').getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    popup.style.left = `${Math.max(12, Math.min(anchor.left, innerWidth - box.width - 12))}px`;
    popup.style.top = `${Math.max(12, anchor.bottom + box.height + 6 <= innerHeight ? anchor.bottom + 6 : anchor.top - box.height - 6)}px`;
  };
  const show = wrapper => {
    clearTimeout(timer);
    if (current !== wrapper) { close(); current = wrapper; }
    current.querySelector('button').setAttribute('aria-expanded', 'true');
    current.querySelector('.overlap-popup').hidden = false;
    position();
  };
  root.addEventListener('pointermove', event => {
    const wrapper = event.target.closest('.allowed-overlap');
    if (wrapper && event.pointerType !== 'touch') show(wrapper);
  });
  root.addEventListener('pointerout', event => {
    const wrapper = event.target.closest('.allowed-overlap');
    if (wrapper && !wrapper.contains(event.relatedTarget) && !pinned) timer = setTimeout(close, 180);
  });
  root.addEventListener('focusin', event => {
    const wrapper = event.target.closest('.allowed-overlap');
    if (wrapper) show(wrapper);
  });
  root.addEventListener('focusout', event => {
    if (current && !current.contains(event.relatedTarget)) close();
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('.overlap-button');
    if (!button) return;
    const wrapper = button.closest('.allowed-overlap');
    if (current === wrapper && pinned) close();
    else { show(wrapper); pinned = true; }
  });
  document.addEventListener('pointerdown', event => {
    if (current && !current.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
  return close;
}
