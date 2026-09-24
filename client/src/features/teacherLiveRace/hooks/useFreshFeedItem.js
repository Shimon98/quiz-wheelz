import { useState } from "react";

export default function useFreshFeedItem(items) {
  const [baselineId] = useState(() => items[0]?.id ?? null);
  const newest = items[0] ?? null;

  return newest && newest.id !== baselineId ? newest : null;
}
