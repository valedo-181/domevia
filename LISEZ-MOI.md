# Site internet Domevia

Site statique (HTML, CSS, JavaScript), sans dépendance externe : il fonctionne chez n'importe quel hébergeur suisse (Infomaniak, Hostpoint, etc.). Les polices sont hébergées sur le site lui-même, sans appel à Google, ce qui va dans le sens de la nLPD.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil : services, déroulement, estimateur de prix, garanties, zone, FAQ, demande de devis |
| `mentions-legales.html` | Mentions légales (champs à compléter) |
| `confidentialite.html` | Politique de confidentialité selon la nLPD (champs à compléter) |
| `assets/css/style.css` | Styles, repris de la charte graphique |
| `assets/js/main.js` | Menu mobile, estimateur, formulaire. **Les tarifs se règlent en haut du fichier** (`TARIFS`). |
| `assets/img/` | Logos et favicon |
| `assets/fonts/` | Marcellus, Hanken Grotesk, IBM Plex Mono |

## Pages de service

| Service | Français | Allemand | Italien |
|---|---|---|---|
| Déménagement pour particuliers | `demenagement-particulier.html` | `de/privatumzug.html` | `it/trasloco-privato.html` |
| Déménagement d'entreprise | `demenagement-entreprise.html` | `de/firmenumzug.html` | `it/trasloco-aziendale.html` |
| Nettoyage de fin de bail | `nettoyage-fin-de-bail.html` | `de/endreinigung.html` | `it/pulizia-fine-locazione.html` |
| Garde-meubles | `garde-meubles.html` | `de/moebellager.html` | `it/deposito-mobili.html` |

Le bouton « Demander un devis » de chaque page ouvre le formulaire de l'accueil avec le service déjà choisi (`./?service=entreprise#devis`).

## Photos à fournir

**État au 26.10.2026 :** les 9 emplacements ont une image générée par IA avec fal.ai (modèle Nano Banana 2), dans `assets/img/photo-*.jpg`. Les prompts sont dans `../site-source/prompts-images-fal.md` ; pour régénérer une image : `python3 site-source/generer_images_fal.py 4` (numéro de l'image). Les personnes représentées sont fictives : à remplacer par de vraies photos de l'équipe Domevia dès que possible. Le tableau ci-dessous décrit la photo réelle à prendre pour chaque emplacement.

Les cadres hachurés « Photo à remplacer » indiquent la photo à prendre et son format. Pour les remplacer, mettez la photo dans `assets/img/` et remplacez le `<figure class="photo …">…</figure>` par `<figure class="photo …"><img src="assets/img/nom.jpg" alt="description"></figure>` (avec `../assets/` dans `de/` et `it/`).

| N° | Emplacement | Format | Photo à prendre |
|---|---|---|---|
| 1 | Accueil, bandeau | 1200 × 1500 px | **Provisoire :** photo Pexels n° 7464385 (`assets/img/photo-accueil-bandeau.jpg`). À remplacer par : deux déménageurs Domevia en uniforme bleu nuit portent un canapé emballé vers le camion, devant un immeuble d'habitation. Lumière du matin, attitude souriante. |
| 2 | Accueil, carte Particuliers | 1600 × 900 px | **Provisoire :** photo Pexels n° 7464676 (`assets/img/photo-particulier-carte.jpg`, licence Pexels, usage commercial gratuit). À remplacer par : équipe Domevia protégeant un buffet avec des couvertures dans un salon lumineux. |
| 3 | Accueil, carte Entreprises | 1600 × 900 px | **Provisoire :** photo Pexels n° 7581042 (`assets/img/photo-entreprise-carte.jpg`). À remplacer par : déménageurs Domevia déplaçant des caisses étiquetées dans un open space, en fin de journée. |
| 4 | Accueil, carte Nettoyage | 1600 × 900 px | Collaboratrice Domevia détartrant une paroi de douche avec des produits professionnels. |
| 5 | Accueil, carte Garde-meubles | 1600 × 900 px | Rangée de box Domevia numérotés, avec meubles emballés et cartons étiquetés. |
| 6 | Page Particuliers | 1200 × 1500 px | Déménageur Domevia en uniforme portant des cartons étiquetés dans un escalier d'immeuble, protections de murs visibles. |
| 7 | Page Entreprises | 1200 × 1500 px | Chef de projet Domevia et responsable d'entreprise consultant un plan d'étage sur une tablette, dans des bureaux en cours de déménagement. |
| 8 | Page Nettoyage | 1200 × 1500 px | Collaboratrice Domevia nettoyant une fenêtre et ses stores dans un appartement vide et lumineux. |
| 9 | Page Garde-meubles | 1200 × 1500 px | Allée d'entrepôt Domevia propre et éclairée, box fermés et numérotés, un collaborateur scannant un carton étiqueté. |

Les mêmes 9 photos servent aux trois langues. Les photos Pexels sont sous licence Pexels : usage commercial gratuit, sans mention obligatoire, mais elles ne doivent pas laisser croire que les personnes photographiées travaillent pour Domevia.

## Le parcours client (géré dans Titanor)

Le site présente comme des services Domevia les étapes que l'équipe gère dans Titanor :

| Section du site | Ce que le client voit | Dans Titanor |
|---|---|---|
| Votre parcours (`#parcours`) | Les 5 étapes : demande, visite, offre en ligne, jour J, facture | Le dossier client unique |
| Visite à distance (`#visite`) | Le lien pour envoyer photos et vidéos pièce par pièce | Visite à distance |
| Offre en ligne (`#offre`) | Un **exemple interactif** d'offre à la carte (services, paiement, accepter, refuser avec motif) | Offre à la carte, motif de refus |
| Le jour J et après (`#jour-j`) | La lettre de voiture signée, les réserves photo, le lien de 8 jours pour un dommage caché, la QR-facture | Application équipe, lettre de voiture, QR-facture |
| Demande de devis (`#devis`) | NPA vérifié, choix du service, rendez-vous (appel, visite sur place ou à distance), jour et créneau | Demande par code postal, un lien par service |

Le formulaire de demande prépare aujourd'hui un e-mail. **Avant la mise en ligne, remplacez-le par vos liens de demande Titanor**, un par service. Les montants de l'exemple d'offre et de la facture reprennent la grille tarifaire du site.

## Avant la mise en ligne

- [ ] Réserver `domevia.ch` et créer l'adresse `info@domevia.ch`
- [x] Téléphone 079 576 58 91 et e-mail info@domevia.ch en place (26.10.2026)
- [ ] Compléter les champs surlignés de `mentions-legales.html` et `confidentialite.html` (raison sociale, adresse, IDE, TVA)
- [x] Tarifs validés le 22.10.2026 (même grille que `calculateur-devis-suisse.md`). Pour les changer : `TARIFS` dans `assets/js/main.js` et les prix « dès » de la section Services de `index.html`
- [ ] Brancher le formulaire sur les liens de demande Titanor (aujourd'hui il ouvre la messagerie du visiteur)
- [ ] Vérifier que les engagements du site correspondent à votre configuration Titanor : délai de 24 heures pour l'offre, paiement par QR-facture ou TWINT, lien de 8 jours pour un dommage caché
- [ ] Signer avec Titanor un contrat de sous-traitance des données (exigé par la nLPD) ; la politique de confidentialité mentionne déjà un logiciel de gestion hébergé en Europe
- [ ] Ajouter de vraies photos des équipes et des camions
- [x] Versions allemande (`de/`) et italienne (`it/`), avec sélecteur de langue et balises hreflang. Les textes affichés par l'estimateur sont dans `TEXTES` (`assets/js/main.js`). Les demandes de devis arrivent toujours en français, avec la langue du client dans l'objet.
- [ ] Faire relire les versions DE et IT par une personne de langue maternelle avant la mise en ligne
- [ ] Compléter aussi les champs surlignés de `de/impressum.html`, `de/datenschutz.html`, `it/note-legali.html` et `it/protezione-dati.html`

## Aperçu en local

```bash
cd "/Users/connector/Documents/Projet claude/site" && python3 -m http.server 8765
```

Puis ouvrir http://localhost:8765.
