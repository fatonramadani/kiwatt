import { setRequestLocale } from "next-intl/server";

export default async function TermsPage({
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
          Conditions générales d&apos;utilisation
        </h1>
        <p className="mt-4 text-gray-500">
          Dernière mise à jour : Janvier 2025
        </p>

        <div className="mt-12 space-y-10 text-gray-600">
          <section>
            <h2 className="text-xl font-medium text-gray-900">
              1. Objet et acceptation
            </h2>
            <p className="mt-4">
              Les présentes conditions générales d&apos;utilisation (CGU)
              régissent l&apos;accès et l&apos;utilisation de la plateforme
              Kiwatt, éditée par Flathunters Sàrl.
            </p>
            <p className="mt-4">
              Kiwatt est une plateforme de gestion pour les communautés
              électriques locales (CEL) en Suisse, permettant notamment la
              gestion des membres, l&apos;import des courbes de charge, le
              calcul de la répartition énergétique et la génération de factures.
            </p>
            <p className="mt-4">
              L&apos;utilisation de la plateforme implique l&apos;acceptation
              pleine et entière des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              2. Inscription et compte
            </h2>
            <p className="mt-4">
              Pour utiliser Kiwatt, vous devez créer un compte en fournissant
              des informations exactes et complètes. Vous êtes responsable de la
              confidentialité de vos identifiants de connexion.
            </p>
            <p className="mt-4">Vous vous engagez à :</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Fournir des informations véridiques lors de l&apos;inscription
              </li>
              <li>Maintenir vos informations à jour</li>
              <li>Ne pas partager vos identifiants de connexion</li>
              <li>
                Nous informer immédiatement de toute utilisation non autorisée
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              3. Description du service
            </h2>
            <p className="mt-4">Kiwatt offre les fonctionnalités suivantes :</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Gestion des membres de la CEL (import, export, édition)</li>
              <li>
                Import des courbes de charge au format CSV depuis votre GRD
              </li>
              <li>
                Calcul automatique de la répartition énergétique selon 3
                stratégies (pro-rata, égale, prioritaire)
              </li>
              <li>
                Génération de factures avec QR-facture suisse au format PDF
              </li>
              <li>Tableau de bord pour les gestionnaires et les membres</li>
              <li>Portail membre pour la consultation des données</li>
              <li>Support multilingue (français, allemand, italien, anglais)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">4. Tarification</h2>
            <p className="mt-4">
              L&apos;utilisation de Kiwatt est facturée selon les modalités
              suivantes :
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 p-6">
              <p className="font-medium text-gray-900">
                CHF 0.005 par kWh géré
              </p>
              <p className="mt-2 text-sm">
                Minimum : CHF 49 par mois (hors TVA)
              </p>
              <p className="mt-2 text-sm">TVA : 8.1% (taux suisse en vigueur)</p>
            </div>
            <p className="mt-4">
              Les factures sont émises mensuellement et payables dans un délai
              de 30 jours.
            </p>
            <p className="mt-4">
              Flathunters Sàrl se réserve le droit de modifier les tarifs avec
              un préavis de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              5. Obligations de l&apos;utilisateur
            </h2>
            <p className="mt-4">
              En utilisant Kiwatt, vous vous engagez à :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Utiliser le service conformément à sa destination</li>
              <li>
                Ne pas tenter d&apos;accéder aux données d&apos;autres
                utilisateurs
              </li>
              <li>
                Ne pas utiliser le service à des fins illégales ou nuisibles
              </li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>
                Fournir des données exactes (courbes de charge, informations
                membres)
              </li>
              <li>
                Respecter la législation applicable, notamment en matière de
                protection des données
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              6. Propriété des données
            </h2>
            <p className="mt-4">
              Vous restez propriétaire de toutes les données que vous importez
              ou créez sur la plateforme (données membres, courbes de charge,
              factures).
            </p>
            <p className="mt-4">
              Vous accordez à Flathunters Sàrl une licence limitée pour traiter
              ces données dans le cadre de la fourniture du service.
            </p>
            <p className="mt-4">
              Vous pouvez à tout moment exporter vos données ou demander leur
              suppression.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              7. Disponibilité et maintenance
            </h2>
            <p className="mt-4">
              Flathunters Sàrl s&apos;efforce de maintenir la plateforme
              disponible 24h/24, 7j/7. Toutefois, nous ne garantissons pas une
              disponibilité ininterrompue.
            </p>
            <p className="mt-4">
              Des interruptions peuvent survenir pour maintenance, mise à jour
              ou en cas de force majeure. Nous nous efforçons de prévenir les
              utilisateurs des maintenances planifiées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              8. Limitation de responsabilité
            </h2>
            <p className="mt-4">
              Dans les limites autorisées par la loi suisse :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Kiwatt est fourni « en l&apos;état », sans garantie de résultat
              </li>
              <li>
                Flathunters Sàrl n&apos;est pas responsable des erreurs de
                calcul résultant de données incorrectes fournies par
                l&apos;utilisateur
              </li>
              <li>
                Flathunters Sàrl n&apos;est pas responsable des dommages
                indirects (perte de revenus, perte de données)
              </li>
              <li>
                La responsabilité totale de Flathunters Sàrl est limitée au
                montant des frais payés par l&apos;utilisateur au cours des 12
                derniers mois
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">9. Résiliation</h2>
            <p className="mt-4">
              <strong>Par l&apos;utilisateur :</strong> vous pouvez résilier
              votre compte à tout moment. La résiliation prend effet à la fin du
              mois en cours.
            </p>
            <p className="mt-4">
              <strong>Par Flathunters Sàrl :</strong> nous pouvons suspendre ou
              résilier votre compte en cas de violation des présentes CGU, avec
              un préavis de 30 jours sauf en cas de violation grave.
            </p>
            <p className="mt-4">
              En cas de résiliation, vous pouvez exporter vos données pendant 30
              jours. Passé ce délai, vos données seront supprimées conformément
              à notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              10. Modifications des CGU
            </h2>
            <p className="mt-4">
              Flathunters Sàrl se réserve le droit de modifier les présentes CGU
              à tout moment. Les modifications prendront effet 30 jours après
              leur publication.
            </p>
            <p className="mt-4">
              Votre utilisation continue du service après cette période vaut
              acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              11. Droit applicable et juridiction
            </h2>
            <p className="mt-4">
              Les présentes CGU sont régies par le droit suisse.
            </p>
            <p className="mt-4">
              Tout litige relatif à l&apos;interprétation ou à
              l&apos;exécution des présentes CGU sera soumis à la compétence
              exclusive des tribunaux de Lausanne, Suisse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">12. Contact</h2>
            <p className="mt-4">
              Pour toute question relative aux présentes CGU :
            </p>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Flathunters Sàrl</strong>
              </p>
              <p>Rue Sainte-Beuve 4</p>
              <p>1005 Lausanne, Suisse</p>
              <p>Email : info@kiwatt.ch</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
