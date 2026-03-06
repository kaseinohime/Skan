"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactSection() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = {
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? "送信に失敗しました。");
      }
      setState("success");
      form.reset();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "送信に失敗しました。");
      setState("error");
    }
  }

  return (
    <section id="contact" className="py-24 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
          お問い合わせ
        </div>
        <h2 className="mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
          ご不明な点はお気軽に
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          料金・機能・導入方法など、何でもお問い合わせください。
        </p>

        <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-8 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          {state === "success" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-lg font-bold text-foreground">送信しました！</p>
              <p className="text-sm text-muted-foreground">
                内容を確認次第、担当者よりご連絡いたします。
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => setState("idle")}
              >
                別のお問い合わせをする
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="company" className="block text-sm font-medium text-foreground/80">
                    会社名
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="株式会社○○"
                    className="w-full rounded-xl border border-border/60 bg-white/80 px-4 py-2.5 text-sm outline-none ring-primary/40 transition placeholder:text-muted-foreground/50 focus:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground/80">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="山田 太郎"
                    className="w-full rounded-xl border border-border/60 bg-white/80 px-4 py-2.5 text-sm outline-none ring-primary/40 transition placeholder:text-muted-foreground/50 focus:ring-2"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="hello@example.com"
                  className="w-full rounded-xl border border-border/60 bg-white/80 px-4 py-2.5 text-sm outline-none ring-primary/40 transition placeholder:text-muted-foreground/50 focus:ring-2"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-foreground/80">
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="ご質問・ご要望をご記入ください"
                  className="w-full rounded-xl border border-border/60 bg-white/80 px-4 py-2.5 text-sm outline-none ring-primary/40 transition placeholder:text-muted-foreground/50 focus:ring-2 resize-none"
                />
              </div>

              {state === "error" && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={state === "submitting"}
                className="w-full rounded-xl py-6 text-base font-bold"
              >
                {state === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  "送信する"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
