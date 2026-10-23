
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYLVIA_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface SylviaAndroidBridge {
  isNativeApp(): boolean;
  isCompanionOverlay(): boolean;
  toggleListening(): void;
  speakText(text: string): void;
  expandCompanion(view: string, prompt?: string): void;
  collapseCompanion(): void;
}

interface SylviaNativeVoiceState {
  isListening: boolean;
  transcript?: string;
  error?: string;
}

interface Window {
  SylviaAndroid?: SylviaAndroidBridge;
}
