declare module 'react-speech-kit' {
  export interface SpeechSynthesisOptions {
    text: string;
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onStart?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onError?: (error: any) => void;
  }

  export interface UseSpeechSynthesisResult {
    speak: (options: SpeechSynthesisOptions) => void;
    cancel: () => void;
    speaking: boolean;
    supported: boolean;
    voices: SpeechSynthesisVoice[];
  }

  export function useSpeechSynthesis(): UseSpeechSynthesisResult;
} 