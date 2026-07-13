import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Play, Terminal } from 'lucide-react';

export default function PythonScriptExporter() {
  const [copied, setCopied] = useState(false);

  const pythonCode = `import pygame
import pygame.gfxdraw
import math
import random
import os
import sys
import argparse
import numpy as np
from moviepy import ImageSequenceClip, AudioFileClip, CompositeAudioClip
from PIL import Image, ImageDraw, ImageFont

# --- CONFIGURATION ---
WIDTH, HEIGHT = 720, 1280  # 9:16 Resolution for YouTube Shorts
FPS = 60
OUTPUT_DIR = "./output_shorts"
SOUNDS_DIR = "./sounds"
IMAGES_DIR = "./images"

# Colors
BLACK = (10, 10, 18)
WHITE = (255, 255, 255)
NEON_GREEN = (57, 255, 20)
NEON_RED = (255, 7, 58)
NEON_BLUE = (0, 246, 255)
GOLD = (255, 215, 0)
PEGS_COLOR = (140, 140, 160)

# Multipliers and colors at the bottom of Plinko board
BUCKET_MULTIPLIERS = [10, 2, 0.5, 0.2, 0.5, 2, 10]
BUCKET_COLORS = [
    (255, 7, 58),   # 10x - Red
    (255, 120, 0),  # 2x - Orange
    (255, 220, 0),  # 0.5x - Yellow
    (100, 100, 100), # 0.2x - Gray
    (255, 220, 0),  # 0.5x - Yellow
    (255, 120, 0),  # 2x - Orange
    (255, 7, 58),   # 10x - Red
]

# Audio tracker lists for compiling final video
audio_events = [] 

# --- Physical constants ---
GRAVITY = 0.24
BOUNCE_DAMPING = 0.55
AIR_RESISTANCE = 0.996

# Initialize pygame & sound engine
pygame.init()
try:
    pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
    sound_enabled = True
except pygame.error:
    sound_enabled = False
    print("Warning: Pygame audio mixer could not start. Sounds disabled for live playback, but still compiled into video.")

class Particle:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.vx = random.uniform(-3, 3)
        self.vy = random.uniform(-3, 3)
        self.radius = random.uniform(2, 6)
        self.alpha = 255
        self.color = color

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.1
        self.alpha = max(0, self.alpha - 6)
        self.radius = max(0.1, self.radius * 0.95)

    def draw(self, surface):
        if self.alpha > 0:
            color_with_alpha = (*self.color, self.alpha)
            # Create a small surface with alpha support
            s = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(s, color_with_alpha, (self.radius, self.radius), self.radius)
            surface.blit(s, (int(self.x - self.radius), int(self.y - self.radius)))

class PlinkoPeg:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.radius = 8
        self.glow_time = 0
        self.max_glow = 15

    def update(self):
        if self.glow_time > 0:
            self.glow_time -= 1

    def draw(self, surface):
        if self.glow_time > 0:
            # Active glowing peg
            glow_radius = self.radius + (self.glow_time * 1.5)
            alpha = int(200 * (self.glow_time / self.max_glow))
            s = pygame.Surface((glow_radius * 2, glow_radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(s, (0, 246, 255, alpha), (glow_radius, glow_radius), glow_radius)
            surface.blit(s, (int(self.x - glow_radius), int(self.y - glow_radius)))
            pygame.draw.circle(surface, NEON_BLUE, (int(self.x), int(self.y)), self.radius)
        else:
            # Neutral peg
            pygame.draw.circle(surface, PEGS_COLOR, (int(self.x), int(self.y)), self.radius)
            pygame.draw.circle(surface, (40, 40, 50), (int(self.x), int(self.y)), self.radius - 2)

class PlinkoBall:
    def __init__(self, x, y, radius, image_path=None):
        self.x = x
        self.y = y
        self.vx = random.uniform(-1.5, 1.5)
        self.vy = 0
        self.radius = radius
        self.trail = []
        self.logo = None
        
        # Load and scale ball image if provided
        if image_path and os.path.exists(image_path):
            try:
                logo_img = pygame.image.load(image_path).convert_alpha()
                self.logo = pygame.transform.scale(logo_img, (radius * 2, radius * 2))
            except Exception as e:
                print(f"Error loading ball texture: {e}")

    def update(self):
        # Physics update
        self.vy += GRAVITY
        self.vx *= AIR_RESISTANCE
        self.vy *= AIR_RESISTANCE
        
        self.x += self.vx
        self.y += self.vy

        # Record trail
        self.trail.append((self.x, self.y))
        if len(self.trail) > 15:
            self.trail.pop(0)

    def draw(self, surface):
        # Draw motion trail
        for i, pos in enumerate(self.trail):
            alpha = int(255 * (i / len(self.trail)) * 0.4)
            size = int(self.radius * (i / len(self.trail)))
            if size > 0:
                s = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
                pygame.draw.circle(s, (255, 7, 58, alpha), (size, size), size)
                surface.blit(s, (int(pos[0] - size), int(pos[1] - size)))

        # Draw ball
        cx, cy = int(self.x), int(self.y)
        if self.logo:
            # Mask onto a circular boundary
            surface.blit(self.logo, (cx - self.radius, cy - self.radius))
            # Border circle
            pygame.draw.circle(surface, NEON_RED, (cx, cy), self.radius, 2)
        else:
            # Vibrant neon ball fallback
            pygame.draw.circle(surface, NEON_RED, (cx, cy), self.radius)
            pygame.draw.circle(surface, WHITE, (cx - self.radius//3, cy - self.radius//3), self.radius//3)

def generate_pegs(rows, start_y, spacing_y):
    pegs = []
    for r in range(rows):
        row_y = start_y + r * spacing_y
        # Peg count grows by 1 per row
        cols = r + 3
        row_width = (cols - 1) * spacing_y
        start_x = (WIDTH - row_width) / 2
        for c in range(cols):
            peg_x = start_x + c * spacing_y
            # Hexagonal grid stagger
            stagger = spacing_y / 2 if r % 2 == 1 else 0
            pegs.append(PlinkoPeg(peg_x + stagger, row_y))
    return pegs

def draw_gradient_background(surface):
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(12 * (1 - ratio) + 5 * ratio)
        g = int(12 * (1 - ratio) + 12 * ratio)
        b = int(28 * (1 - ratio) + 38 * ratio)
        pygame.draw.line(surface, (r, g, b), (0, y), (WIDTH, y))

def generate_plinko_shorts(ball_image=None, bg_music=None, custom_sound=None, duration=15, title="VIRAL PLINKO CHALLENGE"):
    # Create directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(SOUNDS_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)

    # Initialize Pygame surface
    screen = pygame.Surface((WIDTH, HEIGHT))
    clock = pygame.time.Clock()

    # Game Objects Setup
    ball_radius = 22
    start_y = 250
    rows = 10
    spacing = 58
    
    pegs = generate_pegs(rows, start_y, spacing)
    ball = PlinkoBall(WIDTH / 2 + random.uniform(-10, 10), 120, ball_radius, ball_image)
    particles = []
    
    # Grid of bins
    bin_y = start_y + rows * spacing + 100
    bin_width = WIDTH / len(BUCKET_MULTIPLIERS)
    buckets = []
    for i, mult in enumerate(BUCKET_MULTIPLIERS):
        buckets.append({
            'x1': i * bin_width,
            'x2': (i + 1) * bin_width,
            'mult': mult,
            'color': BUCKET_COLORS[i],
            'pulse': 0
        })

    # Video recording cache
    frames_data = []
    total_frames = FPS * duration
    
    # Sound effect placeholders
    bounce_sound = custom_sound if custom_sound and os.path.exists(custom_sound) else None

    # Bullet time zoom parameters
    bullet_time = False
    bullet_factor = 1.0
    slowdown_target = 0.15

    print(f"Simulating plinko and capturing {total_frames} frames ({duration}s at 60fps)...")
    
    for frame_num in range(total_frames):
        frame_time = frame_num / FPS

        # Highlight Clipping: Detect if ball is approaching jackpot (extreme left/right bins)
        # Slow down time (bullet-time slow-mo) for suspense as ball reaches the bottom!
        if ball.y > bin_y - 200 and ball.y < bin_y:
            near_extreme = ball.x < bin_width * 1.5 or ball.x > WIDTH - (bin_width * 1.5)
            if near_extreme:
                bullet_time = True
                # Smooth slow-mo interpolation
                bullet_factor = max(slowdown_target, bullet_factor - 0.08)
            else:
                bullet_time = False
                bullet_factor = min(1.0, bullet_factor + 0.08)
        else:
            bullet_time = False
            bullet_factor = min(1.0, bullet_factor + 0.08)

        # Physics simulation steps driven by time factor
        steps = int(10 * bullet_factor)
        for step in range(max(1, steps)):
            dt = bullet_factor / max(1, steps)
            
            # Apply physics step
            ball.update()

            # Handle ball collisions with board borders
            if ball.x - ball.radius < 15:
                ball.x = 15 + ball.radius
                ball.vx = -ball.vx * BOUNCE_DAMPING
            elif ball.x + ball.radius > WIDTH - 15:
                ball.x = WIDTH - 15 - ball.radius
                ball.vx = -ball.vx * BOUNCE_DAMPING

            # Collision with pegs
            for peg in pegs:
                dist = math.hypot(ball.x - peg.x, ball.y - peg.y)
                min_dist = ball.radius + peg.radius
                if dist < min_dist:
                    # Resolve overlap
                    overlap = min_dist - dist
                    nx = (ball.x - peg.x) / dist
                    ny = (ball.y - peg.y) / dist
                    ball.x += nx * overlap
                    ball.y += ny * overlap
                    
                    # Bounce velocity
                    dot = ball.vx * nx + ball.vy * ny
                    ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE_DAMPING
                    ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE_DAMPING
                    
                    # Stagger/scatter on peg slightly
                    ball.vx += random.uniform(-0.4, 0.4)

                    # Trigger peg state
                    peg.glow_time = peg.max_glow
                    
                    # Track audio bounce event
                    if len(audio_events) < 150: # Avoid overload
                        audio_events.append({
                            'time': frame_time,
                            'type': 'peg_hit'
                        })

                    # Spawn light particles
                    for _ in range(5):
                        particles.append(Particle(peg.x, peg.y, NEON_BLUE))

            # Collisions with bucket dividers
            if ball.y > bin_y - 60 and ball.y < bin_y + 10:
                for b_idx in range(1, len(BUCKET_MULTIPLIERS)):
                    div_x = b_idx * bin_width
                    if abs(ball.x - div_x) < 5:
                        ball.vx = -ball.vx * BOUNCE_DAMPING
                        ball.x = div_x + (5 if ball.vx > 0 else -5)

            # Check if landed in a bucket
            if ball.y > bin_y + 10:
                # Find bucket index
                b_idx = int(ball.x // bin_width)
                b_idx = max(0, min(b_idx, len(BUCKET_MULTIPLIERS) - 1))
                bucket = buckets[b_idx]
                bucket['pulse'] = 20
                
                # Goal/Impact sound event
                audio_events.append({
                    'time': frame_time,
                    'type': 'jackpot' if bucket['mult'] >= 10 else 'score'
                })

                # Mega particle explosion
                for _ in range(40):
                    particles.append(Particle(ball.x, ball.y, bucket['color']))

                # Reset ball to top
                ball.x = WIDTH / 2 + random.uniform(-20, 20)
                ball.y = 120
                ball.vx = random.uniform(-1.5, 1.5)
                ball.vy = 0
                ball.trail = []

        # Update particles and peg glow
        for p in particles:
            p.update()
        particles = [p for p in particles if p.alpha > 0]
        
        for peg in pegs:
            peg.update()
            
        for b in buckets:
            if b['pulse'] > 0:
                b['pulse'] -= 1

        # --- DRAWING ---
        draw_gradient_background(screen)

        # Draw Side Borders (glowing neon lines)
        pygame.draw.line(screen, NEON_BLUE, (15, 50), (15, HEIGHT - 50), 4)
        pygame.draw.line(screen, NEON_BLUE, (WIDTH - 15, 50), (WIDTH - 15, HEIGHT - 50), 4)

        # Draw Title text (Classic TikTok bold font)
        try:
            font_title = pygame.font.SysFont("impact", 48)
            font_sub = pygame.font.SysFont("arial", 28)
        except:
            font_title = pygame.font.Font(pygame.font.get_default_font(), 40)
            font_sub = pygame.font.Font(pygame.font.get_default_font(), 24)

        title_surf = font_title.render(title, True, GOLD)
        title_rect = title_surf.get_rect(center=(WIDTH // 2, 80))
        screen.blit(title_surf, title_rect)

        sub_surf = font_sub.render("SUBSCRIBE FOR LUCK! 🍀", True, WHITE)
        sub_rect = sub_surf.get_rect(center=(WIDTH // 2, 135))
        screen.blit(sub_surf, sub_rect)

        # Draw pegs
        for peg in pegs:
            peg.draw(screen)

        # Draw bucket bins
        for i, b in enumerate(buckets):
            bx = b['x1']
            b_height = 90 + (b['pulse'] * 1.5)
            # Glowing bin background
            alpha = 140 if b['pulse'] > 0 else 60
            s = pygame.Surface((bin_width - 4, b_height), pygame.SRCALPHA)
            s.fill((*b['color'], alpha))
            screen.blit(s, (bx + 2, bin_y))
            
            # Bucket boundary lines
            pygame.draw.line(screen, WHITE, (bx, bin_y), (bx, bin_y + 120), 2)
            
            # Value label
            lbl = f"{b['mult']}x"
            lbl_surf = font_sub.render(lbl, True, WHITE if b['pulse'] == 0 else GOLD)
            lbl_rect = lbl_surf.get_rect(center=(bx + bin_width/2, bin_y + 40))
            screen.blit(lbl_surf, lbl_rect)

        # Draw Particles
        for p in particles:
            p.draw(screen)

        # Draw ball
        ball.draw(screen)

        # Bullet time suspense indicator
        if bullet_time:
            s_overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            s_overlay.fill((255, 7, 58, 15 + int(15 * math.sin(frame_num * 0.2))))
            screen.blit(s_overlay, (0, 0))
            
            text_susp = font_title.render("OMG!! SLOW-MO MOMENT! 💀", True, NEON_RED)
            text_rect = text_susp.get_rect(center=(WIDTH // 2, HEIGHT / 2 + 100))
            screen.blit(text_susp, text_rect)

        # Append frame
        string_img = pygame.image.tostring(screen, "RGB", False)
        pil_img = Image.frombytes("RGB", (WIDTH, HEIGHT), string_img)
        frames_data.append(np.array(pil_img))

    # Quit Pygame visuals
    pygame.quit()

    # --- COMPILE VIDEO WITH SOUNDS ---
    print("Compiling final movie with soundtrack alignment...")
    clip = ImageSequenceClip(frames_data, fps=FPS)
    
    # Sound compilation
    all_audio_clips = []
    
    # Insert custom background music if set
    if bg_music and os.path.exists(bg_music):
        try:
            bg_clip = AudioFileClip(bg_music).subclip(0, duration)
            bg_clip = bg_clip.volumex(0.35)  # Set background music volume lower
            all_audio_clips.append(bg_clip)
            print(f"Matched background track: {bg_music}")
        except Exception as e:
            print(f"Error loading background track: {e}")

    # Generate or map synthesizer chime frequencies for standard chimes
    # Align bounce sounds with captured audio_events
    if bounce_sound and os.path.exists(bounce_sound):
        print(f"Spreading {len(audio_events)} bounce audio clips...")
        for event in audio_events:
            try:
                # Add a little volume variation to make it organic
                sfx = AudioFileClip(bounce_sound)
                sfx = sfx.with_start(event['time'])
                if event['type'] == 'peg_hit':
                    sfx = sfx.volumex(random.uniform(0.15, 0.4))
                else:
                    sfx = sfx.volumex(1.0) # Full volume on bucket impact
                all_audio_clips.append(sfx)
            except Exception as e:
                pass

    if all_audio_clips:
        final_audio = CompositeAudioClip(all_audio_clips)
        clip = clip.set_audio(final_audio)
    
    output_path = os.path.join(OUTPUT_DIR, "plinko_viral_short.mp4")
    clip.write_videofile(output_path, codec="libx264", audio_codec="aac")
    print(f"🚀 Success! Viral YouTube Plinko Short saved to: {output_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Plinko YouTube Shorts Generator CLI")
    parser.add_argument('--ball-image', type=str, help="Path to ball image photo")
    parser.add_argument('--music', type=str, help="Path to background music file")
    parser.add_argument('--bounce-sound', type=str, help="Path to bounce wave file")
    parser.add_argument('--duration', type=int, default=15, help="Clip duration in seconds")
    parser.add_argument('--title', type=str, default="MEGA PLINKO LUCK 💀", help="TikTok Video Header Title")
    
    args = parser.parse_args()
    generate_plinko_shorts(args.ball_image, args.music, args.bounce_sound, args.duration, args.title)
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = () => {
    const blob = new Blob([pythonCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plinko_shorts_generator.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl max-w-4xl mx-auto my-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-sans text-lg font-semibold text-slate-100">Python Offline CLI Script</h3>
            <p className="font-sans text-xs text-slate-400">Run Plinko shorts compiling programmatically on your computer</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-all"
            title="Copy script to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          <button
            onClick={downloadScript}
            className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg font-medium transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .py File</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80">
          <h4 className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>How to execute locally:</span>
          </h4>
          <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1">
            <li>Install system and Python requirements:
              <pre className="bg-slate-900 text-cyan-300 p-2 rounded my-1 font-mono text-[11px] overflow-x-auto select-all">
                pip install pygame moviepy numpy pillow
              </pre>
            </li>
            <li>Run the script with default values (it triggers automatically):
              <pre className="bg-slate-900 text-cyan-300 p-2 rounded my-1 font-mono text-[11px] overflow-x-auto select-all">
                python plinko_shorts_generator.py --duration 15 --title "PEPE PLINKO CHILL 💀"
              </pre>
            </li>
            <li>Fully customize it with custom ball images or music:
              <pre className="bg-slate-900 text-cyan-300 p-2 rounded my-1 font-mono text-[11px] overflow-x-auto select-all">
                python plinko_shorts_generator.py --ball-image my_doge.png --music background.mp3 --bounce-sound pop.wav
              </pre>
            </li>
          </ol>
        </div>

        <div className="relative">
          <div className="absolute top-3 right-3 text-[10px] bg-slate-950 border border-slate-800 text-slate-500 font-mono px-2 py-0.5 rounded">
            python (pygame + moviepy)
          </div>
          <pre className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-xs font-mono text-cyan-400/90 h-64 overflow-y-auto overflow-x-auto whitespace-pre">
            {pythonCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
