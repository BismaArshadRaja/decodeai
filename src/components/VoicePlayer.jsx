import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { requestTTSAudio, playWithWebSpeech, stopAnyActiveAudio } from '../utils/audio';

export const VoicePlayer = ({
  urduText,
  englishText = '',
  isUrduUI,
  selectedScript = 'urdu',
  onScriptChange,
}) => {
  // Active voice language: 'ur' or 'en'
  const [voiceLang, setVoiceLang] = useState(
    selectedScript === 'en' ? 'en' : 'ur'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState('gemini');

  const audioRef = useRef(null);
  const cancelSpeechRef = useRef(null);

  // Sync voice language if selectedScript changes externally
  useEffect(() => {
    if (selectedScript === 'en') {
      setVoiceLang('en');
    } else {
      setVoiceLang('ur');
    }
  }, [selectedScript]);

  // Active text to speak based on voice language
  const activeText = voiceLang === 'en' ? englishText || urduText : urduText;

  // When text or voice language changes, reset and load
  useEffect(() => {
    stopPlayback();
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);

    if (activeText) {
      loadAudio(activeText, voiceLang);
    }

    return () => {
      stopPlayback();
    };
  }, [activeText, voiceLang]);

  const loadAudio = async (text, lang) => {
    setIsLoadingAudio(true);
    const audioDataUri = await requestTTSAudio(text, lang);
    if (audioDataUri) {
      setAudioUrl(audioDataUri);
      setMode('gemini');
    } else {
      setMode('browser');
    }
    setIsLoadingAudio(false);
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
      cancelSpeechRef.current = null;
    }
    stopAnyActiveAudio();
    setIsPlaying(false);
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (cancelSpeechRef.current) {
        cancelSpeechRef.current();
        cancelSpeechRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    // Start playback
    if (audioUrl && audioRef.current) {
      try {
        audioRef.current.playbackRate = playbackSpeed;
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        console.warn('Audio tag playback failed, falling back to speech synthesis', err);
      }
    }

    // Fallback: Web Speech synthesis
    setMode('browser');
    const stopFn = playWithWebSpeech(
      activeText,
      voiceLang,
      playbackSpeed,
      () => setIsPlaying(true),
      () => {
        setIsPlaying(false);
        cancelSpeechRef.current = null;
      },
      (err) => {
        console.warn('Speech synthesis playback note', err);
        setIsPlaying(false);
      }
    );
    cancelSpeechRef.current = stopFn;
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    if (isPlaying && mode === 'browser') {
      if (cancelSpeechRef.current) {
        cancelSpeechRef.current();
      }
      const stopFn = playWithWebSpeech(
        activeText,
        voiceLang,
        speed,
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          cancelSpeechRef.current = null;
        }
      );
      cancelSpeechRef.current = stopFn;
    }
  };

  const handleSwitchVoiceLang = (lang) => {
    if (voiceLang === lang) return;
    stopPlayback();
    setVoiceLang(lang);
    if (onScriptChange) {
      onScriptChange(lang === 'en' ? 'en' : 'urdu');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-stone-900 text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-emerald-700/40 relative overflow-hidden">
      {/* Background audio glow animation */}
      <div
        className={`absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none transition-opacity duration-700 ${
          isPlaying ? 'opacity-100' : 'opacity-40'
        }`}
      />

      {/* Hidden audio element for Gemini generated audio */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 0);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => {
            setMode('browser');
          }}
        />
      )}

      {/* Top Header: Voice Title & Language Selector (Urdu / English) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-800/60 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white font-sans-main flex items-center gap-2">
              <span>{isUrduUI ? 'آواز میں سنیں' : 'Audio Voice Note'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {mode === 'gemini' ? 'Gemini AI Voice' : 'Standard Voice'}
              </span>
            </h4>
          </div>
        </div>

        {/* User Choice: Urdu Voice or English Voice */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-900/80 p-1 rounded-xl border border-emerald-700/50">
          <button
            onClick={() => handleSwitchVoiceLang('ur')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 min-h-[30px] ${
              voiceLang === 'ur'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>🔊 اردو آواز</span>
          </button>
          <button
            onClick={() => handleSwitchVoiceLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 min-h-[30px] ${
              voiceLang === 'en'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>🔊 English Voice</span>
          </button>
        </div>
      </div>

      {/* Player Controls & Visual Waveform */}
      <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
        {/* Play / Pause Primary Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handleTogglePlay}
            disabled={isLoadingAudio}
            className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 min-h-[48px]"
            aria-label={isPlaying ? 'Pause voice' : 'Play voice'}
          >
            {isLoadingAudio ? (
              <>
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span className="font-urdu">{isUrduUI ? 'آواز تیار ہو رہی ہے...' : 'Preparing audio...'}</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-stone-950" />
                <span className="font-urdu">{isUrduUI ? 'آواز روکیں' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-stone-950" />
                <span className="font-urdu">
                  {voiceLang === 'ur'
                    ? isUrduUI ? 'اردو وائس سنیں' : 'Listen in Urdu'
                    : 'Listen in English'}
                </span>
              </>
            )}
          </button>

          {/* Replay button */}
          <button
            onClick={stopPlayback}
            className="p-3 rounded-2xl bg-stone-800/80 hover:bg-stone-700/90 text-stone-300 hover:text-white transition-colors border border-emerald-800/40 min-h-[48px] min-w-[48px] flex items-center justify-center"
            title={isUrduUI ? 'دوبارہ شروع کریں' : 'Restart'}
            aria-label="Restart audio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Visualizer Waves */}
        <div className="flex-1 w-full bg-stone-900/60 rounded-2xl p-3 border border-emerald-800/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 h-7 flex-1 px-2">
            {[40, 70, 30, 85, 55, 95, 45, 65, 80, 50, 90, 35, 75, 60, 85, 40, 70].map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-emerald-400' : 'bg-emerald-800/60'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, (h * (i % 2 === 0 ? 1 : 0.7)))}%` : '20%',
                  opacity: isPlaying ? (i % 3 === 0 ? 1 : 0.8) : 0.4,
                }}
              />
            ))}
          </div>

          {/* Time indicator */}
          {duration > 0 && (
            <span className="text-[11px] font-mono text-emerald-300 shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-stone-800/90 p-0.5 rounded-xl border border-stone-700/60 text-[11px] font-mono shrink-0">
            {[0.8, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
