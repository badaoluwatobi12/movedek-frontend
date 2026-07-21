import { useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";
import { verificationDocumentService } from "@/services/verificationDocument.service";

const MAX_BYTES = 8_000_000;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function formatBytes(bytes: number) {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function DocumentUploadField({
  label,
  description,
  type,
  document,
  optional = false,
  onChanged,
}: {
  label: string;
  description: string;
  type: VerificationDocumentType;
  document?: VerificationDocument;
  optional?: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, or PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The document must be 8 MB or smaller.");
      return;
    }
    setSelected(file);
  };

  const upload = async () => {
    if (!selected) {
      inputRef.current?.click();
      return;
    }
    setBusy(true);
    try {
      await verificationDocumentService.upload(type, selected);
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      await onChanged();
      toast.success(`${label} uploaded securely.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!document) return;
    setBusy(true);
    try {
      await verificationDocumentService.remove(document.id);
      await onChanged();
      toast.success(`${label} removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-primary">
            <FileText className="h-4 w-4" />
            {label}
            {optional && (
              <span className="text-xs font-normal text-muted-foreground">
                Optional
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {document && (
          <span
            className={`chip ${
              document.status === "approved"
                ? "bg-success/15 text-success"
                : document.status === "rejected"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent/10 text-accent"
            }`}
          >
            {document.status === "approved" ? (
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            ) : null}
            {document.status}
          </span>
        )}
      </div>

      {document && (
        <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm">
          <div className="font-medium text-primary">
            {document.originalName}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatBytes(document.bytes)} · {document.mimeType}
          </div>
          {document.rejectionReason && (
            <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              Reason: {document.rejectionReason}
            </div>
          )}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        className="mt-4"
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        disabled={busy}
        onChange={(event) => choose(event.target.files?.[0])}
      />
      {selected && (
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: {selected.name} · {formatBytes(selected.size)}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={upload} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : document ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {selected
            ? "Upload selected file"
            : document
              ? "Choose replacement"
              : "Choose file"}
        </Button>
        {document && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => verificationDocumentService.open(document)}
              disabled={busy}
            >
              <Eye className="mr-2 h-4 w-4" /> View securely
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={busy}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
