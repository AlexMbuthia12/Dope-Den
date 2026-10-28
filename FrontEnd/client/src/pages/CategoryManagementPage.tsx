import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson, fetchCurrentUser, isAdminUser, type AuthUser } from "@/lib/auth";

type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  children?: CategoryNode[];
};

export default function CategoryManagementPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parent, setParent] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  useEffect(() => {
    void fetchCurrentUser().then(setUser);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiJson<CategoryNode[]>('/categories');
      setCategories(response || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    void fetchCategories();
  }, [isAdmin]);

  const flatten = (items: CategoryNode[]): CategoryNode[] =>
    items.flatMap((item) => [item, ...flatten(item.children || [])]);

  const parentOptions = flatten(categories).filter((item) => item._id !== parent);

  const handleCreate = async () => {
    if (!name.trim()) {
      setMessage('Category name is required.');
      return;
    }

    try {
      await apiJson('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
          parent: parent || null,
        }),
      });
      setName('');
      setSlug('');
      setParent('');
      setMessage('Category created successfully.');
      await fetchCategories();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to create category');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiJson(`/categories/${id}`, {
        method: 'DELETE',
      });
      setMessage('Category deleted');
      await fetchCategories();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete category');
    }
  };

  const renderCategoryTree = (items: CategoryNode[], depth = 0): ReactNode[] =>
    items.flatMap((item) => [
      <div key={item._id} className="mt-2 rounded-lg border border-border bg-background p-3" style={{ marginLeft: depth * 18 }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">/{item.slug}</p>
          </div>
          {item.slug !== 'shoes' ? (
            <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(item._id)}>
              Delete
            </Button>
          ) : (
            <span className="rounded-full border border-dashed border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Protected
            </span>
          )}
        </div>
      </div>,
      ...(item.children?.length ? renderCategoryTree(item.children, depth + 1) : []),
    ]);

  if (!isAdmin) {
    return (
      <DefaultLayout title="Category management" subtitle="Admin only">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Access denied</p>
          <h3 className="mt-3 text-2xl font-semibold">Admin access required</h3>
          <p className="mt-2 text-sm text-muted-foreground">Log in with an admin account to manage categories.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={() => setLocation('/profile')}>Go to profile</Button>
            <Button variant="outline" onClick={() => setLocation('/admin')}>Dashboard</Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout title="Category management" subtitle="Create and manage store categories">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Add category</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jackets" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Slug</span>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="jackets" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Parent</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={parent}
                onChange={(event) => setParent(event.target.value)}
              >
                <option value="">No parent</option>
                {parentOptions.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void handleCreate()}>Create category</Button>
            <Button variant="outline" onClick={() => setLocation('/admin')}>Back to dashboard</Button>
          </div>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Category tree</h3>
          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading categories…</p>
          ) : categories.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="mt-4 space-y-3">{renderCategoryTree(categories)}</div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}
