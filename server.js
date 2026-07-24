/**
 * GAN HAI™ · Backend · v2.8 · Streaming · REHEM™ v1.7.5 · ZIKKARON™ v1.0 · ZIK-PSC-001 · Gvul-Nosse-398 · Codex Samekh · FL-412™ · Google Sheets
 * Makom Intelligence™ · CorreIA LLC · Scribe du Souffle
 *
 * Architecture DevOps · Note Technique Corrective v1.7.1 · CTR-031
 * Séparation stricte : moteur déterministe / LLM interprète
 * v2.1 : Streaming activé  ✨  Server-Sent Events
 *
 * PRINCIPE D'OR :
 * Le moteur produit la vérité computationnelle du référentiel.
 * Le LLM produit l'expression linguistique de cette vérité.
 */

'use strict';

const http  = require('http');
const https = require('https');
const url   = require('url');

const PORT       = process.env.PORT || 3000;
const API_KEY    = process.env.ANTHROPIC_API_KEY || '';
const MODEL      = 'claude-sonnet-4-6';
const MAX_TOKENS = 4000;

// ── GOOGLE SHEETS · Configuration ─────────────────────────────
const SHEET_ID        = process.env.GOOGLE_SHEET_ID || '';
const GS_CLIENT_EMAIL = process.env.GS_CLIENT_EMAIL || '';
const GS_PRIVATE_KEY  = (process.env.GS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const ADMIN_TOKEN     = process.env.ADMIN_TOKEN || 'ADMIN-SVP-2026';

if (!API_KEY) {
  console.error('[GAN HAI] ANTHROPIC_API_KEY non définie. Arrêt.');
  process.exit(1);
}

// ── GOOGLE SHEETS · Auth JWT ───────────────────────────────────
function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function signJWT(header, payload, privateKey) {
  const crypto = require('crypto');
  const data = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  const sig = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return data + '.' + sig;
}

async function getGoogleToken() {
  if (!GS_CLIENT_EMAIL || !GS_PRIVATE_KEY) return null;
  const now = Math.floor(Date.now() / 1000);
  const jwt = signJWT(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: GS_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    GS_PRIVATE_KEY
  );

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).access_token); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── GOOGLE SHEETS · Écriture d'une ligne ──────────────────────
async function appendToSheet(row) {
  if (!SHEET_ID || !GS_CLIENT_EMAIL || !GS_PRIVATE_KEY) {
    console.log('[SHEETS] Config manquante · ligne non enregistrée');
    return;
  }
  try {
    const token = await getGoogleToken();
    const values = [[
      row.timestamp, row.reviewer_id, row.situation_num, row.situation_nom,
      row.hypothese, row.verdict, row.timestamp_hhmm,
      row.yom, row.sceau, row.sti, row.cycle,
      row.vecteur_resume, row.lecture_resume,
    ]];
    const body = JSON.stringify({ values });
    const path = `/v4/spreadsheets/${SHEET_ID}/values/A1:M1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'sheets.googleapis.com',
        path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(d));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    console.log('[SHEETS] Ligne enregistrée :', row.reviewer_id, '·', row.situation_nom);
  } catch(e) {
    console.error('[SHEETS] Erreur écriture :', e.message);
  }
}

// ── GOOGLE SHEETS · Lecture (admin) ───────────────────────────
async function readSheet() {
  if (!SHEET_ID || !GS_CLIENT_EMAIL || !GS_PRIVATE_KEY) return [];
  const token = await getGoogleToken();
  return new Promise((resolve, reject) => {
    const path = `/v4/spreadsheets/${SHEET_ID}/values/A:M`;
    https.get({
      hostname: 'sheets.googleapis.com',
      path,
      headers: { 'Authorization': `Bearer ${token}` },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          resolve(parsed.values || []);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const SYSTEM_PROMPT = `Tu es REHEM™ · Knowledge Fusion Engine™ de Gan Hai™.
Version : CorreIA FL✦366™ v1.7.4 · ZIKKARON™ v1.0 · FL✦412™

TON ARCHITECTURE INTERNE :
Tu opères depuis trois sources distinctes et traçables :

ZIKKARON™ · Mémoire permanente (connaissance de l'architecture) :
- Gan Hai™ : moteur computationnel de contextualisation temporelle · 7 piliers (Shemiah · Qol · Memshalah · Halikhah · Makom · Ruah · Zman) · calcule depuis STI = H+M + Sceau Yom
- TRTV™ : Théorie de la Relativité du Temps Vivant · temps comme espace navigable structuré
- TRS™ : Théorie de la Relativité du Sens · sens comme espace computationnel
- TRA™ : Theory of Reliable Appreciation · 5 piliers (Ta'amou · Oure'ou · Ki · Tov · YHWH) · indice pondéré d'appréciation
- REHEM™ : interprète scientifique du CTRS · Knowledge Fusion Engine
- ZIKKARON™ : mémoire structurelle permanente de l'architecture
- FL✦366™ : client web officiel · Zman Hai™ · Référentiel Temporel Computationnel
- FL✦412™ : La Question précède l'Expression · QFM™
- CTRS : Computational Temporal Reference System · produit par Gan Hai™
- STE™ : Semantic Temporal Entropy · Shannon · mesure la clarté du signal
- STRF™ : Semantic Temporal Reference Frame · Einstein · lecture relative entre deux piliers
- MAC™ : Multi-Agent Coherence · Leibniz · cohérence entre agents
- Lois : 7 lois des piliers · lois du Yom · lois des Cycles
- Porteurs : identités assignées à chaque Yom selon le calcul du Cycle
- Sceau : valeur computationnelle du Yom · combine avec STI pour produire les 7 totaux

ZIKKARON™ · ZIK-PSC-001 · Positionnement scientifique officiel (connaissance canonique permanente) :
Gan Hai™ ne remplace pas Newton · Einstein · Leibniz. Il repond a une question differente.
Question des grands theoriciens : Comment fonctionne le Temps ?
Question de Gan Hai™ : Comment utiliser le Temps comme Referentiel Computationnel pour contextualiser une situation avant analyse et decision ?

Newton [ZIK-PSC-001] : formalise une structure temporelle stable · Gan Hai™ utilise cette structure comme support de calcul du CTRS. Newton fournit le cadre chronologique · Gan Hai™ fournit la contextualisation computationnelle de l'instant.

Leibniz [ZIK-PSC-001] : met en evidence le role des relations entre evenements · Gan Hai™ calcule les relations · convergences · contraintes · transitions entre les 7 piliers. Leibniz introduit le principe relationnel · Gan Hai™ calcule des structures relationnelles.

Einstein [ZIK-PSC-001] : introduit le referentiel comme condition de toute mesure · Gan Hai™ introduit le CTRS comme condition de toute contextualisation avant analyse. Einstein : referentiel de la mesure physique · Gan Hai™ : referentiel de la contextualisation computationnelle.

Doctrine officielle [ZIK-PSC-001] : Gan Hai™ est un systeme de contextualisation computationnelle fonde sur un CTRS. Il s'inscrit dans la continuite conceptuelle de trois apports majeurs : la structure temporelle de Newton · le principe relationnel de Leibniz · la notion de referentiel d'Einstein. Il ne modifie aucune de ces theories. Son apport propre : transposer certains de leurs principes dans l'aide a la decision.

Regles de redaction [ZIK-PSC-001] :
Employer : s'inscrit dans la continuite conceptuelle de · transpose dans un cadre computationnel · etablit un parallele avec · applique un principe analogue
Interdire absolument : depasse Newton · corrige Einstein · remplace Leibniz · prouve Newton · equivalent a la theorie de
Toute comparaison = analogie conceptuelle ou transposition computationnelle · jamais equivalence scientifique

Domaine de Gan Hai™ [ZIK-PSC-001] : aide a la decision · systemes intelligents · architectures de contextualisation · systemes explicables (XAI) · referentiels computationnels.
Pas : mecanique classique · relativite physique · cosmologie.

ZIKKARON™ · LOI GVUL-NOSSE (398) · Le Perimetre Porteur [ZIKKARON™] :
Source : Bereshit 3:8 · Passouk-racine du Shaon haRuah™
Loi systémique : Un signal qui circule dans un espace delimite ne peut etre fui que dans ce meme espace. Ce perimetre conserve, apres le passage du signal, un potentiel non actualise qui rend la reaction possible.
Gvul (perimetre) + Nosse (porteur) = 398 · un perimetre qui porte plutot qu'un perimetre qui contient.

Total Bereshit 3:8 : 3663 · Gimel-Vav-Vav-Gimel · mouvement, connexion, connexion, mouvement.
Sequence canonique : Perception (432) → Signal source (248) → Circulation potentiel preserve (550) → Fenetre temporelle (305) → Reaction ouvrant potentiel (1190) → Position face source (292) → Refuge dans reserve (646)

PILIERS FONCTIONNELS [ZIKKARON™] :
GAN-432 · Perception-Trigger™ : activer la detection d'un signal
GAN-248 · Source-Signal™ : emettre depuis une source validee
GAN-550 · Reserve-Carry™ (= BaGan 55 x10 termine sur Ayin) : faire circuler un signal sans epuiser le potentiel de son espace · la multiplication ne s'epuise pas · elle laisse une reserve
GAN-305 · Window-Potential™ (Leruach hayom) : fenetre temporelle non-epuisable · porte un potentiel non actualise
GAN-1190 · Response-Open™ : declencher une reaction qui ouvre sur une reserve · non sur un manque
GAN-646 · Refuge-Reserve™ (Betokh etz haGan) : loger une reaction dans le potentiel laisse intact par le signal

CONNEXION GAN HAI™ [ZIKKARON™] :
BaGan (55) = espace fonctionnel canonique qui contient le signal et la reaction.
Leruach hayom (305) = fenetre temporelle = Shaon haRuah · le souffle devient mesure du jour.
La fenetre temporelle de Gan Hai™ (STI = H+M) est une instance de ce principe : elle ne s'epuise pas · elle porte un potentiel a chaque instant.
Le CTRS calcule depuis cet espace delimite (BaGan) · les 7 piliers sont les 7 modules fonctionnels du perimetre porteur.
Un instant calcule par Gan Hai™ n'est jamais epuise par son propre calcul : il porte toujours une reserve activable (Ayin en cloture ou mediane dans les sequences).

ZIKKARON™ · CODEX GENERATION YOMIM · Cycle Samekh · BaMaAvar 5786 :
Cycle Samekh : 7 Yomim · Sceaux 411 a 477 · Saison BaMaAvar
Chaine causale : Aleph (inauguration) → Beit (demeure) → Gimel (regard) → Dalet (parole) → He (brisure) → Vav (lien sacre) → Zayin (renouveau → transmission au Cycle Ayin)

YOM ALEPH baSamekh [ZIKKARON™] :
Sceau 411 · Dalet-Aleph-Aleph · Connexion matricielle
Shem : Qeshev haNe'emanut baMaAvar · l'attention receptive qui produit la fidelite dans le support circulaire
Porteur : Ish haQeshev et haNe'emanut baMaAvar
Loi gouvernante : L'inauguration juste nait depuis la double origine · non depuis l'elan seul
Passouk : Bereshit 1:1 + Tehilim 33:6 · bara depuis deux sources simultanees (Parole et Souffle)
NC-01 : une continuite emerge · haNe'emanut · Nun · fidelite dans la duree
Signal : Aleph-Aleph = Connexion matricielle · tohu vavohu = condition du soutien · non obstacle
Fruit transmis au Beit : Zera haAleph baSamekh · haNe'emanut comme sol

YOM BEIT baSamekh [ZIKKARON™] · YOM COURANT · 6 Av 5786 · 20 Juillet 2026 :
Sceau 422 · Dalet-Beit-Beit · Habitation du Souffle
Shem : Qibul haSomekh baMaAvar · la reception active du soutien · la demeure qui apprend a tenir en etant tenue
Porteur : Ish haQibul et haSomekh baMaAvar
Loi gouvernante : La demeure soutenue devient soutien · ce qui est tenu apprend a tenir
Loi secondaire 1 : La separation juste cree deux espaces distincts · elle ne detruit pas · elle structure
Loi secondaire 2 : Ce que le porteur recoit comme condition (Samekh) · il le transmet comme fruit
Passouk : Bereshit 1:6-8 · yehi raqia betokh hamayim · mavdil bein mayim lamayim
Passouk : Mishlei 24:3 · beHokhmah yibane bayit · par la sagesse se batit une maison
NC-01 : Beit franchit Samekh · eprouvee par Shin · un support emerge (Samekh)
NC-02 active : chaque separation nomme ce qu'elle produit
LR-4 active : ce que le cycle inaugure · il l'accomplit dans son propre miroir (Samekh-Samekh)
Signal Samekh-Samekh : loi de reciprocite structurelle · ce que ce Yom recoit comme condition · il le produit comme fruit
Sol recu : Zera haAleph baSamekh · haNe'emanut comme fondation de la demeure
Structures emergentes : haQibul · haSomekh · haHavayah haMeshulesheth

CTRS · Référentiel Temporel Courant (calculé par Gan Hai™ pour l'instant soumis) :
Données variables : Sha'at · Valeur · Yom · Sceau · Piliers · STE · Fréquences · Combinaisons · Émergences · Ayin

QUALIFICATION AUTOMATIQUE DE LA QUESTION :
Avant toute réponse, qualifier l'intention :

CAS 1 · Question structurelle (sur Gan Hai™ · ZIKKARON™ · TRTV™ · TRA™ · architecture · théories · modules) :
→ Consulter ZIKKARON™ en priorité · contextualiser depuis le CTRS

CAS 2 · Question situationnelle (sur un moment · une décision · un état · "est-ce le bon moment") :
→ Consulter le CTRS en priorité · lecture depuis les piliers

CAS 3 · Question mixte (architecture lue depuis le temps courant) :
→ Fusionner ZIKKARON™ + CTRS · les deux sources sont citées

LOI FL-412™ :
La Question précède l'Expression. Le rapport est INCOMPLET sans réponse explicite à la question.

POSTURE SCIENTIFIQUE (Note RTC✦REHEM✦001) :
Tu documentes · tu ne racontes pas. Sujet : le calcul · le Référentiel · les paramètres.
Verbes : reçoit → situe · voit → met en évidence · observe → indique.
Interdits : Je · intention · volonté · émotion · attente.

STRUCTURE OBLIGATOIRE · 7 PARTIES :

## PARTIE 0 · QUALIFICATION
Format strict obligatoire · UN champ par ligne · PAS de prose · PAS de texte en ligne :
**Question exacte** : [reproduire la question mot pour mot entre guillemets]
**Objet** : [une phrase courte]
**CAS détecté** : [CAS 1 ou CAS 2 ou CAS 3 · justification en 5 mots max]
**Sources consultées** : [ZIKKARON™ · CTRS · ou les deux]
**Intention détectée** : [une phrase courte]

## PARTIE A · CONNAISSANCE STRUCTURELLE (ZIKKARON™)
[Si CAS 1 ou 3 uniquement]
Ce que l'architecture permanente dit de l'objet de la question.
Traçabilité obligatoire : chaque affirmation marquée [ZIKKARON™].
Si CAS 2 : écrire "Non applicable · question situationnelle."

## PARTIE 1 · RÉFÉRENTIEL CALCULÉ
Copier telle quelle la PARTIE 1 pré-construite fournie dans le prompt.

## PARTIE 1.5 · FAITS COMPUTATIONNELS
Listes brutes : CTR · Valeur · Dominante · Sceau · Transitions · Loi du Yom · Émergences · Ayin.
Pas de puces tirets ✨ utiliser ✦ comme marqueur de liste.
Terminer par : "Les éléments ci-dessus constituent la base exclusive de l'analyse contextuelle."

## PARTIE 2 · ANALYSE CONTEXTUELLE (CTRS)
Commencer par : "Les observations suivantes sont générées à partir du Référentiel Temporel Computationnel calculé par Gan Hai™."
Une phrase par pilier. En lien avec la question.
Traçabilité : affirmations marquées [CTRS].

## PARTIE 3 · RÉPONSE À LA QUESTION
SECTION PRINCIPALE ET OBLIGATOIRE.
Commencer par : "Réponse à la question : [question exacte]"
Structure selon le CAS :
- CAS 1 : "Au regard de ZIKKARON™ [connaissance permanente] · contextualité par le CTRS [données temporelles] :"
- CAS 2 : "Au regard du CTRS calculé [données] :"
- CAS 3 : "Au regard de ZIKKARON™ + CTRS fusionnés :"
Maximum 4 points numérotés. Chaque point cite sa source [ZIKKARON™] ou [CTRS].

## PARTIE 4 · CONVERGENCES
3 maximum · une phrase · source citée.

## LIMITES
Texte standard exact : "Cette analyse est produite à partir du Référentiel Temporel Computationnel calculé pour l'instant considéré. Elle contextualise la situation soumise mais ne constitue ni une prédiction, ni une décision, ni une inférence sur les intentions des personnes concernées. Toute décision relève de la responsabilité du décideur."

VÉRIFICATION AVANT ÉMISSION :
✦ La question apparaît-elle dans PARTIE 0 et PARTIE 3 ?
✦ Les sources sont-elles tracées [ZIKKARON™] / [CTRS] ?
✦ PARTIE 3 répond-elle explicitement à la question ?
✦ Pas de tirets de liste ✨ uniquement ✦

CONTRAINTE : 3000 tokens maximum. Concision exigence scientifique.
FORMAT : Markdown. Titres ## obligatoires. 7 parties dans l'ordre exact.`;

function buildCTRS(referentiel) {
  const r = referentiel;
  return {
    sha_at:  `${r.hPad || '--'}:${r.mPad || '--'}`,
    valeur:  r.valeurInstant,
    yom: {
      shem:    r.yom?.shem    || '✦',
      sceau:   r.yom?.sceau   || '✦',
      loi:     r.yom?.loi     || '✦',
      phrase:  r.yom?.phrase  || '✦',
      porteur: r.yom?.porteur || '✦',
      passouk: r.yom?.passouk || '✦',
    },
    STE: {
      label:    r.STE?.label          || '✦',
      dominant: r.STE?.dominant?.name || '✦',
      count:    r.STE?.dominant?.count || 0,
    },
    piliers: (r.piliers || []).map(p => ({
      num:       p.pilier?.num,
      name:      p.pilier?.name,
      heb:       p.pilier?.heb,
      formule:   p.calcul?.formule,
      sequence:  (p.sequence?.letters || []).map(l => l.n + '(' + l.mv + ')').join(' · '),
      direction: p.direction,
      emergence: p.emergence,
      loi:       p.pilier?.law,
      ayin:      p.ayin?.position || null,
      combs:     p.combNotes || [],
      str:       p.STR?.orientation || '',
    })),
    frequences: (r.frequences || []).slice(0, 5).map(f => f.name + '×' + f.count),
    tavnit:    r.tavnit ? (r.tavnit.tavnit + ' · ' + r.tavnit.loi) : null,
  };
}

function buildPart1(ctrs) {
  const zman = ctrs.piliers.find(p => p.num === 7) || ctrs.piliers[ctrs.piliers.length-1];
  const combs = ctrs.piliers.flatMap(p => p.combs).filter(Boolean).slice(0,6);
  return [
    '## RAPPORT RÉFÉRENTIEL',
    '### Référentiel Temporel Computationnel · Analyse Contextuelle',
    '',
    '## PARTIE 1 · RÉFÉRENTIEL CALCULÉ',
    '',
    `**Sha'at** : ${ctrs.sha_at}`,
    `**Valeur** : ${ctrs.valeur}`,
    `**Yom** : ${ctrs.yom.shem}`,
    `**Sceau** : ${ctrs.yom.sceau}`,
    `**Pilier Zman** : ${zman ? zman.formule : '✦'}`,
    `**STE** : ${ctrs.STE.label} · Dominant : ${ctrs.STE.dominant} (${ctrs.STE.count}×)`,
    `**Fréquences** : ${ctrs.frequences.join(' · ')}`,
    `**Loi du Yom** : ${ctrs.yom.loi}`,
    `**Passouk** : ${ctrs.yom.passouk}`,
    `**Porteur** : ${ctrs.yom.porteur}`,
    combs.length ? `**Combinaisons actives** : ${combs.join(' · ')}` : '',
    ctrs.tavnit ? `**Tavnit** : ${ctrs.tavnit}` : '',
  ].filter(l => l !== null && l !== undefined).join('\n');
}

function buildUserPrompt(situation, ctrs) {
  const part1 = buildPart1(ctrs);
  return `SITUATION SOUMISE :
${situation}

CTRS COMPLET (source exclusive) :
Sha'at : ${ctrs.sha_at} · Valeur : ${ctrs.valeur}
Yom : ${ctrs.yom.shem} · Sceau : ${ctrs.yom.sceau}
Loi du Yom : ${ctrs.yom.loi}
Porteur : ${ctrs.yom.porteur}
Passouk : ${ctrs.yom.passouk}
STE : ${ctrs.STE.label} · Dominant : ${ctrs.STE.dominant} (${ctrs.STE.count}×)
Fréquences : ${ctrs.frequences.join(' · ')}
${ctrs.tavnit ? 'Tavnit : ' + ctrs.tavnit : ''}

7 PILIERS :
${ctrs.piliers.map(p =>
  `${p.num}·${p.name} · ${p.formule}
  Séquence : ${p.sequence}
  Direction : ${p.direction}
  Émergence : ${p.emergence}
  Loi : ${p.loi}
  ${p.combs.length ? 'Combinaisons : ' + p.combs.join(' · ') : ''}
  ${p.ayin ? 'Ayin ' + p.ayin : ''}`
).join('\n\n')}

FL-412™ · QFM™ · INSTRUCTION OBLIGATOIRE :
La question soumise est l'objet principal. Le Référentiel est le contexte. Pas l'inverse.
YOM COURANT : Yom Beit baSamekh · 6 Av 5786 · Sceau 422 · Qibul haSomekh baMaAvar · les questions sur le Yom courant doivent utiliser cette donnee ZIKKARON.
Le rapport est INCOMPLET s'il ne répond pas explicitement à la question.

PARTIES DANS L'ORDRE EXACT :
0. PARTIE 0 : écrire la question reçue · son objet · l'intention détectée.
1. PARTIE 1 : copier exactement la PARTIE 1 pré-construite ci-dessous.
2. PARTIE 1.5 : faits bruts courts. Listes. Pas de paragraphes.
3. PARTIE 2 : une phrase par pilier en lien direct avec la question.
4. PARTIE 3 · RÉPONSE À LA QUESTION : section PRINCIPALE et OBLIGATOIRE.
   Commencer par : "Réponse à la question : [question]"
   Puis : "Au regard du Référentiel calculé, la réponse est :"
   Répondre explicitement depuis Zman · Loi du Yom · convergences.
5. PARTIE 4 : 3 convergences max · une phrase chacune.
6. LIMITES : texte standard.

CONTRAINTE : 2500 tokens maximum.

PARTIE 1 PRÉ-CONSTRUITE (copier telle quelle) :
${part1}`;
}

// ── Streaming Anthropic → SSE client ──────────────────────────
function streamAnthropic(situation, ctrs, res) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      stream:     true,
      system:     SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(situation, ctrs) }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const req = https.request(options, apiRes => {
      let buffer = '';

      apiRes.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // garder la ligne incomplète

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            // Extraire le texte delta
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              const chunkText = parsed.delta.text;
              // Envoyer chunk SSE au client
              res.write('data: ' + JSON.stringify({ text: chunkText }) + '\n\n');
            }
            // Fin du stream
            if (parsed.type === 'message_stop') {
              res.write('data: ' + JSON.stringify({ done: true }) + '\n\n');
              resolve();
            }
          } catch (e) {
            // ligne non-JSON (ex: event: ...)  ✨  ignorer
          }
        }
      });

      apiRes.on('end', () => {
        res.write('data: ' + JSON.stringify({ done: true }) + '\\n\\n');
        resolve();
      });

      apiRes.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout stream (60s)')); });
    req.write(body);
    req.end();
  });
}

// ── callAnthropic · Mode non-stream (pour /api/ctrs) ──────────
function callAnthropic(situation, ctrs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(situation, ctrs) }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) resolve(parsed.content[0].text);
          else reject(new Error('Reponse API inattendue'));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout (60s)')); });
    req.write(body);
    req.end();
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) { req.destroy(); reject(new Error('Body trop large')); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('JSON invalide')); }
    });
  });
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function validateBody(body, res) {
  if (!body.situation || typeof body.situation !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'situation manquante' }));
    return false;
  }
  if (!body.referentiel || typeof body.referentiel !== 'object') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'referentiel manquant' }));
    return false;
  }
  return true;
}

// ── SERVEUR ────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);
  const parsed = url.parse(req.url, true);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /health ────────────────────────────────────────────
  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok', moteur: 'Gan Hai™ v2.3', version: '2.8',
      streaming: true,
      sheets: !!(SHEET_ID && GS_CLIENT_EMAIL && GS_PRIVATE_KEY),
      endpoints: ['POST /api/ctrs', 'POST /api/orientation', 'POST /interprete', 'POST /api/save-result', 'GET /api/admin/results'],
    }));
    return;
  }

  // ── POST /api/ctrs · moteur pur · JSON ────────────────────
  if (req.method === 'POST' && parsed.pathname === '/api/ctrs') {
    try {
      const body = await parseBody(req);
      if (!validateBody(body, res)) return;
      const ctrs = buildCTRS(body.referentiel);
      console.log(`[MOTEUR] ${ctrs.sha_at} · valeur:${ctrs.valeur} · sceau:${ctrs.yom.sceau}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, ctrs }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // ── POST /api/orientation · STREAMING SSE ─────────────────
  if (req.method === 'POST' && (parsed.pathname === '/api/orientation' || parsed.pathname === '/interprete')) {
    try {
      const body = await parseBody(req);
      if (!validateBody(body, res)) return;

      const ctrs = buildCTRS(body.referentiel);
      console.log(`[MOTEUR] ${ctrs.sha_at} · valeur:${ctrs.valeur} · "${body.situation.slice(0,50)}"`);

      // Headers SSE
      res.writeHead(200, {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Envoyer le CTRS en premier event
      res.write('data: ' + JSON.stringify({ ctrs }) + '\\n\\n');

      // Streamer la réponse LLM
      await streamAnthropic(body.situation, ctrs, res);
      console.log(`[LLM] Stream terminé`);
      res.end();

    } catch (err) {
      console.error('[LLM] Erreur stream :', err.message);
      try {
        res.write('data: ' + JSON.stringify({ error: err.message, done: true }) + '\\n\\n');
        res.end();
      } catch(e) {}
    }
    return;
  }

  // ── POST /api/save-result · Enregistre un test reviewer ──────
  if (req.method === 'POST' && parsed.pathname === '/api/save-result') {
    try {
      const body = await parseBody(req);
      const row = {
        timestamp:      new Date().toISOString(),
        reviewer_id:    body.reviewer_id    || 'inconnu',
        situation_num:  body.situation_num  || '',
        situation_nom:  body.situation_nom  || '',
        hypothese:      body.hypothese      || '',
        verdict:        body.verdict        || '',
        timestamp_hhmm: body.timestamp_hhmm || '',
        yom:            body.yom            || '',
        sceau:          body.sceau          || '',
        sti:            body.sti            || '',
        cycle:          body.cycle          || '',
        vecteur_resume: body.vecteur_resume || '',
        lecture_resume: body.lecture_resume || '',
      };
      await appendToSheet(row);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // ── GET /api/admin/results · Lecture admin protégée ──────────
  if (req.method === 'GET' && parsed.pathname === '/api/admin/results') {
    const token = parsed.query.token || req.headers['x-admin-token'] || '';
    if (token !== ADMIN_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Token admin invalide' }));
      return;
    }
    try {
      const rows = await readSheet();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, rows }));
    } catch(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route inconnue' }));
});

server.listen(PORT, () => {
  console.log(`[GAN HAI™ v2.8 · Streaming + Sheets] Port ${PORT}`);
  console.log(`[GAN HAI™] /health · /api/ctrs · /api/orientation (SSE) · /api/save-result · /api/admin/results`);
  console.log(`[SHEETS] ${SHEET_ID ? 'Configuré · ID: ' + SHEET_ID.slice(0,8) + '...' : 'Non configuré'}`);
});
