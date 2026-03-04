import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 解码 HTML 实体（服务端安全：不依赖 document）
 */
function decodeEntities(str) {
  if (typeof str !== 'string') return '';
  if (typeof document === 'undefined') {
    return str.replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)))
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * 去除 HTML 标签、URL 链接、网页信息，并解码实体
 * 避免卡片显示原始 HTML、链接等干扰阅读的内容
 * @param {string} str
 * @returns {string}
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  let s = str;
  s = s.replace(/<[^>]*>/g, '');
  s = decodeEntities(s);
  s = s.replace(/https?:\/\/[^\s<>"')\]]+/g, '');
  s = s.replace(/\b(?:href|src)\s*=\s*["']?[^\s"'<>]*/gi, '');
  s = s.replace(/\b(?:System card|system card|系统卡片)\s*:?\s*/gi, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}
