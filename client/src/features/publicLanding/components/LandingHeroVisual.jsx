import { Car, TreePalm, Trophy } from "lucide-react";
import { PUBLIC_LANDING_STYLES as S } from "../styles/publicLandingPageStyles";

/**
 * LandingHeroVisual — responsive, token-only hero placeholder that reserves the
 * spot for the future jungle / monkey / kart art. Compact banner on mobile, a
 * tall panel on desktop. Pure token gradient + blobs + lucide motif (jungle +
 * racing) so it reads as an intentional hero, never a broken empty image box.
 * Decorative end-to-end (aria-hidden); no image imports, no overflow.
 */
export default function LandingHeroVisual() {
  return (
    <div aria-hidden="true" className={S.hero}>
      <span className={S.heroBackdrop} />
      <span className={S.heroBlobPrimary} />
      <span className={S.heroBlobAccent} />

      <div className={S.heroCluster}>
        <span className={S.heroBadge}>
          <TreePalm className={S.heroIconGreen} />
        </span>
        <span className={`${S.heroBadge} ${S.heroBadgeRaised}`}>
          <Car className={S.heroIconSky} />
        </span>
        <span className={S.heroBadge}>
          <Trophy className={S.heroIconGold} />
        </span>
      </div>
    </div>
  );
}
