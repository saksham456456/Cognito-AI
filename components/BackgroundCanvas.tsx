
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

// --- 1. Particle Plexus Animation (Restored Original Physics) ---
class OGParticle {
    x: number; y: number; size: number;
    vx: number; vy: number;
    homeX: number; homeY: number;
    baseColor: string;
    currentColor: string;

    constructor(x: number, y: number, size: number, color: string) {
        this.x = x; this.y = y; this.size = size;
        this.homeX = x; this.homeY = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.baseColor = color;
        this.currentColor = color;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.currentColor;
        ctx.shadowColor = this.currentColor;
        ctx.shadowBlur = this.size * 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    update(mouse: {x:number, y:number, radius:number}) {
        // --- Mouse interaction force ---
        const dxMouse = mouse.x - this.x;
        const dyMouse = mouse.y - this.y;
        const distanceMouse = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
        let forceX = 0;
        let forceY = 0;

        if (distanceMouse < mouse.radius) {
            const force = (mouse.radius - distanceMouse) / mouse.radius;
            forceX -= dxMouse / distanceMouse * force * 2;
            forceY -= dyMouse / distanceMouse * force * 2;
            this.currentColor = 'hsl(50, 100%, 95%)';
        } else {
            this.currentColor = this.baseColor;
        }
        
        // --- Spring force to home position ---
        const dxHome = this.homeX - this.x;
        const dyHome = this.homeY - this.y;
        const springConstant = 0.01;
        forceX += dxHome * springConstant;
        forceY += dyHome * springConstant;

        // Apply forces
        this.vx += forceX;
        this.vy += forceY;
        
        // Damping/friction
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Update position
        this.x += this.vx;
        this.y += this.vy;
    }
}

class ParticlePlexusAnimation extends Animation {
    private particles: OGParticle[] = [];
    private mouse = { x: -200, y: -200, radius: 150 };

    init() {
        this.particles = [];
        const numberOfParticles = (this.canvas.height * this.canvas.width) / 12000;
        for (let i = 0; i < numberOfParticles; i++) {
            const size = Math.random() * 2 + 1;
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const color = `hsla(48, 100%, 55%, 0.8)`;
            this.particles.push(new OGParticle(x, y, size, color));
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
            p.update(this.mouse);
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
                    const opacity = 1 - (distance / maxDistance);
                    const proximity = 1 - (distance / maxDistance);
                    const hue = 220 - (172 * proximity * proximity);
                    const color = `hsla(${hue}, 100%, 65%, ${opacity})`;
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
                    this.ctx.shadowBlur = glowAmount;
                    
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

// --- 5. Arc Lightning Animation (Enhanced) ---
class LightningBolt {
    public life = 1;
    private segments: {x: number, y: number}[][] = [];
    private color: string;
    private glow: number;
    private isMainBolt: boolean;

    constructor(startX: number, startY: number, endX: number, endY: number, color: string, isMainBolt: boolean) {
        this.color = color;
        this.glow = isMainBolt ? 30 : 15;
        this.isMainBolt = isMainBolt;
        
        const mainPath = this.createPath(startX, startY, endX, endY, 120);
        this.segments.push(mainPath);

        if (isMainBolt) {
            const numBranches = Math.floor(Math.random() * 4) + 3;
            for(let i=0; i < numBranches; i++) {
                const branchStartNode = mainPath[Math.floor(Math.random() * (mainPath.length - 2)) + 1];
                const branchAngle = Math.atan2(endY - startY, endX - startX) + (Math.random() - 0.5) * Math.PI / 1.5;
                const branchLength = (Math.random() * 100 + 50);
                const branchEndX = branchStartNode.x + Math.cos(branchAngle) * branchLength;
                const branchEndY = branchStartNode.y + Math.sin(branchAngle) * branchLength;
                this.segments.push(this.createPath(branchStartNode.x, branchStartNode.y, branchEndX, branchEndY, 60));
            }
        }
    }

    private createPath(startX: number, startY: number, endX: number, endY: number, maxDisplacement: number): {x: number, y: number}[] {
        let path = [{x: startX, y: startY}, {x: endX, y: endY}];
        let displacement = maxDisplacement;

        for (let i = 0; i < 8; i++) {
            let newPath = [];
            for (let j = 0; j < path.length - 1; j++) {
                const start = path[j];
                const end = path[j+1];
                const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * displacement;
                const midY = (start.y + end.y) / 2 + (Math.random() - 0.5) * displacement;
                newPath.push(start, {x: midX, y: midY});
            }
            newPath.push(path[path.length - 1]);
            path = newPath;
            displacement /= 2.1;
        }
        return path;
    }

    update() { this.life -= 0.03; }
    isDead() { return this.life <= 0; }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.glow * this.life;
        ctx.strokeStyle = `hsla(${this.color.split(',')[0].substring(4)}, 100%, 75%, ${0.2 * this.life})`;
        ctx.lineWidth = this.isMainBolt ? 8 : 4;
        this.drawSegmentsSmooth(ctx);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = `hsla(0, 0%, 100%, ${0.7 * this.life})`;
        ctx.lineWidth = this.isMainBolt ? 2 : 1;
        this.drawSegmentsSmooth(ctx);
        
        ctx.restore();
    }
    
    private drawSegmentsSmooth(ctx: CanvasRenderingContext2D) {
        this.segments.forEach(path => {
            if (path.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length - 2; i++) {
                const xc = (path[i].x + path[i + 1].x) / 2;
                const yc = (path[i].y + path[i + 1].y) / 2;
                ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
            }
            ctx.quadraticCurveTo(path[path.length - 2].x, path[path.length - 2].y, path[path.length - 1].x, path[path.length - 1].y);
            ctx.stroke();
        });
    }
}

class ArcLightningAnimation extends Animation {
    private bolts: LightningBolt[] = [];
    private mouse = { x: -999, y: -999, moved: false };
    private lastStrike = 0;
    private lastBurst = 0;

    init() {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseout', this.handleMouseOut);
    }
    handleMouseMove = (e: MouseEvent) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.moved = true; }
    handleMouseOut = () => { this.mouse.x = -999; this.mouse.y = -999; this.mouse.moved = false; }

    animate(timestamp: number) {
        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const now = timestamp;
        if (this.mouse.moved && now - this.lastStrike > 150) {
            const fromEdge = Math.floor(Math.random() * 4);
            let startX, startY;
            switch(fromEdge) {
                case 0: startX = 0; startY = Math.random() * this.canvas.height; break;
                case 1: startX = this.canvas.width; startY = Math.random() * this.canvas.height; break;
                case 2: startX = Math.random() * this.canvas.width; startY = 0; break;
                case 3: default: startX = Math.random() * this.canvas.width; startY = this.canvas.height; break;
            }
            this.bolts.push(new LightningBolt(startX, startY, this.mouse.x, this.mouse.y, this.themeColors.primary, true));
            this.lastStrike = now;
            this.mouse.moved = false;
        }

        if (Math.random() > 0.96 && this.bolts.length < 15) {
            const startX = Math.random() * this.canvas.width; const startY = Math.random() * this.canvas.height;
            const endX = startX + (Math.random() - 0.5) * 400; const endY = startY + (Math.random() - 0.5) * 400;
            this.bolts.push(new LightningBolt(startX, startY, endX, endY, this.themeColors.accent1, false));
        }

        if (now - this.lastBurst > 3000 && Math.random() > 0.98) {
            const burstX = Math.random() * this.canvas.width * 0.6 + this.canvas.width * 0.2;
            const burstY = Math.random() * this.canvas.height * 0.6 + this.canvas.height * 0.2;
            const numSpokes = Math.floor(Math.random() * 5) + 5;
            for (let i = 0; i < numSpokes; i++) {
                const angle = (i / numSpokes) * Math.PI * 2; const length = Math.random() * 150 + 100;
                const endX = burstX + Math.cos(angle) * length; const endY = burstY + Math.sin(angle) * length;
                this.bolts.push(new LightningBolt(burstX, burstY, endX, endY, this.themeColors.accent1, false));
            }
            this.lastBurst = now;
        }

        for (let i = this.bolts.length - 1; i >= 0; i--) {
            const bolt = this.bolts[i];
            bolt.update();
            if(bolt.isDead()) { this.bolts.splice(i, 1); } else { bolt.draw(this.ctx); }
        }
    }
    
    stop() {
        super.stop();
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseout', this.handleMouseOut);
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
