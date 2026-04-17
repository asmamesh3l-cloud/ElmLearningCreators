import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertInchesToTwip,
  PageOrientation,
} from "docx";
import { saveAs } from "file-saver";

interface Activity {
  name: string;
  description: string;
  duration: number;
  type: string;
}

interface DifferentiatedInstructions {
  advanced: string;
  average: string;
  needsSupport: string;
}

interface LessonPlan {
  title: string;
  stage: string;
  grade: string;
  subject: string;
  duration: number;
  objectives: string[];
  strategies: string[];
  introduction: string;
  mainContent: string;
  activities: Activity[];
  assessment: string;
  closure: string;
  materials: string[];
  differentiatedInstructions: DifferentiatedInstructions;
  homework?: string;
  madrasatiHomework?: string;
}

function getActivityTypeLabel(type: string): string {
  switch (type) {
    case "individual": return "فردي";
    case "group": return "جماعي";
    case "discussion": return "مناقشة";
    case "practical": return "عملي";
    case "digital": return "رقمي تفاعلي";
    default: return type;
  }
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "3B82F6", space: 4 },
    },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 24, rightToLeft: true })],
    alignment: AlignmentType.BOTH,
    bidirectional: true,
    spacing: { after: 100 },
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, font: "Arial", size: 24, rightToLeft: true })],
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { after: 60 },
    indent: { right: convertInchesToTwip(0.25) },
  });
}

function labeledParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: "Arial", size: 24, rightToLeft: true }),
      new TextRun({ text: value, font: "Arial", size: 24, rightToLeft: true }),
    ],
    alignment: AlignmentType.BOTH,
    bidirectional: true,
    spacing: { after: 80 },
  });
}

export async function downloadLessonWord(lesson: LessonPlan, selectedOutcomes?: string[]): Promise<void> {
  const regularActivities = lesson.activities.filter((a) => a.type !== "digital");
  const digitalActivities = lesson.activities.filter((a) => a.type === "digital");

  const children: Paragraph[] = [];

  // ── Title block ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: lesson.title, bold: true, size: 40, color: "1E40AF", font: "Arial", rightToLeft: true })],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 80 },
      shading: { type: ShadingType.SOLID, color: "EFF6FF" },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${lesson.stage}  |  ${lesson.grade}  |  ${lesson.subject}  |  ${lesson.duration} دقيقة`, size: 22, color: "374151", font: "Arial", rightToLeft: true }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "تم إعداد هذه الخطة بواسطة نبراس - المساعد الذكي للمعلمين الجدد", size: 18, color: "9CA3AF", font: "Arial", rightToLeft: true })],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 280 },
    })
  );

  // ── Selected Learning Outcomes ──
  if (selectedOutcomes && selectedOutcomes.length > 0) {
    children.push(sectionHeading("✅ نواتج التعلم"));
    selectedOutcomes.forEach((outcome, i) => children.push(bulletItem(`${i + 1}. ${outcome}`)));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // ── Objectives ──
  children.push(sectionHeading("🎯 أهداف الدرس"));
  lesson.objectives.forEach((obj, i) => children.push(bulletItem(`${i + 1}. ${obj}`)));
  children.push(new Paragraph({ spacing: { after: 80 } }));

  // ── Introduction ──
  children.push(sectionHeading("▶ التمهيد والمقدمة"));
  children.push(bodyParagraph(lesson.introduction));

  // ── Main Content ──
  children.push(sectionHeading("📄 المحتوى الرئيسي"));
  lesson.mainContent.split("\n").forEach((line) => children.push(bodyParagraph(line)));

  // ── Activities ──
  children.push(sectionHeading("🎨 الأنشطة التعليمية"));
  regularActivities.forEach((a) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${a.name}`, bold: true, font: "Arial", size: 24, rightToLeft: true }),
          new TextRun({ text: `  (${getActivityTypeLabel(a.type)} | ${a.duration} دقيقة)`, font: "Arial", size: 22, color: "15803D", rightToLeft: true }),
        ],
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 100, after: 40 },
      }),
      bodyParagraph(a.description)
    );
  });

  if (digitalActivities.length > 0) {
    children.push(sectionHeading("🎮 النشاط الرقمي التفاعلي"));
    digitalActivities.forEach((a) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${a.name}`, bold: true, font: "Arial", size: 24, color: "6D28D9", rightToLeft: true }),
            new TextRun({ text: `  (${a.duration} دقيقة)`, font: "Arial", size: 22, color: "7C3AED", rightToLeft: true }),
          ],
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 100, after: 40 },
        }),
        bodyParagraph(a.description)
      );
    });
  }

  // ── Assessment ──
  children.push(sectionHeading("✅ التقويم والتقييم"));
  lesson.assessment.split("\n").forEach((line) => children.push(bodyParagraph(line)));

  // ── Closure ──
  children.push(sectionHeading("⭐ الخاتمة"));
  children.push(bodyParagraph(lesson.closure));

  // ── Strategies ──
  children.push(sectionHeading("🧠 استراتيجيات التعلم"));
  lesson.strategies.forEach((s) => children.push(bulletItem(s)));
  children.push(new Paragraph({ spacing: { after: 80 } }));

  // ── Materials ──
  children.push(sectionHeading("🖥 الوسائل التعليمية"));
  lesson.materials.forEach((m) => children.push(bulletItem(m)));
  children.push(new Paragraph({ spacing: { after: 80 } }));

  // ── Differentiated Instructions ──
  children.push(sectionHeading("🎓 التعليم المتمايز"));
  children.push(labeledParagraph("الموهوبين", lesson.differentiatedInstructions.advanced));
  children.push(labeledParagraph("المتوسطين", lesson.differentiatedInstructions.average));
  children.push(labeledParagraph("دعائم التعلم", lesson.differentiatedInstructions.needsSupport));

  // ── Homework ──
  if (lesson.homework) {
    children.push(sectionHeading("📝 الواجب المنزلي"));
    children.push(bodyParagraph(lesson.homework));
  }

  if (lesson.madrasatiHomework) {
    children.push(sectionHeading("💻 واجب منصة مدرستي"));
    children.push(bodyParagraph(lesson.madrasatiHomework));
  }

  // ── Footer ──
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `نبراس - المساعد الذكي للمعلمين الجدد | تم التوليد بتاريخ ${new Date().toLocaleDateString("ar-SA")}`,
          size: 18, color: "9CA3AF", font: "Arial", rightToLeft: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 8 } },
    })
  );

  const doc = new Document({
    settings: {
      evenAndOddHeaderAndFooters: false,
    },
    sections: [
      {
        properties: {
          bidi: true,
          page: {
            size: { orientation: PageOrientation.PORTRAIT },
            margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), right: convertInchesToTwip(1.2), left: convertInchesToTwip(1) },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `خطة درس - ${lesson.title}.docx`);
}
