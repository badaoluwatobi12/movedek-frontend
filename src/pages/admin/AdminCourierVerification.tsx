import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { VerificationBadge, TrustBadge } from "@/components/badges";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { store, useStore } from "@/data/store";
import type {
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";
import { adminService } from "@/services/admin.service";
import { verificationDocumentService } from "@/services/verificationDocument.service";

const labels: Record<VerificationDocumentType, string> = {
  selfie: "Selfie",
  government_id: "Government ID",
  driver_license: "Driver licence",
};

function initials(name?: string) {
  return (name || "MD")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatBytes(bytes: number) {
  return bytes < 1_000_000
    ? `${Math.max(1, Math.round(bytes / 1_000))} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function AdminCourierVerification() {
  const { id = "" } = useParams();
  const courier = useStore((state) =>
    state.couriers.find((candidate) => candidate.id === id),
  );
  const users = useStore((state) => state.users);
  const user = users.find((candidate) => candidate.id === courier?.user_id);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<"approved" | "rejected" | null>(
    null,
  );

  const loadDocuments = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDocuments(await verificationDocumentService.listForCourier(id));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load courier documents.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const byType = useMemo(
    () =>
      Object.fromEntries(
        documents.map((document) => [document.documentType, document]),
      ) as Partial<Record<VerificationDocumentType, VerificationDocument>>,
    [documents],
  );

  if (!courier) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Courier not found"
        desc="Refresh the admin dashboard and open the courier again."
      />
    );
  }

  const licenseRequired = courier.courier_type !== "everyday";
  const requiredReady = Boolean(
    byType.selfie &&
    byType.government_id &&
    (!licenseRequired || byType.driver_license),
  );

  const review = async (decision: "approved" | "rejected") => {
    if (reason.trim().length < 5) {
      toast.error("Enter a review reason of at least 5 characters.");
      return;
    }
    if (decision === "approved" && !requiredReady) {
      toast.error("The courier has not uploaded every required document.");
      return;
    }

    setReviewing(decision);
    try {
      await adminService.reviewCourier(courier.id, decision, reason.trim());
      await Promise.all([store.refresh(), loadDocuments()]);
      toast.success(
        decision === "approved"
          ? "Courier approved and email queued."
          : "Courier rejected and email queued.",
      );
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed.");
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/admin/couriers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to couriers
      </Link>

      <div className="card-elevated p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initials(user?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-primary">
              {user?.full_name ?? "Unknown courier"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email} · {user?.phone || "No phone"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <TrustBadge level={courier.trust_level} />
              <VerificationBadge status={courier.verification_status} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Courier type" value={courier.courier_type} />
          <Field label="Vehicle" value={courier.vehicle_type || "Not added"} />
          <Field label="Plate" value={courier.plate_number || "Not added"} />
          <Field
            label="Bank"
            value={`${courier.bank_name || "Not added"} · ${courier.account_number || "Not added"}`}
          />
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold text-primary">
            Private verification documents
          </h2>
          <p className="text-sm text-muted-foreground">
            Files are opened through authenticated backend access. Links are not
            exposed as public object-storage URLs.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(["selfie", "government_id", "driver_license"] as const).map(
              (type) => {
                const document = byType[type];
                const optional = type === "driver_license" && !licenseRequired;
                return (
                  <div key={type} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-primary">
                        {labels[type]}
                      </div>
                      {optional && (
                        <span className="text-xs text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </div>
                    {!document ? (
                      <div className="mt-4 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-6 w-6" />
                        Not uploaded
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 text-sm font-medium text-primary">
                          {document.originalName}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatBytes(document.bytes)} · {document.mimeType}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs capitalize">
                          {document.status === "approved" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : document.status === "rejected" ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <FileText className="h-4 w-4 text-accent" />
                          )}
                          {document.status}
                        </div>
                        {document.rejectionReason && (
                          <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                            {document.rejectionReason}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              verificationDocumentService.open(document)
                            }
                          >
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              verificationDocumentService.open(document, true)
                            }
                          >
                            <Download className="mr-1 h-4 w-4" /> Download
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      <div className="card-elevated space-y-4 p-6">
        <div>
          <h2 className="font-display text-lg font-bold text-primary">
            Verification decision
          </h2>
          <p className="text-sm text-muted-foreground">
            A decision creates an in-app notification and queues the matching
            Resend email.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-reason">Review reason</Label>
          <Textarea
            id="review-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain the approval checks or the exact correction required."
            maxLength={500}
          />
        </div>
        {courier.review?.reason && (
          <div className="rounded-xl bg-muted/40 p-3 text-sm">
            <div className="font-medium text-primary">Previous decision</div>
            <div className="mt-1 text-muted-foreground">
              {courier.review.decision}: {courier.review.reason}
            </div>
          </div>
        )}
        {courier.verification_status === "approved" ? (
          <Button type="button" disabled className="cursor-default">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approved
          </Button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void review("approved")}
              disabled={Boolean(reviewing) || !requiredReady}
            >
              {reviewing === "approved" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve courier
            </Button>
            <Button
              variant="outline"
              onClick={() => void review("rejected")}
              disabled={Boolean(reviewing)}
              className="border-destructive/40 text-destructive hover:text-destructive"
            >
              {reviewing === "rejected" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject and request changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-medium capitalize text-primary">
        {value}
      </div>
    </div>
  );
}
