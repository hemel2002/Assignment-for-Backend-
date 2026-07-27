"use client";

import { Check, Close } from "@mui/icons-material";
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/auth/AuthContext";
import {
  ConfirmDialog,
  ContentCard,
  EmptyRow,
  FormDialog,
  LoadingRows,
  PageAlert,
  PageHeader,
  RowActions,
  TableToolbar,
  errorMessage
} from "@/src/components/Ui";

type Permission = { id: string; name: string; action: string };
type PermissionGroup = { id: string; name: string; description?: string; permissions: Permission[] };
type FormState = { name: string; description: string; actions: string[]; customAction: string };

const standardActions = ["create", "read", "update", "delete", "approve", "status", "upload", "watch", "write"];
const emptyForm: FormState = { name: "", description: "", actions: ["read"], customAction: "" };

export default function PermissionsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<PermissionGroup[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PermissionGroup | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<PermissionGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ items: PermissionGroup[] }>(`/permissions?limit=100&search=${encodeURIComponent(query)}`);
      setItems(result.items);
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openEdit = (item: PermissionGroup) => {
    const actions = item.permissions.map((permission) => permission.action);
    const custom = actions.find((action) => !standardActions.includes(action)) ?? "";
    setForm({ name: item.name, description: item.description ?? "", actions, customAction: custom });
    setEditing(item);
  };

  const toggle = (action: string) => setForm((current) => ({
    ...current,
    actions: current.actions.includes(action) ? current.actions.filter((item) => item !== action) : [...current.actions, action]
  }));

  const save = async () => {
    if (!form.name.trim() || !form.actions.length) {
      setError("Enter a module name and select at least one permission.");
      return;
    }
    setBusy(true);
    try {
      const actions = [...new Set([...form.actions, ...(form.customAction.trim() ? [form.customAction.trim().toLowerCase().replace(/\s+/g, "_")] : [])])];
      const path = editing?.id ? `/permissions/${editing.id}` : "/permissions";
      await api(path, {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify({ name: form.name, description: form.description || undefined, actions })
      });
      setEditing(undefined);
      await load();
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/permissions/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await load();
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Permissions"
        description="Define which actions are available inside each administration module."
        action={openCreate}
        actionLabel="New permission group"
        actionPermission={can("permission:create")}
      />
      <PageAlert message={error} onClose={() => setError("")} />
      <ContentCard>
        <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search modules or permissions…" />
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell sx={{ minWidth: 190 }}>Module</TableCell>
              {standardActions.map((action) => <TableCell key={action} align="center">{action}</TableCell>)}
              <TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {loading && <LoadingRows columns={standardActions.length + 2} />}
              {!loading && !items.length && <EmptyRow columns={standardActions.length + 2} />}
              {!loading && items.map((item) => {
                const actions = item.permissions.map((permission) => permission.action);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography fontWeight={780}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.description || `${item.permissions.length} capabilities`}</Typography>
                    </TableCell>
                    {standardActions.map((action) => (
                      <TableCell key={action} align="center">
                        <Box sx={{ display: "inline-grid", placeItems: "center", width: 25, height: 25, borderRadius: 1.5, bgcolor: actions.includes(action) ? "#e9edff" : "#f4f5f7", color: actions.includes(action) ? "primary.main" : "#a8b0bd" }}>
                          {actions.includes(action) ? <Check sx={{ fontSize: 17 }} /> : <Close sx={{ fontSize: 15 }} />}
                        </Box>
                      </TableCell>
                    ))}
                    <TableCell align="right"><RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleting(item)} edit={can("permission:update")} remove={can("permission:delete")} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </ContentCard>
      <FormDialog
        open={editing !== undefined}
        title={editing?.id ? "Edit permission group" : "Create permission group"}
        subtitle="Choose the capabilities that should exist for this module."
        onClose={() => setEditing(undefined)}
        onSave={() => void save()}
        saving={busy}
        maxWidth="lg"
      >
        <Alert severity="info" sx={{ mb: 2.5 }}>Roles can be assigned any combination of the permissions you create here.</Alert>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField fullWidth required label="Module name" placeholder="e.g. Orders" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <TextField fullWidth label="Description" placeholder="Describe what this module controls" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Grid>
        </Grid>
        <Typography fontWeight={800} mt={3} mb={1.25}>Available actions</Typography>
        <Grid container spacing={1.25}>
          {standardActions.map((action) => (
            <Grid key={action} size={{ xs: 6, sm: 4, md: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={form.actions.includes(action)} onChange={() => toggle(action)} />}
                label={action.charAt(0).toUpperCase() + action.slice(1)}
                sx={{ m: 0, width: "100%", p: .7, px: 1.25, borderRadius: 2, bgcolor: form.actions.includes(action) ? "#f0f2ff" : "#f7f8fa", border: "1px solid", borderColor: form.actions.includes(action) ? "#cfd6ff" : "transparent" }}
              />
            </Grid>
          ))}
        </Grid>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} mt={2.5} sx={{ p: 2, bgcolor: "#f7f8fa", borderRadius: 2.5 }}>
          <Typography fontWeight={750} sx={{ minWidth: 125 }}>Custom action</Typography>
          <TextField fullWidth placeholder="e.g. export_report" value={form.customAction} onChange={(event) => setForm({ ...form, customAction: event.target.value })} />
        </Stack>
      </FormDialog>
      <ConfirmDialog open={!!deleting} label={deleting?.name ?? "permission group"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
    </>
  );
}
