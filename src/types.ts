export interface PlinkoPeg {
  id: string;
  x: number;
  y: number;
  radius: number;
  active: boolean; // Lit up when hit
  activationTime: number; // For fade-out effect
}

export interface PlinkoBucket {
  id: string;
  x: number;
  width: number;
  multiplier: number;
  label: string;
  color: string;
}

export interface PlinkoBall {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  imgUrl?: string; // Image for texture mapping
  trail: { x: number; y: number }[];
  isHighlightTriggered: boolean;
  isVoidProcessed?: boolean;
  isLanded?: boolean;
  isDead?: boolean;
}

export interface MemePreset {
  id: string;
  name: string;
  imgUrl: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultColor: string;
  reactionStyle: string; // "stonks", "panik", "hype", etc.
}

export interface HighlightClip {
  id: string;
  timestamp: string;
  ballImage?: string;
  multiplier: number;
  scoreLabel: string;
  commentary: string;
  durationMs: number;
  videoUrl?: string; // Captured WebM/MP4
}

export interface SoundPreset {
  id: string;
  name: string;
  type: 'synth' | 'custom';
  description: string;
}
