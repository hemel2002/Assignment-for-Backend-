"use client";

import {
  AdminPanelSettingsOutlined,
  CategoryOutlined,
  DashboardOutlined,
  ExpandMore,
  GroupsOutlined,
  ImageOutlined,
  Inventory2Outlined,
  LabelOutlined,
  LogoutOutlined,
  Menu,
  NotificationsNoneOutlined,
  PaletteOutlined,
  Search,
  ShieldOutlined
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu as MuiMenu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/auth/AuthContext";

const drawerWidth = 256;
const navigation = [
  { label: "Overview", path: "/dashboard", permission: "dashboard:watch", icon: DashboardOutlined },
  { label: "Users", path: "/users", permission: "user:watch", icon: GroupsOutlined },
  { label: "Roles", path: "/roles", permission: "role:watch", icon: AdminPanelSettingsOutlined },
  { label: "Permissions", path: "/permissions", permission: "permission:watch", icon: ShieldOutlined },
  { label: "Products", path: "/products", permission: "product:watch", icon: Inventory2Outlined },
  { label: "Categories", path: "/categories", permission: "category:watch", icon: CategoryOutlined },
  { label: "Brands", path: "/brands", permission: "brand:watch", icon: LabelOutlined },
  { label: "Attributes", path: "/attributes", permission: "attribute:watch", icon: PaletteOutlined },
  { label: "Media library", path: "/media", permission: "media:watch", icon: ImageOutlined }
];

function SideNavigation({ close }: { close?: () => void }) {
  const pathname = usePathname();
  const { can } = useAuth();
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#0f1f38", color: "white" }}>
      <Box sx={{ height: 78, px: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: "#536bf0", fontWeight: 900 }}>TB</Box>
        <Box>
          <Typography fontWeight={850} lineHeight={1.1}>Trends Bird</Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,.55)" }}>Commerce admin</Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,.08)" }} />
      <Typography variant="caption" sx={{ px: 2.5, pt: 3, pb: 1, color: "rgba(255,255,255,.43)", letterSpacing: ".12em", fontWeight: 800 }}>
        WORKSPACE
      </Typography>
      <List sx={{ px: 1.25 }}>
        {navigation.filter((item) => can(item.permission)).map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              href={item.path}
              onClick={close}
              selected={active}
              sx={{
                minHeight: 46,
                borderRadius: 2.5,
                mb: .5,
                color: active ? "white" : "rgba(255,255,255,.68)",
                "&.Mui-selected": { bgcolor: "#465dd8", "&:hover": { bgcolor: "#465dd8" } },
                "&:hover": { bgcolor: "rgba(255,255,255,.07)", color: "white" }
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: "inherit" }}><Icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 750 : 550 }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ mt: "auto", p: 2 }}>
        <Box sx={{ borderRadius: 3, p: 2, bgcolor: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.08)" }}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,.5)" }}>System status</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: .5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#38d39f", boxShadow: "0 0 0 4px rgba(56,211,159,.12)" }} />
            <Typography variant="body2" fontWeight={650}>API operational</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, router, session]);

  if (loading || !session) {
    return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress size={34} /></Box>;
  }

  const signOut = async () => {
    setAnchor(null);
    await logout();
    router.replace("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {desktop ? (
        <Drawer variant="permanent" sx={{ width: drawerWidth, "& .MuiDrawer-paper": { width: drawerWidth, border: 0 } }}>
          <SideNavigation />
        </Drawer>
      ) : (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ "& .MuiDrawer-paper": { width: drawerWidth, border: 0 } }}>
          <SideNavigation close={() => setDrawerOpen(false)} />
        </Drawer>
      )}
      <Box sx={{ ml: desktop ? `${drawerWidth}px` : 0, minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(255,255,255,.88)", backdropFilter: "blur(16px)" }}>
          <Toolbar sx={{ minHeight: "72px !important", gap: 1.25, px: { xs: 2, md: 3 } }}>
            {!desktop && <IconButton onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Menu /></IconButton>}
            <TextField
              placeholder="Search workspace"
              sx={{ display: { xs: "none", sm: "block" }, width: 320, "& .MuiOutlinedInput-root": { bgcolor: "#f7f8fb" } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
            />
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Notifications"><IconButton><NotificationsNoneOutlined /></IconButton></Tooltip>
            <Divider orientation="vertical" flexItem sx={{ my: 2 }} />
            <Button
              color="inherit"
              onClick={(event) => setAnchor(event.currentTarget)}
              startIcon={<Avatar sx={{ width: 34, height: 34, bgcolor: "#e9ecff", color: "primary.main", fontWeight: 800 }}>{session.name.charAt(0).toUpperCase()}</Avatar>}
              endIcon={<ExpandMore />}
              sx={{ px: 1, "& .MuiButton-startIcon": { mr: 1 } }}
            >
              <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
                <Typography variant="body2" fontWeight={800} lineHeight={1.1}>{session.name}</Typography>
                <Typography variant="caption" color="text.secondary">{session.role.name}</Typography>
              </Box>
            </Button>
            <MuiMenu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
              <MenuItem onClick={() => void signOut()}><LogoutOutlined fontSize="small" sx={{ mr: 1.5 }} />Log out</MenuItem>
            </MuiMenu>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, sm: 2.5, md: 3.5 }, maxWidth: 1600, mx: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
