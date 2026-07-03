import { Outlet } from "react-router-dom";
import { Box, Paper, Stack } from "@mantine/core";

import BrandLockup from "../../../shared/components/brand/BrandLockup";
import monkeyImage from "../../../assets/landing/landing-hero-monkey.png";

/**
 * StudentShell — the shared chrome of the student flow (join + waiting),
 * wired as a pathless LAYOUT ROUTE: brand, monkey mascot and the card
 * surface render ONCE; only the routed <Outlet/> content swaps. Mobile-first
 * by design — one narrow centered column that also looks right on desktop.
 */
export default function StudentShell() {
  return (
    <Box
      mih="100dvh"
      px="md"
      py="xl"
      style={{
        background:
          "light-dark(var(--mantine-color-green-0), var(--mantine-color-dark-8))",
      }}
    >
      <Stack align="center" gap="sm" maw={420} mx="auto">
        <BrandLockup className="text-2xl font-extrabold" />

        <img
          src={monkeyImage}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{ height: 110, width: "auto" }}
        />

        <Paper radius="xl" p="lg" withBorder w="100%">
          <Outlet />
        </Paper>
      </Stack>
    </Box>
  );
}
