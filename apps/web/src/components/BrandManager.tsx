"use client";

import { Avatar, FormControlLabel, Grid, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/auth/AuthContext";
import { ConfirmDialog, ContentCard, EmptyRow, FormDialog, LoadingRows, PageAlert, PageHeader, RowActions, StatusChip, TableToolbar, errorMessage } from "./Ui";

type Brand = { id: string; name: string; slug: string; description?: string; active: boolean; logo?: { thumbnailUrl?: string; publicUrl?: string }; _count: { products: number } };
type Form = { name: string; slug: string; description: string; active: boolean };
const empty: Form = { name: "", slug: "", description: "", active: true };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function BrandManager() {
  const { can } = useAuth();
  const [items, setItems] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Brand | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Brand | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await api<{ items: Brand[] }>(`/brands?limit=100&search=${encodeURIComponent(query)}`)).items); }
    catch (value) { setError(errorMessage(value)); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.slug) return setError("Brand name and slug are required.");
    setBusy(true);
    try {
      await api(editing?.id ? `/brands/${editing.id}` : "/brands", { method: editing?.id ? "PATCH" : "POST", body: JSON.stringify({ ...form, description: form.description || undefined }) });
      setEditing(undefined); await load();
    } catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await api(`/brands/${deleting.id}`, { method: "DELETE" }); setDeleting(null); await load(); }
    catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };

  return <>
    <PageHeader eyebrow="Catalog" title="Brands" description="Organize products by manufacturer or label." action={() => { setForm(empty); setEditing(null); }} actionLabel="New brand" actionPermission={can("brand:create")} />
    <PageAlert message={error} onClose={() => setError("")} />
    <ContentCard>
      <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search brands…" />
      <TableContainer><Table><TableHead><TableRow><TableCell>Brand</TableCell><TableCell>Slug</TableCell><TableCell>Products</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {loading && <LoadingRows columns={5} />}
          {!loading && !items.length && <EmptyRow columns={5} />}
          {!loading && items.map((item) => <TableRow key={item.id} hover>
            <TableCell><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar variant="rounded" src={item.logo?.thumbnailUrl ?? item.logo?.publicUrl} sx={{ bgcolor: "#edf0ff", color: "primary.main", fontWeight: 800 }}>{item.name.charAt(0)}</Avatar><div><Typography fontWeight={780}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.description || "No description"}</Typography></div></div></TableCell>
            <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace" }}>{item.slug}</Typography></TableCell><TableCell>{item._count.products}</TableCell><TableCell><StatusChip active={item.active} /></TableCell>
            <TableCell align="right"><RowActions onEdit={() => { setForm({ name: item.name, slug: item.slug, description: item.description ?? "", active: item.active }); setEditing(item); }} onDelete={() => setDeleting(item)} edit={can("brand:update")} remove={can("brand:delete")} /></TableCell>
          </TableRow>)}
        </TableBody></Table></TableContainer>
    </ContentCard>
    <FormDialog open={editing !== undefined} title={editing?.id ? "Edit brand" : "Create brand"} subtitle="Add a clear name and URL-safe slug." onClose={() => setEditing(undefined)} onSave={() => void save()} saving={busy}>
      <Grid container spacing={2}><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Brand name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, ...(!editing?.id ? { slug: slugify(event.target.value) } : {}) })} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></Grid><Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Grid><Grid size={{ xs: 12 }}><FormControlLabel control={<Switch checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />} label="Brand is active" /></Grid></Grid>
    </FormDialog>
    <ConfirmDialog open={!!deleting} label={deleting?.name ?? "brand"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
  </>;
}
