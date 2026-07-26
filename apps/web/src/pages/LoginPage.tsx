import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@trendsbird.test");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb", display: "grid", placeItems: "center", p: 2 }}>
      <Paper component="form" onSubmit={submit} sx={{ width: "100%", maxWidth: 420, p: 4 }}>
        <Typography variant="h4" fontWeight={800}>Trends Bird</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>E-commerce administration</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth required label="Email" type="email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField fullWidth required label="Password" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button fullWidth size="large" variant="contained" type="submit" disabled={submitting} sx={{ mt: 2 }}>
          {submitting ? <CircularProgress size={24} /> : "Sign in"}
        </Button>
      </Paper>
    </Box>
  );
}
