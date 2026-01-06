import { redirect } from "next/navigation";

interface OrgPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;
  redirect(`/app/${orgSlug}/dashboard`);
}
