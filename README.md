# نبراس — مساعد ذكي للمعلمين الجدد

<div dir="rtl">

## نظرة عامة

**نبراس** هو تطبيق ذكاء اصطناعي سعودي مُصمَّم خصيصاً لمساعدة المعلمين الجدد في المملكة العربية السعودية على إعداد خطط الدروس بسرعة واحترافية عالية، مدعوماً بتقنية **نهى 2.0** من شركة علم.

### ما يفعله التطبيق

- يُدخل المعلم اسمه ثم يختار المرحلة ← الصف ← المادة ← الدرس
- يُولّد التطبيق خطة درس متكاملة باللغة العربية في ثوانٍ
- يستخدم نظام **RAG** (الاسترجاع المعزَّز) بقاعدة بيانات pgvector تحتوي على 110 وثيقة من المناهج السعودية
- يُتيح المحادثة مع **نهى** لتعديل الخطة وتطويرها
- يُصدِّر خطة الدرس كملف Word منسَّق بالعربية جاهز للطباعة
- يعمل بالكامل من اليمين لليسار (RTL)

### المكدّس التقني

| الطبقة | التقنية |
|--------|---------|
| إدارة المشروع | pnpm workspaces (monorepo) |
| بيئة التشغيل | Node.js 24 |
| اللغة | TypeScript 5.9 |
| الواجهة الأمامية | React + Vite |
| خادم API | Express 5 |
| قاعدة البيانات | PostgreSQL + Drizzle ORM + pgvector |
| التحقق من البيانات | Zod v4, drizzle-zod |
| توليد API | Orval (من مواصفة OpenAPI) |
| البناء | esbuild |
| محرك الذكاء الاصطناعي | نهى 2.0 — شركة علم |

---

## الهيكل التنظيمي للملفات

```
nibras/
├── artifacts/
│   │
│   ├── api-server/                       ← خادم API (Express)
│   │   └── src/
│   │       ├── app.ts                    ← إعداد تطبيق Express
│   │       ├── index.ts                  ← نقطة الدخول للخادم
│   │       ├── lib/
│   │       │   └── logger.ts             ← نظام التسجيل (pino)
│   │       └── routes/
│   │           ├── health.ts             ← مسار التحقق من الصحة
│   │           ├── index.ts              ← تجميع المسارات
│   │           ├── nibras.ts             ← مسارات نبراس الرئيسية
│   │           └── nibras/
│   │               ├── client.ts         ← عميل نهى + الثوابت
│   │               ├── curriculum-data.ts ← بيانات المناهج السعودية
│   │               ├── fallback.ts       ← التوليد الاحتياطي
│   │               ├── index.ts          ← نقاط نهاية API
│   │               ├── prompts.ts        ← جميع البرومبتات
│   │               ├── rag.ts            ← منطق RAG والتضمينات
│   │               └── utils.ts          ← أدوات مساعدة
│   │
│   └── nibras/                           ← الواجهة الأمامية (React + Vite)
│       ├── vite.config.ts
│       └── src/
│           ├── App.tsx                   ← جذر التطبيق + التوجيه
│           ├── main.tsx                  ← نقطة تحميل React
│           ├── hooks/
│           │   └── hooks.ts              ← useIsMobile, useToast, useLocalStorage
│           ├── lib/
│           │   ├── store.ts              ← حالة Zustand العامة
│           │   ├── utils.ts              ← دوال مساعدة
│           │   ├── word-generator.ts     ← توليد ملف Word
│           │   └── pdf-generator.ts      ← توليد ملف PDF
│           ├── pages/
│           │   ├── home.tsx              ← صفحة الترحيب
│           │   ├── dashboard.tsx         ← لوحة التحكم الرئيسية
│           │   └── not-found.tsx         ← صفحة 404
│           └── components/
│               ├── chat.tsx              ← واجهة المحادثة مع نهى
│               ├── dashboard-card.tsx    ← بطاقة لوحة التحكم
│               ├── layout.tsx            ← التخطيط العام
│               ├── lesson-view.tsx       ← عرض خطة الدرس
│               └── ui/
│                   ├── button.tsx
│                   ├── display.tsx
│                   ├── inputs.tsx
│                   ├── overlay.tsx
│                   ├── navigation.tsx
│                   ├── dialog.tsx
│                   ├── commands.tsx
│                   ├── interactive.tsx
│                   ├── chart.tsx
│                   ├── misc.tsx
│                   ├── sidebar.tsx
│                   ├── card.tsx
│                   ├── badge.tsx
│                   ├── table.tsx
│                   ├── progress.tsx
│                   ├── separator.tsx
│                   ├── select.tsx
│                   ├── label.tsx
│                   ├── tooltip.tsx
│                   ├── accordion.tsx
│                   └── tabs.tsx
│
└── lib/                                  ← المكتبات المشتركة
    ├── api-spec/
    │   └── orval.config.ts               ← إعداد توليد API من OpenAPI
    ├── api-client-react/                 ← React Query hooks
    │   └── src/
    │       ├── index.ts
    │       ├── custom-fetch.ts
    │       └── generated/
    │           ├── api.ts
    │           └── api.schemas.ts
    ├── api-zod/                          ← أنواع TypeScript + Zod
    │   └── src/
    │       ├── index.ts
    │       └── generated/
    │           ├── api.ts
    │           └── types/
    │               ├── index.ts
    │               └── types.ts
    └── db/                               ← قاعدة البيانات
        ├── drizzle.config.ts
        └── src/
            ├── index.ts
            └── schema/
                └── index.ts
```

---

## خريطة مكونات الواجهة

| الملف | المكونات التي يحتوي عليها |
|-------|--------------------------|
| `button.tsx` | Button — الزر الأساسي بجميع أحجامه وألوانه، Toggle — زر التبديل، ToggleGroup — مجموعة أزرار التبديل |
| `display.tsx` | Card — البطاقة وأجزاؤها، Badge — الشارة، Table — الجداول، Separator — الفاصل، Progress — شريط التقدم، Skeleton — هيكل التحميل، Spinner — دوّار التحميل، Alert — التنبيه، Avatar — صورة المستخدم، AspectRatio — نسبة العرض |
| `inputs.tsx` | Input — حقل الإدخال، Textarea — منطقة النص، Label — التسمية، Select — القائمة المنسدلة، Checkbox — مربع الاختيار، RadioGroup — أزرار الاختيار، Switch — مفتاح التشغيل، Slider — شريط التمرير، Form — نظام النماذج، Calendar — التقويم، InputOTP — حقل رمز التحقق |
| `overlay.tsx` | Tooltip — تلميح الأداة، Popover — النافذة المنبثقة، HoverCard — بطاقة التمرير، Accordion — القائمة المطوية، Collapsible — العنصر القابل للطي |
| `navigation.tsx` | NavigationMenu — قائمة التنقل، Breadcrumb — مسار التنقل، Pagination — ترقيم الصفحات، Tabs — علامات التبويب، Menubar — شريط القوائم |
| `dialog.tsx` | Dialog — نافذة الحوار، AlertDialog — نافذة التأكيد، Sheet — اللوحة الجانبية، Drawer — الدرج السفلي |
| `commands.tsx` | Command — لوحة الأوامر والبحث، DropdownMenu — قائمة منسدلة، ContextMenu — قائمة السياق |
| `interactive.tsx` | ScrollArea — منطقة التمرير المخصصة، Resizable — الأجزاء القابلة لتغيير الحجم |
| `chart.tsx` | ChartContainer — حاوية الرسوم البيانية مع الألوان، Carousel — عرض الشرائح المتحرك |
| `misc.tsx` | Toaster — حاوية الإشعارات، Toast — الإشعار المنبثق، useToast — hook للتحكم بالإشعارات |
| `sidebar.tsx` | Sidebar — الشريط الجانبي الكامل مع SidebarProvider، SidebarTrigger، SidebarContent، SidebarMenu |
| `hooks/hooks.ts` | useIsMobile — كشف الشاشات الصغيرة، useToast — إدارة الإشعارات، useLocalStorage — التخزين المحلي |

**ملفات التصدير المباشر:**

| الملف | يُصدِّر من |
|-------|-----------|
| `card.tsx` | display.tsx |
| `badge.tsx` | display.tsx |
| `table.tsx` | display.tsx |
| `progress.tsx` | display.tsx |
| `separator.tsx` | display.tsx |
| `select.tsx` | inputs.tsx |
| `label.tsx` | inputs.tsx |
| `tooltip.tsx` | overlay.tsx |
| `accordion.tsx` | overlay.tsx |
| `tabs.tsx` | navigation.tsx |

---

## قائمة الـ 100 ملف المصدري

### خادم API — 19 ملفاً

| # | الملف |
|---|-------|
| 1 | `artifacts/api-server/build.mjs` |
| 2 | `artifacts/api-server/package.json` |
| 3 | `artifacts/api-server/tsconfig.json` |
| 4 | `artifacts/api-server/.replit-artifact/artifact.toml` |
| 5 | `artifacts/api-server/src/app.ts` |
| 6 | `artifacts/api-server/src/index.ts` |
| 7 | `artifacts/api-server/src/lib/logger.ts` |
| 8 | `artifacts/api-server/src/routes/health.ts` |
| 9 | `artifacts/api-server/src/routes/index.ts` |
| 10 | `artifacts/api-server/src/routes/nibras.ts` |
| 11 | `artifacts/api-server/src/routes/nibras/client.ts` |
| 12 | `artifacts/api-server/src/routes/nibras/curriculum-data.ts` |
| 13 | `artifacts/api-server/src/routes/nibras/fallback.ts` |
| 14 | `artifacts/api-server/src/routes/nibras/index.ts` |
| 15 | `artifacts/api-server/src/routes/nibras/prompts.ts` |
| 16 | `artifacts/api-server/src/routes/nibras/rag.ts` |
| 17 | `artifacts/api-server/src/routes/nibras/utils.ts` |
| 18 | `artifacts/api-server/src/lib/.gitkeep` |
| 19 | `artifacts/api-server/src/middlewares/.gitkeep` |

### الواجهة الأمامية (نبراس) — 45 ملفاً

| # | الملف |
|---|-------|
| 20 | `artifacts/nibras/components.json` |
| 21 | `artifacts/nibras/index.html` |
| 22 | `artifacts/nibras/package.json` |
| 23 | `artifacts/nibras/tsconfig.json` |
| 24 | `artifacts/nibras/vite.config.ts` |
| 25 | `artifacts/nibras/.replit-artifact/artifact.toml` |
| 26 | `artifacts/nibras/public/favicon.svg` |
| 27 | `artifacts/nibras/public/logo.png` |
| 28 | `artifacts/nibras/public/opengraph.jpg` |
| 29 | `artifacts/nibras/src/App.tsx` |
| 30 | `artifacts/nibras/src/main.tsx` |
| 31 | `artifacts/nibras/src/index.css` |
| 32 | `artifacts/nibras/src/hooks/hooks.ts` |
| 33 | `artifacts/nibras/src/lib/pdf-generator.ts` |
| 34 | `artifacts/nibras/src/lib/store.ts` |
| 35 | `artifacts/nibras/src/lib/utils.ts` |
| 36 | `artifacts/nibras/src/lib/word-generator.ts` |
| 37 | `artifacts/nibras/src/pages/dashboard.tsx` |
| 38 | `artifacts/nibras/src/pages/home.tsx` |
| 39 | `artifacts/nibras/src/pages/not-found.tsx` |
| 40 | `artifacts/nibras/src/components/chat.tsx` |
| 41 | `artifacts/nibras/src/components/dashboard-card.tsx` |
| 42 | `artifacts/nibras/src/components/layout.tsx` |
| 43 | `artifacts/nibras/src/components/lesson-view.tsx` |
| 44 | `artifacts/nibras/src/components/ui/accordion.tsx` |
| 45 | `artifacts/nibras/src/components/ui/badge.tsx` |
| 46 | `artifacts/nibras/src/components/ui/button.tsx` |
| 47 | `artifacts/nibras/src/components/ui/card.tsx` |
| 48 | `artifacts/nibras/src/components/ui/chart.tsx` |
| 49 | `artifacts/nibras/src/components/ui/commands.tsx` |
| 50 | `artifacts/nibras/src/components/ui/dialog.tsx` |
| 51 | `artifacts/nibras/src/components/ui/display.tsx` |
| 52 | `artifacts/nibras/src/components/ui/inputs.tsx` |
| 53 | `artifacts/nibras/src/components/ui/interactive.tsx` |
| 54 | `artifacts/nibras/src/components/ui/label.tsx` |
| 55 | `artifacts/nibras/src/components/ui/misc.tsx` |
| 56 | `artifacts/nibras/src/components/ui/navigation.tsx` |
| 57 | `artifacts/nibras/src/components/ui/overlay.tsx` |
| 58 | `artifacts/nibras/src/components/ui/progress.tsx` |
| 59 | `artifacts/nibras/src/components/ui/select.tsx` |
| 60 | `artifacts/nibras/src/components/ui/separator.tsx` |
| 61 | `artifacts/nibras/src/components/ui/sidebar.tsx` |
| 62 | `artifacts/nibras/src/components/ui/table.tsx` |
| 63 | `artifacts/nibras/src/components/ui/tabs.tsx` |
| 64 | `artifacts/nibras/src/components/ui/tooltip.tsx` |

### المكتبات المشتركة — 23 ملفاً

| # | الملف |
|---|-------|
| 65 | `lib/api-client-react/package.json` |
| 66 | `lib/api-client-react/tsconfig.json` |
| 67 | `lib/api-client-react/tsconfig.tsbuildinfo` |
| 68 | `lib/api-client-react/src/custom-fetch.ts` |
| 69 | `lib/api-client-react/src/index.ts` |
| 70 | `lib/api-client-react/src/generated/api.ts` |
| 71 | `lib/api-client-react/src/generated/api.schemas.ts` |
| 72 | `lib/api-spec/package.json` |
| 73 | `lib/api-spec/orval.config.ts` |
| 74 | `lib/api-spec/openapi.yaml` |
| 75 | `lib/api-zod/package.json` |
| 76 | `lib/api-zod/tsconfig.json` |
| 77 | `lib/api-zod/tsconfig.tsbuildinfo` |
| 78 | `lib/api-zod/src/index.ts` |
| 79 | `lib/api-zod/src/generated/api.ts` |
| 80 | `lib/api-zod/src/generated/types/index.ts` |
| 81 | `lib/api-zod/src/generated/types/types.ts` |
| 82 | `lib/db/package.json` |
| 83 | `lib/db/tsconfig.json` |
| 84 | `lib/db/tsconfig.tsbuildinfo` |
| 85 | `lib/db/drizzle.config.ts` |
| 86 | `lib/db/src/index.ts` |
| 87 | `lib/db/src/schema/index.ts` |

### الإعدادات الجذرية — 10 ملفات

| # | الملف |
|---|-------|
| 88 | `README.md` |
| 89 | `package.json` |
| 90 | `pnpm-workspace.yaml` |
| 91 | `pnpm-lock.yaml` |
| 92 | `tsconfig.json` |
| 93 | `tsconfig.base.json` |
| 94 | `.replit` |
| 95 | `.replitignore` |
| 96 | `.gitignore` |
| 97 | `.npmrc` |

### سكريبتات — 3 ملفات

| # | الملف |
|---|-------|
| 98 | `scripts/package.json` |
| 99 | `scripts/tsconfig.json` |
| 100 | `scripts/post-merge.sh` |

---

## الأوامر الرئيسية

```bash
pnpm run typecheck                              # فحص الأنواع في جميع الحزم
pnpm run build                                 # بناء جميع الحزم
pnpm --filter @workspace/api-spec run codegen  # إعادة توليد API من مواصفة OpenAPI
pnpm --filter @workspace/db run push           # تحديث مخطط قاعدة البيانات
pnpm --filter @workspace/api-server run dev    # تشغيل الخادم محلياً
```

---

## متغيرات البيئة

| المتغير | الوصف | القيمة الافتراضية |
|---------|-------|------------------|
| `NUHA_API_KEY` | مفتاح API لتقنية نهى 2.0 | — |
| `NUHA_BASE_URL` | رابط API | `https://elmodels.ngrok.app/v1` |
| `NUHA_MODEL` | اسم النموذج | `nuha-2.0` |
| `NUHA_EMBEDDING_MODEL` | نموذج التضمينات | — |

---

## ملاحظات مهمة

- توليد خطة الدرس يدوي فقط (بالضغط على الزر) — لا يوجد توليد تلقائي
- خطة الدرس تُحفظ تلقائياً عند تحديث الصفحة عبر localStorage
- لوحة التحكم تُعيد التوجيه للصفحة الرئيسية إذا لم يكن هناك اسم معلم
- قاعدة مصطلحية: دائماً **"عصف ذهني محفز"** — ممنوع "استفزازي" أو "إعصار فكري"
- مهلة الذكاء الاصطناعي: 60 ثانية (نهى تحتاج ~40 ثانية للاستجابة الكاملة)
- نظام RAG: pgvector مع 110 وثيقة مناهج مُدمجة

</div>
