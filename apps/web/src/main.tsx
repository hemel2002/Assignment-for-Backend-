import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";

const theme = createTheme({
  palette: { primary: { main: "#2563eb" }, background: { default: "#f6f8fb" } },
  shape: { borderRadius: 10 },
  typography: { fontFamily: "Inter, system-ui, sans-serif" }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider><App /></AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
