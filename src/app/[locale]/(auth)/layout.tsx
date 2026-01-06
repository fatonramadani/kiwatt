import { Link } from "~/i18n/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 bg-pelorous-950 lg:flex lg:flex-col lg:justify-between lg:p-16">
        <Link
          href="/"
          className="text-2xl font-light tracking-tight text-white"
        >
          wattly
        </Link>

        <div className="max-w-lg">
          <h1 className="text-4xl font-light leading-tight tracking-tight text-white lg:text-5xl">
            Manage your local energy community with elegance
          </h1>
          <p className="mt-8 text-lg font-light leading-relaxed text-pelorous-300">
            The complete solution for your CEL - track consumption, automate
            billing, and empower your community.
          </p>
        </div>

        <p className="text-xs font-light text-pelorous-500">
          &copy; {new Date().getFullYear()} Wattly
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex w-full items-center justify-center bg-pelorous-50/30 p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-12 lg:hidden">
            <Link
              href="/"
              className="text-2xl font-light tracking-tight text-pelorous-950"
            >
              wattly
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
