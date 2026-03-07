import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { sanitizeText as sanitizeTextShared } from "@server/lib/textUtils.js";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** 与 server/lib/textUtils.js 共用实现 */
export const sanitizeText = sanitizeTextShared;

const TIME_UNITS = [
  { max: 60, divisor: 1, unit: '秒' },
  { max: 3600, divisor: 60, unit: '分钟' },
  { max: 86400, divisor: 3600, unit: '小时' },
  { max: 604800, divisor: 86400, unit: '天' },
  { max: 2592000, divisor: 604800, unit: '周' },
  { max: 31536000, divisor: 2592000, unit: '个月' },
  { max: Infinity, divisor: 31536000, unit: '年' },
];

function parseAsUTC(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (/Z|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  return new Date(s.replace(' ', 'T') + 'Z');
}

export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const d = parseAsUTC(dateStr);
  if (!d || isNaN(d)) return '';
  const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diff < 10) return '刚刚';
  for (const { max, divisor, unit } of TIME_UNITS) {
    if (diff < max) return `${Math.floor(diff / divisor)} ${unit}前`;
  }
  return '';
}

export function formatAbsoluteTime(dateStr) {
  if (!dateStr) return '';
  const d = parseAsUTC(dateStr);
  if (!d || isNaN(d)) return '';
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `今天 ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${time}`;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (d.getFullYear() === now.getFullYear()) return `${month}月${day}日 ${time}`;
  return `${d.getFullYear()}/${month}/${day} ${time}`;
}
