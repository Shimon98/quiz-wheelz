import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Paper, Text, Title } from "@mantine/core";
import { Hourglass } from "lucide-react";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { cx } from "../../../../utils/classNameUtils";
import RacePlacementBadge from "../../../../shared/components/raceRank/RacePlacementBadge";
import { RACE_PLACEMENT_SIZES } from "../../../../shared/components/raceRank/racePlacementConfig";
import { RACE_RESULTS_ART } from "../../../../shared/raceResults/raceResultsArt";
import RaceResultsStage from "../../../../shared/components/raceResults/RaceResultsStage";
import StatCard from "../../../../shared/components/stats/StatCard";
import { STUDENT_RESULTS_HERO_BADGES } from "../../config/studentRaceResultsViewConfig";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";
import { resolveResultsHero } from "../../utils/studentResultsPresentation";

function StudentResultsHeroVehicle({ me, podium }) {
  if (podium && me.heroVehicleSrc) {
    return <RaceResultsStage kartSrc={me.heroVehicleSrc} className={S.heroStage} />;
  }

  if (!me.vehicleSrc) {
    return null;
  }

  return (
    <img
      className={cx(S.heroKart, !podium && S.heroKartMuted)}
      src={me.vehicleSrc}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

export default function StudentResultsHero({ model }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const headlineId = useId();
  const { me } = model;
  const hero = resolveResultsHero(model);
  const values = { rank: me.rank };

  return (
    <Paper
      component="section"
      withBorder
      radius="xl"
      p="lg"
      aria-labelledby={headlineId}
      data-testid="student-results-hero"
    >
      <div className={S.hero} style={{ "--qw-lane-accent": me.accentColor }}>
        {hero.badge ? (
          <div className={S.heroBadge}>
            {hero.badge === STUDENT_RESULTS_HERO_BADGES.RANK ? (
              <RacePlacementBadge
                rank={me.rank}
                placementArtEligible={me.placementArtEligible}
                size={RACE_PLACEMENT_SIZES.XL}
                accentColor={me.accentColor}
              />
            ) : (
              <span className={S.heroPending} aria-hidden="true">
                <Hourglass size={36} />
              </span>
            )}
          </div>
        ) : null}

        <div className={S.heroLive} aria-live="polite" aria-atomic="true">
          {hero.eyebrowKey ? <p className={S.eyebrow}>{t(hero.eyebrowKey)}</p> : null}
          <Title order={2} id={headlineId}>
            {t(hero.headlineKey, values)}
          </Title>
          {hero.sublineKeys.map((key) => (
            <Text key={key} fw={600} c="dimmed">
              {t(key, values)}
            </Text>
          ))}
        </div>

        <StudentResultsHeroVehicle me={me} podium={hero.podium} />
        <p className={S.heroName}>
          <bdi className={S.nameText} title={me.displayName}>
            {me.displayName}
          </bdi>
        </p>

        <div className={S.heroStats}>
          <StatCard
            compact
            label={t("results.score")}
            value={me.score}
            tone={UI_TONES.WARNING}
            art={RACE_RESULTS_ART.stats.score}
          />
          <StatCard
            compact
            label={t("results.bestStreak")}
            value={me.highestStreak}
            tone={UI_TONES.DANGER}
            art={RACE_RESULTS_ART.stats.streak}
          />
        </div>
      </div>
    </Paper>
  );
}
