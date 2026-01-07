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

interface PaymentReminderProps {
  organizationName: string;
  memberName: string;
  invoiceNumber: string;
  totalChf: number;
  dueDate: string;
  daysOverdue: number;
  pdfUrl?: string;
  locale?: "fr" | "de" | "it" | "en";
}

const translations = {
  fr: {
    preview: "Rappel de paiement -",
    subject: "Rappel de paiement",
    greeting: "Bonjour",
    intro: "Nous souhaitons vous informer que la facture suivante est en attente de paiement",
    overdue: "jours de retard",
    invoiceNumber: "Numéro de facture",
    amount: "Montant dû",
    originalDueDate: "Échéance initiale",
    downloadPdf: "Voir la facture",
    paymentRequest: "Merci de procéder au règlement dans les plus brefs délais.",
    questions: "Si vous avez déjà effectué le paiement, veuillez ignorer ce message.",
    regards: "Cordialement",
  },
  de: {
    preview: "Zahlungserinnerung -",
    subject: "Zahlungserinnerung",
    greeting: "Guten Tag",
    intro: "Wir möchten Sie darauf hinweisen, dass folgende Rechnung noch offen ist",
    overdue: "Tage überfällig",
    invoiceNumber: "Rechnungsnummer",
    amount: "Ausstehender Betrag",
    originalDueDate: "Ursprüngliches Fälligkeitsdatum",
    downloadPdf: "Rechnung anzeigen",
    paymentRequest: "Bitte begleichen Sie den Betrag zeitnah.",
    questions: "Falls Sie bereits bezahlt haben, ignorieren Sie bitte diese Nachricht.",
    regards: "Mit freundlichen Grüssen",
  },
  it: {
    preview: "Sollecito di pagamento -",
    subject: "Sollecito di pagamento",
    greeting: "Buongiorno",
    intro: "Desideriamo informarla che la seguente fattura è in attesa di pagamento",
    overdue: "giorni di ritardo",
    invoiceNumber: "Numero fattura",
    amount: "Importo dovuto",
    originalDueDate: "Scadenza originale",
    downloadPdf: "Visualizza fattura",
    paymentRequest: "La preghiamo di procedere al pagamento al più presto.",
    questions: "Se ha già effettuato il pagamento, ignori questo messaggio.",
    regards: "Cordiali saluti",
  },
  en: {
    preview: "Payment reminder -",
    subject: "Payment reminder",
    greeting: "Hello",
    intro: "We would like to inform you that the following invoice is awaiting payment",
    overdue: "days overdue",
    invoiceNumber: "Invoice number",
    amount: "Amount due",
    originalDueDate: "Original due date",
    downloadPdf: "View invoice",
    paymentRequest: "Please proceed with the payment at your earliest convenience.",
    questions: "If you have already made the payment, please disregard this message.",
    regards: "Best regards",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}

export function PaymentReminderEmail({
  organizationName,
  memberName,
  invoiceNumber,
  totalChf,
  dueDate,
  daysOverdue,
  pdfUrl,
  locale = "fr",
}: PaymentReminderProps) {
  const t = translations[locale];

  return (
    <Html>
      <Head />
      <Preview>
        {t.preview} {invoiceNumber}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>{organizationName}</Heading>
          </Section>

          {/* Alert Banner */}
          <Section style={styles.alertBanner}>
            <Text style={styles.alertText}>
              {t.subject} - {daysOverdue} {t.overdue}
            </Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>
              {t.greeting} {memberName},
            </Text>

            <Text style={styles.text}>{t.intro}:</Text>

            {/* Invoice Details */}
            <Section style={styles.details}>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td style={styles.label}>{t.invoiceNumber}</td>
                    <td style={styles.value}>{invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={styles.label}>{t.amount}</td>
                    <td style={styles.valueHighlight}>{formatCurrency(totalChf)}</td>
                  </tr>
                  <tr>
                    <td style={styles.label}>{t.originalDueDate}</td>
                    <td style={styles.valueWarning}>{dueDate}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={styles.paymentRequest}>{t.paymentRequest}</Text>

            {/* Download Button */}
            {pdfUrl && (
              <Section style={styles.buttonSection}>
                <Button href={pdfUrl} style={styles.button}>
                  {t.downloadPdf}
                </Button>
              </Section>
            )}

            <Hr style={styles.hr} />

            <Text style={styles.footer}>{t.questions}</Text>
            <Text style={styles.footer}>
              {t.regards},
              <br />
              {organizationName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "0",
    width: "600px",
    maxWidth: "100%",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  },
  header: {
    backgroundColor: "#1f2937",
    borderRadius: "8px 8px 0 0",
    padding: "32px 40px",
  },
  logo: {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "500",
    margin: "0",
  },
  alertBanner: {
    backgroundColor: "#fef3c7",
    borderBottom: "1px solid #fcd34d",
    padding: "12px 40px",
  },
  alertText: {
    color: "#92400e",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0",
    textAlign: "center" as const,
  },
  content: {
    padding: "40px",
  },
  greeting: {
    color: "#1f2937",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px 0",
  },
  text: {
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: "24px",
    margin: "0 0 24px 0",
  },
  details: {
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    padding: "24px",
    margin: "0 0 24px 0",
    border: "1px solid #fee2e2",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  label: {
    color: "#6b7280",
    fontSize: "13px",
    padding: "8px 0",
  },
  value: {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "right" as const,
    padding: "8px 0",
  },
  valueHighlight: {
    color: "#dc2626",
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "right" as const,
    padding: "8px 0",
  },
  valueWarning: {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "right" as const,
    padding: "8px 0",
  },
  paymentRequest: {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "24px",
    margin: "0 0 24px 0",
  },
  buttonSection: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: "#1f2937",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    padding: "12px 24px",
    textDecoration: "none",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "24px 0",
  },
  footer: {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "0 0 16px 0",
  },
};

export default PaymentReminderEmail;
