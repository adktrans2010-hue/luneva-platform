import { NextResponse } from "next/server";
import { ownedConsultation, appointmentDuration } from "@/src/lib/consultation-access-server";
import { consultationAccess, joinPath } from "@/src/lib/consultation-access";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const {user,appointment}=await ownedConsultation(id);const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};
 if(!user)return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(joinPath(id))}`,request.url),{status:302,headers});
 if(!appointment)return new NextResponse(null,{status:404,headers});
 if(consultationAccess(appointment,await appointmentDuration(appointment)).state!=="active")return new NextResponse("Доступ к встрече пока закрыт.",{status:403,headers});
 return NextResponse.redirect(appointment.meetingUrl!,{status:302,headers});
}
