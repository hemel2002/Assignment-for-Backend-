"use client";

import { Add, Close, Inventory2Outlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
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
import { ConfirmDialog, ContentCard, EmptyRow, FormDialog, LoadingRows, PageAlert, PageHeader, RowActions, StatusChip, TableToolbar, errorMessage } from "@/src/components/Ui";

type Option = { id: string; name: string };
type Category = Option & { children?: Category[] };
type Attribute = { id: string; name: string; values: { id: string; value: string }[] };
type Variant = { sku: string; price: number; salePrice?: number; stock: number; lowStockThreshold: number; weight?: number; active: boolean; attributeValueIds: string[]; media: any[] };
type Product = {
  id: string; name: string; slug: string; sku?: string; shortDescription?: string; longDescription?: string; hasVariants: boolean;
  price?: number | string; salePrice?: number | string; stock?: number; weight?: number | string; active: boolean; featured: boolean; sortOrder: number; brandId?: string;
  brand?: Option; categories?: { categoryId: string }[]; media?: any[]; variants?: any[]; priceRange: { min: number | null; max: number | null }; totalStock: number;
};
type ProductForm = {
  name: string; slug: string; sku: string; shortDescription: string; longDescription: string; hasVariants: boolean; price: number; salePrice: string;
  stock: number; weight: string; active: boolean; featured: boolean; sortOrder: number; brandId: string; categoryIds: string[]; media: any[]; variants: Variant[];
};
const empty: ProductForm = { name: "", slug: "", sku: "", shortDescription: "", longDescription: "", hasVariants: false, price: 0, salePrice: "", stock: 0, weight: "", active: true, featured: false, sortOrder: 0, brandId: "", categoryIds: [], media: [], variants: [] };
const emptyVariant = (): Variant => ({ sku: "", price: 0, stock: 0, lowStockThreshold: 5, active: true, attributeValueIds: [], media: [] });
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const flattenCategories = (nodes: Category[]): Category[] => nodes.flatMap((node) => [node, ...flattenCategories(node.children ?? [])]);

export default function ProductsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [products, brandResult, categoryResult, attributeResult] = await Promise.all([
        api<{ items: Product[] }>(`/products?limit=100&search=${encodeURIComponent(query)}`),
        api<{ items: Option[] }>("/brands?limit=100"),
        api<Category[]>("/categories"),
        api<{ items: Attribute[] }>("/attributes?limit=100")
      ]);
      setItems(products.items); setBrands(brandResult.items); setCategories(flattenCategories(categoryResult)); setAttributes(attributeResult.items);
    } catch (value) { setError(errorMessage(value)); } finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);

  const openEdit = async (item: Product) => {
    setBusy(true);
    try {
      const detail = await api<Product>(`/products/${item.id}`);
      setForm({
        name: detail.name, slug: detail.slug, sku: detail.sku ?? "", shortDescription: detail.shortDescription ?? "", longDescription: detail.longDescription ?? "",
        hasVariants: detail.hasVariants, price: Number(detail.price ?? 0), salePrice: detail.salePrice == null ? "" : String(detail.salePrice), stock: detail.stock ?? 0,
        weight: detail.weight == null ? "" : String(detail.weight), active: detail.active, featured: detail.featured, sortOrder: detail.sortOrder, brandId: detail.brandId ?? "",
        categoryIds: detail.categories?.map((item) => item.categoryId) ?? [],
        media: detail.media?.map((item) => ({ mediaId: item.mediaId, isThumbnail: item.isThumbnail, isGallery: item.isGallery, sortOrder: item.sortOrder })) ?? [],
        variants: detail.variants?.map((variant) => ({
          sku: variant.sku, price: Number(variant.price), salePrice: variant.salePrice == null ? undefined : Number(variant.salePrice), stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold, weight: variant.weight == null ? undefined : Number(variant.weight), active: variant.active,
          attributeValueIds: variant.values.map((value: any) => value.attributeValueId),
          media: variant.media.map((media: any) => ({ mediaId: media.mediaId, isThumbnail: media.isThumbnail, sortOrder: media.sortOrder }))
        })) ?? []
      });
      setEditing(item);
    } catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };

  const updateVariant = (index: number, patch: Partial<Variant>) => setForm((current) => ({ ...current, variants: current.variants.map((variant, i) => i === index ? { ...variant, ...patch } : variant) }));
  const save = async () => {
    if (!form.name || !form.slug || (!form.hasVariants && !form.sku) || (form.hasVariants && !form.variants.length)) return setError("Complete the product name, slug, SKU, and variant requirements.");
    setBusy(true);
    try {
      const body = {
        name: form.name, slug: form.slug, ...(form.hasVariants ? {} : { sku: form.sku }), shortDescription: form.shortDescription || undefined, longDescription: form.longDescription || undefined,
        hasVariants: form.hasVariants, ...(form.hasVariants ? {} : { price: form.price, ...(form.salePrice !== "" ? { salePrice: Number(form.salePrice) } : {}), stock: form.stock }),
        ...(form.weight !== "" ? { weight: Number(form.weight) } : {}), active: form.active, featured: form.featured, sortOrder: form.sortOrder,
        ...(form.brandId ? { brandId: form.brandId } : {}), categoryIds: form.categoryIds, media: form.media, variants: form.hasVariants ? form.variants.map((variant) => ({
          ...variant, ...(variant.salePrice == null ? { salePrice: undefined } : {}), ...(variant.weight == null ? { weight: undefined } : {})
        })) : []
      };
      await api(editing?.id ? `/products/${editing.id}` : "/products", { method: editing?.id ? "PATCH" : "POST", body: JSON.stringify(body) });
      setEditing(undefined); await load();
    } catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await api(`/products/${deleting.id}`, { method: "DELETE" }); setDeleting(null); await load(); }
    catch (value) { setError(errorMessage(value)); } finally { setBusy(false); }
  };

  return <>
    <PageHeader eyebrow="Catalog" title="Products" description="Manage simple products, variants, inventory, prices, and catalog placement." action={() => { setForm(empty); setEditing(null); }} actionLabel="New product" actionPermission={can("product:create")} />
    <PageAlert message={error} onClose={() => setError("")} />
    <ContentCard>
      <TableToolbar value={search} onChange={setSearch} onSubmit={() => setQuery(search)} placeholder="Search products or SKUs…" />
      <TableContainer><Table><TableHead><TableRow><TableCell>Product</TableCell><TableCell>SKU / type</TableCell><TableCell>Brand</TableCell><TableCell>Price</TableCell><TableCell>Stock</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>
        {loading && <LoadingRows columns={7} />}
        {!loading && !items.length && <EmptyRow columns={7} />}
        {!loading && items.map((item) => <TableRow key={item.id} hover>
          <TableCell><Stack direction="row" gap={1.5} alignItems="center"><Avatar variant="rounded" sx={{ bgcolor: "#edf0ff", color: "primary.main" }}><Inventory2Outlined /></Avatar><div><Typography fontWeight={780}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.slug}</Typography></div></Stack></TableCell>
          <TableCell><Typography variant="body2" fontWeight={650}>{item.hasVariants ? "Variable product" : item.sku}</Typography></TableCell><TableCell>{item.brand?.name ?? "—"}</TableCell>
          <TableCell>{item.priceRange?.min == null ? "—" : item.priceRange.min === item.priceRange.max ? `$${item.priceRange.min.toFixed(2)}` : `$${item.priceRange.min.toFixed(2)} – $${item.priceRange.max?.toFixed(2)}`}</TableCell>
          <TableCell><Chip size="small" label={`${item.totalStock ?? 0} units`} color={(item.totalStock ?? 0) <= 5 ? "warning" : "default"} /></TableCell><TableCell><StatusChip active={item.active} /></TableCell>
          <TableCell align="right"><RowActions onEdit={() => void openEdit(item)} onDelete={() => setDeleting(item)} edit={can("product:update")} remove={can("product:delete")} /></TableCell>
        </TableRow>)}
      </TableBody></Table></TableContainer>
    </ContentCard>
    <FormDialog open={editing !== undefined} title={editing?.id ? "Edit product" : "Create product"} subtitle="Use a simple product for one SKU or enable variants for option combinations." onClose={() => setEditing(undefined)} onSave={() => void save()} saving={busy} maxWidth="lg">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}><TextField fullWidth required label="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, ...(!editing?.id ? { slug: slugify(event.target.value) } : {}) })} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth required label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><FormControl fullWidth><InputLabel>Brand</InputLabel><Select label="Brand" value={form.brandId} onChange={(event) => setForm({ ...form, brandId: event.target.value })}><MenuItem value="">No brand</MenuItem>{brands.map((brand) => <MenuItem key={brand.id} value={brand.id}>{brand.name}</MenuItem>)}</Select></FormControl></Grid>
        <Grid size={{ xs: 12 }}><FormControl fullWidth><InputLabel>Categories</InputLabel><Select multiple label="Categories" value={form.categoryIds} onChange={(event) => setForm({ ...form, categoryIds: event.target.value as string[] })} renderValue={(selected) => categories.filter((item) => selected.includes(item.id)).map((item) => item.name).join(", ")}>{categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</Select></FormControl></Grid>
        <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth multiline minRows={2} label="Short description" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth multiline minRows={2} label="Long description" value={form.longDescription} onChange={(event) => setForm({ ...form, longDescription: event.target.value })} /></Grid>
      </Grid>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} mt={2}><FormControlLabel control={<Switch checked={form.hasVariants} onChange={(event) => setForm({ ...form, hasVariants: event.target.checked, variants: event.target.checked && !form.variants.length ? [emptyVariant()] : form.variants })} />} label="This product has variants" /><FormControlLabel control={<Switch checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />} label="Active" /><FormControlLabel control={<Switch checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />} label="Featured" /></Stack>
      {!form.hasVariants ? <Grid container spacing={2} mt={.5}><Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth required label="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></Grid><Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth type="number" label="Price" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></Grid><Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth type="number" label="Sale price" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} /></Grid><Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth type="number" label="Stock" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} /></Grid><Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="number" label="Weight" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} /></Grid></Grid> :
        <Box mt={2.5}><Stack direction="row" alignItems="center" mb={1}><Typography fontWeight={800} sx={{ flex: 1 }}>Variants</Typography><Button startIcon={<Add />} onClick={() => setForm({ ...form, variants: [...form.variants, emptyVariant()] })}>Add variant</Button></Stack>
          <Stack spacing={1.25}>{form.variants.map((variant, index) => <Grid key={index} container spacing={1.25} sx={{ p: 1.5, bgcolor: "#f7f8fa", borderRadius: 2.5, alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 2 }}><TextField fullWidth label="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} /></Grid><Grid size={{ xs: 6, md: 1.5 }}><TextField fullWidth type="number" label="Price" value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} /></Grid><Grid size={{ xs: 6, md: 1.5 }}><TextField fullWidth type="number" label="Stock" value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} /></Grid>
            <Grid size={{ xs: 11, md: 6 }}><FormControl fullWidth><InputLabel>Attribute values</InputLabel><Select multiple label="Attribute values" value={variant.attributeValueIds} onChange={(event) => updateVariant(index, { attributeValueIds: event.target.value as string[] })} renderValue={(selected) => attributes.flatMap((attribute) => attribute.values.map((value) => ({ ...value, attribute: attribute.name }))).filter((value) => selected.includes(value.id)).map((value) => `${value.attribute}: ${value.value}`).join(", ")}>{attributes.flatMap((attribute) => attribute.values.map((value) => <MenuItem key={value.id} value={value.id}>{attribute.name}: {value.value}</MenuItem>))}</Select></FormControl></Grid>
            <Grid size={{ xs: 1, md: 1 }}><IconButton color="error" onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) })}><Close /></IconButton></Grid>
          </Grid>)}</Stack>
        </Box>}
    </FormDialog>
    <ConfirmDialog open={!!deleting} label={deleting?.name ?? "product"} onClose={() => setDeleting(null)} onConfirm={() => void remove()} busy={busy} />
  </>;
}
