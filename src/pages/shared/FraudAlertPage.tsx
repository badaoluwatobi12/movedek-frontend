import { useMemo, useState } from "react";
import { ShieldAlert, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession, useStore } from "@/data/store";
import type { FraudAlert, FraudAlertStatus, Role } from "@/lib/types";
import { supportService } from "@/services/support.service";

const statusLabels: Record<FraudAlertStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  investigating: "Investigating",
  action_taken: "Action taken",
  resolved: "Resolved",
  dismissed: "Closed after review",
};

function statusClass(status: FraudAlertStatus) {
  if (status === "resolved" || status === "action_taken") {
    return "bg-success/15 text-success";
  }
  if (status === "investigating" || status === "acknowledged") {
    return "bg-accent/15 text-accent";
  }
  if (status === "dismissed") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-warning/15 text-warning-foreground";
}

function reporterId(report: FraudAlert) {
  return (
    report.reporter_user_id ??
    report.normalized_attributes?.reporter_user_id ??
    report.created_by
  );
}

function reportDetails(report: FraudAlert) {
  return report.details ?? report.normalized_attributes?.details ?? "";
}

export default function FraudAlertPage({ role }: { role: Role }) {
  const session = useSession();
  const alerts = useStore((state) => state.fraudSignals);
  const [type, setType] = useState("suspicious_account");
  const [reference, setReference] = useState("");
  const [details, setDetails] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const myAlerts = useMemo(
    () =>
      alerts
        .filter((report) => reporterId(report) === session?.userId)
        .sort(
          (a, b) =>
            new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
        ),
    [alerts, session?.userId],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (details.trim().length < 15) {
      toast.error("Describe the suspicious activity clearly.");
      return;
    }

    setSubmitting(true);
    try {
      await supportService.reportFraud({
        report_type: type,
        reference: reference.trim() || undefined,
        details: details.trim(),
        urgent,
        reporter_role: role,
      });
      setReference("");
      setDetails("");
      setUrgent(false);
      toast.success(
        "Fraud alert sent. You will receive in-app and email updates.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit fraud alert",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">
          Fraud alert
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Privately report suspicious activity and track every trust-and-safety
          update.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="space-y-4">
          <div className="card-elevated border border-destructive/20 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mt-4 font-semibold text-primary">
              Report, do not confront
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Do not send money or share passwords, OTPs, PINs, or sensitive
              documents with anyone claiming to be MoveDek support.
            </p>
          </div>
          <div className="card-elevated p-5">
            <h3 className="font-semibold text-primary">What happens next</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              MoveDek alerts administrators immediately. You receive an in-app
              notification and email when the report is received,
              acknowledged, investigated, acted on, and resolved.
            </p>
          </div>
        </aside>

        <form onSubmit={submit} className="card-elevated space-y-5 p-5">
          <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-4">
            <Siren className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <div className="font-semibold text-primary">
                Secure trust report
              </div>
              <div className="text-sm text-muted-foreground">
                The reported user will not be shown your written submission.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>What looks suspicious?</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="suspicious_account">Suspicious account</option>
              <option value="payment_fraud">Payment or refund fraud</option>
              <option value="delivery_fraud">Delivery fraud</option>
              <option value="identity_theft">Identity theft or impersonation</option>
              <option value="phishing">Phishing or fake support message</option>
              <option value="stolen_item">Suspected stolen item</option>
              <option value="other">Other suspicious activity</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Related reference (optional)</Label>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Delivery ID, payment ID, phone, email, or username"
            />
          </div>

          <div className="space-y-2">
            <Label>What happened?</Label>
            <Textarea
              rows={8}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Describe the behavior, dates, messages, amounts, and why it appears suspicious."
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border p-4">
            <input
              className="mt-1"
              type="checkbox"
              checked={urgent}
              onChange={(event) => setUrgent(event.target.checked)}
            />
            <span>
              <span className="block font-medium text-primary">
                Active risk or ongoing loss
              </span>
              <span className="block text-sm text-muted-foreground">
                Mark urgent when a live delivery or payment is currently at risk.
              </span>
            </span>
          </label>

          <Button
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? "Sending securely…" : "Submit fraud alert"}
          </Button>
        </form>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-primary">
            Your fraud reports
          </h2>
          <p className="text-sm text-muted-foreground">
            Status updates and administrator notes appear here.
          </p>
        </div>

        {myAlerts.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-muted-foreground">
            You have not submitted a fraud alert yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {myAlerts.map((report) => (
              <article key={report.id} className="card-elevated p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium capitalize text-primary">
                      {report.signal_type.replaceAll("_", " ")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(report.detected_at).toLocaleString()}
                      {report.related_entity || report.reference
                        ? ` · Reference: ${report.related_entity ?? report.reference}`
                        : ""}
                    </div>
                  </div>
                  <span
                    className={`chip ${statusClass(report.resolution_status)}`}
                  >
                    {statusLabels[report.resolution_status]}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {reportDetails(report)}
                </p>
                {report.admin_note ? (
                  <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium text-primary">MoveDek update:</span>{" "}
                    <span className="text-muted-foreground">
                      {report.admin_note}
                    </span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
