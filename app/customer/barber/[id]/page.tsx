"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchBarberProfile, type BarberProfileData } from "@/lib/api";
import { BarberAvatar, GoldButton } from "@/components/UI";
import { PostLightbox } from "@/components/PostLightbox";
import type { Post } from "@/lib/types";

export default function BarberProfileViewPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [data, setData] = useState<BarberProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchBarberProfile(supabase, params.id).then((d) => {
      setData(d);
      setLoading(false);
      const postId = searchParams.get("post");
      if (postId && d) {
        const match = d.posts.find((p) => p.id === postId);
        if (match) setOpenPost(match);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function bookThisBarber() {
    sessionStorage.setItem("fh_book_barber", params.id);
    router.push("/customer/book");
  }

  if (loading) {
    return <div className="px-5 py-10 text-center text-xs text-faint">Loading…</div>;
  }

  if (!data) {
    return (
      <div className="px-5 py-10 text-center text-xs text-faint">
        Couldn't find that barber.
        <div className="mt-3">
          <GoldButton onClick={() => router.push("/customer/home")}>Back to Home</GoldButton>
        </div>
      </div>
    );
  }

  const { profile, services, posts } = data;

  return (
    <div className="px-5 pb-7">
      <div onClick={() => router.back()} className="mb-4 flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold text-muted">
        ← Back
      </div>

      <div className="mb-3 flex items-center gap-3.5 rounded-2xl border border-line/[0.07] bg-card p-4">
        <BarberAvatar initials={profile.initials} size={60} rounded={14} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold">{profile.name}</div>
          <div className="text-[12px] text-muted">{profile.location}</div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-extrabold text-gold">★ {profile.rating}</div>
          <div className="text-[10.5px] text-faint">{profile.cuts_done} cuts</div>
        </div>
      </div>

      {profile.bio && (
        <div className="mb-5 rounded-2xl border border-line/[0.07] bg-card p-3.5 text-[12.5px] leading-snug text-secondary">{profile.bio}</div>
      )}

      <div className="mb-5">
        <GoldButton onClick={bookThisBarber}>Book with {profile.name.split(" ")[0]} →</GoldButton>
      </div>

      <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">SERVICES & RATES</div>
      <div className="mb-5 flex flex-col gap-1.5">
        {services.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-[11px] border border-line/[0.07] bg-card p-[10px_14px]">
            <div className="text-[13px] font-bold">{s.name}</div>
            <div className="text-[13px] font-extrabold text-gold">${s.price}</div>
          </div>
        ))}
        {services.length === 0 && <div className="text-[12px] text-faint">No services listed yet.</div>}
      </div>

      <div className="mb-2.5 font-headline text-sm tracking-wide">MY WORK</div>
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {posts.map((p) => (
            <div
              key={p.id}
              onClick={() => setOpenPost(p)}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-inputbg"
            >
              {p.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.media_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <video src={p.media_url} className="h-full w-full object-cover" muted />
              )}
              {p.type === "video" && (
                <div className="pointer-events-none absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-[12.5px] text-faint">No posts yet — check back soon.</div>
      )}

      {openPost && (
        <PostLightbox
          post={openPost}
          barberName={profile.name}
          onClose={() => setOpenPost(null)}
          onDeleted={() => setData((d) => (d ? { ...d, posts: d.posts.filter((p) => p.id !== openPost.id) } : d))}
        />
      )}
    </div>
  );
}
