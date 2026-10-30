import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Committed, self-contained sample PDFs: the demo viewer works without a backend.
const samples = [
  ["Annual Report 2023.pdf", 56], ["Annual Report 2022.pdf", 48],
  ["Financial Analysis.pdf", 32], ["Market Research.pdf", 24],
  ["Product Strategy.pdf", 18], ["Competitive Analysis.pdf", 28],
  ["Quarterly Review.pdf", 19], ["Customer Insights.pdf", 42],
  ["Budget Forecast.pdf", 21], ["Research Notes.pdf", 15],
  ["Sales Performance.pdf", 36], ["Executive Summary.pdf", 12],
];

await mkdir("public/pdfs", { recursive: true });
for (const [filename, count] of samples) {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  for (let pageNo = 1; pageNo <= count; pageNo++) {
    const page = pdf.addPage([595, 842]);
    const ink = rgb(.12, .13, .16);
    const blue = rgb(.18, .61, .96);
    const top = `${filename.replace(/\.pdf$/, "").toUpperCase()}`;
    page.drawText(top, { x: 48, y: 785, size: 10, font: sans, color: rgb(.36, .39, .45) });
    page.drawText(`Page ${pageNo} of ${count}`, { x: 475, y: 785, size: 9, font: sans, color: rgb(.36, .39, .45) });
    page.drawLine({ start: { x: 48, y: 770 }, end: { x: 547, y: 770 }, thickness: .8, color: rgb(.65, .68, .7) });
    page.drawText(pageNo === 12 ? "3. Financial Performance" : `${Math.ceil(pageNo / 5)}. Business Overview`, { x: 48, y: 710, size: 27, font: serifBold, color: ink });
    const lines = pageNo === 12 ? [
      "The company achieved significant revenue growth of 12.4% in 2023,",
      "driven by strong demand across our core markets. This growth",
      "reflects the continued execution of our strategic initiatives and",
      "increased market share in key segments.",
    ] : [
      "This document presents an overview of key trends and business outcomes.",
      "Our analysis considers market dynamics, operational performance,",
      "and opportunities to strengthen our strategic positioning.",
      "The following metrics illustrate performance over recent years.",
    ];
    lines.forEach((line, index) => page.drawText(line, { x: 48, y: 675 - index * 24, size: 14, font: serif, color: ink }));
    page.drawText("200", { x: 52, y: 525, size: 10, font: sans });
    page.drawText("100", { x: 52, y: 440, size: 10, font: sans });
    page.drawText("0", { x: 58, y: 355, size: 10, font: sans });
    [360, 402, 445, 488, 530].forEach((y) => page.drawLine({ start: { x: 83, y }, end: { x: 516, y }, thickness: .5, color: rgb(.84, .85, .86) }));
    [90, 119, 163, 200].forEach((height, index) => {
      page.drawRectangle({ x: 112 + index * 102, y: 360, width: 64, height,
        color: index === 3 ? blue : rgb(.83, .85, .88), borderColor: ink, borderWidth: 1 });
      page.drawText(`${2020 + index}`, { x: 125 + index * 102, y: 340, size: 11, font: serif, color: ink });
    });
    page.drawText("Figure 3.1", { x: 200, y: 305, size: 12, font: serifBold, color: ink });
    page.drawText("Revenue growth (in million USD)", { x: 268, y: 305, size: 12, font: serif, color: ink });
    page.drawText("3.1 Key Growth Drivers", { x: 48, y: 245, size: 23, font: serifBold, color: ink });
    [
      "The growth was primarily driven by increased market share and",
      "operational efficiency improvements. Higher customer demand",
      "contributed to strong revenue performance throughout the year.",
    ].forEach((line, index) => page.drawText(line, { x: 48, y: 207 - index * 23, size: 14, font: serif, color: ink }));
    page.drawText("Demo document generated for Chat with PDF UI — not a real financial report.", { x: 48, y: 45, size: 8, font: sans, color: rgb(.52, .52, .55) });
  }
  await writeFile(`public/pdfs/${filename}`, await pdf.save());
}
console.log(`Generated ${samples.length} sample PDFs.`);
