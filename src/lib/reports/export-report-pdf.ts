import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SalesReportRow, StockReportRow } from "@/types/views/report";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date) {
  return value.toISOString().split("T")[0];
}

type ExportSalesReportPdfPayload = {
  type: "sales";
  data: SalesReportRow[];
  dateFrom: string;
  dateTo: string;
};

type ExportStocksReportPdfPayload = {
  type: "stocks";
  data: StockReportRow[];
};

type ExportReportPdfPayload = ExportSalesReportPdfPayload | ExportStocksReportPdfPayload;

export function exportReportPdf(payload: ExportReportPdfPayload) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const exportedAt = new Date();
  const exportedAtLabel = `Diekspor: ${exportedAt.toLocaleString("id-ID")}`;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(payload.type === "sales" ? "Laporan Penjualan" : "Laporan Stok", 40, 42);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (payload.type === "sales") {
    doc.text(`Periode: ${payload.dateFrom} s/d ${payload.dateTo}`, 40, 62);
  } else {
    doc.text(`Snapshot: ${formatDate(exportedAt)}`, 40, 62);
  }
  doc.text(exportedAtLabel, pageWidth - 40, 62, { align: "right" });

  if (payload.type === "sales") {
    const totalRevenue = payload.data.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const totalInvoices = payload.data.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
    const totalItems = payload.data.reduce((sum, row) => sum + Number(row.items_sold ?? 0), 0);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Omzet: ${formatRupiah(totalRevenue)}`, 40, 82);
    doc.text(`Total Nota: ${totalInvoices}`, 240, 82);
    doc.text(`Total Item: ${totalItems}`, 360, 82);

    autoTable(doc, {
      startY: 96,
      head: [["Tanggal", "Qty Nota", "Qty Produk", "Total Omzet"]],
      body: payload.data.map((row) => [
        row.date,
        String(row.count),
        String(row.items_sold),
        formatRupiah(Number(row.total ?? 0)),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    doc.save(`report-sales-${payload.dateFrom}-to-${payload.dateTo}.pdf`);
    return;
  }

  autoTable(doc, {
    startY: 80,
    head: [["Produk", "SKU", "Store", "Stok", "Nilai Aset"]],
    body: payload.data.map((row) => {
      const productName = row.products?.name ?? "-";
      const sku = row.products?.sku ?? "-";
      const storeName = row.stores?.name ?? "-";
      const qtyOnHand = Number(row.qty_on_hand ?? 0);
      const assetValue = qtyOnHand * Number(row.products?.buy_price ?? 0);
      return [
        productName,
        sku,
        storeName,
        String(qtyOnHand),
        formatRupiah(assetValue),
      ];
    }),
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
    },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  doc.save(`report-stocks-${formatDate(exportedAt)}.pdf`);
}
