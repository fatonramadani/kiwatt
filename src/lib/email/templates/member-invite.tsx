import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

interface MemberInviteEmailProps {
  memberName: string;
  organizationName: string;
  inviteUrl: string;
  locale?: "fr" | "de" | "it" | "en";
}

const translations = {
  fr: {
    preview: "Vous êtes invité à rejoindre",
    greeting: "Bonjour",
    intro: "Vous avez été invité à rejoindre la communauté énergétique locale",
    description:
      "En tant que membre, vous pourrez consulter votre consommation d'énergie, télécharger vos factures et suivre vos économies.",
    action: "Accepter l'invitation",
    expiry: "Ce lien expire dans 7 jours.",
    ignore:
      "Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.",
    regards: "Cordialement",
    team: "L'équipe Kiwatt",
  },
  de: {
    preview: "Sie sind eingeladen beizutreten",
    greeting: "Guten Tag",
    intro: "Sie wurden eingeladen, der lokalen Energiegemeinschaft beizutreten",
    description:
      "Als Mitglied können Sie Ihren Energieverbrauch einsehen, Ihre Rechnungen herunterladen und Ihre Einsparungen verfolgen.",
    action: "Einladung annehmen",
    expiry: "Dieser Link läuft in 7 Tagen ab.",
    ignore:
      "Wenn Sie diese Einladung nicht angefordert haben, können Sie diese E-Mail ignorieren.",
    regards: "Mit freundlichen Grüssen",
    team: "Das Kiwatt Team",
  },
  it: {
    preview: "Sei invitato a unirti",
    greeting: "Buongiorno",
    intro: "Sei stato invitato a unirti alla comunità energetica locale",
    description:
      "Come membro, potrai consultare il tuo consumo energetico, scaricare le tue fatture e monitorare i tuoi risparmi.",
    action: "Accetta l'invito",
    expiry: "Questo link scade tra 7 giorni.",
    ignore: "Se non hai richiesto questo invito, puoi ignorare questa email.",
    regards: "Cordiali saluti",
    team: "Il team kiwatt",
  },
  en: {
    preview: "You're invited to join",
    greeting: "Hello",
    intro: "You have been invited to join the local energy community",
    description:
      "As a member, you'll be able to view your energy consumption, download your invoices, and track your savings.",
    action: "Accept invitation",
    expiry: "This link expires in 7 days.",
    ignore: "If you didn't request this invitation, you can ignore this email.",
    regards: "Best regards",
    team: "The kiwatt Team",
  },
};

export function MemberInviteEmail({
  memberName,
  organizationName,
  inviteUrl,
  locale = "fr",
}: MemberInviteEmailProps) {
  const t = translations[locale];

  return (
    <Html>
      <Head />
      <Preview>
        {t.preview} {organizationName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.logo}>kiwatt</Heading>
          </Section>

          <Section style={styles.content}>
            <Heading style={styles.heading}>
              {t.greeting} {memberName},
            </Heading>

            <Text style={styles.text}>
              {t.intro} <strong>{organizationName}</strong>.
            </Text>

            <Text style={styles.text}>{t.description}</Text>

            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={inviteUrl}>
                {t.action}
              </Button>
            </Section>

            <Text style={styles.smallText}>{t.expiry}</Text>

            <Hr style={styles.hr} />

            <Text style={styles.text}>{t.ignore}</Text>

            <Text style={styles.text}>
              {t.regards}
              <br />
              {t.team}
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} kiwatt. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "580px",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "32px",
  },
  logo: {
    color: "#0891b2",
    fontSize: "28px",
    fontWeight: "300",
    letterSpacing: "-0.5px",
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "40px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  heading: {
    color: "#18181b",
    fontSize: "24px",
    fontWeight: "400",
    marginBottom: "24px",
  },
  text: {
    color: "#3f3f46",
    fontSize: "16px",
    lineHeight: "24px",
    marginBottom: "16px",
  },
  smallText: {
    color: "#71717a",
    fontSize: "14px",
    textAlign: "center" as const,
    marginTop: "16px",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: "#0891b2",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "500",
    padding: "14px 32px",
    textDecoration: "none",
  },
  hr: {
    borderColor: "#e4e4e7",
    margin: "32px 0",
  },
  footer: {
    textAlign: "center" as const,
    marginTop: "32px",
  },
  footerText: {
    color: "#a1a1aa",
    fontSize: "12px",
  },
};

export default MemberInviteEmail;
