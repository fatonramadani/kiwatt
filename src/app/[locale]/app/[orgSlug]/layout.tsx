import { notFound, redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { Sidebar } from "~/components/app/sidebar";
import { AppHeader } from "~/components/app/header";
import { api } from "~/trpc/server";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch organization and verify membership
  let organization;
  try {
    organization = await api.organization.getBySlug({ slug: orgSlug });
  } catch {
    notFound();
  }

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar orgSlug={orgSlug} orgName={organization.name} />
      <div className="pl-72">
        <AppHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
          orgSlug={orgSlug}
        />
        <main className="px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
