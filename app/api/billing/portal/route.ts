import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Stripe顧客ポータルのセッションを作成してリダイレクト
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  // ユーザーの所属組織（agency_admin）を取得
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(stripe_customer_id)')
    .eq('user_id', user.id)
    .eq('role', 'agency_admin')
    .eq('is_active', true)
    .single();

  const stripeCustomerId = (member?.organizations as unknown as { stripe_customer_id: string } | null)?.stripe_customer_id;

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'Stripe顧客IDが見つかりません。サブスクリプション登録が必要です。' },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:20000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: body.returnUrl ?? `${baseUrl}/dashboard/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
