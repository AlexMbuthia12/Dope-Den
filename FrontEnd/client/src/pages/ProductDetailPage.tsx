import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/auth";
import { addCartItem } from "@/lib/cart";

const PRODUCT_PLACEHOLDER = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1500&fit=crop";

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
  category?: { _id?: string; name?: string; slug?: string } | null;
};

export default function ProductDetailPage() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id;
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const payload = await apiJson<ProductRecord>(`/products/${productId}`);
        setProduct(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load product details");
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!product) return;

    const images = product.images && product.images.length > 0 ? product.images : [PRODUCT_PLACEHOLDER];
    setSelectedImage(images[0]);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    addCartItem({
      productId: product._id,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0] || null,
      size: product.sizes?.[0] || null,
      color: product.colors?.[0] || null,
      quantity,
    });

    setMessage("Added to cart successfully.");
    window.alert("Added to cart successfully.");
  };

  const handleViewCart = () => {
    window.location.assign("/cart");
  };

  if (loading) {
    return (
      <DefaultLayout title="Product details" subtitle="Loading product…">
        <p className="text-sm text-muted-foreground">Loading product details…</p>
      </DefaultLayout>
    );
  }

  if (error || !product) {
    return (
      <DefaultLayout title="Product details" subtitle="Unable to find product">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-destructive">{error || "Product not found."}</p>
        </div>
      </DefaultLayout>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&h=1100&fit=crop"];

  return (
    <DefaultLayout title={product.name} subtitle={product.category?.name || "Featured item"}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border-b border-border/80 p-4 lg:border-b-0 lg:border-r lg:p-6">
              <div className="overflow-hidden rounded-2xl bg-muted shadow-inner">
                <img src={selectedImage || images[0]} alt={product.name} className="h-[520px] w-full object-contain" />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-xl border-2 bg-muted transition-all ${selectedImage === image ? "border-primary shadow-md" : "border-transparent opacity-80 hover:opacity-100"}`}
                  >
                    <img src={image} alt={`${product.name} preview ${index + 1}`} className="h-24 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6 lg:p-8">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  {product.discount ? <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">{product.discount}</span> : null}
                  {product.brand ? <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.brand}</span> : null}
                </div>
                <h2 className="text-3xl font-bold">{product.name}</h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-3xl font-bold">${product.price}</span>
                  {product.originalPrice ? <span className="text-lg text-muted-foreground line-through">${product.originalPrice}</span> : null}
                </div>
              </div>

              <p className="text-sm leading-7 text-muted-foreground">{product.description}</p>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border border-border bg-background">
                  <button type="button" className="px-3 py-2 text-lg" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
                  <span className="min-w-10 text-center text-sm font-medium">{quantity}</span>
                  <button type="button" className="px-3 py-2 text-lg" onClick={() => setQuantity((value) => value + 1)}>+</button>
                </div>
                <Button className="flex-1" onClick={handleAddToCart}>Add to cart</Button>
              </div>

              <Button variant="outline" className="w-full" onClick={handleViewCart}>View cart</Button>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

              <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Stock:</span> {product.stock ?? 0}</p>
                <p><span className="font-semibold text-foreground">Category:</span> {product.category?.name || "Uncategorized"}</p>
                <p><span className="font-semibold text-foreground">Sizes:</span> {product.sizes?.join(", ") || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
