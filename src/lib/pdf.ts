import { jsPDF } from "jspdf";

import type { FinalResult, SourceDTO, VerificationReport } from "@/types/agentflow";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

type RGB = [number, number, number];
const INK: RGB = [80, 45, 85];
const MUTED: RGB = [138, 113, 137];
const ACCENT: RGB = [147, 80, 115];
const LINE: RGB = [225, 213, 220];
const GOOD: RGB = [79, 122, 91];
const WARN: RGB = [201, 138, 62];
const BAD: RGB = [178, 58, 75];
const WHITE: RGB = [255, 255, 255];

interface Word {
  text: string;
  bold: boolean;
}

function tokenizeRich(text: string): Word[] {
  const words: Word[] = [];
  for (const segment of text.split(/(\*\*[^*]+\*\*)/g).filter((s) => s.length > 0)) {
    const isBold = segment.startsWith("**") && segment.endsWith("**") && segment.length > 4;
    const clean = isBold ? segment.slice(2, -2) : segment;
    for (const word of clean.split(/\s+/).filter(Boolean)) {
      words.push({ text: word, bold: isBold });
    }
  }
  return words;
}

function truncateToWidth(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && doc.getTextWidth(`${result}…`) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

/** Tracks vertical position and paginates as content is written. */
class ReportCursor {
  doc: jsPDF;
  y = MARGIN;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  ensure(height: number) {
    if (this.y + height > PAGE_H - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  space(height: number) {
    this.y += height;
  }

  rule() {
    this.ensure(14);
    this.doc.setDrawColor(...LINE);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 14;
  }

  heading(text: string, level: 1 | 2 | 3) {
    const size = level === 1 ? 17 : level === 2 ? 14 : 12;
    const lineHeight = size * 1.25;
    this.ensure(10 + lineHeight);
    this.y += 10;
    this.doc.setTextColor(...INK);
    this.richLineIndented(
      tokenizeRich(text).map((w) => ({ ...w, bold: true })),
      size,
      lineHeight,
      MARGIN,
      CONTENT_W,
    );
    this.y += 4;
  }

  paragraph(text: string, opts?: { size?: number; color?: RGB }) {
    const size = opts?.size ?? 10.5;
    const color = opts?.color ?? INK;
    const lineHeight = size * 1.45;
    this.doc.setTextColor(...color);
    this.richLineIndented(tokenizeRich(text), size, lineHeight, MARGIN, CONTENT_W);
    this.y += 4;
  }

  bullet(text: string) {
    const size = 10.5;
    const lineHeight = size * 1.45;
    this.ensure(lineHeight);
    this.doc.setTextColor(...INK);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(size);
    this.doc.text("•", MARGIN, this.y);
    this.richLineIndented(tokenizeRich(text), size, lineHeight, MARGIN + 14, CONTENT_W - 14);
    this.y += 4;
  }

  private richLineIndented(
    words: Word[],
    fontSize: number,
    lineHeight: number,
    x0: number,
    maxWidth: number,
  ) {
    this.ensure(lineHeight);
    this.doc.setFontSize(fontSize);
    let x = x0;
    const spaceWidth = this.doc.getTextWidth(" ");
    for (const word of words) {
      this.doc.setFont("helvetica", word.bold ? "bold" : "normal");
      const w = this.doc.getTextWidth(word.text);
      if (x > x0 && x + w > x0 + maxWidth) {
        x = x0;
        this.y += lineHeight;
        this.ensure(lineHeight);
      }
      this.doc.text(word.text, x, this.y);
      x += w + spaceWidth;
    }
    this.y += lineHeight;
  }
}

function renderHeader(cursor: ReportCursor, result: FinalResult) {
  const doc = cursor.doc;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text("AGENTFLOW — RUN REPORT", MARGIN, cursor.y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    PAGE_W - MARGIN,
    cursor.y,
    { align: "right" },
  );
  cursor.y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...INK);
  const titleLines: string[] = doc.splitTextToSize(result.objective, CONTENT_W);
  doc.text(titleLines, MARGIN, cursor.y);
  cursor.y += titleLines.length * 24 + 6;

  cursor.rule();
  cursor.space(8);
}

function renderMarkdown(cursor: ReportCursor, markdown: string) {
  const cleaned = markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  for (const raw of cleaned.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length === 0) {
      cursor.space(6);
      continue;
    }

    const h3 = /^###\s+(.*)/.exec(line);
    const h2 = /^##\s+(.*)/.exec(line);
    const h1 = /^#\s+(.*)/.exec(line);
    const bullet = /^[-*]\s+(.*)/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)/.exec(line);

    if (h1) cursor.heading(h1[1] ?? "", 1);
    else if (h2) cursor.heading(h2[1] ?? "", 2);
    else if (h3) cursor.heading(h3[1] ?? "", 3);
    else if (bullet) cursor.bullet(bullet[1] ?? "");
    else if (numbered) cursor.bullet(numbered[1] ?? "");
    else cursor.paragraph(line);
  }
}

function renderVerification(cursor: ReportCursor, v: VerificationReport) {
  const doc = cursor.doc;
  cursor.heading("Verification", 2);

  const verdictColor = v.verdict === "supported" ? GOOD : v.verdict === "partially_supported" ? WARN : BAD;
  cursor.ensure(20);
  doc.setFillColor(...verdictColor);
  doc.roundedRect(MARGIN, cursor.y - 10, 150, 16, 8, 8, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(v.verdict.replace(/_/g, " ").toUpperCase(), MARGIN + 75, cursor.y, { align: "center" });
  cursor.y += 28;

  const metrics: Array<[string, number]> = [
    ["Completeness", v.completeness],
    ["Consistency", v.consistency],
    ["Source support", v.source_support],
  ];
  const boxW = (CONTENT_W - 20) / 3;
  cursor.ensure(56);
  metrics.forEach(([label, value], index) => {
    const x = MARGIN + index * (boxW + 10);
    doc.setDrawColor(...LINE);
    doc.roundedRect(x, cursor.y, boxW, 46, 8, 8, "S");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${value}%`, x + boxW / 2, cursor.y + 24, { align: "center" });
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x + boxW / 2, cursor.y + 38, { align: "center" });
  });
  cursor.y += 62;

  if (v.unsupported_claims.length > 0) {
    cursor.paragraph(`**Unsupported claims:** ${v.unsupported_claims.join("; ")}`);
  }
  if (v.gaps.length > 0) {
    cursor.paragraph(`**Gaps:** ${v.gaps.join("; ")}`);
  }
  if (v.notes) {
    cursor.paragraph(v.notes, { size: 9.5, color: MUTED });
  }
}

function renderSources(cursor: ReportCursor, sources: SourceDTO[]) {
  if (sources.length === 0) return;
  const doc = cursor.doc;
  cursor.heading(`Sources (${sources.length})`, 2);

  sources.forEach((source, index) => {
    cursor.ensure(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const title = truncateToWidth(doc, `${index + 1}. ${source.title || source.url}`, CONTENT_W);
    doc.text(title, MARGIN, cursor.y);
    cursor.y += 13;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...ACCENT);
    const urlLabel = truncateToWidth(doc, source.url, CONTENT_W);
    doc.textWithLink(urlLabel, MARGIN, cursor.y, { url: source.url });
    cursor.y += 17;
  });
}

function renderFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Generated by AgentFlow — verify before relying on it.",
      MARGIN,
      PAGE_H - 28,
    );
    doc.text(`Page ${page} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 28, { align: "right" });
  }
}

function fileNameFor(objective: string): string {
  const slug = objective
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `agentflow-${slug || "run"}.pdf`;
}

/** Renders a FinalResult (answer, verification, sources) as a downloadable PDF report. */
export function downloadResultPdf(result: FinalResult): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const cursor = new ReportCursor(doc);

  renderHeader(cursor, result);
  cursor.heading("Answer", 2);
  renderMarkdown(cursor, result.answer);
  cursor.space(6);

  if (result.verification) {
    renderVerification(cursor, result.verification);
  }

  renderSources(cursor, result.sources);
  renderFooters(doc);

  doc.save(fileNameFor(result.objective));
}