import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import App from "./App.tsx";
import { initGA } from "./services/analytics";
import "./index.css";

// Initialize Google Analytics
initGA();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider defaultTheme="light">
      <QueryProvider>
        <App />
      </QueryProvider>
    </ThemeProvider>
  </HelmetProvider>,
);
