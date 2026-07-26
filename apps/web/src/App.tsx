import { CircularProgress, CssBaseline } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { ResourcePage, Status, type ResourceConfig } from "./components/ResourcePage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MediaPage } from "./pages/MediaPage";

const configs: Record<string, ResourceConfig> = {
  permissions: {
    title: "Permissions",
    endpoint: "/permissions",
    permissionPrefix: "permission",
    help: "Capabilities grouped by module and action.",
    columns: [
      { label: "Module", render: (item) => item.name },
      { label: "Description", render: (item) => item.description || "—" },
      { label: "Actions", render: (item) => item.permissions?.map((p: any) => p.action).join(", ") }
    ],
    emptyPayload: { name: "Marketing", description: "Marketing capabilities", actions: ["watch", "read", "create"] },
    editPayload: (item) => ({ name: item.name, description: item.description, actions: item.permissions.map((p: any) => p.action) })
  },
  roles: {
    title: "Roles",
    endpoint: "/roles",
    permissionPrefix: "role",
    help: "Permission IDs are available on the Permissions screen and Swagger response.",
    columns: [
      { label: "Name", render: (item) => item.name },
      { label: "Status", render: (item) => <Status active={item.active} /> },
      { label: "Users", render: (item) => item._count?.users ?? 0 },
      { label: "Permissions", render: (item) => item._count?.permissions ?? item.permissions?.length ?? 0 }
    ],
    emptyPayload: { name: "Content Editor", description: "Maintains catalog copy", active: true, grantAll: false, permissionIds: [] },
    editPayload: (item) => ({ name: item.name, description: item.description, active: item.active, grantAll: false, permissionIds: item.permissions?.map((p: any) => p.permissionId) ?? [] })
  },
  users: {
    title: "Users",
    endpoint: "/users",
    permissionPrefix: "user",
    help: "Create dashboard accounts with an explicit role.",
    columns: [
      { label: "Name", render: (item) => item.name },
      { label: "Email", render: (item) => item.email },
      { label: "Role", render: (item) => item.role?.name },
      { label: "Status", render: (item) => <Status active={item.active} /> }
    ],
    emptyPayload: { name: "", email: "", password: "", phone: "", roleId: "", active: true },
    editPayload: (item) => ({ name: item.name, email: item.email, phone: item.phone ?? "", roleId: item.role.id, active: item.active })
  },
  categories: {
    title: "Categories",
    endpoint: "/categories",
    permissionPrefix: "category",
    help: "Unlimited tree depth with cycle-safe parent assignment.",
    columns: [
      { label: "Name", render: (item) => item.name },
      { label: "Slug", render: (item) => item.slug },
      { label: "Status", render: (item) => <Status active={item.active} /> },
      { label: "Children", render: (item) => item._count?.children ?? item.children?.length ?? 0 }
    ],
    emptyPayload: { name: "", slug: "", description: "", active: true, sortOrder: 0 },
    editPayload: (item) => ({ name: item.name, slug: item.slug, description: item.description ?? "", imageId: item.imageId ?? undefined, parentId: item.parentId ?? undefined, active: item.active, sortOrder: item.sortOrder })
  },
  brands: {
    title: "Brands",
    endpoint: "/brands",
    permissionPrefix: "brand",
    columns: [
      { label: "Name", render: (item) => item.name },
      { label: "Slug", render: (item) => item.slug },
      { label: "Products", render: (item) => item._count?.products ?? 0 },
      { label: "Status", render: (item) => <Status active={item.active} /> }
    ],
    emptyPayload: { name: "", slug: "", description: "", active: true },
    editPayload: (item) => ({ name: item.name, slug: item.slug, logoId: item.logoId ?? undefined, description: item.description ?? "", active: item.active })
  },
  attributes: {
    title: "Attributes",
    endpoint: "/attributes",
    permissionPrefix: "attribute",
    help: "Manage dropdown, radio, checkbox, colour, and image swatch values.",
    columns: [
      { label: "Name", render: (item) => item.name },
      { label: "Type", render: (item) => item.type.replaceAll("_", " ") },
      { label: "Values", render: (item) => item.values?.map((v: any) => v.value).join(", ") || "—" }
    ],
    emptyPayload: { name: "Colour", slug: "colour", type: "COLOR_SWATCH", values: [{ value: "Red", slug: "red", reference: "#EF4444" }] },
    editPayload: (item) => ({ name: item.name, slug: item.slug, type: item.type })
  },
  products: {
    title: "Products",
    endpoint: "/products",
    permissionPrefix: "product",
    help: "Atomic product editor for simple products, variants, categories, and reusable media.",
    columns: [
      { label: "Name", render: (item) => item.name },
      { label: "SKU", render: (item) => item.sku ?? "Variable" },
      { label: "Brand", render: (item) => item.brand?.name ?? "—" },
      { label: "Price", render: (item) => item.priceRange ? `${item.priceRange.min ?? "—"}${item.priceRange.min !== item.priceRange.max ? ` – ${item.priceRange.max}` : ""}` : item.price },
      { label: "Stock", render: (item) => item.totalStock ?? item.stock ?? 0 },
      { label: "Status", render: (item) => <Status active={item.active} /> }
    ],
    emptyPayload: {
      name: "", slug: "", sku: "", shortDescription: "", longDescription: "",
      hasVariants: false, price: 0, stock: 0, weight: 0, active: true,
      featured: false, sortOrder: 0, categoryIds: [], media: [], variants: []
    },
    editPayload: (item) => ({
      name: item.name, slug: item.slug, sku: item.sku ?? undefined,
      shortDescription: item.shortDescription ?? "", longDescription: item.longDescription ?? "",
      hasVariants: item.hasVariants, price: item.price ? Number(item.price) : undefined,
      salePrice: item.salePrice ? Number(item.salePrice) : undefined, stock: item.stock ?? undefined,
      weight: item.weight ? Number(item.weight) : undefined, active: item.active,
      featured: item.featured, sortOrder: item.sortOrder, brandId: item.brandId ?? undefined,
      categoryIds: item.categories?.map((c: any) => c.categoryId) ?? [],
      media: item.media?.map((m: any) => ({ mediaId: m.mediaId, isThumbnail: m.isThumbnail, isGallery: m.isGallery, sortOrder: m.sortOrder })) ?? [],
      variants: item.variants?.map((v: any) => ({
        sku: v.sku, price: Number(v.price), salePrice: v.salePrice ? Number(v.salePrice) : undefined,
        stock: v.stock, lowStockThreshold: v.lowStockThreshold, weight: v.weight ? Number(v.weight) : undefined,
        active: v.active, attributeValueIds: v.values.map((x: any) => x.attributeValueId),
        media: v.media.map((m: any) => ({ mediaId: m.mediaId, isThumbnail: m.isThumbnail, sortOrder: m.sortOrder }))
      })) ?? []
    })
  }
};

export default function App() {
  const { session, loading } = useAuth();
  if (loading) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /></main>;
  if (!session) return <><CssBaseline /><LoginPage /></>;
  return <><CssBaseline /><AppShell>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      {Object.entries(configs).map(([path, config]) => <Route key={path} path={`/${path}`} element={<ResourcePage config={config} />} />)}
      <Route path="/media" element={<MediaPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AppShell></>;
}
