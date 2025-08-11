"use client";

import { useMemo, useState } from "react";

type Post = {
  id: string;
  author: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string; // ISO
  replies: Array<{ id: string; author: string; body: string; createdAt: string }>;
};

const SEED: Post[] = [
  {
    id: "p1",
    author: "Asha",
    title: "Best time to try water sports in Goa?",
    body: "Is monsoon okay for jet ski / parasailing or better in winter?",
    tags: ["Goa", "Activities"],
    createdAt: "2025-06-10T09:00:00Z",
    replies: [
      { id: "r1", author: "Rohit", body: "Winter winds are calmer; check vendors on Calangute.", createdAt: "2025-06-11T10:00:00Z" },
    ],
  },
  {
    id: "p2",
    author: "Lina",
    title: "4★ hotels walkable to beach?",
    body: "Looking for options near Candolim/Calangute with breakfast included.",
    tags: ["Hotels", "Goa"],
    createdAt: "2025-05-20T12:00:00Z",
    replies: [],
  },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "tag">("none");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTags, setNewTags] = useState("");

  const filtered = useMemo(() => {
    let arr = posts.filter((p) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    arr = arr.sort((a, b) => (sortBy === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
    if (groupBy === "tag") {
      const tagToPosts: Record<string, Post[]> = {};
      for (const p of arr) {
        for (const t of p.tags) {
          if (!tagToPosts[t]) tagToPosts[t] = [];
          tagToPosts[t].push(p);
        }
      }
      return Object.entries(tagToPosts).map(([tag, list]) => ({ section: tag, list }));
    }
    return [{ section: "All", list: arr }];
  }, [posts, query, sortBy, groupBy]);

  function addPost() {
    if (!newTitle.trim() || !newBody.trim()) return;
    const p: Post = {
      id: Math.random().toString(36).slice(2),
      author: "You",
      title: newTitle.trim(),
      body: newBody.trim(),
      tags: newTags.split(",").map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setPosts([p, ...posts]);
    setNewTitle(""); setNewBody(""); setNewTags("");
  }

  function addReply(postId: string, text: string) {
    setPosts((prev) => prev.map((p) => p.id === postId ? {
      ...p,
      replies: [...p.replies, { id: Math.random().toString(36).slice(2), author: "You", body: text, createdAt: new Date().toISOString() }]
    } : p));
  }

  return (
    <div className="grid gap-6">
      <div className="section flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xl font-semibold text-[var(--brand-blue)]">Community</div>
        <div className="flex gap-2">
          <input className="input w-60" placeholder="Search discussions…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="input w-40" value={groupBy} onChange={(e)=>setGroupBy(e.target.value as any)}>
            <option value="none">Group By: None</option>
            <option value="tag">Group By: Tag</option>
          </select>
          <select className="input w-40" value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)}>
            <option value="newest">Sort By: Newest</option>
            <option value="oldest">Sort By: Oldest</option>
          </select>
        </div>
      </div>

      <div className="section">
        <div className="font-semibold mb-2">Start a discussion</div>
        <div className="grid gap-2">
          <input className="input" placeholder="Question title" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} />
          <textarea className="input" rows={3} placeholder="Add more details" value={newBody} onChange={(e)=>setNewBody(e.target.value)} />
          <input className="input" placeholder="Tags (comma separated)" value={newTags} onChange={(e)=>setNewTags(e.target.value)} />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={addPost}>Post</button>
          </div>
        </div>
      </div>

      {filtered.map(({ section, list }) => (
        <div key={section} className="section">
          <div className="text-lg font-semibold mb-2 text-[var(--brand-blue)]">{section}</div>
          <div className="grid gap-3">
            {list.length === 0 ? (
              <div className="label">No posts yet</div>
            ) : list.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs opacity-70">{new Date(p.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm opacity-90 mt-1">{p.body}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {p.tags.map((t) => <span key={t} className="section px-2 py-1">{t}</span>)}
                </div>

                <div className="mt-3 grid gap-2">
                  {p.replies.map((r) => (
                    <div key={r.id} className="section p-2 text-sm">
                      <div className="opacity-70 text-xs">{r.author} • {new Date(r.createdAt).toLocaleString()}</div>
                      <div>{r.body}</div>
                    </div>
                  ))}
                  <ReplyComposer onSubmit={(text)=>addReply(p.id, text)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReplyComposer({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <input className="input" placeholder="Write a reply…" value={text} onChange={(e)=>setText(e.target.value)} />
      <button className="btn btn-ghost" onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText(""); } }}>Reply</button>
    </div>
  );
} 