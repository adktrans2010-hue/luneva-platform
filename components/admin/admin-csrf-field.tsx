"use client";

import { useEffect, useState } from "react";

import { ADMIN_CSRF_COOKIE_NAME } from "@/src/lib/admin-security-constants";

export function AdminCsrfField() {
  const [token, setToken] = useState("");

  useEffect(() => {
    const prefix = `${ADMIN_CSRF_COOKIE_NAME}=`;
    const entry = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(entry ? decodeURIComponent(entry.slice(prefix.length)) : "");
  }, []);

  return <input type="hidden" name="_csrf" value={token} />;
}
