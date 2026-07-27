"use client";

import {
  Add,
  DeleteOutline,
  EditOutlined,
  ErrorOutline,
  Search,
  WarningAmber
} from "@mui/icons-material";
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
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { FormEvent, ReactNode } from "react";
import { ApiError } from "@/src/api/client";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  actionLabel = "Add new",
  actionPermission = true
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  actionPermission?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
      <Box sx={{ flex: 1 }}>
        {eyebrow && <Typography color="primary.main" variant="overline" fontWeight={850} letterSpacing=".11em">{eyebrow}</Typography>}
        <Typography variant="h4">{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: .5 }}>{description}</Typography>
      </Box>
      {action && actionPermission && <Button variant="contained" startIcon={<Add />} onClick={action}>{actionLabel}</Button>}
    </Box>
  );
}

export function ContentCard({ children, sx }: { children: ReactNode; sx?: object }) {
  return <Paper variant="outlined" sx={{ borderRadius: 4, overflow: "hidden", borderColor: "divider", boxShadow: "0 5px 24px rgba(25,36,64,.045)", ...sx }}>{children}</Paper>;
}

export function TableToolbar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search records…",
  children
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <Box component="form" onSubmit={submit} sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        sx={{ width: { xs: "100%", sm: 330 } }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
      />
      <Button type="submit" variant="outlined">Search</Button>
      <Box sx={{ flex: 1 }} />
      {children}
    </Box>
  );
}

export function StatusChip({ active }: { active: boolean }) {
  return (
    <Chip
      size="small"
      label={active ? "Active" : "Inactive"}
      sx={{
        bgcolor: active ? "#e8f7f2" : "#f1f3f6",
        color: active ? "#08785a" : "#657289",
        fontWeight: 750,
        "&:before": { content: '""', width: 7, height: 7, borderRadius: "50%", bgcolor: active ? "#12a77c" : "#96a0ae", ml: 1.1 }
      }}
    />
  );
}

export function RowActions({
  onEdit,
  onDelete,
  edit = true,
  remove = true
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  edit?: boolean;
  remove?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="flex-end" spacing={.5}>
      {edit && onEdit && <Tooltip title="Edit"><IconButton size="small" onClick={onEdit} sx={{ bgcolor: "#f2f4f8" }}><EditOutlined fontSize="small" /></IconButton></Tooltip>}
      {remove && onDelete && <Tooltip title="Delete"><IconButton size="small" onClick={onDelete} sx={{ bgcolor: "#fff0f1", color: "error.main" }}><DeleteOutline fontSize="small" /></IconButton></Tooltip>}
    </Stack>
  );
}

export function LoadingRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return <>{Array.from({ length: rows }).map((_, row) => <TableRow key={row}>{Array.from({ length: columns }).map((__, column) => <TableCell key={column}><Skeleton /></TableCell>)}</TableRow>)}</>;
}

export function EmptyRow({ columns, label = "No records found" }: { columns: number; label?: string }) {
  return (
    <TableRow><TableCell colSpan={columns}>
      <Box sx={{ py: 7, textAlign: "center" }}>
        <ErrorOutline color="disabled" sx={{ fontSize: 38 }} />
        <Typography fontWeight={750} mt={1}>{label}</Typography>
        <Typography variant="body2" color="text.secondary">Try changing your search or create a new record.</Typography>
      </Box>
    </TableCell></TableRow>
  );
}

export function FormDialog({
  open,
  title,
  subtitle,
  onClose,
  onSave,
  saving,
  children,
  maxWidth = "md"
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}) {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="h5">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" mt={.5}>{subtitle}</Typography>}
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2.5 }}>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />Saving…</> : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  label,
  onClose,
  onConfirm,
  busy
}: {
  open: boolean;
  label: string;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", gap: 1.5, alignItems: "center" }}><WarningAmber color="error" />Delete {label}?</DialogTitle>
      <DialogContent><Typography color="text.secondary">This permanently removes the record. This action cannot be undone.</Typography></DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : "Delete"}</Button>
      </DialogActions>
    </Dialog>
  );
}

export const errorMessage = (value: unknown) =>
  value instanceof ApiError || value instanceof Error ? value.message : "Unable to complete the request";

export function PageAlert({ message, onClose }: { message: string; onClose?: () => void }) {
  if (!message) return null;
  return <Alert severity="error" onClose={onClose} sx={{ mb: 2 }}>{message}</Alert>;
}
