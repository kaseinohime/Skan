import { createAdminClient } from "@/lib/supabase/admin";

export type SharedLinkPayload = {
  scope: "client" | "campaign" | "post";
  clientId: string;
  clientName: string;
  campaignId?: string | null;
  campaignName?: string | null;
  postId?: string | null;
  posts?: Array<{
    id: string;
    title: string | null;
    status: string;
    scheduled_at: string | null;
    platform: string;
    post_type: string;
    caption: string | null;
    media_urls: string[] | null;
  }>;
  post?: {
    id: string;
    title: string | null;
    status: string;
    scheduled_at: string | null;
    platform: string;
    post_type: string;
    caption: string | null;
    hashtags: string[] | null;
    media_urls: string[] | null;
    media_type: string | null;
  } | null;
};

export async function getSharedLinkData(
  token: string
): Promise<SharedLinkPayload> {
  const supabase = createAdminClient();

  const { data: link, error: linkError } = await supabase
    .from("guest_links")
    .select("id, client_id, campaign_id, post_id, scope, expires_at, is_active")
    .eq("token", token.trim())
    .single();

  if (linkError || !link) {
    throw new Error("NOT_FOUND");
  }

  if (!link.is_active) {
    throw new Error("FORBIDDEN");
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    throw new Error("EXPIRED");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", link.client_id)
    .single();

  if (!client) {
    throw new Error("NOT_FOUND");
  }

  const payload: SharedLinkPayload = {
    scope: link.scope as "client" | "campaign" | "post",
    clientId: link.client_id,
    clientName: client.name,
  };

  if (link.scope === "client") {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, status, scheduled_at, platform, post_type, caption, media_urls")
      .eq("client_id", link.client_id)
      .order("scheduled_at", { ascending: true });
    payload.posts = (posts ?? []) as SharedLinkPayload["posts"];
  } else if (link.scope === "campaign" && link.campaign_id) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("id", link.campaign_id)
      .single();
    payload.campaignId = link.campaign_id;
    payload.campaignName = campaign?.name ?? null;
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, status, scheduled_at, platform, post_type, caption, media_urls")
      .eq("campaign_id", link.campaign_id)
      .order("scheduled_at", { ascending: true });
    payload.posts = (posts ?? []) as SharedLinkPayload["posts"];
  } else if (link.scope === "post" && link.post_id) {
    payload.postId = link.post_id;
    const { data: post } = await supabase
      .from("posts")
      .select("id, title, status, scheduled_at, platform, post_type, caption, hashtags, media_urls, media_type")
      .eq("id", link.post_id)
      .single();
    payload.post = (post ?? null) as SharedLinkPayload["post"];
  }

  return payload;
}
