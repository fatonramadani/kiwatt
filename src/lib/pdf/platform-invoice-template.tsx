import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { env } from "~/env";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    paddingBottom: 120,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  companyDetails: {
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
  colDescription: { width: "50%" },
  colQuantity: { width: "15%", textAlign: "right" },
  colUnitPrice: { width: "17%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
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
    backgroundColor: "#ecfdf5",
    color: "#059669",
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
  note: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  noteText: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
});

export interface PlatformInvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  dueDate: Date;
  year: number;
  month: number;
  status: string;
  totalKwhManaged: number;
  ratePerKwh: number;
  calculatedAmount: number;
  minimumAmount: number;
  finalAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  qrBillPng?: Buffer;
  organization: {
    name: string;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    contactEmail?: string | null;
  };
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

function getMonthName(month: number): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return months[month - 1] ?? "";
}

export function PlatformInvoiceDocument({ invoice }: { invoice: PlatformInvoiceData }) {
  const kiwatt = {
    name: env.KIWATT_COMPANY_NAME,
    address: env.KIWATT_ADDRESS,
    postalCode: env.KIWATT_POSTAL_CODE,
    city: env.KIWATT_CITY,
    email: env.KIWATT_EMAIL,
  };

  const usedMinimum = invoice.calculatedAmount < invoice.minimumAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{kiwatt.name}</Text>
            <View style={styles.companyDetails}>
              <Text>{kiwatt.address}</Text>
              <Text>{kiwatt.postalCode} {kiwatt.city}</Text>
              <Text>{kiwatt.email}</Text>
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
            <Text style={styles.addressLabel}>De</Text>
            <Text style={styles.addressName}>{kiwatt.name}</Text>
            <Text style={styles.addressLine}>{kiwatt.address}</Text>
            <Text style={styles.addressLine}>{kiwatt.postalCode} {kiwatt.city}</Text>
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>À</Text>
            <Text style={styles.addressName}>{invoice.organization.name}</Text>
            {invoice.organization.address && (
              <Text style={styles.addressLine}>{invoice.organization.address}</Text>
            )}
            {(invoice.organization.postalCode ?? invoice.organization.city) && (
              <Text style={styles.addressLine}>
                {invoice.organization.postalCode} {invoice.organization.city}
              </Text>
            )}
            {invoice.organization.contactEmail && (
              <Text style={styles.addressLine}>{invoice.organization.contactEmail}</Text>
            )}
          </View>
        </View>

        {/* Period Badge */}
        <Text style={styles.periodBadge}>
          Période: {getMonthName(invoice.month)} {invoice.year}
        </Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date de facturation</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Échéance</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Statut</Text>
            <Text style={styles.detailValue}>
              {invoice.status === "paid" ? "Payée" : invoice.status === "sent" ? "Envoyée" : "Brouillon"}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Quantité</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>Prix unitaire</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Usage Line */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDescription]}>
              Frais de gestion plateforme Kiwatt
            </Text>
            <Text style={[styles.tableCell, styles.colQuantity]}>
              {invoice.totalKwhManaged.toLocaleString("fr-CH", { maximumFractionDigits: 2 })} kWh
            </Text>
            <Text style={[styles.tableCell, styles.colUnitPrice]}>
              {formatCurrency(invoice.ratePerKwh)}/kWh
            </Text>
            <Text style={[styles.tableCell, styles.colTotal]}>
              {formatCurrency(invoice.calculatedAmount)}
            </Text>
          </View>

          {/* Minimum Adjustment Line (if applicable) */}
          {usedMinimum && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                Ajustement montant minimum
              </Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>-</Text>
              <Text style={[styles.tableCell, styles.colUnitPrice]}>-</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(invoice.minimumAmount - invoice.calculatedAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Sous-total HT</Text>
            <Text style={styles.totalsValue}>{formatCurrency(invoice.finalAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>TVA ({invoice.vatRate}%)</Text>
            <Text style={styles.totalsValue}>{formatCurrency(invoice.vatAmount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Total TTC</Text>
            <Text style={styles.totalsFinalValue}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Cette facture concerne les frais de gestion de la plateforme Kiwatt pour votre
            Communauté Électrique Locale (CEL). Le tarif est de CHF 0.01 par kWh géré,
            avec un minimum de CHF 79.00 par mois.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {kiwatt.name} • {kiwatt.address}, {kiwatt.postalCode} {kiwatt.city} • {kiwatt.email}
          </Text>
        </View>
      </Page>

      {/* QR-Bill Page (if available) */}
      {invoice.qrBillPng && (
        <Page size="A4" style={styles.qrBillPage}>
          <Image src={invoice.qrBillPng} style={styles.qrBillImage} />
        </Page>
      )}
    </Document>
  );
}
