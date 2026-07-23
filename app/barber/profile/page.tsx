"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { GhostButton } from "@/components/UI";
import type { BarberService, Post } from "@/lib/types";

export default function BarberProfilePage() {
  const supabase = createClient();
  const { profile, logout } = useApp();

  const [services, setServices] = useState<BarberService[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: svcs }, { data: p }] = await Promise.all([
      supabase.from("barber_services").select("*").eq("barber_id", profile.id).order("created_at"),
      supabase.from("posts").select("*").eq("barber_id", profile.id).order("created_at", { ascending: false }),
    ]);
    setServices((svcs as BarberService[]) ?? []);
    setPosts((p as Post[]) ?? []);
  }, [profile, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function addService() {
    if (!profile) return;
    const price = parseFloat(svcPrice);
    if (!svcName.trim() || !price) return;
    await supabase.from("barber_services").insert({ barber_id: profile.id, name: svcName.trim(), price });
    setSvcName("");
    setSvcPrice("");
    load();
  }
  async function removeService(id: string) {
    if (services.length <= 1) return;
    await supabase.from("barber_services").delete().eq("id", id);
    load();
  }

  async function handleUpload(file: File, type: "image" | "video") {
    if (!profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("posts").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("posts").getPublicUrl(path);
      await supabase.from("posts").insert({ barber_id: profile.id, media_url: data.publicUrl, type });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  const completedCount = profile?.cuts_done ?? 0;

  return (
    <div>
      <div className="mb-[18px] font-headline text-[19px]">PROFILE</div>

      <div className="mb-3 flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-card p-4">
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-gold/40 font-headline text-base text-gold"
          style={{ background: "linear-gradient(135deg,#2a2a2a,#151515)" }}
        >
          {profile?.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">{profile?.name}</div>
          <div className="text-[11.5px] text-muted">{profile?.location}</div>
        </div>
      </div>

      {profile?.bio && (
        <div className="mb-4 rounded-2xl border border-white/[0.07] bg-card p-3.5 text-[12.5px] leading-snug text-secondary">{profile.bio}</div>
      )}

      <div className="mb-5 flex justify-between gap-2 rounded-2xl border border-white/[0.07] bg-card p-[14px_4px]">
        <div className="flex-1 text-center">
          <div className="font-headline text-base text-gold">{posts.length}</div>
          <div className="text-[10px] text-muted">Posts</div>
        </div>
        <div className="flex-1 border-x border-white/[0.07] text-center">
          <div className="font-headline text-base text-gold">{completedCount}</div>
          <div className="text-[10px] text-muted">Cuts Done</div>
        </div>
        <div className="flex-1 text-center">
          <div className="font-headline text-base text-gold">{profile?.rating}★</div>
          <div className="text-[10px] text-muted">Rating</div>
        </div>
      </div>

      <div className="mb-2.5 font-headline text-sm tracking-wide">SERVICES & RATES</div>
      <div className="mb-2.5 flex flex-col gap-1.5">
        {services.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-[11px] border border-white/[0.07] bg-card p-[10px_14px]">
            <div className="flex-1 text-[13px] font-bold">{s.name}</div>
            <div className="text-[13px] font-extrabold text-gold">${s.price}</div>
            <div onClick={() => removeService(s.id)} className="cursor-pointer px-0.5 text-[13px] text-muted">✕</div>
          </div>
        ))}
      </div>
      <div className="mb-[22px] flex gap-2">
        <input
          className="min-w-0 flex-[1.4] box-border rounded-[10px] border border-white/10 bg-card px-3 py-[11px] text-[13px] outline-none"
          value={svcName}
          onChange={(e) => setSvcName(e.target.value)}
          placeholder="Service name"
        />
        <input
          className="w-14 box-border rounded-[10px] border border-white/10 bg-card px-2 py-[11px] text-[13px] outline-none"
          value={svcPrice}
          onChange={(e) => setSvcPrice(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="$"
        />
        <div onClick={addService} className="flex w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-gold text-lg font-extrabold text-bg">+</div>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <div className="font-headline text-sm tracking-wide">MY WORK</div>
        <div className="flex gap-2">
          <div onClick={() => photoInput.current?.click()} className="cursor-pointer rounded-lg bg-gold px-2.5 py-[7px] text-[11.5px] font-extrabold text-bg">
            {uploading ? "Uploading…" : "+ Photo"}
          </div>
          <div onClick={() => videoInput.current?.click()} className="cursor-pointer rounded-lg border border-gold/40 px-2.5 py-[7px] text-[11.5px] font-extrabold text-gold">
            + Video
          </div>
        </div>
        <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "image")} />
        <input ref={videoInput} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "video")} />
      </div>

      {posts.length > 0 ? (
        <div className="mb-2.5 grid grid-cols-3 gap-1.5">
          {posts.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-inputbg">
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
        <div className="py-5 pb-6 text-center text-[12.5px] text-faint">No posts yet — share your best work.</div>
      )}

      <div className="mt-1.5">
        <GhostButton onClick={logout}>Log Out</GhostButton>
      </div>
    </div>
  );
}
