"use client";

import { CloudUploadOutlined, DeleteOutline, EditOutlined, InsertDriveFileOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, CardMedia, Chip, Grid, IconButton, LinearProgress, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/auth/AuthContext";
import { ConfirmDialog, EmptyRow, FormDialog, PageAlert, PageHeader, TableToolbar, errorMessage } from "@/src/components/Ui";

type Media = { id: string; originalName: string; title?: string; altText?: string; type: string; size: number; width?: number; height?: number; publicUrl: string; thumbnailUrl?: string };

export default function MediaPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Media[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Media | undefined>();
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [form, setForm] = useState({ title: "", altText: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await api<{ items: Media[] }>(`/media?limit=100&search=${encodeURIComponent(query)}`)).items); }
    catch (value) { setError(errorMessage(value)); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("files", file));
    try { await api("/media/upload", { method: "POST", body }); await load(); }
    catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try { await api(`/media/${editing.id}`, { method: "PATCH", body: JSON.stringify({ title: form.title || undefined, altText: form.altText || undefined }) }); setEditing(undefined); await load(); }
    catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await api(`/media/${deleting.id}`, { method: "DELETE" }); setDeleting(null); await load(); }
    catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };

  return <>
    <PageHeader eyebrow="Assets" title="Media library" description="Upload once and reuse images or videos across the catalog." />
    <PageAlert message={error} onClose={() => setError("")} />
    <Box sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 4, overflow: "hidden", mb: 2.5 }}>
      <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search media…">
        {can("media:upload") && <Button component="label" variant="contained" startIcon={<CloudUploadOutlined />} disabled={busy}>Upload files<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp,video/mp4" onChange={(event) => void upload(event.target.files)} /></Button>}
      </TableToolbar>
      {busy && <LinearProgress />}
    </Box>
    {!loading && !items.length ? <Box sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 4, overflow: "hidden" }}><table style={{ width: "100%" }}><tbody><EmptyRow columns={1} label="No media uploaded yet" /></tbody></table></Box> :
      <Grid container spacing={2}>
        {(loading ? Array.from({ length: 8 }).map((_, index) => ({ id: String(index) } as Media)) : items).map((item) => <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", height: "100%", transition: ".2s", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 14px 34px rgba(25,36,64,.11)" } }}>
            <Box sx={{ height: 205, bgcolor: "#eef1f6", position: "relative", display: "grid", placeItems: "center" }}>
              {loading ? <Box sx={{ width: "100%", height: "100%", bgcolor: "#eef0f4" }} /> : item.type === "IMAGE" ? <CardMedia component="img" image={item.thumbnailUrl ?? item.publicUrl} alt={item.altText ?? item.originalName} sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <InsertDriveFileOutlined sx={{ fontSize: 58, color: "#97a2b3" }} />}
              {!loading && <Chip size="small" label={item.type.toLowerCase()} sx={{ position: "absolute", top: 10, left: 10, bgcolor: "rgba(255,255,255,.88)", fontWeight: 750 }} />}
            </Box>
            <CardContent sx={{ pb: "16px !important" }}>
              <Stack direction="row" alignItems="flex-start" gap={1}>
                <Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap fontWeight={780}>{item.title ?? item.originalName ?? "Loading…"}</Typography><Typography variant="caption" color="text.secondary">{item.size ? `${Math.round(item.size / 1024)} KB${item.width ? ` · ${item.width}×${item.height}` : ""}` : " "}</Typography></Box>
                {!loading && <Stack direction="row"><Tooltip title="Edit metadata"><IconButton size="small" onClick={() => { setEditing(item); setForm({ title: item.title ?? "", altText: item.altText ?? "" }); }} disabled={!can("media:write")}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleting(item)} disabled={!can("media:delete")}><DeleteOutline fontSize="small" /></IconButton></Tooltip></Stack>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>)}
      </Grid>}
    <FormDialog open={!!editing} title="Edit media details" subtitle="Clear titles and alt text make assets easier to find and more accessible." onClose={() => setEditing(undefined)} onSave={() => void save()} saving={busy} maxWidth="sm">
      <Stack spacing={2}><TextField fullWidth label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><TextField fullWidth multiline minRows={3} label="Alternative text" value={form.altText} onChange={(event) => setForm({ ...form, altText: event.target.value })} /></Stack>
    </FormDialog>
    <ConfirmDialog open={!!deleting} label={deleting?.title ?? deleting?.originalName ?? "media asset"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
  </>;
}
