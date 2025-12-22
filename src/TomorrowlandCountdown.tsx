import { useState, useEffect, useMemo } from "react";

interface TomorrowlandCountdownProps {
  /** Target date in YYYY-MM-DD format (local timezone). Default: 2026-07-17 (Tomorrowland 2026 - verify this date!) */
  targetDate?: string;
  /** Optional path to logo image (e.g., "/tomorrowland-logo.svg") */
  logoSrc?: string;
  /** Alt text for logo accessibility */
  logoAlt?: string;
}

export default function TomorrowlandCountdown({
  targetDate = "2026-07-17", // ⚠️ VERIFY: Tomorrowland 2026 typically occurs mid-July
  logoSrc,
  logoAlt = "Festival Logo",
}: TomorrowlandCountdownProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  /**
   * Calculate full days remaining between today (local midnight) and target date (local midnight)
   */
  const calcDaysLeft = (target: string): number => {
    const now = new Date();

    // today in UTC (date only)
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    // target in UTC (parse YYYY-MM-DD safely)
    const [y, m, d] = target.split("-").map(Number);
    const targetUtc = Date.UTC(y, (m ?? 1) - 1, d ?? 1);

    const diffDays = Math.round((targetUtc - todayUtc) / 86400000);
    return Math.max(0, diffDays);
  };

  useEffect(() => {
    setIsClient(true);

    // Initial calculation
    const updateDays = () => {
      setDaysLeft(calcDaysLeft(targetDate));
    };
    updateDays();

    // Schedule next update at local midnight
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
        // After first midnight update, schedule daily updates
        const dailyInterval = setInterval(updateDays, 24 * 60 * 60 * 1000);
        return () => clearInterval(dailyInterval);
      }, msUntilMidnight);
    };

    const timeoutId = scheduleNextUpdate();
    return () => {
      clearTimeout(timeoutId);
    };
  }, [targetDate]);

  // Generate floating orbs and spotlights
  const floatingOrbs = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
      size: 40 + Math.random() * 80,
      color: ["#ffd700", "#c471ed", "#ff6b9d", "#12cdea", "#58e8a9"][i % 5],
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 6,
      moveX: -30 + Math.random() * 60,
      moveY: -30 + Math.random() * 60,
    }));
  }, []);

  // Generate particle positions (memoized for performance)
  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 4,
      size: 2 + Math.random() * 3,
    }));
  }, []);

  if (!isClient || daysLeft === null) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(135deg, #000000 0%, #0a0a0a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#ffd700", fontSize: "1.5rem" }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }

        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2), 0 0 30px rgba(255, 215, 0, 0.1); }
          50% { text-shadow: 0 0 15px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 45px rgba(255, 215, 0, 0.2); }
        }

        @keyframes ornament-shine {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes orb-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.15;
          }
          50% { 
            transform: translate(var(--moveX), var(--moveY)) scale(1.3);
            opacity: 0.4;
          }
        }

        @keyframes spotlight-sweep {
          0%, 100% { 
            transform: translateX(-50%) rotate(0deg);
            opacity: 0.1;
          }
          50% { 
            transform: translateX(-50%) rotate(360deg);
            opacity: 0.25;
          }
        }

        @keyframes laser-sweep {
          0%, 100% { transform: translateX(-50%) translateY(-100%) rotate(-10deg); opacity: 0.15; }
          50% { transform: translateX(-50%) translateY(-100%) rotate(10deg); opacity: 0.3; }
        }

        @keyframes stage-glow {
          0%, 100% { box-shadow: 0 -10px 40px rgba(255, 215, 0, 0.15), 0 0 60px rgba(255, 215, 0, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.8); }
          50% { box-shadow: 0 -10px 50px rgba(255, 215, 0, 0.2), 0 0 80px rgba(255, 215, 0, 0.15), inset 0 0 30px rgba(0, 0, 0, 0.9); }
        }

        @keyframes crowd-pulse {
          0%, 100% { transform: scaleY(0.95); opacity: 0.2; }
          50% { transform: scaleY(1.05); opacity: 0.35; }
        }

        .tml-orb-container {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3;
          overflow: hidden;
        }

        .tml-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, currentColor, transparent 70%);
          filter: blur(20px);
          pointer-events: none;
        }

        .tml-spotlight {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(ellipse at center, currentColor 0%, transparent 70%);
          transform-origin: center;
          pointer-events: none;
          filter: blur(40px);
        }

        .tml-laser {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(ellipse at bottom, rgba(255, 215, 0, 0.15) 0%, transparent 60%);
          transform-origin: center;
          animation: spotlight-sweep 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 5;
          filter: blur(30px);
        }

        .tml-laser:nth-child(2) { animation-delay: 0.5s; filter: hue-rotate(60deg); }
        .tml-laser:nth-child(3) { animation-delay: 1s; filter: hue-rotate(120deg); }
        .tml-laser:nth-child(4) { animation-delay: 1.5s; filter: hue-rotate(180deg); }

        .tml-stage-columns {
          position: absolute;
          bottom: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1200px;
          height: 200px;
          display: flex;
          justify-content: space-between;
          z-index: 3;
          pointer-events: none;
        }

        .tml-column {
          width: 60px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(10, 10, 10, 0.4), rgba(0, 0, 0, 0.9));
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-bottom: none;
          position: relative;
        }

        .tml-column::before {
          content: '';
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 30px;
          background: linear-gradient(135deg, rgba(20, 20, 20, 0.5), rgba(0, 0, 0, 0.9));
          border: 1px solid rgba(255, 215, 0, 0.2);
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
        }

        .tml-crowd {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 150px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
          z-index: 2;
          overflow: hidden;
        }

        .tml-crowd::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60%;
          background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 100\"><path fill=\"rgba(255,215,0,0.2)\" d=\"M0,50 Q50,30 100,50 T200,50 T300,50 T400,50 T500,50 T600,50 T700,50 T800,50 T900,50 T1000,50 T1100,50 T1200,50 L1200,100 L0,100 Z\"/></svg>');
          background-size: cover;
          background-repeat: repeat-x;
          animation: crowd-pulse 2s ease-in-out infinite;
        }

        .tml-audio-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 215, 0, 0.2);
          border: 2px solid rgba(255, 215, 0, 0.5);
          color: #ffd700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          transition: all 0.3s ease;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .tml-audio-btn:hover {
          background: rgba(255, 215, 0, 0.3);
          transform: scale(1.1);
        }

        .tml-audio-btn:not(.playing) {
          animation: bounce-pulse 2s ease-in-out infinite;
        }

        .tml-audio-btn.playing {
          background: rgba(255, 215, 0, 0.4);
          animation: glow-pulse 2s ease-in-out infinite;
        }

        @keyframes bounce-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tml-particle, .tml-orb, .tml-spotlight {
            animation: none !important;
            opacity: 0 !important;
          }
          .tml-days-number {
            animation: none !important;
          }
          .tml-ornament {
            animation: none !important;
          }
        }media (prefers-reduced-motion: reduce) {
          .tml-particle {
            animation: none !important;
            opacity: 0 !important;
          }
          .tml-days-number {
            animation: none !important;
          }
          .tml-ornament {
            animation: none !important;
          }
        }

        .tml-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: 
            radial-gradient(circle at 20% 80%, rgba(20, 20, 20, 0.8) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(30, 30, 30, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(40, 40, 40, 0.3) 0%, transparent 70%),
            linear-gradient(180deg, #000000 0%, #0a0a0a 25%, #1a1a1a 50%, #0d0d0d 75%, #000000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .tml-logo-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(1.3);
          width: 85%;
          max-width: 700px;
          height: 85%;
          max-height: 700px;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.12;
          filter: blur(0.5px) drop-shadow(0 0 40px rgba(255, 215, 0, 0.2));
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 1;
          animation: logo-pulse 8s ease-in-out infinite;
        }

        @keyframes logo-pulse {
          0%, 100% { opacity: 0.12; transform: translate(-50%, -50%) scale(1.3); }
          50% { opacity: 0.18; transform: translate(-50%, -50%) scale(1.35); }
        }

        @keyframes motto-fade-in {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes motto-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.2); }
          50% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.2); }
        }

        .tml-motto {
          position: absolute;
          top: 5%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 15;
          text-align: center;
          font-size: clamp(1rem, 2.5vw, 1.8rem);
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #ffd700;
          display: flex;
          gap: clamp(0.4rem, 1.5vw, 0.8rem);
          flex-wrap: nowrap;
          justify-content: center;
          padding: 0 2rem;
          max-width: 95%;
        }

        .tml-motto-word {
          opacity: 0;
          animation: motto-fade-in 1s ease-out forwards, motto-glow 3s ease-in-out infinite;
          white-space: nowrap;
        }

        .tml-motto-word:nth-child(1) { animation-delay: 0s, 0s; }
        .tml-motto-word:nth-child(2) { animation-delay: 0.3s, 0.3s; }
        .tml-motto-word:nth-child(3) { animation-delay: 0.6s, 0.6s; }
        .tml-motto-word:nth-child(4) { animation-delay: 0.9s, 0.9s; }
        .tml-motto-word:nth-child(5) { animation-delay: 1.2s, 1.2s; }
        .tml-motto-word:nth-child(6) { animation-delay: 1.5s, 1.5s; }

        @media (max-width: 768px) {
          .tml-motto {
            top: 8%;
            font-size: clamp(1.1rem, 3vw, 1.6rem);
            gap: clamp(0.4rem, 1.5vw, 0.7rem);
            letter-spacing: 0.1em;
          }
        }

        @media (max-width: 480px) {
          .tml-motto {
            top: 6%;
            font-size: clamp(0.9rem, 3.5vw, 1.3rem);
            gap: 0.3rem;
            letter-spacing: 0.08em;
            padding: 0 0.5rem;
          }
        }

        .tml-fallback-emblem {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          opacity: 0.06;
          pointer-events: none;
          z-index: 1;
        }

        .tml-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 215, 0, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
        }

        .tml-card {
          position: relative;
          z-index: 10;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 215, 0, 0.25);
          border-radius: 30px;
          padding: 4rem 6rem;
          backdrop-filter: blur(15px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 215, 0, 0.15);
          text-align: center;
          max-width: 90%;
          animation: stage-glow 3s ease-in-out infinite;
          margin-top: -28vh;
        }

        .tml-ornament {
          width: 200px;
          height: 40px;
          margin: 0 auto;
          opacity: 0.6;
          animation: ornament-shine 3s ease-in-out infinite;
        }

        .tml-ornament-top {
          margin-bottom: 2rem;
        }

        .tml-ornament-bottom {
          margin-top: 2rem;
        }

        .tml-label {
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ffd700;
          margin-bottom: 1rem;
          opacity: 0.9;
        }

        .tml-days-number {
          font-size: clamp(6rem, 20vw, 12rem);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(180deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0.5rem 0;
          animation: glow-pulse 3s ease-in-out infinite;
        }

        .tml-subtitle {
          font-size: 1.5rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: rgba(255, 215, 0, 0.8);
          margin-top: 1rem;
        }

        .tml-footer {
          margin-top: 2.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.05em;
        }

        @media (max-width: 768px) {
          .tml-card {
            padding: 2rem 3rem;
            margin-top: -23vh;
          }
          .tml-label {
            font-size: 1rem;
          }
          .tml-subtitle {
            font-size: 1.125rem;
          }
        }
      `,
        }}
      />

      <div
        className="tml-container"
        role="main"
        aria-label="Festival Countdown"
      >
        {/* Laser lights */}
        <div className="tml-laser" aria-hidden="true" />
        <div
          className="tml-laser"
          aria-hidden="true"
          style={{
            animationDelay: "1.5s",
            filter: "blur(30px) hue-rotate(120deg)",
          }}
        />
        <div
          className="tml-laser"
          aria-hidden="true"
          style={{
            animationDelay: "3s",
            filter: "blur(30px) hue-rotate(240deg)",
          }}
        />

        {/* Stage columns (Freedom Stage architecture) */}
        <div className="tml-stage-columns" aria-hidden="true">
          <div className="tml-column" />
          <div className="tml-column" />
          <div className="tml-column" />
          <div className="tml-column" />
        </div>

        {/* Crowd silhouette */}
        <div className="tml-crowd" aria-hidden="true" />

        {/* Logo watermark or fallback emblem */}
        {logoSrc ? (
          <div
            className="tml-logo-watermark"
            style={{ backgroundImage: `url(${logoSrc})` }}
            role="img"
            aria-label={logoAlt}
          />
        ) : (
          <svg
            className="tml-fallback-emblem"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Abstract festival emblem - non-branded */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(255, 215, 0, 0.3)"
              strokeWidth="2"
            />
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="rgba(147, 51, 234, 0.3)"
              strokeWidth="2"
            />
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="none"
              stroke="rgba(255, 215, 0, 0.3)"
              strokeWidth="2"
            />
            <path
              d="M 100 20 L 110 60 L 150 60 L 120 85 L 130 125 L 100 100 L 70 125 L 80 85 L 50 60 L 90 60 Z"
              fill="rgba(255, 215, 0, 0.2)"
              stroke="rgba(255, 215, 0, 0.4)"
              strokeWidth="1"
            />
          </svg>
        )}

        {/* Animated dust particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="tml-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float ${p.duration}s linear ${p.delay}s infinite`,
            }}
            aria-hidden="true"
          />
        ))}

        {/* Floating orbs effect */}
        <div className="tml-orb-container" aria-hidden="true">
          {floatingOrbs.map((orb) => (
            <div
              key={`orb-${orb.id}`}
              className="tml-orb"
              style={{
                left: `${orb.left}%`,
                top: `${orb.top}%`,
                width: `${orb.size}px`,
                height: `${orb.size}px`,
                color: orb.color,
                // @ts-ignore
                "--moveX": `${orb.moveX}px`,
                "--moveY": `${orb.moveY}px`,
                animation: `orb-float ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Tomorrowland Motto */}
        <div className="tml-motto" aria-label="Tomorrowland Motto">
          <span className="tml-motto-word">LIVE</span>
          <span className="tml-motto-word">TODAY</span>
          <span className="tml-motto-word">LOVE</span>
          <span className="tml-motto-word">TOMORROW</span>
          <span className="tml-motto-word">UNITE</span>
          <span className="tml-motto-word">FOREVER</span>
        </div>

        {/* Main countdown card */}
        <div className="tml-card">
          {/* Top ornament */}
          <svg
            className="tml-ornament tml-ornament-top"
            viewBox="0 0 200 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 10 20 Q 50 10, 100 20 T 190 20"
              fill="none"
              stroke="url(#grad1)"
              strokeWidth="2"
            />
            <circle cx="100" cy="20" r="4" fill="#ffd700" />
            <circle cx="50" cy="15" r="2" fill="#ffd700" opacity="0.6" />
            <circle cx="150" cy="15" r="2" fill="#ffd700" opacity="0.6" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffd700" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#ffd700" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffd700" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          <div className="tml-label" role="heading" aria-level={1}>
            Days Until
          </div>

          <div
            className="tml-days-number"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${daysLeft} days remaining`}
          >
            {daysLeft}
          </div>

          <div className="tml-subtitle" role="heading" aria-level={2}>
            17 JULY {targetDate.split("-")[0]}
          </div>

          <div className="tml-footer">The Journey to The Dream Begins</div>

          {/* Bottom ornament */}
          <svg
            className="tml-ornament tml-ornament-bottom"
            viewBox="0 0 200 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 10 20 Q 50 30, 100 20 T 190 20"
              fill="none"
              stroke="url(#grad2)"
              strokeWidth="2"
            />
            <circle cx="100" cy="20" r="4" fill="#ffd700" />
            <circle cx="30" cy="25" r="2" fill="#ffd700" opacity="0.6" />
            <circle cx="170" cy="25" r="2" fill="#ffd700" opacity="0.6" />
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffd700" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#ffd700" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffd700" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </>
  );
}
