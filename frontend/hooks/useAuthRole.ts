'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRole(expectedRole: string) {
  const router = useRouter();

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const rol = getCookie("rol");

    if (rol !== expectedRole) {
      router.push("/login");
    }
  }, [expectedRole, router]);
}
