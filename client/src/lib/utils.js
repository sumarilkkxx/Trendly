import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { sanitizeText as sanitizeTextShared } from "@server/lib/textUtils.js";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** 与 server/lib/textUtils.js 共用实现 */
export const sanitizeText = sanitizeTextShared;
