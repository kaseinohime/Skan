import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="border-t border-border/30 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-0.5 select-none">
            <span className="text-2xl font-black tracking-tighter leading-none text-primary">S</span>
            <span className="text-2xl font-extralight tracking-tighter leading-none text-foreground/30">kan</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">機能</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">料金</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-foreground transition-colors">ログイン</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">新規登録</Link>
          </nav>
          <p className="text-xs text-muted-foreground/60">
            © 2025 Skan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
