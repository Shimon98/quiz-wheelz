import { useCallback } from "react";
import { useSessionStorage, useViewportSize } from "@mantine/hooks";

import { isViewportPreferred } from "./preferredDeviceProfiles";

const STORAGE_KEY_PREFIX = "qw-preferred-device-dismissed:";

export default function usePreferredDeviceNotice({ profile, enabled = true }) {
  const { width, height } = useViewportSize();
  const [dismissed, setDismissed] = useSessionStorage({
    key: `${STORAGE_KEY_PREFIX}${profile.id}`,
    defaultValue: false,
    getInitialValueInEffect: false,
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  const hasViewport = width > 0 && height > 0;
  const open =
    enabled &&
    hasViewport &&
    dismissed !== true &&
    !isViewportPreferred(profile, { width, height });

  return { open, dismiss };
}
