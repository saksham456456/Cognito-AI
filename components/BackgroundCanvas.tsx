
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


// --- 2. ARC LIGHTNING --- (OPTIMIZED WITH OBJECT POOLING)
class LightningBolt {
    segments: { x: number, y: number }[] = [];
    life: number = 1.0;
    color: string = '';
    lineWidth: number = 1;
    children: LightningBolt[] = [];
    intensity: number = 1.0;
    isBranch: boolean = false;

    reset(x: number, y: number, endY: number, color: string, isBranch: boolean = false, particleCallback: (x: number, y: number, color: string) => void, intensity: number = 1.0) {
        this.segments.length = 0;
        this.children.length = 0;
        this.life = 1.0;
        this.color = color;
        this.isBranch = isBranch;
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
            lastSeg = newSeg;
        }
        return this;
    }

    update() {
        this.life -= 0.04 / (1 + (this.intensity - 1) * 0.2);
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

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowBlur = 15 * this.intensity;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.8)';
        ctx.lineWidth = this.lineWidth * 0.5;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        ctx.restore();
    }
}

class EnergizedParticle {
    x: number = 0; y: number = 0;
    vx: number = 0; vy: number = 0;
    life: number = 1.0;
    size: number = 1;
    color: string = '';

    reset(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = color;
        this.life = 1.0;
        return this;
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
    private boltPool: { active: LightningBolt[], inactive: LightningBolt[] } = { active: [], inactive: [] };
    private particlePool: { active: EnergizedParticle[], inactive: EnergizedParticle[] } = { active: [], inactive: [] };
    private spawnCooldown: number = 0;
    private flashOpacity: number = 0;
    private sheetOpacity: number = 0;
    private sheetCooldown: number = 0;
    private glitchTimeoutId: number | null = null;
    private needsInitialBlast: boolean = false;

    init() { 
        this.boltPool = { active: [], inactive: [] };
        for(let i=0; i<50; i++) this.boltPool.inactive.push(new LightningBolt());
        
        this.particlePool = { active: [], inactive: [] };
        for(let i=0; i<200; i++) this.particlePool.inactive.push(new EnergizedParticle());
        
        this.lastTimestamp = performance.now();
        this.needsInitialBlast = true;
    }

    private triggerGlitchEffect(duration: number) {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            if (this.glitchTimeoutId) clearTimeout(this.glitchTimeoutId);
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
            if (this.boltPool.inactive.length > 0) {
                const intensity = Math.random() * 0.8 + 1.2;
                const startX = Math.random() * this.canvas.width;
                const endY = this.canvas.height;
                const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
                const bolt = this.boltPool.inactive.pop()!.reset(startX, 0, endY, color, false, this.addParticle, intensity);
                this.boltPool.active.push(bolt);
            }
        }
        this.flashOpacity = 0.8;
        this.triggerGlitchEffect(500);
        this.spawnCooldown = Math.random() * 2000 + 4000;
    }

    addParticle = (x: number, y: number, color: string) => {
        const count = Math.floor(Math.random() * 5 + 3);
        for(let i=0; i < count; i++) {
            if (this.particlePool.inactive.length > 0) {
                const p = this.particlePool.inactive.pop()!.reset(x, y, color);
                this.particlePool.active.push(p);
            }
        }
    }

    animate(timestamp: number) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        if (this.needsInitialBlast) {
            this.executeInitialBlast();
            this.needsInitialBlast = false;
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

        if (this.flashOpacity > 0) {
            this.ctx.fillStyle = `rgba(200, 220, 255, ${this.flashOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.flashOpacity = Math.max(0, this.flashOpacity - 0.1);
        }

        this.spawnCooldown -= delta;
        if (this.spawnCooldown <= 0 && this.boltPool.inactive.length > 0) {
            const screenArea = this.canvas.width * this.canvas.height;
            const baseArea = 1280 * 720;
            const performanceFactor = Math.max(1, screenArea / baseArea);
            this.spawnCooldown = Math.random() * (3000 - 800) * performanceFactor + (800 * performanceFactor);
            
            const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
            const startX = Math.random() * this.canvas.width;
            const endY = this.canvas.height;
            const intensity = Math.random() * 1.0 + 0.5;
            
            const bolt = this.boltPool.inactive.pop()!.reset(startX, 0, endY, color, false, this.addParticle, intensity);
            this.boltPool.active.push(bolt);
            
            this.flashOpacity = Math.min(0.8, (Math.random() * 0.3 + 0.3) * intensity);
            this.triggerGlitchEffect(300);
        }
        
        this.ctx.globalCompositeOperation = 'lighter';
        
        for(let i = this.boltPool.active.length - 1; i >= 0; i--) {
            const b = this.boltPool.active[i];
            b.update();
            b.draw(this.ctx);
            if (b.life <= 0) {
                this.boltPool.inactive.push(b);
                this.boltPool.active.splice(i, 1);
            }
        }
        
        for(let i = this.particlePool.active.length - 1; i >= 0; i--) {
            const p = this.particlePool.active[i];
            p.update();
            p.draw(this.ctx);
            if (p.life <= 0) {
                this.particlePool.inactive.push(p);
                this.particlePool.active.splice(i, 1);
            }
        }

        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.globalCompositeOperation = 'source-over';
    }
}

// --- NEW: DATA STORM ANIMATION ---
class DataStormParticle {
    x: number;
    y: number;
    z: number; // For parallax effect
    vx: number;
    vy: number;
    color: string;
    size: number;
    history: { x: number, y: number }[] = [];
    trailLength: number = 5;

    constructor(width: number, height: number, color: string) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random(); // 0 (far) to 1 (close)
        
        // Speed is based on z-index
        const speed = this.z * 1.5 + 0.5;
        this.vx = speed;
        this.vy = speed / 2; // Move diagonally
        
        this.color = color;
        this.size = this.z * 1.5 + 0.5;
    }

    update(width: number, height: number) {
        this.history.unshift({ x: this.x, y: this.y });
        if (this.history.length > this.trailLength) {
            this.history.pop();
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap around screen
        if (this.x > width + this.size) {
            this.x = -this.size;
            this.y = Math.random() * height;
        }
        if (this.y > height + this.size) {
            this.y = -this.size;
            this.x = Math.random() * width;
        }
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        // Draw trail
        this.history.forEach((p, index) => {
            const opacity = (1 - index / this.trailLength) * 0.5;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = opacity * this.z;
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.size * ((this.trailLength - index) / this.trailLength), 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw head
        ctx.globalAlpha = this.z * 0.8 + 0.2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class DataStormAnimation extends Animation {
    private particles: DataStormParticle[] = [];

    init() {
        this.particles = [];
        const numParticles = this.canvas.width < 768 ? 100 : 250;
        const colorPalette = [this.themeColors.primary, this.themeColors.accent1, this.themeColors.accent2];

        for (let i = 0; i < numParticles; i++) {
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            this.particles.push(new DataStormParticle(this.canvas.width, this.canvas.height, color));
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.15)'; // Fading effect
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Sort particles by z-index to draw far ones first
        this.particles.sort((a, b) => a.z - b.z);

        this.particles.forEach(p => {
            p.update(this.canvas.width, this.canvas.height);
            p.draw(this.ctx);
        });
        
        this.ctx.globalAlpha = 1.0;
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
    x: number=0; y: number=0; z: number=0;
    vx: number=0; vy: number=0; vz: number=0;
    angle: number=0;
    rotation: number=0;
    rotationSpeed: number=0;
    size: number=0;
    life: number = 1;

    reset(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = height * (0.8 + Math.random() * 0.2);
        this.z = Math.random();
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.size = (1 + this.z) * 4;
        this.life = 1;
        return this;
    }

    update(centerX: number, height: number) {
        const climb = this.y / height;
        const funnelRadius = (1 - climb) * (centerX * 0.3);
        const targetX = centerX + Math.cos(this.angle) * funnelRadius;
        
        this.vx += (targetX - this.x) * 0.005;
        this.vy += -0.5;
        
        this.vx *= 0.95;
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
    x: number=0; y: number=0; z: number=0;
    vx: number=0; vy: number=0; vz: number=0;
    angle: number=0;
    rotation: number=0;
    rotationSpeed: number=0;
    size: number=0;
    life: number = 1;
    isDamaged: boolean=false;
    weaponCharge: number=0;
    target: RobotDebris | null = null;
    fireCooldown: number=0;
    weaponState: WeaponState = WeaponState.IDLE;
    chargeTime: number = 0;
    maxChargeTime: number = 20;
    private themeColors: { [key: string]: string };

    constructor(themeColors: { [key: string]: string }) {
        this.themeColors = themeColors;
    }
    
    reset(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = height * (0.8 + Math.random() * 0.2);
        this.z = Math.random();
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.size = (1 + this.z) * 6;
        this.life = 1;
        this.isDamaged = false;
        this.weaponCharge = 0;
        this.target = null;
        this.fireCooldown = Math.random() * 60 + 30;
        this.weaponState = WeaponState.IDLE;
        this.chargeTime = 0;
        return this;
    }

    takeDamage() {
        this.isDamaged = true;
        this.life -= 0.5;
    }

    update(centerX: number, height: number, otherRobots: RobotDebris[], createLaserBolt: (from: RobotDebris, to: RobotDebris) => void) {
        const climb = this.y / height;
        const funnelRadius = (1 - climb) * (centerX * 0.3);
        const targetX = centerX + Math.cos(this.angle) * funnelRadius;
        
        this.vx += (targetX - this.x) * 0.004;
        this.vy += -0.5;
        
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
    x: number=0; y: number=0;
    from: RobotDebris | null = null;
    to: RobotDebris | null = null;
    speed: number = 25;
    length: number = 20;
    vx: number=0; vy: number=0;
    life: number = 1;

    reset(from: RobotDebris, to: RobotDebris) {
        this.from = from;
        this.to = to;
        this.x = from.x;
        this.y = from.y;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.life = 1;
        return this;
    }

    update(): boolean {
        this.x += this.vx; this.y += this.vy;
        if (!this.to) {
            this.life = 0;
            return false;
        }
        const hasHit = Math.hypot(this.x - this.to.x, this.y - this.to.y) < this.speed;
        if(hasHit) this.life = 0;
        return hasHit;
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
    x: number=0; y: number=0;
    radius: number = 0;
    maxRadius: number = 30;
    life: number = 1.0;
    
    reset(x: number, y: number) { this.x = x; this.y = y; this.life = 1.0; this.radius = 0; return this; }

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

// --- NEW: FORKING LIGHTNING BOLT FOR TORNADO ---
class TornadoLightningBolt {
    segments: { x: number, y: number }[] = [];
    life: number = 1.0;
    color: string = '';
    lineWidth: number = 1;
    intensity: number = 1.0;

    reset(x: number, y: number, endY: number, color: string, intensity: number = 1.0, isBranch = false, getBolt: () => TornadoLightningBolt | undefined): TornadoLightningBolt[] {
        this.segments.length = 0;
        this.life = 1.0;
        this.color = color;
        this.intensity = intensity;
        this.lineWidth = (Math.random() * 1.5 + 0.5) * this.intensity;
        const allNewChildren: TornadoLightningBolt[] = [];
        
        let lastSeg = { x, y };
        this.segments.push(lastSeg);

        while(lastSeg.y < endY) {
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.9;
            const segLength = Math.random() * 20 + 10;
            
            let newX = lastSeg.x + Math.cos(angle) * segLength;
            let newY = lastSeg.y + Math.sin(angle) * segLength;
            newX += (Math.random() - 0.5) * 25;

            const newSeg = { x: newX, y: newY };
            this.segments.push(newSeg);
            lastSeg = newSeg;
            
            // Forking logic
            if (!isBranch && this.segments.length > 4 && Math.random() > 0.96) {
                const branch = getBolt();
                if (branch) {
                    const grandChildren = branch.reset(newSeg.x, newSeg.y, endY, this.color, this.intensity * 0.7, true, getBolt);
                    allNewChildren.push(branch, ...grandChildren);
                }
            }
        }
        return allNewChildren;
    }

    update() {
        this.life -= 0.05;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        const alpha = Math.min(1.0, Math.pow(this.life, 1.5) * this.intensity);
        if (alpha <= 0) return;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowBlur = 15 * this.intensity;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.8)';
        ctx.lineWidth = this.lineWidth * 0.5;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        ctx.restore();
    }
}

class GroundFlash {
    x: number=0; y: number=0;
    radius: number = 0; maxRadius: number = 50;
    life: number = 1.0; color: string = '';
    
    reset(x: number, y: number, color: string, maxRadius: number) {
        this.x = x; this.y = y; this.color = color;
        this.maxRadius = maxRadius;
        this.life = 1.0; this.radius = 0;
        return this;
    }

    update() { this.life -= 0.06; this.radius = (1 - (this.life * this.life)) * this.maxRadius; }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.save();
        const opacity = this.life * this.life;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, `${this.color.slice(0, -1)}, ${opacity})`);
        grad.addColorStop(0.8, `${this.color.slice(0, -1)}, ${opacity * 0.2})`);
        grad.addColorStop(1, `${this.color.slice(0, -1)}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class TornadoStormAnimation extends Animation {
    private debrisPool = { active: [] as GroundDebris[], inactive: [] as GroundDebris[] };
    private robotPool = { active: [] as RobotDebris[], inactive: [] as RobotDebris[] };
    private laserPool = { active: [] as LaserBolt[], inactive: [] as LaserBolt[] };
    private explosionPool = { active: [] as Explosion[], inactive: [] as Explosion[] };
    private rageBoltPool = { active: [] as TornadoLightningBolt[], inactive: [] as TornadoLightningBolt[] };
    private groundFlashPool = { active: [] as GroundFlash[], inactive: [] as GroundFlash[] };
    
    private eyeState = { y: 0, radius: 0, pulse: 0 };
    private cameraShake = { x: 0, y: 0, intensity: 0 };
    private flash: { opacity: number, color: string } = { opacity: 0, color: 'white' };
    private rageCooldown: number = 0;
    
    init() {
        this.debrisPool = { active: [], inactive: [] };
        this.robotPool = { active: [], inactive: [] };
        this.laserPool = { active: [], inactive: [] };
        this.explosionPool = { active: [], inactive: [] };
        this.rageBoltPool = { active: [], inactive: [] };
        this.groundFlashPool = { active: [], inactive: [] };

        const debrisCount = this.canvas.width < 768 ? 100 : 200;
        for (let i = 0; i < debrisCount; i++) this.debrisPool.inactive.push(new GroundDebris());
        
        const robotCount = this.canvas.width < 768 ? 8 : 15;
        for (let i = 0; i < robotCount; i++) this.robotPool.inactive.push(new RobotDebris(this.themeColors));
        
        for (let i=0; i<50; i++) this.laserPool.inactive.push(new LaserBolt());
        for (let i=0; i<30; i++) this.explosionPool.inactive.push(new Explosion());
        for (let i = 0; i < 50; i++) this.rageBoltPool.inactive.push(new TornadoLightningBolt()); // Increased pool for forks
        for (let i=0; i<20; i++) this.groundFlashPool.inactive.push(new GroundFlash());

        this.rageCooldown = 200; // Start with a cooldown
    }

    private addLaserBolt = (from: RobotDebris, to: RobotDebris) => {
        if (this.laserPool.inactive.length > 0) {
            const bolt = this.laserPool.inactive.pop()!.reset(from, to);
            this.laserPool.active.push(bolt);
        }
    };
    
    private addExplosion = (x: number, y: number, hitRobot: RobotDebris) => {
        if (this.explosionPool.inactive.length > 0) {
            const exp = this.explosionPool.inactive.pop()!.reset(x, y);
            this.explosionPool.active.push(exp);
        }
        hitRobot.takeDamage();
    };

    private addGroundFlash = (x: number, y: number, color: string, intensity: number) => {
        if (this.groundFlashPool.inactive.length > 0) {
            const flash = this.groundFlashPool.inactive.pop()!.reset(x, y, color, 80 * intensity);
            this.groundFlashPool.active.push(flash);
        }
    }

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
        this.rageCooldown--;
        if (this.rageCooldown <= 0) {
            const colorPalette = ['hsl(0, 100%, 60%)', 'hsl(0, 100%, 60%)', 'hsl(0, 100%, 60%)', this.themeColors.primary, this.themeColors.accent1];
            const strikeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

            this.flash = { opacity: 0.8, color: strikeColor };
            this.cameraShake.intensity = 15;
            this.rageCooldown = Math.random() * 300 + 240;

            const numBolts = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numBolts; i++) {
                const getBolt = () => this.rageBoltPool.inactive.pop();
                const mainBolt = getBolt();
                if (mainBolt) {
                    const startX = Math.random() * this.canvas.width;
                    const endY = this.canvas.height * (0.7 + Math.random() * 0.3);
                    const intensity = Math.random() * 0.5 + 0.8;
                    const allNewBolts = mainBolt.reset(startX, 0, endY, strikeColor, intensity, false, getBolt);
                    this.rageBoltPool.active.push(mainBolt, ...allNewBolts);
                    
                    const lastSeg = mainBolt.segments[mainBolt.segments.length - 1];
                    if (lastSeg && lastSeg.y > this.canvas.height * 0.55) {
                        this.addGroundFlash(lastSeg.x, lastSeg.y, strikeColor, intensity);
                    }
                }
            }
        }
        
        if (this.flash.opacity > 0) this.flash.opacity -= 0.05;

        if (this.cameraShake.intensity > 0) {
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        } else { this.cameraShake.x = 0; this.cameraShake.y = 0; }

        const maxDebris = this.canvas.width < 768 ? 100 : 200;
        while(this.debrisPool.active.length < maxDebris && this.debrisPool.inactive.length > 0) {
            this.debrisPool.active.push(this.debrisPool.inactive.pop()!.reset(this.canvas.width, this.canvas.height));
        }

        const maxRobots = this.canvas.width < 768 ? 8 : 15;
        while(this.robotPool.active.length < maxRobots && this.robotPool.inactive.length > 0) {
            this.robotPool.active.push(this.robotPool.inactive.pop()!.reset(this.canvas.width, this.canvas.height));
        }

        [this.debrisPool, this.robotPool, this.laserPool, this.explosionPool, this.rageBoltPool, this.groundFlashPool].forEach(pool => {
            for(let i = pool.active.length - 1; i >= 0; i--) {
                const p = pool.active[i] as any;
                if (p.constructor.name === 'RobotDebris') {
                    const potentialTargets = this.robotPool.active.filter(robot => robot !== p);
                    p.update(this.canvas.width / 2, this.canvas.height, potentialTargets, this.addLaserBolt);
                } else if (p.constructor.name === 'LaserBolt') {
                    if (p.update()) if (p.to) this.addExplosion(p.to.x, p.to.y, p.to);
                } else if(p.constructor.name === 'GroundDebris') {
                    p.update(this.canvas.width / 2, this.canvas.height);
                } else {
                    p.update();
                }

                if (p.life <= 0) {
                    if (p.constructor.name === 'RobotDebris') this.addExplosion(p.x, p.y, p);
                    (pool.inactive as any[]).push(p);
                    pool.active.splice(i, 1);
                }
            }
        });

        // Drawing
        this.ctx.save();
        this.ctx.translate(this.cameraShake.x, this.cameraShake.y);
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
        if (this.flash.opacity > 0) {
            this.ctx.fillStyle = this.flash.color.startsWith('hsl') ? `hsla(${this.flash.color.match(/\d+/g)!.join(',')}, ${this.flash.opacity * 0.5})` : `${this.flash.color.slice(0,-1)}, ${this.flash.opacity * 0.5})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.drawGroundGrid(this.ctx, this.canvas.height * 0.6, 2);
        
        this.ctx.globalCompositeOperation = 'lighter';
        
        this.rageBoltPool.active.forEach(b => b.draw(this.ctx));

        const allDebris = [...this.debrisPool.active, ...this.robotPool.active].sort((a, b) => a.z - b.z);
        allDebris.forEach(d => d.draw(this.ctx));
        this.laserPool.active.forEach(b => b.draw(this.ctx));
        this.explosionPool.active.forEach(e => e.draw(this.ctx));
        this.groundFlashPool.active.forEach(f => f.draw(this.ctx));

        this.eyeState = { y: this.canvas.height * 0.4, radius: this.canvas.width * 0.05 + Math.sin(timestamp * 0.005) * 5, pulse: timestamp * 0.005 };
        const eyeGrad = this.ctx.createRadialGradient(this.canvas.width / 2, this.eyeState.y, 0, this.canvas.width / 2, this.eyeState.y, this.eyeState.radius);
        eyeGrad.addColorStop(0, 'hsla(0, 100%, 50%, 0.8)');
        eyeGrad.addColorStop(1, 'hsla(0, 100%, 50%, 0)');
        this.ctx.fillStyle = eyeGrad; this.ctx.beginPath(); this.ctx.arc(this.canvas.width / 2, this.eyeState.y, this.eyeState.radius, 0, Math.PI * 2); this.ctx.fill();
        
        this.ctx.globalCompositeOperation = 'source-over';
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
        animationRef.current = new DataStormAnimation(canvas, ctx);
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
