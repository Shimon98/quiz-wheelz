import { cx } from "../../../utils/classNameUtils";
import { DEFAULT_PUBLIC_ENTRY_CARD_VARIANT } from "./publicEntryComponentConfig";
import {
  PUBLIC_ENTRY_CARD_STYLES as S,
  PUBLIC_ENTRY_CARD_VARIANT_STYLES,
} from "./publicEntryComponentStyles";

/**
 * PublicEntryCard — token-based surface card for public / auth / student-entry
 * screens (a tokenized successor to the legacy shared Card for this track).
 *
 * Presentational only: no API, no navigation, no auth, no game logic, no
 * hardcoded text. Optional regions (eyebrow / icon / description / footer)
 * render only when their prop is provided. Direction is inherited from <html>.
 *
 * `titleAs` defaults to "h2"; callers override it to keep a correct heading
 * hierarchy on the page that hosts the card.
 */
export default function PublicEntryCard({
  eyebrow,
  title,
  description,
  iconSlot,
  children,
  footerSlot,
  variant = DEFAULT_PUBLIC_ENTRY_CARD_VARIANT,
  titleAs: TitleTag = "h2",
  className = "",
  contentClassName = "",
}) {
  const variantStyles =
    PUBLIC_ENTRY_CARD_VARIANT_STYLES[variant] ??
    PUBLIC_ENTRY_CARD_VARIANT_STYLES[DEFAULT_PUBLIC_ENTRY_CARD_VARIANT];

  const hasHeader = Boolean(iconSlot || eyebrow || title || description);

  return (
    <section className={cx(S.root, variantStyles.root, className)}>
      {hasHeader && (
        <header className={S.header}>
          {iconSlot && <div className={S.iconWrap}>{iconSlot}</div>}
          {(eyebrow || title || description) && (
            <div className={S.headingGroup}>
              {eyebrow && <p className={S.eyebrow}>{eyebrow}</p>}
              {title && <TitleTag className={S.title}>{title}</TitleTag>}
              {description && <p className={S.description}>{description}</p>}
            </div>
          )}
        </header>
      )}

      {children && (
        <div className={cx(S.content, contentClassName)}>{children}</div>
      )}

      {footerSlot && <footer className={S.footer}>{footerSlot}</footer>}
    </section>
  );
}
