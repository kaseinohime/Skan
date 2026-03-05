'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type Plan, type PlanLimits } from '@/lib/plans';
import { ExternalLink, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  starter: 'Starter',
  standard: 'Standard',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const STATUS_CONFIG = {
  active: { label: '有効', icon: CheckCircle2, className: 'text-emerald-600' },
  trialing: { label: 'トライアル中', icon: CheckCircle2, className: 'text-blue-600' },
  past_due: { label: '支払い失敗', icon: AlertCircle, className: 'text-amber-600' },
  canceled: { label: 'キャンセル済み', icon: XCircle, className: 'text-red-600' },
  incomplete: { label: '未完了', icon: AlertCircle, className: 'text-amber-600' },
};

// 支払いリンク（プラン変更先）
const UPGRADE_LINKS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_LINK_STARTER_MONTHLY!,
  standard: process.env.NEXT_PUBLIC_STRIPE_LINK_STANDARD_MONTHLY!,
  pro: process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY!,
};

interface Props {
  plan: Plan;
  status: string;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
  isAdmin: boolean;
  limits: PlanLimits;
}

export function BillingClient({ plan, status, periodEnd, hasStripeCustomer, isAdmin, limits }: Props) {
  const [loading, setLoading] = useState(false);

  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  const periodEndDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // Stripe顧客ポータルへリダイレクト
  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('ポータルを開けませんでした: ' + (data.error ?? '不明なエラー'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 現在のプラン */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">現在のプラン</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-foreground">{PLAN_LABELS[plan]}</div>
            <div className={`mt-1 flex items-center gap-1.5 text-sm ${statusConfig.className}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </div>
            {periodEndDate && (
              <div className="mt-1 text-xs text-muted-foreground">
                {status === 'canceled' ? '終了日:' : '次回更新:'} {periodEndDate}
              </div>
            )}
          </div>
          {isAdmin && hasStripeCustomer && (
            <Button onClick={openPortal} disabled={loading} variant="outline" className="rounded-xl">
              {loading ? '読み込み中...' : 'プラン変更・解約'}
            </Button>
          )}
        </div>
      </div>

      {/* 利用上限 */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">プラン制限</h2>
        <dl className="space-y-3">
          <LimitRow label="クライアント数" value={limits.clientLimit === null ? '無制限' : `${limits.clientLimit}件まで`} />
          <LimitRow label="スタッフ数" value={limits.staffLimit === null ? '無制限' : `${limits.staffLimit}名まで`} />
          <LimitRow label="AI生成（月）" value={limits.aiMonthlyLimit === null ? '無制限' : `${limits.aiMonthlyLimit}回まで`} />
          <LimitRow label="ゲスト共有リンク" value={limits.guestLinks ? '利用可' : '利用不可'} />
          <LimitRow label="承認フローカスタマイズ" value={limits.approvalFlowCustom ? '利用可' : '利用不可'} />
          <LimitRow label="月次レポート" value={limits.monthlyReport ? '利用可' : '利用不可'} />
          <LimitRow label="優先サポート" value={limits.prioritySupport ? '利用可' : '利用不可'} />
        </dl>
      </div>

      {/* アップグレード誘導（Freeの場合） */}
      {plan === 'free' && isAdmin && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-semibold text-foreground mb-2">有料プランにアップグレード</h2>
          <p className="text-sm text-muted-foreground mb-4">
            クライアント数・スタッフ数・AI機能を拡張できます
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(UPGRADE_LINKS).map(([p, link]) => (
              <a key={p} href={link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-xl gap-1.5">
                  {PLAN_LABELS[p as Plan]}にアップグレード
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
