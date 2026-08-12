/* Interface copy, EN + NL. Case content is translated inside each case JSON;
   this file only holds the chrome around it. */
(function (global) {
  'use strict';

  var COPY = {
    en: {
      dossiersWord: 'Case dossiers',
      navDossiers: 'Dossiers',
      navHow: 'How it works',
      footerNote: 'Free case dossiers · no account, no payment ·',
      disclaimer: 'Constructed cases are works of fiction. Names, characters, businesses and events are invented, the photographs are AI-generated, and any resemblance to real persons, living or dead, is coincidental.',

      indexEyebrow: 'Free case dossiers · play in your browser',
      indexTitle: 'Sixty seconds is the trailer. This is the file.',
      indexIntro: 'Every dossier is the full working file behind a case from the feed: the report, the scene, the forensics, the phone records. Read it, name a suspect, get the answer on the spot.',
      factDossiers: 'Dossiers online',
      factRuntime: 'Per case',
      factDocuments: 'Documents each',
      allFiles: 'All dossiers',
      filterAll: 'All',
      filterReal: 'Real cases',
      filterConstructed: 'Constructed',
      filterNew: 'New',
      noMatches: 'No dossiers in this filter yet.',
      inProgress: 'In progress',
      solved: 'Solved',
      coverSlot: 'cover — 4:5',
      keyArtSlot: 'key art — 16:9',
      mapSlot: 'floor plan — scene',
      photoSlot: 'photo',

      back: '← Back',
      backToFile: '← Back to the file',
      whatsInside: 'What is in the file',
      gateEyebrow: 'Free to open',
      gateTitle: 'Follow to open the file',
      gateBody: 'The dossiers stay free. Following the account is what keeps them coming — that is the whole trade.',
      gateFollow: 'Follow @verdictin60',
      gateOpen: 'I follow — open the file',
      gateNote: 'Nothing to pay, no account, no email. The file opens in this browser.',
      openFile: 'Open the file',
      resume: 'Resume the file',

      progress: 'Progress',
      accuse: 'Name a suspect',
      document: 'Document',
      sealed: 'Sealed',
      tagOpen: 'open',
      tagRead: 'read',
      tagSealed: 'sealed',
      lockedEyebrow: 'Sealed',
      lockedTitle: 'Not released yet',
      lockedNote: 'Work through the documents that are open first. Each one you read releases the next.',

      attachments: 'Attachments',
      callLog: 'Call log',
      colRef: 'Reference',
      colFinding: 'Finding',
      colMethod: 'Method',
      colStatus: 'Status',
      searchPlaceholder: 'name, plate, docket number, address…',
      search: 'Search',
      noResults: 'Nothing in the database matches that.',
      notepadHint: 'Your notes — saved on this device',
      notepadPlaceholder: 'What does not add up?',
      notesSaved: 'Saved on this device',
      notesNotSaved: 'Storage is blocked — notes will not survive a reload',
      pinnedFindings: 'Flagged',

      accuseIntro: 'One name. The file has everything you need, and the answer comes back immediately.',
      rightEyebrow: 'Correct',
      wrongEyebrow: 'Incorrect',
      nextCase: 'Next dossier',
      shareResult: 'Share result',
      shareCopied: 'Link copied',
      shareCard: 'Share a card',
      shareBuilding: 'Building card…',
      shareSaved: 'Card saved',
      tryAgain: 'Change my answer',

      rankLabel: 'Your rank',
      rankSolvedOne: 'case solved',
      rankSolvedMany: 'cases solved',
      rankNext: 'to %s',
      rankTop: 'top rank',
      cardSolved: 'Case solved',
      cardUnsolved: 'Can you solve it?',
      cardCta: 'Free case dossiers',

      howEyebrow: 'How it works',
      howTitle: 'Read the file. Name a suspect.',
      howIntro: 'No login, no purchase, no host required. Everything happens in the browser, alone or with three others looking over your shoulder.',
      steps: [
        ['01', 'Pick a dossier', 'Every case from the feed, from a straightforward fraud to a file that has never been closed.'],
        ['02', 'Follow to open', 'One tap on Instagram. That is the only thing asked of you.'],
        ['03', 'Work through it', 'Documents unlock as you go, so the file reveals itself in the order it was built.'],
        ['04', 'Name a suspect', 'One name, one answer, delivered on the spot with the reasoning.']
      ],
      faq: [
        ['Are these real cases?', 'Not at the moment. Every dossier here is constructed — written for the site and marked Constructed on its card. Some follow the shape of a documented case, but the people, names, places and photographs in them are invented. If a file built on a real, documented case is ever published here, it will be marked Real and kept factual.'],
        ['Where do the photographs come from?', 'They are generated, not photographed. Nobody in a suspect wall is a real person, and no image here shows a real place or document.'],
        ['Do I need to pay?', 'No. The dossiers are free and stay free.'],
        ['Can we play together?', 'Yes — one screen, up to four people. There is no turn order.'],
        ['What if I get it wrong?', 'You get the reasoning and the file stays open, and you can change your answer. A wrong name costs you nothing — your rank only counts the cases you solve.']
      ],

      notFound: 'That dossier does not exist.',
      loadError: 'The file could not be loaded. Check your connection and try again.',
      loading: 'Opening the file…'
    },

    nl: {
      dossiersWord: 'Dossiers',
      navDossiers: 'Dossiers',
      navHow: 'Hoe werkt het',
      footerNote: 'Gratis dossiers · geen account, geen betaling ·',
      disclaimer: 'Geconstrueerde zaken zijn fictie. Namen, personages, bedrijven en gebeurtenissen zijn verzonnen, de foto\'s zijn door AI gegenereerd, en elke gelijkenis met bestaande personen, levend of overleden, berust op toeval.',

      indexEyebrow: 'Gratis dossiers · direct in je browser',
      indexTitle: 'Zestig seconden is de trailer. Dit is het dossier.',
      indexIntro: 'Elk dossier is het volledige werkdossier achter een zaak uit de feed: het proces-verbaal, de plaats delict, het forensisch rapport, de telefoongegevens. Lezen, een verdachte aanwijzen, meteen het antwoord.',
      factDossiers: 'Dossiers online',
      factRuntime: 'Per zaak',
      factDocuments: 'Stukken per dossier',
      allFiles: 'Alle dossiers',
      filterAll: 'Alles',
      filterReal: 'Echte zaken',
      filterConstructed: 'Geconstrueerd',
      filterNew: 'Nieuw',
      noMatches: 'Nog geen dossiers in dit filter.',
      inProgress: 'Bezig',
      solved: 'Opgelost',
      coverSlot: 'cover — 4:5',
      keyArtSlot: 'sfeerbeeld — 16:9',
      mapSlot: 'plattegrond — plaats delict',
      photoSlot: 'foto',

      back: '← Terug',
      backToFile: '← Terug naar het dossier',
      whatsInside: 'Wat zit er in het dossier',
      gateEyebrow: 'Gratis te openen',
      gateTitle: 'Volg om het dossier te openen',
      gateBody: 'De dossiers blijven gratis. Het account volgen is wat ze mogelijk maakt — dat is de hele ruil.',
      gateFollow: 'Volg @verdictin60',
      gateOpen: 'Ik volg — open het dossier',
      gateNote: 'Niets te betalen, geen account, geen e-mailadres. Het dossier opent in deze browser.',
      openFile: 'Open het dossier',
      resume: 'Verder met het dossier',

      progress: 'Voortgang',
      accuse: 'Wijs een verdachte aan',
      document: 'Stuk',
      sealed: 'Verzegeld',
      tagOpen: 'open',
      tagRead: 'gelezen',
      tagSealed: 'verzegeld',
      lockedEyebrow: 'Verzegeld',
      lockedTitle: 'Nog niet vrijgegeven',
      lockedNote: 'Lees eerst de stukken die nu openstaan. Elk stuk dat je doorneemt geeft het volgende vrij.',

      attachments: 'Bijlagen',
      callLog: 'Belgeschiedenis',
      colRef: 'Kenmerk',
      colFinding: 'Bevinding',
      colMethod: 'Methode',
      colStatus: 'Status',
      searchPlaceholder: 'naam, kenteken, parketnummer, adres…',
      search: 'Zoeken',
      noResults: 'Niets in de database komt daarmee overeen.',
      notepadHint: 'Jouw aantekeningen — bewaard op dit apparaat',
      notepadPlaceholder: 'Wat klopt er niet?',
      notesSaved: 'Bewaard op dit apparaat',
      notesNotSaved: 'Opslag is geblokkeerd — aantekeningen verdwijnen bij herladen',
      pinnedFindings: 'Gemarkeerd',

      accuseIntro: 'Één naam. Alles wat je nodig hebt zit in het dossier, en het antwoord komt meteen.',
      rightEyebrow: 'Juist',
      wrongEyebrow: 'Onjuist',
      nextCase: 'Volgend dossier',
      shareResult: 'Deel je uitslag',
      shareCopied: 'Link gekopieerd',
      shareCard: 'Deel een kaart',
      shareBuilding: 'Kaart maken…',
      shareSaved: 'Kaart opgeslagen',
      tryAgain: 'Antwoord wijzigen',

      rankLabel: 'Jouw rang',
      rankSolvedOne: 'zaak opgelost',
      rankSolvedMany: 'zaken opgelost',
      rankNext: 'tot %s',
      rankTop: 'hoogste rang',
      cardSolved: 'Zaak opgelost',
      cardUnsolved: 'Los jij het op?',
      cardCta: 'Gratis dossiers',

      howEyebrow: 'Hoe werkt het',
      howTitle: 'Lees het dossier. Wijs een verdachte aan.',
      howIntro: 'Geen login, geen aankoop, geen spelleider. Alles gebeurt in de browser, alleen of met drie anderen die meekijken.',
      steps: [
        ['01', 'Kies een dossier', 'Elke zaak uit de feed, van een rechttoe rechtaan fraudezaak tot een dossier dat nooit gesloten is.'],
        ['02', 'Volg om te openen', 'Eén tik op Instagram. Meer wordt er niet gevraagd.'],
        ['03', 'Werk het door', 'Stukken komen vrij naarmate je vordert, zodat het dossier zich opent in de volgorde waarin het is opgebouwd.'],
        ['04', 'Wijs aan', 'Eén naam, één antwoord, meteen en met de redenering erbij.']
      ],
      faq: [
        ['Zijn dit echte zaken?', 'Op dit moment niet. Elk dossier hier is geconstrueerd — geschreven voor deze site en op de kaart gemarkeerd als Geconstrueerd. Sommige volgen de vorm van een gedocumenteerde zaak, maar de personen, namen, plaatsen en foto\'s erin zijn verzonnen. Als hier ooit een dossier op basis van een echte, gedocumenteerde zaak verschijnt, wordt dat gemarkeerd als Echt en feitelijk gehouden.'],
        ['Waar komen de foto\'s vandaan?', 'Ze zijn gegenereerd, niet gefotografeerd. Niemand op een verdachtenwand is een echt persoon, en geen enkele afbeelding toont een echte plaats of een echt document.'],
        ['Moet ik betalen?', 'Nee. De dossiers zijn gratis en blijven gratis.'],
        ['Kunnen we samen spelen?', 'Ja — één scherm, tot vier personen. Er is geen beurtvolgorde.'],
        ['En als ik ernaast zit?', 'Je krijgt de redenering, het dossier blijft open en je kunt je antwoord wijzigen. Een verkeerde naam kost je niets — je rang telt alleen de zaken die je oplost.']
      ],

      notFound: 'Dat dossier bestaat niet.',
      loadError: 'Het dossier kon niet worden geladen. Controleer je verbinding en probeer opnieuw.',
      loading: 'Dossier openen…'
    }
  };

  var BADGES = {
    real:        { en: 'Real',        nl: 'Echt' },
    constructed: { en: 'Constructed', nl: 'Geconstrueerd' },
    open:        { en: 'Open',        nl: 'Open' },
    new:         { en: 'New',         nl: 'Nieuw' }
  };

  var LEVEL = { en: 'Level', nl: 'Niveau' };

  /* Rank ladder, lowest first. `at` is the number of cases solved that earns
     the rank. Cosmetic only — nothing in the app gates on it. Thresholds stay
     reachable as the library grows; add a tier rather than moving these. */
  var RANKS = [
    { at: 0,  name: { en: 'Rookie',           nl: 'Aspirant' } },
    { at: 1,  name: { en: 'Detective',        nl: 'Rechercheur' } },
    { at: 3,  name: { en: 'Senior Detective', nl: 'Senior rechercheur' } },
    { at: 6,  name: { en: 'Inspector',        nl: 'Inspecteur' } },
    { at: 10, name: { en: 'Chief Inspector',  nl: 'Hoofdinspecteur' } }
  ];

  global.I18N = {
    copy: COPY,
    badges: BADGES,
    level: LEVEL,
    ranks: RANKS,
    langs: ['en', 'nl'],

    /* Pick the right side of a {en, nl} pair. Plain strings pass through, so a
       case that is only written in one language still renders. */
    pick: function (value, lang) {
      if (value == null) return '';
      if (typeof value === 'string' || typeof value === 'number') return String(value);
      if (typeof value === 'object') {
        if (value[lang] != null) return String(value[lang]);
        if (value.en != null) return String(value.en);
        for (var k in value) if (value[k] != null) return String(value[k]);
      }
      return '';
    },

    detect: function () {
      var saved = window.Store && window.Store.getLang();
      if (saved && COPY[saved]) return saved;
      var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
      return COPY[nav] ? nav : 'en';
    }
  };
})(window);
