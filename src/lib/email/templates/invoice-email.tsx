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

interface InvoiceEmailProps {
  organizationName: string;
  memberName: string;
  invoiceNumber: string;
  totalChf: number;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl?: string;
  locale?: "fr" | "de" | "it" | "en";
}

const translations = {
  fr: {
    preview: "Nouvelle facture de",
    greeting: "Bonjour",
    intro: "Veuillez trouver ci-joint votre facture d'énergie pour la période",
    invoiceNumber: "Numéro de facture",
    amount: "Montant total",
    dueDate: "Date d'échéance",
    downloadPdf: "Télécharger la facture",
    questions: "En cas de questions, n'hésitez pas à nous contacter.",
    regards: "Cordialement",
  },
  de: {
    preview: "Neue Rechnung von",
    greeting: "Guten Tag",
    intro: "Anbei finden Sie Ihre Energierechnung für den Zeitraum",
    invoiceNumber: "Rechnungsnummer",
    amount: "Gesamtbetrag",
    dueDate: "Fälligkeitsdatum",
    downloadPdf: "Rechnung herunterladen",
    questions: "Bei Fragen stehen wir Ihnen gerne zur Verfügung.",
    regards: "Mit freundlichen Grüssen",
  },
  it: {
    preview: "Nuova fattura da",
    greeting: "Buongiorno",
    intro: "In allegato troverete la vostra fattura energetica per il periodo",
    invoiceNumber: "Numero fattura",
    amount: "Importo totale",
    dueDate: "Data di scadenza",
    downloadPdf: "Scarica la fattura",
    questions: "Per qualsiasi domanda, non esitate a contattarci.",
    regards: "Cordiali saluti",
  },
  en: {
    preview: "New invoice from",
    greeting: "Hello",
    intro: "Please find attached your energy invoice for the period",
    invoiceNumber: "Invoice number",
    amount: "Total amount",
    dueDate: "Due date",
    downloadPdf: "Download invoice",
    questions: "If you have any questions, please don't hesitate to contact us.",
    regards: "Best regards",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}

export function InvoiceEmail({
  organizationName,
  memberName,
  invoiceNumber,
  totalChf,
  dueDate,
  periodStart,
  periodEnd,
  pdfUrl,
  locale = "fr",
}: InvoiceEmailProps) {
  const t = translations[locale];

  return (
    <Html>
      <Head />
      <Preview>
        {t.preview} {organizationName} - {invoiceNumber}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>{organizationName}</Heading>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>
              {t.greeting} {memberName},
            </Text>

            <Text style={styles.text}>
              {t.intro} {periodStart} - {periodEnd}.
            </Text>

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
                    <td style={styles.label}>{t.dueDate}</td>
                    <td style={styles.value}>{dueDate}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

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
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "24px",
    margin: "0 0 24px 0",
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
    color: "#1f2937",
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "right" as const,
    padding: "8px 0",
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

export default InvoiceEmail;
