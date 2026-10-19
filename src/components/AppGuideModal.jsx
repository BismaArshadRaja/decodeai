import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Layers, Volume2, MessageSquare, Zap, Pill, FlaskConical } from 'lucide-react';
import { BrandIcon } from './BrandIcon';

export const AppGuideModal = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isUrdu = lang === 'ur';
  const [activeTab, setActiveTab] = useState('howitworks');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white p-5 sm:p-6 relative border-b border-emerald-900/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <BrandIcon size="sm" animate={false} />
            <div>
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Document Reader & Voice Assistant</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-sans-main">
                Decode<span className="text-emerald-400">AI</span>
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 font-urdu mt-2">
            {isUrdu
              ? 'دستاویزات کو اردو اور انگلش میں سمجھنے اور سننے کا مکمل رہنما'
              : 'Complete user guide to reading and listening to documents in Urdu or English'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-3 sm:px-6 pt-2 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('howitworks')}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'howitworks'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>{isUrdu ? 'استعمال کا طریقہ' : 'How to Use'}</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'docs'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-600" />
            <span>{isUrdu ? 'سپورٹ شدہ کاغذات' : 'Supported Docs'}</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'voice'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>{isUrdu ? 'آواز اور زبان' : 'Voice & Language'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto text-stone-800">
          {activeTab === 'howitworks' && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-900 text-sm sm:text-base font-sans-main">
                {isUrdu ? '3 آسان مراحل میں رہنمائی حاصل کریں:' : 'Understand Your Document in 3 Easy Steps:'}
              </h4>
              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block font-sans-main">
                      {isUrdu ? 'تصویر اپ لوڈ کریں یا کیمرے سے لیں' : 'Upload Photo or Take with Camera'}
                    </span>
                    <p className="text-xs text-stone-600 font-urdu mt-0.5">
                      {isUrdu
                        ? 'اپنے فون کے کیمرے سے بجلی کے بل، ڈاکٹری نسخے یا میڈیکل لیب رپورٹ کی تصویر لیں۔'
                        : 'Take a photo of your electricity bill, doctor prescription, or lab report.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block font-sans-main">
                      {isUrdu ? 'اردو یا انگلش میں پڑھیں اور سنیں' : 'Read & Listen in Urdu or English'}
                    </span>
                    <p className="text-xs text-stone-600 font-urdu mt-0.5">
                      {isUrdu
                        ? 'چند سیکنڈز میں واجب الادا رقم، جرمانہ، تاریخ اور ادویات کے اوقات اردو یا انگریزی میں سنیں اور پڑھیں۔'
                        : 'Within seconds, view payment amounts, due date, late fees, and medicine timings.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-stone-900 block font-sans-main">
                      {isUrdu ? 'مزید سوالات پوچھیں اور شیئر کریں' : 'Ask Follow-up Questions & Share'}
                    </span>
                    <p className="text-xs text-stone-600 font-urdu mt-0.5">
                      {isUrdu
                        ? 'بل جمع کروانے کے طریقے یا ادویات کی احتیاطی تدابیر کے بارے میں سوال پوچھیں اور واٹس ایپ پر شیئر کریں۔'
                        : 'Ask questions about bill payment or dosage and easily share summaries.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs sm:text-sm text-stone-900">
                    {isUrdu ? 'بجلی کے بل (Electricity Bills)' : 'Electricity Bills'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-urdu">
                  {isUrdu
                    ? 'لیسکو، کے الیکٹرک، فیسکو، میپکو، آئیسکو وغیرہ۔ کل رقم، آخری تاریخ، جرمانہ اور یونٹس کا حساب۔'
                    : 'LESCO, KE, FESCO, MEPCO, IESCO, PESCO. Detects amounts, due dates, units, and late surcharge.'}
                </p>
              </div>

              <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-xs sm:text-sm text-stone-900">
                    {isUrdu ? 'ڈاکٹری نسخے (Doctor Prescriptions)' : 'Doctor Prescriptions'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-urdu">
                  {isUrdu
                    ? 'کلینک اور اسپتال کے نسخوں سے ہر دوائی کا نام، مقدار، اور کھانے کے اوقات (صبح/شام/کھانے کے بعد)۔'
                    : 'Medication names, written dosage, schedule (morning/night/after meals), and course duration.'}
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200">
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs sm:text-sm text-stone-900">
                    {isUrdu ? 'میڈیکل لیب رپورٹس (Medical Lab Reports)' : 'Medical Lab Reports'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-urdu">
                  {isUrdu
                    ? 'سی بی سی (CBC)، بلڈ شوگر، کولیسٹرول، ایل ایف ٹی، آر ایف ٹی۔ نارمل اور غیر نارمل ریڈنگز کی آسان تشریح۔'
                    : 'CBC blood tests, blood sugar, lipid profiles, liver and kidney reports with normal reference ranges.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs sm:text-sm text-stone-900">
                    {isUrdu ? 'اردو اور انگلش میں آواز' : 'Urdu & English Voice Playback'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-urdu leading-relaxed">
                  {isUrdu
                    ? 'آپ اپنی مرضی کے مطابق آواز اردو میں سن سکتے ہیں یا انگریزی میں۔ رفتار کم یا زیادہ کرنے کا کنٹرول بھی موجود ہے۔'
                    : 'Listen to document explanations in clear Urdu or English with adjustable playback speeds (0.8x to 1.25x).'}
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-stone-700" />
                  <span className="font-bold text-xs sm:text-sm text-stone-900">
                    {isUrdu ? 'ذہین سوال و جواب' : 'Interactive Q&A Assistant'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-urdu leading-relaxed">
                  {isUrdu
                    ? 'اگر آپ کو دستاویز کے بارے میں کچھ پوچھنا ہو تو سوال لکھیں اور اردو یا انگریزی دونوں میں جواب سنیں یا پڑھیں۔'
                    : 'Ask any question regarding your document and get instant answers with audio playback in your preferred language.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
          >
            {isUrdu ? 'ٹھیک ہے' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
