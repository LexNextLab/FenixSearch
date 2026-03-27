import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  params?: Promise<Record<string, string>>;
};

export default async function Home({ searchParams, params }: PageProps) {
  await Promise.all([searchParams ?? Promise.resolve({}), params ?? Promise.resolve({})]);
  redirect("/empresas");
}
