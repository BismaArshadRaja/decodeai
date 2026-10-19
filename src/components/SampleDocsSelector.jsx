import React from 'react';
import { Zap, Pill, FileQuestion, ArrowRight, FlaskConical } from 'lucide-react';

export const SampleDocsSelector = ({
  onSelectSample,
  lang,
  disabled = false,
}) => {
  const isUrdu = lang === 'ur';

  const samples = [
    {
      id: 'sample-lesco-bill',
      title: isUrdu ? 'لیسکو بجلی کا بل' : 'LESCO Electricity Bill',
      sub: isUrdu ? 'لاہور ستمبر 2026 - قابلِ ادا رقم اور جرمانہ' : 'Domestic Bill • Amount & Late Fee',
      icon: Zap,
      color: 'emerald',
      badge: isUrdu ? 'بجلی کا بل' : 'Electricity Bill',
    },
    {
      id: 'sample-chughtai-cbc-report',
      title: isUrdu ? 'سی بی سی لیب رپورٹ' : 'CBC Lab Report',
      sub: isUrdu ? 'چغتائی لیب - ہیموگلوبن اور نارمل رینج' : 'Chughtai Lab • Hemoglobin, WBC, Platelets',
      icon: FlaskConical,
      color: 'indigo',
      badge: isUrdu ? 'لیب رپورٹ' : 'Lab Test',
    },
    {
      id: 'sample-printed-prescription',
      title: isUrdu ? 'کلینک پرنٹ شدہ نسخہ' : 'Clinic Printed Prescription',
      sub: isUrdu ? 'اینٹی بائیوٹک اور درد کش ادویات کے اوقات' : '3 Medications • Timings & Dosages',
      icon: Pill,
      color: 'teal',
      badge: isUrdu ? 'طبی نسخہ' : 'Prescription',
    },
    {
      id: 'sample-handwritten-prescription',
      title: isUrdu ? 'ڈاکٹر کا ہاتھ سے لکھا نسخہ' : 'Handwritten Prescription',
      sub: isUrdu ? 'دھندلی تحریر اور وارننگ کا ٹیسٹ' : 'Unclear Writing Safety Warning',
      icon: Pill,
      color: 'amber',
      badge: isUrdu ? 'وارننگ ٹیسٹ' : 'Safety Test',
    },
    {
      id: 'sample-unsupported-receipt',
      title: isUrdu ? 'جنرل اسٹور رسید' : 'Unsupported Store Receipt',
      sub: isUrdu ? 'غیر متعلقہ کاغذ پر انکار کا ٹیسٹ' : 'Safety rejection flow check',
      icon: FileQuestion,
      color: 'rose',
      badge: isUrdu ? 'غیر متعلقہ' : 'Unsupported',
    },
  ];

  return (
    <div className="mt-8 pt-6 border-t border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2 font-sans-main">
            <span>{isUrdu ? 'یا فوری آزمائشی دستاویزات پر کلک کریں' : 'Or Test Instantly With Ready Samples'}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              {isUrdu ? 'فوری آزمائشی نمونے' : 'Instant Demo Samples'}
            </span>
          </h3>
          <p className="text-xs text-stone-500 font-urdu mt-0.5">
            {isUrdu
              ? 'اگر آپ کے پاس اس وقت اصلی بل، نسخہ یا رپورٹ نہیں ہے تو نیچے دیے گئے کسی بھی نمونے کو آزمائیں۔'
              : 'Click any sample below to evaluate key-field extraction, calculated late fees, and safety warnings.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {samples.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSample(item.id)}
              disabled={disabled}
              className={`text-left p-3.5 rounded-2xl border transition-all text-stone-800 relative group overflow-hidden ${
                item.color === 'emerald'
                  ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  : item.color === 'indigo'
                  ? 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300'
                  : item.color === 'teal'
                  ? 'bg-teal-50/50 hover:bg-teal-50 border-teal-200 hover:border-teal-300'
                  : item.color === 'amber'
                  ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-200 hover:border-amber-300'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 hover:border-stone-300'
              } disabled:opacity-50 active:scale-[0.98] cursor-pointer`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.color === 'emerald'
                      ? 'bg-emerald-600 text-white'
                      : item.color === 'indigo'
                      ? 'bg-indigo-600 text-white'
                      : item.color === 'teal'
                      ? 'bg-teal-600 text-white'
                      : item.color === 'amber'
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-600 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600">
                  {item.badge}
                </span>
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-emerald-700 transition-colors font-sans-main">
                {item.title}
              </h4>
              <p className="text-[11px] text-stone-500 font-urdu mt-1 line-clamp-2 leading-relaxed">
                {item.sub}
              </p>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>{isUrdu ? 'دیکھیں اور سنیں' : 'Decode Sample'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
