"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "@/src/auth/AuthContext";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#465dd8", dark: "#3449be", light: "#eef1ff" },
    secondary: { main: "#00a884" },
    background: { default: "#f4f6fa", paper: "#ffffff" },
    text: { primary: "#16243a", secondary: "#66758c" },
    divider: "#e5eaf1",
    success: { main: "#118a67" },
    error: { main: "#d64252" }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: { fontWeight: 800, letterSpacing: "-0.035em" },
    h5: { fontWeight: 800, letterSpacing: "-0.025em" },
    h6: { fontWeight: 750 },
    button: { textTransform: "none", fontWeight: 700 }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, minHeight: 40 } }
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#536177",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.055em",
          backgroundColor: "#f8f9fc"
        },
        root: { borderColor: "#edf0f5" }
      }
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiFormControl: { defaultProps: { size: "small" } },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18, boxShadow: "0 24px 70px rgba(25, 36, 64, .20)" }
      }
    }
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
