import {legalPages} from '../i18n/legal.js';
import {escapeHTML as e} from './views.js';

export function legalContent(page, language) {
  const copy = legalPages[language];
  return `<div class="legal-copy"><p class="date-range">${e(copy.updated)}</p>${copy[page].map(([heading, text])=>`<section><h2>${e(heading)}</h2><p>${e(text)}</p></section>`).join('')}${page==='privacy'?`<p><a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">${e(copy.github)}</a></p>`:''}</div>`;
}
