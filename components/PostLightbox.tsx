"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { addComment, deletePost, fetchPostStats, setCommentHidden, toggleLike } from "@/lib/api";
import type { Post, PostComment } from "@/lib/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function PostLightbox({
  post,
  barberName,
  onClose,
  onDeleted,
}: {
  post: Post;
  barberName: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const supabase = createClient();
  const { profile, ensureGuestProfile } = useApp();
  const isOwner = profile?.id === post.barber_id;

  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  const load = async () => {
    const stats = await fetchPostStats(supabase, post.id, profile?.id ?? null);
    setLikeCount(stats.likeCount);
    setLikedByMe(stats.likedByMe);
    setComments(stats.comments);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleLike() {
    setBusy(true);
    try {
      const me = await ensureGuestProfile();
      const nextLiked = !likedByMe;
      setLikedByMe(nextLiked);
      setLikeCount((c) => c + (nextLiked ? 1 : -1));
      await toggleLike(supabase, post.id, me.id, likedByMe);
    } finally {
      setBusy(false);
    }
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const me = await ensureGuestProfile();
      await addComment(supabase, post.id, me.id, commentText);
      setCommentText("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleHide(c: PostComment) {
    await setCommentHidden(supabase, c.id, !c.hidden);
    setComments((cs) => cs.map((x) => (x.id === c.id ? { ...x, hidden: !x.hidden } : x)));
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setBusy(true);
    try {
      await deletePost(supabase, post);
      onDeleted?.();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/customer/barber/${post.barber_id}?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${barberName} on Fade Kings`, url });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]" onClick={onClose}>
      <div className="flex shrink-0 items-center justify-between px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        <div className="text-[13px] font-bold text-primary">{barberName}</div>
        <div onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-lg text-primary">
          ✕
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-center bg-black px-2">
          {post.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.media_url} alt="" className="max-h-[60vh] w-full object-contain" />
          ) : (
            <video src={post.media_url} className="max-h-[60vh] w-full object-contain" controls autoPlay playsInline />
          )}
        </div>

        <div className="mx-auto w-full max-w-[480px] px-4 pb-6 pt-4">
          <div className="mb-3 flex items-center gap-4">
            <div
              onClick={handleLike}
              className="flex cursor-pointer items-center gap-1.5 text-[13px] font-bold"
              style={{ color: likedByMe ? "#D4AF37" : "#f5f5f0" }}
            >
              <span style={{ fontSize: 18 }}>{likedByMe ? "♥" : "♡"}</span>
              {likeCount}
            </div>
            <div onClick={handleShare} className="flex cursor-pointer items-center gap-1.5 text-[13px] font-bold text-primary">
              <span style={{ fontSize: 16 }}>↗</span>
              {shared ? "Link copied!" : "Share"}
            </div>
            {isOwner && (
              <div onClick={handleDelete} className="ml-auto cursor-pointer text-[12px] font-bold text-error">
                Delete post
              </div>
            )}
          </div>

          <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">
            {loading ? "Loading comments…" : `${comments.filter((c) => !c.hidden || isOwner).length} comment${comments.length === 1 ? "" : "s"}`}
          </div>
          <div className="mb-3.5 flex flex-col gap-2.5">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5" style={{ opacity: c.hidden ? 0.4 : 1 }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold text-gold">
                  {c.author?.initials ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] leading-snug">
                    <span className="font-bold">{c.author?.name ?? "Guest"}</span>{" "}
                    <span className="text-secondary">{c.text}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2.5 text-[10.5px] text-faint">
                    {timeAgo(c.created_at)}
                    {c.hidden && <span className="text-error">hidden</span>}
                    {isOwner && (
                      <span onClick={() => handleHide(c)} className="cursor-pointer text-gold">
                        {c.hidden ? "Unhide" : "Hide"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && comments.length === 0 && <div className="text-[12px] text-faint">No comments yet.</div>}
          </div>

          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-inputbg px-3.5 py-[11px] text-[13px] outline-none placeholder:text-[#5a5a55]"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder="Add a comment…"
            />
            <div
              onClick={handleComment}
              className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gold px-4 text-[13px] font-extrabold text-bg"
              style={{ opacity: busy ? 0.6 : 1 }}
            >
              Post
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
