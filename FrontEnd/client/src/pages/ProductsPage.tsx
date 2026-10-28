import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson, fetchCurrentUser, isAdminUser, type AuthUser } from "@/lib/auth";

type CategoryOption = {
  _id: string;
  name: string;
  slug: string;
  children?: CategoryOption[];
};

type ProductRecord = {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discount?: string | null;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
  brand?: string | null;
  status?: "active" | "sold";
  category?: { _id?: string; name?: string; slug?: string } | null;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  category: string;
  sizes: string;
  colors: string;
  stock: string;
  brand: string;
  status: "active" | "sold";
};

type ProductsResponse = {
  products: ProductRecord[];
};

const standardSizes = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "N/A"];
const shoeSizes = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];

const emptyDraft = (): ProductFormState => ({
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  discount: "",
  category: "",
  sizes: "",
  colors: "",
  stock: "",
  brand: "DopeDen",
  status: "active",
});

export default function ProductsPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductFormState>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  useEffect(() => {
    void loadProducts();
    void fetchCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadCategories();
  }, [isAdmin]);

  const flattenCategories = (items: CategoryOption[]): CategoryOption[] =>
    items.flatMap((item) => [item, ...flattenCategories(item.children || [])]);

  const loadCategories = async () => {
    try {
      const response = await apiJson<CategoryOption[]>("/categories");
      setCategories(response || []);
    } catch {
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      const payload = await apiJson<ProductsResponse>("/products");
      setProducts(payload.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (product: ProductRecord) => {
    const categoryId = typeof product.category === "object" && product.category ? product.category._id || "" : "";
    setEditingProductId(product._id);
    setDraft({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      discount: product.discount || "",
      category: categoryId,
      sizes: (product.sizes || []).join(", "),
      colors: (product.colors || []).join(", "),
      stock: String(product.stock ?? 0),
      brand: product.brand || "DopeDen",
      status: product.status || "active",
    });
  };

  const closeEditor = () => {
    setEditingProductId(null);
    setDraft(emptyDraft());
  };

  const markSold = async (productId: string) => {
    try {
      await apiJson(`/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sold" }),
      });
      setProducts((current) => current.filter((product) => product._id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark product as sold");
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProductId) return;

    const product = products.find((item) => item._id === editingProductId);
    if (!product) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        originalPrice: draft.originalPrice ? Number(draft.originalPrice) : null,
        discount: draft.discount || null,
        category: draft.category,
        images: product.images || [],
        sizes: draft.sizes.split(",").map((item) => item.trim()).filter(Boolean),
        colors: draft.colors.split(",").map((item) => item.trim()).filter(Boolean),
        stock: Number(draft.stock),
        brand: draft.brand || "DopeDen",
        status: draft.status,
      };

      const updated = await apiJson<any>(`/products/${editingProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setProducts((current) =>
        current.map((item) => (item._id === editingProductId ? { ...item, ...updated.product, ...updated } : item))
      );
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product");
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = flattenCategories(categories);
  const currentSizes = draft.category && categoryOptions.find((option) => option._id === draft.category)?.slug?.toLowerCase() === "shoes"
    ? shoeSizes
    : standardSizes;

  return (
    <DefaultLayout title="New Arrivals" subtitle="Products loaded from the API">
      {editingProductId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Edit product</h3>
              <Button type="button" variant="outline" onClick={closeEditor}>Close</Button>
            </div>

            <form className="space-y-5" onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Product name</span>
                  <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} required />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Brand</span>
                  <Input value={draft.brand} onChange={(event) => setDraft((prev) => ({ ...prev, brand: event.target.value }))} />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">Description</span>
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.description}
                  onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Price</span>
                  <Input type="number" value={draft.price} onChange={(event) => setDraft((prev) => ({ ...prev, price: event.target.value }))} required />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Original price</span>
                  <Input type="number" value={draft.originalPrice} onChange={(event) => setDraft((prev) => ({ ...prev, originalPrice: event.target.value }))} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Discount</span>
                  <Input value={draft.discount} onChange={(event) => setDraft((prev) => ({ ...prev, discount: event.target.value }))} placeholder="40% OFF" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Category</span>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={draft.category}
                    onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block text-muted-foreground">Sizes</span>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {currentSizes.map((size) => {
                        const selected = draft.sizes.split(",").map((item) => item.trim()).filter(Boolean).includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              const selectedSizes = draft.sizes.split(",").map((item) => item.trim()).filter(Boolean);
                              const updatedSizes = selectedSizes.includes(size)
                                ? selectedSizes.filter((item) => item !== size)
                                : [...selectedSizes, size];
                              setDraft((prev) => ({ ...prev, sizes: updatedSizes.join(", ") }));
                            }}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                    <Input value={draft.sizes} onChange={(event) => setDraft((prev) => ({ ...prev, sizes: event.target.value }))} placeholder={currentSizes.join(", ")} />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Colors</span>
                  <Input value={draft.colors} onChange={(event) => setDraft((prev) => ({ ...prev, colors: event.target.value }))} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Stock</span>
                  <Input type="number" value={draft.stock} onChange={(event) => setDraft((prev) => ({ ...prev, stock: event.target.value }))} required />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Status</span>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={draft.status}
                    onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as "active" | "sold" }))}
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                  </select>
                </label>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading catalog…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product._id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="aspect-[3/4] bg-muted">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  {product.discount ? <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">{product.discount}</span> : null}
                </div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">${product.price}</span>
                  {product.originalPrice ? <span className="text-muted-foreground line-through">${product.originalPrice}</span> : null}
                </div>
                <p className="text-xs text-muted-foreground">Sizes: {product.sizes?.join(", ") || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Colors: {product.colors?.join(", ") || "N/A"}</p>
                {isAdmin ? (
                  <div className="mt-2 space-y-2">
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => openEditor(product)}>
                      Edit details
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => void markSold(product._id)}>
                      Mark as sold
                    </Button>
                  </div>
                ) : null}
                <Button size="sm" className="mt-2 w-full" onClick={() => setLocation(`/products/${product._id}`)}>
                  View product
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {isAdmin ? (
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => setLocation("/admin")}>Open sales dashboard</Button>
        </div>
      ) : null}
    </DefaultLayout>
  );
}
