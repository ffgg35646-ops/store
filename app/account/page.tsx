import { redirect } from "next/navigation";
import { AccountClient } from "@/components/account-client";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  if (tab === "notifications" || tab === "wallet") return <AccountClient initialTab={tab} />;
  if (tab === "orders") redirect("/orders");
  redirect("/profile");
}
