import { useEffect, useState } from "react";
import { MailCheck, RefreshCcw, Send } from "lucide-react";
import { toast } from "sonner";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminService,
  type EmailDeliveryRecord,
} from "@/services/admin.service";

const statusTone: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  processing: "bg-info/15 text-info-foreground",
  sent: "bg-primary/10 text-primary",
  delivered: "bg-success/15 text-success",
  delivery_delayed: "bg-warning/15 text-warning-foreground",
  bounced: "bg-destructive/10 text-destructive",
  complained: "bg-destructive/10 text-destructive",
  suppressed: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function AdminEmailOperations() {
  const [recipient, setRecipient] = useState("");
  const [deliveries, setDeliveries] = useState<EmailDeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await adminService.listEmailDeliveries();
      setDeliveries(result.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load email deliveries.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sendTest = async () => {
    if (!recipient.trim()) {
      toast.error("Enter a test recipient email address.");
      return;
    }
    setSending(true);
    try {
      await adminService.sendTestEmail(recipient.trim());
      toast.success(
        "Test email queued. The email worker will send it shortly.",
      );
      setRecipient("");
      await load();
    } catch (sendError) {
      toast.error(
        sendError instanceof Error
          ? sendError.message
          : "Could not queue the test email.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Email operations"
          subtitle="Send a Resend test email and inspect durable delivery status, retries, and webhook results."
        />
        <Button
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <section className="card-elevated space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <MailCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">
              Send test email
            </h2>
            <p className="text-sm text-muted-foreground">
              This queues a real delivery through the configured backend email
              provider.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Button onClick={() => void sendTest()} disabled={sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Queueing…" : "Send test"}
          </Button>
        </div>
      </section>

      {loading ? (
        <LoadingState label="Loading email deliveries…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : deliveries.length === 0 ? (
        <div className="card-soft p-8 text-center text-sm text-muted-foreground">
          No email deliveries have been queued yet.
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Provider ID</TableHead>
                <TableHead>Last error</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>{delivery.recipient}</TableCell>
                  <TableCell className="capitalize">
                    {delivery.template.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`chip capitalize ${statusTone[delivery.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {delivery.status.replaceAll("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {delivery.attemptCount}/{delivery.maxAttempts}
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-mono text-xs">
                    {delivery.providerMessageId ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-xs text-destructive">
                    {delivery.lastError ?? "—"}
                  </TableCell>
                  <TableCell>{formatDate(delivery.createdAt)}</TableCell>
                  <TableCell>{formatDate(delivery.deliveredAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
