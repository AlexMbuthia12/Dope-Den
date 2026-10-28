import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCartItems, saveCartItems, type CartLineItem } from "@/lib/cart";

function notifyCustomer(order: { orderId: string; type: "delivery" | "pickup"; total: number; items: CartLineItem[]; form?: Record<string, string>; }) {
  const recipient = "+254721515739";
  const lines = [
    "DopeDen order placed",
    `Order ID: ${order.orderId}`,
    `Order type: ${order.type === "delivery" ? "Delivery" : "Pickup"}`,
    `Total: KSh ${order.total.toLocaleString()}`,
    `Items: ${order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}`,
  ];

  if (order.type === "delivery") {
    lines.push(`Recipient: ${order.form?.recipientName || "N/A"}`);
    lines.push(`Recipient phone: ${order.form?.recipientPhone || "N/A"}`);
    lines.push(`County: ${order.form?.county || "N/A"}`);
    lines.push(`Street: ${order.form?.streetName || "N/A"}`);
    lines.push(`Apartment: ${order.form?.apartmentName || "N/A"}`);
    lines.push(`Floor: ${order.form?.floorNo || "N/A"}`);
    lines.push(`House: ${order.form?.houseNo || "N/A"}`);
  }

  const message = lines.join("\n");
  const smsUrl = `https://wa.me/${recipient.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  window.open(smsUrl, "_blank", "noopener,noreferrer");
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const items = getCartItems();
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    county: "",
    streetName: "",
    apartmentName: "",
    floorNo: "",
    houseNo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const total = subtotal;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const canSubmit = method === "pickup" || [form.recipientName, form.recipientPhone, form.county, form.streetName, form.apartmentName, form.floorNo, form.houseNo].every(Boolean);

  const handleProceedToPayment = () => {
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!canSubmit) {
      setError("Please complete all delivery details before continuing.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderId = `DD-${Date.now()}`;
      const order = {
        orderId,
        type: method,
        total,
        items,
        form,
      };

      window.localStorage.setItem("dopeden-pending-order", JSON.stringify(order));
      setLocation("/payment");
    } catch {
      setError("Unable to continue to payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <DefaultLayout title="Checkout" subtitle="Your cart is empty">
        <div className="mx-auto max-w-xl rounded-[28px] border border-border bg-card p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
          <p className="text-lg font-semibold">There are no items in your cart.</p>
          <Button className="mt-6" onClick={() => setLocation("/products")}>Back to store</Button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout title="Checkout" subtitle="Complete your order">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card/95 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-border/80 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="mb-6 flex gap-2 rounded-xl border border-border bg-background p-1">
                {(["delivery", "pickup"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMethod(option)}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${method === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {option === "delivery" ? "Delivery" : "Pick-up"}
                  </button>
                ))}
              </div>

              {method === "delivery" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm sm:col-span-2">
                      <span className="mb-1 block text-muted-foreground">Name of recipient</span>
                      <Input value={form.recipientName} onChange={(event) => updateField("recipientName", event.target.value)} />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="mb-1 block text-muted-foreground">Recipient phone no</span>
                      <Input value={form.recipientPhone} onChange={(event) => updateField("recipientPhone", event.target.value)} />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-muted-foreground">County</span>
                      <Input value={form.county} onChange={(event) => updateField("county", event.target.value)} />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-muted-foreground">Street name</span>
                      <Input value={form.streetName} onChange={(event) => updateField("streetName", event.target.value)} />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-muted-foreground">Apartment name</span>
                      <Input value={form.apartmentName} onChange={(event) => updateField("apartmentName", event.target.value)} />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-muted-foreground">Floor no</span>
                      <Input value={form.floorNo} onChange={(event) => updateField("floorNo", event.target.value)} />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      <span className="mb-1 block text-muted-foreground">House no</span>
                      <Input value={form.houseNo} onChange={(event) => updateField("houseNo", event.target.value)} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  Pick-up is available at the DopeDen store. Please collect your order during business hours.
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                <h3 className="text-lg font-semibold">Order summary</h3>

                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size ?? "no-size"}-${item.color ?? "no-color"}`} className="flex items-center justify-between gap-3">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="text-foreground">KSh {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-foreground">KSh {subtotal.toLocaleString()}</span></div>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>KSh {total.toLocaleString()}</span>
                  </div>
                </div>

                <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Delivery fee normally ranges from 200 - 1000</p>

                {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

                <Button className="mt-6 w-full" disabled={submitting} onClick={handleProceedToPayment}>
                  {submitting ? "Preparing payment..." : "Proceed to payment"}
                </Button>
                <Button variant="outline" className="mt-3 w-full" onClick={() => setLocation("/cart")}>Back to cart</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
