import { notFound } from "next/navigation";
import { AdminPanel } from "@/components/admin-panel";

const sections = ["products","categories","inventory","orders","users","coupons","rewards","notifications","messages","settings"];
export default async function AdminSectionPage({params}:{params:Promise<{section:string}>}) {
  const {section}=await params;
  if(!sections.includes(section))notFound();
  return <AdminPanel section={section}/>;
}
