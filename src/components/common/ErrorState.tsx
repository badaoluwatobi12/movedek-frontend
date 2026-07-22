import { Button } from "@/components/ui/button";
import { AppAlert } from "./AppAlert";

export default function ErrorState({
  message = "Something went wrong.",
  title = "We could not load this page",
  onRetry,
}: {
  message?: string;
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <AppAlert
      tone="danger"
      title={title}
      description={message}
      action={
        onRetry ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}
