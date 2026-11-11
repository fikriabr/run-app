import { create } from "zustand";
import type { Routine } from "@/lib/training-types";

/** The routine being edited, shared with the exercise picker so picked exercises land in the draft. */
export const useRoutineDraft = create<{ draft: Routine | null; setDraft: (r: Routine | null) => void }>()((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
}));
