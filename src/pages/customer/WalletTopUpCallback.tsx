import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyWalletTopUp } from "@/hooks/useWallet";

export default function WalletTopUpCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const verifyTopUp = useVerifyWalletTopUp();
  const reference = useMemo(
    () => params.get("reference") ?? params.get("trxref") ?? "",
    [params],
  );

  useEffect(() => {
    if (!reference) return;

    verifyTopUp.mutate(reference, {
      onSuccess: (topup) => {
        if (topup.status === "paid") {
          window.setTimeout(() => navigate("/app/wallet"), 900);
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Missing payment reference
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not verify this top-up callback.
        </p>
        <Link to="/app/wallet">
          <Button className="mt-6">Go to wallet</Button>
        </Link>
      </div>
    );
  }

  if (verifyTopUp.isError) {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-destructive" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Top-up verification failed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {verifyTopUp.error instanceof Error
            ? verifyTopUp.error.message
            : "Could not verify top-up."}
        </p>
        <Link to="/app/wallet">
          <Button className="mt-6">Back to wallet</Button>
        </Link>
      </div>
    );
  }

  if (verifyTopUp.isSuccess && verifyTopUp.data.status === "paid") {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Top-up verified
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your wallet has been credited. Redirecting you to your wallet.
        </p>
      </div>
    );
  }

  if (verifyTopUp.isSuccess && verifyTopUp.data.status !== "paid") {
    return (
      <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
        <XCircle className="mx-auto h-14 w-14 text-warning" />
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Payment not completed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paystack has not confirmed this payment yet. If you completed
          checkout, wait a moment and refresh your wallet — otherwise no funds
          were charged.
        </p>
        <Link to="/app/wallet">
          <Button className="mt-6">Back to wallet</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg card-elevated p-5 sm:p-6 md:p-8 text-center">
      <Loader2 className="mx-auto h-14 w-14 animate-spin text-accent" />
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Verifying top-up
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Please keep this page open while we confirm payment.
      </p>
    </div>
  );
}
