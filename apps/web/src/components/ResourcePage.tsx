import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export type ResourceConfig = {
  title: string;
  endpoint: string;
  permissionPrefix: string;
  columns: Array<{ label: string; render: (item: any) => ReactNode }>;
  emptyPayload: object;
  editPayload: (item: any) => object;
  listPath?: string;
  help?: string;
};

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const { can } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [payload, setPayload] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const separator = config.endpoint.includes("?") ? "&" : "?";
      const result = await api<any>(
        `${config.endpoint}${separator}search=${encodeURIComponent(search)}&limit=50`
      );
      const value = config.listPath
        ? config.listPath.split(".").reduce((current, key) => current?.[key], result)
        : result?.items ?? result;
      setItems(Array.isArray(value) ? value : []);
    } catch (value) {
      setError(message(value));
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.listPath, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (item?: any) => {
    setEditing(item ?? {});
    setPayload(
      JSON.stringify(item ? config.editPayload(item) : config.emptyPayload, null, 2)
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = JSON.parse(payload);
      await api(editing?.id ? `${config.endpoint}/${editing.id}` : config.endpoint, {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(body)
      });
      setEditing(null);
      await load();
    } catch (value) {
      setError(value instanceof SyntaxError ? "The form JSON is invalid" : message(value));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: any) => {
    if (!window.confirm(`Delete ${item.name ?? item.title ?? "this record"}?`)) return;
    try {
      await api(`${config.endpoint}/${item.id}`, { method: "DELETE" });
      await load();
    } catch (value) {
      setError(message(value));
    }
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={800}>{config.title}</Typography>
          {config.help && <Typography color="text.secondary">{config.help}</Typography>}
        </Box>
        {can(`${config.permissionPrefix}:create`) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => open()}>
            Create
          </Button>
        )}
      </Box>
      {error && <Alert severity={error.includes("permission") ? "warning" : "error"}>{error}</Alert>}
      <Paper component="form" onSubmit={(event) => { event.preventDefault(); void load(); }} sx={{ p: 2, display: "flex", gap: 1 }}>
        <TextField size="small" fullWidth label="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button type="submit">Search</Button>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            {config.columns.map((column) => <TableCell key={column.label}>{column.label}</TableCell>)}
            <TableCell align="right">Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={config.columns.length + 1} align="center"><CircularProgress size={28} /></TableCell></TableRow>}
            {!loading && !items.length && <TableRow><TableCell colSpan={config.columns.length + 1} align="center">No records found</TableCell></TableRow>}
            {items.map((item) => <TableRow key={item.id} hover>
              {config.columns.map((column) => <TableCell key={column.label}>{column.render(item)}</TableCell>)}
              <TableCell align="right">
                {can(`${config.permissionPrefix}:update`) && <IconButton aria-label="edit" onClick={() => open(item)}><EditOutlinedIcon /></IconButton>}
                {can(`${config.permissionPrefix}:delete`) && <IconButton aria-label="delete" color="error" onClick={() => void remove(item)}><DeleteOutlineIcon /></IconButton>}
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="md">
        <DialogTitle>{editing?.id ? "Edit" : "Create"} {config.title.replace(/s$/, "")}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ my: 2 }}>
            This structured editor maps directly to the validated API contract. UUID fields are selected from their module records.
          </Alert>
          <TextField multiline minRows={14} fullWidth value={payload} onChange={(event) => setPayload(event.target.value)} inputProps={{ style: { fontFamily: "monospace" } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export const Status = ({ active }: { active: boolean }) => (
  <Chip size="small" color={active ? "success" : "default"} label={active ? "Active" : "Inactive"} />
);

const message = (value: unknown) =>
  value instanceof ApiError || value instanceof Error
    ? value.message
    : "Unable to complete the request";
