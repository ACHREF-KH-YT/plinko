import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, Radio, Sparkles, Video, 
  Square, Download, Trash2, Trophy, Flame, HelpCircle, FileVideo, Music, Coins
} from 'lucide-react';
import { PlinkoPeg, PlinkoBucket, PlinkoBall, MemePreset, HighlightClip } from '../types';

interface PlinkoGameProps {
  rows: number;
  gravity: number;
  friction: number;
  bounceDamping: number;
  title: string;
  subtitle: string;
  ballPreset: MemePreset;
  customBallImage: string | null;
  customBgImage: string | null;
  bgMusicFile: File | null;
  bounceSoundFile: File | null;
  custom100xSfxFile: File | null;
  custom0xSfxFile: File | null;
  neonThemeColor: string;
  onHighlightClipped: (clip: HighlightClip) => void;
  clipsList: HighlightClip[];
}

export default function PlinkoGame({
  rows,
  gravity,
  friction,
  bounceDamping,
  title,
  subtitle,
  ballPreset,
  customBallImage,
  customBgImage,
  bgMusicFile,
  bounceSoundFile,
  custom100xSfxFile,
  custom0xSfxFile,
  neonThemeColor,
  onHighlightClipped,
  clipsList,
}: PlinkoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const customSfxRef = useRef<HTMLAudioElement | null>(null);
  const custom100xSfxRef = useRef<HTMLAudioElement | null>(null);
  const custom0xSfxRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [activeSubtitles, setActiveSubtitles] = useState<string[]>([]);
  const [subtitleTimer, setSubtitleTimer] = useState<number>(0);
  const [currentScoreEffect, setCurrentScoreEffect] = useState<{ text: string; color: string; scale: number } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(100.00);

  // Audio Context and Nodes for Synthesizer & Video Mix
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamAudioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Audio source nodes for custom audio file routing
  const bgSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const customSfxSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const custom100xSfxSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const custom0xSfxSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Simulation physics objects stored in Refs for 60fps frame updates
  const ballsRef = useRef<PlinkoBall[]>([]);
  const pegsRef = useRef<PlinkoPeg[]>([]);
  const bucketsRef = useRef<PlinkoBucket[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const statsRef = useRef({ totalDrops: 0, highestMultiplier: 0, lastHitTime: 0 });

  // Camera Zoom & Slow-motion visual effects
  const visualEffectsRef = useRef({
    cameraZoom: 1.0,
    targetZoom: 1.0,
    slowdownFactor: 1.0,
    cameraOffset: { x: 0, y: 0 },
    screenShake: 0,
    bulletTimeActive: false,
  });

  // Sound Synth pentatonic scale pitches (Hz) for harmonious chords
  const pentatonicScale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  // Floating ambient neon dust stars background effect
  const starsRef = useRef<{ x: number; y: number; speed: number; size: number; alpha: number }[]>([]);
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * 720,
        y: Math.random() * 1280,
        speed: 0.15 + Math.random() * 0.4,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.15 + Math.random() * 0.6,
      });
    }
    starsRef.current = stars;
  }, []);

  // Map image element cache to avoid re-instantiating image objects in paint loop
  const ballImageCache = useRef<HTMLImageElement | null>(null);
  const bgImageCache = useRef<HTMLImageElement | null>(null);

  // Load custom or preset ball images to memory
  useEffect(() => {
    const imgPath = customBallImage || ballPreset.imgUrl;
    if (imgPath) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgPath;
      img.onload = () => {
        ballImageCache.current = img;
      };
    } else {
      ballImageCache.current = null;
    }
  }, [ballPreset, customBallImage]);

  // Load custom background image to memory
  useEffect(() => {
    if (customBgImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = customBgImage;
      img.onload = () => {
        bgImageCache.current = img;
      };
    } else {
      bgImageCache.current = null;
    }
  }, [customBgImage]);

  // Set up background music and Custom SFX elements
  useEffect(() => {
    if (bgMusicFile) {
      const url = URL.createObjectURL(bgMusicFile);
      if (bgAudioRef.current) {
        bgAudioRef.current.src = url;
        bgAudioRef.current.loop = true;
        if (isPlaying && isAudioOn) {
          bgAudioRef.current.play().catch(() => {});
        }
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [bgMusicFile]);

  useEffect(() => {
    if (bounceSoundFile) {
      const url = URL.createObjectURL(bounceSoundFile);
      if (customSfxRef.current) {
        customSfxRef.current.src = url;
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [bounceSoundFile]);

  useEffect(() => {
    if (custom100xSfxFile) {
      const url = URL.createObjectURL(custom100xSfxFile);
      if (custom100xSfxRef.current) {
        custom100xSfxRef.current.src = url;
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [custom100xSfxFile]);

  useEffect(() => {
    if (custom0xSfxFile) {
      const url = URL.createObjectURL(custom0xSfxFile);
      if (custom0xSfxRef.current) {
        custom0xSfxRef.current.src = url;
      }
      return () => URL.revokeObjectURL(url);
    }
  }, [custom0xSfxFile]);

  // Sync Audio Play States
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = isAudioOn ? 0.35 : 0;
      if (isPlaying && isAudioOn) {
        bgAudioRef.current.play().catch(() => {});
      } else {
        bgAudioRef.current.pause();
      }
    }
  }, [isPlaying, isAudioOn]);

  // Reinitialize peg boards when spacing or rows change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 720;
    const startY = 280;
    const spacingY = 56;
    
    // Create peg grid
    const list: PlinkoPeg[] = [];
    for (let r = 0; r < rows; r++) {
      const rowY = startY + r * spacingY;
      const cols = r + 3; // grow columns down
      const rowWidth = (cols - 1) * spacingY;
      const startX = (width - rowWidth) / 2;
      for (let c = 0; c < cols; c++) {
        const pegX = startX + c * spacingY;
        list.push({
          id: `peg-${r}-${c}`,
          x: pegX,
          y: rowY,
          radius: 7,
          active: false,
          activationTime: 0,
        });
      }
    }
    pegsRef.current = list;

    // Reset buckets at the bottom
    const bucketMultipliers = [100, 15, 3, 0.2, 0, 0, 0, 0.2, 3, 15, 100];
    const bucketColors = [
      '#ef4444', // Red 100x
      '#f97316', // Orange 15x
      '#eab308', // Yellow 3x
      '#a855f7', // Purple 0.2x
      '#3b82f6', // Blue 0x LOSE
      '#1e293b', // Dark Void 0x LOSE
      '#3b82f6', // Blue 0x LOSE
      '#a855f7', // Purple 0.2x
      '#eab308', // Yellow 3x
      '#f97316', // Orange 15x
      '#ef4444', // Red 100x
    ];

    const binY = startY + rows * spacingY + 120;
    const binWidth = width / bucketMultipliers.length;
    const blist: PlinkoBucket[] = bucketMultipliers.map((mult, index) => ({
      id: `bucket-${index}`,
      x: index * binWidth,
      width: binWidth,
      multiplier: mult,
      label: mult === 0 ? '0x' : `${mult}x`,
      color: bucketColors[index],
    }));
    bucketsRef.current = blist;

    // Flush active balls
    ballsRef.current = [];
  }, [rows]);

  // Initialize and route HTMLAudioElements through the Web Audio context so they can be captured in MediaRecorder
  const initAudioSources = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      if (bgAudioRef.current && !bgSourceNodeRef.current) {
        bgSourceNodeRef.current = ctx.createMediaElementSource(bgAudioRef.current);
        bgSourceNodeRef.current.connect(ctx.destination);
        if (streamAudioDestinationRef.current) {
          bgSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        }
      }
      if (customSfxRef.current && !customSfxSourceNodeRef.current) {
        customSfxSourceNodeRef.current = ctx.createMediaElementSource(customSfxRef.current);
        customSfxSourceNodeRef.current.connect(ctx.destination);
        if (streamAudioDestinationRef.current) {
          customSfxSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        }
      }
      if (custom100xSfxRef.current && !custom100xSfxSourceNodeRef.current) {
        custom100xSfxSourceNodeRef.current = ctx.createMediaElementSource(custom100xSfxRef.current);
        custom100xSfxSourceNodeRef.current.connect(ctx.destination);
        if (streamAudioDestinationRef.current) {
          custom100xSfxSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        }
      }
      if (custom0xSfxRef.current && !custom0xSfxSourceNodeRef.current) {
        custom0xSfxSourceNodeRef.current = ctx.createMediaElementSource(custom0xSfxRef.current);
        custom0xSfxSourceNodeRef.current.connect(ctx.destination);
        if (streamAudioDestinationRef.current) {
          custom0xSfxSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        }
      }
    } catch (err) {
      console.warn("Failed to initialize audio source nodes:", err);
    }
  };

  // Audio peg collision Synthesizer chord player
  const playSynthesizerNote = (frequency: number) => {
    if (!isAudioOn) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Nice polyphonic chime envelope
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle'; // Smooth mellow bell sound
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gainNode);

      // Connect to MediaRecorder mix stream if recording, else system audio output
      if (streamAudioDestinationRef.current) {
        gainNode.connect(streamAudioDestinationRef.current);
      }
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Synth note failed to initiate:", e);
    }
  };

  // Trigger custom uploaded ball collision sounds
  const playCustomSfx = () => {
    if (!isAudioOn) return;
    initAudioSources();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    if (customSfxRef.current) {
      customSfxRef.current.currentTime = 0;
      customSfxRef.current.play().catch(() => {});
    }
  };

  // Trigger custom uploaded 100X jackpot sounds
  const playCustom100xSfx = () => {
    if (!isAudioOn) return;
    initAudioSources();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    if (custom100xSfxRef.current) {
      custom100xSfxRef.current.currentTime = 0;
      custom100xSfxRef.current.play().catch(() => {});
    }
  };

  // Trigger custom uploaded 0X lose/fail sounds
  const playCustom0xSfx = () => {
    if (!isAudioOn) return;
    initAudioSources();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    if (custom0xSfxRef.current) {
      custom0xSfxRef.current.currentTime = 0;
      custom0xSfxRef.current.play().catch(() => {});
    }
  };

  // Launch a new ball into the Plinko Board
  const dropBall = () => {
    // Deduct $10.00 for the play. If they run out of money, auto-top up by $100.00 so they can keep playing.
    setWalletBalance((prev) => {
      if (prev < 10.00) {
        return 100.00 - 10.00; // Auto-top-up to $100.00 and deduct $10.00
      }
      return prev - 10.00;
    });

    const width = 720;
    const radius = 12;
    const newBall: PlinkoBall = {
      id: `ball-${Date.now()}-${Math.random()}`,
      x: width / 2 + (Math.random() * 30 - 15),
      y: 110,
      vx: Math.random() * 2 - 1,
      vy: 0,
      radius,
      color: neonThemeColor,
      trail: [],
      isHighlightTriggered: false,
    };
    ballsRef.current.push(newBall);
    statsRef.current.totalDrops += 1;
  };

  // Fetch smart AI commentary subtitles from Gemini endpoint
  const triggerAICommentary = async (multiplier: number, label: string) => {
    try {
      const response = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ballName: ballPreset.name,
          multiplier,
          label,
          style: ballPreset.reactionStyle,
          customPrompt: subtitle,
        }),
      });
      const data = await response.json();
      if (data.success && data.commentaries) {
        setActiveSubtitles(data.commentaries);
        setSubtitleTimer(180); // Subtitle duration (3 seconds at 60fps)
      }
    } catch (error) {
      // Offline fallback subtitles if API is offline or key missing
      const slangs = [
        "OMG WAIT FOR IT!! 💀",
        `IS HE GOING TO HIT THE ${multiplier}x?!`,
        `ABSOLUTE LUCK LANDED! LETS GOO!!! 🚀🔥`
      ];
      setActiveSubtitles(slangs);
      setSubtitleTimer(180);
    }
  };

  // Automated highlights clipping triggers when ball behaves interestingly
  const triggerHighlightClip = (multiplier: number, scoreLabel: string) => {
    // Generate a beautiful showcase clip object
    const clipId = `clip-${Date.now()}`;
    const commentaryOptions = [
      `😱 UNBELIEVABLE ${multiplier}x HIT!`,
      `🔥 HE IS COOKING AT PLINKO!`,
      `💀 RIP SAVINGS BUT LANDED ON ${multiplier}x!`,
      `🏆 LUCK LEVEL 9999% JACKPOT!`
    ];
    const pickedCommentary = commentaryOptions[Math.floor(Math.random() * commentaryOptions.length)];

    const newClip: HighlightClip = {
      id: clipId,
      timestamp: new Date().toLocaleTimeString(),
      ballImage: customBallImage || ballPreset.imgUrl,
      multiplier,
      scoreLabel,
      commentary: pickedCommentary,
      durationMs: 4000,
    };
    onHighlightClipped(newClip);
  };

  // Media Capture Loop for Video Recording
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setRecordedChunks([]);
    setIsRecording(true);

    try {
      // Capture 30fps canvas stream
      const stream = canvas.captureStream(30);

      // Create browser Web Audio mix node to merge Synthesizer chime tones & music
      if (window.AudioContext || (window as any).webkitAudioContext) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        streamAudioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
        
        // Initialize source nodes if not already done, and connect them to the recorder mix stream
        initAudioSources();
        if (bgSourceNodeRef.current) bgSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        if (customSfxSourceNodeRef.current) customSfxSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        if (custom100xSfxSourceNodeRef.current) custom100xSfxSourceNodeRef.current.connect(streamAudioDestinationRef.current);
        if (custom0xSfxSourceNodeRef.current) custom0xSfxSourceNodeRef.current.connect(streamAudioDestinationRef.current);

        // Add merged audio tracks to video output stream
        const audioTracks = streamAudioDestinationRef.current.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
        }
      }

      // Check supported MIME types for MediaRecorder
      const getSupportedMimeType = () => {
        const types = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm;codecs=h264',
          'video/webm',
          'video/mp4;codecs=h264',
          'video/mp4'
        ];
        for (const t of types) {
          try {
            if (MediaRecorder.isTypeSupported(t)) {
              return t;
            }
          } catch (e) {
            // ignore check errors in unsupported browsers
          }
        }
        return '';
      };

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        // Disconnect audio sources from the recording destination
        if (streamAudioDestinationRef.current) {
          try {
            if (bgSourceNodeRef.current) bgSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
            if (customSfxSourceNodeRef.current) customSfxSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
            if (custom100xSfxSourceNodeRef.current) custom100xSfxSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
            if (custom0xSfxSourceNodeRef.current) custom0xSfxSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
          } catch (err) {
            console.warn("Error disconnecting audio sources in onstop:", err);
          }
          streamAudioDestinationRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (e) {
      console.warn("Failed to initiate media canvas recorder:", e);
      setIsRecording(false);
    }
  };

  const stopRecordingAndDownload = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Disconnect audio sources from the recording destination
      if (streamAudioDestinationRef.current) {
        try {
          if (bgSourceNodeRef.current) bgSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
          if (customSfxSourceNodeRef.current) customSfxSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
          if (custom100xSfxSourceNodeRef.current) custom100xSfxSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
          if (custom0xSfxSourceNodeRef.current) custom0xSfxSourceNodeRef.current.disconnect(streamAudioDestinationRef.current);
        } catch (err) {
          console.warn("Error disconnecting audio sources in stopRecordingAndDownload:", err);
        }
        streamAudioDestinationRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plinko_youtube_short_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setRecordedChunks([]);
    }
  }, [recordedChunks, isRecording]);

  // Main 60fps Game Loop & Rendering Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 720;
    const height = 1280;
    const binY = 280 + rows * 56 + 120;

    let lastTime = performance.now();

    const updateLoop = (timestamp?: number) => {
      const currentTime = timestamp || performance.now();
      let elapsed = currentTime - lastTime;
      if (elapsed < 1) elapsed = 16.67;
      if (elapsed > 100) elapsed = 16.67;
      lastTime = currentTime;

      const frameDelta = elapsed / 16.67;

      if (!isPlaying) {
        animationFrameId.current = requestAnimationFrame(updateLoop);
        return;
      }

      // 1. DYNAMIC HIGHLIGHT DETECTION
      // Slow-motion suspense triggers when ball is nearing bottom jackpot bins (100x edge bins)
      let slowdownTarget = 1.0;
      let targetCameraZoom = 1.0;
      let activeFocusBall: PlinkoBall | null = null;

      ballsRef.current.forEach((ball) => {
        if (ball.y > binY - 260 && ball.y < binY) {
          const isClosingInOnJackpot = ball.x < 160 || ball.x > width - 160;
          if (isClosingInOnJackpot) {
            slowdownTarget = 1.0; // Keep normal speed (no zoom slow-mo)
            targetCameraZoom = 1.0; // Keep normal camera scale (no zoom)
            activeFocusBall = null; // Do not focus/zoom camera on ball
            
            if (!ball.isHighlightTriggered) {
              ball.isHighlightTriggered = true;
              visualEffectsRef.current.bulletTimeActive = false;
              triggerAICommentary(bucketsRef.current[ball.x < 160 ? 0 : bucketsRef.current.length - 1].multiplier, "OMG SUSPENSE!");
            }
          }
        }
      });

      // Lerp bullet-time slow-mo and camera parameters for butter-smooth cinematic transitions
      visualEffectsRef.current.slowdownFactor += (slowdownTarget - visualEffectsRef.current.slowdownFactor) * 0.12 * frameDelta;
      visualEffectsRef.current.targetZoom += (targetCameraZoom - visualEffectsRef.current.targetZoom) * 0.08 * frameDelta;
      
      const dt = visualEffectsRef.current.slowdownFactor * frameDelta;

      // 2. PHYSICS RESOLUTION
      const steps = Math.max(1, Math.round(10 * dt));
      for (let s = 0; s < steps; s++) {
        const substepDt = dt / steps;

        ballsRef.current.forEach((ball, bIdx) => {
          if (ball.isDead) return;

          // Gravity acceleration
          ball.vy += gravity * substepDt;
          ball.vx *= Math.pow(friction, substepDt);
          ball.vy *= Math.pow(friction, substepDt);

          // Position velocity mapping
          ball.x += ball.vx * substepDt;
          ball.y += ball.vy * substepDt;

          // Trail update
          if (Math.random() < 0.3) {
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 12) ball.trail.shift();
          }

          // Wall boundary bounces
          if (ball.x - ball.radius < 15) {
            ball.x = 15 + ball.radius;
            ball.vx = -ball.vx * bounceDamping;
          } else if (ball.x + ball.radius > width - 15) {
            ball.x = width - 15 - ball.radius;
            ball.vx = -ball.vx * bounceDamping;
          }

          // Peg collisions
          pegsRef.current.forEach((peg) => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.hypot(dx, dy);
            const minDist = ball.radius + peg.radius;
            
            if (distance < minDist) {
              // Push ball outside overlap
              const overlap = minDist - distance;
              const nx = dx / distance;
              const ny = dy / distance;
              ball.x += nx * overlap;
              ball.y += ny * overlap;

              // Reflect velocity on vector normal
              const dotProduct = ball.vx * nx + ball.vy * ny;
              ball.vx = (ball.vx - 2 * dotProduct * nx) * bounceDamping;
              ball.vy = (ball.vy - 2 * dotProduct * ny) * bounceDamping;

              // Introduce minor scatter jitter to make Plinko random
              ball.vx += (Math.random() - 0.5) * 0.5;

              // Glow state on peg
              peg.active = true;
              peg.activationTime = 12;

              // Synthesize tone mapped to peg vertical height pitch
              const pegRowIndex = Math.floor((peg.y - 280) / 56);
              const scaleNote = pentatonicScale[Math.max(0, pentatonicScale.length - 1 - (pegRowIndex % pentatonicScale.length))];
              if (bounceSoundFile) {
                playCustomSfx();
              } else {
                playSynthesizerNote(scaleNote);
              }
            }
          });

          // Check if ball lands in bucket or falls into physical gaps
          if (ball.y + ball.radius > binY) {
            const binWidth = width / bucketsRef.current.length;
            const bucketWidth = binWidth * 0.76; // 76% width, 24% gap spacing!
            let bucketIndex = Math.floor(ball.x / binWidth);
            bucketIndex = Math.max(0, Math.min(bucketIndex, bucketsRef.current.length - 1));
            const bucket = bucketsRef.current[bucketIndex];

            const bucketXStart = bucket.x + (binWidth - bucketWidth) / 2;
            const bucketXEnd = bucketXStart + bucketWidth;

            // If it hits the solid floor/rim of the bucket
            if (!ball.isLanded && !ball.isVoidProcessed && ball.x >= bucketXStart && ball.x <= bucketXEnd && ball.y + ball.radius < binY + 28) {
              ball.isLanded = true;

              // Record scorecard impact
              setCurrentScoreEffect({
                text: bucket.multiplier === 0 ? `0x LOST!` : `+${bucket.label}!`,
                color: bucket.multiplier === 0 ? '#ef4444' : bucket.color,
                scale: 1.5,
              });
              setTimeout(() => setCurrentScoreEffect(null), 1200);

              // Add to wallet balance
              setWalletBalance((prev) => prev + (10 * bucket.multiplier));

              // Play nice synthesizer jackpot chord
              if (bucket.multiplier === 100) {
                if (custom100xSfxFile) {
                  playCustom100xSfx();
                } else {
                  playSynthesizerNote(523.25); // C5
                  setTimeout(() => playSynthesizerNote(659.25), 80); // E5
                  setTimeout(() => playSynthesizerNote(783.99), 160); // G5
                  setTimeout(() => playSynthesizerNote(1046.50), 240); // C6 super chime
                }
                triggerHighlightClip(bucket.multiplier, bucket.label);
              } else if (bucket.multiplier >= 10) {
                playSynthesizerNote(523.25); // C5
                setTimeout(() => playSynthesizerNote(659.25), 80); // E5
                setTimeout(() => playSynthesizerNote(783.99), 160); // G5
                triggerHighlightClip(bucket.multiplier, bucket.label);
              } else if (bucket.multiplier === 0) {
                if (custom0xSfxFile) {
                  playCustom0xSfx();
                } else {
                  playSynthesizerNote(146.83); // Low D3
                  setTimeout(() => playSynthesizerNote(110.00), 100); // Low A2 failing pitch
                  setTimeout(() => playSynthesizerNote(82.41), 220); // Low E2 failing pitch
                }
              } else {
                playSynthesizerNote(261.63); // Simple C4 chime
              }

              // Mark ball as dead after touchdown
              ball.isDead = true;
            }
          }

          // If the ball slipped through a gap and falls past the bucket divider walls
          if (ball.y - ball.radius > binY + 140 && !ball.isLanded && !ball.isVoidProcessed) {
            ball.isVoidProcessed = true;

            // No-win void!
            setCurrentScoreEffect({
              text: `0x LOST!`,
              color: '#ef4444', // red
              scale: 1.3,
            });
            setTimeout(() => setCurrentScoreEffect(null), 1500);

            // Play a low-pitch lose/womp custom or synth chime
            if (custom0xSfxFile) {
              playCustom0xSfx();
            } else {
              playSynthesizerNote(110.00); // Very low A2 pitch
              setTimeout(() => playSynthesizerNote(98.00), 120); // G2 pitch
              setTimeout(() => playSynthesizerNote(82.41), 240); // Low E2 fail note
            }
          }

          // If ball exits the bottom of the board/canvas
          if (ball.y - ball.radius > height) {
            ball.isDead = true;
          }
        });

        // Filter out dead balls after each step's update
        ballsRef.current = ballsRef.current.filter((b) => !b.isDead);
      }

      // Update peg fade glow
      pegsRef.current.forEach((peg) => {
        if (peg.active) {
          peg.activationTime -= 1 * frameDelta;
          if (peg.activationTime <= 0) peg.active = false;
        }
      });

      // Update subtitle sequence timer
      if (subtitleTimer > 0) {
        setSubtitleTimer((prev) => prev - 1);
        if (subtitleTimer <= 1) {
          // Shift subtitles
          setActiveSubtitles((prev) => {
            if (prev.length > 1) {
              setSubtitleTimer(180);
              return prev.slice(1);
            }
            return [];
          });
        }
      }

      // Process Camera shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (visualEffectsRef.current.screenShake > 0) {
        shakeOffsetX = (Math.random() - 0.5) * visualEffectsRef.current.screenShake;
        shakeOffsetY = (Math.random() - 0.5) * visualEffectsRef.current.screenShake;
        visualEffectsRef.current.screenShake *= 0.9;
      }

      // --- PAINT LOOP ---
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Render Static Backdrop (Adjusted only to the game board canvas size)
      if (bgImageCache.current) {
        ctx.drawImage(bgImageCache.current, 0, 0, width, height);
        // Translucent dark overlay to keep foreground neon contrast extremely crisp
        ctx.fillStyle = 'rgba(3, 7, 18, 0.65)';
        ctx.fillRect(0, 0, width, height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#030712'); // Deep space slate-950
        gradient.addColorStop(0.5, '#090d16');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Handle Camera Focus zooming during suspense highpoints
      if (activeFocusBall) {
        const focusX = (activeFocusBall as PlinkoBall).x;
        const focusY = (activeFocusBall as PlinkoBall).y;
        ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
        ctx.scale(visualEffectsRef.current.targetZoom, visualEffectsRef.current.targetZoom);
        ctx.translate(-focusX, -focusY + 150);
      } else {
        ctx.translate(shakeOffsetX, shakeOffsetY);
      }

      // 1. DRAW PARTICLES AND ACCENT GRIDS (Post-camera-transform)

      // Draw glowing background grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Update & Render floating star-dust particles
      starsRef.current.forEach((star) => {
        star.y -= star.speed * dt;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(56, 189, 248, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. DRAW PEGS (High-Fidelity Neon Pyramid Pegs!)
      pegsRef.current.forEach((peg) => {
        if (peg.active) {
          // Inner intense active neon halo
          ctx.shadowColor = neonThemeColor;
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(peg.x, peg.y - peg.radius * 1.35);
          ctx.lineTo(peg.x + peg.radius * 1.25, peg.y + peg.radius * 0.95);
          ctx.lineTo(peg.x - peg.radius * 1.25, peg.y + peg.radius * 0.95);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        } else {
          // Standard gorgeous inactive metallic/neon outline pyramid
          ctx.beginPath();
          ctx.moveTo(peg.x, peg.y - peg.radius * 1.3);
          ctx.lineTo(peg.x + peg.radius * 1.2, peg.y + peg.radius * 0.9);
          ctx.lineTo(peg.x - peg.radius * 1.2, peg.y + peg.radius * 0.9);
          ctx.closePath();
          ctx.fillStyle = 'rgba(51, 65, 85, 0.6)'; // Translucent slate-700
          ctx.fill();
          
          ctx.strokeStyle = `${neonThemeColor}50`; // Subtle outline
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Shiny cap center
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(peg.x, peg.y + peg.radius * 0.1, peg.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. DRAW BUCKET BINS WITH SPACED GLASS-PANEL DESIGN (GAPS)
      bucketsRef.current.forEach((bucket) => {
        const binWidth = bucket.width;
        const bucketWidth = binWidth * 0.76; // Match physical spacing width
        const bucketXStart = bucket.x + (binWidth - bucketWidth) / 2;

        // Draw translucent glassmorphism pod backing
        ctx.fillStyle = bucket.multiplier === 0 ? 'rgba(30, 41, 59, 0.55)' : `${bucket.color}1e`;
        ctx.beginPath();
        ctx.roundRect(bucketXStart, binY, bucketWidth, 140, [8, 8, 4, 4]);
        ctx.fill();

        // Neon border highlight around pod
        ctx.strokeStyle = bucket.multiplier === 0 ? '#475569' : bucket.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = bucket.multiplier === 0 ? 'transparent' : bucket.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(bucketXStart, binY, bucketWidth, 140, [8, 8, 4, 4]);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Draw top inner light gradient
        const highlightGradient = ctx.createLinearGradient(bucketXStart, binY, bucketXStart, binY + 25);
        highlightGradient.addColorStop(0, bucket.multiplier === 0 ? '#475569' : bucket.color);
        highlightGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.roundRect(bucketXStart, binY, bucketWidth, 25, [8, 8, 0, 0]);
        ctx.fill();

        // Draw funnel walls
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bucketXStart, binY);
        ctx.lineTo(bucketXStart, binY + 140);
        ctx.moveTo(bucketXStart + bucketWidth, binY);
        ctx.lineTo(bucketXStart + bucketWidth, binY + 140);
        ctx.stroke();

        // Draw multiplier labels
        ctx.fillStyle = bucket.multiplier === 0 ? '#94a3b8' : '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bucket.label, bucketXStart + bucketWidth / 2, binY + 70);

        // Warning Hazard labels for 0x / LOSE buckets
        if (bucket.multiplier === 0) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('LOSE', bucketXStart + bucketWidth / 2, binY + 105);
        }
      });

      // 5. DRAW ACTIVE BALL TRAILS & BODIES
      ballsRef.current.forEach((ball) => {
        // Render motion trailing alpha particles
        ball.trail.forEach((pos, idx) => {
          const alpha = (idx / ball.trail.length) * 0.35;
          ctx.fillStyle = `${neonThemeColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, ball.radius * (idx / ball.trail.length), 0, Math.PI * 2);
          ctx.fill();
        });

        // Main Ball rendering
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.clip();

        if (ballImageCache.current) {
          ctx.drawImage(
            ballImageCache.current, 
            ball.x - ball.radius, 
            ball.y - ball.radius, 
            ball.radius * 2, 
            ball.radius * 2
          );
        } else {
          // Vibrant color fallback
          ctx.fillStyle = ball.color;
          ctx.fill();
          // Inner gloss
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Outer glow rim outline
        ctx.strokeStyle = neonThemeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Restore camera state
      ctx.restore();

      // 7. MULTIPLIER ACCUMULATOR FLOATING TEXT
      if (currentScoreEffect) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = currentScoreEffect.color;
        ctx.font = 'bold 64px sans-serif';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText(currentScoreEffect.text, width / 2, height / 2 - 120);
        ctx.restore();
      }

      // 8. RECORDING OVERLAYS
      if (isRecording) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, width - 10, height - 10);

        // Blinking REC dot
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(45, 60, 15, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("REC SHORTS", 75, 68);
      }

      animationFrameId.current = requestAnimationFrame(updateLoop);
    };

    animationFrameId.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, rows, gravity, friction, bounceDamping, title, subtitle, neonThemeColor, isRecording, subtitleTimer, activeSubtitles, walletBalance]);

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      {/* 9:16 Video Canvas Stage Container */}
      <div 
        className="relative bg-slate-950 border-4 border-slate-800 rounded-3xl shadow-2xl overflow-hidden aspect-[9/16]" 
        style={{ width: '100%', maxWidth: '380px' }}
      >
        <canvas 
          ref={canvasRef} 
          width={720} 
          height={1280} 
          className="w-full h-full object-contain bg-slate-950"
        />

        {/* Beautiful Floating Wallet Glassmorphic Card */}
        <div className="absolute top-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 flex items-center justify-between shadow-2xl transition-all">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Coins className="h-4 w-4 animate-pulse" />
            </div>
            <div className="text-left">
              <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">Total Balance</p>
              <p className="text-sm font-black text-white font-mono tracking-wide">
                ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setWalletBalance((prev) => prev + 100)}
            className="px-3 py-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 shadow-sm transition-all active:scale-95"
          >
            + $100
          </button>
        </div>

        {/* Drop Ball Action at the Bottom */}
        <div className="absolute bottom-3 left-3 right-3">
          <button 
            onClick={dropBall}
            className="w-full flex items-center justify-center space-x-1.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-950/50 transform active:scale-[0.98] transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>DROP BALL ($10.00)</span>
          </button>
        </div>
      </div>

      {/* Media Controller Buttons */}
      <div className="w-full max-w-[380px] mt-4 grid grid-cols-4 gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
            isPlaying 
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
              : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30'
          }`}
        >
          {isPlaying ? <Pause className="h-4 w-4 mb-1" /> : <Play className="h-4 w-4 mb-1" />}
          <span className="text-[10px] font-semibold">{isPlaying ? 'Pause' : 'Resume'}</span>
        </button>

        <button
          onClick={() => setIsAudioOn(!isAudioOn)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
            isAudioOn 
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
              : 'bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30'
          }`}
        >
          {isAudioOn ? <Volume2 className="h-4 w-4 mb-1" /> : <VolumeX className="h-4 w-4 mb-1" />}
          <span className="text-[10px] font-semibold">{isAudioOn ? 'Muted' : 'Unmuted'}</span>
        </button>

        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-600 hover:bg-red-500 border border-red-500 text-white shadow-lg shadow-red-950/40 transition-all"
          >
            <Video className="h-4 w-4 mb-1 text-white animate-pulse" />
            <span className="text-[10px] font-bold">Record</span>
          </button>
        ) : (
          <button
            onClick={stopRecordingAndDownload}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border-2 border-red-500 text-red-400 font-bold animate-pulse transition-all"
          >
            <Square className="h-4 w-4 mb-1" />
            <span className="text-[10px] font-bold">Stop</span>
          </button>
        )}

        <button
          onClick={() => {
            ballsRef.current = [];
            statsRef.current = { totalDrops: 0, highestMultiplier: 0, lastHitTime: 0 };
            setWalletBalance(100.00);
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
        >
          <RefreshCw className="h-4 w-4 mb-1" />
          <span className="text-[10px] font-semibold">Clear</span>
        </button>
      </div>

      {/* Invisible auxiliary elements for customized Audio mapping */}
      <audio ref={bgAudioRef} />
      <audio ref={customSfxRef} />
      <audio ref={custom100xSfxRef} />
      <audio ref={custom0xSfxRef} />
    </div>
  );
}
