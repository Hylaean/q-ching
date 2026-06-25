import { OverlayPage } from './OverlayPage';
import { useI18n } from '../i18n';
import type { Locale } from '../i18n/strings';
import styles from './About.module.css';

const REPO_URL = 'https://github.com/Hylaean/q-ching';

interface AboutProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  /** Open the Analysis page (the experiment write-up). */
  onOpenAnalysis: () => void;
}

interface Surface {
  label: string;
  title: string;
  body: string;
}

interface Copy {
  lead: string;
  surfacesLabel: string;
  surfaces: Surface[];
  readAnalysis: string;
  note: string;
  viewSource: string;
  liveAt: string;
}

const COPY: Record<Locale, Copy> = {
  en: {
    lead: 'q-ching is an I-Ching oracle that casts each reading from true quantum randomness mixed with the entropy of your own hand. Coins and yarrow stalks were always just randomness with a ritual wrapped around them — q-ching takes that literally, folding a cosmic beacon, the noise of your device, and the motion of your gesture into a single, reproducible seed.',
    surfacesLabel: 'Beyond the browser',
    surfaces: [
      {
        label: 'In the terminal',
        title: 'A ritual for the command line',
        body: 'q-ching also runs as a terminal app built with Ink. It draws entropy from the rhythm of your keystrokes and — with no browser CORS standing in the way — reaches the live NIST quantum beacon directly. This is where the quantum sources actually answer; here in the browser they are usually blocked, so your device’s own randomness quietly carries the cast.',
      },
      {
        label: 'For agents',
        title: 'The oracle as an MCP server',
        body: 'The same engine is exposed over the Model Context Protocol as a single cast_reading tool, so Claude and other agents can consult the oracle and let the drawn hexagram shape their answer. Like the terminal, it is a plain Node process — so it, too, pulls live quantum entropy.',
      },
      {
        label: 'An experiment',
        title: 'Does the oracle move the advice?',
        body: 'A small A/B harness asks a sharper question: when a language model must read the hexagram first, does its counsel genuinely change? Ten dilemmas are run twice each — once freely as a control, once guided by the cast — across two model providers, with every seed logged and every verdict blind-coded by independent judges. The honest answer so far: the reading reshapes how the case is argued, but it did not systematically move the bottom-line recommendation.',
      },
    ],
    readAnalysis: 'Read the analysis',
    note: 'The quantum sources are here for meaning and transparency, not for better randomness — a modern cryptographic RNG is already statistically perfect for casting. All interpretive text is original, written in the spirit of the classic I-Ching and copied from no translation.',
    viewSource: 'View the source on GitHub',
    liveAt: 'Live at qching.hylaean.com',
  },
  fr: {
    lead: 'q-ching est un oracle du Yi King qui tire chaque lecture d’un véritable hasard quantique mêlé à l’entropie de votre propre main. Les pièces et les tiges d’achillée n’ont jamais été qu’un hasard entouré d’un rituel — q-ching le prend au pied de la lettre, fondant une balise cosmique, le bruit de votre appareil et le mouvement de votre geste en une seule graine reproductible.',
    surfacesLabel: 'Au-delà du navigateur',
    surfaces: [
      {
        label: 'Au terminal',
        title: 'Un rituel pour la ligne de commande',
        body: 'q-ching existe aussi comme application de terminal bâtie avec Ink. Elle puise son entropie dans le rythme de vos frappes et — sans le CORS du navigateur pour s’interposer — atteint directement la balise quantique du NIST. C’est là que les sources quantiques répondent vraiment ; ici, dans le navigateur, elles sont le plus souvent bloquées, et le hasard propre à votre appareil porte discrètement le tirage.',
      },
      {
        label: 'Pour les agents',
        title: 'L’oracle comme serveur MCP',
        body: 'Le même moteur est exposé via le Model Context Protocol sous la forme d’un unique outil cast_reading, afin que Claude et d’autres agents puissent consulter l’oracle et laisser l’hexagramme tiré façonner leur réponse. Comme le terminal, c’est un simple processus Node — il puise donc lui aussi une entropie quantique en direct.',
      },
      {
        label: 'Une expérience',
        title: 'L’oracle déplace-t-il le conseil ?',
        body: 'Un petit banc d’essai A/B pose une question plus tranchante : lorsqu’un modèle de langage doit d’abord lire l’hexagramme, son conseil change-t-il réellement ? Dix dilemmes sont joués deux fois chacun — une fois librement, en témoin, une fois guidés par le tirage — sur deux fournisseurs de modèles, chaque graine étant consignée et chaque verdict codé à l’aveugle par des juges indépendants. La réponse honnête, à ce stade : le tirage remodèle la façon d’argumenter, mais il n’a pas systématiquement déplacé la recommandation finale.',
      },
    ],
    readAnalysis: 'Lire l’analyse',
    note: 'Les sources quantiques sont là pour le sens et la transparence, non pour un meilleur hasard — un générateur cryptographique moderne est déjà statistiquement parfait pour un tirage. Tout le texte interprétatif est original, écrit dans l’esprit du Yi King classique et copié d’aucune traduction.',
    viewSource: 'Voir le code source sur GitHub',
    liveAt: 'En ligne sur qching.hylaean.com',
  },
};

export function About({ open, reducedMotion, onClose, onOpenAnalysis }: AboutProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];

  return (
    <OverlayPage open={open} reducedMotion={reducedMotion} onClose={onClose} label={t('nav.about')}>
      <p className="label">{t('nav.about')}</p>
      <h1 className={styles.title}>
        q<span className={styles.dash}>-</span>ching
      </h1>

      <p className={styles.lead}>{c.lead}</p>

      <div className="rule" aria-hidden>
        <span className="rule__diamond" />
      </div>

      <p className={`label ${styles.surfacesLabel}`}>{c.surfacesLabel}</p>

      <div className={styles.surfaces}>
        {c.surfaces.map((s, idx) => {
          const isExperiment = idx === c.surfaces.length - 1;
          return (
            <section key={s.title} className={styles.surface}>
              <span className={styles.surfaceLabel}>{s.label}</span>
              <h2 className={styles.surfaceTitle}>{s.title}</h2>
              <p className={styles.surfaceBody}>{s.body}</p>
              {isExperiment && (
                <button
                  type="button"
                  className={`affordance ${styles.analysisButton}`}
                  onClick={onOpenAnalysis}
                >
                  {c.readAnalysis} →
                </button>
              )}
            </section>
          );
        })}
      </div>

      <p className={styles.note}>{c.note}</p>

      <div className={styles.actions}>
        <a className={styles.source} href={REPO_URL} target="_blank" rel="noreferrer">
          {c.viewSource} ↗
        </a>
        <a className={styles.live} href="https://qching.hylaean.com" target="_blank" rel="noreferrer">
          {c.liveAt}
        </a>
      </div>

      <p className={styles.copy}>© Hylaean Industries 2026</p>
    </OverlayPage>
  );
}
