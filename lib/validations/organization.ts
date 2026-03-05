import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "企業名を入力してください").max(200),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(100)
    .regex(slugRegex, "スラッグは英小文字・数字・ハイフンのみ"),
  description: z.string().max(2000).optional(),
  admin_email: z.string().email("有効なメールアドレスを入力してください"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).regex(slugRegex).optional(),
  description: z.string().max(2000).optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
