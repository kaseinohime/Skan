import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BillingClient } from '@/components/billing/billing-client';
import { PLAN_LIMITS, type Plan } from '@/lib/plans';

export const metadata = { title: 'プラン・お支払い | エスカン' };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ユーザーの組織情報を取得
  const { data: member } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations (
        id, name, subscription_plan, subscription_status,
        stripe_customer_id, current_period_end
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  type OrgData = {
    id: string;
    name: string;
    subscription_plan: Plan;
    subscription_status: string;
    stripe_customer_id: string | null;
    current_period_end: string | null;
  };
  const org = (member?.organizations as unknown) as OrgData | null;

  if (!org) redirect('/dashboard');

  const plan = org.subscription_plan ?? 'free';
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-black text-foreground">プラン・お支払い</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          現在のプランと利用状況を確認できます
        </p>
      </div>

      <BillingClient
        plan={plan}
        status={org.subscription_status}
        periodEnd={org.current_period_end}
        hasStripeCustomer={!!org.stripe_customer_id}
        isAdmin={member?.role === 'agency_admin'}
        limits={limits}
      />
    </div>
  );
}
