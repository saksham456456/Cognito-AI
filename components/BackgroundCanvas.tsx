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


// --- 5. CIRCUITS ---
class CircuitNode {
    x: number; y: number;
    constructor(x: number, y: number) { this.x = x; this.y = y; }
}

class CircuitPulse {
    from: CircuitNode; to: CircuitNode;
    progress: number = 0;
    speed: number;
    color: string;
    constructor(from: CircuitNode, to: CircuitNode, color: string) {
        this.from = from;
        this.to = to;
        this.speed = Math.random() * 0.01 + 0.005;
        this.color = color;
    }
    update() {
        this.progress += this.speed;
        return this.progress >= 1;
    }
    draw(ctx: CanvasRenderingContext2D) {
        const x = this.from.x + (this.to.x - this.from.x) * this.progress;
        const y = this.from.y + (this.to.y - this.from.y) * this.progress;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class CircuitsAnimation extends Animation {
    private nodes: CircuitNode[] = [];
    private pulses: CircuitPulse[] = [];
    private gridSize: number = 50;

    init() {
        this.nodes = [];
        const cols = Math.ceil(this.canvas.width / this.gridSize);
        const rows = Math.ceil(this.canvas.height / this.gridSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (Math.random() > 0.5) {
                    this.nodes.push(new CircuitNode(i * this.gridSize, j * this.gridSize));
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.pulses.length < 100 && Math.random() > 0.5 && this.nodes.length > 1) {
            const n1 = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            const n2 = this.nodes[Math.floor(Math.random() * this.nodes.length)];
            if (n1 !== n2) {
                const color = Math.random() > 0.2 ? this.themeColors.accent1 : this.themeColors.primary;
                this.pulses.push(new CircuitPulse(n1, n2, color));
            }
        }

        this.ctx.strokeStyle = 'hsla(220, 100%, 65%, 0.1)';
        this.ctx.lineWidth = 0.5;
        this.nodes.forEach(n1 => {
            this.nodes.forEach(n2 => {
                if (n1 === n2) return;
                const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                if (dist < this.gridSize * 1.5) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(n1.x, n1.y);
                    this.ctx.lineTo(n2.x, n2.y);
                    this.ctx.stroke();
                }
            });
        });

        this.pulses = this.pulses.filter(p => !p.update());
        this.pulses.forEach(p => p.draw(this.ctx));
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

// --- 7. TORNADO STORM (TERRIFYING EDITION) ---

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
        this.vy += -2.5; // Updraft
        
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

// Represents a lightning strike from the sky to the ground
class SkyLightning {
    x: number; y: number;
    segments: { x: number; y: number }[];
    life: number = 1.0;
    impacted: boolean = false;
    // FIX: Add themeColors property to hold theme colors.
    private themeColors: { [key: string]: string };
    
    constructor(startX: number, endY: number, themeColors: { [key: string]: string }) {
        this.x = startX;
        this.y = endY;
        // FIX: Store themeColors passed from the animation class.
        this.themeColors = themeColors;
        this.segments = [{ x: startX, y: 0 }];
        
        let currentY = 0;
        let currentX = startX;
        while(currentY < endY) {
            const nextY = currentY + Math.random() * 30 + 10;
            const nextX = currentX + (Math.random() - 0.5) * 30;
            this.segments.push({x: nextX, y: nextY});
            currentY = nextY;
            currentX = nextX;
        }
        this.segments.push({x: currentX, y: endY});
    }

    update() { this.life -= 0.08; }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life > 0.5 ? 1 : this.life * 2;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'white';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.themeColors.primary;
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for(let i=1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

// Represents the shockwave on the ground after an impact
class ImpactCrater {
    x: number; y: number;
    radius: number = 0;
    maxRadius: number;
    life: number = 1.0;

    constructor(x: number, y: number, maxRadius: number) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
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
    private lightning: SkyLightning[] = [];
    private impacts: ImpactCrater[] = [];
    private eyeState = { y: 0, radius: 0, pulse: 0 };
    private cameraShake = { x: 0, y: 0, intensity: 0 };
    private rageFlash: number = 0;
    
    init() {
        this.particles = [];
        this.lightning = [];
        this.impacts = [];
        
        const particleCount = this.canvas.width < 768 ? 100 : 200;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new GroundDebris(this.canvas.width, this.canvas.height));
        }
    }
    
    private triggerStrike() {
        const strikeX = this.canvas.width * (0.1 + Math.random() * 0.8);
        const strikeY = this.canvas.height * (0.6 + Math.random() * 0.3);
        // FIX: Pass this.themeColors to the SkyLightning constructor.
        this.lightning.push(new SkyLightning(strikeX, strikeY, this.themeColors));
        this.impacts.push(new ImpactCrater(strikeX, strikeY, 150));
        this.cameraShake.intensity = 15;
        this.rageFlash = 0.4;
    }

    private drawGroundGrid(ctx: CanvasRenderingContext2D, horizonY: number, perspective: number) {
        ctx.strokeStyle = "hsla(220, 100%, 65%, 0.1)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 20; i++) {
            const y = horizonY + Math.pow(i / 20, 2) * (this.canvas.height - horizonY);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        for (let i = -10; i <= 10; i++) {
            const x1 = this.canvas.width / 2 + i * 20;
            const x2 = this.canvas.width / 2 + (i * 20) * perspective;
            ctx.beginPath();
            ctx.moveTo(x1, horizonY);
            ctx.lineTo(x2, this.canvas.height);
            ctx.stroke();
        }
    }
    
    animate(timestamp: number) {
        // --- UPDATE ---
        this.eyeState.pulse = timestamp * 0.005;

        if (Math.random() > 0.985 && this.lightning.length < 3) {
            this.triggerStrike();
        }

        this.particles.forEach(p => p.update(this.canvas.width / 2, this.canvas.height));
        this.particles = this.particles.filter(p => p.life > 0);
        if(this.particles.length < 200) {
             this.particles.push(new GroundDebris(this.canvas.width, this.canvas.height));
        }

        this.lightning.forEach(l => l.update());
        this.lightning = this.lightning.filter(l => l.life > 0);

        this.impacts.forEach(i => i.update());
        this.impacts = this.impacts.filter(i => i.life > 0);

        if (this.cameraShake.intensity > 0) {
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        }

        if (this.rageFlash > 0) {
            this.rageFlash -= 0.02;
        }
        
        // --- DRAW ---
        this.ctx.save();
        this.ctx.translate(this.cameraShake.x, this.cameraShake.y);

        // Background
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rage Flash
        if (this.rageFlash > 0) {
            this.ctx.fillStyle = `hsla(0, 100%, 50%, ${this.rageFlash})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Sky Fracture
        if (Math.random() > 0.95) {
            this.ctx.font = '12px "Roboto Mono", monospace';
            this.ctx.fillStyle = `hsla(220, 100%, 75%, ${Math.random() * 0.5})`;
            this.ctx.fillText(btoa(String(timestamp)), Math.random() * this.canvas.width, Math.random() * 50);
        }

        // Ground
        const horizonY = this.canvas.height * 0.6;
        this.drawGroundGrid(this.ctx, horizonY, 2);
        
        // Impacts
        this.impacts.forEach(i => i.draw(this.ctx));
        
        // Tornado
        this.ctx.globalCompositeOperation = 'lighter';
        this.particles.sort((a, b) => a.z - b.z);
        this.particles.forEach(p => p.draw(this.ctx));
        
        // Eye of the Storm
        this.eyeState.y = this.canvas.height * 0.4;
        this.eyeState.radius = this.canvas.width * 0.05 + Math.sin(this.eyeState.pulse) * 5;
        const eyeGrad = this.ctx.createRadialGradient(this.canvas.width / 2, this.eyeState.y, 0, this.canvas.width / 2, this.eyeState.y, this.eyeState.radius);
        eyeGrad.addColorStop(0, 'hsla(0, 100%, 50%, 0.8)');
        eyeGrad.addColorStop(0.5, 'hsla(0, 100%, 50%, 0.3)');
        eyeGrad.addColorStop(1, 'hsla(0, 100%, 50%, 0)');
        this.ctx.fillStyle = eyeGrad;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.eyeState.y, this.eyeState.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'hsla(0, 100%, 20%, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.eyeState.y, this.eyeState.radius * 0.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
        
        // Lightning
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