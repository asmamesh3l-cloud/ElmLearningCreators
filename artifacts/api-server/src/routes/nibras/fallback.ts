/**
 * Fallback generators used when the Nuha API is unreachable.
 * These produce structured, content-aware lesson plans and chat responses
 * based on the same inputs passed to the real model.
 */

export function generateFallbackLessonPlan(prompt: string): string {
  const match = prompt.match(
    /مادة: (.+?)\n.*?الدرس: (.+?)\n.*?المرحلة: (.+?)\n.*?الصف: (.+?)\n/,
  );
  const subject = match?.[1] || "المادة";
  const lesson = match?.[2] || "الدرس";
  const stage = match?.[3] || "المرحلة";
  const grade = match?.[4] || "الصف";

  const durationMatch = prompt.match(/مدة الحصة: (\d+) دقيقة/);
  const duration = durationMatch ? parseInt(durationMatch[1]) : 45;

  const studentLevelMatch = prompt.match(/مستوى الطلاب[":]\s*"?([^"\n]+)"?/);
  const studentLevel = studentLevelMatch?.[1]?.trim() || "";

  const classNatureMatch = prompt.match(/طبيعة الصف[":]\s*"?([^"\n]+)"?/);
  const classNature = classNatureMatch?.[1]?.trim() || "";

  const learningNeedsMatch = prompt.match(/احتياجات التعلم الخاصة[":]\s*"?([^"\n]+)"?/);
  const learningNeeds = learningNeedsMatch?.[1]?.trim() || "";

  const learningOutcomesMatch = prompt.match(/نواتج التعلم المحددة[":]\s*"?([^"\n]+)"?/);
  const learningOutcomes = learningOutcomesMatch?.[1]?.trim() || "";

  const intro = Math.round(duration * 0.10);
  const explanation = Math.round(duration * 0.32);
  const activity = Math.round(duration * 0.45);
  const assessment = duration - intro - explanation - activity;

  const activityDur1 = Math.round(activity * 0.35);
  const activityDur2 = Math.round(activity * 0.30);
  const activityDur3 = Math.round(activity * 0.20);
  const activityDur4 = activity - activityDur1 - activityDur2 - activityDur3;

  const isAdvanced = studentLevel.includes("متقدم") || studentLevel.includes("advanced");
  const isBeginner = studentLevel.includes("مبتدئ") || studentLevel.includes("beginner");
  const levelLabel = isAdvanced ? "المتقدم" : isBeginner ? "المبتدئ" : "المتوسط";

  const objectives = isAdvanced ? [
    `يُحلل الطالب مفهوم ${lesson} ويكشف العلاقات الخفية بين مكوناته`,
    `يُصمم الطالب نشاطاً إثرائياً يتجاوز متطلبات الكتاب المدرسي لـ${lesson}`,
    `يُقيّم الطالب أهمية ${lesson} ويقترح تطبيقات مبتكرة في الحياة`,
    `يُنتج الطالب ملخصاً نقدياً متكاملاً لأبرز مفاهيم ${lesson}`,
  ] : isBeginner ? [
    `يتعرف الطالب على المفاهيم الأساسية في ${lesson} بأسلوب مبسط`,
    `يذكر الطالب ثلاثة أمثلة بسيطة ومحسوسة على ${lesson} من بيئته`,
    `يُطبّق الطالب مفهوم ${lesson} في موقف عملي موجَّه`,
    `يُعبّر الطالب بكلماته الخاصة عن أهمية ${lesson}`,
  ] : [
    `يُحلل الطالب مفهوم ${lesson} ويربطه بالمفاهيم السابقة`,
    `يصمم الطالب نشاطاً تطبيقياً يوضح فهمه لـ${lesson}`,
    `يُقيّم الطالب أهمية ${lesson} في الحياة اليومية والمجتمع`,
    `يُنتج الطالب ملخصاً واضحاً لأبرز مفاهيم ${lesson}`,
  ];

  if (learningOutcomes) {
    objectives[0] = `يُحقق الطالب الناتج التعليمي المحدد: ${learningOutcomes} من خلال دراسة ${lesson}`;
  }

  const strategies = isAdvanced
    ? ["التعلم القائم على الاستقصاء والبحث المستقل", "التفكير الناقد والتحليل العميق", "تعليم الأقران وقيادة النقاشات", "التعلم المتمايز للمتقدمين", "العصف الذهني المحفز للتفكير الإبداعي"]
    : isBeginner
    ? ["التعلم بالنمذجة والتقليد الموجَّه", "الوسائل التعليمية الحسية والمرئية", "التعلم التعاوني في مجموعات صغيرة مدعومة", "التغذية الراجعة الفورية والتشجيع المستمر", "العصف الذهني المحفز المبسط"]
    : ["التعلم التعاوني (مجموعات صغيرة)", "العصف الذهني المحفز والنقاش الموجه", "التعلم القائم على المشروع", "التعلم المتمايز وفق مستويات الطلاب", "الاستقصاء والبحث العلمي"];

  const needsSupportText = learningNeeds
    ? `تقديم دعم إضافي فردي مع مراعاة احتياجات: ${learningNeeds}، واستخدام وسائل تعليمية ملموسة ومبسطة، وتقسيم المهام إلى خطوات صغيرة مع تقديم تغذية راجعة فورية.`
    : `تقديم دعم إضافي فردي أو في مجموعات صغيرة، واستخدام وسائل تعليمية ملموسة ومبسطة، وتقسيم المهام إلى خطوات صغيرة مع تقديم تغذية راجعة فورية.`;

  return JSON.stringify({
    title: lesson,
    stage,
    grade,
    subject,
    duration,
    objectives,
    timeDistribution: { introduction: intro, explanation, activity, assessment },
    strategies,
    introduction: `يبدأ المعلم بطرح سؤال محفز: "ما الذي تعرفه عن ${lesson}؟ وأين تراه في حياتك؟" ويمنح الطلاب ${Math.round(intro * 0.4)} دقيقة لعصف ذهني محفز بين الأقران. ثم يعرض صوراً وأمثلة واقعية مرتبطة بـ${lesson} ويستثير خبراتهم السابقة، ويختتم التمهيد بعرض أهداف الحصة بصورة واضحة ومحفزة خلال ${intro} دقيقة.`,
    mainContent: `يُقدم المعلم المحتوى الرئيسي لـ${lesson} بأسلوب تفاعلي ومنظم يناسب مستوى ${levelLabel}${classNature ? " في صف " + classNature : ""} خلال ${explanation} دقيقة. يتضمن الشرح:\n• تعريف المفهوم وخصائصه الأساسية بأمثلة محسوسة\n• الأمثلة التوضيحية من البيئة المحلية والحياة اليومية\n• الروابط مع المناهج والمواد الأخرى\n• تطبيقات عملية مناسبة لمستوى ${levelLabel}`,
    activities: [
      { name: "نشاط الاستكشاف الجماعي", description: `تُقسَّم الفئة إلى مجموعات من 3-4 طلاب، تتعاون كل مجموعة في استكشاف جانب من جوانب ${lesson} وتقديم نتائجها. النشاط مُصمَّم بما يتناسب مع مستوى ${levelLabel}${classNature ? " وطبيعة الصف " + classNature : ""}.`, duration: activityDur1, type: "group" as const },
      { name: "نشاط التطبيق الفردي", description: `يحل كل طالب مجموعة من الأسئلة المتدرجة المرتبطة بـ${lesson}، مع مراعاة الفروق الفردية${learningNeeds ? " وتقديم دعم خاص لمتطلبات: " + learningNeeds : " بتقديم مستويات مختلفة من الصعوبة"}.`, duration: activityDur2, type: "individual" as const },
      { name: "جلسة النقاش التحليلي", description: `يُدير المعلم نقاشاً موجَّهاً حول أبرز ما تعلمه الطلاب في ${lesson}، ويُشجع على ربط المعرفة الجديدة بالحياة العملية${learningOutcomes ? " وتحقيق الناتج: " + learningOutcomes : " وطرح التساؤلات والأفكار الإبداعية"}.`, duration: activityDur3, type: "discussion" as const },
      { name: "نشاط رقمي: مسابقة Kahoot تفاعلية", description: `يُعدّ المعلم مسابقة تفاعلية على منصة Kahoot تتضمن أسئلة متنوعة حول ${lesson} تناسب مستوى ${levelLabel}. يدخل الطلاب رمز المسابقة عبر أجهزتهم ويتنافسون، مما يُعزز المراجعة الممتعة والتفاعل الإيجابي.`, duration: activityDur4, type: "digital" as const },
    ],
    assessment: `يطبق المعلم تقييماً بنائياً شاملاً خلال ${assessment} دقيقة من خلال:\n• أسئلة شفهية متدرجة تقيس مستويات بلوم المناسبة لمستوى ${levelLabel}\n• بطاقة خروج: يكتب كل طالب أهم شيء تعلمه وسؤالاً واحداً لا يزال لديه${learningOutcomes ? "\n• التحقق من تحقق الناتج التعليمي: " + learningOutcomes : ""}`,
    closure: `يُلخص المعلم مع الطلاب أبرز نقاط ${lesson} من خلال خريطة مفاهيم جماعية تعكس ما تعلموه. يربط المعلم بين الدرس الحالي والدروس القادمة، ويختتم بكلمة تحفيزية تُشجع الطلاب على الاستكشاف والبحث خارج الصف.`,
    materials: ["الكتاب المدرسي المعتمد وكراسة التمارين", "السبورة الذكية والعروض التقديمية", "أوراق العمل والأنشطة الإثرائية", "وسائل تعليمية بصرية ونماذج توضيحية", "أجهزة الحاسب اللوحي ومنصة مدرستي"],
    differentiatedInstructions: {
      advanced: `تقديم مسائل إثرائية متقدمة ومشاريع بحثية مستقلة حول ${lesson}، وتكليفهم بشرح المفهوم لزملائهم (تعليم الأقران) وقيادة النقاشات التحليلية.`,
      average: `التركيز على الأهداف الأساسية مع تقديم أمثلة متنوعة، واستخدام الوسائل البصرية، وتشجيع المشاركة الإيجابية في الأنشطة الجماعية.`,
      needsSupport: needsSupportText,
    },
    homework: `يُكلَّف الطلاب بإعداد ملخص إبداعي لـ${lesson} (خريطة ذهنية أو عرض تقديمي أو مقطع فيديو قصير) مع البحث عن تطبيق عملي واحد في البيئة المحلية.`,
    madrasatiHomework: `يدخل الطالب إلى منصة مدرستي ويُنجز النشاط الرقمي المخصص لدرس ${lesson}، ويُرفع الإجابة عبر المنصة قبل الحصة القادمة.`,
  });
}

export function generateFallbackChatResponse(message: string): string {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("نشاط") || lowerMsg.includes("activity") || lowerMsg.includes("أضف")) {
    return `بالتأكيد! إليك نشاطاً إضافياً يمكن إضافته للخطة الدراسية:

**نشاط: لعبة الأسئلة التعليمية**
- النوع: جماعي (مجموعات من 3 طلاب)
- المدة: 8 دقائق
- الوصف: تتنافس المجموعات في الإجابة على أسئلة سريعة حول الدرس. المجموعة الفائزة تحصل على نقاط إضافية.

هل تريد تعديل المدة أو النوع؟`;
  }

  if (lowerMsg.includes("هدف") || lowerMsg.includes("objective") || lowerMsg.includes("بسّط") || lowerMsg.includes("سهّل")) {
    return `إليك إعادة صياغة الأهداف بشكل أكثر وضوحاً وقابلية للقياس:

1. **يُعرّف** الطالب المفهوم الرئيسي بكلماته الخاصة (مستوى التذكر والفهم)
2. **يَضرب** الطالب مثالاً واحداً من بيئته على المفهوم المدروس (مستوى التطبيق)
3. **يُميّز** الطالب بين الحالات الصحيحة والخاطئة المرتبطة بالمفهوم (مستوى التحليل)
4. **يُنتج** الطالب ملخصاً مرئياً (خريطة ذهنية أو رسم توضيحي) للمفهوم (مستوى التركيب)

هل تريد تعديل أي هدف أو إضافة مستوى معين؟`;
  }

  if (lowerMsg.includes("وقت") || lowerMsg.includes("توقيت") || lowerMsg.includes("دقيقة")) {
    return `إليك اقتراح لإعادة توزيع الوقت بشكل أكثر كفاءة:

| المرحلة | الوقت المقترح |
|---------|-------------|
| **التمهيد** | 5 دقائق |
| **الشرح** | 12 دقيقة |
| **النشاط الجماعي** | 15 دقيقة |
| **النشاط الفردي** | 8 دقائق |
| **التقييم والختام** | 5 دقائق |

**إجمالي:** 45 دقيقة ✓

هل هذا التوزيع مناسب لطبيعة الدرس؟`;
  }

  return `شكراً لسؤالك! كمساعدتك التعليمية "نهى"، إليك اقتراحي:

بناءً على طلبك، أنصح بـ:
• مراجعة الأهداف السلوكية لتكون أكثر قابلية للقياس
• إضافة أنشطة تفاعلية تراعي الفروق الفردية
• التأكد من التوافق مع معايير وزارة التعليم السعودية

هل يمكنك توضيح ما تريد تعديله بالتحديد؟`;
}
