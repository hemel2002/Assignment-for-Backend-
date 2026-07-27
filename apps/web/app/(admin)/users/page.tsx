"use client";

import {
  Avatar,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
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

type RoleOption = { id: string; name: string };
type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  active: boolean;
  avatar?: { thumbnailUrl?: string; publicUrl?: string };
  role: RoleOption;
};
type UserForm = { name: string; email: string; password: string; phone: string; gender: string; roleId: string; active: boolean };
const emptyForm: UserForm = { name: "", email: "", password: "", phone: "", gender: "", roleId: "", active: true };

export default function UsersPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const requests: [Promise<{ items: User[] }>, Promise<RoleOption[]> | null] = [
        api<{ items: User[] }>(`/users?limit=100&search=${encodeURIComponent(query)}`),
        can("user:create") ? api<RoleOption[]>("/roles/options") : null
      ];
      const [userResult, roleResult] = await Promise.all([requests[0], requests[1] ?? Promise.resolve([])]);
      setItems(userResult.items);
      setRoles(roleResult);
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setLoading(false);
    }
  }, [can, query]);

  useEffect(() => { void load(); }, [load]);
  const { busy, execute } = useResourceAction(load, setError);

  const openEdit = (item: User) => {
    setForm({
      name: item.name,
      email: item.email,
      password: "",
      phone: item.phone ?? "",
      gender: item.gender ?? "",
      roleId: item.role.id,
      active: item.active
    });
    if (!roles.some((role) => role.id === item.role.id)) setRoles((current) => [...current, item.role]);
    setEditing(item);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim() || !form.roleId || (!editing?.id && form.password.length < 10)) {
      setError("Name, email, role, and a password of at least 10 characters are required.");
      return;
    }
    const body = {
      name: form.name,
      email: form.email,
      ...(form.password ? { password: form.password } : {}),
      ...(form.phone ? { phone: form.phone } : {}),
      ...(form.gender ? { gender: form.gender } : {}),
      roleId: form.roleId,
      active: form.active
    };
    void execute(
      () => api(editing?.id ? `/users/${editing.id}` : "/users", {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(body)
      }),
      () => setEditing(undefined)
    );
  };

  const remove = () => {
    if (!deleting) return;
    void execute(
      () => api(`/users/${deleting.id}`, { method: "DELETE" }),
      () => setDeleting(null)
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Users"
        description="Manage dashboard accounts, contact details, status, and role assignments."
        action={() => { setForm(emptyForm); setEditing(null); }}
        actionLabel="Add team member"
        actionPermission={can("user:create")}
      />
      <PageAlert message={error} onClose={() => setError("")} />
      <ContentCard>
        <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search by name or email…" />
        <TableContainer><Table>
          <TableHead><TableRow><TableCell>User</TableCell><TableCell>Role</TableCell><TableCell>Gender</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {loading && <LoadingRows columns={6} />}
            {!loading && !items.length && <EmptyRow columns={6} />}
            {!loading && items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar src={item.avatar?.thumbnailUrl ?? item.avatar?.publicUrl} sx={{ bgcolor: "#e9edff", color: "primary.main", fontWeight: 800 }}>{item.name.charAt(0)}</Avatar>
                    <div><Typography fontWeight={780}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.email}</Typography></div>
                  </div>
                </TableCell>
                <TableCell><Typography variant="body2" fontWeight={650}>{item.role.name}</Typography></TableCell>
                <TableCell>{item.gender ? item.gender.charAt(0) + item.gender.slice(1).toLowerCase() : "—"}</TableCell>
                <TableCell>{item.phone || "—"}</TableCell>
                <TableCell><StatusChip active={item.active} /></TableCell>
                <TableCell align="right"><RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleting(item)} edit={can("user:update")} remove={can("user:delete")} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </ContentCard>
      <FormDialog
        open={editing !== undefined}
        title={editing?.id ? "Edit team member" : "Add team member"}
        subtitle="Account details are validated and passwords are stored as secure hashes."
        onClose={() => setEditing(undefined)}
        onSave={() => void save()}
        saving={busy}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required type="email" label="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required={!editing?.id} type="password" label={editing?.id ? "New password (optional)" : "Password"} helperText="At least 10 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth><InputLabel>Role</InputLabel><Select required label="Role" value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
              {roles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
            </Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth><InputLabel>Gender</InputLabel><Select label="Gender" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
              <MenuItem value="">Not specified</MenuItem><MenuItem value="MALE">Male</MenuItem><MenuItem value="FEMALE">Female</MenuItem><MenuItem value="OTHER">Other</MenuItem>
            </Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}><FormControlLabel control={<Switch checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />} label="Account is active" /></Grid>
        </Grid>
      </FormDialog>
      <ConfirmDialog open={!!deleting} label={deleting?.name ?? "user"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
    </>
  );
}
