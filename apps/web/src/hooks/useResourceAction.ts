"use client";

import { useCallback, useState } from "react";
import { errorMessage } from "@/src/components/Ui";

type AsyncOperation = () => Promise<unknown>;
type Completion = () => void;

export function useResourceAction(
  reload: () => Promise<void>,
  reportError: (message: string) => void
) {
  const [busy, setBusy] = useState(false);

  const execute = useCallback(
    async (operation: AsyncOperation, onComplete: Completion) => {
      setBusy(true);
      try {
        await operation();
        onComplete();
        await reload();
      } catch (error_) {
        reportError(errorMessage(error_));
      } finally {
        setBusy(false);
      }
    },
    [reload, reportError]
  );

  return { busy, execute };
}
