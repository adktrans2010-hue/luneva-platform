export const ARTICLE_REDIRECTS: Record<string, string> = {
  "kompulsiya-navyazchivye-deystviya-ili-povedenie-vse-my-znaem-chto-nashe-povedenie-formiruetsya-v-detstve":
    "kompulsii-navyazchivye-deystviya-i-detskiy-opyt",
  "kompulsiya-navyazchivye-deystviya-ili-povedenie-vse-my-znaem-chto-nashe-povedeni":
    "kompulsii-navyazchivye-deystviya-i-detskiy-opyt",
  "kompulsivnoe-pereedanie-priznaki-i-pomosch": "pereedanie-prichiny-i-priznaki",
  "rasstro-stva-pischevogo-povedeniya-2": "rasstro-stva-pischevogo-povedeniya",
  "rasstroi-stva-pischevogo-povedeniya": "rasstro-stva-pischevogo-povedeniya",
  "travmy-vzroslyh-dete-alkogolikov": "travmy-vzroslyh-detey-alkogolikov",
  "travmy-vzroslyh-detei-alkogolikov": "travmy-vzroslyh-detey-alkogolikov",
  "fetsheyming-i-rasstroystva-pischevogo-povedeniya":
    "rasstroystva-pischevogo-povedeniya-i-vliyanie-sredy",
  "kak-pomoch-tem-kto-sovershaet-self-harm":
    "kak-pomoch-cheloveku-kotoryy-sovershaet-self-harm",
  "kak-preodolevat-trudnosti-ne-pribegaya-k-selfharm":
    "kak-preodolevat-trudnosti-bez-self-harm",
  "self-harm": "self-harm-chto-vazhno-znat",
  "mechtaem-kak-uolt-disne-2": "mechtaem-kak-uolt-disne",
  "mechtaem-kak-uolt-disnei": "mechtaem-kak-uolt-disne",
  "vystraivaem-lichnye-granicy-2": "vystraivaem-lichnye-granicy",
  "vystraivaem-lichnye-granitsy": "vystraivaem-lichnye-granicy",
  "kak-ogranichivayuschie-ubezhdeniya-meshayut-nam-dostigat-cele":
    "kak-ogranichivayuschie-ubezhdeniya-meshayut-nam-dostigat-celey",
  "kak-ogranichivayuschie-ubezhdeniya-meshayut-nam-dostigat-tselei":
    "kak-ogranichivayuschie-ubezhdeniya-meshayut-nam-dostigat-celey",
  "chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situaciyu-2":
    "chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situaciyu",
  "chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situatsiyu":
    "chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situaciyu",
  "detoks-diety-chto-deystvitelno-delaet-organizm":
    "detoks-diety-i-mify-o-detoksikacii",
};

export const ARCHIVED_ARTICLE_SLUGS = [
  ...Object.keys(ARTICLE_REDIRECTS),
  "kak-perezhit-karantin-i-covid-19",
];

export function getArticleRedirect(slug: string) {
  return ARTICLE_REDIRECTS[slug];
}
