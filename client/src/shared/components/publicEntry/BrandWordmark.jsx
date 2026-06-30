import { cx } from "../../../utils/classNameUtils";
import {
  DEFAULT_BRAND_WORDMARK_VARIANT,
  DEFAULT_PUBLIC_ENTRY_COMPONENT_SIZE,
} from "./publicEntryComponentConfig";
import {
  BRAND_WORDMARK_STYLES as S,
  BRAND_WORDMARK_VARIANT_STYLES,
  BRAND_WORDMARK_SIZE_STYLES,
} from "./publicEntryComponentStyles";

/**
 * BrandWordmark — the QuizWheelz logo + title/subtitle lockup for public
 * screens. Presentational and i18n-ready: every user-facing string arrives
 * through props, nothing is hardcoded, and no asset is imported here (the
 * caller passes `logoSrc`). Direction is inherited from <html>.
 *
 * Accessibility: `logoAlt` defaults to "" so the image is decorative when the
 * brand name is already present as text. Pass a non-empty `logoAlt` when the
 * image is the only place the brand name appears.
 *
 * `titleAs` keeps heading semantics in the caller's hands (e.g. "h1" on a
 * landing hero, neutral "span" elsewhere) so we don't force a heading level.
 */
export default function BrandWordmark({
  logoSrc,
  logoAlt = "",
  title,
  subtitle,
  variant = DEFAULT_BRAND_WORDMARK_VARIANT,
  size = DEFAULT_PUBLIC_ENTRY_COMPONENT_SIZE,
  titleAs: TitleTag = "span",
  className = "",
}) {
  const variantStyles =
    BRAND_WORDMARK_VARIANT_STYLES[variant] ??
    BRAND_WORDMARK_VARIANT_STYLES[DEFAULT_BRAND_WORDMARK_VARIANT];
  const sizeStyles =
    BRAND_WORDMARK_SIZE_STYLES[size] ??
    BRAND_WORDMARK_SIZE_STYLES[DEFAULT_PUBLIC_ENTRY_COMPONENT_SIZE];

  return (
    <div className={cx(S.root, variantStyles.root, className)}>
      {logoSrc && (
        <img
          src={logoSrc}
          alt={logoAlt}
          aria-hidden={logoAlt === "" ? "true" : undefined}
          draggable="false"
          className={cx(S.logo, sizeStyles.logo)}
        />
      )}

      {(title || subtitle) && (
        <div className={cx(S.textGroup, variantStyles.textGroup)}>
          {title && (
            <TitleTag className={cx(S.title, sizeStyles.title)}>
              {title}
            </TitleTag>
          )}
          {subtitle && (
            <span className={cx(S.subtitle, sizeStyles.subtitle)}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
