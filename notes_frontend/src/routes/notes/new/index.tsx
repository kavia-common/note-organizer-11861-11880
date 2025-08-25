import { $, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";
import type { ApiNote } from "~/services/api";
import { Api, getToken } from "~/services/api";
import { AppShell } from "~/components/layout/AppShell";
import { NoteEditor } from "~/components/notes/NoteEditor";

// PUBLIC_INTERFACE
export default component$(() => {
  const nav = useNavigate();
  const note = useSignal<ApiNote>({
    id: "tmp-" + Date.now(),
    title: "",
    content: "",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const onChangeTitle$ = $((v: string) => (note.value = { ...note.value, title: v }));
  const onChangeContent$ = $((v: string) => (note.value = { ...note.value, content: v }));
  const onChangeTags$ = $((tags: string[]) => (note.value = { ...note.value, tags }));

  const onSave$ = $(async () => {
    const token = getToken() || undefined;
    const saved = await Api.createNote({ title: note.value.title, content: note.value.content, tags: note.value.tags }, token);
    await nav(`/notes?id=${saved.id}`);
  });

  return (
    <AppShell>
      <div class="note-list">
        <div class="note-cards">
          <div class="note-card">
            <div class="title">Creating a new note</div>
            <div class="meta">Fill in the content on the right and click Save.</div>
          </div>
        </div>
      </div>
      <div>
        <NoteEditor
          note={note.value}
          onAction$={$((ev: CustomEvent<any>) => {
            const action = ev.detail as { type: string; payload?: unknown };
            switch (action.type) {
              case "title":
                return onChangeTitle$(action.payload as string);
              case "content":
                return onChangeContent$(action.payload as string);
              case "tags":
                return onChangeTags$(action.payload as string[]);
              case "save":
                return onSave$();
            }
          })}
        />
      </div>
    </AppShell>
  );
});

export const head: DocumentHead = {
  title: "New Note",
  meta: [{ name: "description", content: "Create a new note." }],
};
