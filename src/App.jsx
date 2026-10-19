import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  Zap,
  Pill,
  Check,
  Copy,
  Share2,
  RefreshCw,
  AlertTriangle,
  Eye,
  FlaskConical,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { VoicePlayer } from './components/VoicePlayer';
import { ExtractedFieldsCard } from './components/ExtractedFieldsCard';
import { InteractiveQnA } from './components/InteractiveQnA';
import { SampleDocsSelector } from './components/SampleDocsSelector';
import { CameraModal } from './components/CameraModal';
import { AppGuideModal } from './components/AppGuideModal';
import { BrandIcon } from './components/BrandIcon';
import { processAndCompressImage } from './utils/image';

export default function App() {
  const [lang, setLang] = useState('ur');
  const [script, setScript] = useState('urdu');
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const fileInputRef = useRef(null);
  const isUrdu = lang === 'ur';

  // Sync script tab when interface language is changed
  useEffect(() => {
    if (lang === 'en') {
      setScript('en');
    } else {
      setScript('urdu');
    }
  }, [lang]);

  // Processing step timer simulation
  useEffect(() => {
    let timer;
    if (isProcessing) {
      setProcessingStep(1);
      timer = setTimeout(() => {
        setProcessingStep(2);
        timer = setTimeout(() => {
          setProcessingStep(3);
        }, 2000);
      }, 1600);
    }
    return () => clearTimeout(timer);
  }, [isProcessing]);

  // Handle uploaded image file
  const handleFileSelected = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError(
        isUrdu
          ? 'براہ کرم صرف تصویر (JPG یا PNG) منتخب کریں۔'
          : 'Please upload an image file (JPG or PNG).'
      );
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError(
        isUrdu
          ? 'فائل کا سائز 15MB سے کم ہونا چاہیے۔'
          : 'File size must be under 15MB.'
      );
      return;
    }

    setError(null);
    setIsQuotaExceeded(false);
    setIsProcessing(true);

    try {
      // Step 1: Compress and resize on client for rapid response
      const { base64, mimeType } = await processAndCompressImage(file);
      setImagePreview(base64);

      // Step 2: Send to server for Gemini extraction and explanation
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 || errorData.quotaExceeded) {
          setIsQuotaExceeded(true);
          setError(
            isUrdu
              ? 'گوگل جیمنائی اے آئی کا روزانہ کا مفت کوٹہ مکمل ہو گیا ہے۔ آپ نیچے دیے گئے تیار ٹیسٹ سیمپلز فوری طور پر چیک کر سکتے ہیں۔'
              : 'Google Gemini daily free tier quota has been reached. You can test all features immediately using the ready sample documents below!'
          );
          return;
        }
        const friendlyMsg =
          isUrdu && errorData.error_urdu
            ? errorData.error_urdu
            : errorData.error && typeof errorData.error === 'string' && !errorData.error.startsWith('{')
            ? errorData.error
            : isUrdu
            ? 'دستاویز کو پڑھنے میں دشواری ہوئی۔ برائے مہربانی صاف روشنی میں واضح تصویر دوبارہ اپ لوڈ کریں۔'
            : 'Unable to analyze image. Please upload a clear photo.';
        throw new Error(friendlyMsg);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error processing document:', err?.message || err);
      const isQuota =
        err?.message?.includes('429') ||
        err?.message?.includes('Quota') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        setIsQuotaExceeded(true);
        setError(
          isUrdu
            ? 'گوگل جیمنائی اے آئی کا روزانہ کا مفت کوٹہ مکمل ہو گیا ہے۔ آپ نیچے دیے گئے تیار ٹیسٹ سیمپلز فوری طور پر چیک کر سکتے ہیں۔'
            : 'Gemini daily free tier quota reached. Please use the instant sample documents below to test all features.'
        );
      } else {
        setIsQuotaExceeded(false);
        setError(
          isUrdu
            ? 'دستاویز کو پڑھنے میں دشواری ہوئی۔ برائے مہربانی صاف روشنی میں واضح تصویر دوبارہ اپ لوڈ کریں۔'
            : err?.message && !err.message.startsWith('{')
            ? err.message
            : 'Error processing document. Please try again with a clearer photo.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sample selection
  const handleSelectSample = async (sampleId) => {
    setError(null);
    setIsQuotaExceeded(false);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId }),
      });

      const data = await response.json();
      setResult(data);

      if (sampleId === 'sample-lesco-bill') {
        setImagePreview('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80');
      } else if (sampleId === 'sample-chughtai-cbc-report') {
        setImagePreview('https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80');
      } else if (sampleId === 'sample-printed-prescription') {
        setImagePreview('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80');
      } else if (sampleId === 'sample-handwritten-prescription') {
        setImagePreview('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80');
      } else {
        setImagePreview('https://images.unsplash.com/photo-1554415707-9e49fa74883c?auto=format&fit=crop&w=800&q=80');
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
      setError('Could not load sample document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle direct camera photo capture
  const handleCameraCapture = async (base64Image) => {
    setImagePreview(base64Image);
    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process camera photo');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error processing camera photo:', err);
      setError(
        isUrdu
          ? 'تصویر پڑھنے میں دقت ہوئی۔ براہ کرم دوبارہ واضح تصویر لیں۔'
          : 'Could not process captured photo. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to upload another document
  const handleReset = () => {
    setResult(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get current active explanation text based on script tab
  const getActiveExplanationText = () => {
    if (!result) return '';
    if (script === 'roman') {
      return result.explanation_roman || result.explanation_urdu;
    }
    if (script === 'en') {
      return result.explanation_en || result.explanation_urdu;
    }
    return result.explanation_urdu;
  };

  // Copy to clipboard
  const handleCopy = () => {
    const text = getActiveExplanationText();
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const text = getActiveExplanationText();
    const shareMessage = `*DecodeAI Summary:*\n\n${text}\n\n_Decoded with DecodeAI_`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col bg-stone-50 text-stone-900 ${
        isUrdu ? 'font-arabic' : 'font-sans-main'
      }`}
    >
      {/* Navbar */}
      <Navbar
        lang={lang}
        onToggleLang={setLang}
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Toast alert for copy */}
        {copiedToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-urdu border border-stone-700 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{isUrdu ? 'خلاصہ کامیابی سے کاپی ہو گیا!' : 'Summary copied to clipboard!'}</span>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {error && (
          <div
            className={`mb-6 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border ${
              isQuotaExceeded
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  isQuotaExceeded ? 'text-amber-600' : 'text-rose-600'
                }`}
              />
              <div>
                <h4 className="font-bold text-sm">
                  {isQuotaExceeded
                    ? isUrdu
                      ? 'مفت اے آئی حد (Free Quota Limit)'
                      : 'Gemini Free Tier Quota Reached'
                    : isUrdu
                    ? 'پروسیسنگ میں دشواری'
                    : 'Processing Error'}
                </h4>
                <p className="text-xs sm:text-sm font-urdu mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
              {isQuotaExceeded && (
                <button
                  type="button"
                  onClick={() => handleSelectSample('sample-lesco-bill')}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'تیار سیمپل ٹیسٹ کریں' : 'Try Sample Document'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsQuotaExceeded(false);
                }}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors hover:underline cursor-pointer ${
                  isQuotaExceeded ? 'text-amber-800' : 'text-rose-600'
                }`}
              >
                {isUrdu ? 'ہٹائیں' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isProcessing && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-12 text-center shadow-lg max-w-xl mx-auto my-8 sm:my-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 sm:mb-6 relative">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse text-emerald-600" />
              <div className="absolute inset-0 rounded-3xl border-4 border-emerald-500 border-t-transparent animate-spin" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-sans-main">
              {isUrdu ? 'دستاویز کا معائنہ کیا جا رہا ہے' : 'Analyzing Document...'}
            </h3>

            {/* Stepper text */}
            <div className="mt-4 space-y-2 text-xs sm:text-sm text-stone-600 font-urdu">
              <div
                className={`p-2.5 rounded-xl transition-all ${
                  processingStep === 1
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'text-stone-400'
                }`}
              >
                1. {isUrdu ? 'تصویر کا بصری معائنہ کیا جا رہا ہے...' : 'Analyzing document layout...'}
              </div>
              <div
                className={`p-2.5 rounded-xl transition-all ${
                  processingStep === 2
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'text-stone-400'
                }`}
              >
                2. {isUrdu ? 'اہم رقوم، تاریخیں، ادویات یا لیب ٹیسٹ نکالے جا رہے ہیں...' : 'Extracting amounts, dates & parameters...'}
              </div>
              <div
                className={`p-2.5 rounded-xl transition-all ${
                  processingStep === 3
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'text-stone-400'
                }`}
              >
                3. {isUrdu ? 'آسان اردو و انگلش خلاصہ اور آواز تیار ہو رہی ہے...' : 'Generating Urdu & English explanations and audio...'}
              </div>
            </div>

            <p className="text-[11px] text-stone-400 mt-5 font-urdu">
              {isUrdu ? 'چند لمحوں میں مکمل ہو جاتا ہے' : 'Typically finishes in under 15 seconds'}
            </p>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {!isProcessing && result && (
          <div className="space-y-6">
            {/* Top Bar with Document badge & Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-stone-500">
                  {isUrdu ? 'شناخت شدہ دستاویز:' : 'Detected Document:'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    result.doc_type === 'electricity_bill'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : result.doc_type === 'prescription'
                      ? 'bg-teal-100 text-teal-800 border border-teal-200'
                      : result.doc_type === 'medical_report'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {result.doc_type === 'electricity_bill' && <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  {result.doc_type === 'prescription' && <Pill className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                  {result.doc_type === 'medical_report' && <FlaskConical className="w-3.5 h-3.5 text-indigo-700 shrink-0" />}
                  <span>
                    {result.doc_type === 'electricity_bill'
                      ? isUrdu
                        ? 'بجلی کا بل (Electricity Bill)'
                        : 'Electricity Bill'
                      : result.doc_type === 'prescription'
                      ? isUrdu
                        ? 'ڈاکٹری نسخہ (Prescription)'
                        : 'Doctor Prescription'
                      : result.doc_type === 'medical_report'
                      ? isUrdu
                        ? 'میڈیکل لیب رپورٹ (Lab Report)'
                        : 'Medical Lab Report'
                      : isUrdu
                      ? 'غیر متعلقہ کاغذ (Unsupported)'
                      : 'Unsupported Document'}
                  </span>
                </span>
                {result.isSample && (
                  <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                    Test Sample
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {imagePreview && (
                  <button
                    onClick={() => setShowImageModal(!showImageModal)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[32px] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>{showImageModal ? (isUrdu ? 'تصویر چھپائیں' : 'Hide Photo') : (isUrdu ? 'تصویر دیکھیں' : 'View Photo')}</span>
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs min-h-[32px] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>{isUrdu ? 'نئی دستاویز اسکین کریں' : 'Scan Another'}</span>
                </button>
              </div>
            </div>

            {/* Optional Collapsible Image Preview */}
            {imagePreview && showImageModal && (
              <div className="bg-stone-100 border border-stone-200 rounded-2xl p-3 flex justify-center max-h-80 overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Scanned document"
                  className="max-h-72 object-contain rounded-xl shadow-xs"
                />
              </div>
            )}

            {/* DUAL VOICE PLAYER (Urdu and English Voice Notes) */}
            <VoicePlayer
              urduText={result.explanation_urdu}
              englishText={result.explanation_en}
              isUrduUI={isUrdu}
              selectedScript={script}
              onScriptChange={(s) => setScript(s)}
            />

            {/* PLAIN EXPLANATION CARD WITH SCRIPT SWITCHER (Urdu / Roman Urdu / English) */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-stone-900 font-sans-main flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{isUrdu ? 'آسان الفاظ میں خلاصہ' : 'Plain Explanation'}</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-urdu">
                    {isUrdu
                      ? 'بغیر مشکل انگریزی کے، روزمرہ بول چال میں معلومات'
                      : 'Accessible explanation in everyday conversational language'}
                  </p>
                </div>

                {/* User Choice: Switch language/script for reading */}
                <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs self-start sm:self-auto">
                  <button
                    onClick={() => setScript('urdu')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      script === 'urdu'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    اردو
                  </button>
                  <button
                    onClick={() => setScript('roman')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      script === 'roman'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Roman Urdu
                  </button>
                  <button
                    onClick={() => setScript('en')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      script === 'en'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Main explanation text with enhanced typography */}
              <div className="py-2">
                <p
                  className={`text-base sm:text-xl leading-loose sm:leading-loose text-stone-800 ${
                    script === 'urdu' ? 'font-urdu' : 'font-sans-main'
                  }`}
                >
                  {getActiveExplanationText()}
                </p>
              </div>

              {/* Action Buttons: Copy & Share */}
              <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-stone-400 font-urdu">
                  {isUrdu ? 'عزیزوں یا ڈاکٹر کے ساتھ شیئر کریں' : 'Share summary with family or caregivers'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold flex items-center gap-1.5 transition-colors min-h-[34px] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span>{isUrdu ? 'خلاصہ کاپی کریں' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1.5 transition-colors min-h-[34px] cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{isUrdu ? 'واٹس ایپ پر شیئر کریں' : 'Share on WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* EXTRACTED FIELDS CARD (Amounts, Timings, Lab Parameters) */}
            <ExtractedFieldsCard data={result} lang={lang} />

            {/* GEN AI INTELLIGENT SUGGESTIONS & INTERACTIVE Q&A */}
            <InteractiveQnA data={result} lang={lang} />
          </div>
        )}

        {/* HOME / UPLOAD STATE */}
        {!isProcessing && !result && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto space-y-4 pt-2">
              {/* Attractive Logo Display */}
              <div className="flex justify-center mb-1">
                <BrandIcon size="lg" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-semibold border border-emerald-200">
                <Zap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{isUrdu ? 'بجلی کے بل • ڈاکٹری نسخے • میڈیکل لیب رپورٹس' : 'Electricity Bills • Prescriptions • Medical Lab Reports'}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight font-sans-main">
                {isUrdu ? (
                  <>
                    کسی بھی دستاویز کو <span className="text-emerald-600 font-urdu">آسان اردو</span> میں سمجھیں
                  </>
                ) : (
                  <>
                    Decode any document, <span className="text-emerald-600">in Urdu & English.</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-stone-600 font-urdu leading-relaxed max-w-xl mx-auto px-2">
                {isUrdu
                  ? 'بجلی کے بل، ڈاکٹری نسخے یا میڈیکل لیب رپورٹ کی تصویر اپ لوڈ کریں اور سیکنڈز میں واجب الادا رقم، جرمانہ، ادویات کے اوقات اور ٹیسٹ ریڈنگز کی سلیس اردو و انگریزی وضاحت اور وائس نوٹ حاصل کریں۔'
                  : 'Photo in, clear explanation and voice note out in seconds for electricity bills, prescriptions, and medical lab reports.'}
              </p>
            </div>

            {/* Upload & Camera Action Box */}
            <div className="bg-white rounded-3xl border-2 border-dashed border-stone-300 hover:border-emerald-500 transition-colors p-6 sm:p-12 text-center max-w-2xl mx-auto shadow-sm relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="doc-upload-input"
              />

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-1 font-sans-main">
                {isUrdu ? 'دستاویز کی تصویر یہاں اپ لوڈ کریں' : 'Upload Document Photo'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-urdu mb-6 max-w-sm mx-auto px-2">
                {isUrdu
                  ? 'اپنے کمپیوٹر یا فون سے بل، نسخے یا لیب رپورٹ کی تصویر منتخب کریں (JPG یا PNG)'
                  : 'Select an electricity bill, prescription, or medical lab report from your device.'}
              </p>

              {/* Action Buttons: Choose File & Take Photo */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <label
                  htmlFor="doc-upload-input"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'گیلری سے تصویر منتخب کریں' : 'Browse Gallery'}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUrdu ? 'کیمرے سے تصویر لیں' : 'Take Camera Photo'}</span>
                </button>
              </div>

              {/* File size & format note */}
              <span className="text-[11px] text-stone-400 block mt-4 font-mono">
                JPG, PNG • Auto-compressed • Max 15MB
              </span>
            </div>

            {/* Quick Feature Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto pt-2">
              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm font-sans-main">
                  {isUrdu ? 'بجلی کا بل اور جرمانہ' : 'Electricity Bills'}
                </h3>
                <p className="text-xs text-stone-500 font-urdu mt-1 leading-relaxed">
                  {isUrdu
                    ? 'اصل رقم، آخری تاریخ اور تاریخ گزرنے پر جرمانے کا واضح حسابی تعین۔'
                    : 'Amount due, due date, units consumed, and computed late surcharge.'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm font-sans-main">
                  {isUrdu ? 'ڈاکٹری نسخہ اور ادویات' : 'Doctor Prescriptions'}
                </h3>
                <p className="text-xs text-stone-500 font-urdu mt-1 leading-relaxed">
                  {isUrdu
                    ? 'ہر دوائی کا نام اور کھانے کے اوقات (صبح/شام) سلیس اردو میں۔'
                    : 'Medicine schedule, dosages, and safety reminders to verify with pharmacist.'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm font-sans-main">
                  {isUrdu ? 'میڈیکل لیب رپورٹ' : 'Medical Lab Reports'}
                </h3>
                <p className="text-xs text-stone-500 font-urdu mt-1 leading-relaxed">
                  {isUrdu
                    ? 'سی بی سی، شوگر اور لیب ٹیسٹ کی ریڈنگز، نارمل رینج اور آسان اردو تشریح۔'
                    : 'CBC, sugar, lipid tests with normal reference intervals and reassuring guidance.'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm font-sans-main">
                  {isUrdu ? 'اردو و انگلش آواز' : 'Urdu & English Voice'}
                </h3>
                <p className="text-xs text-stone-500 font-urdu mt-1 leading-relaxed">
                  {isUrdu
                    ? 'دستاویز کی مکمل وضاحت اردو یا انگلش آواز میں سنیں۔'
                    : 'Clear spoken audio notes in Urdu or English with adjustable playback speeds.'}
                </p>
              </div>
            </div>

            {/* PRE-LOADED SAMPLES GALLERY */}
            <SampleDocsSelector
              onSelectSample={handleSelectSample}
              lang={lang}
              disabled={isProcessing}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-stone-500 text-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandIcon size="sm" animate={false} />
            <span className="font-extrabold text-stone-800 font-sans-main text-sm">DecodeAI</span>
            <span>•</span>
            <span className="font-urdu">
              {isUrdu ? 'دستاویزات کی آسان تشریح اور وائس نوٹ' : 'AI Document Reader & Voice Note'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-stone-400">
            <button
              onClick={() => setIsInfoOpen(true)}
              className="text-emerald-700 hover:underline font-urdu flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'استعمال کی رہنمائی' : 'User Guide'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        lang={lang}
      />

      {/* User Guide Modal */}
      <AppGuideModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        lang={lang}
      />
    </div>
  );
}
