import type { Client, Copieur, FactureMensuelle, ReleveCompteur } from '../types';

const MOIS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function nombreEnLettres(n: number): string {
  n = Math.round(n);
  if (n === 0) return 'Zéro';
  const U = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
    'dix-sept', 'dix-huit', 'dix-neuf'];
  function d2(x: number): string {
    if (x < 20) return U[x];
    const d = Math.floor(x / 10), u = x % 10;
    const T: Record<number, string> = { 2:'vingt', 3:'trente', 4:'quarante', 5:'cinquante', 6:'soixante' };
    if (d <= 6) return u === 0 ? T[d] : u === 1 ? `${T[d]}-et-un` : `${T[d]}-${U[u]}`;
    if (d === 7) return `soixante-${U[10+u]}`;
    if (d === 8) return u === 0 ? 'quatre-vingts' : `quatre-vingt-${U[u]}`;
    return `quatre-vingt-${U[10+u]}`;
  }
  function d3(x: number): string {
    if (x < 100) return d2(x);
    const c = Math.floor(x / 100), r = x % 100;
    if (c === 1) return r === 0 ? 'cent' : `cent ${d2(r)}`;
    return `${U[c]} cent${r === 0 ? 's' : ' ' + d2(r)}`;
  }
  function rec(x: number): string {
    if (x === 0) return '';
    if (x < 1000) return d3(x);
    if (x < 1_000_000) {
      const th = Math.floor(x / 1000), r = x % 1000;
      const p = th === 1 ? 'mille' : `${d3(th)} mille`;
      return r === 0 ? p : `${p} ${d3(r)}`;
    }
    const m = Math.floor(x / 1_000_000), r = x % 1_000_000;
    const p = m === 1 ? 'un million' : `${d3(m)} millions`;
    return r === 0 ? p : `${p} ${rec(r)}`;
  }
  const s = rec(n);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

/* Génère les lignes HTML pour un copieur (rowspan sur Département/Machine/Série + Totaux) */
function buildRows(r: ReleveCompteur, cop: Copieur | undefined): string {
  const loc = cop?.localisation || '—';

  // Lignes de format à afficher : on n'affiche que celles dont les compteurs sont non nuls
  const rows: { label: string; debut: number; fin: number }[] = [];
  if (r.a3MonoDebut > 0 || r.a3MonoFin > 0)
    rows.push({ label: 'Format A3 Mono', debut: r.a3MonoDebut, fin: r.a3MonoFin });
  if (r.a4MonoDebut > 0 || r.a4MonoFin > 0)
    rows.push({ label: 'Format A4 Mono', debut: r.a4MonoDebut, fin: r.a4MonoFin });
  if (r.a3CoulDebut > 0 || r.a3CoulFin > 0)
    rows.push({ label: 'Format A3 Coul', debut: r.a3CoulDebut, fin: r.a3CoulFin });
  if (r.a4CoulDebut > 0 || r.a4CoulFin > 0)
    rows.push({ label: 'Format A4 Coul', debut: r.a4CoulDebut, fin: r.a4CoulFin });

  // fallback si tout à 0
  if (rows.length === 0) {
    rows.push({ label: 'Format A4 Mono', debut: r.a4MonoDebut, fin: r.a4MonoFin });
    rows.push({ label: 'Format A4 Coul', debut: r.a4CoulDebut, fin: r.a4CoulFin });
  }

  const rs = rows.length;

  return rows.map((f, i) => {
    const diff = Math.max(0, f.fin - f.debut);
    // Les cellules avec rowspan ne s'affichent que sur la première ligne
    const head = i === 0 ? `
      <td rowspan="${rs}" class="td-dept">${loc}</td>
      <td rowspan="${rs}" class="td-cop">${r.nomCopieur}</td>
      <td rowspan="${rs}" class="td-ser">${r.numeroSerie}</td>` : '';
    const tail = i === 0 ? `
      <td rowspan="${rs}" class="td-mono">${fmt(r.copiesMonoA4Eq)}</td>
      <td rowspan="${rs}" class="td-coul">${r.copiesCoulA4Eq > 0 ? fmt(r.copiesCoulA4Eq) : '0'}</td>` : '';

    return `<tr>${head}
      <td class="td-fmt">${f.label}</td>
      <td class="td-ctr">${fmt(f.debut)}</td>
      <td class="td-ctr">${fmt(f.fin)}</td>
      <td class="td-ctr">${fmt(diff)}</td>${tail}
    </tr>`;
  }).join('');
}

export function printFacture(
  client: Client,
  releves: ReleveCompteur[],
  facture: FactureMensuelle,
  copieurs: Copieur[],
  mois: number,
  annee: number,
  logoBase64 = '',
  nomSociete = 'BURINFORT',
): void {
  const moisPrec = mois === 1 ? 12 : mois - 1;
  const anneePrec = mois === 1 ? annee - 1 : annee;
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const copieurMap = new Map(copieurs.map(c => [c.id, c]));

  const allRows = releves.map(r => buildRows(r, copieurMap.get(r.copieurId))).join('');

  const costsSupMono = Math.round(facture.copiesSupMono * client.prixCopieSupMono);
  const costsSupCoul = Math.round(facture.copiesSupCouleur * client.prixCopieSupCouleur);
  const montantLettres = nombreEnLettres(facture.totalTTC);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${MOIS[mois]} ${annee} — ${client.nomClient}</title>
<style>
  @page { size: A4; margin: 8mm 10mm 10mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #111; }

  /* ── LOGO / TOP BAND ── */
  .logo-band {
    display: flex; align-items: center; gap: 3mm;
    padding-bottom: 3mm; margin-bottom: 4mm;
    border-bottom: 2pt solid #C0504D;
  }
  .brand-name { font-size: 14pt; font-weight: 900; color: #C0504D; letter-spacing: -0.02em; }
  .brand-sub  { font-size: 6.5pt; color: #999; text-transform: uppercase; letter-spacing: 0.1em; }
  .doc-info   { margin-left: auto; text-align: right; font-size: 7pt; color: #888; }

  /* ── CLIENT BLOCK ── */
  .page-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 5mm; margin-bottom: 5mm; }

  .client-box { border: 1.5pt solid #666; padding: 3mm; flex: 0 0 auto; min-width: 82mm; }
  .client-lbl  { font-weight: 900; font-size: 9pt; text-decoration: underline; margin-bottom: 2mm; }
  .client-name { font-size: 10pt; font-weight: 800; }
  .client-sub  { font-size: 8pt; margin-top: 1mm; }
  .client-tel  { font-size: 9pt; font-weight: 700; margin-top: 2.5mm; text-decoration: underline; }

  .contract-box { flex: 1; }
  .contract-box table { width: 100%; border-collapse: collapse; }
  .contract-box td { border: 0.8pt solid #999; padding: 1.5mm 2.5mm; }
  .ct-lbl  { font-weight: 700; background: #f0f0f0; width: 40%; font-size: 8.5pt; }
  .ct-mois { font-size: 12pt; font-weight: 900; text-align: right; letter-spacing: 0.04em; }
  .ct-red  { color: #C0504D; font-weight: 800; }
  .ct-val  { text-align: right; font-weight: 600; font-size: 8pt; }

  /* ── MAIN TABLE ── */
  .main-tbl { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 5mm; }
  .main-tbl th, .main-tbl td { border: 0.5pt solid #aaa; }

  /* En-têtes couleurs */
  .th-dk  { background: #C0504D; color: #fff; font-weight: 700; text-align: center;
            padding: 1.5mm 1mm; font-size: 7pt; vertical-align: middle; }
  .th-md  { background: #D07070; color: #fff; font-weight: 700; text-align: center;
            padding: 1.5mm 1mm; font-size: 7pt; vertical-align: middle; }
  .th-lt  { background: #F2DCDB; color: #333; font-weight: 700; text-align: center;
            padding: 1.5mm 1mm; font-size: 7pt; vertical-align: middle; }

  /* Cellules données */
  .td-dept { text-align: center; vertical-align: middle; font-weight: 600; font-size: 7.5pt;
             padding: 1mm; background: #fff; }
  .td-cop  { vertical-align: middle; font-weight: 700; font-size: 7.5pt;
             padding: 1mm 2mm; background: #fff; }
  .td-ser  { text-align: center; vertical-align: middle; font-family: monospace; font-size: 7pt;
             padding: 1mm; background: #fff; }
  .td-fmt  { padding: 1mm 2mm; background: #fafafa; }
  .td-ctr  { text-align: right; padding: 1mm 2mm; background: #fafafa; }
  .td-mono { text-align: center; vertical-align: middle; font-weight: 800; font-size: 10pt;
             padding: 1mm; background: #fff; }
  .td-coul { text-align: center; vertical-align: middle; font-weight: 800; font-size: 10pt;
             color: #C0504D; padding: 1mm; background: #fff; }

  /* ── SUMMARY BLOCK ── */
  .bottom-wrap { display: flex; gap: 5mm; align-items: flex-end; }

  .vol-tbl { border-collapse: collapse; font-size: 7.5pt; flex: 1; }
  .vol-tbl th, .vol-tbl td { border: 0.5pt solid #aaa; padding: 1.2mm 2mm; }
  .vol-tbl .vh-dk { background: #C0504D; color: #fff; font-weight: 700; text-align: center; font-size: 7pt; }
  .vol-tbl .vh-md { background: #D07070; color: #fff; font-weight: 700; text-align: center; font-size: 7pt; }
  .vol-tbl .vr    { text-align: right; }
  .vol-tbl .vb    { font-weight: 700; }
  .vol-tbl .vc    { color: #C0504D; font-weight: 700; }

  /* ── TOTAUX TABLE ── */
  .tot-tbl { border-collapse: collapse; font-size: 9pt; }
  .tot-tbl td { border: 0.8pt solid #999; padding: 1.8mm 3mm; white-space: nowrap; }
  .tl  { font-weight: 700; background: #f5f5f5; }
  .tv  { text-align: right; font-weight: 800; min-width: 32mm; }
  .tu  { font-size: 8pt; color: #555; }
  .ttc { background: #BDD7EE !important; font-size: 12pt; font-weight: 900; }
  .tht { background: #f5f5f5; font-weight: 700; border-top: 1.5pt solid #555 !important; }

  /* ── MONTANT EN LETTRES ── */
  .lettres { border: 1pt solid #f59e0b; background: #fffbf0; padding: 2mm 3mm;
             margin-top: 4mm; border-radius: 3px; }
  .lettres .ll { font-size: 6.5pt; font-weight: 700; color: #92400e;
                 text-transform: uppercase; letter-spacing: 0.07em; }
  .lettres .lv { font-size: 8.5pt; font-style: italic; font-weight: 600; margin-top: 1mm; }

  /* ── PIED DE PAGE ── */
  .footer { margin-top: 5mm; padding-top: 3mm; border-top: 0.8pt solid #ccc;
            display: flex; justify-content: space-between; font-size: 7pt; color: #888; }
  .sig-line { border-bottom: 0.8pt solid #333; width: 52mm; height: 10mm; margin: 6mm 0 1mm auto; }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    tfoot { display: table-row-group; }
  }
</style>
</head>
<body>

<!-- ── Logo + Société ── -->
<div class="logo-band">
  ${logoBase64 ? `<img src="${logoBase64}" alt="logo" style="max-height:42px;max-width:120px;object-fit:contain;">` : ''}
  <div>
    <div class="brand-name">${nomSociete}</div>
    <div class="brand-sub">Service Technique / SAV</div>
  </div>
  <div class="doc-info">
    <strong style="font-size:8.5pt;color:#333;">RELEVÉ DE FACTURATION MENSUELLE</strong><br>
    Édité le ${today}
  </div>
</div>

<!-- ── Client + Contrat ── -->
<div class="page-top">
  <div class="client-box">
    <div class="client-lbl">CLIENT :</div>
    <div class="client-name">${client.nomClient}</div>
    ${client.raisonSociale && client.raisonSociale !== client.nomClient
      ? `<div class="client-sub">${client.raisonSociale}</div>` : ''}
    ${client.adresse
      ? `<div class="client-sub">${client.adresse}${client.ville ? ', ' + client.ville : ''}</div>` : ''}
    ${client.numeroContrat
      ? `<div class="client-sub">N° : ${client.numeroContrat}</div>` : ''}
    ${client.telephone
      ? `<div class="client-tel">TEL : ${client.telephone}</div>` : ''}
  </div>

  <div class="contract-box">
    <table>
      <tr>
        <td class="ct-lbl">MOIS</td>
        <td class="ct-mois">${MOIS[mois].toUpperCase()}</td>
      </tr>
      <tr>
        <td class="ct-lbl ct-red">CONTRAT N°</td>
        <td class="ct-val">${client.numeroContrat || '—'}</td>
      </tr>
      <tr>
        <td class="ct-lbl">Date</td>
        <td class="ct-val">${today}</td>
      </tr>
    </table>
  </div>
</div>

<!-- ── Tableau principal des relevés ── -->
<table class="main-tbl">
  <thead>
    <tr>
      <th rowspan="2" class="th-lt">Département</th>
      <th rowspan="2" class="th-lt">Copieurs</th>
      <th rowspan="2" class="th-lt">N° Séries</th>
      <th colspan="4" class="th-lt" style="border-bottom:0.5pt solid #C0504D;">
        Relévés Compteurs Copies
      </th>
      <th colspan="2" class="th-dk">
        Nombre de copies effectuées<br>en unités de A4 et Forfaits
      </th>
    </tr>
    <tr>
      <th class="th-md">Format Papier</th>
      <th class="th-md">Compteurs fin<br>${MOIS[moisPrec]} ${anneePrec}</th>
      <th class="th-md">Compteurs fin<br>${MOIS[mois]} ${annee}</th>
      <th class="th-md">Copies<br>Effectuées</th>
      <th class="th-dk">V COPIE<br>MONOCHROME</th>
      <th class="th-dk">V COPIE<br>COULEUR</th>
    </tr>
  </thead>
  <tbody>
    ${allRows}
  </tbody>
</table>

<!-- ── Synthèse + Totaux ── -->
<div class="bottom-wrap">

  <!-- Tableau des volumes et copies supplémentaires -->
  <table class="vol-tbl">
    <thead>
      <tr>
        <th colspan="2" class="vh-dk">Volumes Copies Effectuées</th>
        <th class="vh-dk">Forfaits<br>Copies</th>
        <th colspan="3" class="vh-md">Copies Supplémentaires</th>
      </tr>
      <tr>
        <th class="vh-md"></th>
        <th class="vh-md">Quantité</th>
        <th class="vh-md">Incluses</th>
        <th class="vh-md">Volume<br>copie sup</th>
        <th class="vh-md">Coût/copie<br>(F CFA)</th>
        <th class="vh-dk">Coût Total<br>Copie Sup HT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="vb">Monochrome</td>
        <td class="vr">${fmt(facture.totalMonoA4Eq)}</td>
        <td class="vr">${fmt(facture.forfaitCopieMono)}</td>
        <td class="vr">${facture.copiesSupMono > 0 ? fmt(facture.copiesSupMono) : '—'}</td>
        <td class="vr">${facture.copiesSupMono > 0 ? fmt(client.prixCopieSupMono) : '—'}</td>
        <td class="vr vb">${costsSupMono > 0 ? fmt(costsSupMono) : '—'}</td>
      </tr>
      <tr>
        <td class="vb vc">Couleur</td>
        <td class="vr vc">${fmt(facture.totalCoulA4Eq)}</td>
        <td class="vr">${fmt(facture.forfaitCopieCouleur)}</td>
        <td class="vr vc">${facture.copiesSupCouleur > 0 ? fmt(facture.copiesSupCouleur) : '—'}</td>
        <td class="vr">${facture.copiesSupCouleur > 0 ? fmt(client.prixCopieSupCouleur) : '—'}</td>
        <td class="vr vb vc">${costsSupCoul > 0 ? fmt(costsSupCoul) : '—'}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totaux HT / TVA / TTC -->
  <table class="tot-tbl">
    <tr>
      <td class="tl">COUT FORFAIT HT</td>
      <td class="tv">${fmt(facture.forfaitMensuelHT)}</td>
      <td class="tu">F CFA</td>
    </tr>
    <tr>
      <td class="tl">TOTAL COUT COPIE SUP HT</td>
      <td class="tv">${fmt(facture.coutCopiesSupHT)}</td>
      <td class="tu">F CFA</td>
    </tr>
    <tr>
      <td class="tl tht" style="border-top:1.5pt solid #555;">TOTAL HT</td>
      <td class="tv tht" style="border-top:1.5pt solid #555;">${fmt(facture.totalHT)}</td>
      <td class="tu tht" style="border-top:1.5pt solid #555;">F CFA</td>
    </tr>
    <tr>
      <td class="tl">TVA ${facture.tauxTVA}%</td>
      <td class="tv">${fmt(facture.montantTVA)}</td>
      <td class="tu">F CFA</td>
    </tr>
    <tr>
      <td class="tl ttc">TOTAL TTC</td>
      <td class="tv ttc">${fmt(facture.totalTTC)}</td>
      <td class="tu ttc">F CFA</td>
    </tr>
  </table>
</div>

<!-- ── Montant en lettres ── -->
<div class="lettres">
  <div class="ll">Arrêté le présent relevé à la somme de :</div>
  <div class="lv">${montantLettres} francs CFA toutes taxes comprises</div>
</div>

<!-- ── Pied de page ── -->
<div class="footer">
  <div>
    <strong style="color:#333;">${nomSociete} · Service Technique / SAV</strong><br>
    Document généré par BurinTrack — Confidentiel
  </div>
  <div style="text-align:right;">
    <strong style="font-size:7.5pt;color:#333;">Lu et approuvé · Cachet et signature</strong>
    <div class="sig-line"></div>
    <span>Représentant autorisé</span>
  </div>
</div>

</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}
