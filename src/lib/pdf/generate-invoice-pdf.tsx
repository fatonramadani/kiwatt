import { renderToBuffer } from "@react-pdf/renderer";
import { put } from "@vercel/blob";
import { SwissQRBill } from "swissqrbill/svg";
import sharp from "sharp";
import { InvoiceDocument, type InvoiceData } from "./invoice-template";
import { createQRBillData, generateQRReference, isQrIban } from "./qr-bill";

interface GenerateInvoicePdfOptions {
  invoice: InvoiceData;
  uploadToBlob?: boolean;
}

interface GenerateInvoicePdfResult {
  buffer: Buffer;
  url?: string;
}

/**
 * Generate Swiss QR-bill as PNG buffer
 */
async function generateQRBillPng(invoice: InvoiceData): Promise<Buffer | null> {
  const billing = invoice.organization.billingSettings;
  const iban = billing?.iban;

  if (!iban) {
    return null;
  }

  try {
    // Only use QRR reference if IBAN is a QR-IBAN
    const useQrrReference = isQrIban(iban);

    const qrData = createQRBillData({
      creditorName: billing?.payeeName ?? invoice.organization.name,
      creditorAddress: billing?.payeeAddress ?? invoice.organization.address ?? "",
      creditorZip: billing?.payeeZip ?? invoice.organization.postalCode ?? "",
      creditorCity: billing?.payeeCity ?? invoice.organization.city ?? "",
      iban: iban,
      debtorName: `${invoice.member.firstname} ${invoice.member.lastname}`,
      debtorAddress: invoice.member.address ?? undefined,
      debtorZip: invoice.member.postalCode ?? undefined,
      debtorCity: invoice.member.city ?? undefined,
      amount: invoice.totalChf,
      currency: "CHF",
      // QRR reference only works with QR-IBAN, otherwise just use message
      reference: useQrrReference ? generateQRReference(invoice.invoiceNumber) : undefined,
      message: `Facture ${invoice.invoiceNumber}`,
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
    console.error("Failed to generate QR-bill:", error);
    return null;
  }
}

/**
 * Generate a complete invoice PDF with Swiss QR-bill
 * The QR-bill is included as a second page if IBAN is configured
 */
export async function generateInvoicePdf(
  options: GenerateInvoicePdfOptions
): Promise<GenerateInvoicePdfResult> {
  const { invoice, uploadToBlob = true } = options;

  // Generate QR-bill PNG if IBAN is configured
  const qrBillPng = await generateQRBillPng(invoice);

  // Add QR-bill to invoice data
  const invoiceWithQrBill: InvoiceData = {
    ...invoice,
    qrBillPng: qrBillPng ?? undefined,
  };

  // Generate the invoice PDF using react-pdf
  const pdfBuffer = await renderToBuffer(
    <InvoiceDocument invoice={invoiceWithQrBill} />
  );

  const finalPdfBuffer = Buffer.from(pdfBuffer);

  // Upload to Vercel Blob if enabled
  let url: string | undefined;
  if (uploadToBlob && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(
        `invoices/${invoice.organization.name.toLowerCase().replace(/\s+/g, "-")}/${invoice.invoiceNumber}.pdf`,
        finalPdfBuffer,
        {
          access: "public",
          contentType: "application/pdf",
        }
      );
      url = blob.url;
    } catch (error) {
      console.error("Failed to upload PDF to blob storage:", error);
    }
  }

  return {
    buffer: finalPdfBuffer,
    url,
  };
}

/**
 * Generate PDF without uploading (for preview/download)
 */
export async function generateInvoicePdfBuffer(
  invoice: InvoiceData
): Promise<Buffer> {
  const result = await generateInvoicePdf({
    invoice,
    uploadToBlob: false,
  });
  return result.buffer;
}
