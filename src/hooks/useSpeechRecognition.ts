import { useCallback, useEffect, useRef, useState } from 'react';

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } };
}

type SpeechRecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang = 'en-US') {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const finalRef = useRef<string>('');

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((finalRef.current + ' ' + interim).trim());
    };
    rec.onerror = () => {
      setError('Microphone error. Check permissions and try again.');
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    finalRef.current = '';
    setTranscript('');
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('Could not start microphone. Try again.');
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
