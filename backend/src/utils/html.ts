import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "h1","h2","h3","h4","p","br","hr","strong","b","em","i","u","s",
  "ul","ol","li","blockquote","pre","code","a","div","span","section",
  "article","header","footer","main","nav","table","thead","tbody","tr","th","td"
];

export function cleanHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title"],
      "*": ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        // Internal .zz addresses remain clickable; unsafe protocols are stripped by sanitize-html.
        return { tagName, attribs: { ...attribs, href, rel: "noopener noreferrer" } };
      }
    }
  });
}

export function toPlainText(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ").trim();
}

export function normalizeAddress(raw: string) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
