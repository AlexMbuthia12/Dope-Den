import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { getCartItems, removeCartItem, updateCartItemQuantity, type CartLineItem } from "@/lib/cart";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<CartLineItem[]>([]);

  const syncCart = () => {
    setItems(getCartItems());
  };

  useEffect(() => {
    syncCart();
    window.addEventListener("dopeden-cart-updated", syncCart);
    return () => window.removeEventListener("dopeden-cart-updated", syncCart);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const handleCheckout = () => {
    if (!items.length) return;
    setLocation("/checkout");
  };

  const updateQuantity = (item: CartLineItem, delta: number) => {
    const nextQuantity = (item.quantity || 1) + delta;
    if (nextQuantity <= 0) {
      removeCartItem(item.productId, item.size ?? null, item.color ?? null);
      setItems(getCartItems());
      return;
    }

    updateCartItemQuantity(item.productId, item.size ?? null, item.color ?? null, nextQuantity);
    setItems(getCartItems());
  };

  if (items.length === 0) {
    return (
      <DefaultLayout title="Cart" subtitle="Your selected items">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-[28px] border border-border/80 bg-card/95 p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <p className="text-lg font-semibold">Your cart is empty.</p>
            <p className="mt-2 text-sm text-muted-foreground">Browse the storefront to add items.</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setLocation("/products")}>Continue shopping</Button>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout title="Cart" subtitle="Review your selected items">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card/95 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4 border-b border-border/80 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size ?? "no-size"}-${item.color ?? "no-color"}`} className="flex gap-4 rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
                  <img src={item.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop"} alt={item.name} className="h-28 w-24 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.size ? `Size: ${item.size}` : "Size: N/A"}
                          {item.color ? ` • Color: ${item.color}` : ""}
                        </p>
                      </div>
                      <p className="font-semibold">${item.price * item.quantity}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-md border border-border bg-background">
                        <button type="button" className="px-3 py-2 text-lg" onClick={() => updateQuantity(item, -1)}>-</button>
                        <span className="min-w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button type="button" className="px-3 py-2 text-lg" onClick={() => updateQuantity(item, 1)}>+</button>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => { removeCartItem(item.productId, item.size ?? null, item.color ?? null); setItems(getCartItems()); }}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Order summary</h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span className="text-foreground">Calculated at checkout</span></div>
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button className="mt-6 w-full" onClick={handleCheckout}>Proceed to checkout</Button>
                <Button variant="outline" className="mt-3 w-full" onClick={() => setLocation("/products")}>Continue shopping</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
