import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
const COOKIE="rental_session";
function hashToken(token:string){return crypto.createHash("sha256").update(token).digest("hex")}
export async function login(email:string,password:string){
  const user=await prisma.user.findUnique({where:{email:email.toLowerCase()}});
  if(!user?.passwordHash||!user.active||!(await bcrypt.compare(password,user.passwordHash))) return null;
  const raw=crypto.randomBytes(32).toString("hex");
  const expiresAt=new Date(Date.now()+7*86_400_000);
  await prisma.session.create({data:{userId:user.id,tokenHash:hashToken(raw),expiresAt}});
  const jar=await cookies(); jar.set(COOKIE,raw,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt});
  return user;
}
export async function logout(){
  const jar=await cookies(); const raw=jar.get(COOKIE)?.value;
  if(raw) await prisma.session.deleteMany({where:{tokenHash:hashToken(raw)}});
  jar.delete(COOKIE);
}
export async function currentUser(){
  const raw=(await cookies()).get(COOKIE)?.value; if(!raw) return null;
  const s=await prisma.session.findUnique({where:{tokenHash:hashToken(raw)},include:{user:true}});
  if(!s||s.expiresAt<new Date()||!s.user.active) return null;
  return s.user;
}
export async function requireAdmin(){
  const user=await currentUser();
  const adminRoles:UserRole[]=[UserRole.SUPER_ADMIN,UserRole.ADMIN,UserRole.MANAGER,UserRole.STAFF];
  if(!user||!adminRoles.includes(user.role)) throw new Error("UNAUTHORIZED");
  return user;
}
