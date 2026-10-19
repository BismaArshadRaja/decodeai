import React from 'react';
import {
  Zap,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldAlert,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const ExtractedFieldsCard = ({ data, lang }) => {
  const isUrdu = lang === 'ur';

  // Helper for rendering confidence badges
  const renderConfidenceBadge = (confidence) => {
    if (confidence === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{isUrdu ? 'مکمل تصدیق شدہ' : 'High Confidence'}</span>
        </span>
      );
    }
    if (confidence === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <HelpCircle className="w-3 h-3 text-amber-600" />
          <span>{isUrdu ? 'درمیانہ' : 'Medium'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        <span>{isUrdu ? 'دھندلا / غیر واضح' : 'Unclear / Low'}</span>
      </span>
    );
  };

  if (data.doc_type === 'unsupported') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-stone-800">
        <div className="flex items-center gap-3 text-rose-700 mb-3">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">
            {isUrdu ? 'دستاویز کی قسم غیر متعلقہ ہے' : 'Unsupported Document Type'}
          </h3>
        </div>
        <p className="text-sm font-urdu leading-relaxed">
          {data.explanation_urdu}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warnings & Safety Banner */}
      {(data.doc_type === 'prescription' || data.doc_type === 'medical_report') && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm sm:text-base flex items-center gap-2">
              <span>{isUrdu ? 'لازمی طبی انتباہ (Medical Safety Disclaimer)' : 'Important Medical Safety Notice'}</span>
            </h4>
            <p className="text-xs sm:text-sm text-amber-800 font-urdu mt-1 leading-relaxed">
              {data.doc_type === 'medical_report'
                ? isUrdu
                  ? 'یہ صرف لیب رپورٹ پر لکھی ہوئی ریڈنگز کی معلوماتی وضاحت ہے۔ یہ کوئی حتمی تشخیص یا علاج نہیں ہے۔ رپورٹ کی حتمی جانچ کے لیے اپنے مستند معالج سے لازمی رجوع کریں۔'
                  : 'This is strictly an informational explanation of the lab values on your report. It is not a medical diagnosis. Always consult your qualified doctor or specialist for clinical decisions.'
                : isUrdu
                ? 'یہ نتیجہ صرف نسخے پر لکھی ہوئی تحریر کو پڑھ کر سمجھانے کے لیے ہے۔ ادویات شروع کرنے یا خوراک میں تبدیلی سے پہلے اپنے معالج یا مستند فارماسسٹ سے لازمی تصدیق کریں۔'
                : 'This explanation only reflects what is written on the prescription. Always verify with your qualified doctor or pharmacist before taking or modifying any medication.'}
            </p>
          </div>
        </div>
      )}

      {/* Low-confidence / Unclear fields safety warning */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900 text-sm">
              {isUrdu ? 'دھندلی تحریر کا انتباہ (Unclear Fields Warning)' : 'Unclear Text Notice'}
            </h4>
            <ul className="mt-1 space-y-1">
              {data.warnings.map((warn, i) => (
                <li key={i} className="text-xs sm:text-sm text-rose-800 font-urdu">
                  • {warn}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ELECTRICITY BILL DETAILS CARD */}
      {data.doc_type === 'electricity_bill' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
                  {data.company?.value || 'WAPDA / DISCO'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-sans-main">
                  {isUrdu ? 'بجلی کا بل (Electricity Bill)' : 'Electricity Bill Details'}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-200 block">
                {isUrdu ? 'بلنگ کا مہینہ' : 'Billing Month'}
              </span>
              <span className="font-bold text-sm sm:text-base">
                {data.billing_month?.value || 'Current'}
              </span>
            </div>
          </div>

          {/* Key Numbers Grid: Amount, Due Date, Late Fee */}
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-stone-100">
            {/* Amount Due (Within Date) */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">
                  {isUrdu ? 'کل قابلِ ادا رقم (وقت پر)' : 'Amount Due (Within Date)'}
                </span>
                {renderConfidenceBadge(data.amount_due?.confidence)}
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-sans-main">
                  Rs. {data.amount_due?.value ? Number(data.amount_due.value).toLocaleString() : '—'}
                </span>
                <span className="text-xs text-emerald-600 block font-urdu mt-0.5">
                  {isUrdu ? 'روپے (مقررہ تاریخ تک)' : 'PKR payable before due date'}
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isUrdu ? 'آخری تاریخ' : 'Due Date'}</span>
                </span>
                {renderConfidenceBadge(data.due_date?.confidence)}
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-stone-900 font-sans-main">
                  {data.due_date?.value || '—'}
                </span>
                <span className="text-xs text-stone-500 block font-urdu mt-0.5">
                  {isUrdu ? 'اس تاریخ تک بل جمع کرائیں' : 'Pay on or before this date'}
                </span>
              </div>
            </div>

            {/* Late Fee Penalty */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800">
                  {isUrdu ? 'تاخیری جرمانہ (Late Fee)' : 'Late Payment Surcharge'}
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-mono">
                  Calculated
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-sans-main">
                  + Rs. {data.late_fee !== null && data.late_fee !== undefined ? Number(data.late_fee).toLocaleString() : '—'}
                </span>
                <span className="text-xs text-rose-500 block font-urdu mt-0.5">
                  {isUrdu ? 'تاریخ گزرنے پر اضافی رقم' : 'Late fee after due date'}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Details: Units & Amount After Due Date */}
          <div className="p-5 sm:p-6 bg-stone-50/50 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-stone-500 block">{isUrdu ? 'استعمال شدہ یونٹ' : 'Units Consumed'}</span>
              <span className="font-bold text-stone-800 text-base font-sans-main">
                {data.units_consumed?.value ? `${data.units_consumed.value} Units` : '—'}
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">{isUrdu ? 'تاریخ کے بعد کل رقم' : 'Payable After Due Date'}</span>
              <span className="font-bold text-stone-800 text-base font-sans-main">
                Rs. {data.amount_after_due_date?.value ? Number(data.amount_after_due_date.value).toLocaleString() : '—'}
              </span>
            </div>
            <div>
              <span className="text-xs text-stone-500 block">{isUrdu ? 'صارف کا ریفرنس نمبر' : 'Consumer Reference ID'}</span>
              <span className="font-medium text-stone-800 text-xs sm:text-sm font-mono truncate block">
                {data.consumer_id?.value || '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIPTION DETAILS CARD */}
      {data.doc_type === 'prescription' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Prescription Header */}
          <div className="bg-gradient-to-r from-teal-700 to-cyan-800 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-teal-200">
                  {data.doctor_or_clinic?.value || 'Clinic / Doctor'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-sans-main">
                  {isUrdu ? 'ڈاکٹری نسخہ اور ادویات' : 'Prescription & Medicines'}
                </h3>
              </div>
            </div>
            {data.date?.value && (
              <div className="text-right">
                <span className="text-xs text-teal-200 block">{isUrdu ? 'تاریخ' : 'Date'}</span>
                <span className="font-bold text-sm">{data.date.value}</span>
              </div>
            )}
          </div>

          {/* Medicines List */}
          <div className="p-5 sm:p-6 divide-y divide-stone-100">
            <div className="pb-3 flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <span>{isUrdu ? 'تجویز کردہ ادویات' : 'Prescribed Medicines'}</span>
              <span>{isUrdu ? 'خوراک اور وقت' : 'Dosage & Schedule'}</span>
            </div>

            {data.medicines && data.medicines.length > 0 ? (
              data.medicines.map((med, index) => (
                <div key={index} className="py-4 first:pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h4 className="font-bold text-base sm:text-lg text-stone-900 font-sans-main">
                        {med.name?.value || (
                          <span className="text-rose-600 font-urdu">{isUrdu ? 'تحریر واضح نہیں ہے' : 'Unclear writing'}</span>
                        )}
                      </h4>
                      {renderConfidenceBadge(med.name?.confidence)}
                    </div>
                    {med.dose_as_written?.value && (
                      <p className="text-xs text-stone-600 pl-8">
                        <span className="font-semibold text-stone-800">{isUrdu ? 'مقدار:' : 'Dose:'}</span>{' '}
                        {med.dose_as_written.value}
                      </p>
                    )}
                  </div>

                  {/* Timing & Duration Box */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 sm:text-right sm:min-w-[220px]">
                    <div className="flex items-center sm:justify-end gap-1.5 text-xs text-stone-600 font-semibold mb-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isUrdu ? 'کب لینا ہے:' : 'When to take:'}</span>
                    </div>
                    <p className="text-sm font-urdu font-medium text-stone-900 leading-snug">
                      {med.timing?.value || (
                        <span className="text-rose-500 text-xs">{isUrdu ? 'وقت واضح نہیں ہے' : 'Timing not clear'}</span>
                      )}
                    </p>
                    {med.duration?.value && (
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                        {isUrdu ? `مدت: ${med.duration.value}` : `Duration: ${med.duration.value}`}
                      </span>
                    )}
                    {med.instructions?.value && (
                      <p className="text-xs text-stone-500 mt-1 font-urdu italic">
                        {med.instructions.value}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-stone-500 text-sm font-urdu">
                {isUrdu ? 'کوئی دوائی شناخت نہیں ہو سکی۔' : 'No medicines could be identified.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* MEDICAL LAB REPORT CARD */}
      {data.doc_type === 'medical_report' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Lab Report Header */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-purple-200 block">
                  {data.lab_name?.value || 'Diagnostic Lab'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-sans-main">
                  {data.test_name?.value || (isUrdu ? 'میڈیکل لیب ٹیسٹ رپورٹ' : 'Medical Lab Test Report')}
                </h3>
              </div>
            </div>
            <div className="text-right">
              {data.date?.value && (
                <span className="text-xs text-purple-200 block">
                  {data.date.value}
                </span>
              )}
              {data.patient_name?.value && (
                <span className="text-xs text-white/90 font-medium truncate block max-w-[150px]">
                  {data.patient_name.value}
                </span>
              )}
            </div>
          </div>

          {/* Quick parameter summary chips */}
          {data.parameters && data.parameters.length > 0 && (
            <div className="px-5 py-3 bg-indigo-50/50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-stone-600 font-semibold font-urdu">
                {isUrdu ? `کل ٹیسٹ پیرامیٹرز: ${data.parameters.length}` : `Total Parameters Tested: ${data.parameters.length}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  ● {data.parameters.filter(p => p.status === 'normal').length} {isUrdu ? 'نارمل' : 'Normal'}
                </span>
                {data.parameters.filter(p => p.status === 'low' || p.status === 'high').length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                    ▲ {data.parameters.filter(p => p.status === 'low' || p.status === 'high').length} {isUrdu ? 'توجہ طلب' : 'Attention'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Parameters List Table */}
          <div className="p-5 sm:p-6 divide-y divide-stone-100">
            <div className="pb-3 grid grid-cols-12 gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <span className="col-span-5 sm:col-span-4">{isUrdu ? 'ٹیسٹ کا نام' : 'Test Parameter'}</span>
              <span className="col-span-4 sm:col-span-3 text-center sm:text-left">{isUrdu ? 'نتیجہ / ریڈنگ' : 'Result / Unit'}</span>
              <span className="hidden sm:block sm:col-span-3">{isUrdu ? 'نارمل رینج' : 'Reference Range'}</span>
              <span className="col-span-3 sm:col-span-2 text-right">{isUrdu ? 'حیثیت' : 'Status'}</span>
            </div>

            {data.parameters && data.parameters.length > 0 ? (
              data.parameters.map((param, index) => {
                const isNormal = param.status === 'normal';
                const isHigh = param.status === 'high';
                const isLow = param.status === 'low';

                return (
                  <div key={index} className="py-4 first:pt-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Name & Confidence */}
                      <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 font-sans-main">
                            {param.parameter?.value || 'Unknown Parameter'}
                          </h4>
                          {renderConfidenceBadge(param.parameter?.confidence)}
                        </div>
                      </div>

                      {/* Result Value & Unit */}
                      <div className="col-span-4 sm:col-span-3 text-center sm:text-left">
                        <span className="text-base sm:text-lg font-extrabold text-stone-900 font-sans-main">
                          {param.value?.value !== undefined ? String(param.value.value) : '—'}
                        </span>
                        {param.unit && (
                          <span className="text-xs text-stone-500 ml-1 font-mono">
                            {param.unit}
                          </span>
                        )}
                        {param.reference_range && (
                          <span className="sm:hidden text-[10px] text-stone-500 block font-mono mt-0.5">
                            Ref: {param.reference_range}
                          </span>
                        )}
                      </div>

                      {/* Reference Range (Desktop) */}
                      <div className="hidden sm:block sm:col-span-3 text-xs text-stone-600 font-mono">
                        {param.reference_range ? param.reference_range : '—'}
                      </div>

                      {/* Status Badge */}
                      <div className="col-span-3 sm:col-span-2 text-right">
                        {isNormal && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isUrdu ? 'نارمل' : 'Normal'}</span>
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
                            <ArrowDownRight className="w-3 h-3 text-amber-600" />
                            <span>{isUrdu ? 'کم (Low)' : 'Low'}</span>
                          </span>
                        )}
                        {isHigh && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-full">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            <span>{isUrdu ? 'زیادہ (High)' : 'High'}</span>
                          </span>
                        )}
                        {param.status === 'unclear' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                            <HelpCircle className="w-3 h-3 text-stone-500" />
                            <span>{isUrdu ? 'مبہم' : 'Unclear'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Simple Urdu micro explanation if available */}
                    {param.simple_explanation_ur && (
                      <div className="ml-7 sm:ml-7 bg-stone-50 rounded-xl px-3 py-1.5 border border-stone-200/60 text-xs text-stone-700 font-urdu">
                        💡 {param.simple_explanation_ur}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-stone-500 text-sm font-urdu">
                {isUrdu ? 'کوئی ٹیسٹ ریڈنگ شناخت نہیں ہو سکی۔' : 'No lab parameters found.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
