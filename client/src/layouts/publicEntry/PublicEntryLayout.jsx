import { cx } from "../../utils/classNameUtils";
import {
  DEFAULT_PUBLIC_ENTRY_VARIANT,
  resolvePublicEntryVariant,
} from "./publicEntryLayoutConfig";
import {
  PUBLIC_ENTRY_LAYOUT_STYLES as S,
  PUBLIC_ENTRY_VARIANT_STYLES,
} from "./publicEntryLayoutStyles";

/**
 * PublicEntryLayout — presentational shell for public / auth / student entry
 * screens (landing, student join, teacher auth, public settings).
 *
 * Renders slots only: no user-facing text, no API, no routing, no auth, no
 * game logic. Direction is inherited from the global <html> element — the
 * layout never sets `dir`. Theming comes entirely from C-03 tokens, so light
 * and dark are handled automatically.
 *
 * Stacking: a single decorative layer sits at z-0 behind all real content at
 * z-10, inside an isolated, overflow-hidden wrapper (no negative z-index).
 */
export default function PublicEntryLayout({
  variant = DEFAULT_PUBLIC_ENTRY_VARIANT,
  children,
  brandSlot = null,
  visualSlot = null,
  topActionSlot = null,
  footerSlot = null,
  className = "",
  contentClassName = "",
}) {
  const safeVariant = resolvePublicEntryVariant(variant);
  const variantStyles = PUBLIC_ENTRY_VARIANT_STYLES[safeVariant];

  return (
    <div className={cx(S.page, className)}>
      <div aria-hidden="true" className={S.decorLayer}>
        <span className={S.decorBlobPrimary} />
        <span className={S.decorBlobSecondary} />
        <span className={S.decorBlobAccent} />
      </div>

      {topActionSlot && <div className={S.topAction}>{topActionSlot}</div>}

      <div className={cx(S.shellBase, variantStyles.shell)}>
        <section
          className={cx(S.contentColumn, variantStyles.content, contentClassName)}
        >
          {brandSlot && <div className={S.brand}>{brandSlot}</div>}
          <main className={S.contentInner}>{children}</main>
        </section>

        {visualSlot && (
          <section className={cx(S.visualBase, variantStyles.visual)}>
            {visualSlot}
          </section>
        )}
      </div>

      {footerSlot && <footer className={S.footer}>{footerSlot}</footer>}
    </div>
  );
}
