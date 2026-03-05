import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { PRICE_TO_PLAN, Plan } from '@/lib/plans';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Supabase Service Role クライアント（RLSをバイパスしてDBを直接更新）
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** organizationsテーブルのプラン情報を更新 */
async function updateOrganizationPlan(
  orgId: string,
  plan: Plan,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  periodEnd: Date | null,
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_plan: plan,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: status,
      current_period_end: periodEnd?.toISOString() ?? null,
    })
    .eq('id', orgId);

  if (error) {
    console.error('[Stripe Webhook] DB更新エラー:', error);
    throw error;
  }
}

/** stripe_customer_id からorgIdを取得 */
async function getOrgIdByCustomer(customerId: string): Promise<string | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return data?.id ?? null;
}

// Stripe SDK v20では current_period_end が items 内にある場合があるためヘルパーで取得
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  // items.data[0].current_period_end を優先し、なければ subscription 直下を試みる
  const raw = sub.items.data[0]?.current_period_end
    ?? (sub as unknown as Record<string, unknown>)['current_period_end'];
  if (typeof raw === 'number') return new Date(raw * 1000);
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'シグネチャなし' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('[Stripe Webhook] シグネチャ検証失敗:', err);
    return NextResponse.json({ error: 'シグネチャ無効' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 支払いリンクからの決済完了
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!orgId || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] ?? 'free';
        const periodEnd = getPeriodEnd(subscription);

        await updateOrganizationPlan(orgId, plan, customerId, subscriptionId, 'active', periodEnd);
        console.log(`[Stripe Webhook] プラン有効化: org=${orgId} plan=${plan}`);
        break;
      }

      // プラン変更・更新
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const orgId = await getOrgIdByCustomer(customerId);
        if (!orgId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] ?? 'free';
        const status = ['active', 'trialing', 'past_due', 'canceled', 'incomplete'].includes(subscription.status)
          ? subscription.status
          : 'incomplete';
        const periodEnd = getPeriodEnd(subscription);

        await updateOrganizationPlan(orgId, plan, customerId, subscription.id, status, periodEnd);
        console.log(`[Stripe Webhook] プラン更新: org=${orgId} plan=${plan} status=${status}`);
        break;
      }

      // 解約
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const orgId = await getOrgIdByCustomer(customerId);
        if (!orgId) break;

        await updateOrganizationPlan(orgId, 'free', customerId, subscription.id, 'canceled', null);
        console.log(`[Stripe Webhook] 解約 → Free降格: org=${orgId}`);
        break;
      }

      // 支払い失敗
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const orgId = await getOrgIdByCustomer(customerId);
        if (!orgId) break;

        const supabase = getAdminClient();
        await supabase
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('id', orgId);
        console.log(`[Stripe Webhook] 支払い失敗: org=${orgId}`);
        break;
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] 処理エラー:', err);
    return NextResponse.json({ error: 'Webhook処理失敗' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
