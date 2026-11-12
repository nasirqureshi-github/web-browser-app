const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    cache: "no-store"
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Request failed");
  return json;
}

export type Person = { personId: string; name: string };
export type Site = { address: string; title: string; html: string; authorId: string; authorName: string };
export type Visit = { _id: string; personId: string; address: string; title: string; visitedAt: string; source: string };
export type SearchResult = { address: string; title: string; authorName: string; snippet: string };

export const api = {
  people: () => request<{data:Person[]}>("/people"),
  site: (address: string) => request<{data:Site}>(`/sites/${encodeURIComponent(address)}`),
  publish: (body: {address:string;title:string;html:string;authorId:string}) =>
    request<{data:Site}>("/sites", { method:"POST", body:JSON.stringify(body) }),
  search: (q:string) => request<{data:SearchResult[]}>(`/search?q=${encodeURIComponent(q)}`),
  visits: (personId:string) => request<{data:Visit[]}>(`/visits/${encodeURIComponent(personId)}`),
  recordVisit: (body:{personId:string;address:string;source:string}) =>
    request<{data:Visit;found:boolean}>("/visits", {method:"POST",body:JSON.stringify(body)})
};
