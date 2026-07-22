import { useEffect, useState } from "react";
import { AppAlert } from "./AppAlert";

export function ConnectivityAlert() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const handleOffline = () => {
      setOnline(false);
      setShowRestored(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setShowRestored(true);
      timer = window.setTimeout(() => setShowRestored(false), 4000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!online) {
    return (
      <AppAlert
        tone="warning"
        title="You are offline"
        description="Some actions may not be saved. Reconnect before creating deliveries, making payments, or uploading documents."
      />
    );
  }

  if (showRestored) {
    return (
      <AppAlert
        tone="success"
        title="Connection restored"
        description="MoveDek is back online and you can continue safely."
        onDismiss={() => setShowRestored(false)}
      />
    );
  }

  return null;
}
