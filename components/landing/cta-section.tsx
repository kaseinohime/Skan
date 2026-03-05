import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-indigo-700 px-8 py-16 text-center shadow-[0_20px_80px_rgba(99,102,241,0.35)]">
          {/* 背景オーブ */}
          <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/70">
              今すぐ始める
            </p>
            <h2 className="mb-5 text-3xl font-black leading-tight text-white md:text-4xl">
              今月から、承認待ちで<br className="hidden sm:block" />止まる日がなくなる。
            </h2>
            <p className="mb-10 mx-auto max-w-xl text-base text-white/80 leading-relaxed">
              月1社なら、ずっと無料。クレジットカード不要、初期費用¥0、いつでも解約できます。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="rounded-xl bg-white text-primary hover:bg-white/90 px-8 py-6 text-base font-bold shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                <Link href="/register">
                  無料アカウントを作成する
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="rounded-xl text-white hover:bg-white/15 px-6 py-6 text-base"
              >
                <Link href="/login">すでにアカウントをお持ちの方</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-white/50">
              クレジットカード不要 · 初期費用¥0 · いつでも解約可能
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
