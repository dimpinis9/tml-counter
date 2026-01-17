import { useState, useEffect, useRef } from "react";

interface TomorrowlandCountdownProps {
  targetDate?: string;
}

export default function TomorrowlandCountdown({
  targetDate = "2026-07-17",
}: TomorrowlandCountdownProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<any[]>([]);

  const calcDaysLeft = (target: string): number => {
    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const targetMidnight = new Date(target + "T00:00:00");
    const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  useEffect(() => {
    setIsClient(true);
    const updateDays = () => setDaysLeft(calcDaysLeft(targetDate));
    updateDays();

    const scheduleNextUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        updateDays();
        setInterval(updateDays, 24 * 60 * 60 * 1000);
      }, msUntilMidnight);
    };

    const timeoutId = scheduleNextUpdate();
    return () => clearTimeout(timeoutId);
  }, [targetDate]);

  // Particle system
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let particleCount = width < 768 ? 100 : 200;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 2.5 + 0.5;
        this.color = "#C6A85B";
      }

      update() {
        const mouse = mouseRef.current;
        if (mouse.x && mouse.y) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const interactionRadius = width < 768 ? 150 : 250;

          if (distance < interactionRadius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (interactionRadius - distance) / interactionRadius;
            const swirl = 2;
            this.vx += forceDirectionX * force * 1.5 - forceDirectionY * force * swirl;
            this.vy += forceDirectionY * force * 1.5 + forceDirectionX * force * swirl;
          }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.96;

        if (Math.abs(this.vx) < 0.2) this.vx += (Math.random() - 0.5) * 0.5;
        if (Math.abs(this.vy) < 0.2) this.vy += (Math.random() - 0.5) * 0.5;

        if (this.x < 0) this.x = width;
        else if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        else if (this.y > height) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particlesRef.current.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particleCount = width < 768 ? 100 : 200;
      if (particlesRef.current.length !== particleCount) initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });

    initParticles();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  if (!isClient || daysLeft === null) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-[#C6A85B] text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes glow {
            from { text-shadow: 0 0 20px rgba(198, 168, 91, 0.1), 0 0 40px rgba(198, 168, 91, 0.05); }
            to { text-shadow: 0 0 50px rgba(198, 168, 91, 0.5), 0 0 90px rgba(198, 168, 91, 0.25); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .noise-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 50;
            opacity: 0.06;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAACAgIBAQEAAAAAAAAAAAAAAAD3Ct38AAAACHRSTlMAMwA1MzMzM7O0s14AAABSSURBVDjLY2AYBaNgOANuIExBCwZQYQYpLCEYRM0QoE0QYJgClCVgYIgyA6uCKYyZIsgKkCKYwgwGjCgK8xnQFUAVMvCgK8ynQFcAV8jAg64wHAAAdwcSzH42sZ8AAAAASUVORK5CYII=');
          }
          
          .glass-panel {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background: rgba(8, 8, 8, 0.65);
            border: 1px solid rgba(198, 168, 91, 0.08);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
          }
          
          .shimmer-text {
            background: linear-gradient(90deg, #525252 0%, #9ca3af 40%, #C6A85B 50%, #9ca3af 60%, #525252 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: shimmer 8s linear infinite;
          }
          
          .mask-image-gradient {
            -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
            mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
          }
        `
      }} />

      <div className="bg-black text-white font-sans h-screen w-screen relative overflow-x-hidden">
        {/* Noise overlay */}
        <div className="noise-bg" />

        {/* Menu button */}
        <div className="fixed top-6 right-6 z-[60]">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-3 rounded-full bg-black/40 backdrop-blur border border-white/10 hover:bg-white/5 transition-all shadow-lg group"
          >
            <svg className="w-6 h-6 text-gray-400 group-hover:text-[#C6A85B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 right-0 w-80 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.9)] transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-[70] flex flex-col justify-center items-center border-l border-white/5 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-[#C6A85B] transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <nav className="space-y-10 text-center">
            <a href="#" className="block text-xl font-light hover:text-[#C6A85B] tracking-[0.2em] uppercase transition-colors duration-300">Lineup</a>
            <a href="#" className="block text-xl font-light hover:text-[#C6A85B] tracking-[0.2em] uppercase transition-colors duration-300">Tickets</a>
            <a href="#" className="block text-xl font-light hover:text-[#C6A85B] tracking-[0.2em] uppercase transition-colors duration-300">Experience</a>
            <a href="#" className="block text-xl font-light hover:text-[#C6A85B] tracking-[0.2em] uppercase transition-colors duration-300">Info</a>
          </nav>
          <div className="mt-16 text-xs text-gray-600 tracking-[0.3em]">INTO THE VOID</div>
        </div>

        {/* Background effects */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute -top-[10%] -left-[10%] w-[800px] h-[800px] bg-[#C6A85B]/10 rounded-full blur-[120px] mix-blend-screen" style={{ animation: 'pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-gray-700/20 rounded-full blur-[100px] mix-blend-screen" style={{ animation: 'pulse-slow 12s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C6A85B]/5 rounded-full blur-[150px] mix-blend-screen animate-pulse" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen opacity-80" />
        </div>

        {/* Main content */}
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">
          {/* Motto */}
          <h1 className="flex flex-col md:flex-row items-center justify-center gap-y-4 md:gap-y-0 md:gap-x-8 font-light text-sm md:text-lg tracking-[0.3em] md:tracking-[0.6em] uppercase mb-10 md:mb-16 shimmer-text opacity-90 w-full max-w-5xl mx-auto">
            <span className="whitespace-nowrap">Live Today</span>
            <div className="hidden md:block w-[1px] h-3 bg-gradient-to-b from-transparent via-[#C6A85B]/60 to-transparent shadow-[0_0_8px_rgba(198,168,91,0.6)]" />
            <span className="whitespace-nowrap">Love Tomorrow</span>
            <div className="hidden md:block w-[1px] h-3 bg-gradient-to-b from-transparent via-[#C6A85B]/60 to-transparent shadow-[0_0_8px_rgba(198,168,91,0.6)]" />
            <span className="whitespace-nowrap">Unite Forever</span>
          </h1>

          {/* Countdown card */}
          <div className="group relative w-full max-w-lg mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#C6A85B]/20 via-transparent to-[#C6A85B]/20 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition duration-1000" style={{ animation: 'pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div className="relative glass-panel rounded-[2rem] p-8 md:p-16 flex flex-col items-center justify-center min-h-[400px] md:min-h-[450px]">
              {/* Top ornament */}
              <div className="w-full flex items-center justify-center space-x-4 mb-8 md:mb-10 opacity-50">
                <div className="h-[1px] w-12 md:w-20 bg-gradient-to-r from-transparent to-[#C6A85B]" />
                <div className="w-2 h-2 rotate-45 border border-[#C6A85B]" style={{ animation: 'spin-slow 20s linear infinite' }} />
                <div className="h-[1px] w-12 md:w-20 bg-gradient-to-l from-transparent to-[#C6A85B]" />
              </div>

              <p className="text-[10px] md:text-xs tracking-[0.4em] text-gray-400 uppercase mb-6 md:mb-8 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                Days Until The Void
              </p>

              {/* Counter with reflection */}
              <div className="relative mb-6">
                <h2 className="font-thin text-7xl md:text-9xl text-gray-100 tracking-tighter relative z-10" style={{ animation: 'glow 4s ease-in-out infinite alternate', mixBlendMode: 'screen' }}>
                  {daysLeft}
                </h2>
                <h2 className="font-thin text-7xl md:text-9xl text-[#C6A85B] tracking-tighter absolute top-0 left-0 w-full opacity-20 blur-xl transform scale-110 pointer-events-none z-0">
                  {daysLeft}
                </h2>
                <h2 className="font-thin text-7xl md:text-9xl text-[#C6A85B] tracking-tighter absolute top-full left-0 w-full opacity-10 transform scale-y-[-0.8] blur-md pointer-events-none -mt-8 md:-mt-10 mask-image-gradient">
                  {daysLeft}
                </h2>
              </div>

              <p className="mt-6 md:mt-8 text-lg md:text-2xl text-gray-200 tracking-[0.2em] font-light drop-shadow-[0_0_10px_rgba(198,168,91,0.3)]">
                17 JULY 2026
              </p>

              <p className="mt-4 text-[10px] md:text-sm text-gray-500 tracking-widest uppercase opacity-80">
                The journey to the dream
              </p>
            </div>
          </div>

          {/* Vertical lines at bottom */}
          <div className="absolute bottom-0 left-0 w-full h-96 flex justify-between pointer-events-none px-4 md:px-32 z-0 opacity-20">
            <div className="w-[1px] h-full bg-gradient-to-t from-[#C6A85B] via-[#C6A85B]/20 to-transparent shadow-[0_0_15px_#C6A85B]" />
            <div className="w-[1px] h-full bg-gradient-to-t from-[#C6A85B] via-[#C6A85B]/20 to-transparent shadow-[0_0_15px_#C6A85B]" />
          </div>
        </main>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer z-20 group opacity-60 hover:opacity-100 transition-opacity" style={{ animation: 'float 10s ease-in-out infinite' }}>
          <span className="text-[9px] tracking-[0.3em] uppercase text-gray-500 group-hover:text-[#C6A85B] transition-colors drop-shadow-lg">Scroll to Explore</span>
          <svg className="w-4 h-4 mt-2 text-gray-500 group-hover:text-[#C6A85B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </>
  );
}
