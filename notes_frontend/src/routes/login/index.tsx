import { $, component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useNavigate } from "@builder.io/qwik-city";
import { Api, saveToken } from "~/services/api";

// PUBLIC_INTERFACE
export default component$(() => {
  const nav = useNavigate();
  const email = useSignal("");
  const password = useSignal("");
  const name = useSignal("");
  const isSignup = useSignal(false);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);

  const submit$ = $(async () => {
    loading.value = true;
    error.value = null;
    try {
      const resp = isSignup.value
        ? await Api.signup(email.value, password.value, name.value || undefined)
        : await Api.login(email.value, password.value);
      saveToken(resp.token);
      try {
        localStorage.setItem("user_email", resp.user.email);
      } catch (err) {
        console.warn("Failed to persist user email", err);
      }
      await nav("/notes");
    } catch (e: any) {
      error.value = e?.message || "Authentication failed";
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="auth">
      <div class="auth-card">
        <h1>{isSignup.value ? "Create account" : "Welcome back"}</h1>
        <p>Sign {isSignup.value ? "up" : "in"} to manage your notes.</p>
        <div class="auth-row">
          {isSignup.value && (
            <input
              class="input"
              placeholder="Your name (optional)"
              value={name.value}
              onInput$={(e, el) => (name.value = el.value)}
            />
          )}
          <input
            class="input"
            type="email"
            placeholder="Email"
            value={email.value}
            onInput$={(e, el) => (email.value = el.value)}
          />
          <input
            class="input"
            type="password"
            placeholder="Password"
            value={password.value}
            onInput$={(e, el) => (password.value = el.value)}
          />
          {error.value && <div class="chip" style="border-color:#ff6b6b; color:#b00020;">⚠ {error.value}</div>}
          <div class="auth-actions">
            <button class="btn primary" disabled={loading.value} onClick$={submit$}>
              {loading.value ? "Please wait..." : isSignup.value ? "Sign up" : "Sign in"}
            </button>
            <button
              class="btn ghost"
              onClick$={() => {
                isSignup.value = !isSignup.value;
                error.value = null;
              }}
            >
              {isSignup.value ? "Have an account? Sign in" : "Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Login • Notes",
  meta: [{ name: "description", content: "Login or sign up to manage your notes." }],
};
