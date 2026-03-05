import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createClientSchema = z.object({
  organization_id: z.string().uuid().optional(), // マスター用。企業管理者の場合は不要（自組織で作成）
  name: z.string().min(1, "クライアント名を入力してください").max(200),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(100)
    .regex(slugRegex, "スラッグは英小文字・数字・ハイフンのみ"),
  description: z.string().max(2000).optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  sns_platforms: z.array(z.enum(["instagram", "tiktok"])).optional().default([]),
  instagram_username: z.string().max(100).optional(),
  tiktok_username: z.string().max(100).optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(slugRegex).optional(),
  description: z.string().max(2000).optional().nullable(),
  logo_url: z.string().url().optional().or(z.literal("")).nullable(),
  sns_platforms: z.array(z.enum(["instagram", "tiktok"])).optional(),
  instagram_username: z.string().max(100).optional().nullable(),
  tiktok_username: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
