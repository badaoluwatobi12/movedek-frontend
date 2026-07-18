import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyPayment } from "@/hooks/usePayments";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const verifyPayment = useVerifyPayment();
  const reference = useMemo(() => params.get("reference") ?? params.get("trxref") ?? "", [params]);
  const deliveryId = params.get("delivery_id");

  useEffect(() => {
    if (!reference) return;

    verifyPayment.mutate(reference, {
      onSuccess: (payment) => {
        window.setTimeout(() => navigate(`/app/track/${deliveryId ?? payment.delivery_id}`), 900);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">Missing payment reference</h1>
        <p className="mt-2 text-sm text-muted-foreground">We could not verify this payment callback.</p>
        <Link to="/app/history">
          <Button className="mt-6">Go to history</Button>
        </Link>
      </div>
    );
  }

  if (verifyPayment.isError) {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">Payment verification failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {verifyPayment.error instanceof Error ? verifyPayment.error.message : "Could not verify payment."}
        </p>
        <Link to="/app/history">
          <Button className="mt-6">Review delivery</Button>
        </Link>
      </div>
    );
  }

  if (verifyPayment.isSuccess) {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">Payment verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment is held in escrow. Redirecting you to tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
      <Loader2 className="mx-auto h-14 w-14 animate-spin text-accent" />
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">Verifying payment</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please keep this page open while we confirm escrow.
      </p>
    </div>
  );
}
