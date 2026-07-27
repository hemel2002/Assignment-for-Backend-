"use client";

import {
  Checkbox,
  FormControlLabel,
  Grid,
  Switch,
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
import { useResourceAction } from "@/src/hooks/useResourceAction";
import {
  ConfirmDialog,
  ContentCard,
  EmptyRow,
  FormDialog,
  LoadingRows,
  PageAlert,
  PageHeader,
  RowActions,
  StatusChip,
  TableToolbar,
  errorMessage
} from "@/src/components/Ui";

type Permission = { id: string; action: string; name: string };
type PermissionGroup = { id: string; name: string; permissions: Permission[] };
type Role = { id: string; name: string; description?: string; active: boolean; _count: { users: number; permissions: number }; permissions?: { permissionId: string }[] };
type RoleForm = { name: string; description: string; active: boolean; grantAll: boolean; permissionIds: string[] };
const emptyForm: RoleForm = { name: "", description: "", active: true, grantAll: false, permissionIds: [] };

export default function RolesPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Role[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleResult, permissionResult] = await Promise.all([
        api<{ items: Role[] }>(`/roles?limit=100&search=${encodeURIComponent(query)}`),
        api<{ items: PermissionGroup[] }>("/permissions?limit=100")
      ]);
      setItems(roleResult.items);
      setGroups(permissionResult.items);
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);
  const { busy, execute } = useResourceAction(load, setError);

  const openEdit = async (item: Role) => {
    try {
      const detail = await api<Role>(`/roles/${item.id}`);
      setForm({
        name: detail.name,
        description: detail.description ?? "",
        active: detail.active,
        grantAll: false,
        permissionIds: detail.permissions?.map((permission) => permission.permissionId) ?? []
      });
      setEditing(item);
    } catch (error_) {
      setError(errorMessage(error_));
    }
  };

  const togglePermission = (id: string) => setForm((current) => ({
    ...current,
    permissionIds: current.permissionIds.includes(id) ? current.permissionIds.filter((item) => item !== id) : [...current.permissionIds, id]
  }));

  const toggleGroup = (group: PermissionGroup) => {
    const ids = group.permissions.map((permission) => permission.id);
    const allSelected = ids.every((id) => form.permissionIds.includes(id));
    setForm((current) => ({
      ...current,
      grantAll: false,
      permissionIds: allSelected ? current.permissionIds.filter((id) => !ids.includes(id)) : [...new Set([...current.permissionIds, ...ids])]
    }));
  };

  const save = () => {
    if (!form.name.trim()) {
      setError("Role name is required.");
      return;
    }
    void execute(
      () => api(editing?.id ? `/roles/${editing.id}` : "/roles", {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(form)
      }),
      () => setEditing(undefined)
    );
  };

  const remove = () => {
    if (!deleting) return;
    void execute(
      () => api(`/roles/${deleting.id}`, { method: "DELETE" }),
      () => setDeleting(null)
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Roles"
        description="Bundle permissions into roles and assign them to your team."
        action={() => { setForm(emptyForm); setEditing(null); }}
        actionLabel="New role"
        actionPermission={can("role:create")}
      />
      <PageAlert message={error} onClose={() => setError("")} />
      <ContentCard>
        <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search roles…" />
        <TableContainer><Table>
          <TableHead><TableRow><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Users</TableCell><TableCell>Permissions</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {loading && <LoadingRows columns={5} />}
            {!loading && !items.length && <EmptyRow columns={5} />}
            {!loading && items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell><Typography fontWeight={780}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.description || "No description"}</Typography></TableCell>
                <TableCell><StatusChip active={item.active} /></TableCell>
                <TableCell>{item._count.users}</TableCell>
                <TableCell>{item._count.permissions}</TableCell>
                <TableCell align="right"><RowActions onEdit={() => void openEdit(item)} onDelete={() => setDeleting(item)} edit={can("role:update")} remove={can("role:delete")} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </ContentCard>
      <FormDialog
        open={editing !== undefined}
        title={editing?.id ? "Edit role" : "Create role"}
        subtitle="Set role details and choose exactly what its members can do."
        onClose={() => setEditing(undefined)}
        onSave={() => void save()}
        saving={busy}
        maxWidth="lg"
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}><TextField fullWidth required label="Role name" placeholder="e.g. Catalog manager" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, md: 7 }}><TextField fullWidth label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Grid>
        </Grid>
        <Grid container spacing={2} mt={.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel control={<Switch checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />} label="Role is active" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={<Switch checked={form.grantAll} onChange={(event) => setForm({ ...form, grantAll: event.target.checked, permissionIds: event.target.checked ? [] : form.permissionIds })} />}
              label="Grant every current permission"
            />
          </Grid>
        </Grid>
        <Typography fontWeight={800} mt={2.5} mb={1}>Permission matrix</Typography>
        <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5, maxHeight: 430 }}>
          <Table stickyHeader size="small">
            <TableHead><TableRow><TableCell sx={{ minWidth: 210 }}>Module</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {groups.map((group) => {
                const ids = group.permissions.map((permission) => permission.id);
                const selected = ids.filter((id) => form.permissionIds.includes(id)).length;
                return (
                  <TableRow key={group.id}>
                    <TableCell>
                      <FormControlLabel
                        control={<Checkbox checked={!!ids.length && selected === ids.length} indeterminate={selected > 0 && selected < ids.length} disabled={form.grantAll} onChange={() => toggleGroup(group)} />}
                        label={<Typography fontWeight={750}>{group.name}</Typography>}
                      />
                    </TableCell>
                    <TableCell>
                      {group.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.id}
                          control={<Checkbox size="small" checked={form.grantAll || form.permissionIds.includes(permission.id)} disabled={form.grantAll} onChange={() => togglePermission(permission.id)} />}
                          label={permission.action}
                          sx={{ mr: 2 }}
                        />
                      ))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </FormDialog>
      <ConfirmDialog open={!!deleting} label={deleting?.name ?? "role"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
    </>
  );
}
