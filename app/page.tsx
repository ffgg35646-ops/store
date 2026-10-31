import { Storefront } from "@/components/storefront";

export default async function HomePage({ searchParams }: { searchParams: Promise<{q?:string;category?:string}> }) {
  const params = await searchParams;
  return <Storefront initialQuery={params.q || ""} initialCategory={params.category || ""}/>;
}
