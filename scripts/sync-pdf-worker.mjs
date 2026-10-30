import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
await mkdir("public", { recursive: true });
await copyFile(source, resolve("public/pdf.worker.min.mjs"));
