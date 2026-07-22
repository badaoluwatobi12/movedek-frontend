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

function validateFile(file: File) {
  if (!ACCEPTED.includes(file.type)) {
    return "Use a JPEG, PNG, WebP, or PDF file.";
  }
  if (file.size > MAX_BYTES) {
    return "The document must be 8 MB or smaller.";
  }
  return "";
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
  onChanged: (document: VerificationDocument | null) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const resetInput = () => {
    setSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async (file: File) => {
    if (uploadInFlightRef.current) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      resetInput();
      return;
    }

    uploadInFlightRef.current = true;
    setSelected(file);
    setBusy(true);

    try {
      const uploadedDocument = await verificationDocumentService.upload(
        type,
        file,
      );
      resetInput();
      await onChanged(uploadedDocument);
      toast.success(`${label} uploaded securely.`);
    } catch (error) {
      resetInput();
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      uploadInFlightRef.current = false;
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!document || uploadInFlightRef.current) return;

    uploadInFlightRef.current = true;
    setBusy(true);
    try {
      await verificationDocumentService.remove(document.id);
      await onChanged(null);
      toast.success(`${label} removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      uploadInFlightRef.current = false;
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
        className="sr-only"
        aria-label={`Choose ${label.toLowerCase()} file`}
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {selected && busy && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading {selected.name}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatBytes(selected.size)} · Keep this page open until the upload
            finishes.
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : document ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {busy
            ? "Uploading..."
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

      {!document && !busy && (
        <p className="mt-3 text-xs text-muted-foreground">
          Selecting a file starts the secure upload automatically. One click is
          enough.
        </p>
      )}
    </div>
  );
}
