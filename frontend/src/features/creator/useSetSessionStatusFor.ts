import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setSessionStatus } from "../../shared/api/sessions";
import type { Session } from "../../shared/api/types";

export function useSetSessionStatusFor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: "publish" | "unpublish" | "archive") =>
      setSessionStatus(id, action),
    onSuccess: (session: Session) => {
      qc.setQueryData(["sessions", "detail", id], session);
      qc.setQueryData(["sessions", "creator", "detail", id], session);
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
