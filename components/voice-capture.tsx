'use client';

import { useEffect, useRef, useState } from 'react';
import { saveTextNote, saveVoiceNote } from '@/app/actions';

export function VoiceCapture({ sessionId, problemId }: { sessionId: string; problemId: string }) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState('');
  const [fallbackHasDictation, setFallbackHasDictation] = useState(false);
  const finalTextRef = useRef('');
  const interimTextRef = useRef('');

  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let nextInterim = '';
      let nextFinal = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) nextFinal += transcript;
        else nextInterim += transcript;
      }
      interimTextRef.current = nextInterim;
      if (nextFinal) {
        setFinalText((current) => {
          const updated = current + nextFinal;
          finalTextRef.current = updated;
          return updated;
        });
      }
      setInterimText(nextInterim);
    };
    recognition.onerror = (event) => {
      setListening(false);
      const permanentErrors = ['not-allowed', 'service-not-allowed', 'audio-capture'];
      const permanent = permanentErrors.includes(event.error);
      setError(
        permanent
          ? event.error === 'not-allowed'
            ? 'Microphone access was denied.'
            : 'Speech recognition is unavailable.'
          : "It didn't catch anything. Tap to try again."
      );
      promoteInterim();
      if (permanent) {
        const captured = `${finalTextRef.current}${interimTextRef.current}`;
        setFallbackText((current) => current || captured);
        setFallbackHasDictation(Boolean(captured));
        setSupported(false);
      }
    };
    recognition.onend = () => {
      setListening(false);
      promoteInterim();
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("It didn't catch anything. Tap to try again.");
    }
  }

  function promoteInterim() {
    const pendingText = interimTextRef.current;
    if (!pendingText) return;
    finalTextRef.current = `${finalTextRef.current}${pendingText}`;
    setFinalText(finalTextRef.current);
    interimTextRef.current = '';
    setInterimText('');
  }

  if (supported === false) {
    const fallbackAction = fallbackHasDictation
      ? saveVoiceNote.bind(null, sessionId, problemId)
      : saveTextNote.bind(null, sessionId, problemId);
    return (
      <div className="mt-6 rounded-2xl border border-orange-300/25 bg-orange-300/[0.07] p-4">
        <p className="text-sm leading-6 text-orange-100">
          {error ?? 'Speech recognition is not supported in this browser.'} You can still capture the thought by typing.
        </p>
        {fallbackHasDictation ? <p className="mt-3 text-sm leading-6 text-orange-100/75">Speech recognition may have misheard this.</p> : null}
        <form action={fallbackAction}>
          <textarea
            name="body"
            value={fallbackText}
            onChange={(event) => setFallbackText(event.target.value)}
            placeholder="What are you noticing?"
            rows={4}
            className="mt-4 w-full rounded-2xl border border-white/15 bg-black/20 p-4 text-base leading-7 text-paper outline-none placeholder:text-white/30 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30"
          />
          <button
            type="submit"
            disabled={!fallbackText.trim()}
            className="mt-3 min-h-16 w-full rounded-2xl bg-lime-300 px-5 text-base font-black text-ink transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-4 focus:ring-lime-300/30"
          >
            Save thought
          </button>
        </form>
      </div>
    );
  }

  const dictatedText = `${finalText}${interimText}`;
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={toggleListening}
        className={`min-h-20 w-full rounded-2xl px-6 text-lg font-black transition focus:outline-none focus:ring-4 focus:ring-lime-300/30 ${
          listening ? 'bg-orange-300 text-ink hover:bg-orange-200' : 'bg-lime-300 text-ink hover:bg-lime-200'
        }`}
      >
        {listening ? 'Stop listening' : 'Talk through it'}
      </button>
      {error ? <p className="mt-3 text-sm leading-6 text-orange-100">{error}</p> : null}
      <div aria-live="polite" className="mt-4 min-h-16 rounded-2xl border border-white/10 bg-black/20 p-4 text-base leading-7 text-white/75">
        {dictatedText || 'Your words will appear here as you speak.'}
      </div>
      <p className="mt-3 text-sm leading-6 text-orange-100/75">Speech recognition may have misheard this.</p>
      <form action={saveVoiceNote.bind(null, sessionId, problemId)}>
        <input type="hidden" name="body" value={dictatedText} />
        <button
          type="submit"
          disabled={!dictatedText}
          className="mt-3 min-h-16 w-full rounded-2xl border border-white/15 px-5 text-base font-bold text-paper transition hover:border-lime-300/50 hover:text-lime-200 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-lime-300"
        >
          Save what I said
        </button>
      </form>
    </div>
  );
}
