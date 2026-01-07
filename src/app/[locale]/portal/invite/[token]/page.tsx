"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Mail, Building } from "lucide-react";
import Link from "next/link";

export default function InviteAcceptPage() {
  const params = useParams<{ token: string; locale: string }>();
  const router = useRouter();
  const t = useTranslations("portal");
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    data: inviteData,
    isLoading: inviteLoading,
    error: inviteError,
  } = api.member.verifyInvite.useQuery(
    { token: params.token },
    { retry: false }
  );

  const acceptMutation = api.member.acceptInvite.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      // Redirect to portal after 2 seconds
      setTimeout(() => {
        router.push(`/${params.locale}/portal/${data.organizationSlug}`);
      }, 2000);
    },
    onError: (err) => {
      setError(err.message);
      setAccepting(false);
    },
  });

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    acceptMutation.mutate({ token: params.token });
  };

  // Loading state
  if (inviteLoading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-pelorous-600" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired invite
  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-light text-gray-900">
            Invalid Invitation
          </h1>
          <p className="mt-3 text-gray-500">{inviteError.message}</p>
          <Link
            href={`/${params.locale}`}
            className="mt-6 inline-block rounded-xl bg-pelorous-600 px-6 py-3 text-white hover:bg-pelorous-700"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-light text-gray-900">
            Welcome to {inviteData?.organizationName}!
          </h1>
          <p className="mt-3 text-gray-500">
            Your account has been linked. Redirecting to your portal...
          </p>
          <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-pelorous-600" />
        </div>
      </div>
    );
  }

  // Not logged in - show login prompt
  if (!session?.user) {
    const returnUrl = encodeURIComponent(
      `/${params.locale}/portal/invite/${params.token}`
    );

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-light tracking-tight text-pelorous-600">
              Wattly
            </h1>
          </div>

          <div className="mb-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Community</p>
                <p className="font-medium text-gray-900">
                  {inviteData?.organizationName}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Invited as</p>
                <p className="font-medium text-gray-900">
                  {inviteData?.memberEmail}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-light text-gray-900">
            Sign in to accept your invitation
          </h2>
          <p className="mt-2 text-gray-500">
            Create an account or sign in to join {inviteData?.organizationName}.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href={`/${params.locale}/login?returnUrl=${returnUrl}`}
              className="block w-full rounded-xl bg-pelorous-600 py-3 text-center font-medium text-white hover:bg-pelorous-700"
            >
              Sign In
            </Link>
            <Link
              href={`/${params.locale}/register?returnUrl=${returnUrl}&email=${encodeURIComponent(inviteData?.memberEmail ?? "")}`}
              className="block w-full rounded-xl border border-gray-200 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Use the email address: {inviteData?.memberEmail}
          </p>
        </div>
      </div>
    );
  }

  // Logged in - show accept button
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-light tracking-tight text-pelorous-600">
            Wattly
          </h1>
        </div>

        <div className="mb-6 rounded-xl bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Community</p>
              <p className="font-medium text-gray-900">
                {inviteData?.organizationName}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Your account</p>
              <p className="font-medium text-gray-900">{session.user.email}</p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-light text-gray-900">
          Join {inviteData?.organizationName}
        </h2>
        <p className="mt-2 text-gray-500">
          Click below to link your account and access your energy portal.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-pelorous-600 py-3 font-medium text-white hover:bg-pelorous-700 disabled:opacity-50"
        >
          {accepting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Accept Invitation
            </>
          )}
        </button>

        {session.user.email !== inviteData?.memberEmail && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            Note: You are signed in as {session.user.email}, but the invitation
            was sent to {inviteData?.memberEmail}. You can still accept if this
            is your account.
          </p>
        )}
      </div>
    </div>
  );
}
