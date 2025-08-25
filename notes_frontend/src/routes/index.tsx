import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";

// PUBLIC_INTERFACE
export default component$(() => {
  const nav = useNavigate();
  useVisibleTask$(async () => {
    await nav("/notes");
  });
  return null;
});

export const head: DocumentHead = {
  title: "Notes Organizer",
  meta: [
    { name: "description", content: "A modern, minimalistic notes organizer." },
    { name: "theme-color", content: "#4f8cff" },
  ],
};
