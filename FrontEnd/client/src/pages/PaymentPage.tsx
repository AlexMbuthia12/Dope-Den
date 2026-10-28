import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCartItems } from "@/lib/cart";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("+254721515739");
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("Ready to pay");

  useEffect(() => {
    const raw = window.localStorage.getItem("dopeden-pending-order");
    if (!raw) {
      setLocation("/checkout");
      return;
    }

    try {
      setPendingOrder(JSON.parse(raw));
    } catch {
      setLocation("/checkout");
    }
  }, [setLocation]);

  const triggerDarajaPayment = async () => {
    if (!pendingOrder) return;

    setProcessing(true);
    setMessage(null);
    setPaymentStatus("Sending payment request...");

    try {
      const response = await fetch(`${API_BASE_URL}/payments/stkpush`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: pendingOrder.orderId,
          amount: Number(pendingOrder.total || 0),
          phone,
          order: pendingOrder,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to initiate payment request.");
      }

      setPaymentStatus("Payment request sent. Waiting for confirmation...");
      window.alert("Payment request sent successfully. Please complete the M-Pesa prompt on your phone.");

      const statusCheck = async () => {
        try {
          const statusResponse = await fetch(`${API_BASE_URL}/payments/status/${pendingOrder.orderId}`);
          const statusPayload = await statusResponse.json().catch(() => null);
          if (statusPayload?.success && statusPayload.status === "paid") {
            const orderSummary = [
              "DopeDen order confirmed",
              `Order ID: ${pendingOrder.orderId}`,
              `Order type: ${pendingOrder.type === "delivery" ? "Delivery" : "Pickup"}`,
              `Amount: KSh ${Number(pendingOrder.total || 0).toLocaleString()}`,
              `Items: ${pendingOrder.items.map((item: any) => `${item.name} x${item.quantity}`).join(", ")}`,
            ].join("\n");

            const recipient = "+254721515739";
            const smsUrl = `https://wa.me/${recipient.replace(/\D/g, "")}?text=${encodeURIComponent(orderSummary)}`;
            window.open(smsUrl, "_blank", "noopener,noreferrer");

            saveCartItems([]);
            window.localStorage.removeItem("dopeden-pending-order");
            window.alert("Payment confirmed. Your order has been received and inventory has been updated.");
            setLocation("/");
            return;
          }
        } catch {
          // keep polling
        }

        window.setTimeout(() => {
          void statusCheck();
        }, 4000);
      };

      void statusCheck();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to process payment request right now.");
      setPaymentStatus("Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DefaultLayout title="Payment" subtitle="Complete your M-Pesa payment">
      <div className="mx-auto max-w-xl rounded-[28px] border border-border bg-card p-8 shadow-[0_30px_80px_rgba(0,0,0,0.16)]">
        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Amount due</p>
            <p className="mt-2 text-4xl font-bold">KSh {Number(pendingOrder?.total || 0).toLocaleString()}</p>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">M-Pesa phone number</span>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+2547..." />
          </label>

          <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            {paymentStatus}
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <Button className="w-full" onClick={() => void triggerDarajaPayment()} disabled={processing || !pendingOrder}>
            {processing ? "Processing..." : "Pay via M-Pesa"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setLocation("/checkout")}>Back to checkout</Button>
        </div>
      </div>
    </DefaultLayout>
  );
}
