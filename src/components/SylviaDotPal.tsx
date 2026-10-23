import React, { useEffect, useRef } from 'react';
import 'dotpals';

export type SylviaPalAgentState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'working'
  | 'speaking'
  | 'waiting'
  | 'done'
  | 'error'
  | 'sleeping';

interface DotPalElement extends HTMLElement {
  setState: (state: SylviaPalAgentState, options?: { text?: string }) => void;
  say: (text: string, options?: { duration?: number }) => void;
}

interface SylviaDotPalProps {
  character: string;
  state: SylviaPalAgentState;
  size?: number;
  text?: string;
  color?: string;
  className?: string;
}

/**
 * Mounts the real Dotpals Web Component. The upstream component draws the
 * characters as animated SVG and owns its eyes, idle movement, state faces,
 * particles and click reactions. Sylvia only passes its existing UI state.
 */
export const SylviaDotPal: React.FC<SylviaDotPalProps> = ({
  character,
  state,
  size = 84,
  text,
  color,
  className = '',
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const palRef = useRef<DotPalElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const pal = document.createElement('dot-pal') as DotPalElement;
    pal.setAttribute('label', 'Sylvia companion');
    pal.setAttribute('idle', 'float');
    pal.setAttribute('lean', 'cursor');
    host.appendChild(pal);
    palRef.current = pal;

    return () => {
      pal.remove();
      palRef.current = null;
    };
  }, []);

  useEffect(() => {
    const pal = palRef.current;
    if (!pal) return;

    pal.setAttribute('character', character);
    pal.setAttribute('size', String(size));
    pal.setAttribute('idle', 'float');
    pal.setAttribute('lean', 'cursor');
    if (color) pal.setAttribute('color', color);
    else pal.removeAttribute('color');

    pal.setState(state, text ? { text } : {});
  }, [character, color, size, state, text]);

  return (
    <div
      ref={hostRef}
      className={'sylvia-dotpal-mount ' + className}
      aria-label="Animated Sylvia companion character"
    />
  );
};

export default SylviaDotPal;
