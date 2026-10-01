import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge, Button, Paper, Title } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { LayoutGroup, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { ROUTES } from "../../../../constants/routeConstants";
import { STUDENT_RACE_WORLD_ART } from "../../config/worldArtConfig";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";
import { resolveResultsEnterMotion } from "../../utils/studentResultsPresentation";
import StudentResultsTitlePlaque from "./StudentResultsTitlePlaque";
import StudentResultsHero from "./StudentResultsHero";
import StudentResultsProgress from "./StudentResultsProgress";
import StudentResultsFinalSummary from "./StudentResultsFinalSummary";
import StudentResultsStandings from "./StudentResultsStandings";

export default function StudentRaceResultsView({ model }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const reducedMotion = useReducedMotion();
  const titleRef = useRef(null);
  const final = model.raceFinished;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className={S.page}>
      <div className={S.backdrop} aria-hidden="true">
        <img
          className={S.backdropArt}
          src={STUDENT_RACE_WORLD_ART.far.assetUrl}
          alt=""
          draggable={false}
          decoding="async"
        />
        <span className={S.backdropTint} />
      </div>

      <motion.main className={S.shell} {...resolveResultsEnterMotion(reducedMotion)}>
        <header className={S.header}>
          <StudentResultsTitlePlaque label={t("results.title")} />
          <Paper withBorder radius="xl" px="md" py="sm" className={S.headerCard}>
            <div className={S.headerBand}>
              <Title order={1} size="h3" ref={titleRef} tabIndex={-1} className={S.title}>
                <bdi className={S.nameText} title={model.raceTitle}>
                  {model.raceTitle}
                </bdi>
              </Title>
              <Badge size="lg" variant={final ? "filled" : "light"} color={final ? UI_TONES.WARNING : UI_TONES.INFO}>
                {t(final ? "results.finalBadge" : "results.liveBadge")}
              </Badge>
            </div>
          </Paper>
        </header>

        <LayoutGroup>
          <div className={S.grid}>
            <div className={S.column}>
              <StudentResultsHero model={model} />
              {final ? (
                <StudentResultsFinalSummary counts={model.counts} playerCount={model.playerCount} />
              ) : (
                <StudentResultsProgress counts={model.counts} />
              )}
            </div>

            <div className={S.column}>
              <StudentResultsStandings model={model} reducedMotion={reducedMotion} />
              {final ? (
                <Button
                  component={Link}
                  to={ROUTES.STUDENT_JOIN}
                  size="lg"
                  radius="xl"
                  className={S.action}
                  leftSection={<RotateCcw size={18} aria-hidden="true" />}
                >
                  {t("results.joinNewRace")}
                </Button>
              ) : null}
            </div>
          </div>
        </LayoutGroup>
      </motion.main>
    </div>
  );
}
