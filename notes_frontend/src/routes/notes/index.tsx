import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { ApiNote } from "~/services/api";
import { Api, getToken } from "~/services/api";
import { NoteList } from "~/components/notes/NoteList";
import { NoteEditor } from "~/components/notes/NoteEditor";
import { AppShell } from "~/components/layout/AppShell";

// PUBLIC_INTERFACE
export default component$(() => {
  const loc = useLocation();


  const notes = useSignal<ApiNote[]>([]);
  const selectedId = useSignal<string | null>(null);
  const selected = useSignal<ApiNote | null>(null);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);

  const load$ = $(async () => {
    loading.value = true;
    error.value = null;
    try {
      const q = loc.url.searchParams.get("q") || undefined;
      const tag = loc.url.searchParams.get("tag") || undefined;
      const archivedParam = loc.url.searchParams.get("archived");
      const archived = archivedParam === "true" ? true : archivedParam === "false" ? false : undefined;

      const list = await Api.listNotes({ q, tag, archived }, getToken() || undefined);
      notes.value = list.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
      // Update selection if necessary
      if (!selectedId.value && list.length) selectedId.value = list[0].id;
      selected.value = list.find((n) => n.id === selectedId.value) || null;
    } catch (e: any) {
      error.value = e?.message || "Failed to load notes";
    } finally {
      loading.value = false;
    }
  });

  // Load on mount and when query params change
  useVisibleTask$(async ({ track }) => {
    track(() => loc.url.search);
    await load$();
  });

  const selectNote$ = $((id: string) => {
    selectedId.value = id;
    selected.value = notes.value.find((n) => n.id === id) || null;
  });

  const onChangeTitle$ = $((value: string) => {
    if (selected.value) selected.value = { ...selected.value, title: value };
  });

  const onChangeContent$ = $((value: string) => {
    if (selected.value) selected.value = { ...selected.value, content: value };
  });

  const onChangeTags$ = $((tags: string[]) => {
    if (selected.value) selected.value = { ...selected.value, tags };
  });

  const onSave$ = $(async () => {
    if (!selected.value) return;
    const token = getToken() || undefined;
    const toSave = selected.value;
    let saved: ApiNote;
    if (!toSave.id.startsWith("tmp-")) {
      saved = await Api.updateNote(toSave.id, { title: toSave.title, content: toSave.content, tags: toSave.tags }, token);
    } else {
      saved = await Api.createNote({ title: toSave.title, content: toSave.content, tags: toSave.tags }, token);
    }
    // Refresh list and selection
    await load$();
    selectedId.value = saved.id;
    selected.value = saved;
  });

  const onDelete$ = $(async () => {
    if (!selected.value) return;
    const token = getToken() || undefined;
    if (selected.value.id && !selected.value.id.startsWith("tmp-")) {
      await Api.deleteNote(selected.value.id, token);
    }
    // Remove locally
    notes.value = notes.value.filter((n) => n.id !== selected.value!.id);
    selected.value = notes.value[0] || null;
    selectedId.value = selected.value?.id || null;
  });

  return (
    <AppShell>
      <div class="note-list">
        <div class="note-cards" style="border-bottom:1px solid var(--border);">
          <div style="display:flex; gap:8px; align-items:center;">
            <Link class="btn accent" href="/notes/new">➕ New note</Link>
            <div style="flex:1;"></div>
            {loading.value && <span class="chip">Loading…</span>}
            {error.value ? <span class="chip" style="border-color:#ff6b6b; color:#b00020;">⚠ {error.value}</span> : null}
          </div>
        </div>
        <NoteList
          notes={notes.value}
          selectedId={selectedId.value}
          onSelect$={$((ev: CustomEvent<{ id: string }>) => selectNote$(ev.detail.id))}
        />
      </div>
      <div>
        <NoteEditor
          note={selected.value}
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
              case "delete":
                return onDelete$();
            }
          })}
          readOnly={!getToken()}
        />
        {!getToken() && (
          <div style="padding:12px;">
            <div class="chip">You are in read-only mode. <Link href="/login">Login</Link> to edit.</div>
          </div>
        )}
      </div>
    </AppShell>
  );
});

export const head: DocumentHead = {
  title: "Notes",
  meta: [{ name: "description", content: "Browse and edit your notes." }],
};
