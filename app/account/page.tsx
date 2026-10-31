import { AccountClient } from "@/components/account-client";
export default async function AccountPage({searchParams}:{searchParams:Promise<{tab?:string}>}) {
  const {tab}=await searchParams;
  return <AccountClient initialTab={tab||"overview"}/>;
}
