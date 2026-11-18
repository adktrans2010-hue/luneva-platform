import Link from "next/link";
import { consultationAccess, officeDetails, moscowDateTime, type AccessAppointment } from "@/src/lib/consultation-access";
export default function ConsultationAccess({appointment:a,duration}:{appointment:AccessAppointment;duration:number|null}) {
 const access=consultationAccess(a,duration);
 if(access.state==="disabled")return null;
 if(access.state==="office"){const office=officeDetails(a);return <div className="my-4 rounded-xl border p-4"><h3>Адрес встречи</h3><p>{office.address||"Точный адрес Александра направит после подтверждения."}</p>{office.mapUrl&&<a href={office.mapUrl} target="_blank" rel="noreferrer">Открыть в Яндекс Картах</a>}</div>;}
 return <div className="my-4 rounded-xl border p-4"><h3>Доступ к консультации</h3>
 {access.state==="missing"?<p>Ссылка ещё не добавлена</p>:access.state==="waiting"?<><p>Ссылка на онлайн-консультацию станет доступна {moscowDateTime(access.availableFrom!)} МСК.</p><p>{a.meetingAvailableFrom?"Время открытия доступа задано Александрой.":"Вы сможете войти за 30 минут до начала встречи."}</p></>:access.state==="active"?<Link href={access.joinUrl+"/go"} prefetch={false}>Перейти в Яндекс Телемост</Link>:<p>Доступ к встрече закрыт. При необходимости свяжитесь с Александрой.</p>}
 </div>;
}
