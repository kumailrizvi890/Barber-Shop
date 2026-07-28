import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, Post, PostComment, Profile, RewardRedemption } from "@/lib/types";

export async function approveBarber(supabase: SupabaseClient, barberId: string) {
  const { error } = await supabase.from("profiles").update({ status: "approved" }).eq("id", barberId);
  if (error) throw error;
  await notify(supabase, barberId, "You're approved! You're now live in The Crew and can start taking bookings.", "🎉");
}

export async function rejectBarber(supabase: SupabaseClient, barberId: string) {
  const { error } = await supabase.from("profiles").update({ status: "rejected" }).eq("id", barberId);
  if (error) throw error;
}

export interface RevenueBreakdown {
  ytd: number;
  month: number;
  total: number;
}

function sumPrice(rows: { price: number }[]) {
  return rows.reduce((sum, r) => sum + Number(r.price), 0);
}

// Revenue counts completed bookings only, bucketed by appointment `date`
// (not created_at) so it reflects when the cut actually happened.
export async function fetchRevenue(
  supabase: SupabaseClient,
  filter: { barberId?: string } = {}
): Promise<RevenueBreakdown> {
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let query = supabase.from("bookings").select("price, date").eq("status", "completed");
  if (filter.barberId) query = query.eq("barber_id", filter.barberId);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data as { price: number; date: string }[]) ?? [];

  return {
    total: sumPrice(rows),
    ytd: sumPrice(rows.filter((r) => r.date >= yearStart)),
    month: sumPrice(rows.filter((r) => r.date >= monthStart)),
  };
}

export interface ShopStats {
  revenue: RevenueBreakdown;
  totalBookings: number;
  pendingBarbers: number;
  crewSize: number;
}

export async function fetchShopStats(supabase: SupabaseClient): Promise<ShopStats> {
  const [revenue, { count: totalBookings }, { count: pendingBarbers }, { count: crewSize }] = await Promise.all([
    fetchRevenue(supabase),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "barber").eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "barber").eq("status", "approved"),
  ]);
  return {
    revenue,
    totalBookings: totalBookings ?? 0,
    pendingBarbers: pendingBarbers ?? 0,
    crewSize: crewSize ?? 0,
  };
}

export interface BarberStats {
  profile: Profile;
  revenue: RevenueBreakdown;
  totalBookings: number;
  completedBookings: number;
}

export async function fetchBarberStats(supabase: SupabaseClient, barberId: string): Promise<BarberStats | null> {
  const [{ data: profile }, revenue, { count: totalBookings }, { count: completedBookings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", barberId).single(),
    fetchRevenue(supabase, { barberId }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("barber_id", barberId),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("barber_id", barberId).eq("status", "completed"),
  ]);
  if (!profile) return null;
  return {
    profile: profile as Profile,
    revenue,
    totalBookings: totalBookings ?? 0,
    completedBookings: completedBookings ?? 0,
  };
}

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

  // 10 points per dollar of the service they were booked for, credited the moment
  // the barber marks the appointment complete — not gated on leaving a rating.
  const pointsEarned = Math.round(booking.price * 10);
  const { data: existingRewards } = await supabase.from("rewards").select("points").eq("user_id", booking.customer_id).single();
  const nextPoints = (existingRewards?.points ?? 0) + pointsEarned;
  const { error: rewardsError } = await supabase.from("rewards").upsert({ user_id: booking.customer_id, points: nextPoints });
  if (rewardsError) throw rewardsError;

  await notify(
    supabase,
    booking.customer_id,
    `You earned ${pointsEarned} points for your ${booking.service_name} with ${booking.barber?.name ?? "your barber"}!`,
    "🎉"
  );
  await notify(supabase, booking.customer_id, `How was your cut? Rate your visit with ${booking.barber?.name ?? "your barber"}.`, "⭐");
}

export async function rateBooking(supabase: SupabaseClient, booking: Booking, rating: number) {
  const { error } = await supabase.from("bookings").update({ rating }).eq("id", booking.id);
  if (error) throw error;

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
}

// Redeeming doesn't spend points itself — it creates a pending redemption that
// gets shown to the customer as a QR code. Points only actually leave the
// balance once a barber scans/opens it and confirms (confirmRedemption below),
// so a customer can't just claim a free cut without a barber verifying it.
export async function createRedemption(supabase: SupabaseClient, userId: string, points: number): Promise<RewardRedemption> {
  const { data: existing } = await supabase
    .from("reward_redemptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return existing as RewardRedemption;

  const { data, error } = await supabase
    .from("reward_redemptions")
    .insert({ user_id: userId, points })
    .select()
    .single();
  if (error) throw error;
  return data as RewardRedemption;
}

export async function fetchRedemption(supabase: SupabaseClient, id: string): Promise<RewardRedemption | null> {
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*, customer:user_id(name, initials)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as RewardRedemption;
}

export async function confirmRedemption(supabase: SupabaseClient, redemption: RewardRedemption, barberId: string) {
  const { data: rewardsRow } = await supabase.from("rewards").select("points").eq("user_id", redemption.user_id).single();
  const nextPoints = Math.max(0, (rewardsRow?.points ?? 0) - redemption.points);
  const { error: rewardsErr } = await supabase.from("rewards").update({ points: nextPoints }).eq("user_id", redemption.user_id);
  if (rewardsErr) throw rewardsErr;

  const { error } = await supabase
    .from("reward_redemptions")
    .update({ status: "used", used_at: new Date().toISOString(), used_by: barberId })
    .eq("id", redemption.id)
    .eq("status", "pending");
  if (error) throw error;

  await notify(supabase, redemption.user_id, "Your free cut was redeemed — enjoy!", "🎁");
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
