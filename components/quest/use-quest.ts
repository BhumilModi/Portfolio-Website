"use client";
import { useSyncExternalStore } from "react";
import { INITIAL, quest, type QuestState } from "@/lib/quest";

/** Quest state: INITIAL during SSR and hydration, the stored state right after. */
export function useQuest(): QuestState {
  return useSyncExternalStore(quest.subscribe, quest.get, () => INITIAL);
}

const never = () => () => {};
/** false during SSR and hydration, true once mounted — gates UI that must not flash its empty state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(never, () => true, () => false);
}
