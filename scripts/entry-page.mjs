import {site,supportedLanguages,languagePath,canonicalURL} from '../src/config/site.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function entryPage(template,language){
 const title=escape(site.productName[language]),description=escape(site.metadataDescription[language]);
 const url=escape(canonicalURL(language)),image=escape(new URL(site.previewImage,site.productionBaseURL).href);
 const metadata=`<meta name="description" content="${description}">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<link rel="canonical" href="${url}">
${[...supportedLanguages,'x-default'].map(lang=>`<link rel="alternate" hreflang="${lang}" href="${escape(canonicalURL(lang==='x-default'?site.defaultLanguage:lang))}">`).join('\n')}`;
 return template.replace(/<html lang="[^"]*">/,`<html lang="${language}">`).replace('<!-- metadata -->',metadata).replaceAll('./src/',languagePath(language)?'../src/':'./src/');
}
