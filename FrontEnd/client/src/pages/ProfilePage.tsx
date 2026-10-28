import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson, clearAuth, fetchCurrentUser, isAdminUser, type AuthUser } from "@/lib/auth";

type ProfileApiResponse = {
  user: AuthUser;
  token?: string;
};

type LoginFormState = {
  username: string;
  email: string;
  password: string;
};

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<LoginFormState>({ username: "", email: "", password: "" });
  const [username, setUsername] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      setUsername(nextUser?.username || "");
      if (!nextUser) {
        return;
      }
    } catch (err) {
      clearAuth();
      setUser(null);
      setUsername('');
      setError(err instanceof Error ? err.message : 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload = await apiJson<ProfileApiResponse>(`${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          authMode === "login"
            ? { email: form.email, password: form.password }
            : { username: form.username.trim(), email: form.email, password: form.password }
        ),
      });

      const nextUser = payload.user;
      setUser(nextUser);
      setUsername(nextUser.username);
      setForm({ username: "", email: "", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiJson('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout failures; clear local UI state anyway.
    }
    clearAuth();
    setUser(null);
    setLocation("/");
  };

  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  return (
    <DefaultLayout title="My Profile" subtitle="Manage your account and catalog">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Account overview</p>
              <h3 className="mt-2 text-2xl font-semibold">{user?.username || "Guest"}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{user?.email || "Sign in to access your profile"}</p>
            </div>
            {user ? (
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            ) : null}
          </div>

          {!user ? (
            <form className="mt-8 space-y-4" onSubmit={handleAuthSubmit}>
              <div className="flex gap-2">
                <Button type="button" variant={authMode === "login" ? "default" : "outline"} onClick={() => setAuthMode("login")}>Login</Button>
                <Button type="button" variant={authMode === "register" ? "default" : "outline"} onClick={() => setAuthMode("register")}>Register</Button>
              </div>

              {authMode === "register" ? (
                <Input
                  placeholder="Username"
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  required
                />
              ) : null}
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <Input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Membership</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.role === "admin" ? "Administrator access" : "Standard shopper account"}</p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Profile details</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted-foreground">Username</span>
                    <Input value={username} onChange={(event) => setUsername(event.target.value)} />
                  </label>
                  <p className="text-sm text-muted-foreground">Updates can be persisted later through the profile API.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Catalog tools</p>
            <h3 className="mt-2 text-xl font-semibold">Manage products</h3>
            <p className="mt-2 text-sm text-muted-foreground">Admins can add products and keep the catalog in sync with the storefront.</p>
            <div className="mt-4 space-y-2">
              {isAdmin ? (
                <>
                  <Button className="w-full" onClick={() => setLocation("/add-products")}>Add new product</Button>
                  <Button variant="outline" className="w-full" onClick={() => setLocation("/admin")}>Open admin dashboard</Button>
                </>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Admin access is required to create products and review inventory analytics.
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>View storefront</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Security</p>
            <h3 className="mt-2 text-xl font-semibold">Protected by JWT</h3>
            <p className="mt-2 text-sm text-muted-foreground">The product creation route requires authentication and admin authorization.</p>
          </div>
        </aside>
      </div>
    </DefaultLayout>
  );
}
