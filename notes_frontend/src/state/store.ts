/**
 * Global-ish state store using Qwik signals for UI selections and search/filter state.
 */

import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { ApiNote } from "~/services/api";

// PUBLIC_INTERFACE
export interface UIState {
  query: string;
  tag: string;
  archived: boolean;
  selectedNoteId: string | null;
  notes: ApiNote[];
  loading: boolean;
  error?: string;
}

/**
 * Lightweight provider component that exposes signals via scoped slots.
 * Usage:
 * <UIProvider>{(state) => <Child state={state}/>}</UIProvider>
 */
export const UIProvider = component$((props: { children?: any }) => {
  const state = useSignal<UIState>({
    query: "",
    tag: "",
    archived: false,
    selectedNoteId: null,
    notes: [],
    loading: false,
  });

  // Persist UI filters locally
  useVisibleTask$(() => {
    try {
      const stored = localStorage.getItem("ui_state");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UIState>;
        state.value = { ...state.value, ...parsed };
      }
    } catch (err) {
      // swallow read errors to keep UI functional
      console.warn("UIProvider: failed loading ui_state", err);
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => state.value.query);
    track(() => state.value.tag);
    track(() => state.value.archived);
    try {
      const toSave = {
        query: state.value.query,
        tag: state.value.tag,
        archived: state.value.archived,
      };
      localStorage.setItem("ui_state", JSON.stringify(toSave));
    } catch (err) {
      console.warn("UIProvider: failed saving ui_state", err);
    }
  });

  return props.children?.(state);
});
