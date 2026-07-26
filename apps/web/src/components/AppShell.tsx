import { type PropsWithChildren } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 240;
const links = [
  ["Dashboard", "/", "dashboard:watch"],
  ["Permissions", "/permissions", "permission:watch"],
  ["Roles", "/roles", "role:watch"],
  ["Users", "/users", "user:watch"],
  ["Media", "/media", "media:watch"],
  ["Categories", "/categories", "category:watch"],
  ["Brands", "/brands", "brand:watch"],
  ["Attributes", "/attributes", "attribute:watch"],
  ["Products", "/products", "product:watch"]
];

export function AppShell({ children }: PropsWithChildren) {
  const { session, can, logout } = useAuth();
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f8fb" }}>
      <Drawer variant="permanent" sx={{ width: drawerWidth, "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "#12233f", color: "white" } }}>
        <Toolbar><Typography variant="h6" fontWeight={800}>Trends Bird</Typography></Toolbar>
        <Divider sx={{ borderColor: "rgba(255,255,255,.12)" }} />
        <List sx={{ px: 1 }}>
          {links.filter(([, , permission]) => can(permission)).map(([label, to]) => (
            <ListItemButton key={to} component={NavLink} to={to} sx={{ borderRadius: 1, mb: .5, "&.active": { bgcolor: "primary.main" } }}>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box sx={{ flex: 1, ml: `${drawerWidth}px` }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Toolbar sx={{ gap: 2 }}>
            <Box sx={{ flex: 1 }} />
            <Avatar>{session?.name.charAt(0)}</Avatar>
            <Box>
              <Typography variant="body2" fontWeight={700}>{session?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{session?.role.name}</Typography>
            </Box>
            <Button onClick={() => void logout()}>Log out</Button>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
