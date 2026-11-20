import type { PdfOp } from "./types";
import { organizeOps } from "./pdf-ops-organize.ts";
import { editOps } from "./pdf-ops-edit.ts";
import { inspectOps } from "./pdf-ops-inspect.ts";
import { createOps } from "./pdf-ops-create.ts";
import { imageToPdfOps } from "./pdf-ops-images.ts";

const baseName = (file: File) => file.name.replace(/\.pdf$/i, "") || "document";

const rotateOps: Record<string, PdfOp> = {
  "rotate-pdf": {
    input: "pdf",
    options: [{ id: "angle", label: "Rotate every page", type: "select", default: "90", choices: [["90", "90° clockwise"], ["180", "180°"], ["270", "90° counter-clockwise"]] }],
    async process({ files }, options, { PDFDocument, degrees }) {
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      const angle = Number(options.angle);
      for (const page of doc.getPages()) page.setRotation(degrees((page.getRotation().angle + angle) % 360));
      const bytes = await doc.save();
      return [{ blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), name: `${baseName(files[0])}-rotated.pdf` }];
    },
  },
};

export const ops: Record<string, PdfOp> = { ...rotateOps, ...organizeOps, ...editOps, ...inspectOps, ...createOps, ...imageToPdfOps };
