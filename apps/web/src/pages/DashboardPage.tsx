import { useEffect, useState } from "react";
import { Alert, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { api } from "../api/client";

export function DashboardPage() {
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Record<string, number>>("/dashboard/summary").then(setData).catch((e) => setError(e.message));
  }, []);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;
  return (
    <Stack spacing={3}>
      <div><Typography variant="h4" fontWeight={800}>Dashboard</Typography><Typography color="text.secondary">Catalog and administration overview</Typography></div>
      <Grid container spacing={2}>
        {Object.entries(data).map(([key, value]) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h4" fontWeight={800}>{value}</Typography>
              <Typography color="text.secondary">{key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
