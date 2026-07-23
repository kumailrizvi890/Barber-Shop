import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, Post, PostComment, Profile } from "@/lib/types";

export async function notify(supabase: SupabaseClient, userId: string, text: string, icon: string) {
  await supabase.from("notifications").insert({ user_id: userId, text, icon, read: false });
}

export async function markNotificationRead(supabase: SupabaseClient, id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function requestBooking(
  supabase: SupabaseClient,
  params: {
    customerId: string;
    customerName: string;
    barberId: string;
    barberName: string;
    serviceId: string;
    serviceName: string;
    price: number;
    date: string;
    dateLabel: string;
    time: string;
  }
) {
  const { error } = await supabase.from("bookings").insert({
    customer_id: params.customerId,
    barber_id: params.barberId,
    service_id: params.serviceId,
    service_name: params.serviceName,
    price: params.price,
    date: params.date,
    time: params.time,
    status: "pending",
  });
  if (error) throw error;
  await notify(
    supabase,
    params.barberId,
    `New request from ${params.customerName} — ${params.serviceName} on ${params.dateLabel} at ${params.time}.`,
    "📩"
  );
}

export async function approveBooking(supabase: SupabaseClient, booking: Booking) {
  const { error } = await supabase.from("bookings").update({ status: "approved" }).eq("id", booking.id);
  if (error) throw error;
  await notify(
    supabase,
    booking.customer_id,
    `${booking.barber?.name ?? "Your barber"} confirmed your ${booking.date} ${booking.time} appointment!`,
    "✅"
  );
}

export async function declineBooking(supabase: SupabaseClient, booking: Booking) {
  const { error } = await supabase.from("bookings").update({ status: "declined" }).eq("id", booking.id);
  if (error) throw error;
  await notify(
    supabase,
    booking.customer_id,
    `${booking.barber?.name ?? "Your barber"} couldn't take your ${booking.date} ${booking.time} slot.`,
    "⚠️"
  );
}

export async function sendReminder(supabase: SupabaseClient, booking: Booking) {
  const { error } = await supabase.from("bookings").update({ reminder_sent: true }).eq("id", booking.id);
  if (error) throw error;
  await notify(
    supabase,
    booking.customer_id,
    `Reminder: your ${booking.time} cut with ${booking.barber?.name ?? "your barber"} is in about an hour.`,
    "⏰"
  );
}

export async function markCompleted(supabase: SupabaseClient, booking: Booking) {
  const { error } = await supabase.from("bookings").update({ status: "completed" }).eq("id", booking.id);
  if (error) throw error;

  const { data: barberProfile } = await supabase
    .from("profiles")
    .select("cuts_done")
    .eq("id", booking.barber_id)
    .single();
  await supabase
    .from("profiles")
    .update({ cuts_done: (barberProfile?.cuts_done ?? 0) + 1 })
    .eq("id", booking.barber_id);

  await notify(supabase, booking.customer_id, `How was your cut? Rate your visit with ${booking.barber?.name ?? "your barber"}.`, "⭐");
}

export async function rateBooking(supabase: SupabaseClient, booking: Booking, rating: number) {
  const { error } = await supabase.from("bookings").update({ rating }).eq("id", booking.id);
  if (error) throw error;

  const pointsEarned = Math.round(booking.price * 10);
  const { data: existing } = await supabase.from("rewards").select("points").eq("user_id", booking.customer_id).single();
  const nextPoints = (existing?.points ?? 0) + pointsEarned;
  await supabase.from("rewards").upsert({ user_id: booking.customer_id, points: nextPoints });

  // Roll the new rating into the barber's average (simple running average over completed+rated bookings).
  const { data: ratedBookings } = await supabase
    .from("bookings")
    .select("rating")
    .eq("barber_id", booking.barber_id)
    .not("rating", "is", null);
  if (ratedBookings && ratedBookings.length > 0) {
    const avg = ratedBookings.reduce((sum, b) => sum + (b.rating ?? 0), 0) / ratedBookings.length;
    await supabase.from("profiles").update({ rating: Math.round(avg * 10) / 10 }).eq("id", booking.barber_id);
  }

  await notify(supabase, booking.customer_id, `You earned ${pointsEarned} points for your last cut!`, "🎉");
}

export async function redeemReward(supabase: SupabaseClient, userId: string, currentPoints: number) {
  if (currentPoints < 5000) return;
  await supabase.from("rewards").update({ points: currentPoints - 5000 }).eq("user_id", userId);
  await notify(supabase, userId, "Redeemed 5000 points for a free cut. Show this at checkout!", "🎁");
}

export async function toggleBlockedSlot(
  supabase: SupabaseClient,
  barberId: string,
  weekday: number,
  slotIndex: number,
  nextBlocked: boolean
) {
  await supabase
    .from("availability")
    .upsert({ barber_id: barberId, weekday, slot_index: slotIndex, blocked: nextBlocked }, { onConflict: "barber_id,weekday,slot_index" });
}

export async function setAllSlots(supabase: SupabaseClient, barberId: string, weekday: number, blocked: boolean, slotCount: number) {
  const rows = Array.from({ length: slotCount }, (_, i) => ({ barber_id: barberId, weekday, slot_index: i, blocked }));
  await supabase.from("availability").upsert(rows, { onConflict: "barber_id,weekday,slot_index" });
}

export interface BarberProfileData {
  profile: Profile;
  services: { id: string; name: string; price: number }[];
  posts: Post[];
}

export async function fetchBarberProfile(supabase: SupabaseClient, barberId: string): Promise<BarberProfileData | null> {
  const [{ data: profile }, { data: services }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", barberId).eq("role", "barber").single(),
    supabase.from("barber_services").select("*").eq("barber_id", barberId).order("created_at"),
    supabase.from("posts").select("*").eq("barber_id", barberId).order("created_at", { ascending: false }),
  ]);
  if (!profile) return null;
  return { profile: profile as Profile, services: services ?? [], posts: (posts as Post[]) ?? [] };
}

export async function updateBarberProfile(
  supabase: SupabaseClient,
  barberId: string,
  fields: { name?: string; bio?: string; location?: string }
) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", barberId);
  if (error) throw error;
}

export async function deletePost(supabase: SupabaseClient, post: Post) {
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) throw error;
  try {
    const path = new URL(post.media_url).pathname.split("/posts/").pop();
    if (path) await supabase.storage.from("posts").remove([decodeURIComponent(path)]);
  } catch {
    // media_url wasn't a well-formed storage URL — nothing to clean up.
  }
}

export async function fetchPostStats(supabase: SupabaseClient, postId: string, userId: string | null) {
  const [{ count: likeCount }, likedByMe, { data: comments }] = await Promise.all([
    supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
    userId
      ? supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("post_comments")
      .select("*, author:user_id(name, initials)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
  ]);
  return {
    likeCount: likeCount ?? 0,
    likedByMe: !!likedByMe?.data,
    comments: (comments as PostComment[]) ?? [],
  };
}

export async function toggleLike(supabase: SupabaseClient, postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  }
}

export async function addComment(supabase: SupabaseClient, postId: string, userId: string, text: string) {
  const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: userId, text: text.trim() });
  if (error) throw error;
}

export async function setCommentHidden(supabase: SupabaseClient, commentId: string, hidden: boolean) {
  await supabase.from("post_comments").update({ hidden }).eq("id", commentId);
}
