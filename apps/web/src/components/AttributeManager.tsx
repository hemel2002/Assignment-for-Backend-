"use client";

import { Add, Close } from "@mui/icons-material";
import { Box, Button, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/auth/AuthContext";
import { ConfirmDialog, ContentCard, EmptyRow, FormDialog, LoadingRows, PageAlert, PageHeader, RowActions, TableToolbar, errorMessage } from "./Ui";

type Value = { id?: string; value: string; slug: string; reference?: string };
type Attribute = { id: string; name: string; slug: string; type: string; values: Value[] };
type Form = { name: string; slug: string; type: string; values: Value[] };
const empty: Form = { name: "", slug: "", type: "DROPDOWN", values: [{ value: "", slug: "", reference: "" }] };
const types = ["DROPDOWN", "RADIO", "CHECKBOX", "COLOR_SWATCH", "IMAGE_SWATCH"];
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AttributeManager() {
  const { can } = useAuth();
  const [items, setItems] = useState<Attribute[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Attribute | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Attribute | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await api<{ items: Attribute[] }>(`/attributes?limit=100&search=${encodeURIComponent(query)}`)).items); }
    catch (value) { setError(errorMessage(value)); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);

  const updateValue = (index: number, patch: Partial<Value>) => setForm((current) => ({ ...current, values: current.values.map((value, i) => i === index ? { ...value, ...patch } : value) }));
  const save = async () => {
    if (!form.name || !form.slug || (!editing?.id && form.values.some((value) => !value.value || !value.slug))) return setError("Name, slug, and every attribute value are required.");
    setBusy(true);
    try {
      if (editing?.id) {
        await api(`/attributes/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name: form.name, slug: form.slug, type: form.type }) });
        for (const value of form.values.filter((item) => !item.id)) await api(`/attributes/${editing.id}/values`, { method: "POST", body: JSON.stringify({ value: value.value, slug: value.slug, reference: value.reference || undefined }) });
      } else {
        await api("/attributes", { method: "POST", body: JSON.stringify({ ...form, values: form.values.map((value) => ({ value: value.value, slug: value.slug, reference: value.reference || undefined })) }) });
      }
      setEditing(undefined); await load();
    } catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await api(`/attributes/${deleting.id}`, { method: "DELETE" }); setDeleting(null); await load(); }
    catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };
  return <>
    <PageHeader eyebrow="Catalog" title="Attributes" description="Create reusable options for product variants and filters." action={() => { setForm(empty); setEditing(null); }} actionLabel="New attribute" actionPermission={can("attribute:create")} />
    <PageAlert message={error} onClose={() => setError("")} />
    <ContentCard>
      <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search attributes…" />
      <TableContainer><Table><TableHead><TableRow><TableCell>Attribute</TableCell><TableCell>Display type</TableCell><TableCell>Values</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>
        {loading && <LoadingRows columns={4} />}
        {!loading && !items.length && <EmptyRow columns={4} />}
        {!loading && items.map((item) => <TableRow key={item.id} hover><TableCell><Typography fontWeight={780}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.slug}</Typography></TableCell><TableCell>{item.type.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}</TableCell><TableCell><Stack direction="row" gap={.75} flexWrap="wrap">{item.values.slice(0, 6).map((value) => <Chip key={value.id ?? value.slug} size="small" label={value.value} sx={{ bgcolor: "#f1f3f8" }} />)}{item.values.length > 6 && <Chip size="small" label={`+${item.values.length - 6}`} />}</Stack></TableCell><TableCell align="right"><RowActions onEdit={() => { setForm({ name: item.name, slug: item.slug, type: item.type, values: item.values }); setEditing(item); }} onDelete={() => setDeleting(item)} edit={can("attribute:update")} remove={can("attribute:delete")} /></TableCell></TableRow>)}
      </TableBody></Table></TableContainer>
    </ContentCard>
    <FormDialog open={editing !== undefined} title={editing?.id ? "Edit attribute" : "Create attribute"} subtitle="Add values such as sizes, colors, materials, or patterns." onClose={() => setEditing(undefined)} onSave={() => void save()} saving={busy} maxWidth="lg">
      <Grid container spacing={2}><Grid size={{ xs: 12, md: 4 }}><TextField fullWidth required label="Attribute name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, ...(!editing?.id ? { slug: slugify(event.target.value) } : {}) })} /></Grid><Grid size={{ xs: 12, md: 4 }}><TextField fullWidth required label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></Grid><Grid size={{ xs: 12, md: 4 }}><FormControl fullWidth><InputLabel>Display type</InputLabel><Select label="Display type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{types.map((type) => <MenuItem key={type} value={type}>{type.replaceAll("_", " ")}</MenuItem>)}</Select></FormControl></Grid></Grid>
      <Stack direction="row" alignItems="center" mt={3} mb={1}><Typography fontWeight={800} sx={{ flex: 1 }}>Attribute values</Typography><Button startIcon={<Add />} onClick={() => setForm({ ...form, values: [...form.values, { value: "", slug: "", reference: "" }] })}>Add value</Button></Stack>
      <Stack spacing={1.25}>{form.values.map((value, index) => <Box key={value.id ?? index} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr auto", sm: "1fr 1fr 1fr auto" }, gap: 1, alignItems: "center", p: 1.25, bgcolor: "#f7f8fa", borderRadius: 2 }}>
        <TextField label="Value" value={value.value} disabled={!!value.id} onChange={(event) => updateValue(index, { value: event.target.value, slug: slugify(event.target.value) })} /><TextField label="Slug" value={value.slug} disabled={!!value.id} onChange={(event) => updateValue(index, { slug: slugify(event.target.value) })} sx={{ display: { xs: "none", sm: "block" } }} /><TextField label="Reference / hex" value={value.reference ?? ""} disabled={!!value.id} onChange={(event) => updateValue(index, { reference: event.target.value })} sx={{ display: { xs: "none", sm: "block" } }} /><IconButton disabled={!!value.id || form.values.length === 1} onClick={() => setForm({ ...form, values: form.values.filter((_, i) => i !== index) })}><Close /></IconButton>
      </Box>)}</Stack>
    </FormDialog>
    <ConfirmDialog open={!!deleting} label={deleting?.name ?? "attribute"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
  </>;
}
