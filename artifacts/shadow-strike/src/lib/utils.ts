import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthHeaders(token?: string | null) {
  const t = token || localStorage.getItem("shadowstrike_token");
  if (!t) return {};
  return {
    headers: {
      Authorization: `Bearer ${t}`,
    },
  };
}
