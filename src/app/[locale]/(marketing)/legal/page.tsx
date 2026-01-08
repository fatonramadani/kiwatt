import { setRequestLocale } from "next-intl/server";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-12">
        <h1 className="text-4xl font-light tracking-tight text-gray-900">
          Mentions légales
        </h1>
        <p className="mt-4 text-gray-500">
          Dernière mise à jour : Janvier 2025
        </p>

        <div className="mt-12 space-y-10 text-gray-600">
          <section>
            <h2 className="text-xl font-medium text-gray-900">
              1. Éditeur du site
            </h2>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Raison sociale :</strong> Flathunters Sàrl
              </p>
              <p>
                <strong>Forme juridique :</strong> Société à responsabilité
                limitée de droit suisse
              </p>
              <p>
                <strong>Siège social :</strong> Rue Sainte-Beuve 4, 1005
                Lausanne, Suisse
              </p>
              <p>
                <strong>Email :</strong> info@kiwatt.ch
              </p>
              <p>
                <strong>Site web :</strong> kiwatt.ch
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              2. Directeur de la publication
            </h2>
            <p className="mt-4">
              Le directeur de la publication est le représentant légal de
              Flathunters Sàrl.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">3. Hébergement</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p>
                  <strong>Application :</strong>
                </p>
                <p>Vercel Inc.</p>
                <p>440 N Barranca Ave #4133</p>
                <p>Covina, CA 91723, États-Unis</p>
                <p>vercel.com</p>
              </div>
              <div>
                <p>
                  <strong>Base de données :</strong>
                </p>
                <p>Supabase Inc.</p>
                <p>970 Toa Payoh North #07-04</p>
                <p>Singapour 318992</p>
                <p>supabase.com</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              4. Propriété intellectuelle
            </h2>
            <p className="mt-4">
              L&apos;ensemble du contenu du site kiwatt.ch (textes, images,
              graphismes, logo, icônes, logiciels, etc.) est la propriété
              exclusive de Flathunters Sàrl ou de ses partenaires et est protégé
              par les lois suisses et internationales relatives à la propriété
              intellectuelle.
            </p>
            <p className="mt-4">
              Toute reproduction, représentation, modification, publication,
              transmission ou dénaturation, totale ou partielle, du site ou de
              son contenu, par quelque procédé que ce soit, et sur quelque
              support que ce soit, est interdite sans l&apos;autorisation écrite
              préalable de Flathunters Sàrl.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              5. Limitation de responsabilité
            </h2>
            <p className="mt-4">
              Flathunters Sàrl s&apos;efforce d&apos;assurer l&apos;exactitude et
              la mise à jour des informations diffusées sur ce site.
              Flathunters Sàrl se réserve le droit de corriger le contenu à tout
              moment et sans préavis.
            </p>
            <p className="mt-4">
              Flathunters Sàrl décline toute responsabilité en cas
              d&apos;interruption ou d&apos;inaccessibilité du site, de
              survenance de bogues ou de tout dommage résultant d&apos;actes
              frauduleux de tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              6. Droit applicable et juridiction
            </h2>
            <p className="mt-4">
              Les présentes mentions légales sont régies par le droit suisse.
              Tout litige relatif à l&apos;utilisation du site kiwatt.ch sera
              soumis à la compétence exclusive des tribunaux de Lausanne,
              Suisse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">7. Contact</h2>
            <p className="mt-4">
              Pour toute question relative aux présentes mentions légales, vous
              pouvez nous contacter à l&apos;adresse suivante : info@kiwatt.ch
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
