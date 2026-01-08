import { setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
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
          Politique de confidentialité
        </h1>
        <p className="mt-4 text-gray-500">
          Dernière mise à jour : Janvier 2025
        </p>

        <div className="mt-12 space-y-10 text-gray-600">
          <section>
            <h2 className="text-xl font-medium text-gray-900">
              1. Responsable du traitement
            </h2>
            <div className="mt-4 space-y-2">
              <p>
                <strong>Flathunters Sàrl</strong>
              </p>
              <p>Rue Sainte-Beuve 4</p>
              <p>1005 Lausanne, Suisse</p>
              <p>Email : info@kiwatt.ch</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              2. Données collectées
            </h2>
            <p className="mt-4">
              Dans le cadre de l&apos;utilisation de la plateforme Kiwatt, nous
              collectons les données suivantes :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Données d&apos;identification :</strong> nom, prénom,
                adresse email, numéro de téléphone
              </li>
              <li>
                <strong>Données de localisation :</strong> adresse postale, code
                postal, ville, canton
              </li>
              <li>
                <strong>Données énergétiques :</strong> courbes de charge,
                consommation électrique, production solaire, numéro de point de
                livraison (POD)
              </li>
              <li>
                <strong>Données de facturation :</strong> historique des
                factures, montants, statuts de paiement
              </li>
              <li>
                <strong>Données techniques :</strong> adresse IP, type de
                navigateur, données de connexion
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              3. Finalités du traitement
            </h2>
            <p className="mt-4">Vos données sont traitées pour :</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Fournir et gérer le service de gestion de communauté électrique
                locale (CEL)
              </li>
              <li>
                Calculer la répartition de l&apos;énergie entre les membres de
                la CEL
              </li>
              <li>Générer et envoyer les factures</li>
              <li>Assurer le support client</li>
              <li>
                Améliorer nos services et développer de nouvelles
                fonctionnalités
              </li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              4. Base juridique
            </h2>
            <p className="mt-4">
              Conformément au Règlement général sur la protection des données
              (RGPD) et à la nouvelle Loi fédérale sur la protection des données
              (nLPD) suisse, le traitement de vos données repose sur :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>L&apos;exécution du contrat :</strong> les données sont
                nécessaires pour fournir le service
              </li>
              <li>
                <strong>L&apos;intérêt légitime :</strong> amélioration de nos
                services, sécurité
              </li>
              <li>
                <strong>Le consentement :</strong> pour les communications
                marketing (si applicable)
              </li>
              <li>
                <strong>L&apos;obligation légale :</strong> conservation des
                données de facturation
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              5. Durée de conservation
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Données de compte :</strong> conservées pendant la durée
                de la relation contractuelle, puis 3 ans après la clôture du
                compte
              </li>
              <li>
                <strong>Données de facturation :</strong> 10 ans (obligation
                légale suisse)
              </li>
              <li>
                <strong>Données énergétiques :</strong> 5 ans après la fin du
                contrat
              </li>
              <li>
                <strong>Logs techniques :</strong> 12 mois
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              6. Sous-traitants et transferts
            </h2>
            <p className="mt-4">
              Nous faisons appel aux sous-traitants suivants :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Vercel Inc.</strong> (États-Unis) - Hébergement de
                l&apos;application
              </li>
              <li>
                <strong>Supabase Inc.</strong> (Singapour) - Base de données
              </li>
              <li>
                <strong>Resend</strong> (États-Unis) - Envoi d&apos;emails
                transactionnels
              </li>
            </ul>
            <p className="mt-4">
              Ces transferts sont encadrés par des clauses contractuelles types
              approuvées par la Commission européenne et conformes aux exigences
              de la nLPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">7. Cookies</h2>
            <p className="mt-4">
              Kiwatt utilise des cookies strictement nécessaires au
              fonctionnement du service :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Cookies de session :</strong> authentification et
                maintien de la connexion
              </li>
              <li>
                <strong>Cookies de préférences :</strong> langue sélectionnée
              </li>
            </ul>
            <p className="mt-4">
              Nous n&apos;utilisons pas de cookies publicitaires ou de tracking
              tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">8. Vos droits</h2>
            <p className="mt-4">
              Conformément au RGPD et à la nLPD, vous disposez des droits
              suivants :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>Droit d&apos;accès :</strong> obtenir une copie de vos
                données
              </li>
              <li>
                <strong>Droit de rectification :</strong> corriger vos données
                inexactes
              </li>
              <li>
                <strong>Droit à l&apos;effacement :</strong> demander la
                suppression de vos données
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> recevoir vos données
                dans un format structuré
              </li>
              <li>
                <strong>Droit d&apos;opposition :</strong> vous opposer au
                traitement
              </li>
              <li>
                <strong>Droit de limitation :</strong> restreindre le traitement
              </li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : info@kiwatt.ch
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">9. Sécurité</h2>
            <p className="mt-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Chiffrement des données au repos</li>
              <li>Authentification sécurisée</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Sauvegardes régulières</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              10. Modifications
            </h2>
            <p className="mt-4">
              Nous nous réservons le droit de modifier cette politique de
              confidentialité à tout moment. Les modifications prendront effet
              dès leur publication sur cette page. Nous vous informerons des
              modifications importantes par email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-gray-900">11. Contact</h2>
            <p className="mt-4">
              Pour toute question relative à cette politique ou à vos données
              personnelles :
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

          <section>
            <h2 className="text-xl font-medium text-gray-900">
              12. Autorité de contrôle
            </h2>
            <p className="mt-4">
              Si vous estimez que le traitement de vos données personnelles
              constitue une violation de la législation en vigueur, vous avez le
              droit d&apos;introduire une réclamation auprès du Préposé fédéral
              à la protection des données et à la transparence (PFPDT) :
            </p>
            <div className="mt-4 space-y-2">
              <p>Préposé fédéral à la protection des données et à la transparence</p>
              <p>Feldeggweg 1</p>
              <p>3003 Berne, Suisse</p>
              <p>www.edoeb.admin.ch</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
