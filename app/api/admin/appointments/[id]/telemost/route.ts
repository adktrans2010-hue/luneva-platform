import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/src/lib/admin-api";
import { ensureTelemostForAppointment } from "@/src/lib/appointment-telemost";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const auth=await requireAdminApiSession(request);if(!auth.authorized)return auth.response;
  const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Запись не найдена"},{status:404});
  const result=await ensureTelemostForAppointment(id,{retry:true});
  return NextResponse.json(result,{status:["created","existing","manual"].includes(result.state)?200:409});
}
