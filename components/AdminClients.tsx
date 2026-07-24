"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  telegram: string | null;
  preferredContact: string;
  timeZone: string;
  isBlocked: boolean;
  blockedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  appointmentsCount: number;
  packagesCount: number;
};

const contactLabels: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  phone: "Телефон",
  email: "Email",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getStatus(client: Client) {
  if (client.deletedAt) {
    return { label: "Удален", className: "bg-[#f8e6e3] text-[#9b3f36]" };
  }

  if (client.isBlocked) {
    return { label: "Заблокирован", className: "bg-[#fff3df] text-[#9a5a1f]" };
  }

  return { label: "Активен", className: "bg-[#eaf6ec] text-[#3f7d4a]" };
}

export default function AdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    setError(null);
    const response = await adminFetch("/api/admin/clients");

    if (!response.ok) {
      setError("Не удалось загрузить клиентов.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as Client[];
    setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return clients;

    return clients.filter((client) =>
      [
        client.name,
        client.email,
        client.phone ?? "",
        client.telegram ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [clients, search]);

  async function toggleBlock(client: Client) {
    setSavingId(client.id);
    setError(null);

    const response = await adminFetch(`/api/admin/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !client.isBlocked }),
    });

    if (!response.ok) {
      setError("Не удалось изменить статус клиента.");
    }

    await loadClients();
    setSavingId(null);
  }

  async function deleteClient(client: Client) {
    const confirmed = window.confirm(
      `Удалить клиента ${client.name}? История записей и оплат останется в системе.`
    );

    if (!confirmed) return;

    setSavingId(client.id);
    setError(null);

    const response = await adminFetch(`/api/admin/clients/${client.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Не удалось удалить клиента.");
    }

    await loadClients();
    setSavingId(null);
  }

  return (
    <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-4xl text-[#332725]">Клиенты</h2>
          <p className="mt-3 max-w-2xl leading-7 text-[#5f5552]">
            Все зарегистрированные пользователи личного кабинета, их контакты,
            пакеты и записи.
          </p>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-[#ead7d1] px-4 py-3 md:max-w-sm"
          placeholder="Поиск по имени, email, телефону"
        />
      </div>

      {error && (
        <p className="mt-5 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-[#c98778]">
            <tr>
              <th className="border-b border-[#ead7d1] px-4 py-3">Клиент</th>
              <th className="border-b border-[#ead7d1] px-4 py-3">Контакты</th>
              <th className="border-b border-[#ead7d1] px-4 py-3">Связь</th>
              <th className="border-b border-[#ead7d1] px-4 py-3">Записи</th>
              <th className="border-b border-[#ead7d1] px-4 py-3">Пакеты</th>
              <th className="border-b border-[#ead7d1] px-4 py-3">Статус</th>
              <th className="border-b border-[#ead7d1] px-4 py-3 text-right">
                Действия
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-[#5f5552]" colSpan={7}>
                  Загружаю клиентов...
                </td>
              </tr>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const status = getStatus(client);
                const disabled =
                  savingId === client.id || Boolean(client.deletedAt);

                return (
                  <tr key={client.id} className="align-top">
                    <td className="border-b border-[#f0dfda] px-4 py-5">
                      <p className="font-medium text-[#332725]">{client.name}</p>
                      <p className="mt-1 text-[#5f5552]">{client.email}</p>
                      <p className="mt-1 text-xs text-[#9a8b87]">
                        Регистрация: {formatDate(client.createdAt)}
                      </p>
                    </td>
                    <td className="border-b border-[#f0dfda] px-4 py-5 text-[#5f5552]">
                      <p>{client.phone || "Телефон не указан"}</p>
                      <p className="mt-1">
                        {client.telegram || "Telegram не указан"}
                      </p>
                    </td>
                    <td className="border-b border-[#f0dfda] px-4 py-5 text-[#5f5552]">
                      <p>
                        {contactLabels[client.preferredContact] ??
                          client.preferredContact}
                      </p>
                      <p className="mt-1 text-xs text-[#9a8b87]">
                        {client.timeZone}
                      </p>
                    </td>
                    <td className="border-b border-[#f0dfda] px-4 py-5 text-[#332725]">
                      {client.appointmentsCount}
                    </td>
                    <td className="border-b border-[#f0dfda] px-4 py-5 text-[#332725]">
                      {client.packagesCount}
                    </td>
                    <td className="border-b border-[#f0dfda] px-4 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${status.className}`}
                      >
                        {status.label}
                      </span>
                      {client.blockedAt && (
                        <p className="mt-2 text-xs text-[#9a8b87]">
                          Блокировка: {formatDate(client.blockedAt)}
                        </p>
                      )}
                    </td>
                    <td className="border-b border-[#f0dfda] px-4 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void toggleBlock(client)}
                          className="rounded-xl border border-[#332725] px-3 py-2 text-[#332725] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {client.isBlocked ? "Разблокировать" : "Заблокировать"}
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void deleteClient(client)}
                          className="rounded-xl border border-[#b94a48] px-3 py-2 text-[#b94a48] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-[#5f5552]" colSpan={7}>
                  Клиенты не найдены.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
