import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Loader2,
  Volume2,
  Copy,
  Check,
  Square,
} from 'lucide-react';
import { requestTTSAudio, playWithWebSpeech, stopAnyActiveAudio } from '../utils/audio';

export const InteractiveQnA = ({ data, lang }) => {
  const isUrdu = lang === 'ur';
  // User's preferred reading & listening language for Q&A answers
  const [qnaLang, setQnaLang] = useState(lang === 'ur' ? 'ur' : 'en');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Audio voice player states
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const audioRef = useRef(null);
  const cancelSpeechRef = useRef(null);

  // Sync default qnaLang when parent lang changes
  useEffect(() => {
    if (lang === 'en') {
      setQnaLang('en');
    } else {
      setQnaLang('ur');
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      stopPlaying();
    };
  }, []);

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
      cancelSpeechRef.current = null;
    }
    stopAnyActiveAudio();
    setPlayingMsgId(null);
    setLoadingAudioId(null);
  };

  // Play audio for an AI answer message
  const handleToggleVoice = async (msg) => {
    if (playingMsgId === msg.id) {
      stopPlaying();
      return;
    }

    stopPlaying();
    setLoadingAudioId(msg.id);

    const textToSpeak =
      qnaLang === 'ur'
        ? msg.answer_urdu || msg.text
        : qnaLang === 'roman'
        ? msg.answer_roman || msg.text
        : msg.answer_en || msg.text;

    const voiceLang = qnaLang === 'en' ? 'en' : 'ur';

    try {
      // 1. Try Gemini TTS audio first
      const audioUri = await requestTTSAudio(textToSpeak, voiceLang);
      setLoadingAudioId(null);

      if (audioUri && audioRef.current) {
        audioRef.current.src = audioUri;
        audioRef.current.onended = () => setPlayingMsgId(null);
        audioRef.current.onerror = () => {
          setPlayingMsgId(null);
          fallbackWebSpeech(textToSpeak, msg.id, voiceLang);
        };
        await audioRef.current.play();
        setPlayingMsgId(msg.id);
        return;
      }
    } catch (err) {
      console.warn('TTS request failed, falling back to speech synthesis', err);
    }

    setLoadingAudioId(null);
    fallbackWebSpeech(textToSpeak, msg.id, voiceLang);
  };

  const fallbackWebSpeech = (text, msgId, voiceLang = 'ur') => {
    setPlayingMsgId(msgId);
    const cancelFn = playWithWebSpeech(
      text,
      voiceLang,
      0.95,
      () => setPlayingMsgId(msgId),
      () => {
        setPlayingMsgId(null);
        cancelSpeechRef.current = null;
      },
      () => {
        setPlayingMsgId(null);
        cancelSpeechRef.current = null;
      }
    );
    cancelSpeechRef.current = cancelFn;
  };

  // Copy individual answer
  const handleCopyAnswer = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Suggested questions based on doc type
  const suggestedQuestions =
    data.suggested_questions && data.suggested_questions.length > 0
      ? data.suggested_questions
      : data.doc_type === 'electricity_bill'
      ? [
          'یہ بل جاز کیش یا ایزی پیسہ سے کیسے جمع کروائیں؟',
          'اگر مقررہ تاریخ گزر جائے تو کیا بجلی کاٹ دی جاتی ہے؟',
          'بجلی کے یونٹ کم کرنے کے آسان طریقے کیا ہیں؟',
        ]
      : data.doc_type === 'medical_report'
      ? [
          'کیا مجھے ڈاکٹر کو دوبارہ چیک اپ کروانے جانا چاہیے؟',
          'کیا اس رپورٹ کے بعد دانت یا مسوڑھے کا کوئی علاج ہوگا؟',
          'ہیموگلوبن یا ٹیسٹ رزلٹ کو بہتر کرنے کے لیے کون سی غذائیں کھائیں؟',
        ]
      : [
          'کیا یہ دوائی کھانے کے فوراً بعد لینی چاہیے؟',
          'اگر ایک خوراک بھول جائیں تو کیا کرنا چاہیے؟',
          'کیا یہ نسخہ کسی بھی فارمیسی سے مل سکتا ہے؟',
        ];

  const handleAsk = async (questionText) => {
    if (!questionText.trim() || isAsking) return;

    const isUrduText = /[\u0600-\u06FF]/.test(questionText);

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsAsking(true);
    stopPlaying();

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText.trim(),
          context: data,
          language: qnaLang || (isUrduText ? 'ur' : 'en'),
        }),
      });

      const resData = await res.json();
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: resData.answer_urdu || resData.answer || '',
        answer_urdu: resData.answer_urdu || resData.answer || '',
        answer_roman: resData.answer_roman || '',
        answer_en: resData.answer_en || resData.answer || '',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error asking question:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: isUrdu
          ? 'معذرت، نیٹ ورک مسئلے کی وجہ سے رابطہ نہ ہو سکا۔ برائے مہربانی دوبارہ کوشش کریں۔'
          : 'Could not connect to AI assistant. Please try again.',
        answer_urdu: 'معذرت، نیٹ ورک مسئلے کی وجہ سے رابطہ نہ ہو سکا۔ برائے مہربانی دوبارہ کوشش کریں۔',
        answer_roman: 'Maazrat, rabta nahi ho saka. Baraye meherbani dobara koshish karein.',
        answer_en: 'Could not connect to AI assistant. Please try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-stone-50/90 rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
      {/* Hidden audio tag for TTS wav playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Header and Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-stone-900 font-sans-main">
              {isUrdu ? 'دستاویز کے بارے میں سوال پوچھیں' : 'Ask Any Question About This Document'}
            </h3>
            <p className="text-xs text-stone-500 font-urdu">
              {isUrdu
                ? 'اردو، رومن اردو یا انگریزی میں جواب اور آواز سنیں'
                : 'Read in Urdu, Roman Urdu, or English & listen to voice'}
            </p>
          </div>
        </div>

        {/* User Choice: Urdu, Roman Urdu, or English for Answers */}
        <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-stone-200 shadow-2xs self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-stone-500 font-urdu pl-1">
            {isUrdu ? 'جواب کی زبان:' : 'Answer in:'}
          </span>
          <div className="flex items-center rounded-lg bg-stone-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setQnaLang('ur');
                stopPlaying();
              }}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                qnaLang === 'ur'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="اردو رسم الخط میں جواب پڑھیں"
            >
              اردو
            </button>
            <button
              type="button"
              onClick={() => {
                setQnaLang('roman');
                stopPlaying();
              }}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                qnaLang === 'roman'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Roman Urdu (English letters)"
            >
              Roman
            </button>
            <button
              type="button"
              onClick={() => {
                setQnaLang('en');
                stopPlaying();
              }}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                qnaLang === 'en'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="English"
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Questions Chips */}
      <div className="mb-4">
        <span className="text-xs font-semibold text-stone-600 block mb-2 font-urdu">
          {isUrdu ? 'فوری منتخب سوالات:' : 'Quick Suggested Questions:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={isAsking}
              className="text-xs bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl font-urdu transition-all shadow-2xs text-right cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            const displayedText = isAI
              ? qnaLang === 'ur'
                ? msg.answer_urdu || msg.text
                : qnaLang === 'roman'
                ? msg.answer_roman || msg.text
                : msg.answer_en || msg.text
              : msg.text;

            const isThisPlaying = playingMsgId === msg.id;
            const isThisLoadingAudio = loadingAudioId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  isAI ? 'justify-start' : 'justify-end'
                }`}
              >
                {isAI && (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[90%] sm:max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                    isAI
                      ? 'bg-white border border-stone-200 text-stone-800 shadow-2xs rounded-bl-xs'
                      : 'bg-emerald-600 text-white rounded-br-xs'
                  }`}
                >
                  <p
                    className={
                      isAI
                        ? qnaLang === 'ur'
                          ? 'font-urdu text-sm sm:text-base leading-loose'
                          : 'font-sans-main text-xs sm:text-sm'
                        : 'font-urdu'
                    }
                  >
                    {displayedText}
                  </p>

                  {/* AI Response Action Bar */}
                  {isAI && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                      {/* Play Voice Note Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleVoice(msg)}
                        disabled={isThisLoadingAudio}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                          isThisPlaying
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                        title="آواز میں سنیں (Listen to spoken audio)"
                      >
                        {isThisLoadingAudio ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            <span className="text-[11px] font-urdu">تیار ہو رہی ہے...</span>
                          </>
                        ) : isThisPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current text-amber-700" />
                            <span className="text-[11px] font-urdu">روکیں (Stop)</span>
                            <span className="flex items-end gap-0.5 h-3 ml-1">
                              <span className="w-0.5 h-2 bg-amber-600 animate-pulse" />
                              <span className="w-0.5 h-3 bg-amber-600 animate-pulse" />
                              <span className="w-0.5 h-1.5 bg-amber-600 animate-pulse" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-urdu">
                              {isUrdu ? 'آواز سنیں (Listen)' : 'Listen to Voice'}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Copy Answer Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(displayedText, msg.id)}
                        className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
                        title="جواب کاپی کریں"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isAsking && (
            <div className="flex items-center gap-2 text-stone-500 text-xs font-urdu p-2 bg-white rounded-xl border border-stone-200 w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>{isUrdu ? 'جواب تیار ہو رہا ہے...' : 'Generating answer...'}</span>
            </div>
          )}
        </div>
      )}

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(inputValue);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isUrdu
              ? 'اپنا سوال یہاں لکھیں (مثلاً: یہ ٹیسٹ کیا ہے؟ یا دوا کا طریقہ کار)'
              : 'Ask a question in Urdu, Roman Urdu, or English...'
          }
          className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-urdu"
          disabled={isAsking}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isAsking}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
        >
          {isAsking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isUrdu ? 'ارسال کریں' : 'Send'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
