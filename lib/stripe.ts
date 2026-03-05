import Stripe from 'stripe';

// サーバーサイド専用のStripeクライアント
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});
