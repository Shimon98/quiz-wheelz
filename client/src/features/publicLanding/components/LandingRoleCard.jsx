import { ChevronRight } from "lucide-react";
import { cx } from "../../../utils/classNameUtils";
import {
  LANDING_ROLE_CARD_STYLES as S,
  LANDING_ROLE_TONE_STYLES,
} from "../styles/publicLandingPageStyles";

const DEFAULT_TONE = "student";

/**
 * LandingRoleCard — one responsive role-choice card, rendered twice (student /
 * teacher) from config. Same JSX adapts by breakpoint: a compact row on mobile
 * (media → text → arrow) and a larger centered card on sm+ (media on top, text
 * centered, arrow below).
 *
 * The active card is the real <button>; the arrow is decorative. The circular
 * media area takes `media` (a future <img>) or falls back to a lucide icon, so
 * an asset can be dropped in later without changing the structure. All text
 * arrives via props (i18n) — nothing hardcoded. Tone drives the green/blue
 * accents from C-03 tokens; direction is inherited (logical utilities + rtl:).
 */
export default function LandingRoleCard({
  title,
  description,
  actionLabel,
  tone = DEFAULT_TONE,
  media = null,
  FallbackIcon = null,
  disabled = false,
  onSelect,
  ariaLabel,
  className = "",
}) {
  const toneStyles =
    LANDING_ROLE_TONE_STYLES[tone] ?? LANDING_ROLE_TONE_STYLES[DEFAULT_TONE];

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      aria-label={ariaLabel || undefined}
      className={cx(S.card, toneStyles.card, className)}
    >
      <span aria-hidden="true" className={cx(S.mediaCircle, toneStyles.circle)}>
        {media ??
          (FallbackIcon ? (
            <FallbackIcon className={cx(S.mediaIcon, toneStyles.icon)} />
          ) : null)}
      </span>

      <span className={S.body}>
        {title && <span className={S.title}>{title}</span>}
        {description && <span className={S.description}>{description}</span>}
      </span>

      {disabled ? (
        actionLabel && <span className={S.comingSoon}>{actionLabel}</span>
      ) : (
        <>
          {actionLabel && <span className="sr-only">{actionLabel}</span>}
          <span aria-hidden="true" className={cx(S.arrow, toneStyles.arrow)}>
            <ChevronRight className={S.arrowIcon} />
          </span>
        </>
      )}
    </button>
  );
}
