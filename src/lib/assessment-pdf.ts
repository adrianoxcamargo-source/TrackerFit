import type { BodyMetric } from "@/lib/types";
import { formatNumber, formatShortDate } from "@/lib/format";

const labels: Array<[keyof BodyMetric, string, string]> = [
  ["heightCm", "Altura", "cm"], ["weightKg", "Peso", "kg"],
  ["bodyfatPct", "Gordura por dobras", "%"], ["bioimpedanceBodyfatPct", "Gordura por bioimpedancia", "%"],
  ["bioimpedanceMusclePct", "Muscular por bioimpedancia", "%"], ["fatMassKg", "Massa de gordura", "kg"],
  ["leanMassKg", "Massa magra", "kg"], ["visceralFat", "Gordura visceral", "nivel"],
  ["metabolicRateKcal", "Gasto metabolico", "kcal"],
  ["skinfoldSubscapularMm", "Dobra subescapular", "mm"], ["skinfoldTricepsMm", "Dobra triceps", "mm"],
  ["skinfoldChestMm", "Dobra peitoral", "mm"], ["skinfoldAxillaryMm", "Dobra axilar", "mm"],
  ["skinfoldObliqueMm", "Dobra obliqua", "mm"], ["skinfoldAbdominalMm", "Dobra abdominal", "mm"],
  ["skinfoldThighMm", "Dobra da coxa", "mm"],
  ["chestCm", "Peitoral", "cm"], ["waistCm", "Cintura", "cm"], ["abdomenCm", "Abdomen", "cm"],
  ["hipCm", "Quadril", "cm"], ["rightArmCm", "Braco direito", "cm"], ["leftArmCm", "Braco esquerdo", "cm"],
  ["rightThighCm", "Coxa direita", "cm"], ["leftThighCm", "Coxa esquerda", "cm"],
  ["rightCalfCm", "Panturrilha direita", "cm"], ["leftCalfCm", "Panturrilha esquerda", "cm"],
];

const ascii = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
const pdfEscape = (value: string) => ascii(value).replace(/([\\()])/g, "\\$1");

export function downloadAssessmentPdf(metric: BodyMetric, athleteName: string) {
  const lines = [
    "TRACKERFIT - AVALIACAO FISICA",
    `Atleta: ${athleteName || "Nao informado"}`,
    `Data: ${formatShortDate(metric.recordedAt)}`,
    "",
    ...labels.flatMap(([key, label, unit]) => {
      const value = metric[key];
      return typeof value === "number" ? [`${label}: ${formatNumber(value)} ${unit}`] : [];
    }),
    ...(metric.notes ? ["", `Observacoes: ${metric.notes}`] : []),
  ];
  const pageSize = 38;
  const pages = Array.from({ length: Math.ceil(lines.length / pageSize) }, (_, index) => lines.slice(index * pageSize, (index + 1) * pageSize));
  const objects: string[] = [];
  const addObject = (content: string) => { objects.push(content); return objects.length; };
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  pages.forEach((page) => {
    const commands = page.map((line, index) => `BT /F1 ${index === 0 ? 16 : 10} Tf 50 ${790 - index * 19} Td (${pdfEscape(line)}) Tj ET`).join("\n");
    contentIds.push(addObject(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`));
    pageIds.push(addObject(""));
  });
  const pagesId = addObject("");
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  pageIds.forEach((id, index) => { objects[id - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`; });
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `avaliacao-${metric.recordedAt}.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
