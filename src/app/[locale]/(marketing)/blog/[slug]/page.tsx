import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "~/i18n/navigation";
import { getBlogPost, getAllBlogPosts } from "~/lib/blog-posts";
import { ArrowLeft, Clock, User } from "lucide-react";

export function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-12">
        {/* Back Link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm font-light text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          {/* Category Badge */}
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

          {/* Title */}
          <h1 className="mt-4 text-3xl font-light leading-tight tracking-tight text-gray-900 sm:text-4xl">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {post.author}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.readTime} min de lecture
            </div>
            <span>
              {new Date(post.date).toLocaleDateString("fr-CH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-gray max-w-none prose-headings:font-light prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:font-light prose-p:leading-relaxed prose-li:font-light prose-strong:font-medium">
          <div
            dangerouslySetInnerHTML={{
              __html: post.content
                .replace(/^## /gm, '<h2 class="mt-10 mb-4">')
                .replace(/^### /gm, '<h3 class="mt-8 mb-3">')
                .replace(
                  /```([^`]+)```/g,
                  '<pre class="bg-gray-50 rounded-xl p-4 overflow-x-auto text-sm"><code>$1</code></pre>'
                )
                .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                .replace(
                  /^- (.+)$/gm,
                  '<li class="ml-4 list-disc text-gray-600">$1</li>'
                )
                .replace(
                  /^(\d+)\. (.+)$/gm,
                  '<li class="ml-4 list-decimal text-gray-600">$2</li>'
                )
                .replace(/\n\n/g, '</p><p class="mt-4 text-gray-600">')
                .replace(/<\/h2>\n/g, "</h2>")
                .replace(/<\/h3>\n/g, "</h3>"),
            }}
          />
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
          <h3 className="text-xl font-light text-gray-900">
            Prêt à automatiser votre CEL?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm font-light text-gray-500">
            Rejoignez le programme alpha Kiwatt et bénéficiez d&apos;un
            accompagnement personnalisé.
          </p>
          <a
            href="mailto:info@kiwatt.ch?subject=Demande d'accès au programme Alpha Kiwatt"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3 text-sm font-light text-white transition-colors hover:bg-gray-800"
          >
            Rejoindre l&apos;alpha
          </a>
        </div>

        {/* Back to Blog */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-light text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voir tous les articles
          </Link>
        </div>
      </div>
    </article>
  );
}
