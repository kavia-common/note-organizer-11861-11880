import { $, component$, useSignal } from "@builder.io/qwik";
import type { ApiNote } from "~/services/api";

export interface NoteEditorProps {
  note: ApiNote | null;
  /**
   * PUBLIC_INTERFACE
   * onAction$ is a single event handler prop. To satisfy Qwik lexical rules, we dispatch DOM CustomEvents
   * and expect the parent to pass a QRL that receives the event and switches on event.detail.
   */
  onAction$?: (ev: CustomEvent<{ type: "title" | "content" | "tags" | "save" | "delete"; payload?: unknown }>) => void;
  readOnly?: boolean;
}

// PUBLIC_INTERFACE
export const NoteEditor = component$<NoteEditorProps>((props) => {
  const tagsText = useSignal<string>(props.note?.tags?.join(", ") || "");

  const dispatch$ = $((type: "title" | "content" | "tags" | "save" | "delete", payload?: unknown) => {
    // Dispatch a DOM event instead of calling the prop directly inside $
    const event = new CustomEvent("note-action", {
      detail: { type, payload },
      bubbles: true,
    });
    // Find a safe dispatch target
    if (typeof document !== "undefined") {
      document.dispatchEvent(event);
    }
  });

  return (
    <div
      class="editor"
      onDocument$note-action={props.onAction$}
    >
      <div class="editor-header">
        <input
          class="title-input"
          placeholder="Note title..."
          value={props.note?.title || ""}
          onInput$={$((_, el: HTMLInputElement) => dispatch$("title", el.value))}
          readOnly={props.readOnly}
        />
        <div class="toolbar">
          {!props.readOnly && (
            <>
              <button class="btn primary" onClick$={$(() => dispatch$("save"))}>💾 Save</button>
              {props.note?.id ? (
                <button class="btn" onClick$={$(() => dispatch$("delete"))}>🗑️ Delete</button>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div class="content">
        <textarea
          class="textarea"
          placeholder="Write your note here..."
          value={props.note?.content || ""}
          onInput$={$((_, el: HTMLTextAreaElement) => dispatch$("content", el.value))}
          readOnly={props.readOnly}
        />
        <div style="margin-top:12px; display:flex; gap:8px; align-items:center;">
          <span class="chip">🏷️ Tags</span>
          <input
            class="input"
            placeholder="Comma separated e.g. work, ideas"
            value={tagsText.value}
            onInput$={$((_, el: HTMLInputElement) => {
              tagsText.value = el.value;
              const arr = el.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              return dispatch$("tags", arr);
            })}
            readOnly={props.readOnly}
          />
        </div>
      </div>
    </div>
  );
});
