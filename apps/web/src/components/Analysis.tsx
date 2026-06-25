// Rendered straight from the repository's write-up so the page always reflects
// the latest analysis. Vite inlines the file's text at build time.
import analysisSource from '../../../../experiments/oracle-guided-openai/ANALYSIS.md?raw';
import { OverlayPage } from './OverlayPage';
import { Markdown } from '../lib/markdown';
import { useI18n } from '../i18n';
import styles from './Analysis.module.css';

interface AnalysisProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
}

const EYEBROW: Record<'en' | 'fr', string> = {
  en: 'The experiment · from the repository',
  fr: 'L’expérience · depuis le dépôt',
};

export function Analysis({ open, reducedMotion, onClose }: AnalysisProps) {
  const { locale } = useI18n();
  return (
    <OverlayPage open={open} reducedMotion={reducedMotion} onClose={onClose} label="Analysis">
      <p className={`label ${styles.eyebrow}`}>{EYEBROW[locale]}</p>
      <Markdown source={analysisSource} />
    </OverlayPage>
  );
}
