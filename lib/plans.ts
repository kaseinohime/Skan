// プランごとの上限値と Price ID を一元管理

export type Plan = 'free' | 'starter' | 'standard' | 'pro' | 'enterprise';

export interface PlanLimits {
  clientLimit: number | null;   // null = 無制限
  staffLimit: number | null;    // null = 無制限
  aiMonthlyLimit: number | null; // null = 無制限
  guestLinks: boolean;
  approvalFlowCustom: boolean;
  monthlyReport: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    clientLimit: 1,
    staffLimit: 3,
    aiMonthlyLimit: 5,
    guestLinks: false,
    approvalFlowCustom: false,
    monthlyReport: false,
    prioritySupport: false,
  },
  starter: {
    clientLimit: 10,
    staffLimit: 10,
    aiMonthlyLimit: 50,
    guestLinks: true,
    approvalFlowCustom: true,
    monthlyReport: false,
    prioritySupport: false,
  },
  standard: {
    clientLimit: 30,
    staffLimit: null,
    aiMonthlyLimit: 200,
    guestLinks: true,
    approvalFlowCustom: true,
    monthlyReport: true,
    prioritySupport: false,
  },
  pro: {
    clientLimit: 100,
    staffLimit: null,
    aiMonthlyLimit: null,
    guestLinks: true,
    approvalFlowCustom: true,
    monthlyReport: true,
    prioritySupport: true,
  },
  enterprise: {
    clientLimit: null,
    staffLimit: null,
    aiMonthlyLimit: null,
    guestLinks: true,
    approvalFlowCustom: true,
    monthlyReport: true,
    prioritySupport: true,
  },
};

// Stripe Price ID → プラン名のマッピング
export const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY!]: 'starter',
  [process.env.STRIPE_PRICE_STARTER_YEARLY!]: 'starter',
  [process.env.STRIPE_PRICE_STANDARD_MONTHLY!]: 'standard',
  [process.env.STRIPE_PRICE_STANDARD_YEARLY!]: 'standard',
  [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
  [process.env.STRIPE_PRICE_PRO_YEARLY!]: 'pro',
};

/** クライアント追加可否チェック */
export function canAddClient(plan: Plan, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].clientLimit;
  return limit === null || currentCount < limit;
}

/** スタッフ追加可否チェック */
export function canAddStaff(plan: Plan, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].staffLimit;
  return limit === null || currentCount < limit;
}

/** AI機能利用可否チェック */
export function canUseAi(plan: Plan, usedThisMonth: number): boolean {
  const limit = PLAN_LIMITS[plan].aiMonthlyLimit;
  return limit === null || usedThisMonth < limit;
}
