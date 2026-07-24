"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AccountNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export default function AccountNotifications({
  notifications,
}: {
  notifications: AccountNotification[];
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  async function markRead(notificationId?: string) {
    setUpdating(notificationId ?? "all");

    const response = await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notificationId ? { notificationId } : { all: true }),
    });

    setUpdating(null);

    if (response.ok) {
      router.refresh();
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl bg-[#fff8f6] p-6 text-[#5f5552]">
        Новых сообщений пока нет. Здесь появятся подтверждения, переносы,
        изменения оплаты и сообщения от Александры.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#5f5552]">
          Непрочитанных сообщений: <strong>{unreadCount}</strong>
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markRead()}
            disabled={updating === "all"}
            className="rounded-xl border border-[#c98778] px-4 py-2 text-sm text-[#8a5f55] disabled:opacity-50"
          >
            {updating === "all" ? "Обновляю..." : "Прочитать все"}
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={
              notification.readAt
                ? "rounded-2xl border border-[#ead7d1] bg-white p-5"
                : "rounded-2xl border border-[#c98778] bg-[#fff8f6] p-5 shadow-sm"
            }
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-medium text-[#332725]">
                    {notification.title}
                  </h3>
                  {!notification.readAt && (
                    <span className="rounded-full bg-[#c98778] px-2.5 py-1 text-xs text-white">
                      Новое
                    </span>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line leading-7 text-[#5f5552]">
                  {notification.message}
                </p>
                <p className="mt-3 text-sm text-[#8a7a76]">
                  {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(notification.createdAt))}
                </p>
              </div>

              {!notification.readAt && (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  disabled={updating === notification.id}
                  className="shrink-0 rounded-xl bg-[#332725] px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {updating === notification.id ? "Обновляю..." : "Прочитано"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
