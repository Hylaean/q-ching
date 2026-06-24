import styles from './HexagramGlyph.module.css';

interface HexagramGlyphProps {
  symbol: string;
  size?: 'large' | 'medium';
  label?: string;
}

/** The unicode hexagram glyph, rendered large in the literary serif. */
export function HexagramGlyph({ symbol, size = 'large', label }: HexagramGlyphProps) {
  return (
    <span className={`${styles.glyph} ${styles[size]}`} role="img" aria-label={label}>
      {symbol}
    </span>
  );
}
