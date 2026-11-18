import { appointmentDuration } from "@/src/lib/consultation-access-server";
import { consultationAccess } from "@/src/lib/consultation-access";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { appointmentRequests, appointmentHistory, clientNotifications } from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";
import { validTelemostUrl, validMapUrl, moscowDateTime, joinPath, officeDetails } from "@/src/lib/consultation-access";
import { sendMail } from "@/src/lib/email";
type Context={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Context){
 const auth=await requireAdminApiSession(request);if(!auth.authorized)return auth.response;
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Запись не найдена"},{status:404});
 const body=await request.json().catch(()=>null);if(!body)return NextResponse.json({error:"Некорректные данные"},{status:400});
 const text=(v:unknown)=>typeof v==="string"?v.trim():"";
 const meetingUrl=text(body.meetingUrl)||null,officeAddress=text(body.officeAddress)||null,officeMapUrl=text(body.officeMapUrl)||null;
 const available=text(body.meetingAvailableFrom);const meetingAvailableFrom=available?new Date(available):null;
 if((meetingUrl&&(!validTelemostUrl(meetingUrl)||meetingUrl.length>2048))||(officeMapUrl&&!validMapUrl(officeMapUrl))||(officeAddress&&officeAddress.length>1000)||(available&&(!/(Z|[+-]\d{2}:\d{2})$/.test(available)||!Number.isFinite(meetingAvailableFrom!.getTime()))))return NextResponse.json({error:"Проверьте ссылку и дату. Ссылки должны быть HTTPS, дата — с часовым поясом."},{status:400});
 const result=await db.transaction(async tx=>{
 const [a]=await tx.select().from(appointmentRequests).where(eq(appointmentRequests.id,id)).for("update");if(!a)return false;
 await tx.update(appointmentRequests).set(a.consultationFormat==="online"?{meetingUrl,meetingAvailableFrom}:{officeAddress,officeMapUrl}).where(eq(appointmentRequests.id,id));
 await tx.insert(appointmentHistory).values({appointmentId:id,action:"Доступ к консультации",details:"Администратор обновил данные встречи. Ссылки не сохраняются в истории."});
 if(a.consultationFormat==="online"&&meetingUrl&&meetingUrl!==a.meetingUrl&&a.paymentStatus==="paid"&&a.userId&&a.status!=="cancelled")await tx.insert(clientNotifications).values({userId:a.userId,appointmentId:id,kind:"message",title:"Ссылка на консультацию готова",message:`Онлайн-встреча ${a.scheduledAt?moscowDateTime(a.scheduledAt):"в согласованное время"}. Откройте консультацию в личном кабинете, чтобы узнать время доступа.`});
 return true;
 }).catch(() => null);
 // Never log an ORM error here: its bound SQL parameters can contain the private meeting URL.
 if (result === null) return NextResponse.json({error:"Не удалось сохранить данные встречи."},{status:503});
 const [saved]=result?await db.select().from(appointmentRequests).where(eq(appointmentRequests.id,id)).limit(1):[];
 return NextResponse.json(result?{ok:true,state:saved?consultationAccess(saved,await appointmentDuration(saved)).state:"unavailable"}:{error:"Запись не найдена"},{status:result?200:404});
}
export async function POST(request:Request,{params}:Context){
 const auth=await requireAdminApiSession(request);if(!auth.authorized)return auth.response;
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Запись не найдена"},{status:404});
 const [a]=await db.select().from(appointmentRequests).where(eq(appointmentRequests.id,id)).limit(1);
 if(!a||["cancelled","expired","payment_conflict"].includes(a.status))return NextResponse.json({error:"Запись недоступна"},{status:404});
 const email=a.normalizedEmail||(a.contactMethod==="email"?a.contact:null);if(!email?.includes("@"))return NextResponse.json({error:"Email клиента отсутствует"},{status:400});
 const office=officeDetails(a);const info=a.consultationFormat==="online"?`Доступ к консультации: https://luneva-psy.ru${joinPath(id)}\nСсылка станет доступна в указанное в кабинете время.`:`Адрес встречи: ${office.address||"Точный адрес Александра направит после подтверждения."}\n${office.mapUrl||""}`;
 try{await sendMail({to:email,subject:"Данные вашей консультации",text:`Консультация ${a.scheduledAt?moscowDateTime(a.scheduledAt):"в согласованное время"} МСК.\n${info}\nЛичный кабинет: https://luneva-psy.ru/account`});console.info("client_email_sent");return NextResponse.json({ok:true});}catch{console.warn("client_email_failed");return NextResponse.json({error:"Не удалось отправить письмо. Повторите позже."},{status:502});}
}
