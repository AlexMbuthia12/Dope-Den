import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { apiJson, fetchCurrentUser, isAdminUser, type AuthUser } from "@/lib/auth";

type ProductRecord = {
  _id: string;
  name: string;
  price: number;
  status?: "active" | "sold";
  images?: string[];
  brand?: string | null;
};

type ProductsResponse = {
  products: ProductRecord[];
};

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  useEffect(() => {
    void fetchCurrentUser().then(setUser);
  }, []);

  const loadProducts = async () => {
    try {
      const payload = await apiJson<ProductsResponse>("/products?status=all");
      setProducts(payload.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    void loadProducts();
  }, [isAdmin]);

  const storedMetrics = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem("dopeden-sales-metrics") || "{}");
    } catch {
      return {};
    }
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status !== "sold"),
    [products]
  );

  const soldProducts = useMemo(
    () => products.filter((product) => product.status === "sold"),
    [products]
  );

  const revenue = useMemo(
    () => Number(storedMetrics.revenue || soldProducts.reduce((sum, product) => sum + (Number(product.price) || 0), 0)),
    [soldProducts, storedMetrics.revenue]
  );

  const completedOrders = Number(storedMetrics.orders || 0);
  const soldCount = Number(storedMetrics.soldProducts || soldProducts.length);
  const activeCount = Number(storedMetrics.activeProducts || activeProducts.length);

  const markSold = async (productId: string) => {
    try {
      await apiJson(`/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "sold" }),
      });

      setProducts((current) =>
        current.map((product) =>
          product._id === productId ? { ...product, status: "sold" } : product
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark product as sold");
    }
  };

  if (!isAdmin) {
    return (
      <DefaultLayout title="Admin dashboard" subtitle="Restricted access">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Access denied</p>
          <h3 className="mt-3 text-2xl font-semibold">Admin access required</h3>
          <p className="mt-2 text-sm text-muted-foreground">Log in with an admin account to view sales analytics.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={() => setLocation("/profile")}>Go to profile</Button>
            <Button variant="outline" onClick={() => setLocation("/")}>Storefront</Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout title="Inventory analytics" subtitle="Active vs sold product performance">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Active</p>
            <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Sold</p>
            <p className="mt-2 text-3xl font-semibold">{soldCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Revenue</p>
            <p className="mt-2 text-3xl font-semibold">KSh {revenue.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Orders</p>
            <p className="mt-2 text-3xl font-semibold">{completedOrders}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setLocation("/add-products")}>Add product</Button>
          <Button variant="outline" onClick={() => setLocation("/categories")}>Manage categories</Button>
          <Button variant="secondary" onClick={() => setLocation("/products")}>Catalog</Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-xl font-semibold">Sold items</h3>
            {soldProducts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No sold items yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {soldProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand || "DopeDen"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${Number(product.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
