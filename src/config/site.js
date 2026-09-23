export const site = {
  defaultLanguage:'en',
  languageRoutes:{en:'',ko:'ko',ga:'ga'},
  productionBaseURL:'https://unpixelated-ideas.github.io/theseasonsays/',
  previewImage:'previewimage.png',
  productName: {en:'The Season Says',ko:'계절이 말한다',ga:'Deir an Séasúr'},
  tagline: {en:'Decorate. Celebrate. Enjoy.',ko:'꾸미고. 기념하고. 즐기세요.',ga:'Maisigh. Ceiliúir. Bain taitneamh as.'},
  metadataDescription: {en:'A thoughtful guide to the seasons, holidays, and small pleasures of right now.',ko:'지금의 계절과 명절, 일상의 작은 즐거움을 위한 안내.',ga:'Treoir do na séasúir, na féilte agus pléisiúir bheaga an lae.'},
  fallbackBackground: {light:'#E5E9DE',dark:'#202820'},
  fallbackPalette: {light:{background:'#E5E9DE',text:'#28392C',slider:'#536D43'},dark:{background:'#202820',text:'#E3E8D9',slider:'#C1D0A5'}},
  minYear:2024, maxYear:2028,
};

export const supportedLanguages=Object.keys(site.languageRoutes);
export const languagePath=language=>site.languageRoutes[language] ? `${site.languageRoutes[language]}/` : '';
export const canonicalURL=language=>new URL(languagePath(language),site.productionBaseURL).href;
// The module location identifies the mount point on localhost and any static host.
export const applicationBaseURL=new URL('../../',import.meta.url);
export function languageFromPath(pathname,basePath=applicationBaseURL.pathname){
  const relative=pathname.startsWith(basePath)?pathname.slice(basePath.length):'';
  return supportedLanguages.find(language=>relative===languagePath(language)||relative===`${languagePath(language)}index.html`)||site.defaultLanguage;
}
