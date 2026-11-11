#!/usr/bin/env node
// Domevia – génère la rubrique « Conseils » (blog) du site à partir des articles en JSON.
//
//   node outils/blog.mjs
//
// Entrée : blog/articles/<slug>.json, un fichier par article (écrit par Altiseo, ou à la main) :
//   {
//     "slug": "preparer-demenagement-neuchatel",      // lettres minuscules, chiffres, tirets
//     "title": "Comment préparer son déménagement à Neuchâtel",
//     "description": "Le résumé affiché sur Google et dans la liste (160 caractères environ).",
//     "date": "2026-11-11",                           // date de publication (AAAA-MM-JJ ou ISO)
//     "updated": "2026-11-12",                        // facultatif
//     "image": "https://…/photo.jpg",                 // facultatif : adresse https ou chemin dans blog/
//     "imageAlt": "Description de l'image",           // facultatif
//     "keyword": "déménagement Neuchâtel",            // facultatif, pour information
//     "html": "<p>Le texte de l'article…</p><h2>…</h2>"
//   }
//
// Sortie (fichiers générés, à ne pas modifier à la main) :
//   blog/index.html        la liste des articles
//   blog/<slug>.html       une page par article
//   blog/rss.xml           le flux RSS
//   sitemap.xml            les adresses du blog, entre <!-- blog:debut --> et <!-- blog:fin -->
//
// Vercel lance ce script à chaque mise en ligne (vercel.json → buildCommand) : il suffit donc
// d'ajouter, de modifier ou de supprimer un fichier JSON pour que le blog se mette à jour.
// Aucune dépendance : Node 18 ou plus.

import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://domevia.ch";
const DOSSIER_BLOG = join(RACINE, "blog");
const DOSSIER_ARTICLES = join(DOSSIER_BLOG, "articles");
const MODELE = join(RACINE, "outils", "modele-blog.html");
const VERSION_CSS = "20261111";
const MARQUE_GENEREE = "Page générée par outils/blog.mjs";
const IMAGE_DEFAUT = `${SITE}/assets/img/photo-particulier-carte.jpg`;
const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVES = new Set(["index", "rss", "articles", "img"]);

// ---------- petits outils ----------

export function echapper(texte) {
  return String(texte ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function dateValide(valeur) {
  if (typeof valeur !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(valeur)) return null;
  const d = new Date(valeur.length === 10 ? `${valeur}T12:00:00Z` : valeur);
  return Number.isNaN(d.getTime()) ? null : d;
}

const formatDate = new Intl.DateTimeFormat("fr-CH", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Zurich" });
const jourIso = (d) => d.toISOString().slice(0, 10);

function texteBrut(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function minutesDeLecture(html) {
  const mots = texteBrut(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(mots / 220));
}

// ---------- nettoyage du HTML des articles ----------
// Le texte vient d'Altiseo (déjà échappé), mais on ne garde de toute façon que des balises de mise
// en forme : aucun script, aucun style, aucun attribut d'événement, aucune adresse javascript:.

const BALISES = new Set([
  "p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "a", "blockquote", "br", "hr",
  "table", "thead", "tbody", "tr", "th", "td", "img", "figure", "figcaption", "code", "pre", "sup", "sub",
]);
const ATTRIBUTS = { a: ["href", "title"], img: ["src", "alt", "width", "height"], th: ["scope"], td: [], ol: ["start"] };

function adresseSure(url, pourImage) {
  const u = String(url).trim();
  if (/^https:\/\//i.test(u)) return u;
  if (!pourImage && /^(mailto:|tel:)/i.test(u)) return u;
  if (/^http:\/\//i.test(u)) return u.replace(/^http:/i, "https:");
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null; // javascript:, data:, etc.
  if (u.startsWith("//")) return null;
  return u; // chemin relatif ou ancre
}

export function nettoyerHtml(html) {
  let s = String(html ?? "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form)\b[\s\S]*?<\/\1\s*>/gi, "");
  s = s.replace(/<(script|style|iframe|object|embed|noscript|template|svg|math|form)\b[^>]*>/gi, "");
  s = s.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (_, ferme, nom, attrs) => {
    let balise = nom.toLowerCase();
    if (balise === "h1") balise = "h2"; // un seul h1 par page : le titre de l'article
    if (balise === "h5" || balise === "h6") balise = "h4";
    if (!BALISES.has(balise)) return "";
    if (ferme) return balise === "br" || balise === "hr" || balise === "img" ? "" : `</${balise}>`;
    const permis = ATTRIBUTS[balise] ?? [];
    const gardes = [];
    for (const m of attrs.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
      const attr = m[1].toLowerCase();
      if (!permis.includes(attr)) continue;
      let valeur = (m[3] ?? m[4] ?? m[5] ?? "").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");
      if (attr === "href" || attr === "src") {
        valeur = adresseSure(valeur, attr === "src");
        if (valeur === null) continue;
      }
      if ((attr === "width" || attr === "height" || attr === "start") && !/^\d{1,4}$/.test(valeur)) continue;
      gardes.push(`${attr}="${echapper(valeur)}"`);
    }
    if (balise === "a") {
      const href = gardes.find((g) => g.startsWith("href="));
      if (href && /href="https:\/\//.test(href) && !href.includes('href="https://domevia.ch')) gardes.push('rel="noopener"');
    }
    if (balise === "img") {
      if (!gardes.some((g) => g.startsWith("src="))) return "";
      if (!gardes.some((g) => g.startsWith("alt="))) gardes.push('alt=""');
      gardes.push('loading="lazy"', 'decoding="async"');
    }
    return `<${balise}${gardes.length ? " " + gardes.join(" ") : ""}>`;
  });
  return s.trim();
}

// ---------- lecture des articles ----------

export function lireArticles(dossier = DOSSIER_ARTICLES) {
  if (!existsSync(dossier)) return { articles: [], erreurs: [] };
  const articles = [];
  const erreurs = [];
  const vus = new Set();
  for (const fichier of readdirSync(dossier).filter((f) => f.endsWith(".json")).sort()) {
    let a;
    try {
      a = JSON.parse(readFileSync(join(dossier, fichier), "utf8"));
    } catch (e) {
      erreurs.push(`${fichier} : JSON illisible (${e.message})`);
      continue;
    }
    const slug = String(a.slug ?? fichier.replace(/\.json$/, ""));
    const date = dateValide(a.date);
    const manque = [];
    if (!SLUG_OK.test(slug) || slug.length > 90 || RESERVES.has(slug)) manque.push("slug");
    if (typeof a.title !== "string" || !a.title.trim()) manque.push("title");
    if (typeof a.html !== "string" || !a.html.trim()) manque.push("html");
    if (!date) manque.push("date");
    if (manque.length) {
      erreurs.push(`${fichier} : champ(s) manquant(s) ou invalide(s) : ${manque.join(", ")}`);
      continue;
    }
    if (vus.has(slug)) {
      erreurs.push(`${fichier} : le slug « ${slug} » existe déjà`);
      continue;
    }
    if (a.draft === true || a.brouillon === true) continue;
    vus.add(slug);
    const html = nettoyerHtml(a.html);
    const description = (typeof a.description === "string" && a.description.trim()) || texteBrut(html).slice(0, 157) + "…";
    const maj = dateValide(a.updated);
    articles.push({
      slug,
      titre: a.title.trim(),
      description: description.trim(),
      date,
      maj: maj && maj > date ? maj : null,
      image: typeof a.image === "string" && a.image.trim() ? adresseSure(a.image, true) : null,
      imageAlt: typeof a.imageAlt === "string" ? a.imageAlt.trim() : "",
      html,
      minutes: minutesDeLecture(html),
    });
  }
  articles.sort((x, y) => y.date - x.date || x.titre.localeCompare(y.titre, "fr"));
  return { articles, erreurs };
}

// ---------- pages ----------

const imageAbsolue = (img) => (!img ? IMAGE_DEFAUT : /^https:\/\//.test(img) ? img : `${SITE}/blog/${img.replace(/^\.\//, "")}`);

function remplir(modele, valeurs) {
  return modele.replace(/\{\{([A-Z_]+)\}\}/g, (tout, cle) => (cle in valeurs ? valeurs[cle] : tout));
}

function jsonLd(objet) {
  // « </ » ne doit pas apparaître dans un <script> : on l'échappe.
  return `  <script type="application/ld+json">${JSON.stringify(objet).replace(/</g, "\\u003c")}</script>`;
}

function carte(a, niveauTitre = "h2") {
  const image = a.image
    ? `<figure class="arche blog-carte-photo"><img src="${echapper(a.image)}" alt="${echapper(a.imageAlt)}" loading="lazy" decoding="async"></figure>`
    : `<div class="arche blog-carte-photo blog-carte-sans-photo" aria-hidden="true"></div>`;
  return `        <article class="blog-carte">
          ${image}
          <p class="blog-meta"><time datetime="${jourIso(a.date)}">${formatDate.format(a.date)}</time> · ${a.minutes} min de lecture</p>
          <${niveauTitre}><a href="${a.slug}.html">${echapper(a.titre)}</a></${niveauTitre}>
          <p>${echapper(a.description)}</p>
        </article>`;
}

const appel = `    <section class="section section-tint">
      <div class="wrap blog-appel">
        <div>
          <h2>Un déménagement en vue ?</h2>
          <p class="lead">Décrivez votre projet en deux minutes : nous vous rappelons avec une offre claire, sans engagement.</p>
        </div>
        <div class="actions">
          <a class="btn btn-primary" href="../#devis">Demander un devis gratuit</a>
          <a class="btn btn-ghost" href="../#estimation">Estimer le prix</a>
        </div>
      </div>
    </section>`;

export function pageListe(modele, articles) {
  const url = `${SITE}/blog/`;
  const liste = articles.length
    ? `      <div class="wrap blog-liste">\n${articles.map((a) => carte(a)).join("\n")}\n      </div>`
    : `      <div class="wrap"><p class="blog-vide">Nos premiers conseils arrivent bientôt. En attendant, nos questions fréquentes répondent déjà à beaucoup de choses : <a href="../#faq">voir la FAQ</a>.</p></div>`;
  const contenu = `    <section class="hero blog-hero">
      <div class="wrap">
        <p class="blog-surtitre">Conseils et guides</p>
        <h1>Déménager, nettoyer, stocker : nos conseils.</h1>
        <p class="lead">Des guides pratiques de l'équipe Domevia pour préparer votre déménagement, réussir l'état des lieux et choisir le bon garde-meubles en Suisse.</p>
      </div>
    </section>

    <section class="section blog-section">
${liste}
    </section>

${appel}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Conseils Domevia",
    url,
    inLanguage: "fr-CH",
    publisher: { "@type": "Organization", name: "Domevia", url: `${SITE}/`, logo: `${SITE}/assets/img/domevia-avatar.svg` },
    blogPost: articles.slice(0, 20).map((a) => ({ "@type": "BlogPosting", headline: a.titre, url: `${SITE}/blog/${a.slug}.html`, datePublished: jourIso(a.date) })),
  };
  return remplir(modele, {
    TITRE_PAGE: "Conseils déménagement, nettoyage et garde-meubles – Domevia",
    DESCRIPTION: echapper("Guides pratiques Domevia : préparer un déménagement en Suisse, réussir le nettoyage de fin de bail et l'état des lieux, choisir un garde-meubles."),
    URL: url,
    OG_TYPE: "website",
    OG_IMAGE: IMAGE_DEFAUT,
    VERSION_CSS,
    NAV_BLOG: ' aria-current="page"',
    JSONLD: jsonLd(ld),
    CONTENU: contenu,
  });
}

export function pageArticle(modele, a, articles) {
  const url = `${SITE}/blog/${a.slug}.html`;
  const autres = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const photo = a.image
    ? `\n        <figure class="arche article-photo"><img src="${echapper(a.image)}" alt="${echapper(a.imageAlt)}" fetchpriority="high" decoding="async"></figure>`
    : "";
  const maj = a.maj ? ` · mis à jour le <time datetime="${jourIso(a.maj)}">${formatDate.format(a.maj)}</time>` : "";
  const contenu = `    <article class="article">
      <header class="wrap article-entete">
        <nav class="fil-ariane" aria-label="Fil d'Ariane"><a href="../">Accueil</a> <span aria-hidden="true">/</span> <a href="./">Conseils</a></nav>
        <h1>${echapper(a.titre)}</h1>
        <p class="lead">${echapper(a.description)}</p>
        <p class="blog-meta">Par l'équipe Domevia · <time datetime="${jourIso(a.date)}">${formatDate.format(a.date)}</time>${maj} · ${a.minutes} min de lecture</p>${photo}
      </header>
      <div class="wrap article-corps">
${a.html}
      </div>
    </article>

${appel}${
    autres.length
      ? `

    <section class="section blog-section">
      <div class="wrap">
        <h2 class="blog-autres-titre">À lire aussi</h2>
      </div>
      <div class="wrap blog-liste">
${autres.map((x) => carte(x, "h3")).join("\n")}
      </div>
    </section>`
      : ""
  }`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: a.titre,
      description: a.description,
      image: imageAbsolue(a.image),
      datePublished: a.date.toISOString(),
      dateModified: (a.maj ?? a.date).toISOString(),
      inLanguage: "fr-CH",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: "Domevia", url: `${SITE}/` },
      publisher: { "@type": "Organization", name: "Domevia", url: `${SITE}/`, logo: { "@type": "ImageObject", url: `${SITE}/assets/img/domevia-avatar.svg` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Conseils", item: `${SITE}/blog/` },
        { "@type": "ListItem", position: 3, name: a.titre, item: url },
      ],
    },
  ];
  return remplir(modele, {
    TITRE_PAGE: `${echapper(a.titre)} – Domevia`,
    DESCRIPTION: echapper(a.description),
    URL: url,
    OG_TYPE: "article",
    OG_IMAGE: echapper(imageAbsolue(a.image)),
    VERSION_CSS,
    NAV_BLOG: ' aria-current="page"',
    JSONLD: ld.map(jsonLd).join("\n"),
    CONTENU: contenu,
  });
}

export function fluxRss(articles) {
  const items = articles
    .slice(0, 30)
    .map(
      (a) => `    <item>
      <title>${echapper(a.titre)}</title>
      <link>${SITE}/blog/${a.slug}.html</link>
      <guid isPermaLink="true">${SITE}/blog/${a.slug}.html</guid>
      <pubDate>${a.date.toUTCString()}</pubDate>
      <description>${echapper(a.description)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Conseils Domevia</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Déménagement, nettoyage de fin de bail et garde-meubles en Suisse : les conseils de Domevia.</description>
    <language>fr-CH</language>
${items}
  </channel>
</rss>
`;
}

export function majSitemap(sitemap, articles) {
  const derniere = articles.reduce((max, a) => Math.max(max, (a.maj ?? a.date).getTime()), 0);
  const urls = [
    { loc: `${SITE}/blog/`, lastmod: derniere ? jourIso(new Date(derniere)) : null },
    ...articles.map((a) => ({ loc: `${SITE}/blog/${a.slug}.html`, lastmod: jourIso(a.maj ?? a.date) })),
  ];
  const bloc = [
    "  <!-- blog:debut (généré par outils/blog.mjs) -->",
    ...urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`),
    "  <!-- blog:fin -->",
  ].join("\n");
  if (/  <!-- blog:debut[\s\S]*?<!-- blog:fin -->/.test(sitemap)) {
    return sitemap.replace(/  <!-- blog:debut[\s\S]*?<!-- blog:fin -->/, bloc);
  }
  return sitemap.replace("</urlset>", `${bloc}\n</urlset>`);
}

// ---------- génération ----------

function ecrireSiChange(chemin, contenu) {
  if (existsSync(chemin) && readFileSync(chemin, "utf8") === contenu) return false;
  writeFileSync(chemin, contenu);
  return true;
}

export function generer() {
  const modele = readFileSync(MODELE, "utf8");
  const { articles, erreurs } = lireArticles();
  for (const e of erreurs) console.warn(`⚠ article ignoré, ${e}`);
  mkdirSync(DOSSIER_BLOG, { recursive: true });

  let changes = 0;
  const attendus = new Set(["index.html"]);
  changes += ecrireSiChange(join(DOSSIER_BLOG, "index.html"), pageListe(modele, articles));
  for (const a of articles) {
    attendus.add(`${a.slug}.html`);
    changes += ecrireSiChange(join(DOSSIER_BLOG, `${a.slug}.html`), pageArticle(modele, a, articles));
  }
  changes += ecrireSiChange(join(DOSSIER_BLOG, "rss.xml"), fluxRss(articles));

  // Article supprimé : on retire sa page (seulement les pages générées par ce script).
  for (const f of readdirSync(DOSSIER_BLOG).filter((f) => f.endsWith(".html") && !attendus.has(f))) {
    const chemin = join(DOSSIER_BLOG, f);
    if (readFileSync(chemin, "utf8").includes(MARQUE_GENEREE)) {
      unlinkSync(chemin);
      changes++;
    }
  }

  const cheminSitemap = join(RACINE, "sitemap.xml");
  changes += ecrireSiChange(cheminSitemap, majSitemap(readFileSync(cheminSitemap, "utf8"), articles));

  console.log(`Blog : ${articles.length} article(s), ${changes} fichier(s) mis à jour${erreurs.length ? `, ${erreurs.length} ignoré(s)` : ""}.`);
  return { articles, erreurs, changes };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generer();
}
