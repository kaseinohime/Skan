"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ja } from "date-fns/locale";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { PostStatus } from "@/types";

type Post = {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  post_type: string;
  platform: string;
};

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "bg-muted border-muted-foreground/30",
  in_progress: "bg-blue-500/10 border-blue-500/50",
  pending_review: "bg-amber-500/10 border-amber-500/50",
  revision: "bg-orange-500/10 border-orange-500/50",
  approved: "bg-emerald-500/10 border-emerald-500/50",
  scheduled: "bg-blue-500/10 border-blue-500/50",
  published: "bg-emerald-500/10 border-emerald-500/50",
};

function getStatusColor(status: string): string {
  return STATUS_COLORS[status as PostStatus] ?? "bg-muted border-muted-foreground/30";
}

function DraggablePostCard({
  post,
  clientId,
  dateKey,
}: {
  post: Post;
  clientId: string;
  dateKey: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `post-${post.id}`,
    data: { post, sourceDateKey: dateKey },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded border px-2 py-1.5 text-left text-sm active:cursor-grabbing ${getStatusColor(post.status)} ${isDragging ? "opacity-50" : ""}`}
    >
      <Link
        href={`/clients/${clientId}/posts/${post.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block truncate font-medium hover:underline"
      >
        {post.title}
      </Link>
      <p className="truncate text-xs opacity-80">
        {post.platform} / {post.post_type}
      </p>
    </div>
  );
}

function DroppableDay({
  dateKey,
  date,
  isCurrentMonth,
  posts,
  clientId,
}: {
  dateKey: string;
  date: Date;
  isCurrentMonth: boolean;
  posts: Post[];
  clientId: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dateKey}` });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded border p-2 ${isCurrentMonth ? "bg-background" : "bg-muted/30"} ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`text-sm font-medium ${isToday(date) ? "rounded bg-primary px-1.5 py-0.5 text-primary-foreground" : ""}`}
        >
          {format(date, "d")}
        </span>
      </div>
      <div className="space-y-1">
        {posts.map((post) => (
          <DraggablePostCard
            key={post.id}
            post={post}
            clientId={clientId}
            dateKey={dateKey}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarView({ clientId }: { clientId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [current, setCurrent] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/clients/${clientId}/posts`);
      const data = await res.json().catch(() => ({}));
      if (!cancelled && Array.isArray(data.posts)) setPosts(data.posts);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    if (!activeId.startsWith("post-")) return;
    const postId = activeId.replace("post-", "");
    const overId = String(over.id);
    if (!overId.startsWith("day-")) return;
    const dateKey = overId.replace("day-", "");
    const [y, m, d] = dateKey.split("-").map(Number);
    const newDate = new Date(y, m - 1, d, 9, 0, 0);
    const scheduled_at = newDate.toISOString();

    const res = await fetch(`/api/clients/${clientId}/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at }),
    });
    if (!res.ok) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, scheduled_at } : p
      )
    );
  };

  const range =
    viewMode === "month"
      ? { start: startOfWeek(startOfMonth(current)), end: endOfWeek(endOfMonth(current)) }
      : {
          start: startOfWeek(current),
          end: endOfWeek(current),
        };
  const days = eachDayOfInterval(range);

  const postsByDateKey: Record<string, Post[]> = {};
  for (const post of posts) {
    if (!post.scheduled_at) continue;
    const d = parseISO(post.scheduled_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!postsByDateKey[key]) postsByDateKey[key] = [];
    postsByDateKey[key].push(post);
  }

  if (loading) {
    return <p className="text-muted-foreground">読み込み中…</p>;
  }

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrent(
                  viewMode === "month" ? subMonths(current, 1) : subWeeks(current, 1)
                )
              }
              className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
            >
              前へ
            </button>
            <span className="min-w-[180px] text-center font-medium">
              {viewMode === "month"
                ? format(current, "yyyy年M月", { locale: ja })
                : `${format(range.start, "M/d", { locale: ja })} 〜 ${format(range.end, "M/d", { locale: ja })}`}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrent(
                  viewMode === "month" ? addMonths(current, 1) : addWeeks(current, 1)
                )
              }
              className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
            >
              次へ
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded border px-3 py-1.5 text-sm ${viewMode === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              月
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded border px-3 py-1.5 text-sm ${viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              週
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-1 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            return (
              <DroppableDay
                key={dateKey}
                dateKey={dateKey}
                date={day}
                isCurrentMonth={viewMode === "month" ? isSameMonth(day, current) : true}
                posts={postsByDateKey[dateKey] ?? []}
                clientId={clientId}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
