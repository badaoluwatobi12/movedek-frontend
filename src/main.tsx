import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/errors/AppErrorBoundary";
import { installGlobalErrorReporting } from "./observability/clientErrorReporter";
import "./index.css";

installGlobalErrorReporting();

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
