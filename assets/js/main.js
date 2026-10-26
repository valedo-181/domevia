// Domevia – comportements du site : menu mobile, estimateur de prix, formulaire de devis.

// Grille tarifaire Domevia, prix TTC ronds (même grille que calculateur-devis-suisse.md).
// Le HT et la TVA se déduisent du total : HT = TTC ÷ 1,081.
const TARIFS = {
  m3PourPiece: 9,          // volume = pièces × 9 m³, arrondi au m³ supérieur
  m3Cave: 4,               // cave ou galetas
  demenagementM3: 56,      // CHF par m³, transport et main-d'œuvre
  etageM3: 3,              // CHF par m³ et par étage sans ascenseur
  kmInclus: 30,
  parKm: 3,                // CHF par km au-delà des km inclus
  remiseCombinee: 0.1,     // offre combinée : déménagement + nettoyage
  demarcheStationnement: 40, // la taxe communale s'ajoute au coût
  minimum: 640,            // minimum de facturation du déménagement
  stockageM3Mois: 15,      // CHF par m³ et par mois
  stockageMinM3: 5,
  nettoyage: { "1": 530, "2.5": 850, "3.5": 1180, "4.5": 1500, "5.5": 1830 },
  nettoyageBalcon: 95,
  nettoyageCave: 65,
  tva: 0.081,
  limiteCamion35t: 20      // m³
};

// Textes affichés par le script, selon la langue de la page (<html lang>).
const TEXTES = {
  fr: {
    menu: "Menu", fermer: "Fermer",
    avisBadge: (n) => `Note Google : ${n} sur 5. Voir les avis de nos clients`, avisVoir: "Voir les avis",
    demenagement: (v, p) => `Déménagement, ${v} m³ × ${p}`,
    etages: (n) => `Étages sans ascenseur (${n})`,
    distance: (km) => `Distance au-delà de ${km} km`,
    remise: "Remise offre combinée déménagement + nettoyage (10 %)",
    demenagementSeul: (v) => `Déménagement, ${v} m³`,
    stationnement: "Autorisation de stationnement, démarche (hors taxe communale)",
    nettoyage: "Nettoyage de fin de bail, forfait avec garantie",
    balcon: "Nettoyage balcon ou terrasse",
    cave: "Nettoyage cave ou galetas",
    stockage: (v, p) => `Garde-meubles, ${v} m³, 1er mois (${p} par mois)`,
    stockageNote: (p, m, t) => `Garde-meubles : ${p} par mois, facturé chaque mois. Pour ${m} mois prévus, comptez ${t} au total.`,
    petitCamion: "Un camion 3,5 t suffit",
    grandCamion: "Poids lourd, ou deux voyages en camion 3,5 t",
    consentement: "Merci d'accepter l'utilisation de vos données pour que nous puissions vous recontacter.",
    champ: (l) => `Merci de compléter le champ « ${l} ».`,
    envoye: "Votre messagerie s'ouvre avec votre demande prête à envoyer. Si rien ne s'ouvre, écrivez-nous à info@domevia.ch.",
    npaFormat: "Le NPA compte 4 chiffres, par exemple 2000.",
    npaInconnu: "Ce NPA n'existe pas en Suisse. Vérifiez-le, s'il vous plaît.",
    npaHorsZone: "Nous intervenons uniquement en Suisse. Pour le Liechtenstein, appelez-nous : nous vous orientons volontiers.",
    npaOk: (n, r) => `NPA ${n} : nous intervenons dans votre région (${r}). Choisissez votre service.`,
    npaAVerifier: "Indiquez d'abord votre NPA et cliquez sur « Vérifier ».",
    regions: { 1: "Suisse romande", 2: "Neuchâtel, Jura et Jura bernois", 3: "Berne et Haut-Valais", 4: "Bâle et Nord-Ouest", 5: "Argovie", 6: "Suisse centrale", 66: "Tessin", 7: "Grisons", 8: "Zurich et Suisse orientale", 9: "Suisse orientale" },
    estimationMsg: (v, p) => `Estimation en ligne : ${v} m³, ${p} TTC.`,
    offreAcceptee: "Exemple : dans votre offre réelle, ce bouton confirme la réservation. Vous recevez aussitôt une confirmation par e-mail.",
    offreRefusee: (m) => `Exemple : votre motif « ${m} » nous est transmis et nous vous rappelons.`,
    envoyerMotif: "Envoyer le motif",
  },
  de: {
    menu: "Menü", fermer: "Schliessen",
    avisBadge: (n) => `Google-Bewertung: ${n} von 5. Bewertungen unserer Kundschaft ansehen`, avisVoir: "Bewertungen ansehen",
    demenagement: (v, p) => `Umzug, ${v} m³ × ${p}`,
    etages: (n) => `Stockwerke ohne Lift (${n})`,
    distance: (km) => `Distanz über ${km} km`,
    remise: "Kombi-Rabatt Umzug + Endreinigung (10 %)",
    demenagementSeul: (v) => `Umzug, ${v} m³`,
    stationnement: "Parkbewilligung, Bearbeitung (ohne Gemeindegebühr)",
    nettoyage: "Endreinigung, Pauschale mit Abnahmegarantie",
    balcon: "Reinigung Balkon oder Terrasse",
    cave: "Reinigung Keller oder Estrich",
    stockage: (v, p) => `Möbellager, ${v} m³, erster Monat (${p} pro Monat)`,
    stockageNote: (p, m, t) => `Möbellager: ${p} pro Monat, monatlich verrechnet. Für ${m} geplante Monate rechnen Sie mit insgesamt ${t}.`,
    petitCamion: "Ein 3,5-t-Lieferwagen genügt",
    grandCamion: "Lastwagen oder zwei Fahrten mit dem 3,5-t-Lieferwagen",
    consentement: "Bitte stimmen Sie der Verwendung Ihrer Daten zu, damit wir Sie kontaktieren können.",
    champ: (l) => `Bitte füllen Sie das Feld «${l}» aus.`,
    envoye: "Ihr E-Mail-Programm öffnet sich mit Ihrer vorbereiteten Anfrage. Falls nichts geschieht, schreiben Sie uns an info@domevia.ch.",
    npaFormat: "Die PLZ hat 4 Ziffern, zum Beispiel 8001.",
    npaInconnu: "Diese PLZ gibt es in der Schweiz nicht. Bitte prüfen Sie sie.",
    npaHorsZone: "Wir sind nur in der Schweiz tätig. Für Liechtenstein rufen Sie uns bitte an: Wir beraten Sie gerne.",
    npaOk: (n, r) => `PLZ ${n}: Wir sind in Ihrer Region tätig (${r}). Wählen Sie Ihre Leistung.`,
    npaAVerifier: "Geben Sie zuerst Ihre PLZ ein und klicken Sie auf «Prüfen».",
    regions: { 1: "Westschweiz", 2: "Neuenburg, Jura und Berner Jura", 3: "Bern und Oberwallis", 4: "Basel und Nordwestschweiz", 5: "Aargau", 6: "Zentralschweiz", 66: "Tessin", 7: "Graubünden", 8: "Zürich und Ostschweiz", 9: "Ostschweiz" },
    estimationMsg: (v, p) => `Online-Schätzung: ${v} m³, ${p} inkl. MWST.`,
    offreAcceptee: "Beispiel: In Ihrer echten Offerte bestätigt dieser Knopf die Reservation. Sie erhalten sofort eine Bestätigung per E-Mail.",
    offreRefusee: (m) => `Beispiel: Ihr Grund «${m}» wird uns übermittelt, und wir rufen Sie zurück.`,
    envoyerMotif: "Grund senden",
  },
  it: {
    menu: "Menu", fermer: "Chiudi",
    avisBadge: (n) => `Valutazione Google: ${n} su 5. Leggi le recensioni dei nostri clienti`, avisVoir: "Leggi le recensioni",
    demenagement: (v, p) => `Trasloco, ${v} m³ × ${p}`,
    etages: (n) => `Piani senza ascensore (${n})`,
    distance: (km) => `Distanza oltre ${km} km`,
    remise: "Sconto offerta combinata trasloco + pulizia (10 %)",
    demenagementSeul: (v) => `Trasloco, ${v} m³`,
    stationnement: "Permesso di parcheggio, pratica (tassa comunale esclusa)",
    nettoyage: "Pulizia di fine locazione, forfait con garanzia",
    balcon: "Pulizia balcone o terrazza",
    cave: "Pulizia cantina o solaio",
    stockage: (v, p) => `Deposito mobili, ${v} m³, primo mese (${p} al mese)`,
    stockageNote: (p, m, t) => `Deposito mobili: ${p} al mese, fatturati mensilmente. Per ${m} mesi previsti, conti ${t} in totale.`,
    petitCamion: "Basta un furgone da 3,5 t",
    grandCamion: "Autocarro, oppure due viaggi con il furgone da 3,5 t",
    consentement: "Per poterla ricontattare, la preghiamo di accettare l'uso dei Suoi dati.",
    champ: (l) => `La preghiamo di compilare il campo «${l}».`,
    envoye: "Il Suo programma di posta si apre con la richiesta pronta da inviare. Se non si apre nulla, ci scriva a info@domevia.ch.",
    npaFormat: "L'NPA ha 4 cifre, ad esempio 6900.",
    npaInconnu: "Questo NPA non esiste in Svizzera. La preghiamo di verificarlo.",
    npaHorsZone: "Interveniamo solo in Svizzera. Per il Liechtenstein ci chiami: saremo lieti di consigliarLa.",
    npaOk: (n, r) => `NPA ${n}: interveniamo nella Sua regione (${r}). Scelga il servizio.`,
    npaAVerifier: "Indichi prima il Suo NPA e clicchi su «Verificare».",
    regions: { 1: "Svizzera romanda", 2: "Neuchâtel, Giura e Giura bernese", 3: "Berna e Alto Vallese", 4: "Basilea e Nord-ovest", 5: "Argovia", 6: "Svizzera centrale", 66: "Ticino", 7: "Grigioni", 8: "Zurigo e Svizzera orientale", 9: "Svizzera orientale" },
    estimationMsg: (v, p) => `Stima online: ${v} m³, ${p} IVA inclusa.`,
    offreAcceptee: "Esempio: nella Sua offerta reale, questo pulsante conferma la prenotazione. Riceve subito una conferma per e-mail.",
    offreRefusee: (m) => `Esempio: il Suo motivo «${m}» ci viene trasmesso e La richiamiamo.`,
    envoyerMotif: "Inviare il motivo",
  },
};
const LANGUE = (document.documentElement.lang || "fr").slice(0, 2);
const T = TEXTES[LANGUE] || TEXTES.fr;

const chf = (n) => "CHF " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const arrondi5 = (n) => Math.round(n * 20) / 20;

// Menu mobile
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? T.fermer : T.menu;
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = T.menu;
  }));
}

// Estimateur
const est = document.getElementById("estimator");
if (est) {
  const $ = (id) => document.getElementById(id);
  const nombre = (id, min, max) => Math.min(max, Math.max(min, parseInt($(id).value, 10) || 0));

  const calculer = () => {
    const pieces = $("est-pieces").value;
    const etages = nombre("est-etages", 0, 12);
    const km = nombre("est-km", 0, 400);
    const cave = $("est-cave").checked;
    const nettoyage = $("est-nettoyage").checked;
    const balcon = $("est-balcon").checked;
    const stockage = $("est-stockage").checked;
    const mois = nombre("est-mois", 1, 36);
    $("est-mois-wrap").hidden = !stockage;
    $("est-balcon-wrap").hidden = !nettoyage;

    const volume = Math.ceil(parseFloat(pieces) * TARIFS.m3PourPiece) + (cave ? TARIFS.m3Cave : 0);

    // Déménagement : volume, étages et distance
    let demenagement = volume * TARIFS.demenagementM3 + volume * TARIFS.etageM3 * etages
      + Math.max(0, km - TARIFS.kmInclus) * TARIFS.parKm;
    const lignes = [[T.demenagement(volume, chf(TARIFS.demenagementM3)), volume * TARIFS.demenagementM3]];
    if (etages > 0) lignes.push([T.etages(etages), volume * TARIFS.etageM3 * etages]);
    if (km > TARIFS.kmInclus) lignes.push([T.distance(TARIFS.kmInclus), (km - TARIFS.kmInclus) * TARIFS.parKm]);
    // Le minimum de facturation s'applique sans être affiché : une seule ligne au montant minimum
    if (demenagement < TARIFS.minimum) {
      demenagement = TARIFS.minimum;
      lignes.splice(0, lignes.length, [T.demenagementSeul(volume), demenagement]);
    }
    lignes.push([T.stationnement, TARIFS.demarcheStationnement]);

    let remise = 0;
    if (nettoyage) {
      const prixNettoyage = TARIFS.nettoyage[pieces] + (balcon ? TARIFS.nettoyageBalcon : 0) + (cave ? TARIFS.nettoyageCave : 0);
      lignes.push([T.nettoyage, TARIFS.nettoyage[pieces]]);
      if (balcon) lignes.push([T.balcon, TARIFS.nettoyageBalcon]);
      if (cave) lignes.push([T.cave, TARIFS.nettoyageCave]);
      // Offre combinée : 10 % sur le déménagement et le nettoyage (hors stationnement et garde-meubles)
      remise = Math.round((demenagement + prixNettoyage) * TARIFS.remiseCombinee * 100) / 100;
    }
    // Garde-meubles : seul le premier mois entre dans l'estimation ; les mois suivants sont facturés chaque mois
    const noteStockage = $("res-stockage");
    noteStockage.hidden = !stockage;
    if (stockage) {
      const stocke = Math.max(volume, TARIFS.stockageMinM3);
      const parMois = stocke * TARIFS.stockageM3Mois;
      lignes.push([T.stockage(stocke, chf(parMois)), parMois]);
      noteStockage.textContent = mois > 1 ? T.stockageNote(chf(parMois), mois, chf(parMois * mois)) : "";
      noteStockage.hidden = mois <= 1;
    }

    // La remise s'affiche en dernier, juste avant l'estimation TTC
    if (remise) lignes.push([T.remise, -remise, "remise"]);

    const ttc = arrondi5(lignes.reduce((s, [, v]) => s + v, 0));
    const ht = Math.round(ttc / (1 + TARIFS.tva) * 100) / 100;
    const tva = Math.round((ttc - ht) * 100) / 100;

    $("res-volume").textContent = `${volume} m³`;
    $("res-camion").textContent = volume <= TARIFS.limiteCamion35t ? T.petitCamion : T.grandCamion;
    $("res-lignes").replaceChildren(...lignes.map(([libelle, montant, classe]) => {
      const tr = document.createElement("tr");
      if (classe) tr.className = classe;
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = libelle;
      const td = document.createElement("td");
      td.className = "num";
      td.textContent = montant < 0 ? "− " + chf(-montant) : chf(montant);
      tr.append(th, td);
      return tr;
    }));
    $("res-ttc").textContent = chf(ttc);
    $("res-tva").textContent = chf(tva);
    $("res-ht").textContent = chf(ht);
  };

  est.addEventListener("input", calculer);
  est.addEventListener("change", calculer);
  est.addEventListener("submit", (e) => e.preventDefault());
  calculer();

  // Reporte les choix de l'estimateur dans le formulaire de devis
  $("est-to-devis").addEventListener("click", () => {
    // Absent quand la demande de devis est le formulaire Titanor intégré
    if (!$("q-pieces")) return;
    $("q-pieces").selectedIndex = $("est-pieces").selectedIndex;
    const message = $("q-message");
    if (!message.value.trim()) message.value = T.estimationMsg($("res-volume").textContent.replace(" m³", ""), $("res-ttc").textContent);
  });
}

// Exemple d'offre en ligne : le client coche ses services, le total se met à jour
const offre = document.getElementById("offre-demo");
if (offre) {
  const lignes = [...offre.querySelectorAll("input[data-prix]")];
  const msg = document.getElementById("of-msg");
  const refus = document.getElementById("of-refus");
  const btnRefus = document.getElementById("of-btn-refus");
  const majOffre = () => {
    // Offre combinée : 10 % sur le déménagement et le nettoyage quand les deux sont cochés
    const dem = document.getElementById("of-dem"), net = document.getElementById("of-net");
    const remise = dem.checked && net.checked
      ? Math.round((Number(dem.dataset.prix) + Number(net.dataset.prix)) * TARIFS.remiseCombinee * 100) / 100 : 0;
    document.getElementById("of-remise-row").hidden = !remise;
    document.getElementById("of-remise").textContent = "− " + chf(remise).replace("CHF ", "");
    const ttc = arrondi5(lignes.filter((l) => l.checked).reduce((s, l) => s + Number(l.dataset.prix), 0) - remise);
    const ht = Math.round(ttc / (1 + TARIFS.tva) * 100) / 100;
    document.getElementById("of-ttc").textContent = chf(ttc);
    document.getElementById("of-tva").textContent = chf(Math.round((ttc - ht) * 100) / 100);
  };
  lignes.forEach((l) => l.addEventListener("change", majOffre));
  majOffre();
  const libelleRefus = btnRefus.textContent;
  btnRefus.addEventListener("click", () => {
    if (refus.hidden) {
      refus.hidden = false;
      btnRefus.textContent = T.envoyerMotif;
      document.getElementById("of-motif").focus();
      return;
    }
    msg.textContent = T.offreRefusee(document.getElementById("of-motif").value);
    msg.hidden = false;
    refus.hidden = true;
    btnRefus.textContent = libelleRefus;
  });
  offre.addEventListener("submit", (e) => {
    e.preventDefault();
    refus.hidden = true;
    btnRefus.textContent = libelleRefus;
    msg.textContent = T.offreAcceptee;
    msg.hidden = false;
  });
}

// Demande par code postal : NPA suisse valide, hors Liechtenstein (9485 – 9498)
const regionNPA = (npa) => {
  const n = Number(npa);
  if (n >= 6500 && n <= 6999) return T.regions[66];
  return T.regions[String(npa)[0]];
};
const verifierNPA = (npa) => {
  if (!/^\d{4}$/.test(npa)) return { ok: false, texte: T.npaFormat };
  const n = Number(npa);
  if (n < 1000 || n > 9658) return { ok: false, texte: T.npaInconnu };
  if (n >= 9485 && n <= 9498) return { ok: false, texte: T.npaHorsZone };
  return { ok: true, texte: T.npaOk(npa, regionNPA(npa)) };
};

// Jours ouvrables proposés pour le rendez-vous (les 10 prochains, sans samedi ni dimanche)
const joursRdv = document.getElementById("q-rdv-jour");
if (joursRdv) {
  const format = new Intl.DateTimeFormat(document.documentElement.lang || "fr-CH", { weekday: "long", day: "numeric", month: "long" });
  const jour = new Date();
  const options = [];
  while (options.length < 10) {
    jour.setDate(jour.getDate() + 1);
    if (jour.getDay() === 0 || jour.getDay() === 6) continue;
    const texte = format.format(jour);
    const o = document.createElement("option");
    o.value = jour.toISOString().slice(0, 10);
    o.textContent = texte.charAt(0).toUpperCase() + texte.slice(1);
    options.push(o);
  }
  joursRdv.replaceChildren(...options);
}

// Formulaire de devis
// Site statique : la demande est préparée dans le logiciel de messagerie du visiteur.
// À remplacer par un service d'envoi de formulaire (ou un petit serveur) avant la mise en ligne.
// Le message reçu par Domevia reste en français, avec la langue du client.
const form = document.getElementById("quote-form");
if (form) {
  const erreur = document.getElementById("q-error");
  const ok = document.getElementById("q-ok");
  const npa = document.getElementById("q-npa");
  const npaMsg = document.getElementById("q-npa-msg");
  const suites = ["q-suite", "q-suite-rdv", "q-suite-coord"].map((id) => document.getElementById(id));
  let npaValide = false;
  const controlerNPA = () => {
    const r = verifierNPA(npa.value.trim());
    npaValide = r.ok;
    npaMsg.textContent = r.texte;
    npaMsg.classList.toggle("ok", r.ok);
    npaMsg.classList.toggle("ko", !r.ok);
    suites.forEach((f) => { f.disabled = !r.ok; });
  };
  document.getElementById("q-npa-btn").addEventListener("click", controlerNPA);
  npa.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); controlerNPA(); } });
  npa.addEventListener("input", () => { if (npa.value.trim().length === 4) controlerNPA(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    erreur.hidden = true;
    ok.hidden = true;
    if (!npaValide) {
      erreur.textContent = T.npaAVerifier;
      erreur.hidden = false;
      npa.focus();
      return;
    }
    const manquant = [...form.querySelectorAll("[required]")].find((el) =>
      el.type === "checkbox" ? !el.checked : !el.value.trim() || !el.checkValidity());
    if (manquant) {
      erreur.textContent = manquant.type === "checkbox"
        ? T.consentement
        : T.champ(form.querySelector(`label[for="${manquant.id}"]`).textContent.trim());
      erreur.hidden = false;
      manquant.focus();
      return;
    }
    const d = new FormData(form);
    const corps = [
      `Langue du client : ${LANGUE.toUpperCase()}`,
      `NPA : ${d.get("npa")}`,
      `Service : ${d.get("service")}`,
      `Rendez-vous : ${d.get("rdv")}, ${joursRdv.selectedOptions[0]?.textContent || ""}, ${d.get("rdv_heure")}`,
      "",
      `Nom : ${d.get("nom")}`,
      `Téléphone : ${d.get("telephone")}`,
      `E-mail : ${d.get("email")}`,
      `Adresse actuelle : ${d.get("depart")}`,
      `Arrivée : ${d.get("arrivee") || "à préciser"}`,
      `Date souhaitée : ${d.get("date") || "à convenir"}`,
      `Logement : ${d.get("pieces")}`,
      "",
      d.get("message") || "",
    ].join("\n");
    const sujet = `Demande [${LANGUE.toUpperCase()}] – ${d.get("service")} – ${d.get("nom")}`;
    window.location.href = `mailto:info@domevia.ch?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    ok.textContent = T.envoye;
    ok.hidden = false;
  });
}

// Service présélectionné depuis une page de service (lien « ./?service=entreprise#devis »)
const SERVICES_DEMANDE = {
  particulier: "Déménagement de particulier", entreprise: "Déménagement d'entreprise", piano: "Piano ou objet lourd",
  nettoyage: "Nettoyage de fin de bail", "garde-meubles": "Garde-meubles",
};
const serviceDemande = SERVICES_DEMANDE[new URLSearchParams(location.search).get("service")];
if (serviceDemande) {
  const choix = [...document.querySelectorAll('input[name="service"]')].find((r) => r.value === serviceDemande);
  if (choix) choix.checked = true;
}

// Formulaire Titanor intégré : affiché compact (étape 1), il s'agrandit dès que le visiteur clique dedans.
// Un clic dans un cadre d'un autre site retire le focus de la page : c'est ce signal qu'on écoute.
const cadreDevis = document.querySelector(".quote-embed");
if (cadreDevis) {
  window.addEventListener("blur", () => setTimeout(() => {
    if (document.activeElement === cadreDevis.querySelector("iframe")) cadreDevis.classList.add("is-open");
  }));
}

// Carrousel des avis Google : le widget Titanor affiche ses 4 avis en grille dans un cadre d'un autre site.
// On élargit ce cadre pour que les 4 cartes tiennent sur une ligne, et on fait défiler la bande.
// Mesures du widget (26.10.2026) : marge intérieure 21 px, écart 12 px, cartes de 240 px minimum
// (au-delà de ~300 px par carte, le widget ajoute une 5e colonne vide).
const carrousel = document.querySelector(".avis-carrousel");
if (carrousel) {
  const piste = carrousel.querySelector(".avis-piste");
  const widget = carrousel.querySelector(".avis-widget");
  const [prec, suiv] = carrousel.querySelectorAll(".avis-btn");
  const MARGE = 21, ECART = 12, NB = 4, CARTE_MAX = 300;
  let pas = 0;
  const majBoutons = () => {
    prec.disabled = piste.scrollLeft <= 2;
    suiv.disabled = piste.scrollLeft >= piste.scrollWidth - piste.clientWidth - 2;
  };
  const dimensionner = () => {
    const w = piste.clientWidth;
    const visibles = w >= 960 ? 3 : w >= 620 ? 2 : 1;
    const carte = Math.min(CARTE_MAX, (w - 2 * MARGE - (visibles - 1) * ECART) / visibles);
    widget.style.width = `${2 * MARGE + NB * carte + (NB - 1) * ECART}px`;
    pas = carte + ECART;
    majBoutons();
  };
  const defiler = (sens) => piste.scrollBy({ left: sens * pas, behavior: "smooth" });
  [prec, suiv].forEach((b) => b.addEventListener("click", () => defiler(Number(b.dataset.dir))));
  piste.addEventListener("scroll", majBoutons, { passive: true });
  piste.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); defiler(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); defiler(-1); }
  });
  window.addEventListener("resize", dimensionner);
  dimensionner();

  // Défilement automatique toutes les 6 secondes, en pause au survol ou au focus, et jamais si l'utilisateur
  // a demandé moins d'animations
  let pause = false;
  ["mouseenter", "focusin"].forEach((ev) => carrousel.addEventListener(ev, () => { pause = true; }));
  ["mouseleave", "focusout"].forEach((ev) => carrousel.addEventListener(ev, () => { pause = false; }));
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(() => {
      if (pause || document.hidden) return;
      if (suiv.disabled) piste.scrollTo({ left: 0, behavior: "smooth" });
      else defiler(1);
    }, 6000);
  }
}

const annee = document.getElementById("annee");
if (annee) annee.textContent = new Date().getFullYear();

// Badge « note Google » fixé sur le bord droit : il mène à la section des avis de l'accueil.
// Note à reporter à la main depuis la fiche Google, pour qu'elle reste identique à celle affichée par Google.
const NOTE_GOOGLE = "4.8";
const sectionAvis = document.getElementById("avis");
if (document.querySelector(".site-header")) {
  const badge = document.createElement("a");
  badge.className = "avis-badge";
  badge.href = sectionAvis ? "#avis" : "./#avis";
  badge.setAttribute("aria-label", T.avisBadge(NOTE_GOOGLE.replace(".", ",")));
  badge.innerHTML = `
    <span class="avis-badge__carte">
      <span class="avis-badge__note">${NOTE_GOOGLE} <small>/ 5</small></span>
      <svg class="avis-badge__etoile" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z"/></svg>
      <span class="avis-badge__trait"></span>
      <svg class="avis-badge__g" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span class="avis-badge__voir">${T.avisVoir}</span>
    </span>
    <span class="avis-badge__barre" aria-hidden="true"></span>`;
  document.body.append(badge);
  // Une fois la section des avis à l'écran, le badge s'efface : il ferait doublon
  if (sectionAvis && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => badge.classList.toggle("is-cache", e.isIntersecting), { threshold: 0.2 }).observe(sectionAvis);
  }
}
