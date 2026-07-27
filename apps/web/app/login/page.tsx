"use client";

import {
  ArrowForward,
  CheckCircle,
  Inventory2Outlined,
  LockOutlined,
  MailOutline,
  ShieldOutlined
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/src/auth/AuthContext";

export default function LoginPage() {
  const { session, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@trendsbird.test");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/dashboard");
  }, [loading, router, session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || session) {
    return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.05fr .95fr" }, bgcolor: "white" }}>
      <Box sx={{ display: { xs: "none", lg: "flex" }, position: "relative", overflow: "hidden", bgcolor: "#0f1f38", color: "white", p: 7, flexDirection: "column" }}>
        <Box sx={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", bgcolor: "rgba(80,103,235,.20)", filter: "blur(1px)", top: -180, right: -180 }} />
        <Box sx={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)", bottom: -130, left: -90 }} />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "#536bf0", fontWeight: 900 }}>TB</Box>
          <Box><Typography fontWeight={850}>Trends Bird</Typography><Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>Admin workspace</Typography></Box>
        </Stack>
        <Box sx={{ m: "auto 0", maxWidth: 620, position: "relative" }}>
          <Typography variant="overline" sx={{ color: "#9eacff", fontWeight: 850, letterSpacing: ".14em" }}>COMMERCE OPERATIONS</Typography>
          <Typography sx={{ fontSize: 54, lineHeight: 1.08, letterSpacing: "-.045em", fontWeight: 850, mt: 1.5 }}>
            One workspace for your entire catalog.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,.62)", fontSize: 17, lineHeight: 1.7, mt: 2.5, maxWidth: 540 }}>
            Manage products, media, users, and granular access rules from a secure administration experience.
          </Typography>
          <Stack spacing={1.4} mt={4}>
            {["Role-based access control", "Reusable catalog media", "Variant-ready product management"].map((label) => (
              <Stack key={label} direction="row" spacing={1.2} alignItems="center">
                <CheckCircle sx={{ color: "#3bd2a3", fontSize: 19 }} /><Typography>{label}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Stack direction="row" spacing={4} sx={{ color: "rgba(255,255,255,.6)" }}>
          <Stack direction="row" gap={1}><ShieldOutlined fontSize="small" />Secure</Stack>
          <Stack direction="row" gap={1}><Inventory2Outlined fontSize="small" />Organized</Stack>
        </Stack>
      </Box>
      <Box sx={{ display: "grid", placeItems: "center", p: { xs: 2.5, sm: 5 } }}>
        <Paper component="form" onSubmit={submit} elevation={0} sx={{ width: "100%", maxWidth: 460, p: { xs: 2, sm: 4 } }}>
          <Typography variant="h4">Welcome back</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>Sign in to continue to the administration workspace.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" fontWeight={750} mb={.75}>Email address</Typography>
          <TextField
            fullWidth
            required
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><MailOutline fontSize="small" /></InputAdornment> } }}
          />
          <Typography variant="body2" fontWeight={750} mt={2.25} mb={.75}>Password</Typography>
          <TextField
            fullWidth
            required
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment> } }}
          />
          <Button fullWidth size="large" variant="contained" type="submit" disabled={submitting} endIcon={!submitting && <ArrowForward />} sx={{ mt: 3, height: 48 }}>
            {submitting ? <CircularProgress size={23} color="inherit" /> : "Sign in"}
          </Button>
          <Box sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: "#f7f8fc", border: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">Demo account</Typography>
            <Typography variant="body2" fontWeight={700}>Credentials are prefilled for assignment review.</Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
