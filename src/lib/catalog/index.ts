import type { ToolCategory } from "../categories";
import type { CatalogEntry } from "./types";
import { pdfCatalog } from "./pdf";
import { imageCatalog } from "./image";
import { mediaCatalog } from "./media";
import { devCatalog } from "./dev";
import { cryptoCatalog } from "./crypto";
import { youtubeCatalog } from "./youtube";
import { textCatalog } from "./text";
import { calculatorCatalog } from "./calculator";
import { dataCatalog } from "./data";
import { financeCatalog } from "./finance";
import { realEstateCatalog } from "./real-estate";
import { insuranceCatalog } from "./insurance";
import { businessCatalog } from "./business";
import { marketingCatalog } from "./marketing";

export const CATALOG: Record<ToolCategory, CatalogEntry[]> = {
  pdf: pdfCatalog,
  image: imageCatalog,
  media: mediaCatalog,
  dev: devCatalog,
  crypto: cryptoCatalog,
  youtube: youtubeCatalog,
  text: textCatalog,
  calculator: calculatorCatalog,
  data: dataCatalog,
  finance: financeCatalog,
  "real-estate": realEstateCatalog,
  insurance: insuranceCatalog,
  business: businessCatalog,
  marketing: marketingCatalog,
  legal: [],
};
export type { CatalogEntry, PlannedInput } from "./types";
