"use client";

import { useEffect } from "react";
import { subsiteNotFoundPath } from "@/lib/paths";

export function SubsiteNotFoundRedirect() {
  useEffect(() => {
    const path = subsiteNotFoundPath(window.location.pathname);
    if (path) window.location.replace(path);
  }, []);

  return null;
}
