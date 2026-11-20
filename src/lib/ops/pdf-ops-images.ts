import type { OptionValues, PdfOp } from "./types";
import { MM, PAGE_SIZES, numberOption, pdfFile, saveDoc, type PdfDoc, type PdfLib } from "./pdf-ops-common.ts";
import { jpegOrientation } from "./pdf-ops-parse.ts";
import { rotatedAnchor } from "./pdf-ops-create.ts";

type Kind = "jpg" | "png";

export function imageKind(bytes: Uint8Array): Kind | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  return null;
}

const ORIENTATION_TURN: Record<number, number> = { 3: 180, 6: 90, 8: 270 };

async function addImagePage(lib: PdfLib, doc: PdfDoc, file: File, options: OptionValues, allowed: Kind[]): Promise<void> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = imageKind(bytes);
  if (!kind || !allowed.includes(kind)) throw new Error(`"${file.name}" is not a ${allowed.map(k => k.toUpperCase()).join(" or ")} image.`);
  let image;
  try { image = kind === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes); }
  catch { throw new Error(`"${file.name}" could not be read. It may be damaged or use an unusual encoding.`); }
  const turn = kind === "jpg" ? ORIENTATION_TURN[jpegOrientation(bytes)] ?? 0 : 0;
  const [uprightW, uprightH] = turn === 90 || turn === 270 ? [image.height, image.width] : [image.width, image.height];
  const margin = numberOption(options.margin, "Margin", 0, 60) * MM;
  let pageW: number;
  let pageH: number;
  if (options.paper === "fit") {
    [pageW, pageH] = [uprightW * 0.75 + margin * 2, uprightH * 0.75 + margin * 2];
  } else {
    const [a, b] = PAGE_SIZES[String(options.paper)] ?? PAGE_SIZES.a4;
    const landscape = options.orientation === "landscape" || (options.orientation === "auto" && uprightW > uprightH);
    [pageW, pageH] = landscape ? [b, a] : [a, b];
  }
  const scale = options.paper === "fit" ? 0.75 : Math.min((pageW - margin * 2) / uprightW, (pageH - margin * 2) / uprightH);
  const [drawW, drawH] = [image.width * scale, image.height * scale];
  const x = (pageW - uprightW * scale) / 2;
  const y = (pageH - uprightH * scale) / 2;
  const anchor = rotatedAnchor(turn, x, y, drawW, drawH);
  doc.addPage([pageW, pageH]).drawImage(image, { x: anchor.x, y: anchor.y, width: drawW, height: drawH, rotate: lib.degrees(-turn) });
}

function imagesOp(allowed: Kind[], label: string): PdfOp {
  return {
    input: "images",
    options: [
      { id: "paper", label: "Page size", type: "select", default: "a4", choices: [["a4", "A4"], ["letter", "US Letter"], ["legal", "US Legal"], ["fit", "Same as each image (96 dpi)"]] },
      { id: "orientation", label: "Orientation", type: "select", default: "auto", choices: [["auto", "Match each image"], ["portrait", "Portrait"], ["landscape", "Landscape"]] },
      { id: "margin", label: "Margin (mm)", type: "number", default: 10, min: 0, max: 60, step: 1 },
    ],
    note: `${label} images become one page each, in the order added. Images are embedded without re-compression; phone photo rotation (EXIF) is respected.`,
    async process({ files }, options, lib) {
      if (!files.length) throw new Error("Add at least one image.");
      const doc = await lib.PDFDocument.create();
      for (const file of files) await addImagePage(lib, doc, file, options, allowed);
      return [pdfFile(await saveDoc(doc), files.length === 1 ? `${files[0].name.replace(/\.[^.]+$/, "")}.pdf` : "images.pdf")];
    },
  };
}

export const imageToPdfOps: Record<string, PdfOp> = {
  "jpg-to-pdf": imagesOp(["jpg"], "JPG"),
  "png-to-pdf": imagesOp(["png"], "PNG"),
  "images-to-pdf": imagesOp(["jpg", "png"], "JPG and PNG"),
};
