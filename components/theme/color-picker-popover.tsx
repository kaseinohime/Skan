"use client";

import { useState } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS, type ColorPreset } from "@/lib/theme";

type Props = {
  globalColor: ColorPreset;
  clientColor: ColorPreset | null;
  clientName?: string;
  onGlobalChange: (color: ColorPreset) => void;
  onClientChange: (color: ColorPreset | null) => void;
};

export function ColorPickerPopover({
  globalColor,
  clientColor,
  clientName,
  onGlobalChange,
  onClientChange,
}: Props) {
  const hasClient = !!clientName;
  const [mode, setMode] = useState<"global" | "client">("global");

  // 現在のモードで選択中のカラー
  const activeColor = mode === "client" ? (clientColor ?? globalColor) : globalColor;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/60 hover:bg-primary/8 hover:text-foreground transition-all duration-150">
          <span
            className="h-4 w-4 flex-shrink-0 rounded-full shadow-sm ring-1 ring-white/50"
            style={{ backgroundColor: `hsl(${globalColor.hsl})` }}
          />
          <span>テーマカラー</span>
          <Palette className="ml-auto h-3.5 w-3.5 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        className="w-60 p-3 bg-white/90 backdrop-blur-xl border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        <p className="mb-2.5 text-xs font-semibold text-foreground">
          テーマカラーを選択
        </p>

        {/* グローバル / クライアント切替 */}
        {hasClient && (
          <div className="mb-3 flex rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setMode("global")}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                mode === "global"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              全体
            </button>
            <button
              onClick={() => setMode("client")}
              className={cn(
                "flex-1 truncate rounded-md px-2 py-1 text-xs font-medium transition-colors",
                mode === "client"
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={clientName}
            >
              {clientName}
            </button>
          </div>
        )}

        {/* カラースウォッチ */}
        <div className="grid grid-cols-6 gap-1.5">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color.hsl}
              title={color.name}
              onClick={() => {
                if (mode === "client") {
                  onClientChange(color);
                } else {
                  onGlobalChange(color);
                }
              }}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150 hover:scale-110 focus:outline-none",
                activeColor.hsl === color.hsl
                  ? "ring-2 ring-offset-1 ring-foreground/30 scale-110"
                  : "hover:ring-2 hover:ring-offset-1 hover:ring-foreground/20"
              )}
              style={{ backgroundColor: color.hex }}
            >
              {activeColor.hsl === color.hsl && (
                <Check className="h-3 w-3 text-white drop-shadow-sm" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>

        {/* クライアント設定リセット */}
        {mode === "client" && clientColor && (
          <button
            onClick={() => onClientChange(null)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            全体設定に戻す
          </button>
        )}

        {/* 現在の設定説明 */}
        <p className="mt-2 text-[10px] text-muted-foreground/70 text-center">
          {mode === "client" && clientColor
            ? `${clientName} 専用カラー設定中`
            : mode === "client"
            ? "全体カラーを引き継ぎ中"
            : "すべてのワークスペースに適用"}
        </p>
      </PopoverContent>
    </Popover>
  );
}
