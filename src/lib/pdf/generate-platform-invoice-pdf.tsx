import { renderToBuffer } from "@react-pdf/renderer";
import { SwissQRBill } from "swissqrbill/svg";
import sharp from "sharp";
import { PlatformInvoiceDocument, type PlatformInvoiceData } from "./platform-invoice-template";
import { createQRBillData, generateQRReference, isQrIban } from "./qr-bill";
import { env } from "~/env";

/**
 * Generate Swiss QR-bill as PNG buffer for platform invoices
 */
async function generatePlatformQRBillPng(invoice: PlatformInvoiceData): Promise<Buffer | null> {
  const iban = env.KIWATT_IBAN;

  if (!iban) {
    console.log("No KIWATT_IBAN configured, skipping QR-bill generation");
    return null;
  }

  try {
    // Only use QRR reference if IBAN is a QR-IBAN
    const useQrrReference = isQrIban(iban);

    const qrData = createQRBillData({
      // Kiwatt as creditor
      creditorName: env.KIWATT_COMPANY_NAME,
      creditorAddress: env.KIWATT_ADDRESS,
      creditorZip: env.KIWATT_POSTAL_CODE,
      creditorCity: env.KIWATT_CITY,
      iban: iban,
      // Organization as debtor
      debtorName: invoice.organization.name,
      debtorAddress: invoice.organization.address ?? undefined,
      debtorZip: invoice.organization.postalCode ?? undefined,
      debtorCity: invoice.organization.city ?? undefined,
      amount: invoice.totalAmount,
      currency: "CHF",
      // QRR reference only works with QR-IBAN, otherwise just use message
      reference: useQrrReference ? generateQRReference(invoice.invoiceNumber) : undefined,
      message: `Facture plateforme ${invoice.invoiceNumber}`,
    });

    const svg = new SwissQRBill(qrData, { language: "FR" });
    const svgString = svg.toString();

    // Convert SVG to PNG using sharp
    // QR-bill is 210mm x 105mm, at 300 DPI = 2480 x 1240 pixels
    const pngBuffer = await sharp(Buffer.from(svgString))
      .resize(2480, 1240)
      .png()
      .toBuffer();

    return pngBuffer;
  } catch (error) {
    console.error("Failed to generate platform QR-bill:", error);
    return null;
  }
}

/**
 * Generate a complete platform invoice PDF with Swiss QR-bill
 * The QR-bill is included as a second page if IBAN is configured
 */
export async function generatePlatformInvoicePdf(
  invoice: PlatformInvoiceData
): Promise<Buffer> {
  // Generate QR-bill PNG if IBAN is configured
  const qrBillPng = await generatePlatformQRBillPng(invoice);

  // Add QR-bill to invoice data
  const invoiceWithQrBill: PlatformInvoiceData = {
    ...invoice,
    qrBillPng: qrBillPng ?? undefined,
  };

  // Generate the invoice PDF using react-pdf
  const pdfBuffer = await renderToBuffer(
    <PlatformInvoiceDocument invoice={invoiceWithQrBill} />
  );

  return Buffer.from(pdfBuffer);
}
