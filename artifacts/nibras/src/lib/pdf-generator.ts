import jsPDF from "jspdf";

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

export async function downloadLessonPdf(lesson: LessonPlan): Promise<void> {
  const htmlContent = buildHtmlContent(lesson);

  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.fontFamily = "'Segoe UI', 'Noto Sans Arabic', Arial, sans-serif";
  container.style.direction = "rtl";
  container.style.background = "#fff";
  document.body.appendChild(container);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: 794,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`خطة درس - ${lesson.title}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function buildHtmlContent(lesson: LessonPlan): string {
  const digitalActivities = lesson.activities.filter((a) => a.type === "digital");
  const regularActivities = lesson.activities.filter((a) => a.type !== "digital");

  const objectivesList = lesson.objectives
    .map((o, i) => `<li style="margin-bottom:6px;line-height:1.6">${i + 1}. ${o}</li>`)
    .join("");

  const regularActivitiesHtml = regularActivities
    .map(
      (a: { name: string; type: string; duration: number; description: string }) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:10px;background:#fafafa">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <strong style="font-size:14px">${a.name}</strong>
          <span style="font-size:12px;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px">${getActivityTypeLabel(a.type)} | ${a.duration} د</span>
        </div>
        <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6">${a.description}</p>
      </div>`
    )
    .join("");

  const digitalActivitiesHtml = digitalActivities.length > 0
    ? `
      <div style="margin-top:16px">
        <h3 style="color:#7c3aed;font-size:15px;margin-bottom:10px;border-bottom:2px solid #c4b5fd;padding-bottom:4px">🎮 النشاط الرقمي التفاعلي</h3>
        ${digitalActivities.map((a: Activity) => `
          <div style="border:1px solid #c4b5fd;border-radius:8px;padding:12px;background:linear-gradient(135deg,#f5f3ff,#ede9fe)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <strong style="font-size:14px;color:#6d28d9">${a.name}</strong>
              <span style="font-size:12px;background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:12px;border:1px solid #c4b5fd">${a.duration} دقيقة</span>
            </div>
            <p style="margin:0;color:#5b21b6;font-size:13px;line-height:1.6">${a.description}</p>
          </div>`).join("")}
      </div>`
    : "";

  const materialsList = lesson.materials
    .map((m: string) => `<li style="margin-bottom:4px">• ${m}</li>`)
    .join("");

  const strategiesList = lesson.strategies
    .map((s: string) => `<span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;padding:3px 10px;border-radius:6px;font-size:12px;margin:3px">${s}</span>`)
    .join("");

  const homeworkHtml = lesson.homework
    ? `<div style="margin-bottom:16px"><h3 style="color:#4f46e5;font-size:15px;margin-bottom:6px;border-bottom:2px solid #c7d2fe;padding-bottom:4px">📝 الواجب المنزلي</h3><p style="color:#374151;font-size:13px;line-height:1.6">${lesson.homework}</p></div>`
    : "";

  const madrasatiHtml = lesson.madrasatiHomework
    ? `<div style="margin-bottom:16px"><h3 style="color:#059669;font-size:15px;margin-bottom:6px;border-bottom:2px solid #a7f3d0;padding-bottom:4px">💻 واجب منصة مدرستي</h3><p style="color:#374151;font-size:13px;line-height:1.6">${lesson.madrasatiHomework}</p></div>`
    : "";

  return `
    <div style="direction:rtl;font-family:'Segoe UI','Noto Sans Arabic',Arial,sans-serif;color:#111827;padding:32px;background:#ffffff;max-width:794px">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;padding:24px;border-radius:12px;margin-bottom:24px">
        <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:bold">${lesson.title}</h1>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px;opacity:0.9">
          <span>📚 ${lesson.stage}</span>
          <span>🏫 ${lesson.grade}</span>
          <span>📖 ${lesson.subject}</span>
          <span>⏱ ${lesson.duration} دقيقة</span>
        </div>
        <p style="margin:8px 0 0 0;font-size:11px;opacity:0.7">تم إعداد هذه الخطة بواسطة نبراس - المساعد الذكي للمعلمين الجدد</p>
      </div>

      <!-- Objectives -->
      <div style="margin-bottom:20px">
        <h3 style="color:#1d4ed8;font-size:15px;margin-bottom:10px;border-bottom:2px solid #bfdbfe;padding-bottom:4px">🎯 أهداف الدرس</h3>
        <ul style="margin:0;padding:0;list-style:none;color:#374151;font-size:13px">${objectivesList}</ul>
      </div>

      <!-- Introduction -->
      <div style="margin-bottom:20px">
        <h3 style="color:#7e22ce;font-size:15px;margin-bottom:8px;border-bottom:2px solid #e9d5ff;padding-bottom:4px">▶ التمهيد والمقدمة</h3>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.7">${lesson.introduction}</p>
      </div>

      <!-- Main Content -->
      <div style="margin-bottom:20px">
        <h3 style="color:#0e7490;font-size:15px;margin-bottom:8px;border-bottom:2px solid #a5f3fc;padding-bottom:4px">📄 المحتوى الرئيسي</h3>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;white-space:pre-wrap">${lesson.mainContent}</p>
      </div>

      <!-- Activities -->
      <div style="margin-bottom:20px">
        <h3 style="color:#15803d;font-size:15px;margin-bottom:10px;border-bottom:2px solid #bbf7d0;padding-bottom:4px">🎨 الأنشطة التعليمية</h3>
        ${regularActivitiesHtml}
        ${digitalActivitiesHtml}
      </div>

      <!-- Assessment -->
      <div style="margin-bottom:20px">
        <h3 style="color:#b45309;font-size:15px;margin-bottom:8px;border-bottom:2px solid #fde68a;padding-bottom:4px">✅ التقويم والتقييم</h3>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;white-space:pre-wrap">${lesson.assessment}</p>
      </div>

      <!-- Closure -->
      <div style="margin-bottom:20px">
        <h3 style="color:#be185d;font-size:15px;margin-bottom:8px;border-bottom:2px solid #fbcfe8;padding-bottom:4px">⭐ الخاتمة</h3>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.7">${lesson.closure}</p>
      </div>

      <!-- Strategies & Materials row -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <h3 style="color:#0f766e;font-size:15px;margin-bottom:8px;border-bottom:2px solid #99f6e4;padding-bottom:4px">🧠 استراتيجيات التعلم</h3>
          <div>${strategiesList}</div>
        </div>
        <div>
          <h3 style="color:#be123c;font-size:15px;margin-bottom:8px;border-bottom:2px solid #fecdd3;padding-bottom:4px">🖥 الوسائل التعليمية</h3>
          <ul style="margin:0;padding:0;list-style:none;color:#374151;font-size:13px">${materialsList}</ul>
        </div>
      </div>

      <!-- Differentiated Instructions -->
      <div style="margin-bottom:20px">
        <h3 style="color:#86198f;font-size:15px;margin-bottom:10px;border-bottom:2px solid #f5d0fe;padding-bottom:4px">🎓 التعليم المتمايز</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:13px">
          <div style="border-right:4px solid #d946ef;padding:10px;background:#fdf4ff;border-radius:6px">
            <strong style="color:#a21caf;display:block;margin-bottom:4px">الموهوبين</strong>
            <span style="color:#4b5563;line-height:1.5">${lesson.differentiatedInstructions.advanced}</span>
          </div>
          <div style="border-right:4px solid #3b82f6;padding:10px;background:#eff6ff;border-radius:6px">
            <strong style="color:#1d4ed8;display:block;margin-bottom:4px">المتوسطين</strong>
            <span style="color:#4b5563;line-height:1.5">${lesson.differentiatedInstructions.average}</span>
          </div>
          <div style="border-right:4px solid #f97316;padding:10px;background:#fff7ed;border-radius:6px">
            <strong style="color:#c2410c;display:block;margin-bottom:4px">دعائم التعلم</strong>
            <span style="color:#4b5563;line-height:1.5">${lesson.differentiatedInstructions.needsSupport}</span>
          </div>
        </div>
      </div>

      ${homeworkHtml}
      ${madrasatiHtml}

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;text-align:center;color:#9ca3af;font-size:11px">
        نبراس - المساعد الذكي للمعلمين الجدد | تم التوليد بتاريخ ${new Date().toLocaleDateString("ar-SA")}
      </div>
    </div>
  `;
}
