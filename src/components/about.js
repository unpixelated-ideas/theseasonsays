import {aboutPages} from '../i18n/about.js';
import {escapeHTML as e} from './views.js';

export function aboutContent(language) {
  const copy = aboutPages[language];
  return `<article class="card information about-copy" aria-labelledby="about-heading">
    <h1 id="about-heading">${e(copy.heading)}</h1>
    <p>${e(copy.introduction)}</p>
    <p>${e(copy.creep)}</p>
    <p><strong>${e(copy.mission)}</strong> ${e(copy.guide)}</p>
    <p>${e(copy.moment)} <strong>${e(copy.patience)}</strong></p>
    <section class="about-geography" aria-labelledby="about-geography-heading">
      <h2 id="about-geography-heading">${e(copy.geographyHeading)}</h2>
      <p>${e(copy.geography)}</p>
    </section>
  </article>`;
}
