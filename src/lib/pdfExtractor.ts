import * as pdfjsLib from "pdfjs-dist";

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export type ExtractionStatus = "success" | "ocr-needed" | "failed";

export interface ExtractionResult {
  text: string;
  status: ExtractionStatus;
  pageCount: number;
  method: "native" | "ocr-fallback";
  warnings: string[];
}

/** Binary/PDF artifact patterns that indicate broken parsing */
const PDF_BINARY_PATTERNS = [
  /endobj/gi,
  /endstream/gi,
  /%%EOF/g,
  /\/Type\s*\/\w+/g,
  /\/Filter\s*\/\w+/g,
  /\/Length\s+\d+/g,
  /xref\s+\d+/g,
  /startxref/g,
  /obj\s*<</g,
  /stream\r?\n/g,
  /%PDF-\d/g,
];

/** Control character and encoding artifact patterns */
const ARTIFACT_PATTERNS = [
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // control chars (keep \t, \n, \r)
  /\uFFFD/g, // replacement character
  /[\uD800-\uDFFF]/g, // lone surrogates
];

/**
 * Extract text from a PDF file using pdfjs-dist.
 * Returns clean, validated text or an error status.
 */
export async function extractPdfText(file: File): Promise<ExtractionResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => {
          if ("str" in item) return item.str;
          return "";
        })
        .join(" ");
      pageTexts.push(pageText.trim());
    }

    let fullText = pageTexts
      .map((t, i) => `--- Page ${i + 1} ---\n${t}`)
      .join("\n\n");

    // Step 1: Sanitize — remove control characters and artifacts
    fullText = sanitizeText(fullText);

    // Step 2: Validate — check for binary PDF content leaking through
    const validationResult = validateExtractedText(fullText);

    if (validationResult.hasBinaryContent) {
      warnings.push("Binary PDF content detected — attempting cleanup");
      fullText = removeBinaryArtifacts(fullText);

      // Re-validate after cleanup
      const recheck = validateExtractedText(fullText);
      if (recheck.hasBinaryContent) {
        return {
          text: "",
          status: "failed",
          pageCount,
          method: "native",
          warnings: [
            "Document parsing failed: binary content could not be removed.",
            "Please re-upload a text-based PDF or use a different format.",
          ],
        };
      }
    }

    // Step 3: Quality check — is there enough readable text?
    const letterCount = (fullText.match(/[a-zA-Z]/g) || []).length;
    const isGoodQuality = fullText.length > 100 && letterCount > 50;

    if (!isGoodQuality) {
      return {
        text: fullText || "",
        status: "ocr-needed",
        pageCount,
        method: "native",
        warnings: [
          "Very little readable text extracted.",
          "This may be a scanned/image-based PDF. OCR processing would be needed for full extraction.",
          "Try uploading a text-based version of this document.",
        ],
      };
    }

    // Normalize whitespace
    fullText = fullText
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      text: fullText,
      status: "success",
      pageCount,
      method: "native",
      warnings,
    };
  } catch (error: any) {
    console.error("PDF extraction failed:", error);
    return {
      text: "",
      status: "failed",
      pageCount: 0,
      method: "native",
      warnings: [
        `PDF extraction error: ${error.message || "Unknown error"}`,
        "Please try a different file or format.",
      ],
    };
  }
}

/** Remove control characters and encoding artifacts */
function sanitizeText(text: string): string {
  let cleaned = text;
  for (const pattern of ARTIFACT_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned;
}

/** Check if extracted text contains raw PDF binary content */
function validateExtractedText(text: string): { hasBinaryContent: boolean; matchCount: number } {
  let matchCount = 0;
  for (const pattern of PDF_BINARY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matchCount += matches.length;
    }
  }
  // If we find more than 3 binary markers, it's contaminated
  return { hasBinaryContent: matchCount > 3, matchCount };
}

/** Aggressively remove binary PDF artifact lines */
function removeBinaryArtifacts(text: string): string {
  const lines = text.split("\n");
  const cleanLines = lines.filter((line) => {
    // Remove lines that are mostly non-printable or PDF syntax
    const printable = line.replace(/[^\x20-\x7E]/g, "");
    if (printable.length < line.length * 0.5 && line.length > 10) return false;

    // Remove lines matching PDF internal syntax
    for (const pattern of PDF_BINARY_PATTERNS) {
      if (pattern.test(line)) {
        pattern.lastIndex = 0; // reset regex
        return false;
      }
    }
    return true;
  });
  return cleanLines.join("\n");
}

/**
 * Extract text from a plain text file (.txt, .md).
 * Applies the same sanitization and validation.
 */
export async function extractPlainText(file: File): Promise<ExtractionResult> {
  try {
    let text = await file.text();
    text = sanitizeText(text);

    const validation = validateExtractedText(text);
    if (validation.hasBinaryContent) {
      text = removeBinaryArtifacts(text);
    }

    return {
      text: text.trim(),
      status: text.trim().length > 0 ? "success" : "failed",
      pageCount: 1,
      method: "native",
      warnings: text.trim().length === 0 ? ["File appears to be empty."] : [],
    };
  } catch (error: any) {
    return {
      text: "",
      status: "failed",
      pageCount: 0,
      method: "native",
      warnings: [`Text extraction error: ${error.message}`],
    };
  }
}

/**
 * Universal document extractor — routes to PDF or plain text handler.
 */
export async function extractDocumentText(file: File): Promise<ExtractionResult> {
  const ext = file.name.toLowerCase().split(".").pop() || "";

  if (ext === "pdf" || file.type === "application/pdf") {
    return extractPdfText(file);
  }

  return extractPlainText(file);
}
