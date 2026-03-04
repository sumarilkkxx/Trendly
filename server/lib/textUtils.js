/**
 * 纯文本工具（与 client/src/lib/utils.js 的 sanitizeText 逻辑一致）
 * 服务端与测试共用，避免依赖 DOM
 */

function decodeEntities(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * 去除 HTML 标签、URL 链接、网页信息，并解码实体
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
