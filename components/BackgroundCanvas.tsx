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


// --- 2. ARC LIGHTNING --- (NEW: More realistic implementation)
class LightningBolt {
    segments: { x: number, y: number }[] = [];
    life: number = 1.0;
    color: string;
    lineWidth: number;
    children: LightningBolt[] = [];

    constructor(x: number, y: number, endY: number, color: string, isBranch: boolean = false) {
        this.color = color;
        this.lineWidth = isBranch ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 1;
        
        let lastSeg = { x, y };
        this.segments.push(lastSeg);

        // Generate segments until we reach the target Y or go off-screen
        while(lastSeg.y < endY && lastSeg.y < window.innerHeight + 50) {
            // Move generally downwards
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
            const segLength = Math.random() * 15 + 5;
            
            let newX = lastSeg.x + Math.cos(angle) * segLength;
            let newY = lastSeg.y + Math.sin(angle) * segLength;

            // Add significant random jitter
            newX += (Math.random() - 0.5) * 20;

            const newSeg = { x: newX, y: newY };
            this.segments.push(newSeg);

            // Chance to branch, with branches being less likely to branch themselves
            if (this.children.length < 5 && Math.random() > (isBranch ? 0.99 : 0.96)) {
                this.children.push(new LightningBolt(newSeg.x, newSeg.y, newSeg.y + Math.random() * (endY - newSeg.y), color, true));
            }
            
            lastSeg = newSeg;
        }
    }

    update() {
        // Faster, non-linear fade
        this.life -= 0.04;
        this.children.forEach(child => child.update());
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        
        const alpha = Math.pow(this.life, 1.5); // Fade out faster at the end
        if (alpha <= 0) return;
        
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }

        // 1. Draw the main glow
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth * 2.5;
        ctx.globalAlpha = alpha * 0.4;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // 2. Draw a slightly thinner, brighter core
        ctx.lineWidth = this.lineWidth;
        ctx.globalAlpha = alpha * 0.6;
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // 3. Draw the bright white center
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.lineWidth * 0.6;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.stroke();

        this.children.forEach(child => child.draw(ctx));
    }
}

class ArcLightningAnimation extends Animation {
    private bolts: LightningBolt[] = [];
    private spawnCooldown: number = 0;
    private flashOpacity: number = 0;

    init() { 
        this.bolts = []; 
        this.lastTimestamp = performance.now();
    }

    animate(timestamp: number) {
        const delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.themeColors.bgDark;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Handle quick flash effect
        if (this.flashOpacity > 0) {
            this.ctx.fillStyle = `rgba(200, 220, 255, ${this.flashOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.flashOpacity = Math.max(0, this.flashOpacity - 0.15); // Much faster fade
        }

        // Spawn new parent bolts based on a cooldown timer
        this.spawnCooldown -= delta;
        if (this.spawnCooldown <= 0) {
            this.spawnCooldown = Math.random() * 800 + 400; // Cooldown between 0.4s and 1.2s

            const color = Math.random() > 0.1 ? this.themeColors.accent1 : this.themeColors.primary;
            const startX = Math.random() * this.canvas.width;
            const endY = this.canvas.height;
            
            this.bolts.push(new LightningBolt(startX, 0, endY, color, false));
            
            // Trigger an intense flash
            this.flashOpacity = Math.random() * 0.2 + 0.2;
        }
        
        // Use 'lighter' composite operation for an additive glow effect
        this.ctx.globalCompositeOperation = 'lighter';

        this.bolts = this.bolts.filter(b => {
            b.update();
            return b.life > 0;
        });
        
        this.bolts.forEach(b => {
            b.draw(this.ctx);
        });

        // Reset canvas state for the next frame
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
        const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';
        this.text = chars.charAt(Math.floor(Math.random() * chars.length));
        
        ctx.fillStyle = this.isPrimary ? this.color : 'hsl(120, 70%, 35%)';
        if (Math.random() > 0.98 && !this.isPrimary) {
             ctx.fillStyle = '#fff'; // Random white characters for highlights
        }
        
        ctx.fillText(this.text, this.x * this.fontSize, this.y * this.fontSize);

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
                0, 
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