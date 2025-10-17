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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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


// --- 2. ARC LIGHTNING --- (NEW: Random intensity and initial blast)
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

            if (this.children.length < 5 && Math.random() > (isBranch ? 0.99 : 0.96)) {
                this.children.push(new LightningBolt(newSeg.x, newSeg.y, newSeg.y + Math.random() * (endY - newSeg.y), color, true, particleCallback, this.intensity));
            }
            
            lastSeg = newSeg;
        }
    }

    update() {
        this.life -= 0.04 / (1 + (this.intensity - 1) * 0.2); // Intense bolts last a little longer
        this.children.forEach(child => child.update());
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        
        const alpha = Math.min(1.0, Math.pow(this.life, 2.0) * this.intensity);
        if (alpha <= 0) return;
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth * 2.5;
        ctx.globalAlpha = alpha * 0.4;
        ctx.shadowBlur = 30 * this.intensity;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = alpha * 0.6;
        ctx.shadowBlur = 10 * this.intensity;
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.lineWidth * 0.6;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.stroke();

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
        const numBolts = Math.floor(Math.random() * 4) + 5; // 5 to 8 bolts
        for (let i = 0; i < numBolts; i++) {
            const intensity = Math.random() * 0.8 + 1.2; // Blast bolts are more intense
            const startX = Math.random() * this.canvas.width;
            const endY = this.canvas.height;
            const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
            this.bolts.push(new LightningBolt(startX, 0, endY, color, false, this.addParticle, intensity));
        }
        this.flashOpacity = 0.8; // A big initial flash
        this.triggerGlitchEffect(500); // A longer glitch for the blast
        this.spawnCooldown = Math.random() * 2000 + 4000; // Longer cooldown after the blast
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
            this.spawnCooldown = Math.random() * 3000 + 800;
            const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
            const startX = Math.random() * this.canvas.width;
            const endY = this.canvas.height;
            const intensity = Math.random() * 1.0 + 0.5; // Random intensity from 0.5 to 1.5
            
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


// --- 3. MATRIX RAIN ---
class MatrixSymbol {
    x: number; y: number;
    fontSize: number;
    canvasHeight: number;
    text: string;
    color: string;
    isPrimary: boolean;

    constructor(x: number, y: number, fontSize: number, canvasHeight: number, color: string, isPrimary: boolean = false) {
        this.x = x;
        this.y = y;
        this.fontSize = fontSize;
        this.canvasHeight = canvasHeight;
        this.text = ' ';
        this.color = color;
        this.isPrimary = isPrimary;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const chars = '01╌╍╎╏┠┨┯┷┿╳';
        
        // Characters only change periodically to reduce visual noise
        if (Math.random() > 0.95) {
            this.text = chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // The first character of the stream is the "leader"
        if (this.y * this.fontSize < this.fontSize * 2) {
            ctx.fillStyle = '#fff'; // Bright white leader
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#fff';
        } else {
            ctx.fillStyle = this.isPrimary ? this.color : 'hsl(120, 70%, 35%)';
            ctx.shadowBlur = 0;
        }
        
        ctx.fillText(this.text, this.x * this.fontSize, this.y * this.fontSize);
        ctx.shadowBlur = 0; // Reset shadow for next draw call

        if (this.y * this.fontSize > this.canvasHeight && Math.random() > 0.975) {
            this.y = 0;
        } else {
            this.y += 1;
        }
    }
}

class MatrixAnimation extends Animation {
    private columns: number = 0;
    private symbols: MatrixSymbol[] = [];
    private fontSize: number = 16;

    init() {
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.symbols = [];
        for (let i = 0; i < this.columns; i++) {
            const isPrimary = Math.random() < 0.05; // 5% of columns will be the primary theme color
            this.symbols[i] = new MatrixSymbol(
                i, 
                Math.random() * -50, // Start off-screen at random heights
                this.fontSize, 
                this.canvas.height, 
                this.themeColors.primary,
                isPrimary
            );
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 14, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `${this.fontSize}px monospace`;
        this.symbols.forEach(s => s.draw(this.ctx));
    }
}

// --- 4. HEX GRID ---
class Hexagon {
    x: number; y: number;
    size: number;
    life: number = 0;
    maxLife: number;
    color: string;

    constructor(x: number, y: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.maxLife = Math.random() * 200 + 100;
        this.color = color;
    }

    updateAndDraw(ctx: CanvasRenderingContext2D) {
        this.life++;
        if (this.life > this.maxLife) this.life = 0;

        const opacity = Math.sin((this.life / this.maxLife) * Math.PI);

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x_i = this.x + this.size * Math.cos(angle);
            const y_i = this.y + this.size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x_i, y_i);
            else ctx.lineTo(x_i, y_i);
        }
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = opacity * 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

class HexGridAnimation extends Animation {
    private hexagons: Hexagon[] = [];
    private hexSize: number = 30;

    init() {
        this.hexagons = [];
        const hexWidth = this.hexSize * 2;
        const hexHeight = Math.sqrt(3) * this.hexSize;
        const color = this.themeColors.accent1; // Use only the blue accent color

        for (let y = 0, i = 0; y < this.canvas.height + hexHeight; y += hexHeight / 2) {
            for (let x = 0; x < this.canvas.width + hexWidth; x += hexWidth * 0.75) {
                const hexX = (i % 2 === 0) ? x : x - (hexWidth * 0.75 / 2);
                this.hexagons.push(new Hexagon(hexX, y, this.hexSize, color));
            }
            i++;
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hexagons.forEach(hex => hex.updateAndDraw(this.ctx));
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
                const color = Math.random() > 0.2 ? this.themeColors.accent1 : this.themeColors.primary; // Mostly blue pulses with some yellow
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



// Main React Component
const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ animationType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<Animation | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Stop previous animation if it exists
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Create a new animation instance based on the type
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
      case 'hexagons':
        animationRef.current = new HexGridAnimation(canvas, ctx);
        break;
      case 'circuits':
        animationRef.current = new CircuitsAnimation(canvas, ctx);
        break;
      default:
        animationRef.current = new ParticlePlexusAnimation(canvas, ctx);
    }
    
    animationRef.current.start();

    const handleResize = () => {
        if (animationRef.current) {
            animationRef.current.resize();
        }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [animationType]); // Re-run effect when animationType changes

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
};

export default BackgroundCanvas;