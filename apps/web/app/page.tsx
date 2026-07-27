"use client";

import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/auth/AuthContext";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(session ? "/dashboard" : "/login");
  }, [loading, router, session]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <CircularProgress size={32} />
    </main>
  );
}
