import { useState, useEffect, useRef, useCallback } from 'react';

// Define Speech Recognition types for browser compatibility
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognitionInstance };
    webkitSpeechRecognition?: { new (): SpeechRecognitionInstance };
  }
}

export function useVoice(onTranscriptResult?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(12).fill(0.2));

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        if (onTranscriptResult) {
          onTranscriptResult(currentText);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition setup error:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onTranscriptResult]);

  // Audio level visualizer loop when listening
  useEffect(() => {
    if (!isListening) {
      setAudioLevel(new Array(12).fill(0.15));
      return;
    }

    let t = 0;
    const updateWave = () => {
      t += 0.15;
      const levels = Array.from({ length: 12 }, (_, i) => {
        return Math.max(0.15, Math.min(1.0, Math.sin(t + i * 0.5) * 0.4 + Math.cos(t * 1.5 - i * 0.3) * 0.3 + 0.5));
      });
      setAudioLevel(levels);
      animationFrameRef.current = requestAnimationFrame(updateWave);
    };

    animationFrameRef.current = requestAnimationFrame(updateWave);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Start listening error:', e);
      }
    } else {
      // If Web Speech API not supported in iframe/environment, simulate listening
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Stop listening error:', e);
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speak = useCallback((text: string) => {
    if (!voiceOutputEnabled || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Strip markdown asterisks and bullets for cleaner voice
      const cleanText = text.replace(/[*_#`[\]()]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.1; // Warm, intelligent cadence
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google UK English Female') || v.name.includes('Zira') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('female')))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  }, [voiceOutputEnabled]);

  const toggleVoiceOutput = useCallback(() => {
    setVoiceOutputEnabled(prev => {
      const next = !prev;
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    voiceOutputEnabled,
    isSupported,
    audioLevel,
    startListening,
    stopListening,
    toggleListening,
    speak,
    toggleVoiceOutput,
  };
}
