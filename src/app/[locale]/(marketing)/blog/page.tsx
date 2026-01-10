import { setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { getAllBlogPosts } from "~/lib/blog-posts";
import { ArrowRight, Clock } from "lucide-react";

export default function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <BlogPageContent params={params} />;
}

async function BlogPageContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = getAllBlogPosts();

  return (
    <section className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12 max-w-2xl sm:mb-16">
          <p className="mb-4 flex items-center gap-3 text-sm font-light tracking-[0.3em] text-gray-400 uppercase">
            <span className="h-px w-8 bg-gray-300" />
            Blog
          </p>
          <h1 className="text-3xl leading-tight font-light tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Ressources pour gérer votre CEL
          </h1>
          <p className="mt-4 text-base font-light text-gray-500 sm:text-lg">
            Guides pratiques, tutoriels et actualités pour les gestionnaires de
            communautés électriques locales en Suisse.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-lg sm:p-8"
            >
              {/* Category Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    post.category === "guide"
                      ? "bg-sky-50 text-sky-600"
                      : post.category === "tutorial"
                        ? "bg-emerald-50 text-emerald-600"
                        : post.category === "news"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-violet-50 text-violet-600"
                  }`}
                >
                  {post.category === "guide"
                    ? "Guide"
                    : post.category === "tutorial"
                      ? "Tutoriel"
                      : post.category === "news"
                        ? "Actualité"
                        : "Étude de cas"}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-light text-gray-900 group-hover:text-gray-600">
                {post.title}
              </h2>

              {/* Excerpt */}
              <p className="mt-3 flex-1 text-sm leading-relaxed font-light text-gray-500">
                {post.excerpt}
              </p>

              {/* Meta */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime} min
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(post.date).toLocaleDateString("fr-CH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Link */}
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 flex items-center gap-2 text-sm font-light text-gray-900 transition-colors group-hover:text-gray-600"
              >
                Lire l&apos;article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center sm:p-12">
          <h3 className="text-2xl font-light text-gray-900">Restez informé</h3>
          <p className="mx-auto mt-3 max-w-md text-sm font-light text-gray-500">
            Recevez nos derniers articles et conseils pour la gestion de votre
            CEL directement dans votre boîte mail.
          </p>
          <a
            href="mailto:info@kiwatt.ch?subject=Inscription newsletter"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 text-sm font-light text-white transition-colors hover:bg-gray-800"
          >
            S&apos;inscrire à la newsletter
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
