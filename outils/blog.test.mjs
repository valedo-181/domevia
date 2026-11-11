// Tests de outils/blog.mjs : node --test outils/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { nettoyerHtml, lireArticles, pageArticle, pageListe, majSitemap, fluxRss } from "./blog.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const modele = readFileSync(join(ICI, "modele-blog.html"), "utf8");

function dossierAvec(...fichiers) {
  const d = mkdtempSync(join(tmpdir(), "blog-"));
  for (const [nom, contenu] of fichiers) writeFileSync(join(d, nom), typeof contenu === "string" ? contenu : JSON.stringify(contenu));
  return d;
}

test("le HTML est nettoyé : pas de script, d'événement ni de javascript:", () => {
  const s = nettoyerHtml('<h1>T</h1><p onclick="x()">a <a href="javascript:alert(1)">b</a></p><script>alert(1)</script><img src="x.jpg" onerror="y()"><iframe src="https://e.vil"></iframe><div class="z">c</div>');
  assert.equal(s, '<h2>T</h2><p>a <a>b</a></p><img src="x.jpg" alt="" loading="lazy" decoding="async">c');
});

test("les liens externes reçoivent rel=noopener, pas ceux de domevia.ch", () => {
  assert.equal(nettoyerHtml('<a href="https://ex.ch">x</a>'), '<a href="https://ex.ch" rel="noopener">x</a>');
  assert.equal(nettoyerHtml('<a href="https://domevia.ch/#devis">x</a>'), '<a href="https://domevia.ch/#devis">x</a>');
});

test("l'exemple se lit, se trie et produit une page complète", () => {
  const d = dossierAvec();
  copyFileSync(join(ICI, "exemples", "exemple-article.json"), join(d, "exemple.json"));
  writeFileSync(join(d, "b.json"), JSON.stringify({ slug: "plus-recent", title: "Plus récent", date: "2026-12-01", html: "<p>Texte</p>" }));
  const { articles, erreurs } = lireArticles(d);
  assert.deepEqual(erreurs, []);
  assert.deepEqual(articles.map((a) => a.slug), ["plus-recent", "exemple-preparer-demenagement"]);
  const page = pageArticle(modele, articles[1], articles);
  assert.match(page, /<h1>Exemple : préparer son déménagement en 6 semaines<\/h1>/);
  assert.match(page, /<link rel="canonical" href="https:\/\/domevia.ch\/blog\/exemple-preparer-demenagement.html">/);
  assert.match(page, /"@type":"BlogPosting"/);
  assert.match(page, /11 novembre 2026/);
  assert.match(page, /À lire aussi/);
  assert.doesNotMatch(page, /<script>alert|javascript:|onclick|\{\{/);
  const liste = pageListe(modele, articles);
  assert.match(liste, /href="plus-recent.html"/);
  assert.doesNotMatch(liste, /\{\{/);
});

test("un article invalide est ignoré avec une raison, un brouillon est caché", () => {
  const d = dossierAvec(
    ["a.json", { slug: "Mauvais Slug", title: "x", date: "2026-11-11", html: "<p>x</p>" }],
    ["b.json", "{pas du json"],
    ["c.json", { slug: "brouillon", title: "x", date: "2026-11-11", html: "<p>x</p>", draft: true }],
    ["d.json", { slug: "index", title: "x", date: "2026-11-11", html: "<p>x</p>" }],
  );
  const { articles, erreurs } = lireArticles(d);
  assert.equal(articles.length, 0);
  assert.equal(erreurs.length, 3);
});

test("les titres sont échappés", () => {
  const d = dossierAvec(["a.json", { slug: "a", title: '<b>"T"</b>', date: "2026-11-11", html: "<p>x</p>" }]);
  const { articles } = lireArticles(d);
  const page = pageArticle(modele, articles[0], articles);
  assert.match(page, /<h1>&lt;b&gt;&quot;T&quot;&lt;\/b&gt;<\/h1>/);
  assert.match(fluxRss(articles), /<title>&lt;b&gt;/);
});

test("le sitemap garde les autres pages et remplace le bloc du blog", () => {
  const base = '<urlset>\n  <url><loc>https://domevia.ch/</loc></url>\n</urlset>\n';
  const d = dossierAvec(["a.json", { slug: "a", title: "A", date: "2026-11-11", html: "<p>x</p>" }]);
  const { articles } = lireArticles(d);
  const une = majSitemap(base, articles);
  const deux = majSitemap(une, []);
  assert.match(une, /blog\/a.html/);
  assert.match(deux, /<loc>https:\/\/domevia.ch\/<\/loc>/);
  assert.doesNotMatch(deux, /blog\/a.html/);
  assert.equal(deux.match(/blog:debut/g).length, 1);
});
