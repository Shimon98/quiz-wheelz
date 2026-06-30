import { cx } from "../../../utils/classNameUtils";
import { ROLE_SELECT_CARD_STYLES as S } from "./publicEntryComponentStyles";

/**
 * RoleSelectCard — a large, tappable role-choice card ("I am a student" /
 * "I am a teacher") rendered as a real <button type="button"> for full
 * keyboard + screen-reader support.
 *
 * It carries NO navigation: it only calls `onSelect`; the hosting page owns
 * routing. Presentational and i18n-ready — all text arrives through props.
 * Direction is inherited from <html>; focus uses focus-visible only.
 *
 * `iconSlot` is treated as decorative (aria-hidden); give the button an
 * accessible name via `ariaLabel`, otherwise the visible title is used.
 */
export default function RoleSelectCard({
  title,
  description,
  iconSlot,
  actionLabel,
  onSelect,
  disabled = false,
  ariaLabel,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel || undefined}
      className={cx(S.root, className)}
    >
      {iconSlot && (
        <span aria-hidden="true" className={S.iconWrap}>
          {iconSlot}
        </span>
      )}

      <span className={S.body}>
        {title && <span className={S.title}>{title}</span>}
        {description && <span className={S.description}>{description}</span>}
      </span>

      {actionLabel && <span className={S.action}>{actionLabel}</span>}
    </button>
  );
}
