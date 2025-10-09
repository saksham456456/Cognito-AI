
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
class Particle {
    x: number; y: number; size: number; speedX: number; speedY: number; color: string;
    baseX: number; baseY: number; density: number;
    constructor(x: number, y: number, size: number, speedX: number, speedY: number, color: string) {
        this.x = x; this.y = y; this.size = size; this.speedX = speedX; this.speedY = speedY; this.color = color;
        this.baseX = this.x; this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
    update(canvas: HTMLCanvasElement, mouse: {x:number, y:number, radius:number}) {
        const dxMouse = mouse.x - this.x;
        const dyMouse = mouse.y - this.y;
        const distance = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
        let forceX = 0;
        let forceY = 0;

        if (distance < mouse.radius) {
            const forceDirectionX = dxMouse / distance;
            const forceDirectionY = dyMouse / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            forceX = forceDirectionX * force * this.density * -0.5;
            forceY = forceDirectionY * force * this.density * -0.5;
        }

        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
            this.speedY = -this.speedY;
        }
        
        this.x += this.speedX + forceX;
        this.y += this.speedY + forceY;
    }
}
class ParticlePlexusAnimation extends Animation {
    private particles: Particle[] = [];
    private mouse = { x: -200, y: -200, radius: 150 };

    init() {
        this.particles = [];
        const numberOfParticles = (this.canvas.height * this.canvas.width) / 10000;
        for (let i = 0; i < numberOfParticles; i++) {
            const size = Math.random() * 1.5 + 1;
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const speedX = Math.random() * 0.4 - 0.2;
            const speedY = Math.random() * 0.4 - 0.2;
            this.particles.push(new Particle(x, y, size, speedX, speedY, `hsla(48, 100%, 55%, 0.8)`));
        }
        window.addEventListener('mousemove', this.handleMouseMove);
    }
    
    handleMouseMove = (event: MouseEvent) => {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            p.update(this.canvas, this.mouse);
            p.draw(this.ctx);
        });
        this.connectParticles();
    }
    
    connectParticles() {
        const maxDistanceSq = 120 * 120; // Use squared distance for performance
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a + 1; b < this.particles.length; b++) {
                const dx = this.particles[a].x - this.particles[b].x;
                const dy = this.particles[a].y - this.particles[b].y;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq < maxDistanceSq) {
                    const opacity = 1 - (distanceSq / maxDistanceSq);
                    this.ctx.strokeStyle = `hsla(220, 100%, 65%, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
                    this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    stop() {
        super.stop();
        window.removeEventListener('mousemove', this.handleMouseMove);
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
        // Throttle the animation speed to make the text readable
        if (timestamp - this.lastTimestamp < 80) { // Update ~12.5 times per second
            return;
        }
        this.lastTimestamp = timestamp;

        // Draw a semi-transparent black rectangle to create the fading trail effect
        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set the style for the falling characters
        this.ctx.fillStyle = this.themeColors.primary;
        this.ctx.font = `${this.fontSize}px "Roboto Mono", monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            // Get the next character from the word "SAKSHAM" for the current column
            const text = this.word[this.charIndices[i]];
            
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            // Draw the character
            this.ctx.fillText(text, x, y);

            // If the drop has reached the bottom of the screen, reset it to the top
            // Add a random factor to create more varied streams
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            // Move the drop down by one character length
            this.drops[i]++;
            
            // Advance to the next character in "SAKSHAM" for the next frame
            this.charIndices[i] = (this.charIndices[i] + 1) % this.word.length;
        }
    }
}


// --- 3. Hexagons Animation (Data Flow Concept) ---
class HexPulse {
    x: number; y: number; life: number; maxRadius: number; speed: number; currentRadius: number;

    constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.life = 1;
        this.maxRadius = Math.random() * 300 + 200; // Pulse travels 200-500px
        this.speed = Math.random() * 1.5 + 1; // Speed of radius expansion
        this.currentRadius = 0;
    }

    update() {
        this.currentRadius += this.speed;
        if (this.currentRadius > this.maxRadius) {
            this.life -= 0.05; // Start fading out after reaching max radius
        }
    }

    isDead(): boolean {
        return this.life <= 0;
    }
}
class HexagonsAnimation extends Animation {
    private hexSize = 30;
    private hexes: {x: number, y: number}[] = [];
    private pulses: HexPulse[] = [];
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
        this.hexes = [];
        this.pulses = [];
        const hexHeight = Math.sqrt(3) * this.hexSize;
        const hexWidth = 2 * this.hexSize;
        const cols = Math.ceil(this.canvas.width / (hexWidth * 0.75)) + 1;
        const rows = Math.ceil(this.canvas.height / hexHeight) + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * hexWidth * 0.75;
                const y = row * hexHeight + (col % 2) * (hexHeight / 2);
                this.hexes.push({ x, y });
            }
        }
        this.drawBaseGrid();
    }
    
    drawBaseGrid() {
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        this.offscreenCtx.lineWidth = 0.5;
        this.offscreenCtx.strokeStyle = `hsla(220, 100%, 65%, 0.1)`;
        const angle = (2 * Math.PI) / 6;

        this.hexes.forEach(hex => {
            this.offscreenCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                const x_ = hex.x + this.hexSize * Math.cos(angle * i);
                const y_ = hex.y + this.hexSize * Math.sin(angle * i);
                if (i === 0) this.offscreenCtx.moveTo(x_, y_);
                else this.offscreenCtx.lineTo(x_, y_);
            }
            this.offscreenCtx.closePath();
            this.offscreenCtx.stroke();
        });
    }

    drawHex(ctx: CanvasRenderingContext2D, hex: {x: number, y: number}, color: string, lineWidth: number) {
        const angle = (2 * Math.PI) / 6;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const x_ = hex.x + this.hexSize * Math.cos(angle * i);
            const y_ = hex.y + this.hexSize * Math.sin(angle * i);
            if (i === 0) ctx.moveTo(x_, y_);
            else ctx.lineTo(x_, y_);
        }
        ctx.closePath();
        ctx.stroke();
    }

    animate() {
        if (Math.random() > 0.98 && this.pulses.length < 5) {
            const startHex = this.hexes[Math.floor(Math.random() * this.hexes.length)];
            if(startHex) this.pulses.push(new HexPulse(startHex.x, startHex.y));
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);

        this.pulses.forEach(p => p.update());
        this.pulses = this.pulses.filter(p => !p.isDead());

        this.hexes.forEach(hex => {
            this.pulses.forEach(pulse => {
                const dx = hex.x - pulse.x;
                const dy = hex.y - pulse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const pulseWaveWidth = 80;

                if (distance > pulse.currentRadius - pulseWaveWidth && distance < pulse.currentRadius) {
                    const falloff = 1 - (pulse.currentRadius - distance) / pulseWaveWidth;
                    const opacity = falloff * pulse.life;
                    const color = `hsla(48, 100%, 55%, ${opacity})`;
                    this.drawHex(this.ctx, hex, color, 1.5);
                }
            });
        });
    }
}

// --- 4. Circuits Animation (REVAMPED) ---
class Pulse {
    path: {x: number, y: number}[]; x: number; y: number; targetIndex: number; speed: number; life: number; color: string;
    tail: {x: number, y: number}[];
    constructor(path: {x: number, y: number}[], color: string) {
        this.path = path;
        this.x = path[0].x;
        this.y = path[0].y;
        this.targetIndex = 1;
        this.speed = Math.random() * 2 + 3;
        this.life = 1;
        this.color = color;
        this.tail = [];
    }
    update(pads: Map<{x: number, y: number}, Pad>) {
        this.tail.unshift({ x: this.x, y: this.y });
        if (this.tail.length > 15) this.tail.pop();
        
        if (this.isDone()) {
            this.life -= 0.05;
            if (this.life > 0.9) {
                const endPad = pads.get(this.path[this.path.length-1]);
                if (endPad) endPad.flare(this.color);
            }
            return;
        }
        const target = this.path[this.targetIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.speed) {
            this.x = target.x;
            this.y = target.y;
            this.targetIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.life;
        // Draw tail
        for(let i = 0; i < this.tail.length; i++) {
            const opacity = 1 - (i / this.tail.length);
            ctx.beginPath();
            ctx.arc(this.tail[i].x, this.tail[i].y, 1.5 * opacity, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace(')', `, ${opacity * 0.5})`).replace('hsl', 'hsla');
            ctx.fill();
        }
        // Draw head
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    isDone() {
        return this.targetIndex >= this.path.length;
    }
}
class Pad {
    x: number; y: number; size: number; flareLife: number; flareColor: string;
    constructor(x:number, y:number, size:number){
        this.x = x; this.y = y; this.size = size; this.flareLife = 0; this.flareColor = '';
    }
    flare(color:string) {
        this.flareLife = 1;
        this.flareColor = color;
    }
    update() {
        if (this.flareLife > 0) this.flareLife -= 0.04;
    }
    draw(ctx: CanvasRenderingContext2D, baseColor: string) {
        ctx.fillStyle = baseColor;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        if (this.flareLife > 0) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5 * this.flareLife);
            gradient.addColorStop(0, this.flareColor.replace(')', `, ${this.flareLife})`).replace('hsl', 'hsla'));
            gradient.addColorStop(1, this.flareColor.replace(')', `, 0)`).replace('hsl', 'hsla'));
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - this.size * 6, this.y - this.size * 6, this.size * 12, this.size * 12);
        }
    }
}
class CircuitsAnimation extends Animation {
    private paths: {x: number, y: number}[][] = [];
    private pulses: Pulse[] = [];
    private pads = new Map<{x: number, y: number}, Pad>();
    private chips: {x: number, y: number, w: number, h: number}[] = [];
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
        this.pads.clear();
        this.chips = [];
        this.generateLayout();
        this.drawBasePaths();
        this.pulses = [];
    }

    generateLayout() {
        this.paths = [];
        const chipCount = Math.floor((this.canvas.width * this.canvas.height) / 80000);
        
        for (let i = 0; i < chipCount; i++) {
            this.chips.push({
                x: Math.random() * this.canvas.width * 0.8 + this.canvas.width * 0.1,
                y: Math.random() * this.canvas.height * 0.8 + this.canvas.height * 0.1,
                w: Math.random() * 120 + 80,
                h: Math.random() * 120 + 80,
            });
        }

        const padCount = chipCount * 25;
        for (let i = 0; i < padCount; i++) {
            let x, y;
            if (Math.random() > 0.5 && this.chips.length > 0) {
                 const chip = this.chips[Math.floor(Math.random() * this.chips.length)];
                 x = chip.x + (Math.random() - 0.5) * chip.w * 1.8;
                 y = chip.y + (Math.random() - 0.5) * chip.h * 1.8;
            } else {
                 x = Math.random() * this.canvas.width;
                 y = Math.random() * this.canvas.height;
            }
            this.pads.set({x, y}, new Pad(x, y, 4));
        }

        const padArray = Array.from(this.pads.keys());
        for (let i = 0; i < padArray.length * 2; i++) {
            const startPad = padArray[Math.floor(Math.random() * padArray.length)];
            const endPad = padArray[Math.floor(Math.random() * padArray.length)];
            if (startPad === endPad) continue;

            let path = [startPad];
            const midX = (startPad.x + endPad.x) / 2 + (Math.random() - 0.5) * 200;
            const midY = (startPad.y + endPad.y) / 2 + (Math.random() - 0.5) * 200;
            path.push({ x: midX, y: midY });
            path.push(endPad);
            this.paths.push(path);
        }
    }

    drawBasePaths() {
        this.offscreenCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.chips.forEach(chip => {
            this.offscreenCtx.fillStyle = `hsla(220, 100%, 65%, 0.05)`;
            this.offscreenCtx.strokeStyle = `hsla(220, 100%, 65%, 0.2)`;
            this.offscreenCtx.lineWidth = 1.5;
            this.offscreenCtx.fillRect(chip.x - chip.w/2, chip.y - chip.h/2, chip.w, chip.h);
            this.offscreenCtx.strokeRect(chip.x - chip.w/2, chip.y - chip.h/2, chip.w, chip.h);
        });

        this.offscreenCtx.strokeStyle = `hsla(220, 100%, 65%, 0.15)`;
        this.offscreenCtx.lineWidth = 1;
        this.paths.forEach(path => {
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(path[0].x, path[0].y);
            this.offscreenCtx.quadraticCurveTo(path[1].x, path[1].y, path[2].x, path[2].y);
            this.offscreenCtx.stroke();
        });
    }

    animate(timestamp: number) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);

        this.chips.forEach(chip => {
            const glow = 10 + Math.sin(timestamp / 800) * 5;
            this.ctx.shadowColor = this.themeColors.accent1;
            this.ctx.shadowBlur = glow;
            this.ctx.strokeStyle = `hsla(220, 100%, 65%, 0.5)`;
            this.ctx.strokeRect(chip.x - chip.w/2, chip.y - chip.h/2, chip.w, chip.h);
            this.ctx.shadowBlur = 0;
        });

        this.pads.forEach(pad => {
            pad.update();
            pad.draw(this.ctx, 'hsla(220, 100%, 65%, 0.3)');
        });
        
        if (Math.random() > 0.92 && this.pulses.length < 80 && this.paths.length > 0) {
            const path = this.paths[Math.floor(Math.random() * this.paths.length)];
            const color = Math.random() > 0.3 ? this.themeColors.primary : this.themeColors.accent1;
            this.pulses.push(new Pulse(path, color));
        }

        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const pulse = this.pulses[i];
            pulse.update(this.pads);
            pulse.draw(this.ctx);
            if (pulse.life <= 0) {
                this.pulses.splice(i, 1);
            }
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
        
        // Stop any existing animation
        if (animationInstanceRef.current) {
            animationInstanceRef.current.stop();
        }

        // Create and start the new animation
        let animation: Animation;
        switch (animationType) {
            case 'matrix': animation = new MatrixAnimation(canvas, ctx); break;
            case 'hexagons': animation = new HexagonsAnimation(canvas, ctx); break;
            case 'circuits': animation = new CircuitsAnimation(canvas, ctx); break;
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
        handleResize(); // Initial call to set size
        animation.start();

        // Cleanup function
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