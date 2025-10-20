import React, { useRef, useEffect } from 'react';

// Props interface
interface BackgroundCanvasProps {
  animationType: string;
}

// Abstract Animation class
abstract class Animation {
  protected ctx: CanvasRenderingContext2D;
  protected canvas: HTMLCanvasElement;
  protected animationFrameId: number = 0;
  protected themeColors: { [key: string]: string } = {};
  protected lastTimestamp: number = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  protected getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    this.themeColors = {
      primary: style.getPropertyValue('--primary-glow').trim(),
      accent1: style.getPropertyValue('--accent1-glow').trim(),
      accent2: style.getPropertyValue('--accent2-glow').trim(),
      bgDark: style.getPropertyValue('--bg-dark').trim(),
    };
  }

  // To be implemented by subclasses
  abstract init(): void;
  abstract animate(timestamp: number): void;
  
  // Common start method
  public start() {
    this.getThemeColors();
    this.init();
    // Use a bound version of animate for requestAnimationFrame
    const animationLoop = (timestamp: number) => {
        this.animate(timestamp);
        this.animationFrameId = requestAnimationFrame(animationLoop);
    };
    this.animationFrameId = requestAnimationFrame(animationLoop);
  }

  // Common stop method
  public stop() {
    cancelAnimationFrame(this.animationFrameId);
  }
  
  // Common resize handler
  public resize() {
    // We now size based on the parent element, not the window.
    if (this.canvas.parentElement) {
      this.canvas.width = this.canvas.parentElement.clientWidth;
      this.canvas.height = this.canvas.parentElement.clientHeight;
    }
    this.getThemeColors();
    this.init(); // Re-initialize on resize
  }
}


// --- 1. VIRAL PARTICLE PLEXUS ANIMATION ---
class Particle {
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    color: string;

    constructor(width: number, height: number, color: string) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 1;
        this.color = color;
    }

    update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }
}

class ParticlePlexusAnimation extends Animation {
    private particles: Particle[] = [];
    private numParticles: number = 150;
    private linkDistance: number = 120;

    init() {
        this.particles = [];
        const colorPalette = [this.themeColors.primary, this.themeColors.accent1, this.themeColors.accent2];
        
        if (this.canvas.width < 768) {
            this.numParticles = 75;
            this.linkDistance = 100;
        }

        for (let i = 0; i < this.numParticles; i++) {
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            this.particles.push(new Particle(this.canvas.width, this.canvas.height, color));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.update(this.canvas.width, this.canvas.height);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

                if (dist < this.linkDistance) {
                    const opacity = 1 - dist / this.linkDistance;
                    const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    gradient.addColorStop(0, p1.color);
                    gradient.addColorStop(1, p2.color);

                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.globalAlpha = opacity * 0.7;
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }
}


// --- 2. ARC LIGHTNING --- (OPTIMIZED)
class LightningBolt {
    segments: { x: number, y: number }[] = [];
    life: number = 1.0;
    color: string;
    lineWidth: number;
    children: LightningBolt[] = [];
    intensity: number;

    constructor(x: number, y: number, endY: number, color: string, isBranch: boolean = false, particleCallback: (x: number, y: number, color: string) => void, intensity: number = 1.0) {
        this.color = color;
        this.intensity = isBranch ? intensity * 0.7 : intensity;
        this.lineWidth = (isBranch ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 1) * this.intensity;
        
        let lastSeg = { x, y };
        this.segments.push(lastSeg);

        while(lastSeg.y < endY && lastSeg.y < window.innerHeight + 50) {
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
            const segLength = Math.random() * 15 + 5;
            
            let newX = lastSeg.x + Math.cos(angle) * segLength;
            let newY = lastSeg.y + Math.sin(angle) * segLength;
            newX += (Math.random() - 0.5) * 20;

            const newSeg = { x: newX, y: newY };
            this.segments.push(newSeg);

            if (!isBranch && Math.random() > 0.98) {
                particleCallback(newSeg.x, newSeg.y, color);
            }

            // Reduced branching for performance
            if (this.children.length < 3 && Math.random() > (isBranch ? 0.99 : 0.97)) {
                this.children.push(new LightningBolt(newSeg.x, newSeg.y, newSeg.y + Math.random() * (endY - newSeg.y), color, true, particleCallback, this.intensity));
            }
            
            lastSeg = newSeg;
        }
    }

    update() {
        this.life -= 0.04 / (1 + (this.intensity - 1) * 0.2);
        this.children.forEach(child => child.update());
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        
        const alpha = Math.min(1.0, Math.pow(this.life, 2.0) * this.intensity);
        if (alpha <= 0) return;
        
        ctx.save();
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }

        // Main glow stroke - reduced shadowBlur
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowBlur = 15 * this.intensity;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // Bright core stroke
        ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.8)';
        ctx.lineWidth = this.lineWidth * 0.5;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        ctx.restore();

        this.children.forEach(child => child.draw(ctx));
    }
}

class EnergizedParticle {
    x: number; y: number;
    vx: number; vy: number;
    life: number = 1.0;
    size: number;
    color: string;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.01;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fill();
    }
}

class ArcLightningAnimation extends Animation {
    private bolts: LightningBolt[] = [];
    private particles: EnergizedParticle[] = [];
    private spawnCooldown: number = 0;
    private flashOpacity: number = 0;
    private sheetOpacity: number = 0;
    private sheetCooldown: number = 0;
    private glitchTimeoutId: number | null = null;
    private needsInitialBlast: boolean = false;

    init() { 
        this.bolts = [];
        this.particles = [];
        this.lastTimestamp = performance.now();
        this.needsInitialBlast = true; // Flag for one-time blast
    }

    private triggerGlitchEffect(duration: number) {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            if (this.glitchTimeoutId) {
                clearTimeout(this.glitchTimeoutId);
            }
            mainContent.classList.add('glitch-surge-effect');
            this.glitchTimeoutId = window.setTimeout(() => {
                mainContent.classList.remove('glitch-surge-effect');
                this.glitchTimeoutId = null;
            }, duration);
        }
    }

    private executeInitialBlast() {
        const numBolts = Math.floor(Math.random() * 4) + 5;
        for (let i = 0; i < numBolts; i++) {
            const intensity = Math.random() * 0.8 + 1.2;
            const startX = Math.random() * this.canvas.width;
            const endY = this.canvas.height;
            const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
            this.bolts.push(new LightningBolt(startX, 0, endY, color, false, this.addParticle, intensity));
        }
        this.flashOpacity = 0.8;
        this.triggerGlitchEffect(500);
        this.spawnCooldown = Math.random() * 2000 + 4000;
    }

    addParticle = (x: number, y: number, color: string) => {
        const count = Math.floor(Math.random() * 5 + 3);
        for(let i=0; i < count; i++) {
            this.particles.push(new EnergizedParticle(x, y, color));
        }
    }

    animate(timestamp: number) {
        const delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        if (this.needsInitialBlast) {
            this.executeInitialBlast();
            this.needsInitialBlast = false;
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Ambient Sheet Lightning
        this.sheetCooldown -= delta;
        if(this.sheetCooldown <= 0) {
            this.sheetCooldown = Math.random() * 6000 + 2000;
            this.sheetOpacity = Math.random() * 0.1 + 0.05;
        }
        if(this.sheetOpacity > 0) {
            this.ctx.fillStyle = `hsla(220, 100%, 80%, ${this.sheetOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.sheetOpacity = Math.max(0, this.sheetOpacity - 0.02);
        }

        // Main Strike Flash
        if (this.flashOpacity > 0) {
            this.ctx.fillStyle = `rgba(200, 220, 255, ${this.flashOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.flashOpacity = Math.max(0, this.flashOpacity - 0.1);
        }

        this.spawnCooldown -= delta;
        if (this.spawnCooldown <= 0) {
            // Adapt spawn rate to screen size for performance
            const screenArea = this.canvas.width * this.canvas.height;
            const baseArea = 1280 * 720; // Reference area
            const performanceFactor = Math.max(1, screenArea / baseArea);
            
            const maxCooldown = 3000 * performanceFactor;
            const minCooldown = 800 * performanceFactor;
            this.spawnCooldown = Math.random() * (maxCooldown - minCooldown) + minCooldown;
            
            const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
            const startX = Math.random() * this.canvas.width;
            const endY = this.canvas.height;
            const intensity = Math.random() * 1.0 + 0.5;
            
            this.bolts.push(new LightningBolt(startX, 0, endY, color, false, this.addParticle, intensity));
            
            this.flashOpacity = Math.min(0.8, (Math.random() * 0.3 + 0.3) * intensity);
            this.triggerGlitchEffect(300);
        }
        
        this.ctx.globalCompositeOperation = 'lighter';

        this.bolts = this.bolts.filter(b => {
            b.update();
            return b.life > 0;
        });
        this.bolts.forEach(b => b.draw(this.ctx));
        
        this.particles = this.particles.filter(p => {
            p.update();
            return p.life > 0;
        });
        this.particles.forEach(p => p.draw(this.ctx));

        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.globalCompositeOperation = 'source-over';
    }
}

// --- NEW: OVERLOADED CIRCUITS ANIMATION ---
interface CircuitComponent {
  x: number; y: number;
  width: number; height: number;
  isDamaged: boolean;
  glow: number;
  hotspot: number;
  crackSeed: number;
}

interface CircuitPath {
  points: { x: number, y: number }[];
}

class EnergyPulse {
  path: CircuitPath;
  progress: number = 0;
  speed: number;

  constructor(path: CircuitPath) {
    this.path = path;
    this.speed = Math.random() * 0.02 + 0.01;
  }

  update(delta: number): boolean {
    this.progress += this.speed * delta;
    return this.progress < 1;
  }

  draw(ctx: CanvasRenderingContext2D, color: string) {
      const pIndex = this.progress * (this.path.points.length - 1);
      const i = Math.floor(pIndex);
      const j = Math.min(i + 1, this.path.points.length - 1);
      if (!this.path.points[i] || !this.path.points[j]) return;
      
      const t = pIndex - i;
      const x = this.path.points[i].x * (1-t) + this.path.points[j].x * t;
      const y = this.path.points[i].y * (1-t) + this.path.points[j].y * t;

      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = Math.sin(this.progress * Math.PI) * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  }
}

class CrawlingArc {
    segments: {x: number, y: number, vx: number, vy: number}[];
    life: number = 1.0;
    spawnSparks: (x:number, y:number) => void;

    constructor(from: {x:number, y:number}, to: {x:number, y:number}, spawnSparksCb: (x:number, y:number) => void) {
        this.segments = [{...from, vx:0, vy:0}];
        this.spawnSparks = spawnSparksCb;
        
        let current = {...from};
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        const step = 15;
        const steps = Math.max(1, dist / step);
        
        for (let i = 0; i < steps; i++) {
            const next = {
                x: from.x + dx * (i/steps),
                y: from.y + dy * (i/steps)
            };
            this.segments.push({...next, vx:0, vy:0});
        }
    }

    update(): boolean {
        this.life -= 0.03;
        
        for (let i=1; i < this.segments.length-1; i++) {
            this.segments[i].vx += (Math.random() - 0.5) * 5;
            this.segments[i].vy += (Math.random() - 0.5) * 5;
            this.segments[i].vx *= 0.8;
            this.segments[i].vy *= 0.8;
            this.segments[i].x += this.segments[i].vx;
            this.segments[i].y += this.segments[i].vy;
        }
        if(Math.random() > 0.95) this.spawnSparks(this.segments[Math.floor(this.segments.length/2)].x, this.segments[Math.floor(this.segments.length/2)].y);
        
        return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D, color: string) {
        ctx.save();
        ctx.globalAlpha = this.life * (0.5 + Math.random() * 0.5);
        ctx.shadowColor = color; ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for(let i=1; i<this.segments.length; i++) ctx.lineTo(this.segments[i].x, this.segments[i].y);
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.restore();
    }
}

class MoltenSpark {
    x: number; y: number; vx: number; vy: number;
    life: number = 1.0; size: number;
    
    constructor(x:number, y:number) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.size = Math.random() * 2 + 1;
    }
    
    update(delta: number): boolean {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.vy += 0.1 * delta; // gravity
        this.life -= 0.02 * delta;
        return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D, color: string) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}


class SmokeParticle {
    x: number; y: number; vx: number; vy: number;
    size: number; maxSize: number; life: number = 1.0;
    
    constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3 - 0.5;
        this.maxSize = Math.random() * 25 + 15;
        this.size = 0;
    }
    
    update(delta: number): boolean {
        this.life -= 0.0005 * delta * this.maxSize;
        this.x += this.vx * delta; this.y += this.vy * delta;
        this.size = (1 - this.life) * this.maxSize;
        return this.life > 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'hsla(0, 0%, 50%, 0.5)';
        ctx.globalAlpha = Math.sin(this.life * Math.PI) * 0.05;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}


class CircuitsAnimation extends Animation {
    private components: CircuitComponent[] = [];
    private paths: CircuitPath[] = [];
    private pulses: EnergyPulse[] = [];
    private arcs: CrawlingArc[] = [];
    private sparks: MoltenSpark[] = [];
    private smoke: SmokeParticle[] = [];
    private flashOpacity: number = 0;
    private cameraShake = { x: 0, y: 0, intensity: 0 };
    private offscreenCanvas: HTMLCanvasElement;
    private offscreenCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        super(canvas, ctx);
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    }
    
    init() {
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.components = []; this.paths = []; this.pulses = [];
        this.arcs = []; this.sparks = []; this.smoke = [];
        
        const componentCount = this.canvas.width < 768 ? 15 : 30;
        for (let i = 0; i < componentCount; i++) {
            const isDamaged = Math.random() > 0.8;
            this.components.push({
                x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
                width: 40 + Math.random()*60, height: 40 + Math.random()*60, 
                isDamaged: isDamaged, glow: 0, hotspot: isDamaged ? 1 : 0, crackSeed: Math.random()
            });
        }
        
        this.components.forEach(c1 => {
            let connections = 0;
            this.components.forEach(c2 => {
                if (c1 !== c2 && connections < 3 && Math.random() > 0.6) {
                    const path = this.createPath(c1, c2);
                    this.paths.push(path);
                    connections++;
                }
            });
        });

        this.drawOffscreen();
    }

    createPath(c1: CircuitComponent, c2: CircuitComponent): CircuitPath {
        const path: CircuitPath = { points: [{x: c1.x, y: c1.y}] };
        let current = {x: c1.x, y: c1.y};
        for(let i=0; i<3; i++) {
            const next = { x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height };
            path.points.push(next);
            current = next;
        }
        path.points.push({x: c2.x, y: c2.y});
        return path;
    }
    
    drawOffscreen() {
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenCtx.strokeStyle = this.themeColors.accent1;
        this.offscreenCtx.lineWidth = 0.5;
        this.offscreenCtx.globalAlpha = 0.1;

        this.paths.forEach(path => {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(path.points[0].x, path.points[0].y);
            for(let i=1; i<path.points.length; i++) this.offscreenCtx.lineTo(path.points[i].x, path.points[i].y);
            this.offscreenCtx.stroke();
        });
    }

    spawnSparks = (x:number, y:number) => {
        const count = Math.floor(Math.random() * 5 + 3);
        for(let i=0; i < count; i++) this.sparks.push(new MoltenSpark(x, y));
    }

    animate(timestamp: number) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const delta = Math.min(2, (timestamp - this.lastTimestamp) / 16.67);
        this.lastTimestamp = timestamp;

        if (this.cameraShake.intensity > 0) {
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        }
        
        this.ctx.save();
        this.ctx.translate(this.cameraShake.x, this.cameraShake.y);

        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (Math.random() > 0.8 && this.pulses.length < 50) {
            const path = this.paths[Math.floor(Math.random() * this.paths.length)];
            if(path) this.pulses.push(new EnergyPulse(path));
        }
        
        if (Math.random() > 0.985 && this.arcs.length < 5) {
            const c1 = this.components[Math.floor(Math.random() * this.components.length)];
            const c2 = this.components[Math.floor(Math.random() * this.components.length)];
            if(c1 && c2 && c1 !== c2) {
                this.arcs.push(new CrawlingArc({x: c1.x, y: c1.y}, {x: c2.x, y: c2.y}, this.spawnSparks));
                c1.glow = 1; c2.glow = 1;
            }
        }
        
        if (Math.random() > 0.995) {
            this.flashOpacity = 0.8;
            this.cameraShake.intensity = 10;
        }

        this.ctx.drawImage(this.offscreenCanvas, 0, 0);

        this.components.forEach(c => {
            c.glow *= 0.95;
            c.hotspot = c.isDamaged ? 1 : c.hotspot * 0.98;
            
            // Draw hotspot
            if (c.hotspot > 0.01) {
                const grad = this.ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.width * 1.5);
                grad.addColorStop(0, `hsla(20, 100%, 50%, ${c.hotspot * 0.4})`);
                grad.addColorStop(1, 'hsla(20, 100%, 50%, 0)');
                this.ctx.fillStyle = grad;
                this.ctx.fillRect(c.x - c.width*1.5, c.y - c.width*1.5, c.width * 3, c.width * 3);
            }
            if(c.isDamaged && Math.random() > 0.9) this.smoke.push(new SmokeParticle(c.x, c.y));

            // Draw component body
            this.ctx.fillStyle = 'hsl(220, 10%, 10%)';
            this.ctx.fillRect(c.x - c.width/2, c.y - c.height/2, c.width, c.height);
            this.ctx.strokeStyle = `hsla(220, 10%, 40%, ${0.5 + c.glow})`;
            this.ctx.strokeRect(c.x - c.width/2, c.y - c.height/2, c.width, c.height);

            // Draw cracks on damaged components
            if(c.isDamaged) {
                this.ctx.save();
                this.ctx.translate(c.x - c.width/2, c.y - c.height/2);
                const lightBurst = 0.5 + Math.sin(timestamp * 0.01 + c.crackSeed * 10) * 0.5;
                this.ctx.strokeStyle = `hsla(48, 100%, 70%, ${lightBurst})`;
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = this.themeColors.primary;
                this.ctx.shadowBlur = lightBurst * 20;
                
                this.ctx.beginPath();
                this.ctx.moveTo(c.width * 0.1, c.height * 0.1);
                this.ctx.lineTo(c.width * 0.5, c.height * 0.5);
                this.ctx.lineTo(c.width * 0.4, c.height * 0.9);
                this.ctx.moveTo(c.width * 0.5, c.height * 0.5);
                this.ctx.lineTo(c.width * 0.9, c.height * 0.6);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        });

        this.smoke = this.smoke.filter(s => s.update(delta));
        this.smoke.forEach(s => s.draw(this.ctx));
        
        this.ctx.globalCompositeOperation = 'lighter';
        this.pulses = this.pulses.filter(p => p.update(delta));
        this.pulses.forEach(p => p.draw(this.ctx, this.themeColors.primary));
        
        this.arcs = this.arcs.filter(a => a.update());
        this.arcs.forEach(a => a.draw(this.ctx, this.themeColors.primary));
        
        this.sparks = this.sparks.filter(s => s.update(delta));
        this.sparks.forEach(s => s.draw(this.ctx, 'hsl(30, 100%, 60%)'));
        this.ctx.globalCompositeOperation = 'source-over';
        
        if (this.flashOpacity > 0) {
            this.ctx.fillStyle = `hsla(0, 0%, 100%, ${this.flashOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.flashOpacity = Math.max(0, this.flashOpacity - 0.05);
        }

        this.ctx.restore();
    }
}


// --- 6. MATRIX RAIN ---
class MatrixAnimation extends Animation {
    private drops: number[];
    private fontSize: number = 16;
    private columns: number;
    private katakana: string = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    private latin: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private nums: string = '0123456789';
    private charSet: string = this.katakana + this.latin + this.nums;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        super(canvas, ctx);
        this.columns = Math.floor(canvas.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = 1;
        }
    }

    init() {
        // Recalculate columns on resize
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = 1;
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.charSet[Math.floor(Math.random() * this.charSet.length)];
            
            // Draw the lead character in white/light green
            this.ctx.fillStyle = '#C8FFE8'; // A very light green
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            // Draw the rest of the tail in green
            this.ctx.fillStyle = '#0A8A0A'; // Darker green
            if (this.drops[i] * this.fontSize > this.fontSize) {
                const prevText = this.charSet[Math.floor(Math.random() * this.charSet.length)];
                this.ctx.fillText(prevText, i * this.fontSize, (this.drops[i] - 1) * this.fontSize);
            }
            
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            
            this.drops[i]++;
        }
    }
}

// --- 7. TORNADO WARZONE ---

// Represents a chunk of the ground ripped up by the storm
class GroundDebris {
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    angle: number;
    rotation: number;
    rotationSpeed: number;
    size: number;
    life: number = 1;

    constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = height * (0.8 + Math.random() * 0.2);
        this.z = Math.random();
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.size = (1 + this.z) * 4;
    }

    update(centerX: number, height: number) {
        const climb = this.y / height;
        const funnelRadius = (1 - climb) * (centerX * 0.3);
        const targetX = centerX + Math.cos(this.angle) * funnelRadius;
        
        // Attraction towards funnel center
        this.vx += (targetX - this.x) * 0.005;
        this.vy += -0.5; // BUG FIX: Weaker updraft
        
        this.vx *= 0.95; // Damping
        this.vy *= 0.95;

        this.x += this.vx;
        this.y += this.vy;
        this.angle += 0.05;
        this.rotation += this.rotationSpeed;

        if (this.y < 0) this.life = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const scale = 0.2 + this.z * 0.8;
        const currentSize = this.size * scale;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = `hsl(20, 10%, ${20 + this.z * 20}%)`;
        ctx.strokeStyle = 'hsl(48, 100%, 55%)';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.8 * scale;
        
        ctx.beginPath();
        ctx.moveTo(-currentSize, -currentSize);
        ctx.lineTo(currentSize, -currentSize / 2);
        ctx.lineTo(currentSize / 2, currentSize);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

enum WeaponState { IDLE, CHARGING, FIRING }

class RobotDebris {
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    angle: number;
    rotation: number;
    rotationSpeed: number;
    size: number;
    life: number = 1;
    isDamaged: boolean;
    weaponCharge: number;
    target: RobotDebris | null = null;
    fireCooldown: number;
    weaponState: WeaponState = WeaponState.IDLE;
    chargeTime: number = 0;
    maxChargeTime: number = 20; // 20 frames to charge
    private themeColors: { [key: string]: string };

    constructor(width: number, height: number, themeColors: { [key: string]: string }) {
        this.x = Math.random() * width;
        this.y = height * (0.8 + Math.random() * 0.2);
        this.z = Math.random();
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.size = (1 + this.z) * 6;
        this.isDamaged = false;
        this.weaponCharge = 0;
        this.fireCooldown = Math.random() * 60 + 30; // BUG FIX: Reduced cooldown
        this.themeColors = themeColors;
    }

    takeDamage() {
        this.isDamaged = true;
        this.life -= 0.5; // BUG FIX: Take damage, 2 hits to kill
    }

    update(centerX: number, height: number, otherRobots: RobotDebris[], createLaserBolt: (from: RobotDebris, to: RobotDebris) => void) {
        const climb = this.y / height;
        const funnelRadius = (1 - climb) * (centerX * 0.3);
        const targetX = centerX + Math.cos(this.angle) * funnelRadius;
        
        this.vx += (targetX - this.x) * 0.004;
        this.vy += -0.5; // BUG FIX: Weaker updraft
        
        this.vx *= 0.96; this.vy *= 0.96;

        this.x += this.vx;
        this.y += this.vy;
        this.angle += 0.04;
        this.rotation += this.rotationSpeed;

        this.fireCooldown--;

        if ((!this.target || this.target.life <= 0) && otherRobots.length > 0) {
            this.target = otherRobots[Math.floor(Math.random() * otherRobots.length)];
        }

        if (this.weaponState === WeaponState.IDLE && this.fireCooldown <= 0 && this.target && this.target.life > 0) {
            this.weaponState = WeaponState.CHARGING;
            this.chargeTime = 0;
        }

        if (this.weaponState === WeaponState.CHARGING) {
            if (!this.target || this.target.life <= 0) {
                this.weaponState = WeaponState.IDLE;
                this.weaponCharge = 0;
                this.chargeTime = 0;
            } else {
                this.chargeTime++;
                this.weaponCharge = this.chargeTime / this.maxChargeTime;
                if (this.chargeTime >= this.maxChargeTime) {
                    this.weaponState = WeaponState.FIRING;
                }
            }
        }

        if (this.weaponState === WeaponState.FIRING) {
            if (this.target && this.target.life > 0) {
                createLaserBolt(this, this.target);
            }
            this.weaponState = WeaponState.IDLE;
            this.weaponCharge = 0;
            this.chargeTime = 0;
            this.fireCooldown = Math.random() * 80 + 80;
        }

        if (this.y < 0) this.life = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const scale = 0.2 + this.z * 0.8;
        const currentSize = this.size * scale;
        if (currentSize < 1) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = this.isDamaged ? `hsl(20, 10%, ${15 + this.z * 10}%)` : `hsl(220, 10%, ${30 + this.z * 20}%)`;
        ctx.strokeStyle = this.isDamaged ? 'hsl(0, 50%, 40%)' : this.themeColors.accent1;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.9 * scale;

        const bodyW = currentSize * 1.5;
        const bodyH = currentSize * 2;
        ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);
        ctx.strokeRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

        ctx.fillStyle = this.isDamaged ? 'hsl(20, 100%, 30%)' : 'hsl(0, 100%, 50%)';
        ctx.shadowBlur = 5; ctx.shadowColor = 'hsl(0, 100%, 50%)';
        ctx.beginPath();
        ctx.arc(0, -bodyH * 0.2, currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        const armY = -bodyH * 0.1, armLength = bodyW * 0.8, gunLength = currentSize;
        ctx.beginPath();
        ctx.moveTo(-bodyW / 2, armY); ctx.lineTo(-bodyW / 2 - armLength, armY - currentSize * 0.2);
        ctx.moveTo(bodyW / 2, armY); ctx.lineTo(bodyW / 2 + armLength, armY - currentSize * 0.2);
        ctx.stroke();

        ctx.fillStyle = `hsl(220, 10%, ${40 + this.z * 20}%)`;
        ctx.fillRect(-bodyW / 2 - armLength - gunLength, armY - currentSize * 0.2 - currentSize * 0.3, gunLength, currentSize * 0.6);
        ctx.fillRect(bodyW / 2 + armLength, armY - currentSize * 0.2 - currentSize * 0.3, gunLength, currentSize * 0.6);

        if (this.weaponCharge > 0) {
            ctx.fillStyle = this.themeColors.primary;
            ctx.shadowBlur = 10; ctx.shadowColor = this.themeColors.primary;
            ctx.globalAlpha = this.weaponCharge;
            ctx.beginPath(); ctx.arc(-bodyW / 2 - armLength - gunLength, armY - currentSize * 0.2, currentSize * 0.4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(bodyW / 2 + armLength + gunLength, armY - currentSize * 0.2, currentSize * 0.4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

class LaserBolt {
    x: number; y: number;
    from: RobotDebris;
    to: RobotDebris;
    speed: number = 25;
    length: number = 20;
    vx: number; vy: number;

    constructor(from: RobotDebris, to: RobotDebris) {
        this.from = from;
        this.to = to;
        this.x = from.x;
        this.y = from.y;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(): boolean {
        this.x += this.vx; this.y += this.vy;
        return Math.hypot(this.x - this.to.x, this.y - this.to.y) < this.speed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        const angle = Math.atan2(this.vy, this.vx);
        ctx.beginPath();
        ctx.moveTo(this.x - Math.cos(angle) * this.length, this.y - Math.sin(angle) * this.length);
        ctx.lineTo(this.x, this.y);
        
        ctx.strokeStyle = 'hsl(48, 100%, 70%)'; ctx.lineWidth = 3;
        ctx.shadowBlur = 15; ctx.shadowColor = 'hsl(48, 100%, 55%)';
        ctx.stroke();
        
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
    }
}

class Explosion {
    x: number; y: number;
    radius: number = 0;
    maxRadius: number = 30;
    life: number = 1.0;
    
    constructor(x: number, y: number) { this.x = x; this.y = y; }

    update() {
        this.life -= 0.05;
        this.radius = (1 - this.life) * this.maxRadius;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.save();
        const opacity = this.life * this.life;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, `hsla(60, 100%, 90%, ${opacity})`);
        grad.addColorStop(0.5, `hsla(48, 100%, 55%, ${opacity * 0.8})`);
        grad.addColorStop(1, `hsla(30, 100%, 50%, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class SkyLightning {
    x: number; y: number;
    segments: { x: number; y: number }[];
    life: number = 1.0;
    private themeColors: { [key: string]: string };
    
    constructor(startX: number, endY: number, themeColors: { [key: string]: string }) {
        this.x = startX; this.y = endY; this.themeColors = themeColors;
        this.segments = [{ x: startX, y: 0 }];
        let currentY = 0, currentX = startX;
        while(currentY < endY) {
            const nextY = currentY + Math.random() * 30 + 10;
            const nextX = currentX + (Math.random() - 0.5) * 30;
            this.segments.push({x: nextX, y: nextY});
            currentY = nextY; currentX = nextX;
        }
        this.segments.push({x: currentX, y: endY});
    }

    update() { this.life -= 0.08; }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life > 0.5 ? 1 : this.life * 2;
        ctx.lineWidth = 3; ctx.strokeStyle = 'white';
        ctx.shadowBlur = 20; ctx.shadowColor = this.themeColors.primary;
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for(let i=1; i < this.segments.length; i++) ctx.lineTo(this.segments[i].x, this.segments[i].y);
        ctx.stroke();
        ctx.restore();
    }
}

class ImpactCrater {
    x: number; y: number;
    radius: number = 0;
    maxRadius: number;
    life: number = 1.0;

    constructor(x: number, y: number, maxRadius: number) {
        this.x = x; this.y = y; this.maxRadius = maxRadius;
    }

    update() {
        this.life -= 0.04;
        this.radius = (1 - (this.life * this.life)) * this.maxRadius;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        const opacity = this.life * this.life;
        ctx.strokeStyle = `hsla(60, 100%, 80%, ${opacity * 0.8})`;
        ctx.lineWidth = 3 * this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class TornadoStormAnimation extends Animation {
    private particles: GroundDebris[] = [];
    private robots: RobotDebris[] = [];
    private laserBolts: LaserBolt[] = [];
    private explosions: Explosion[] = [];
    private lightning: SkyLightning[] = [];
    private impacts: ImpactCrater[] = [];
    private eyeState = { y: 0, radius: 0, pulse: 0 };
    private cameraShake = { x: 0, y: 0, intensity: 0 };
    private rageFlash: number = 0;
    
    init() {
        this.particles = []; this.robots = []; this.laserBolts = []; this.explosions = []; this.lightning = []; this.impacts = [];
        const particleCount = this.canvas.width < 768 ? 100 : 200;
        for (let i = 0; i < particleCount; i++) this.particles.push(new GroundDebris(this.canvas.width, this.canvas.height));
        const robotCount = this.canvas.width < 768 ? 8 : 15;
        for (let i = 0; i < robotCount; i++) this.robots.push(new RobotDebris(this.canvas.width, this.canvas.height, this.themeColors));
    }
    
    private triggerStrike() {
        const strikeX = this.canvas.width * (0.1 + Math.random() * 0.8);
        const strikeY = this.canvas.height * (0.6 + Math.random() * 0.3);
        this.lightning.push(new SkyLightning(strikeX, strikeY, this.themeColors));
        this.impacts.push(new ImpactCrater(strikeX, strikeY, 150));
        this.cameraShake.intensity = 15; this.rageFlash = 0.4;
    }

    private addLaserBolt = (from: RobotDebris, to: RobotDebris) => this.laserBolts.push(new LaserBolt(from, to));
    private addExplosion = (x: number, y: number, hitRobot: RobotDebris) => {
        this.explosions.push(new Explosion(x, y));
        hitRobot.takeDamage();
    };

    private drawGroundGrid(ctx: CanvasRenderingContext2D, horizonY: number, perspective: number) {
        ctx.strokeStyle = "hsla(220, 100%, 65%, 0.1)"; ctx.lineWidth = 1;
        for (let i = 0; i <= 20; i++) {
            const y = horizonY + Math.pow(i / 20, 2) * (this.canvas.height - horizonY);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke();
        }
        for (let i = -10; i <= 10; i++) {
            const x1 = this.canvas.width / 2 + i * 20; const x2 = this.canvas.width / 2 + (i * 20) * perspective;
            ctx.beginPath(); ctx.moveTo(x1, horizonY); ctx.lineTo(x2, this.canvas.height); ctx.stroke();
        }
    }
    
    animate(timestamp: number) {
        if (Math.random() > 0.985 && this.lightning.length < 3) this.triggerStrike();

        this.particles.forEach(p => p.update(this.canvas.width / 2, this.canvas.height));
        this.particles = this.particles.filter(p => p.life > 0);
        if(this.particles.length < 200) this.particles.push(new GroundDebris(this.canvas.width, this.canvas.height));

        const aliveRobots = this.robots.filter(r => r.life > 0);
        aliveRobots.forEach(robot => {
            const potentialTargets = aliveRobots.filter(r => r !== robot);
            robot.update(this.canvas.width / 2, this.canvas.height, potentialTargets, this.addLaserBolt);
        });
        this.robots = this.robots.filter(r => r.life > 0);
        if (this.robots.length < (this.canvas.width < 768 ? 8 : 15)) this.robots.push(new RobotDebris(this.canvas.width, this.canvas.height, this.themeColors));

        this.laserBolts = this.laserBolts.filter(bolt => {
            if (bolt.update()) { 
                this.addExplosion(bolt.to.x, bolt.to.y, bolt.to); 
                return false; 
            }
            return true;
        });
        
        this.explosions.forEach(e => e.update()); this.explosions = this.explosions.filter(e => e.life > 0);
        this.lightning.forEach(l => l.update()); this.lightning = this.lightning.filter(l => l.life > 0);
        this.impacts.forEach(i => i.update()); this.impacts = this.impacts.filter(i => i.life > 0);

        if (this.cameraShake.intensity > 0) {
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        }
        if (this.rageFlash > 0) this.rageFlash -= 0.02;
        
        this.ctx.save();
        this.ctx.translate(this.cameraShake.x, this.cameraShake.y);
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(-this.cameraShake.intensity, -this.cameraShake.intensity, this.canvas.width + this.cameraShake.intensity * 2, this.canvas.height + this.cameraShake.intensity * 2);
        if (this.rageFlash > 0) {
            this.ctx.fillStyle = `hsla(0, 100%, 50%, ${this.rageFlash})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.drawGroundGrid(this.ctx, this.canvas.height * 0.6, 2);
        this.impacts.forEach(i => i.draw(this.ctx));
        
        this.ctx.globalCompositeOperation = 'lighter';
        const allDebris = [...this.particles, ...this.robots].sort((a, b) => a.z - b.z);
        allDebris.forEach(d => d.draw(this.ctx));
        this.laserBolts.forEach(b => b.draw(this.ctx));
        this.explosions.forEach(e => e.draw(this.ctx));

        this.eyeState = { y: this.canvas.height * 0.4, radius: this.canvas.width * 0.05 + Math.sin(timestamp * 0.005) * 5, pulse: timestamp * 0.005 };
        const eyeGrad = this.ctx.createRadialGradient(this.canvas.width / 2, this.eyeState.y, 0, this.canvas.width / 2, this.eyeState.y, this.eyeState.radius);
        eyeGrad.addColorStop(0, 'hsla(0, 100%, 50%, 0.8)');
        eyeGrad.addColorStop(1, 'hsla(0, 100%, 50%, 0)');
        this.ctx.fillStyle = eyeGrad; this.ctx.beginPath(); this.ctx.arc(this.canvas.width / 2, this.eyeState.y, this.eyeState.radius, 0, Math.PI * 2); this.ctx.fill();
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.lightning.forEach(l => l.draw(this.ctx));
        this.ctx.restore();
    }
}


const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ animationType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to its parent container
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    if (animationRef.current) {
      animationRef.current.stop();
    }

    switch (animationType) {
      case 'particles':
        animationRef.current = new ParticlePlexusAnimation(canvas, ctx);
        break;
      case 'lightning':
        animationRef.current = new ArcLightningAnimation(canvas, ctx);
        break;
      case 'matrix':
        animationRef.current = new MatrixAnimation(canvas, ctx);
        break;
      case 'circuits':
        animationRef.current = new CircuitsAnimation(canvas, ctx);
        break;
      case 'tornado':
        animationRef.current = new TornadoStormAnimation(canvas, ctx);
        break;
      default:
        animationRef.current = new ParticlePlexusAnimation(canvas, ctx);
    }
    
    animationRef.current.start();

    // Use ResizeObserver for more reliable parent-based resizing
    const resizeObserver = new ResizeObserver(() => {
        if (animationRef.current) {
            animationRef.current.resize();
        }
    });
    resizeObserver.observe(canvas.parentElement);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [animationType]);

  // The canvas is now absolutely positioned to fill its parent <main> element.
  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

export default BackgroundCanvas;