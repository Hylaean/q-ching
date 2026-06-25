/**
 * UI string dictionaries. Flat, dotted keys. `t(key, vars)` interpolates
 * {placeholders}. The hexagram interpretive prose is translated separately
 * (see hexText.ts + hexagrams.fr.ts) since it's large, generated content.
 */

export type Locale = 'en' | 'fr';
export const LOCALES: Locale[] = ['en', 'fr'];
export const LOCALE_LABEL: Record<Locale, string> = { en: 'EN', fr: 'FR' };

type Dict = Record<string, string>;

const en: Dict = {
  'threshold.subtitle': 'an oracle cast from quantum noise and the motion of your hand',
  'common.begin': 'Begin',

  'question.label': 'Hold it in mind',
  'question.prompt': 'What weighs on you?',
  'question.placeholder': 'A question, a knot, a crossing… or nothing at all.',
  'question.gather': 'Gather',

  'method.legend': 'Method',
  'method.coin.name': 'Coin',
  'method.coin.blurb': 'faster, balanced — changing lines come often',
  'method.coin.word': 'coin',
  'method.yarrow.name': 'Yarrow',
  'method.yarrow.blurb': 'traditional stalks — changing lines are rarer',
  'method.yarrow.word': 'yarrow',

  'sources.legend': 'Quantum source',
  'sources.hint': 'local entropy is always folded in, so a cast is never blocked',

  'gathering.label': 'Stir the well',
  'gathering.instruction':
    'Trace the dark with your hand. Your motion, the noise of your device, and the universe’s own randomness are gathering into a single seed.',
  'gathering.allowMotion': 'Allow motion',
  'gathering.motionDenied': 'Motion declined — your hand alone will do.',
  'gathering.keepStirring': 'keep stirring…',
  'gathering.listening': 'listening for the beacon…',
  'gathering.cast': 'Cast',

  'source.nist.title': 'NIST quantum beacon',
  'source.nist.blurb': 'the cosmic pulse at the moment you asked',
  'source.anu.title': 'ANU vacuum noise',
  'source.anu.blurb': 'fluctuations of empty space',
  'source.randomorg.title': 'atmospheric noise',
  'source.randomorg.blurb': 'static gathered from the sky',
  'source.csprng.title': 'local entropy',
  'source.csprng.blurb': 'your device’s own randomness',
  'source.listening': 'listening…',
  'source.unreachable': 'unreachable (folded around)',

  'casting.coin': 'Three coins fall',
  'casting.yarrow': 'The stalks divide',
  'casting.note': 'casting…',
  'casting.count': '{n} of 6 lines',
  'casting.drawing': 'drawing from the well',

  'reading.judgment': 'The Judgment',
  'reading.image': 'The Image',
  'reading.now': 'Now',
  'reading.linesInMotion': 'Lines in Motion',
  'reading.becoming': 'this is becoming…',
  'reading.hexagram': 'Hexagram {n}',
  'reading.seedNote':
    'This cast was drawn by the {method} method. Its seed reproduces it exactly — keep it to return to this same throw.',
  'reading.copy': 'copy',
  'reading.copied': 'copied',
  'reading.copyLink': 'copy a link to this cast',
  'reading.linkCopied': 'link copied',
  'reading.shareHint': 'The link reopens this exact cast — on any device.',
  'reading.castAgain': 'Cast again',
  'reading.line.1': 'First line',
  'reading.line.2': 'Second line',
  'reading.line.3': 'Third line',
  'reading.line.4': 'Fourth line',
  'reading.line.5': 'Fifth line',
  'reading.line.6': 'Sixth line',

  'journal.toggle': 'Journal',
  'journal.open': 'Open journal',
  'journal.close': 'Close',
  'journal.title': 'Journal',
  'journal.empty': 'Your past castings will gather here, each one returnable by its seed.',
  'journal.wordless': 'a wordless casting',
  'journal.clear': 'Clear journal',
  'journal.revisit': 'Revisit this reading',

  'lang.label': 'Language',

  'nav.about': 'About',
  'common.close': 'Close',
};

const fr: Dict = {
  'threshold.subtitle': 'un oracle tiré du bruit quantique et du mouvement de votre main',
  'common.begin': 'Commencer',

  'question.label': 'Gardez-la à l’esprit',
  'question.prompt': 'Qu’est-ce qui vous pèse ?',
  'question.placeholder': 'Une question, un nœud, un carrefour… ou rien du tout.',
  'question.gather': 'Rassembler',

  'method.legend': 'Méthode',
  'method.coin.name': 'Pièces',
  'method.coin.blurb': 'plus rapide, équilibrée — les lignes mutantes sont fréquentes',
  'method.coin.word': 'des pièces',
  'method.yarrow.name': 'Achillée',
  'method.yarrow.blurb': 'tiges traditionnelles — les lignes mutantes sont plus rares',
  'method.yarrow.word': 'de l’achillée',

  'sources.legend': 'Source quantique',
  'sources.hint': 'l’entropie locale est toujours intégrée : un tirage n’est jamais bloqué',

  'gathering.label': 'Remuez le puits',
  'gathering.instruction':
    'Tracez l’obscurité de la main. Votre mouvement, le bruit de votre appareil et le hasard même de l’univers se rassemblent en une seule graine.',
  'gathering.allowMotion': 'Autoriser le mouvement',
  'gathering.motionDenied': 'Mouvement refusé — votre main seule suffira.',
  'gathering.keepStirring': 'continuez à remuer…',
  'gathering.listening': 'à l’écoute de la balise…',
  'gathering.cast': 'Tirer',

  'source.nist.title': 'balise quantique du NIST',
  'source.nist.blurb': 'le pouls cosmique à l’instant de votre question',
  'source.anu.title': 'bruit du vide de l’ANU',
  'source.anu.blurb': 'les fluctuations de l’espace vide',
  'source.randomorg.title': 'bruit atmosphérique',
  'source.randomorg.blurb': 'parasites recueillis dans le ciel',
  'source.csprng.title': 'entropie locale',
  'source.csprng.blurb': 'le hasard propre à votre appareil',
  'source.listening': 'à l’écoute…',
  'source.unreachable': 'injoignable (contournée)',

  'casting.coin': 'Trois pièces tombent',
  'casting.yarrow': 'Les tiges se divisent',
  'casting.note': 'tirage…',
  'casting.count': '{n} sur 6 lignes',
  'casting.drawing': 'on puise au puits',

  'reading.judgment': 'Le Jugement',
  'reading.image': 'L’Image',
  'reading.now': 'Maintenant',
  'reading.linesInMotion': 'Lignes en mouvement',
  'reading.becoming': 'ceci devient…',
  'reading.hexagram': 'Hexagramme {n}',
  'reading.seedNote':
    'Ce tirage a été obtenu par la méthode {method}. Sa graine le reproduit à l’identique — conservez-la pour retrouver ce même tirage.',
  'reading.copy': 'copier',
  'reading.copied': 'copié',
  'reading.copyLink': 'copier un lien vers ce tirage',
  'reading.linkCopied': 'lien copié',
  'reading.shareHint': 'Le lien rouvre ce tirage exact — sur n’importe quel appareil.',
  'reading.castAgain': 'Tirer à nouveau',
  'reading.line.1': 'Première ligne',
  'reading.line.2': 'Deuxième ligne',
  'reading.line.3': 'Troisième ligne',
  'reading.line.4': 'Quatrième ligne',
  'reading.line.5': 'Cinquième ligne',
  'reading.line.6': 'Sixième ligne',

  'journal.toggle': 'Journal',
  'journal.open': 'Ouvrir le journal',
  'journal.close': 'Fermer',
  'journal.title': 'Journal',
  'journal.empty': 'Vos tirages passés se rassembleront ici, chacun retrouvable par sa graine.',
  'journal.wordless': 'un tirage sans mots',
  'journal.clear': 'Effacer le journal',
  'journal.revisit': 'Revoir ce tirage',

  'lang.label': 'Langue',

  'nav.about': 'À propos',
  'common.close': 'Fermer',
};

export const STRINGS: Record<Locale, Dict> = { en, fr };
