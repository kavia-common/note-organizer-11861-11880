import { $, component$, useStylesScoped$ } from "@builder.io/qwik";
import type { ApiNote } from "~/services/api";

const css = `
.wrapper { height: 100%; }
`;

export interface NoteListProps {
  notes: ApiNote[];
  selectedId: string | null;
  /**
   * PUBLIC_INTERFACE
   * Parent should pass a QRL handler for the "note-select" custom event via onDocument$note-select.
   * This avoids closing over a function prop inside $ handlers.
   */
  onSelect$?: (ev: CustomEvent<{ id: string }>) => void;
}

// PUBLIC_INTERFACE
export const NoteList = component$<NoteListProps>(({ notes, selectedId, onSelect$ }) => {
  useStylesScoped$(css);

  const emitSelect$ = $((id: string) => {
    const event = new CustomEvent("note-select", { detail: { id }, bubbles: true });
    if (typeof document !== "undefined") {
      document.dispatchEvent(event);
    }
  });

  return (
    <div class="note-list wrapper" onDocument$note-select={onSelect$}>
      <div class="note-cards">
        {notes.length === 0 && (
          <div class="note-card">
            <div class="title">No notes found</div>
            <div class="meta">Try creating a new note or adjusting your search.</div>
          </div>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            data-id={n.id}
            class={"note-card " + (selectedId === n.id ? "active" : "")}
            onClick$={$((ev) => {
              const target = ev.currentTarget as HTMLElement;
              const id = target.dataset.id!;
              return emitSelect$(id);
            })}
          >
            <div class="title">{n.title || "Untitled"}</div>
            <div class="meta">
              <span>{new Date(n.updatedAt).toLocaleString()}</span>
              {n.tags && n.tags.length ? <span>• {n.tags.join(", ")}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
