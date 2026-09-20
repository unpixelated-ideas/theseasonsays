import { updates, updateLabels } from '../data/updates.js';
import { fromKey } from '../lib/dates.js';
import { formatDate } from '../lib/formatting.js';
import { escapeHTML as e } from './views.js';

export function updateLog(language, messages) {
  const labels = updateLabels[language];
  const newestFirst = [...updates].sort((a, b) => b.date.localeCompare(a.date));
  return `<button class="update-log-button" id="open-update-log" aria-haspopup="dialog" aria-controls="update-log">${e(labels.title)}</button>
    <dialog id="update-log" class="card update-log" aria-labelledby="update-log-title">
      <div class="update-log-heading"><h2 id="update-log-title">${e(labels.title)}</h2>
        <button id="close-update-log" autofocus>${e(labels.close)}</button></div>
      <ul>${newestFirst.map(update => `<li><time datetime="${update.date}">${e(formatDate(fromKey(update.date), messages, true))}</time><span class="update-version"> · ${e(update.version)}</span><ul class="update-changes">${update[language].map(change=>`<li>${e(change)}</li>`).join('')}</ul></li>`).join('')}</ul>
    </dialog>`;
}

export function bindUpdateLog() {
  const dialog = document.querySelector('#update-log');
  const opener = document.querySelector('#open-update-log');
  opener.addEventListener('click', () => dialog.showModal());
  document.querySelector('#close-update-log').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener.focus({ preventScroll: true }));
  // Native dialog provides modal focus containment and Escape dismissal.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}
