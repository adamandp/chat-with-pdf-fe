import type { PdfDocument, Accent } from "@/features/common/types";

const rows: Array<[string, string, number, Accent, boolean, string]> = [
  ["Annual Report 2023.pdf", "Company Financial Report", 56, "pink", true, "2024-03-15"],
  ["Annual Report 2022.pdf", "Financial Performance", 48, "mint", true, "2024-02-10"],
  ["Financial Analysis.pdf", "Q3 Analysis and Insights", 32, "purple", false, "2024-01-28"],
  ["Market Research.pdf", "Industry Trends 2024", 24, "blue", false, "2024-01-20"],
  ["Product Strategy.pdf", "Strategic Planning Document", 18, "yellow", true, "2024-01-12"],
  ["Competitive Analysis.pdf", "Market Competitive Landscape", 28, "pink", false, "2024-01-05"],
  ["Quarterly Review.pdf", "Financial Review Q2", 19, "blue", true, "2023-12-12"],
  ["Customer Insights.pdf", "Customer Experience Study", 42, "mint", true, "2023-11-28"],
  ["Budget Forecast.pdf", "Annual Budget Projection", 21, "purple", false, "2023-11-05"],
  ["Research Notes.pdf", "Technical Research Notes", 15, "yellow", true, "2023-10-18"],
  ["Sales Performance.pdf", "Sales Results and Trends", 36, "pink", true, "2023-09-22"],
  ["Executive Summary.pdf", "Leadership Overview", 12, "blue", false, "2023-09-03"],
];

export const documents: PdfDocument[] = rows.map(([name, description, pages, accent, analyzed, date], index) => ({
  id: `doc-${index + 1}`, name, description, pages, accent, analyzed,
  size: `${(1.2 + index * 0.34).toFixed(1)} MB`,
  createdAt: `${date}T09:00:00Z`, updatedAt: `${date}T09:00:00Z`, deletedAt: null,
  url: `/pdfs/${encodeURIComponent(name)}`,
}));

export const deletedDocuments: PdfDocument[] = rows.slice(0, 5).map(([name, description, pages, accent], index) => ({
  id: `deleted-doc-${index + 1}`, name, description, pages, accent, analyzed: true,
  size: `${(2.4 + index * 0.5).toFixed(1)} MB`,
  createdAt: "2023-08-01T09:00:00Z", updatedAt: "2023-08-01T09:00:00Z",
  deletedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
}));
