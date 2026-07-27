"use client";

import { FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/auth/AuthContext";
import { useResourceAction } from "@/src/hooks/useResourceAction";
import { ConfirmDialog, ContentCard, EmptyRow, FormDialog, LoadingRows, PageAlert, PageHeader, RowActions, StatusChip, TableToolbar, errorMessage } from "./Ui";

type Category = { id: string; parentId?: string; name: string; slug: string; description?: string; active: boolean; sortOrder: number; children?: Category[]; _count: { products: number; children: number }; depth?: number };
type Form = { name: string; slug: string; description: string; parentId: string; active: boolean; sortOrder: number };
const empty: Form = { name: "", slug: "", description: "", parentId: "", active: true, sortOrder: 0 };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const flatten = (nodes: Category[], depth = 0): Category[] => nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children ?? [], depth + 1)]);

export function CategoryManager() {
  const { can } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(flatten(await api<Category[]>("/categories"))); }
    catch (value) { setError(errorMessage(value)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { busy, execute } = useResourceAction(load, setError);
  const visible = items.filter((item) => `${item.name} ${item.slug}`.toLowerCase().includes(search.toLowerCase()));
  const save = () => {
    if (!form.name || !form.slug) return setError("Category name and slug are required.");
    void execute(
      () => api(editing?.id ? `/categories/${editing.id}` : "/categories", { method: editing?.id ? "PATCH" : "POST", body: JSON.stringify({ ...form, parentId: form.parentId || undefined, description: form.description || undefined }) }),
      () => setEditing(undefined)
    );
  };
  const remove = () => {
    if (!deleting) return;
    void execute(
      () => api(`/categories/${deleting.id}`, { method: "DELETE" }),
      () => setDeleting(null)
    );
  };
  return <>
    <PageHeader eyebrow="Catalog" title="Categories" description="Build a clear, unlimited-depth hierarchy for your products." action={() => { setForm(empty); setEditing(null); }} actionLabel="New category" actionPermission={can("category:create")} />
    <PageAlert message={error} onClose={() => setError("")} />
    <ContentCard>
      <TableToolbar value={search} onChange={setSearch} onSubmit={() => undefined} placeholder="Filter category tree…" />
      <TableContainer><Table><TableHead><TableRow><TableCell>Category</TableCell><TableCell>Slug</TableCell><TableCell>Products</TableCell><TableCell>Children</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {loading && <LoadingRows columns={6} />}
          {!loading && !visible.length && <EmptyRow columns={6} />}
          {!loading && visible.map((item) => <TableRow key={item.id} hover>
            <TableCell><div style={{ paddingLeft: (item.depth ?? 0) * 24 }}><Typography fontWeight={780}>{(item.depth ?? 0) > 0 && "↳ "}{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.description || (item.parentId ? "Nested category" : "Root category")}</Typography></div></TableCell>
            <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace" }}>{item.slug}</Typography></TableCell><TableCell>{item._count.products}</TableCell><TableCell>{item._count.children}</TableCell><TableCell><StatusChip active={item.active} /></TableCell>
            <TableCell align="right"><RowActions onEdit={() => { setForm({ name: item.name, slug: item.slug, description: item.description ?? "", parentId: item.parentId ?? "", active: item.active, sortOrder: item.sortOrder }); setEditing(item); }} onDelete={() => setDeleting(item)} edit={can("category:update")} remove={can("category:delete")} /></TableCell>
          </TableRow>)}
        </TableBody></Table></TableContainer>
    </ContentCard>
    <FormDialog open={editing !== undefined} title={editing?.id ? "Edit category" : "Create category"} subtitle="Choose an optional parent to place this category in the tree." onClose={() => setEditing(undefined)} onSave={() => void save()} saving={busy}>
      <Grid container spacing={2}><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Category name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, ...(!editing?.id ? { slug: slugify(event.target.value) } : {}) })} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></Grid>
        <Grid size={{ xs: 12, sm: 8 }}><FormControl fullWidth><InputLabel>Parent category</InputLabel><Select label="Parent category" value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}><MenuItem value="">No parent (root)</MenuItem>{items.filter((item) => item.id !== editing?.id).map((item) => <MenuItem key={item.id} value={item.id}>{"— ".repeat(item.depth ?? 0)}{item.name}</MenuItem>)}</Select></FormControl></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Sort order" type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></Grid>
        <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Grid><Grid size={{ xs: 12 }}><FormControlLabel control={<Switch checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />} label="Category is active" /></Grid></Grid>
    </FormDialog>
    <ConfirmDialog open={!!deleting} label={deleting?.name ?? "category"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
  </>;
}
