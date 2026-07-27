"use client";

import {
  ArrowForward,
  CategoryOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LabelOutlined,
  TrendingUp,
  WarningAmberOutlined
} from "@mui/icons-material";
import { Alert, Box, Button, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/src/api/client";
import { ContentCard, PageHeader } from "@/src/components/Ui";

type Summary = {
  products: number;
  activeProducts: number;
  categories: number;
  brands: number;
  media: number;
  users: number;
  lowStockVariants: number;
};

const cards = [
  { key: "products", label: "Total products", icon: Inventory2Outlined, color: "#536bf0", tint: "#edf0ff" },
  { key: "categories", label: "Categories", icon: CategoryOutlined, color: "#9a55d7", tint: "#f5ecfc" },
  { key: "brands", label: "Brands", icon: LabelOutlined, color: "#d68232", tint: "#fff3e8" },
  { key: "users", label: "Team members", icon: GroupsOutlined, color: "#139578", tint: "#e6f7f2" }
] as const;

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Summary>("/dashboard/summary").then(setData).catch((value) => setError(value instanceof Error ? value.message : "Unable to load dashboard"));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Good to see you" description="Here is what is happening across your catalog today." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2.25}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid key={card.key} size={{ xs: 12, sm: 6, xl: 3 }}>
              <ContentCard sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={650}>{card.label}</Typography>
                    <Typography variant="h4" mt={1}>{data ? data[card.key] : <Skeleton width={60} />}</Typography>
                  </Box>
                  <Box sx={{ width: 46, height: 46, display: "grid", placeItems: "center", borderRadius: 3, bgcolor: card.tint, color: card.color }}><Icon /></Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={.7} mt={2.5}>
                  <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="caption" color="text.secondary">Live from your PostgreSQL database</Typography>
                </Stack>
              </ContentCard>
            </Grid>
          );
        })}
      </Grid>
      <Grid container spacing={2.25} mt={.25}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ContentCard>
            <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="h6">Catalog health</Typography>
              <Typography variant="body2" color="text.secondary">A quick snapshot of product readiness.</Typography>
            </Box>
            <Grid container spacing={0}>
              {[
                { label: "Active products", value: data?.activeProducts, detail: "Ready for customers", color: "#118a67" },
                { label: "Media assets", value: data?.media, detail: "Available to reuse", color: "#465dd8" },
                { label: "Low-stock variants", value: data?.lowStockVariants, detail: "Require attention", color: "#d47b23" }
              ].map((item, index) => (
                <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ p: 3, borderRight: { sm: index < 2 ? "1px solid #e5eaf1" : 0 }, borderBottom: { xs: index < 2 ? "1px solid #e5eaf1" : 0, sm: 0 } }}>
                    <Typography variant="h4" color={item.color}>{data ? item.value : <Skeleton width={48} />}</Typography>
                    <Typography fontWeight={750} mt={1}>{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </ContentCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, height: "100%", borderRadius: 4, color: "white", bgcolor: "#162b4c", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(83,107,240,.28)", right: -60, top: -65 }} />
            <WarningAmberOutlined sx={{ fontSize: 34, color: "#f6c36f" }} />
            <Typography variant="h6" mt={2}>Keep inventory healthy</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)", mt: 1, lineHeight: 1.7 }}>
              {data?.lowStockVariants ?? "—"} active variants currently have five or fewer items in stock.
            </Typography>
            <Button component={Link} href="/products" endIcon={<ArrowForward />} sx={{ mt: 2.5, color: "white", bgcolor: "rgba(255,255,255,.09)" }}>Review products</Button>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
