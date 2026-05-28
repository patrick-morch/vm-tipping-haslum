"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Hjem() {
  const { user, laster, konfigurert } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (laster) return;
    if (!konfigurert || !user) router.replace("/logg-inn");
    else router.replace("/kamper");
  }, [user, laster, konfigurert, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted text-sm">Laster…</div>
    </div>
  );
}
