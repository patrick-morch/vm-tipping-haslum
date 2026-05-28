"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function Beskytt({ children }: { children: ReactNode }) {
  const { user, laster, konfigurert } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!laster && konfigurert && !user) {
      router.replace("/logg-inn");
    }
  }, [laster, user, konfigurert, router]);

  if (!konfigurert) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Firebase mangler</h1>
          <p className="text-muted text-sm">
            Kopier <code className="text-primary">.env.local.example</code> til{" "}
            <code className="text-primary">.env.local</code> og fyll inn
            Firebase-nøklene dine. Se{" "}
            <code className="text-primary">README.md</code>.
          </p>
        </div>
      </div>
    );
  }

  if (laster) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm">Laster…</div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
