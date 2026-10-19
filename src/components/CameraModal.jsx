import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

export const CameraModal = ({
  isOpen,
  onClose,
  onCapture,
  lang,
}) => {
  const isUrdu = lang === 'ur';
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err) {
      console.error('Camera access error:', err);
      setIsInitializing(false);
      setErrorMsg(
        isUrdu
          ? 'کیمرے تک رسائی ممکن نہیں۔ براہ کرم براؤزر میں کیمرے کی اجازت دیں یا فائل اپ لوڈ کریں۔'
          : 'Could not access camera. Please allow camera permissions or upload a photo instead.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const handleFlip = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-stone-900/90 flex items-center justify-between text-white border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base font-sans-main">
              {isUrdu ? 'دستاویز کی تصویر لیں' : 'Take Document Photo'}
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-rose-400 max-w-sm">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
              <p className="text-xs sm:text-sm font-urdu leading-relaxed">{errorMsg}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Document Alignment Frame Overlay */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="text-center">
                  <span className="text-[11px] bg-black/60 text-emerald-300 px-3 py-1 rounded-full font-urdu backdrop-blur-xs">
                    {isUrdu ? 'بل یا نسخہ چوکھٹ کے اندر رکھیں' : 'Align document inside frame'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-stone-900 flex items-center justify-center text-white text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls footer */}
        <div className="p-4 bg-stone-900 flex items-center justify-around border-t border-stone-800">
          <button
            onClick={handleFlip}
            className="p-3 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
            title="Flip camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Shutter Button */}
          <button
            onClick={handleCapture}
            disabled={!!errorMsg || isInitializing}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center ring-4 ring-emerald-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            title="Capture photo"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors" />
          </button>

          <div className="w-11" />
        </div>
      </div>
    </div>
  );
};
