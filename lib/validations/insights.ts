import { z } from "zod";

const nullableInt = z.union([
  z.number().int().min(0).nullable(),
  z.literal("").transform(() => null),
  z.null(),
]);

export const upsertInsightsSchema = z.object({
  followers_count: nullableInt.optional(),
  reach: nullableInt.optional(),
  saves: nullableInt.optional(),
  follower_reach: nullableInt.optional(),
  non_follower_reach: nullableInt.optional(),
  profile_visits: nullableInt.optional(),
  follows: nullableInt.optional(),
  web_taps: nullableInt.optional(),
  discovery: nullableInt.optional(),
  target_segment: z.string().max(200).nullable().optional(),
  genre: z.string().max(100).nullable().optional(),
  theme: z.string().max(200).nullable().optional(),
  memo: z.string().max(2000).nullable().optional(),
});

export type UpsertInsightsInput = z.infer<typeof upsertInsightsSchema>;

export const accountSettingsSchema = z.object({
  profile_text: z.string().max(500).nullable().optional(),
  caption_template: z.string().max(2000).nullable().optional(),
  hashtag_sets: z
    .array(z.object({ label: z.string(), tags: z.array(z.string()) }))
    .optional(),
  persona: z.string().max(2000).nullable().optional(),
  kpi_save_rate_target: z.number().min(0).max(1).optional(),
  kpi_home_rate_target: z.number().min(0).max(1).optional(),
  benchmark_accounts: z
    .array(z.object({ url: z.string(), note: z.string() }))
    .optional(),
  competitor_accounts: z
    .array(z.object({ url: z.string(), note: z.string() }))
    .optional(),
  content_ideas: z
    .array(
      z.object({
        genre: z.string(),
        topic: z.string(),
        answer: z.string(),
        memo: z.string(),
        image_url: z.string(),
      })
    )
    .optional(),
});

export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
