import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing large JSON payloads for images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Server-side Google GenAI initialization with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to detect 429 quota exhaustion or rate limits
export function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '') + ' ' + (err.status || '') + ' ' + JSON.stringify(err);
  return (
    err.status === 'RESOURCE_EXHAUSTED' ||
    err.status === 429 ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('429') ||
    msg.includes('Quota exceeded') ||
    msg.includes('quota')
  );
}

// Resilient model fallback runner to handle per-model free quotas gracefully
export async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}): Promise<{ text: string | undefined; response: any; modelUsed: string }> {
  // 'gemini-3.1-flash-lite' is the primary model with independent quota
  const modelCandidates = [
    params.preferredModel || 'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return { text: response.text, response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model "${model}" attempt failed:`, err?.message?.slice(0, 100));
      lastError = err;
    }
  }
  throw lastError;
}

export interface FieldWithConfidence<T = string | number | null> {
  value: T;
  confidence: 'high' | 'medium' | 'low' | null;
}

export interface ExtractedBill {
  company?: FieldWithConfidence<string>;
  billing_month?: FieldWithConfidence<string>;
  amount_due?: FieldWithConfidence<number>;
  due_date?: FieldWithConfidence<string>;
  amount_after_due_date?: FieldWithConfidence<number>;
  late_fee?: number | null;
  units_consumed?: FieldWithConfidence<number>;
  consumer_id?: FieldWithConfidence<string>;
}

export interface ExtractedMedicine {
  name: FieldWithConfidence<string>;
  dose_as_written?: FieldWithConfidence<string>;
  timing?: FieldWithConfidence<string>;
  duration?: FieldWithConfidence<string>;
  instructions?: FieldWithConfidence<string>;
}

export interface ExtractedLabParam {
  parameter: FieldWithConfidence<string>;
  value: FieldWithConfidence<string | number>;
  unit?: string;
  reference_range?: string;
  status: 'normal' | 'high' | 'low' | 'unclear';
  simple_explanation_ur?: string;
}

export interface ExtractedMedicalReport {
  lab_name?: FieldWithConfidence<string>;
  test_name?: FieldWithConfidence<string>;
  patient_name?: FieldWithConfidence<string>;
  date?: FieldWithConfidence<string>;
  parameters: ExtractedLabParam[];
}

// Pre-defined sample documents for instant testing
const SAMPLE_DOCS = [
  {
    id: 'sample-lesco-bill',
    titleEn: 'LESCO Electricity Bill (Lahore)',
    titleUr: 'لیسکو بجلی کا بل (لاہور)',
    category: 'bill',
    descriptionEn: 'Standard domestic electricity bill for September 2026',
    descriptionUr: 'ستمبر 2026 کا گھریلو بجلی کا بل',
    previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    mockData: {
      doc_type: 'electricity_bill',
      company: { value: 'LESCO', confidence: 'high' },
      billing_month: { value: 'Sep 2026', confidence: 'high' },
      amount_due: { value: 4200, confidence: 'high' },
      due_date: { value: '2026-10-15', confidence: 'high' },
      amount_after_due_date: { value: 4600, confidence: 'high' },
      units_consumed: { value: 180, confidence: 'high' },
      consumer_id: { value: '08-11234-5678901', confidence: 'high' },
      late_fee: 400,
      explanation_urdu: 'آپ کا لیسکو بجلی کا بل 4,200 روپے ہے۔ آخری تاریخ 15 اکتوبر 2026 ہے۔ اگر آپ وقت پر ادا نہیں کریں گے تو 400 روپے جرمانہ لگے گا اور کل رقم 4,600 روپے ہوگی۔ اس ماہ آپ نے 180 یونٹ استعمال کیے ہیں۔',
      explanation_roman: 'Aap ka LESCO bijli ka bill 4,200 rupay hai. Aakhri tareekh 15 October 2026 hai. Agar aap waqt par ada nahi karein ge to 400 rupay late fee lage gi aur kul raqam 4,600 rupay ho jaye gi. Is maheene aap ne 180 units istemal kiye hain.',
      explanation_en: 'Your LESCO electricity bill is Rs. 4,200. The due date is October 15, 2026. If paid after the due date, a late fee of Rs. 400 applies, making the total Rs. 4,600. You consumed 180 electricity units this month.',
      warnings: [],
      suggested_questions: [
        'یہ بل جاز کیش یا ایزی پیسہ سے کیسے جمع کرائیں؟',
        'اگر آخری تاریخ گزر جائے تو کیا بجلی کاٹ دی جائے گی؟',
        'یونٹ کم کرنے اور بل بچانے کے آسان طریقے کیا ہیں؟'
      ]
    }
  },
  {
    id: 'sample-printed-prescription',
    titleEn: 'Clinic Printed Prescription',
    titleUr: 'کلینک کا پرنٹ شدہ طبی نسخہ',
    category: 'prescription',
    descriptionEn: 'Printed doctor prescription with antibiotic, painkiller and antacid',
    descriptionUr: 'پرنٹ شدہ نسخہ مع اینٹی بائیوٹک، درد کش اور معدے کی دوائی',
    previewUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    mockData: {
      doc_type: 'prescription',
      doctor_or_clinic: { value: 'Dr. Tariq Mahmood (Shifa Clinic)', confidence: 'high' },
      date: { value: '16 Oct 2026', confidence: 'high' },
      medicines: [
        {
          name: { value: 'Augmentin 625mg', confidence: 'high' },
          dose_as_written: { value: '1 گولی (1 tablet)', confidence: 'high' },
          timing: { value: 'صبح اور شام کھانا کھانے کے بعد (Twice daily after food)', confidence: 'high' },
          duration: { value: '5 دن (5 days)', confidence: 'high' },
          instructions: { value: 'پانی کے ساتھ پورا کورس مکمل کریں', confidence: 'medium' }
        },
        {
          name: { value: 'Panadol 500mg', confidence: 'high' },
          dose_as_written: { value: '1 سے 2 گولیاں (1-2 tablets)', confidence: 'high' },
          timing: { value: 'صرف بخار یا درد ہونے پر (As needed for pain/fever)', confidence: 'high' },
          duration: { value: '3 دن (3 days)', confidence: 'high' },
          instructions: { value: '24 گھنٹے میں 8 گولیوں سے زیادہ نہ لیں', confidence: 'high' }
        },
        {
          name: { value: 'Risek 20mg', confidence: 'high' },
          dose_as_written: { value: '1 کیپسول (1 capsule)', confidence: 'high' },
          timing: { value: 'نہار منہ ناشتے سے 30 منٹ پہلے (Before breakfast)', confidence: 'high' },
          duration: { value: '7 دن (7 days)', confidence: 'high' },
          instructions: { value: 'خالی پیٹ پانی کے ساتھ لیں', confidence: 'high' }
        }
      ],
      explanation_urdu: 'ڈاکٹر طارق محمود نے 3 ادویات لکھی ہیں: 1. اوگمنٹن (Augmentin 625mg): صبح اور شام کھانا کھانے کے بعد 5 دن تک لیں۔ 2. پیناڈول (Panadol 500mg): صرف ضرورت کے وقت بخار یا سر درد میں لیں۔ 3. رائزک (Risek 20mg): روزانہ صبح نہار منہ ناشتے سے آدھا گھنٹہ پہلے 7 دن تک لیں۔ یاد رکھیں: یہ صرف نسخے کی وضاحت ہے، ادویات شروع کرنے سے پہلے فارماسسٹ سے لازمی تصدیق کریں۔',
      explanation_roman: 'Doctor Tariq Mahmood ne 3 adwiyaat likhi hain: 1. Augmentin 625mg: Subah aur shaam khana khane ke baad 5 din tak lein. 2. Panadol 500mg: Sirf zaroorat par bukhar ya dard mein lein. 3. Risek 20mg: Rozana subah nashte se 30 minute pehle 7 din tak lein. Yaad rakhein: kisi bhi dawa se pehle pharmacist se lazmi tasdeeq karein.',
      explanation_en: 'Dr. Tariq Mahmood prescribed 3 medications: 1. Augmentin 625mg: 1 tablet twice daily after meals for 5 days. 2. Panadol 500mg: 1-2 tablets as needed for fever/body aches. 3. Risek 20mg: 1 capsule before breakfast for 7 days. Important: Always verify with your doctor or pharmacist.',
      warnings: [],
      suggested_questions: [
        'کیا رائزک خالی پیٹ ہی لینا لازمی ہے؟',
        'اگر اوگمنٹن کی ایک خوراک بھول جائیں تو کیا کریں؟',
        'کیا پیناڈول خالی پیٹ لی جا سکتی ہے؟'
      ]
    }
  },
  {
    id: 'sample-chughtai-cbc-report',
    titleEn: 'Chughtai Lab CBC Blood Report',
    titleUr: 'چغتائی لیب — سی بی سی بلڈ ٹیسٹ رپورٹ',
    category: 'medical_report',
    descriptionEn: 'Complete Blood Count (CBC) with normal/low parameters and plain Urdu explanation',
    descriptionUr: 'سی بی سی بلڈ ٹیسٹ مع نارمل اور کم ہیموگلوبن کی واضح اردو تشریح',
    previewUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    mockData: {
      doc_type: 'medical_report',
      lab_name: { value: 'Chughtai Lab (Lahore)', confidence: 'high' },
      test_name: { value: 'Complete Blood Count (CBC / CP)', confidence: 'high' },
      patient_name: { value: 'Patient Record (Age: 38 / Female)', confidence: 'high' },
      date: { value: '16 Oct 2026', confidence: 'high' },
      parameters: [
        {
          parameter: { value: 'Hemoglobin (Hb)', confidence: 'high' },
          value: { value: '10.4', confidence: 'high' },
          unit: 'g/dL',
          reference_range: '12.0 - 15.5',
          status: 'low',
          simple_explanation_ur: 'ہیموگلوبن 10.4 ہے جو کہ نارمل سے کم ہے (خون میں سرخ ذرات یا آئرن کی کمی کا اشارہ)'
        },
        {
          parameter: { value: 'WBC (Total Leukocyte Count)', confidence: 'high' },
          value: { value: '6,800', confidence: 'high' },
          unit: '/uL',
          reference_range: '4,000 - 11,000',
          status: 'normal',
          simple_explanation_ur: 'سفید خلیے (قوت مدافعت) بالکل نارمل ہیں'
        },
        {
          parameter: { value: 'Platelet Count', confidence: 'high' },
          value: { value: '240,000', confidence: 'high' },
          unit: '/uL',
          reference_range: '150,000 - 450,000',
          status: 'normal',
          simple_explanation_ur: 'پلیٹ لیٹس (خون جمانے والے خلیے) مکمل صحت مند اور نارمل ہیں'
        },
        {
          parameter: { value: 'RBC Count', confidence: 'high' },
          value: { value: '3.9', confidence: 'high' },
          unit: 'mil/uL',
          reference_range: '4.2 - 5.4',
          status: 'low',
          simple_explanation_ur: 'سرخ ذرات کی تعداد تھوڑی سی کم ہے'
        },
        {
          parameter: { value: 'ESR (Sedimentation Rate)', confidence: 'high' },
          value: { value: '14', confidence: 'high' },
          unit: 'mm/hr',
          reference_range: '< 20',
          status: 'normal',
          simple_explanation_ur: 'جسم میں کسی شدید سوزش یا انفیکشن کا شبہ نہیں ہے'
        }
      ],
      explanation_urdu: 'آپ کی چغتائی لیب کی سی بی سی رپورٹ کے مطابق زیادہ تر نتائج اچھے ہیں۔ خاص بات یہ ہے کہ ہیموگلوبن 10.4 ہے، جو نارمل رینج (12 سے 15.5) سے تھوڑا کم ہے، جس کا مطلب خون کی ہلکی کمی (انیمیا) ہو سکتا ہے۔ وائٹ سیلز اور پلیٹ لیٹس بالکل نارمل ہیں۔ یاد رکھیں: یہ صرف ٹیسٹ کی وضاحت ہے، آئرن والی خوراک یا دوائی کے بارے میں اپنے معالج سے لازمی مشورہ کریں۔',
      explanation_roman: 'Aap ki Chughtai Lab CBC report ke mutabiq aksar nataij theek hain. Hemoglobin 10.4 hai jo ke normal range (12 se 15.5) se thora kam hai (mild anemia ka ishara). WBC aur Platelets bilkul normal hain. Doctor se lazmi rabta karein.',
      explanation_en: 'According to your Chughtai Lab CBC report, most parameters are healthy. Notably, Hemoglobin is 10.4 g/dL, which is slightly below the normal reference range (12.0 - 15.5 g/dL), indicating mild anemia. White blood cells and platelets are normal. Please consult your physician for clinical advice.',
      warnings: [],
      suggested_questions: [
        'ہیموگلوبن بڑھانے کے لیے کون سی غذائیں بہتر ہیں؟',
        'کیا پلیٹ لیٹس یا وائٹ سیلز میں کوئی خطرہ ہے؟',
        'کیا یہ ٹیسٹ دوبارہ کروانا پڑے گا؟'
      ]
    }
  },
  {
    id: 'sample-handwritten-prescription',
    titleEn: 'Handwritten Doctor Prescription (With Unclear Warning)',
    titleUr: 'ڈاکٹر کا ہاتھ سے لکھا نسخہ (دھندلا پن انتباہ کے ساتھ)',
    category: 'prescription',
    descriptionEn: 'Doctor handwriting with some unclear fields flagged with safety warnings',
    descriptionUr: 'ہاتھ کی تحریر جس میں کچھ معلومات مبہم ہیں اور وارننگ دکھائی گئی ہے',
    previewUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    mockData: {
      doc_type: 'prescription',
      doctor_or_clinic: { value: 'Dr. M. Akram Clinic', confidence: 'medium' },
      date: { value: '17 Oct 2026', confidence: 'medium' },
      medicines: [
        {
          name: { value: 'Brufen 400mg', confidence: 'high' },
          dose_as_written: { value: '1 گولی', confidence: 'high' },
          timing: { value: 'کھانے کے بعد دن میں دو بار', confidence: 'high' },
          duration: { value: '3 دن', confidence: 'medium' },
          instructions: { value: null, confidence: null }
        },
        {
          name: { value: 'Cefixime 400mg (?)', confidence: 'low' },
          dose_as_written: { value: '1 کیپسول', confidence: 'medium' },
          timing: { value: 'تحریر واضح نہیں ہے', confidence: 'low' },
          duration: { value: null, confidence: null },
          instructions: { value: null, confidence: null }
        }
      ],
      explanation_urdu: 'ڈاکٹر اکرم کے نسخے میں 2 دوائیں دکھائی دے رہی ہیں: بروفین 400 ملی گرام (کھانے کے بعد دن میں دو بار)، جبکہ دوسری دوائی (شاید سیفکسیم) کی تحریر دھندلی ہے اور اس کا وقت معلوم نہیں ہو سکا۔ برائے مہربانی دھندلی دوائی ہرگز نہ لیں جب تک کہ آپ قریبی فارماسسٹ یا ڈاکٹر کو نسخہ نہ دکھا لیں۔',
      explanation_roman: 'Doctor Akram ke nuskhe mein 2 dawaayein hain: Brufen 400mg (khane ke baad din mein do baar). Doosri dawai ki tehreer dhundli hai aur timing wazeh nahi. Baraye meherbani dhundli dawa pharmacist ko dikhaye baghair na lein.',
      explanation_en: 'The prescription shows Brufen 400mg (1 tablet twice daily after meals). The second medicine handwriting is blurred/unclear and the dosage timing could not be verified. Please show this to a pharmacist before consuming.',
      warnings: [
        'وارننگ: دوسری دوائی کا نام اور وقت ہاتھ کی لکھائی کی وجہ سے مکمل واضح نہیں ہے۔ ہم نے کوئی اندازہ نہیں لگایا۔ براہ کرم ڈاکٹر یا فارمیسی سے تصدیق کریں۔'
      ],
      suggested_questions: [
        'دھندلی دوائی کی پہچان کے لیے فارماسسٹ کو کیا دکھانا ہوگا؟',
        'کیا بروفین خالی پیٹ کھائی جا سکتی ہے؟'
      ]
    }
  },
  {
    id: 'sample-unsupported-receipt',
    titleEn: 'Grocery Store Receipt (Unsupported Test)',
    titleUr: 'جنرل اسٹور رسید (غیر متعلقہ دستاویز ٹیسٹ)',
    category: 'unsupported',
    descriptionEn: 'Tests safety rejection flow when an irrelevant document is provided',
    descriptionUr: 'جب غیر متعلقہ کاغذ اپ لوڈ ہو تو شائستہ انکار کا ٹیسٹ',
    previewUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa74883c?auto=format&fit=crop&w=800&q=80',
    mockData: {
      doc_type: 'unsupported',
      explanation_urdu: 'معذرت، یہ دستاویز بجلی کا بل یا ڈاکٹر کا نسخہ معلوم نہیں ہوتی۔ ڈیکوڈ اے آئی فی الوقت صرف بجلی کے بلوں اور ڈاکٹری نسخوں کو سمجھ سکتا ہے۔ برائے مہربانی صرف بجلی کا بل یا نسخہ اپ لوڈ کریں۔',
      explanation_roman: 'Maazrat, yeh dastawaiz bijli ka bill ya doctor ka nuskha nahi hai. DecodeAI filwaqt sirf bijli ke bills aur prescriptions ko decode karta hai.',
      explanation_en: 'This document is neither an electricity bill nor a medical prescription. DecodeAI currently supports electricity bills and clinic prescriptions only.',
      warnings: ['دستاویز کی قسم غیر متعلقہ ہے (Unsupported document type)']
    }
  }
];

// Helper endpoint for sample documents
app.get('/api/samples', (_req: Request, res: Response) => {
  res.json({ samples: SAMPLE_DOCS });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Primary decoding endpoint
app.post('/api/explain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', sampleId } = req.body;

    // Fast-path: If user selected a pre-verified sample document, return it instantly
    if (sampleId) {
      const foundSample = SAMPLE_DOCS.find((s) => s.id === sampleId);
      if (foundSample) {
        res.json({
          success: true,
          ...foundSample.mockData,
          isSample: true,
        });
        return;
      }
    }

    if (!imageBase64) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    // Clean base64 string if it contains data URI prefix
    const rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // STEP 1: Vision Extraction with strict JSON Schema
    const extractionPrompt = `
You are DecodeAI, a document understanding engine specialized for Pakistan everyday documents:
1. Electricity Bills (LESCO, K-Electric, FESCO, MEPCO, IESCO, PESCO, GEPCO, HESCO, QESCO, SEPCO)
2. Doctor Prescriptions (Clinic prescriptions, handwritten/printed)
3. Medical Lab Reports (CBC, Blood Sugar/HbA1c, Lipid Profile, LFT, RFT/Kidney, Thyroid, Urine R/E from Chughtai Lab, Shaukat Khanum, Essa Lab, Aga Khan, IDC, etc.)
Analyze this image thoroughly.

TASK:
1. Determine doc_type: MUST be one of "electricity_bill", "prescription", "medical_report", or "unsupported".
   - If it is a grocery receipt, ID card, selfie, animal, random object, or document not in scope, classify strictly as "unsupported".
2. If electricity_bill, extract:
   - company: electricity distribution company (e.g. LESCO, K-Electric, FESCO)
   - billing_month: month and year (e.g. "Sep 2026")
   - amount_due: exact payable amount within due date as integer or null
   - due_date: due date formatted as YYYY-MM-DD or readable string
   - amount_after_due_date: payable amount after due date as integer or null
   - units_consumed: electricity units consumed as integer or null
   - consumer_id: consumer reference number/id as string
3. If prescription, extract:
   - doctor_or_clinic: doctor name, clinic name, or hospital
   - date: prescription date
   - medicines: list of medications. For each:
     - name: medication brand/generic name with strength (e.g. "Augmentin 625mg", "Panadol 500mg")
     - dose_as_written: dose written (e.g. "1 tablet", "1 tsp", "10ml")
     - timing: when to take (e.g. "Morning and night after food", "BD pc", "OD", "TDS")
     - duration: length of course (e.g. "5 days", "1 week")
     - instructions: any specific note written (e.g. "take with plenty of water")
4. If medical_report, extract:
   - lab_name: lab or hospital name (e.g. "Chughtai Lab", "Shaukat Khanum", "Essa Lab")
   - test_name: diagnostic test name (e.g. "Complete Blood Count (CBC)", "Lipid Profile", "Fasting Blood Sugar")
   - patient_name: patient name or patient ID if visible
   - date: test date
   - parameters: list of test parameters. For each:
     - parameter: name of parameter (e.g. "Hemoglobin", "WBC Count", "Platelets", "Creatinine")
     - value: result value (e.g. 10.4, 6800, "Negative")
     - unit: unit (e.g. "g/dL", "/uL", "mg/dL", "%")
     - reference_range: normal biological reference range (e.g. "12.0 - 15.5", "4,000 - 11,000")
     - status: "normal" | "high" | "low" | "unclear"
     - simple_explanation_ur: 1 short sentence in everyday Urdu explaining this indicator

CRITICAL INTEGRITY RULES:
- FOR EACH FIELD, return an object: {"value": ..., "confidence": "high" | "medium" | "low" | null}.
- NEVER GUESS or hallucinate unclear text. If handwriting or print is illegible or blurred, return value: null and confidence: "low" or null.
- If doc_type is unsupported, all other fields can be omitted.
- Return ONLY valid JSON in your response. Do not wrap in markdown or backticks.
`;

    const visionResponse = await generateContentWithFallback({
      preferredModel: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: rawBase64,
            },
          },
          { text: extractionPrompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const visionText = visionResponse.text?.trim() || '{}';
    let extracted: any = {};
    try {
      extracted = JSON.parse(visionText);
    } catch (parseErr) {
      console.error('Failed to parse extraction JSON:', visionText, parseErr);
      res.status(500).json({
        error: 'Unable to analyze image. Please upload a clearer photo.',
      });
      return;
    }

    const docType = extracted.doc_type || 'unsupported';

    // If unsupported, return polite Urdu refusal per FR-5
    if (docType === 'unsupported') {
      res.json({
        success: true,
        doc_type: 'unsupported',
        explanation_urdu:
          'یہ دستاویز بجلی کا بل، ڈاکٹری نسخہ یا لیب رپورٹ معلوم نہیں ہوتی۔ ڈیکوڈ اے آئی فی الوقت بجلی کے بلوں، نسخوں اور میڈیکل ٹیسٹ رپورٹس کو سمجھ سکتا ہے۔ برائے مہربانی بل، نسخہ یا لیب رپورٹ اپ لوڈ کریں۔',
        explanation_roman:
          'Yeh dastawaiz bijli ka bill, doctor ka nuskha ya medical report nahi hai. DecodeAI filwaqt bijli ke bills, prescriptions aur lab reports ko decode karta hai. Baraye meherbani bill, nuskha ya report upload karein.',
        explanation_en:
          'This document does not appear to be an electricity bill, prescription, or medical lab report. DecodeAI supports electricity bills, doctor prescriptions, and medical lab reports. Please upload one of these documents.',
        warnings: ['دستاویز کی قسم غیر متعلقہ ہے / Unsupported document type'],
      });
      return;
    }

    // Safety and computation layer in code (FR-8, Prompt rules):
    const warnings: string[] = [];

    // For bills: Compute late fee in code (amount_after_due_date - amount_due)
    let computedLateFee: number | null = null;
    if (docType === 'electricity_bill') {
      const amountDue = Number(extracted.amount_due?.value);
      const amountAfter = Number(extracted.amount_after_due_date?.value);
      if (!isNaN(amountDue) && !isNaN(amountAfter) && amountAfter > amountDue) {
        computedLateFee = amountAfter - amountDue;
      }

      // Check for low-confidence or missing key fields
      if (extracted.amount_due?.confidence === 'low' || !extracted.amount_due?.value) {
        warnings.push('بل کی اصل رقم تصویر میں واضح نہیں ہے، برائے مہربانی بل کے نچلے حصے کی واضح تصویر لیں۔');
      }
      if (extracted.due_date?.confidence === 'low' || !extracted.due_date?.value) {
        warnings.push('آخری تاریخ پوری طرح نظر نہیں آ رہی۔ تاخیر سے بچنے کے لیے تاریخ کی تصدیق کریں۔');
      }
    }

    // For prescriptions: check low confidence fields
    if (docType === 'prescription') {
      const medicines = Array.isArray(extracted.medicines) ? extracted.medicines : [];
      const hasLowConfidence = medicines.some(
        (m: any) =>
          m.name?.confidence === 'low' ||
          m.timing?.confidence === 'low' ||
          m.dose_as_written?.confidence === 'low' ||
          !m.name?.value
      );
      if (hasLowConfidence) {
        warnings.push(
          'وارننگ: نسخے کی لکھائی میں کچھ ادویات یا ان کا وقت واضح نہیں ہے۔ ہم نے کوئی اندازہ نہیں لگایا تاکہ آپ محفوظ رہیں۔ برائے مہربانی فارماسسٹ سے لازمی تصدیق کریں۔'
        );
      }
    }

    // For medical lab reports: check for unclear parameters
    if (docType === 'medical_report') {
      const parameters = Array.isArray(extracted.parameters) ? extracted.parameters : [];
      const hasUnclear = parameters.some(
        (p: any) =>
          p.parameter?.confidence === 'low' ||
          p.value?.confidence === 'low' ||
          p.status === 'unclear' ||
          !p.parameter?.value
      );
      if (hasUnclear) {
        warnings.push(
          'وارننگ: میڈیکل رپورٹ کے کچھ ٹیسٹ پیرامیٹرز یا ریڈنگز تصویر میں کٹی ہوئی یا دھندلی ہیں۔ برائے مہربانی مکمل اور واضح تصویر کھینچیں۔'
        );
      }
    }

    // STEP 2: Generation of short, simple Urdu, Roman Urdu, and English explanations
    const explanationPrompt = `
You are the Urdu voice and accessibility assistant of DecodeAI.
Based EXCLUSIVELY on this extracted JSON data, write a short, clear, and reassuring explanation for a Pakistani adult with basic schooling:

Extracted JSON:
${JSON.stringify({ ...extracted, computed_late_fee: computedLateFee })}

RULES:
1. Write 3 to 6 short, easy-to-understand Urdu sentences.
2. Use everyday, spoken Pakistani Urdu vocabulary (نارمل بول چال کی اردو).
3. Keep digits in numbers (e.g. 4,200 روپے, 15 اکتوبر, 10.4 ہیموگلوبن).
4. DO NOT add any facts, diagnosis, or recommendations not present in the JSON.
5. If it is a bill, mention: Company, Total amount due, Due date, Late fee penalty if late, and Units consumed if available.
6. If it is a prescription, list each medicine name, dosage, and when to take it (صبح، شام، کھانے سے پہلے یا بعد). NEVER alter doses.
7. If it is a medical_report:
   - Mention the test name and lab.
   - Reassuringly summarize which values are normal/healthy and which are low or high.
   - Explain what the low/high indicator commonly implies in simple, non-frightening words (e.g. low hemoglobin implies mild anemia/blood deficiency).
   - NEVER diagnose diseases and always remind them to show the report to their doctor.
8. Also provide the Roman Urdu version (written in English alphabet Urdu, like: "Aap ka LESCO bill 4,200 rupay hai..." or "Aap ki CBC report mein...")
9. Also provide a simple English version.
10. Provide 3 contextually relevant, helpful follow-up questions in Urdu that the user might want to ask.

Return ONLY valid JSON matching this schema:
{
  "explanation_urdu": "string",
  "explanation_roman": "string",
  "explanation_en": "string",
  "suggested_questions": ["string", "string", "string"]
}
`;

    const expResponse = await generateContentWithFallback({
      preferredModel: 'gemini-3.1-flash-lite',
      contents: explanationPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let expData: any = {};
    try {
      expData = JSON.parse(expResponse.text?.trim() || '{}');
    } catch {
      expData = {
        explanation_urdu: 'آپ کی دستاویز کامیابی سے پڑھ لی گئی ہے۔ تفصیلات نیچے کارڈ میں ملاحظہ کریں۔',
        explanation_roman: 'Aap ki dastawaiz kamyabi se parh li gayi hai. Tafseelat neechay card mein dekhein.',
        explanation_en: 'Your document was successfully analyzed. See details in the cards below.',
        suggested_questions: [],
      };
    }

    res.json({
      success: true,
      doc_type: docType,
      ...extracted,
      late_fee: computedLateFee,
      explanation_urdu: expData.explanation_urdu || '',
      explanation_roman: expData.explanation_roman || '',
      explanation_en: expData.explanation_en || '',
      suggested_questions: expData.suggested_questions || [],
      warnings,
    });
  } catch (error: any) {
    console.error('Error processing document in /api/explain:', error?.message || error);
    if (isQuotaExhaustedError(error)) {
      res.status(429).json({
        quotaExceeded: true,
        error: 'Google Gemini daily free tier quota has been reached. Please try one of our instant sample documents below!',
        error_urdu: 'گوگل جیمنائی کا یومیہ مفت کوٹہ مکمل ہو گیا ہے۔ آپ نیچے دیے گئے تیار نمونہ ٹیسٹ فوری آزما سکتے ہیں۔',
      });
      return;
    }
    res.status(500).json({
      error: 'Failed to process document. Please try again with a clear photo.',
      error_urdu: 'دستاویز کو پڑھنے میں دشواری ہوئی۔ برائے مہربانی صاف روشنی میں واضح تصویر دوبارہ اپ لوڈ کریں۔',
    });
  }
});

// Interactive GenAI intelligent question & answer endpoint
app.post('/api/ask', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, context, language = 'ur' } = req.body;

    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const qnaPrompt = `
You are DecodeAI, a helpful, responsible accessibility assistant in Pakistan.
The user is asking a question about their decoded document.

Document Context:
${JSON.stringify(context || {})}

User Question:
"${question}"

User Language Preference: ${language} (ur = Urdu, roman = Roman Urdu, en = English)

STRICT SAFETY GUIDELINES:
1. If the question is about an electricity bill (e.g. how to pay via JazzCash, Easypaisa, bank app, 1Link, or late penalties), give step-by-step simple instructions relevant to Pakistan.
2. If the question is about a medical prescription:
   - NEVER give diagnosis, never tell them to change or skip doses, and never suggest alternative medicines.
   - You may clarify what the prescription says (e.g. "BD means twice a day", "PC means after meals").
   - Always conclude medical answers with a clear reminder: "کسی بھی تبدیلی سے پہلے اپنے معالج یا فارماسسٹ سے ضرور رابطہ کریں".
3. If the question is about a medical lab report or dental/biopsy report (e.g. CBC, hemoglobin, cyst, biopsy, WBC, creatinine, cholesterol):
   - Explain what the test parameter or condition means in simple, reassuring words so the patient does not panic.
   - You may mention healthy lifestyle or dental follow-up habits.
   - NEVER provide a clinical diagnosis or suggest drugs. Conclude with a reminder to consult their physician/dentist for definitive medical decisions.
4. Keep the response concise, polite, and reassuring (maximum 3-4 sentences).

CRITICAL REQUIREMENT:
Provide the answer in ALL THREE languages so the user can choose how to read or listen:
1. "answer_urdu": Simple everyday Pakistani Urdu (نارمل بول چال کی اردو) in Nastaliq script.
2. "answer_roman": Roman Urdu written with English letters (e.g. "Aap ki report ke mutabiq...")
3. "answer_en": Plain, clear English.

Return ONLY a valid JSON object matching this schema:
{
  "answer_urdu": "string",
  "answer_roman": "string",
  "answer_en": "string"
}
`;

    const response = await generateContentWithFallback({
      preferredModel: 'gemini-3.1-flash-lite',
      contents: qnaPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let qnaData: any = {};
    try {
      qnaData = JSON.parse(response.text?.trim() || '{}');
    } catch {
      const fallbackText = response.text || '';
      qnaData = {
        answer_urdu: fallbackText,
        answer_roman: fallbackText,
        answer_en: fallbackText,
      };
    }

    const primaryAnswer =
      language === 'ur'
        ? qnaData.answer_urdu || qnaData.answer_en || ''
        : language === 'roman'
        ? qnaData.answer_roman || qnaData.answer_urdu || ''
        : qnaData.answer_en || qnaData.answer_urdu || '';

    res.json({
      success: true,
      answer: primaryAnswer,
      answer_urdu: qnaData.answer_urdu || primaryAnswer,
      answer_roman: qnaData.answer_roman || primaryAnswer,
      answer_en: qnaData.answer_en || primaryAnswer,
    });
  } catch (error: any) {
    console.error('Error answering question in /api/ask:', error?.message || error);
    const requestedLang = req.body?.language || 'ur';
    if (isQuotaExhaustedError(error)) {
      const quotaMsgUrdu = 'معذرت، یومیہ اے آئی کوٹہ عارضی طور پر مکمل ہو گیا ہے۔ برائے مہربانی کچھ دیر بعد دوبارہ سوال پوچھیں۔';
      const quotaMsgEn = 'AI daily request limit reached. Please try asking your question again in a short while.';
      res.json({
        success: true,
        answer: requestedLang === 'ur' ? quotaMsgUrdu : quotaMsgEn,
        answer_urdu: quotaMsgUrdu,
        answer_roman: 'Maazrat, AI quota mukammal ho gaya hai. Baraye meherbani baad mein poochein.',
        answer_en: quotaMsgEn,
      });
      return;
    }
    res.status(500).json({
      error: 'Unable to generate answer right now. Please try again.',
      error_urdu: 'اس وقت جواب دینے میں دشواری ہوئی۔ براہ کرم دوبارہ کوشش کریں۔',
    });
  }
});

// Text-to-speech endpoint generating clear spoken Urdu or English WAV audio
app.post('/api/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language = 'ur' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const isEnglish = language === 'en';
    const speechStyle = isEnglish
      ? 'Clear, gentle, friendly and articulate English voice for explaining documents'
      : 'Clear, gentle, slow, caring Urdu speaking voice for elderly listeners';
    const voiceName = isEnglish ? 'Puck' : 'Kore';

    // Model fallback sequence for TTS:
    // 1. Try 'gemini-3.8-flash-tts' (high capacity)
    // 2. Try 'gemini-3.8-flash-lite-tts'
    const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

    for (const model of ttsModels) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.slice(0, 500), // Keep concise for rapid playback
                  speechMetadata: {
                    style: speechStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          res.json({
            success: true,
            audioData: `data:audio/wav;base64,${base64Audio}`,
          });
          return;
        }
      } catch (err: any) {
        console.warn(`TTS model ${model} attempt failed:`, err?.message?.slice(0, 80));
      }
    }

    // If both server TTS models are unavailable (e.g. rate limit / quota),
    // return graceful fallback instruction with status 200 so client immediately uses Web Speech API
    res.json({
      success: false,
      fallbackToBrowser: true,
      message: 'Using client Web Speech synthesis fallback',
    });
  } catch (error: any) {
    console.warn('TTS request fallback to client speech:', error?.message || error);
    res.json({
      success: false,
      fallbackToBrowser: true,
      message: 'Using client Web Speech synthesis fallback',
    });
  }
});

// In development, hook up Vite middleware; in production serve dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DecodeAI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
