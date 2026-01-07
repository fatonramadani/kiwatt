import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "./resend";
import { InvoiceEmail } from "./templates/invoice-email";
import { PaymentReminderEmail } from "./templates/payment-reminder";

interface SendInvoiceEmailParams {
  to: string;
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

interface SendPaymentReminderParams {
  to: string;
  organizationName: string;
  memberName: string;
  invoiceNumber: string;
  totalChf: number;
  dueDate: string;
  daysOverdue: number;
  pdfUrl?: string;
  locale?: "fr" | "de" | "it" | "en";
}

const subjects = {
  invoice: {
    fr: "Nouvelle facture",
    de: "Neue Rechnung",
    it: "Nuova fattura",
    en: "New invoice",
  },
  reminder: {
    fr: "Rappel de paiement",
    de: "Zahlungserinnerung",
    it: "Sollecito di pagamento",
    en: "Payment reminder",
  },
};

/**
 * Send invoice email to a member
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  if (!resend) {
    console.warn("Resend not configured, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  const locale = params.locale ?? "fr";
  const subject = `${subjects.invoice[locale]} - ${params.invoiceNumber}`;

  try {
    const html = await render(
      InvoiceEmail({
        organizationName: params.organizationName,
        memberName: params.memberName,
        invoiceNumber: params.invoiceNumber,
        totalChf: params.totalChf,
        dueDate: params.dueDate,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        pdfUrl: params.pdfUrl,
        locale,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send payment reminder email to a member
 */
export async function sendPaymentReminderEmail(params: SendPaymentReminderParams) {
  if (!resend) {
    console.warn("Resend not configured, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  const locale = params.locale ?? "fr";
  const subject = `${subjects.reminder[locale]} - ${params.invoiceNumber}`;

  try {
    const html = await render(
      PaymentReminderEmail({
        organizationName: params.organizationName,
        memberName: params.memberName,
        invoiceNumber: params.invoiceNumber,
        totalChf: params.totalChf,
        dueDate: params.dueDate,
        daysOverdue: params.daysOverdue,
        pdfUrl: params.pdfUrl,
        locale,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      html,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send payment reminder email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if email sending is available
 */
export function isEmailConfigured(): boolean {
  return resend !== null;
}
