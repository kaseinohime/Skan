"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-[0_2px_20px_rgba(99,102,241,0.08)] border-b border-white/40"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-0.5 select-none">
          <span className="text-2xl font-black tracking-tighter leading-none text-primary">S</span>
          <span className="text-2xl font-extralight tracking-tighter leading-none text-foreground/30">kan</span>
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
          <a href="#features" className="hover:text-foreground transition-colors">機能</a>
          <a href="#steps" className="hover:text-foreground transition-colors">使い方</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">料金</a>
          <a href="#faq" className="hover:text-foreground transition-colors">よくある質問</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-foreground/70">
            <Link href="/login">ログイン</Link>
          </Button>
          <Button size="sm" asChild className="rounded-xl px-5 shadow-sm">
            <Link href="/register">無料で始める</Link>
          </Button>
        </div>

        {/* モバイルメニューボタン */}
        <button
          className="md:hidden rounded-xl p-2 text-foreground/70 hover:bg-muted/60"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* モバイルメニュー */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-border/40 px-6 py-4 flex flex-col gap-3">
          <a href="#features" className="py-2 text-sm font-medium text-foreground/70" onClick={() => setMobileOpen(false)}>機能</a>
          <a href="#steps" className="py-2 text-sm font-medium text-foreground/70" onClick={() => setMobileOpen(false)}>使い方</a>
          <a href="#pricing" className="py-2 text-sm font-medium text-foreground/70" onClick={() => setMobileOpen(false)}>料金</a>
          <a href="#faq" className="py-2 text-sm font-medium text-foreground/70" onClick={() => setMobileOpen(false)}>よくある質問</a>
          <div className="flex gap-3 pt-2 border-t border-border/40">
            <Button variant="outline" size="sm" asChild className="flex-1 rounded-xl">
              <Link href="/login">ログイン</Link>
            </Button>
            <Button size="sm" asChild className="flex-1 rounded-xl">
              <Link href="/register">無料で始める</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
