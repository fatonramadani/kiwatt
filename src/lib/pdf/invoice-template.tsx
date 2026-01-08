import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// Use Helvetica - a built-in font that doesn't require network requests
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    paddingBottom: 120, // Space for QR-bill
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  orgDetails: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  addressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  addressBlock: {
    width: "45%",
  },
  addressLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  addressName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 1,
  },
  detailsGrid: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 8,
    color: "#9ca3af",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 10,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
  },
  colDescription: { width: "45%" },
  colQuantity: { width: "15%", textAlign: "right" },
  colUnitPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  creditAmount: {
    color: "#059669",
  },
  totalsSection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 10,
    color: "#111827",
  },
  totalsFinal: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 4,
  },
  totalsFinalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  totalsFinalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  periodBadge: {
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  qrBillPage: {
    padding: 0,
    display: "flex",
    justifyContent: "flex-end",
  },
  qrBillImage: {
    width: "100%",
  },
});

export interface InvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  subtotalChf: number;
  vatAmountChf: number;
  totalChf: number;
  qrBillPng?: Buffer; // Pre-generated QR-bill PNG
  organization: {
    name: string;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    billingSettings?: {
      vatRate?: number;
      iban?: string;
      payeeName?: string;
      payeeAddress?: string;
      payeeZip?: string;
      payeeCity?: string;
    } | null;
  };
  member: {
    firstname: string;
    lastname: string;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    email: string;
    podNumber: string;
  };
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPriceChf: number;
    totalChf: number;
    lineType: string;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-CH");
}

function formatPeriod(start: Date, end: Date): string {
  const startDate = new Date(start);
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const vatRate = invoice.organization.billingSettings?.vatRate ?? 7.7;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{invoice.organization.name}</Text>
            <View style={styles.orgDetails}>
              {invoice.organization.address && (
                <Text>{invoice.organization.address}</Text>
              )}
              {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
              {(invoice.organization.postalCode ||
                invoice.organization.city) && (
                <Text>
                  {invoice.organization.postalCode} {invoice.organization.city}
                </Text>
              )}
              {invoice.organization.contactEmail && (
                <Text>{invoice.organization.contactEmail}</Text>
              )}
              {invoice.organization.contactPhone && (
                <Text>{invoice.organization.contactPhone}</Text>
              )}
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Facture</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.addressSection}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Destinataire</Text>
            <Text style={styles.addressName}>
              {invoice.member.firstname} {invoice.member.lastname}
            </Text>
            {invoice.member.address && (
              <Text style={styles.addressLine}>{invoice.member.address}</Text>
            )}
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
            {(invoice.member.postalCode || invoice.member.city) && (
              <Text style={styles.addressLine}>
                {invoice.member.postalCode} {invoice.member.city}
              </Text>
            )}
            <Text style={[styles.addressLine, { marginTop: 4 }]}>
              {invoice.member.email}
            </Text>
            <Text
              style={[styles.addressLine, { fontSize: 8, color: "#9ca3af" }]}
            >
              POD: {invoice.member.podNumber}
            </Text>
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.periodBadge}>
              {formatPeriod(invoice.periodStart, invoice.periodEnd)}
            </Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>No. de facture</Text>
            <Text style={styles.detailValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date d&apos;émission</Text>
            <Text style={styles.detailValue}>
              {formatDate(invoice.createdAt)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Échéance</Text>
            <Text style={styles.detailValue}>
              {formatDate(invoice.dueDate)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Période</Text>
            <Text style={styles.detailValue}>
              {formatDate(invoice.periodStart)} -{" "}
              {formatDate(invoice.periodEnd)}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>
              Quantité
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>
              Prix unitaire
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {invoice.lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {line.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>
                {line.quantity.toFixed(2)} {line.unit}
              </Text>
              <Text style={[styles.tableCell, styles.colUnitPrice]}>
                {formatCurrency(line.unitPriceChf)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colTotal,
                  line.lineType === "production_credit"
                    ? styles.creditAmount
                    : {},
                ]}
              >
                {line.lineType === "production_credit" ? "-" : ""}
                {formatCurrency(Math.abs(line.totalChf))}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Sous-total</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.subtotalChf)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>TVA ({vatRate}%)</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.vatAmountChf)}
            </Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>
              {formatCurrency(invoice.totalChf)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Merci pour votre confiance. En cas de questions, contactez-nous à{" "}
            {invoice.organization.contactEmail ?? "contact@kiwatt.ch"}
          </Text>
        </View>
      </Page>

      {/* QR-Bill Page */}
      {invoice.qrBillPng && (
        <Page size="A4" style={styles.qrBillPage}>
          <Image src={invoice.qrBillPng} style={styles.qrBillImage} />
        </Page>
      )}
    </Document>
  );
}
