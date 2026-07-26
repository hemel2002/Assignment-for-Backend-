import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CardMedia, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function MediaPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => api<any>("/media?limit=50").then((r) => setItems(r.items)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  const upload = async (files: FileList | null) => {
    if (!files) return;
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    setLoading(true);
    try { await api("/media/upload", { method: "POST", body: form }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); setLoading(false); }
  };
  return <Stack spacing={2}>
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ flex: 1 }}><Typography variant="h4" fontWeight={800}>Media library</Typography><Typography color="text.secondary">Reusable images and videos</Typography></Box>
      {can("media:upload") && <Button variant="contained" component="label">Upload files<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp,video/mp4" onChange={(e) => void upload(e.target.files)} /></Button>}
    </Box>
    {error && <Alert severity="error">{error}</Alert>}
    {loading ? <CircularProgress /> : !items.length ? <Alert severity="info">No media uploaded yet.</Alert> :
      <Grid container spacing={2}>{items.map((item) => <Grid key={item.id} size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>{item.type === "IMAGE" ? <CardMedia component="img" height="180" image={item.thumbnailUrl ?? item.publicUrl} alt={item.altText ?? item.originalName} /> : <Box sx={{ height: 180, display: "grid", placeItems: "center", bgcolor: "grey.100" }}>Video</Box>}
          <CardContent><Typography noWrap fontWeight={700}>{item.title ?? item.originalName}</Typography><Typography variant="caption" color="text.secondary">{Math.round(item.size / 1024)} KB</Typography></CardContent>
        </Card>
      </Grid>)}</Grid>}
  </Stack>;
}
