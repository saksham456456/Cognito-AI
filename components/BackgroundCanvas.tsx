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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.getThemeColors();
    this.init(); // Re-initialize on resize
  }
}

// --- 1. Particle Plexus Animation ---
class OGParticle {
    x: number = 0; y: number = 0; size: number = 0;
    vx: number = 0; vy: number = 0;
    baseColor: string;
    currentColor: string;
    life: number = 0;
    maxLife: number = 0;

    constructor(canvasWidth: number, canvasHeight: number, color: string) {
        this.baseColor = color;
        this.currentColor = color;
        this.reset(canvasWidth, canvasHeight);
    }
    
    reset(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        // Life in frames (e.g., 5-10 seconds at 60fps)
        this.maxLife = Math.random() * 300 + 300; 
        this.life = this.maxLife;
        this.size = Math.random() * 2 + 1;
    }

    getOpacity(): number {
        const fadeInDuration = this.maxLife * 0.1;
        const fadeOutDuration = this.maxLife * 0.2;
        let opacity = 1;

        if (this.life > this.maxLife - fadeInDuration) {
            // Fading in
            opacity = (this.maxLife - this.life) / fadeInDuration;
        } else if (this.life < fadeOutDuration) {
            // Fading out
            opacity = this.life / fadeOutDuration;
        }
        return opacity;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const opacity = this.getOpacity();
        if (opacity <= 0) return;

        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.currentColor;
        ctx.shadowColor = this.currentColor;
        ctx.shadowBlur = this.size * 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1; // Reset global alpha
    }
    
    update(mouse: {x:number, y:number, radius:number}, canvasWidth: number, canvasHeight: number) {
        this.life--;
        if (this.life <= 0) {
            this.reset(canvasWidth, canvasHeight);
        }

        // --- Mouse interaction force ---
        const dxMouse = mouse.x - this.x;
        const dyMouse = mouse.y - this.y;
        const distanceMouse = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
        
        if (distanceMouse < mouse.radius) {
            const force = (mouse.radius - distanceMouse) / mouse.radius;
            // Repel from mouse
            this.vx -= dxMouse / distanceMouse * force * 0.5;
            this.vy -= dyMouse / distanceMouse * force * 0.5;
            this.currentColor = 'hsl(50, 100%, 95%)';
        } else {
            this.currentColor = this.baseColor;
        }
        
        // --- Damping ---
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // --- Update position ---
        this.x += this.vx;
        this.y += this.vy;

        // --- Screen wrapping ---
        if (this.x > canvasWidth + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = canvasWidth + this.size;
        if (this.y > canvasHeight + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = canvasHeight + this.size;
    }
}

class ParticlePlexusAnimation extends Animation {
    private particles: OGParticle[] = [];
    private mouse = { x: -200, y: -200, radius: 150 };

    init() {
        this.particles = [];
        const numberOfParticles = (this.canvas.height * this.canvas.width) / 12000;
        for (let i = 0; i < numberOfParticles; i++) {
            const color = `hsla(48, 100%, 55%, 0.8)`;
            this.particles.push(new OGParticle(this.canvas.width, this.canvas.height, color));
        }
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseout', this.handleMouseOut);
    }
    
    handleMouseMove = (event: MouseEvent) => {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }
    
    handleMouseOut = () => {
        this.mouse.x = -200;
        this.mouse.y = -200;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.update(this.mouse, this.canvas.width, this.canvas.height);
            p.draw(this.ctx);
        });
        
        this.connectParticles();
    }
    
    connectParticles() {
        const maxDistance = 130;
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a + 1; b < this.particles.length; b++) {
                const p1 = this.particles[a];
                const p2 = this.particles[b];
                const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

                if (distance < maxDistance) {
                    const baseOpacity = 1 - (distance / maxDistance);
                    const finalOpacity = baseOpacity * p1.getOpacity() * p2.getOpacity();

                    if (finalOpacity <= 0) continue;
                    
                    const proximity = 1 - (distance / maxDistance);
                    const hue = 220 - (172 * proximity * proximity);
                    const color = `hsla(${hue}, 100%, 65%, ${finalOpacity})`;
                    const lineWidth = 0.5 + proximity;
                    
                    const dxMouseA = this.mouse.x - p1.x;
                    const dyMouseA = this.mouse.y - p1.y;
                    const distMouseA = Math.sqrt(dxMouseA * dxMouseA + dyMouseA * dyMouseA);
                    
                    const dxMouseB = this.mouse.x - p2.x;
                    const dyMouseB = this.mouse.y - p2.y;
                    const distMouseB = Math.sqrt(dxMouseB * dxMouseB + dyMouseB * dyMouseB);

                    let glowAmount = (distMouseA < this.mouse.radius || distMouseB < this.mouse.radius) ? 8 : 0;
                    
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.shadowColor = color;
                    this.ctx.shadowBlur = glowAmount * finalOpacity;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }

    stop() {
        super.stop();
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseout', this.handleMouseOut);
    }
}
// --- 2. SAKSHAM Matrix Animation ---
class MatrixAnimation extends Animation {
    private fontSize = 16;
    private columns = 0;
    private drops: number[] = [];
    private charIndices: number[] = [];
    private readonly word = 'SAKSHAM';

    init() {
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = [];
        this.charIndices = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = 1;
            this.charIndices[i] = Math.floor(Math.random() * this.word.length);
        }
    }

    animate(timestamp: number) {
        if (timestamp - this.lastTimestamp < 80) {
            return;
        }
        this.lastTimestamp = timestamp;
        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.themeColors.primary;
        this.ctx.font = `${this.fontSize}px "Roboto Mono", monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.word[this.charIndices[i]];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;
            this.ctx.fillText(text, x, y);
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
            this.charIndices[i] = (this.charIndices[i] + 1) % this.word.length;
        }
    }
}

// --- 3. Hexagons Animation ---
class HexPulse {
    x: number; y: number; life: number; maxRadius: number; speed: number; currentRadius: number;
    constructor(x: number, y: number) {
        this.x = x; this.y = y; this.life = 1; this.maxRadius = Math.random() * 300 + 200; this.speed = Math.random() * 1.5 + 1; this.currentRadius = 0;
    }
    update() { this.currentRadius += this.speed; if (this.currentRadius > this.maxRadius) { this.life -= 0.05; } }
    isDead(): boolean { return this.life <= 0; }
}
class HexagonsAnimation extends Animation {
    private hexSize = 30; private hexes: {x: number, y: number}[] = []; private pulses: HexPulse[] = [];
    private offscreenCanvas: HTMLCanvasElement; private offscreenCtx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        super(canvas, ctx); this.offscreenCanvas = document.createElement('canvas'); this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    }
    init() {
        this.offscreenCanvas.width = this.canvas.width; this.offscreenCanvas.height = this.canvas.height;
        this.hexes = []; this.pulses = []; const hexHeight = Math.sqrt(3) * this.hexSize; const hexWidth = 2 * this.hexSize;
        const cols = Math.ceil(this.canvas.width / (hexWidth * 0.75)) + 1; const rows = Math.ceil(this.canvas.height / hexHeight) + 1;
        for (let row = 0; row < rows; row++) { for (let col = 0; col < cols; col++) {
            const x = col * hexWidth * 0.75; const y = row * hexHeight + (col % 2) * (hexHeight / 2); this.hexes.push({ x, y });
        } } this.drawBaseGrid();
    }
    drawBaseGrid() {
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        this.offscreenCtx.lineWidth = 0.5; this.offscreenCtx.strokeStyle = `hsla(220, 100%, 65%, 0.1)`; const angle = (2 * Math.PI) / 6;
        this.hexes.forEach(hex => {
            this.offscreenCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                const x_ = hex.x + this.hexSize * Math.cos(angle * i); const y_ = hex.y + this.hexSize * Math.sin(angle * i);
                if (i === 0) this.offscreenCtx.moveTo(x_, y_); else this.offscreenCtx.lineTo(x_, y_);
            } this.offscreenCtx.closePath(); this.offscreenCtx.stroke();
        });
    }
    drawHex(ctx: CanvasRenderingContext2D, hex: {x: number, y: number}, color: string, lineWidth: number) {
        const angle = (2 * Math.PI) / 6; ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const x_ = hex.x + this.hexSize * Math.cos(angle * i); const y_ = hex.y + this.hexSize * Math.sin(angle * i);
            if (i === 0) ctx.moveTo(x_, y_); else ctx.lineTo(x_, y_);
        } ctx.closePath(); ctx.stroke();
    }
    animate() {
        if (Math.random() > 0.98 && this.pulses.length < 5) {
            const startHex = this.hexes[Math.floor(Math.random() * this.hexes.length)]; if(startHex) this.pulses.push(new HexPulse(startHex.x, startHex.y));
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        this.pulses.forEach(p => p.update()); this.pulses = this.pulses.filter(p => !p.isDead());
        this.hexes.forEach(hex => {
            this.pulses.forEach(pulse => {
                const dx = hex.x - pulse.x; const dy = hex.y - pulse.y; const distance = Math.sqrt(dx * dx + dy * dy); const pulseWaveWidth = 80;
                if (distance > pulse.currentRadius - pulseWaveWidth && distance < pulse.currentRadius) {
                    const falloff = 1 - (pulse.currentRadius - distance) / pulseWaveWidth; const opacity = falloff * pulse.life;
                    const color = `hsla(48, 100%, 55%, ${opacity})`; this.drawHex(this.ctx, hex, color, 1.5);
                }
            });
        });
    }
}

// --- 4. Circuits Animation ---
class Pulse {
    path: {x: number, y: number}[]; x: number; y: number; targetIndex: number; speed: number; life: number; color: string; tail: {x: number, y: number}[];
    constructor(path: {x: number, y: number}[], color: string) {
        this.path = path; this.x = path[0].x; this.y = path[0].y; this.targetIndex = 1; this.speed = Math.random() * 2 + 3; this.life = 1; this.color = color; this.tail = [];
    }
    update(pads: Map<{x: number, y: number}, Pad>) {
        this.tail.unshift({ x: this.x, y: this.y }); if (this.tail.length > 15) this.tail.pop();
        if (this.isDone()) { this.life -= 0.05; if (this.life > 0.9) { const endPad = pads.get(this.path[this.path.length-1]); if (endPad) endPad.flare(this.color); } return; }
        const target = this.path[this.targetIndex]; const dx = target.x - this.x; const dy = target.y - this.y; const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.speed) { this.x = target.x; this.y = target.y; this.targetIndex++; } else { this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed; }
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.life;
        for(let i = 0; i < this.tail.length; i++) {
            const opacity = 1 - (i / this.tail.length); ctx.beginPath(); ctx.arc(this.tail[i].x, this.tail[i].y, 1.5 * opacity, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace(')', `, ${opacity * 0.5})`).replace('hsl', 'hsla'); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    isDone() { return this.targetIndex >= this.path.length; }
}
class Pad {
    x: number; y: number; size: number; flareLife: number; flareColor: string;
    constructor(x:number, y:number, size:number){ this.x = x; this.y = y; this.size = size; this.flareLife = 0; this.flareColor = ''; }
    flare(color:string) { this.flareLife = 1; this.flareColor = color; }
    update() { if (this.flareLife > 0) this.flareLife -= 0.04; }
    draw(ctx: CanvasRenderingContext2D, baseColor: string) {
        ctx.fillStyle = baseColor; ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        if (this.flareLife > 0) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5 * this.flareLife);
            gradient.addColorStop(0, this.flareColor.replace(')', `, ${this.flareLife})`).replace('hsl', 'hsla'));
            gradient.addColorStop(1, this.flareColor.replace(')', `, 0)`).replace('hsl', 'hsla'));
            ctx.fillStyle = gradient; ctx.fillRect(this.x - this.size * 6, this.y - this.size * 6, this.size * 12, this.size * 12);
        }
    }
}
class CircuitsAnimation extends Animation {
    private paths: {x: number, y: number}[][] = []; private pulses: Pulse[] = []; private pads = new Map<{x: number, y: number}, Pad>(); private chips: {x: number, y: number, w: number, h: number}[] = [];
    private offscreenCanvas: HTMLCanvasElement; private offscreenCtx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        super(canvas, ctx); this.offscreenCanvas = document.createElement('canvas'); this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    }
    init() { this.offscreenCanvas.width = this.canvas.width; this.offscreenCanvas.height = this.canvas.height; this.pads.clear(); this.chips = []; this.generateLayout(); this.drawBasePaths(); this.pulses = []; }
    generateLayout() {
        this.paths = []; const chipCount = Math.floor((this.canvas.width * this.canvas.height) / 80000);
        for (let i = 0; i < chipCount; i++) { this.chips.push({ x: Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1, y: Math.random() * this.canvas.height * 0.8 + this.canvas.height * 0.1, w: Math.random() * 120 + 80, h: Math.random() * 120 + 80, }); }
        const padCount = chipCount * 25;
        for (let i = 0; i < padCount; i++) {
            let x, y; if (Math.random() > 0.5 && this.chips.length > 0) { const chip = this.chips[Math.floor(Math.random() * this.chips.length)]; x = chip.x + (Math.random() - 0.5) * chip.w * 1.8; y = chip.y + (Math.random() - 0.5) * chip.h * 1.8; } else { x = Math.random() * this.canvas.width; y = Math.random() * this.canvas.height; }
            this.pads.set({x, y}, new Pad(x, y, 4));
        }
        const padArray = Array.from(this.pads.keys());
        for (let i = 0; i < padArray.length * 2; i++) {
            const startPad = padArray[Math.floor(Math.random() * padArray.length)]; const endPad = padArray[Math.floor(Math.random() * padArray.length)]; if (startPad === endPad) continue;
            let path = [startPad]; const midX = (startPad.x + endPad.x) / 2 + (Math.random() - 0.5) * 200; const midY = (startPad.y + endPad.y) / 2 + (Math.random() - 0.5) * 200; path.push({ x: midX, y: midY }); path.push(endPad); this.paths.push(path);
        }
    }
    drawBasePaths() {
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.chips.forEach(chip => { this.offscreenCtx.fillStyle = `hsla(220, 100%, 65%, 0.05)`; this.offscreenCtx.strokeStyle = `hsla(220, 100%, 65%, 0.2)`; this.offscreenCtx.lineWidth = 1.5; this.offscreenCtx.fillRect(chip.x - chip.w/2, chip.y - chip.h/2, chip.w, chip.h); this.offscreenCtx.strokeRect(chip.x - chip.w/2, chip.y - chip.h/2, chip.w, chip.h); });
        this.offscreenCtx.strokeStyle = `hsla(220, 100%, 65%, 0.15)`; this.offscreenCtx.lineWidth = 1;
        this.paths.forEach(path => { this.offscreenCtx.beginPath(); this.offscreenCtx.moveTo(path[0].x, path[0].y); this.offscreenCtx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y); this.offscreenCtx.stroke(); });
    }
    animate(timestamp: number) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        this.chips.forEach(chip => {
            const glow = 10 + Math.sin(timestamp / 800) * 5; this.ctx.shadowColor = this.themeColors.accent1; this.ctx.shadowBlur = glow; this.ctx.strokeStyle = `hsla(220, 100%, 65%, 0.5)`; this.ctx.strokeRect(chip.x - chip.w/2, chip.y - chip.h/2, chip.w, chip.h); this.ctx.shadowBlur = 0;
        });
        this.pads.forEach(pad => { pad.update(); pad.draw(this.ctx, 'hsla(220, 100%, 65%, 0.3)'); });
        if (Math.random() > 0.92 && this.pulses.length < 80 && this.paths.length > 0) {
            const path = this.paths[Math.floor(Math.random() * this.paths.length)]; const color = Math.random() > 0.3 ? this.themeColors.primary : this.themeColors.accent1; this.pulses.push(new Pulse(path, color));
        }
        for (let i = this.pulses.length - 1; i >= 0; i--) { const pulse = this.pulses[i]; pulse.update(this.pads); pulse.draw(this.ctx); if (pulse.life <= 0) { this.pulses.splice(i, 1); } }
    }
}

// --- 5. Realistic Digital Lightning Animation (NOW WITH CLASHES) ---
class Spark {
    x: number; y: number; vx: number; vy: number; life: number; size: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.size = Math.random() * 2.5 + 1;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vx *= 0.96; this.vy *= 0.96; this.life -= 0.03;
    }
    isDead() { return this.life <= 0; }
    draw(ctx: CanvasRenderingContext2D, color: string) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = color.replace(')', `, ${this.life})`).replace('hsl', 'hsla');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Explosion {
    x: number; y: number; sparks: Spark[] = []; color: string;
    shockwave = { radius: 0, opacity: 1, speed: 12, lineWidth: 5, noiseSeed: Math.random() * 100 };
    internalArcs: { startAngle: number, endAngle: number, life: number, radiusOffset: number }[] = [];
    
    constructor(x: number, y: number, sparkCount: number, color: string) {
        this.x = x; this.y = y; this.color = color;
        for (let i = 0; i < sparkCount; i++) this.sparks.push(new Spark(x, y));

        const numArcs = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numArcs; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const length = (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
            this.internalArcs.push({
                startAngle: startAngle,
                endAngle: startAngle + length,
                life: 1,
                radiusOffset: Math.random() * 20 + 10
            });
        }
    }

    update() {
        // Push sparks with the shockwave
        this.sparks.forEach(s => {
            const dx = s.x - this.x;
            const dy = s.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (Math.abs(dist - this.shockwave.radius) < 20) {
                const pushForce = (20 - Math.abs(dist - this.shockwave.radius)) / 20;
                s.vx += (dx / dist) * pushForce * 0.8;
                s.vy += (dy / dist) * pushForce * 0.8;
            }
            s.update();
        });
        this.sparks = this.sparks.filter(s => !s.isDead());
        
        if (this.shockwave.opacity > 0) {
            this.shockwave.radius += this.shockwave.speed;
            this.shockwave.speed *= 0.97; // Decelerate
            this.shockwave.opacity -= 0.015;
            this.shockwave.lineWidth *= 0.98; // Thin out
        }
        
        this.internalArcs.forEach(arc => arc.life -= 0.04);
        this.internalArcs = this.internalArcs.filter(arc => arc.life > 0);
    }

    isDead() { return this.sparks.length === 0 && this.shockwave.opacity <= 0; }

    draw(ctx: CanvasRenderingContext2D) {
        this.sparks.forEach(spark => spark.draw(ctx, this.color));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Draw main, distorted shockwave
        if (this.shockwave.opacity > 0 && this.shockwave.lineWidth > 0.5) {
            const gradient = ctx.createRadialGradient(this.x, this.y, Math.max(0, this.shockwave.radius - 50), this.x, this.y, this.shockwave.radius);
            gradient.addColorStop(0, `hsla(60, 100%, 95%, ${this.shockwave.opacity * 0.8})`);
            gradient.addColorStop(0.7, `hsla(48, 100%, 55%, ${this.shockwave.opacity})`);
            gradient.addColorStop(0.9, `hsla(30, 100%, 50%, ${this.shockwave.opacity * 0.5})`);
            gradient.addColorStop(1, `hsla(30, 100%, 50%, 0)`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.shockwave.lineWidth;
            
            ctx.beginPath();
            const points = 80;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const noise1 = Math.sin(angle * 7 + this.shockwave.noiseSeed) * this.shockwave.speed * 0.6;
                const noise2 = Math.sin(angle * 25 + this.shockwave.noiseSeed * 2) * this.shockwave.speed * 0.3;
                const distortedRadius = this.shockwave.radius + noise1 + noise2;
                const px = this.x + Math.cos(angle) * distortedRadius;
                const py = this.y + Math.sin(angle) * distortedRadius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw internal crackling tendrils
        this.internalArcs.forEach(arc => {
            if (arc.life > 0 && this.shockwave.opacity > 0) {
                const radius = this.shockwave.radius - arc.radiusOffset;
                if (radius > 0) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, radius, arc.startAngle, arc.endAngle);
                    ctx.strokeStyle = `hsla(0, 0%, 100%, ${arc.life * this.shockwave.opacity * 0.8})`;
                    ctx.lineWidth = Math.random() * 1.5 + 0.5; // Jagged width
                    ctx.stroke();
                }
            }
        });

        ctx.restore();
    }
}


class LightningBolt {
    public life = 1.0;
    public createsSparksOnDeath = true;
    public endPoint: {x: number, y: number};
    private segments: {x: number, y: number}[][] = [];
    public color: string;
    public isSuperBolt: boolean;

    constructor(startX: number, startY: number, endX: number, endY: number, color: string, isSuperBolt: boolean) {
        this.color = color;
        this.isSuperBolt = isSuperBolt;
        this.endPoint = { x: endX, y: endY };
        const mainPath = this.createPath(startX, startY, endX, endY, this.isSuperBolt ? 150 : 100);
        this.segments.push(mainPath);
        const numBranches = this.isSuperBolt ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 3) + 1;
        for(let i=0; i < numBranches; i++) {
            const branchStartNode = mainPath[Math.floor(Math.random() * (mainPath.length * 0.7)) + Math.floor(mainPath.length * 0.1)];
            if (!branchStartNode) continue;
            const mainAngle = Math.atan2(endY - startY, endX - startX);
            const branchAngle = mainAngle + (Math.random() - 0.5) * Math.PI / 1.2;
            const branchLength = (Math.random() * 100 + 50) / (this.isSuperBolt ? 1 : 1.8);
            const branchEndX = branchStartNode.x + Math.cos(branchAngle) * branchLength;
            const branchEndY = branchStartNode.y + Math.sin(branchAngle) * branchLength;
            this.segments.push(this.createPath(branchStartNode.x, branchStartNode.y, branchEndX, branchEndY, 60));
        }
    }
    private createPath(startX: number, startY: number, endX: number, endY: number, maxDisplacement: number): {x: number, y: number}[] {
        let path = [{x: startX, y: startY}, {x: endX, y: endY}]; let displacement = maxDisplacement;
        for (let i = 0; i < 8; i++) {
            let newPath = [];
            for (let j = 0; j < path.length - 1; j++) {
                const start = path[j]; const end = path[j+1]; const midX = (start.x + end.x) / 2; const midY = (start.y + end.y) / 2;
                const dx = end.x - start.x; const dy = end.y - start.y; const normal = Math.sqrt(dx*dx + dy*dy) || 1;
                const offsetX = -dy / normal * (Math.random() - 0.5) * displacement; const offsetY = dx / normal * (Math.random() - 0.5) * displacement;
                newPath.push(start, {x: midX + offsetX, y: midY + offsetY});
            } newPath.push(path[path.length - 1]); path = newPath; displacement /= 1.7;
        } return path;
    }
    update() { this.life -= 0.025; }
    isDead() { return this.life <= 0; }
    private drawSegments(ctx: CanvasRenderingContext2D) {
        this.segments.forEach(path => { if (path.length < 1) return; ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y); for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y); ctx.stroke(); });
    }
    private drawFlickeringSegments(ctx: CanvasRenderingContext2D, flickerAmount: number) {
        const flicker = () => (Math.random() - 0.5) * flickerAmount * this.life;
        this.segments.forEach(path => { if (path.length < 1) return; ctx.beginPath(); ctx.moveTo(path[0].x + flicker(), path[0].y + flicker()); for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x + flicker(), path[i].y + flicker()); ctx.stroke(); });
    }
    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        const coreAlpha = 0.9 * this.life * (0.5 + Math.random() * 0.5); const glowAlpha = 0.3 * this.life * (0.5 + Math.random() * 0.5);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const widths = this.isSuperBolt ? [20, 12, 4] : [14, 8, 2];
        ctx.strokeStyle = this.color.replace(')', `, ${glowAlpha * 0.5})`).replace('hsl', 'hsla'); ctx.lineWidth = widths[0] + (Math.random() - 0.5) * 6; this.drawFlickeringSegments(ctx, 10);
        ctx.strokeStyle = this.color.replace(')', `, ${glowAlpha})`).replace('hsl', 'hsla'); ctx.lineWidth = widths[1] + (Math.random() - 0.5) * 4; this.drawFlickeringSegments(ctx, 5);
        ctx.strokeStyle = `hsla(0, 0%, 100%, ${coreAlpha})`; ctx.lineWidth = widths[2]; this.drawSegments(ctx);
        ctx.restore();
    }
}

class ArcLightningAnimation extends Animation {
    private bolts: LightningBolt[] = [];
    private explosions: Explosion[] = [];
    private screenFlash = { opacity: 0 };

    init() { this.bolts = []; this.explosions = []; this.screenFlash = { opacity: 0 }; }

    private getRandomEdgePoint(): {x: number, y: number, edge: number} {
        const { width, height } = this.canvas; const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) { x = Math.random() * width; y = 0; }
        else if (edge === 1) { x = width; y = Math.random() * height; }
        else if (edge === 2) { x = Math.random() * width; y = height; }
        else { x = 0; y = Math.random() * height; }
        return { x, y, edge };
    }
    
    private createClash() {
        const { width, height } = this.canvas;
        const cx = width * (0.3 + Math.random() * 0.4); const cy = height * (0.3 + Math.random() * 0.4);
        const startPoint1 = this.getRandomEdgePoint();
        let startPoint2 = this.getRandomEdgePoint();
        while (startPoint2.edge === startPoint1.edge) startPoint2 = this.getRandomEdgePoint();
        
        const bolt1 = new LightningBolt(startPoint1.x, startPoint1.y, cx, cy, this.themeColors.primary, false);
        bolt1.createsSparksOnDeath = false;
        const bolt2 = new LightningBolt(startPoint2.x, startPoint2.y, cx, cy, this.themeColors.accent1, false);
        bolt2.createsSparksOnDeath = false;
        this.bolts.push(bolt1, bolt2);
        
        const explosionColor = Math.random() > 0.5 ? this.themeColors.primary : this.themeColors.accent1;
        this.explosions.push(new Explosion(cx, cy, 120, explosionColor));
        this.screenFlash.opacity = 0.8;
    }

    private createNormalBolt() {
        const isSuperBolt = Math.random() > 0.997;
        const start = this.getRandomEdgePoint();
        let end = this.getRandomEdgePoint();
        while (end.edge === start.edge) end = this.getRandomEdgePoint();
        const color = isSuperBolt ? this.themeColors.primary : this.themeColors.accent1;
        this.bolts.push(new LightningBolt(start.x, start.y, end.x, end.y, color, isSuperBolt));
        if (isSuperBolt) this.screenFlash.opacity = 1;
    }
    
    animate() {
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const rand = Math.random();
        if (rand > 0.992 && this.bolts.length < 10) this.createClash();
        else if (rand > 0.95 && this.bolts.length < 20) this.createNormalBolt();

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.update();
            if (explosion.isDead()) this.explosions.splice(i, 1);
            else explosion.draw(this.ctx);
        }
        for (let i = this.bolts.length - 1; i >= 0; i--) {
            const bolt = this.bolts[i];
            bolt.update();
            if (bolt.isDead()) {
                if (bolt.createsSparksOnDeath) {
                    const sparkCount = bolt.isSuperBolt ? 50 : 20;
                    this.explosions.push(new Explosion(bolt.endPoint.x, bolt.endPoint.y, sparkCount, bolt.color));
                }
                this.bolts.splice(i, 1);
            } else {
                bolt.draw(this.ctx);
            }
        }
        if (this.screenFlash.opacity > 0) {
            this.ctx.fillStyle = `hsla(0, 0%, 100%, ${this.screenFlash.opacity * 0.3})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.screenFlash.opacity -= 0.05;
        }
    }
}


// --- Main Canvas Component ---
const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ animationType }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationInstanceRef = useRef<Animation | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (animationInstanceRef.current) {
            animationInstanceRef.current.stop();
        }

        let animation: Animation;
        switch (animationType) {
            case 'matrix': animation = new MatrixAnimation(canvas, ctx); break;
            case 'hexagons': animation = new HexagonsAnimation(canvas, ctx); break;
            case 'circuits': animation = new CircuitsAnimation(canvas, ctx); break;
            case 'lightning': animation = new ArcLightningAnimation(canvas, ctx); break;
            case 'particles':
            default:
                animation = new ParticlePlexusAnimation(canvas, ctx); break;
        }
        animationInstanceRef.current = animation;

        const handleResize = () => {
            if (animationInstanceRef.current) {
                animationInstanceRef.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        animation.start();

        return () => {
            if (animationInstanceRef.current) {
                animationInstanceRef.current.stop();
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [animationType]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed', top: 0, left: 0, zIndex: 0,
                backgroundColor: 'var(--bg-dark)',
                opacity: 0.7
            }}
        />
    );
};

export default BackgroundCanvas;