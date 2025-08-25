import { component$, Slot, useSignal } from "@builder.io/qwik";
import { Link, useLocation, useNavigate } from "@builder.io/qwik-city";
import { clearToken, getToken } from "~/services/api";

// PUBLIC_INTERFACE
export const AppShell = component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const email = useSignal<string | null>(null);

  // Read user email lazily on the client when rendering
  if (typeof window !== "undefined" && email.value === null) {
    try {
      const me = localStorage.getItem("user_email");
      email.value = me;
    } catch {
      email.value = null;
    }
  }

  const isActive = (path: string) => loc.url.pathname === path;

  return (
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="logo" />
          <span>Note Organizer</span>
        </div>

        <div class="search">
          <span class="icon">🔎</span>
          <input class="input" placeholder="Search notes..." name="q" value={loc.url.searchParams.get("q") || ""} readOnly />
        </div>

        <div class="section-title">Navigation</div>
        <nav class="nav-list">
          <Link class={"nav-item " + (isActive("/notes") ? "active" : "")} href="/notes">
            <span>📝</span> <span>All Notes</span>
          </Link>
          <Link class={"nav-item " + (isActive("/notes?archived=true") ? "active" : "")} href="/notes?archived=true">
            <span>📦</span> <span>Archived</span>
          </Link>
          <Link class={"nav-item " + (isActive("/notes?tag=important") ? "active" : "")} href="/notes?tag=important">
            <span>⭐</span> <span>Important</span>
          </Link>
        </nav>

        <div class="section-title">Tags</div>
        <div class="tags">
          <Link class="chip" href="/notes?tag=work">#work</Link>
          <Link class="chip" href="/notes?tag=personal">#personal</Link>
          <Link class="chip" href="/notes?tag=ideas">#ideas</Link>
        </div>
      </aside>

      <header class="topbar">
        <div class="app-title">
          <span>🗒️</span>
          <span>Notes</span>
        </div>
        <div class="actions">
          <Link class="btn accent" href="/notes/new">➕ New</Link>
          {getToken() ? (
            <>
              <span class="chip">👤 {email.value || "User"}</span>
              <button
                class="btn"
                onClick$={() => {
                  clearToken();
                  localStorage.removeItem("user_email");
                  nav("/login");
                }}
              >
                ⎋ Logout
              </button>
            </>
          ) : (
            <Link class="btn primary" href="/login">Login</Link>
          )}
        </div>
      </header>

      <section class="main">
        <Slot />
      </section>
    </div>
  );
});
