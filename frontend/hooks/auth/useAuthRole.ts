'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRole(expectedRole: number) {
  const router = useRouter();

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const rolCookie = getCookie("rol");
    const rol = rolCookie !== null ? Number(rolCookie) : null;

    if (rol !== expectedRole) {
      router.replace("/login")
    }
  }, [expectedRole, router]);
}
