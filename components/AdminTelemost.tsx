"use client";
import { useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";
export default function AdminTelemost({appointment:a}:{appointment:{id:string;meetingUrl?:string|null;telemostConferenceId?:string|null;telemostSyncStatus?:string|null;telemostLastError?:string|null}}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const pending=a.telemostSyncStatus==="pending";
  const review=["OUTCOME_UNKNOWN","INVALID_RESPONSE","PERSISTENCE_UNKNOWN"].includes(a.telemostLastError||"");
  async function create(){setBusy(true);try{
    const r=await adminFetch(`/api/admin/appointments/${a.id}/telemost`,{method:"POST"});
    const data=await r.json();
    if(r.ok){window.location.reload();return;}
    setMessage(data.state==="disabled"?"Автоматическое создание выключено.":data.state==="review_required"||data.state==="pending"?"Исход предыдущего запроса нужно проверить. Новая встреча не создавалась.":"Не удалось создать Телемост. Проверьте состояние записи и повторите позже.");
  }catch{setMessage("Ответ не получен. Обновите страницу, прежде чем повторять.");}finally{setBusy(false);}}
  return <div><p>Телемост: {a.telemostConferenceId?"Создан автоматически":pending?"Создание / требуется проверка":a.telemostSyncStatus==="failed"?"Ошибка":a.meetingUrl?"Добавлен вручную":"Не создан"}</p>
    {!a.telemostConferenceId&&!a.meetingUrl&&<button type="button" disabled={busy||pending||review} onClick={create}>{a.telemostSyncStatus==="failed"?"Повторить создание":"Создать Телемост"}</button>}
    {review&&<p>Исход запроса не подтверждён. Нужна проверка, чтобы не создать дубль.</p>}<p role="status">{message}</p></div>;
}
