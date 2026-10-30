"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function PdfCanvas({ url, page, zoom, query, onPages }: {
  url: string; page: number; zoom: number; query: string; onPages: (pages: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(520);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resize = () => setWidth(Math.max(180, element.clientWidth - 35));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const term = query.trim().toLowerCase();
  return <div ref={containerRef} className="pdf-canvas" data-testid="pdf-canvas">
    <Document file={url} onLoadSuccess={({ numPages }) => onPages(numPages)}
      loading={<div className="rounded-md bg-white p-10 text-center text-muted">Loading PDF…</div>}
      error={<div role="alert" className="rounded-md border border-red-200 bg-white p-8 text-center text-red-700">The PDF file could not be opened. Try another document.</div>}>
      <Page pageNumber={page} width={Math.min(width, 730)} scale={zoom / 100}
        renderTextLayer renderAnnotationLayer
        customTextRenderer={term ? ({ str }) => {
          const source = str.toLowerCase();
          const offset = source.indexOf(term);
          if (offset < 0) return escapeHtml(str);
          return `${escapeHtml(str.slice(0, offset))}<mark style="background:#ffe65b">${escapeHtml(str.slice(offset, offset + term.length))}</mark>${escapeHtml(str.slice(offset + term.length))}`;
        } : undefined}
      />
    </Document>
  </div>;
}
