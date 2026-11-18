import { redirect, notFound } from "next/navigation";
import { ownedConsultation, appointmentDuration } from "@/src/lib/consultation-access-server";
import { joinPath } from "@/src/lib/consultation-access";
import ConsultationAccess from "@/components/ConsultationAccess";
export const dynamic="force-dynamic";
export const metadata={title:"Доступ к консультации",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const {user,appointment}=await ownedConsultation(id);
 if(!user)redirect(`/login?next=${encodeURIComponent(joinPath(id))}`);
 if(!appointment || ["cancelled","expired","payment_conflict","completed"].includes(appointment.status))notFound();
 return <main className="mx-auto max-w-2xl px-6 py-16"><h1>Доступ к консультации</h1><ConsultationAccess appointment={appointment} duration={await appointmentDuration(appointment)}/></main>;
}
