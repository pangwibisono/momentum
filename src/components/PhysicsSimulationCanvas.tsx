import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CollisionMode, CollisionType, PresetScenario, ObjectVisualType } from '../types/physics';
import { PRESET_SCENARIOS } from '../data/physicsData';
import { MathView } from './MathView';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Activity, 
  Layers, 
  Sparkles, 
  Maximize2,
  Sliders,
  CheckCircle,
  HelpCircle,
  Eye,
  Settings2
} from 'lucide-react';

interface PhysicsSimulationCanvasProps {
  isPresentationMode: boolean;
  externalMass?: number;
  externalVelocity?: number;
  externalObjectType?: ObjectVisualType;
}

export const PhysicsSimulationCanvas: React.FC<PhysicsSimulationCanvasProps> = ({
  isPresentationMode,
  externalMass,
  externalVelocity,
  externalObjectType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulation Modes & States
  const [mode, setMode] = useState<CollisionMode>('single');
  const [collisionType, setCollisionType] = useState<CollisionType>('elastic'); // elastic (e=1), inelastic (e=0.5), sticky (e=0)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 0.25, 0.5, 1, 2
  const [wallBounce, setWallBounce] = useState<boolean>(true);
  const [objectVisual1, setObjectVisual1] = useState<ObjectVisualType>('cart');
  const [objectVisual2, setObjectVisual2] = useState<ObjectVisualType>('cart');

  // Display toggles
  const [showMomentumVector, setShowMomentumVector] = useState<boolean>(true);
  const [showVelocityVector, setShowVelocityVector] = useState<boolean>(true);
  const [showGridRuler, setShowGridRuler] = useState<boolean>(true);
  const [showTrail, setShowTrail] = useState<boolean>(true);

  // Object 1 Parameters
  const [m1, setM1] = useState<number>(4); // kg
  const [v1, setV1] = useState<number>(5); // m/s
  // Object 2 Parameters (for collision mode)
  const [m2, setM2] = useState<number>(2); // kg
  const [v2, setV2] = useState<number>(-3); // m/s

  // Synchronize when external values are passed from Calculator
  useEffect(() => {
    if (externalMass !== undefined && externalMass > 0) {
      setM1(Math.min(50, Math.max(0.5, externalMass)));
    }
    if (externalVelocity !== undefined) {
      setV1(Math.min(20, Math.max(-20, externalVelocity)));
    }
    if (externalObjectType) {
      setObjectVisual1(externalObjectType);
    }
  }, [externalMass, externalVelocity, externalObjectType]);

  // Dynamic simulation internal physics states (track position in virtual meters)
  // Let the track width be 16 meters (from -8m to +8m or 0m to 16m)
  const trackLengthMeters = 16;
  const pos1Ref = useRef<number>(3.5); // meters from left
  const vel1Ref = useRef<number>(v1);
  const pos2Ref = useRef<number>(11.5); // meters from left
  const vel2Ref = useRef<number>(v2);

  // Visual effects: Flash ring on collision
  const impactRingsRef = useRef<{ x: number; y: number; radius: number; alpha: number; color: string }[]>([]);
  // Motion trail
  const trailRef = useRef<{ x1: number; x2: number; alpha: number }[]>([]);

  // Telemetry statistics
  const [telemetry, setTelemetry] = useState({
    p1: 0,
    p2: 0,
    pTotal: 0,
    ek1: 0,
    ek2: 0,
    ekTotal: 0,
    initialPTotal: 0,
    collisionOccurred: false,
    collisionCount: 0,
  });

  const initialPTotalRef = useRef<number>(0);
  const collisionCountRef = useRef<number>(0);

  // Update initial reference when inputs change
  const resetSimulation = useCallback(() => {
    if (mode === 'single') {
      pos1Ref.current = 4;
      vel1Ref.current = v1;
      pos2Ref.current = 12;
      vel2Ref.current = 0;
      initialPTotalRef.current = m1 * v1;
    } else {
      pos1Ref.current = 3.5;
      vel1Ref.current = v1;
      pos2Ref.current = 11.5;
      vel2Ref.current = v2;
      initialPTotalRef.current = m1 * v1 + m2 * v2;
    }
    trailRef.current = [];
    impactRingsRef.current = [];
    collisionCountRef.current = 0;

    setTelemetry({
      p1: m1 * vel1Ref.current,
      p2: mode === 'two_carts' ? m2 * vel2Ref.current : 0,
      pTotal: initialPTotalRef.current,
      ek1: 0.5 * m1 * vel1Ref.current * vel1Ref.current,
      ek2: mode === 'two_carts' ? 0.5 * m2 * vel2Ref.current * vel2Ref.current : 0,
      ekTotal: 0.5 * m1 * vel1Ref.current * vel1Ref.current + (mode === 'two_carts' ? 0.5 * m2 * vel2Ref.current * vel2Ref.current : 0),
      initialPTotal: initialPTotalRef.current,
      collisionOccurred: false,
      collisionCount: 0,
    });
  }, [mode, m1, v1, m2, v2]);

  // Reset when key parameters change
  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Apply a preset
  const handleApplyPreset = (preset: PresetScenario) => {
    setMode(preset.mode);
    setM1(preset.m1);
    setV1(preset.v1);
    if (preset.m2 !== undefined) setM2(preset.m2);
    if (preset.v2 !== undefined) setV2(preset.v2);
    if (preset.collisionType) setCollisionType(preset.collisionType);
    if (preset.object1) setObjectVisual1(preset.object1);
    if (preset.object2) setObjectVisual2(preset.object2);
    setIsPlaying(true);
  };

  // Keyboard shortcut listener: Space to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // STEP FRAME FUNCTION
  const stepFrame = useCallback((dt: number = 0.03) => {
    // Physical dimensions based on mass and visual type
    const getCartWidth = (m: number, visual: ObjectVisualType) => {
      if (visual === 'ball') return Math.min(2.0, Math.max(1.0, 0.8 + Math.cbrt(m) * 0.25));
      if (visual === 'runner') return 1.3;
      if (visual === 'car') return Math.min(2.5, Math.max(1.6, 1.4 + Math.cbrt(m) * 0.3));
      if (visual === 'truck') return Math.min(3.2, Math.max(2.2, 2.0 + Math.cbrt(m) * 0.3));
      if (visual === 'bullet') return 1.0;
      return Math.min(2.4, Math.max(1.0, 0.8 + Math.cbrt(m) * 0.45));
    };
    const w1 = getCartWidth(m1, objectVisual1);
    const w2 = getCartWidth(m2, objectVisual2);

    const trackLeft = 0.6;
    const trackRight = trackLengthMeters - 0.6;

    // Move cart 1
    pos1Ref.current += vel1Ref.current * dt;

    if (mode === 'two_carts') {
      pos2Ref.current += vel2Ref.current * dt;

      // Check collision between Cart 1 and Cart 2
      // Collision condition: distance between centers <= (w1 + w2)/2 and they are moving toward each other
      const dist = pos2Ref.current - pos1Ref.current;
      const minDistance = (w1 + w2) / 2;

      if (dist <= minDistance && (vel1Ref.current - vel2Ref.current) > 0) {
        // Impact occurred!
        collisionCountRef.current += 1;

        // Coefficient of restitution
        let e = 1.0;
        if (collisionType === 'inelastic') e = 0.5;
        if (collisionType === 'sticky') e = 0.0;

        const u1 = vel1Ref.current;
        const u2 = vel2Ref.current;

        if (e === 0.0) {
          // Sticky collision: both move with same final velocity
          const vCommon = (m1 * u1 + m2 * u2) / (m1 + m2);
          vel1Ref.current = vCommon;
          vel2Ref.current = vCommon;
        } else {
          // 1D Collision formulas with coefficient of restitution e
          // v1' = ((m1 - e*m2)*u1 + (1 + e)*m2*u2) / (m1 + m2)
          // v2' = ((m2 - e*m1)*u2 + (1 + e)*m1*u1) / (m1 + m2)
          const newV1 = ((m1 - e * m2) * u1 + (1 + e) * m2 * u2) / (m1 + m2);
          const newV2 = ((m2 - e * m1) * u2 + (1 + e) * m1 * u1) / (m1 + m2);
          vel1Ref.current = newV1;
          vel2Ref.current = newV2;
        }

        // Separate carts slightly so they don't overlap
        const midPoint = (pos1Ref.current + pos2Ref.current) / 2;
        pos1Ref.current = midPoint - minDistance / 2;
        pos2Ref.current = midPoint + minDistance / 2;

        // Spawn visual shockwave impact ring
        impactRingsRef.current.push({
          x: midPoint,
          y: 0,
          radius: 5,
          alpha: 1.0,
          color: '#f59e0b',
        });
      }

      // Wall bounce Cart 2
      if (wallBounce) {
        if (pos2Ref.current + w2 / 2 >= trackRight && vel2Ref.current > 0) {
          vel2Ref.current = -vel2Ref.current;
          pos2Ref.current = trackRight - w2 / 2;
          impactRingsRef.current.push({ x: trackRight, y: 0, radius: 4, alpha: 0.9, color: '#3b82f6' });
        } else if (pos2Ref.current - w2 / 2 <= trackLeft && vel2Ref.current < 0) {
          vel2Ref.current = -vel2Ref.current;
          pos2Ref.current = trackLeft + w2 / 2;
          impactRingsRef.current.push({ x: trackLeft, y: 0, radius: 4, alpha: 0.9, color: '#3b82f6' });
        }
      }
    }

    // Wall bounce Cart 1
    if (wallBounce) {
      if (pos1Ref.current - w1 / 2 <= trackLeft && vel1Ref.current < 0) {
        vel1Ref.current = -vel1Ref.current;
        pos1Ref.current = trackLeft + w1 / 2;
        impactRingsRef.current.push({ x: trackLeft, y: 0, radius: 4, alpha: 0.9, color: '#ef4444' });
      } else if (pos1Ref.current + w1 / 2 >= trackRight && vel1Ref.current > 0) {
        vel1Ref.current = -vel1Ref.current;
        pos1Ref.current = trackRight - w1 / 2;
        impactRingsRef.current.push({ x: trackRight, y: 0, radius: 4, alpha: 0.9, color: '#ef4444' });
      }
    } else {
      // Loop around if wall bounce is off
      if (pos1Ref.current > trackLengthMeters + 1) pos1Ref.current = -1;
      if (pos1Ref.current < -1) pos1Ref.current = trackLengthMeters + 1;
      if (mode === 'two_carts') {
        if (pos2Ref.current > trackLengthMeters + 1) pos2Ref.current = -1;
        if (pos2Ref.current < -1) pos2Ref.current = trackLengthMeters + 1;
      }
    }

    // Record trail
    if (showTrail) {
      trailRef.current.push({
        x1: pos1Ref.current,
        x2: pos2Ref.current,
        alpha: 0.4,
      });
      if (trailRef.current.length > 25) trailRef.current.shift();
    }

    // Update Telemetry
    const currP1 = m1 * vel1Ref.current;
    const currP2 = mode === 'two_carts' ? m2 * vel2Ref.current : 0;
    const currPTotal = currP1 + currP2;
    const currEk1 = 0.5 * m1 * vel1Ref.current * vel1Ref.current;
    const currEk2 = mode === 'two_carts' ? 0.5 * m2 * vel2Ref.current * vel2Ref.current : 0;

    setTelemetry({
      p1: currP1,
      p2: currP2,
      pTotal: currPTotal,
      ek1: currEk1,
      ek2: currEk2,
      ekTotal: currEk1 + currEk2,
      initialPTotal: initialPTotalRef.current,
      collisionOccurred: collisionCountRef.current > 0,
      collisionCount: collisionCountRef.current,
    });
  }, [m1, m2, mode, collisionType, wallBounce, showTrail]);

  // MAIN ANIMATION LOOP
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dtRaw = (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(0.1, dtRaw) * simSpeed;

      if (isPlaying) {
        stepFrame(dt);
      }

      // Draw onto canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Canvas dimensions
          const dpr = window.devicePixelRatio || 1;
          const displayWidth = canvas.clientWidth;
          const displayHeight = canvas.clientHeight;

          if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
          }

          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, displayWidth, displayHeight);

          // World coordinate mapping
          const marginX = 40;
          const usableWidth = displayWidth - marginX * 2;
          const scaleX = usableWidth / trackLengthMeters; // px per meter
          const trackY = displayHeight * 0.58; // baseline of track

          // 1. Draw Background Grid & Atmosphere
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, displayWidth, displayHeight);

          // Draw subtle grid lines
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          for (let x = marginX; x <= displayWidth - marginX; x += scaleX) {
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.lineTo(x, displayHeight - 20);
            ctx.stroke();
          }

          // 2. Draw Track (Air-Track / Frictionless Linear Rail)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(marginX - 10, trackY, usableWidth + 20, 16);

          // Track top metallic reflection
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(marginX - 10, trackY, usableWidth + 20, 3);

          // Left and Right End Bumpers / Walls
          if (wallBounce) {
            ctx.fillStyle = '#475569';
            // Left Wall
            ctx.fillRect(marginX - 20, trackY - 60, 16, 76);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(marginX - 4, trackY - 45, 6, 45); // elastic bumper pad

            // Right Wall
            ctx.fillStyle = '#475569';
            ctx.fillRect(displayWidth - marginX + 4, trackY - 60, 16, 76);
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(displayWidth - marginX - 2, trackY - 45, 6, 45); // elastic bumper pad
          }

          // 3. Draw Ruler Marks & Scale
          if (showGridRuler) {
            ctx.fillStyle = '#64748b';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            for (let m = 0; m <= trackLengthMeters; m += 2) {
              const rx = marginX + m * scaleX;
              ctx.beginPath();
              ctx.moveTo(rx, trackY + 16);
              ctx.lineTo(rx, trackY + 26);
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.fillText(`${m}m`, rx, trackY + 38);
            }
          }

          // Helper for meters to pixels
          const meterToPx = (meter: number) => marginX + meter * scaleX;

          // 4. Draw Motion Trails (Ghosting)
          if (showTrail) {
            trailRef.current.forEach((t, idx) => {
              const alpha = (idx / trailRef.current.length) * 0.25;
              ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
              ctx.beginPath();
              ctx.arc(meterToPx(t.x1), trackY - 25, 4, 0, Math.PI * 2);
              ctx.fill();

              if (mode === 'two_carts') {
                ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`;
                ctx.beginPath();
                ctx.arc(meterToPx(t.x2), trackY - 25, 4, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }

          // 5. Draw Helper function for Custom Visual Objects
          const drawBody = (
            centerX: number,
            massVal: number,
            velVal: number,
            colorTheme: { body: string; border: string; accent: string },
            labelTitle: string,
            visual: ObjectVisualType
          ) => {
            const pxX = meterToPx(centerX);
            const facing = velVal >= 0 ? 1 : -1;
            let bodyTop = trackY - 45;

            ctx.save();

            if (visual === 'ball') {
              // ⚽ BOLA SEPAK (SOCCER BALL)
              const radius = Math.min(32, Math.max(16, 14 + Math.cbrt(massVal) * 3));
              const ballCenterY = trackY - radius;
              bodyTop = ballCenterY - radius;
              const rotation = (centerX * scaleX) / radius;

              // Contact drop shadow on track
              ctx.beginPath();
              ctx.ellipse(pxX, trackY + 1, radius * 0.75, 3.5, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
              ctx.fill();

              // Ball body with rotation
              ctx.save();
              ctx.translate(pxX, ballCenterY);
              ctx.rotate(rotation);

              // Base white sphere
              ctx.beginPath();
              ctx.arc(0, 0, radius, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Center black pentagon
              const pR = radius * 0.38;
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const vx = pR * Math.cos(a);
                const vy = pR * Math.sin(a);
                if (i === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
              }
              ctx.closePath();
              ctx.fillStyle = '#1e293b';
              ctx.fill();

              // Outer patch seam lines & edge patches
              for (let i = 0; i < 5; i++) {
                const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const a2 = ((i + 1) * 2 * Math.PI) / 5 - Math.PI / 2;
                const p1x = pR * Math.cos(a1);
                const p1y = pR * Math.sin(a1);
                const pEdgeX = radius * Math.cos(a1);
                const pEdgeY = radius * Math.sin(a1);

                ctx.beginPath();
                ctx.moveTo(p1x, p1y);
                ctx.lineTo(pEdgeX, pEdgeY);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1.8;
                ctx.stroke();

                // Outer edge patch arc
                ctx.beginPath();
                ctx.arc(0, 0, radius, a1 - 0.2, a1 + 0.2);
                ctx.lineTo(pR * 1.5 * Math.cos(a1), pR * 1.5 * Math.sin(a1));
                ctx.closePath();
                ctx.fillStyle = '#1e293b';
                ctx.fill();
              }

              ctx.restore();

              // Specular 3D highlight (stays on top-left regardless of spin)
              ctx.beginPath();
              ctx.arc(pxX - radius * 0.35, ballCenterY - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.fill();

            } else if (visual === 'runner') {
              // 🏃 PELARI CEPAT (SPRINTER)
              const runnerH = Math.min(68, Math.max(50, 46 + Math.cbrt(massVal) * 3));
              bodyTop = trackY - runnerH;
              const isMoving = Math.abs(velVal) > 0.05;
              const phase = isMoving ? centerX * 8 : 0;
              const legSwing = Math.sin(phase);
              const armSwing = Math.cos(phase);

              // Ground shadow
              ctx.beginPath();
              ctx.ellipse(pxX, trackY + 1, 16, 3.5, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
              ctx.fill();

              ctx.save();
              ctx.translate(pxX, trackY);
              ctx.scale(facing, 1);

              // Back leg & shoe
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(-2, -runnerH * 0.44);
              ctx.lineTo(-legSwing * 12 - 4, -runnerH * 0.22);
              ctx.lineTo(-legSwing * 18 - 6, -3);
              ctx.stroke();

              ctx.fillStyle = '#ea580c';
              ctx.beginPath();
              ctx.ellipse(-legSwing * 18 - 6, -2, 5.5, 2.5, 0, 0, Math.PI * 2);
              ctx.fill();

              // Back arm
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(0, -runnerH * 0.72);
              ctx.lineTo(-armSwing * 12 - 4, -runnerH * 0.58);
              ctx.lineTo(-armSwing * 16 - 8, -runnerH * 0.46);
              ctx.stroke();

              // Torso & Jersey
              ctx.fillStyle = colorTheme.body;
              ctx.beginPath();
              ctx.moveTo(-6, -runnerH * 0.42);
              ctx.lineTo(6, -runnerH * 0.42);
              ctx.lineTo(8, -runnerH * 0.76);
              ctx.lineTo(-6, -runnerH * 0.76);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = colorTheme.border;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Shorts
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(-7, -runnerH * 0.46, 14, runnerH * 0.12);

              // Head & Headband
              ctx.fillStyle = '#fed7aa'; // skin tone
              ctx.beginPath();
              ctx.arc(3, -runnerH * 0.88, 7.5, 0, Math.PI * 2);
              ctx.fill();

              // Hair
              ctx.fillStyle = '#1e293b';
              ctx.beginPath();
              ctx.arc(1, -runnerH * 0.92, 7, Math.PI * 0.7, Math.PI * 1.8);
              ctx.fill();

              // Headband
              ctx.fillStyle = colorTheme.accent;
              ctx.fillRect(-2, -runnerH * 0.92, 10, 3);

              // Front leg & shoe
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.moveTo(2, -runnerH * 0.44);
              ctx.lineTo(legSwing * 14 + 4, -runnerH * 0.22);
              ctx.lineTo(legSwing * 18 + 6, -3);
              ctx.stroke();

              ctx.fillStyle = '#ea580c';
              ctx.beginPath();
              ctx.ellipse(legSwing * 18 + 6, -2, 5.5, 2.5, 0, 0, Math.PI * 2);
              ctx.fill();

              // Front arm
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(4, -runnerH * 0.72);
              ctx.lineTo(armSwing * 14 + 6, -runnerH * 0.58);
              ctx.lineTo(armSwing * 18 + 10, -runnerH * 0.46);
              ctx.stroke();

              ctx.restore();

            } else if (visual === 'car') {
              // 🚗 MOBIL SEDAN (STREAMLINED CAR)
              const carW = Math.min(105, Math.max(72, 65 + Math.cbrt(massVal) * 5));
              const carH = 34 + Math.cbrt(massVal) * 2;
              bodyTop = trackY - carH - 8;

              // Ground shadow
              ctx.beginPath();
              ctx.ellipse(pxX, trackY + 1, carW * 0.52, 4, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
              ctx.fill();

              ctx.save();
              ctx.translate(pxX, trackY);
              ctx.scale(facing, 1);

              // Car chassis & body
              ctx.fillStyle = colorTheme.body;
              ctx.strokeStyle = colorTheme.border;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(-carW * 0.48, -10);
              ctx.lineTo(-carW * 0.48, -carH * 0.48);
              ctx.lineTo(-carW * 0.30, -carH * 0.52);
              ctx.lineTo(-carW * 0.16, -carH);
              ctx.lineTo(carW * 0.14, -carH);
              ctx.lineTo(carW * 0.32, -carH * 0.48);
              ctx.lineTo(carW * 0.48, -carH * 0.40);
              ctx.lineTo(carW * 0.48, -10);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Windows
              ctx.fillStyle = '#7dd3fc';
              ctx.beginPath();
              ctx.moveTo(-carW * 0.13, -carH * 0.90);
              ctx.lineTo(-carW * 0.02, -carH * 0.90);
              ctx.lineTo(-carW * 0.02, -carH * 0.54);
              ctx.lineTo(-carW * 0.24, -carH * 0.54);
              ctx.closePath();
              ctx.fill();

              ctx.beginPath();
              ctx.moveTo(carW * 0.02, -carH * 0.90);
              ctx.lineTo(carW * 0.11, -carH * 0.90);
              ctx.lineTo(carW * 0.26, -carH * 0.54);
              ctx.lineTo(carW * 0.02, -carH * 0.54);
              ctx.closePath();
              ctx.fill();

              // Headlight
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.roundRect(carW * 0.42, -carH * 0.42, carW * 0.06, 7, [1, 3, 3, 1]);
              ctx.fill();

              // Taillight
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.roundRect(-carW * 0.48, -carH * 0.46, 5, 7, [3, 1, 1, 3]);
              ctx.fill();

              // Wheels
              const wheelR = 8;
              const wheelRot = (centerX * scaleX) / wheelR;
              [-carW * 0.28, carW * 0.28].forEach((wx) => {
                ctx.save();
                ctx.translate(wx, -wheelR + 1);
                ctx.rotate(wheelRot);
                ctx.beginPath();
                ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = '#cbd5e1';
                ctx.fill();
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
                ctx.moveTo(0, -4); ctx.lineTo(0, 4);
                ctx.stroke();
                ctx.restore();
              });

              ctx.restore();

            } else if (visual === 'truck') {
              // 🚛 TRUK GANDENG / KARGO
              const truckW = Math.min(136, Math.max(94, 85 + Math.cbrt(massVal) * 5));
              const truckH = 48 + Math.cbrt(massVal) * 2.5;
              bodyTop = trackY - truckH - 8;

              // Ground shadow
              ctx.beginPath();
              ctx.ellipse(pxX, trackY + 1, truckW * 0.52, 4.5, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
              ctx.fill();

              ctx.save();
              ctx.translate(pxX, trackY);
              ctx.scale(facing, 1);

              const cabW = truckW * 0.32;
              const cargoW = truckW * 0.63;
              const cargoX = -truckW * 0.48;

              // Cargo Box Trailer
              ctx.fillStyle = '#475569';
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(cargoX, -truckH, cargoW, truckH - 8, 3);
              ctx.fill();
              ctx.stroke();

              // Corrugated panel ribs
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 1.5;
              for (let i = 1; i < 5; i++) {
                const rx = cargoX + (cargoW * i) / 5;
                ctx.beginPath();
                ctx.moveTo(rx, -truckH + 4);
                ctx.lineTo(rx, -12);
                ctx.stroke();
              }

              // Truck Cab
              const cabX = cargoX + cargoW + 4;
              ctx.fillStyle = colorTheme.body;
              ctx.strokeStyle = colorTheme.border;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(cabX, -10);
              ctx.lineTo(cabX + cabW, -10);
              ctx.lineTo(cabX + cabW, -truckH * 0.65);
              ctx.lineTo(cabX + cabW * 0.68, -truckH * 0.88);
              ctx.lineTo(cabX, -truckH * 0.88);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Cab Windshield
              ctx.fillStyle = '#7dd3fc';
              ctx.beginPath();
              ctx.moveTo(cabX + cabW * 0.15, -truckH * 0.84);
              ctx.lineTo(cabX + cabW * 0.65, -truckH * 0.84);
              ctx.lineTo(cabX + cabW * 0.90, -truckH * 0.68);
              ctx.lineTo(cabX + cabW * 0.15, -truckH * 0.68);
              ctx.closePath();
              ctx.fill();

              // Headlight
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(cabX + cabW - 3, -truckH * 0.36, 4, 8);

              // 3 Sets of heavy-duty wheels
              const wheelR = 9;
              const wheelRot = (centerX * scaleX) / wheelR;
              [cargoX + 16, cargoX + 38, cabX + cabW * 0.6].forEach((wx) => {
                ctx.save();
                ctx.translate(wx, -wheelR + 1);
                ctx.rotate(wheelRot);
                ctx.beginPath();
                ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = '#94a3b8';
                ctx.fill();
                ctx.restore();
              });

              ctx.restore();

            } else if (visual === 'bullet') {
              // 🔫 PELURU CEPAT (SUPERSONIC BULLET)
              const bulletW = Math.min(48, Math.max(30, 26 + Math.cbrt(massVal) * 3));
              const bulletH = 16 + Math.cbrt(massVal) * 2;
              const centerY = trackY - 26;
              bodyTop = centerY - bulletH / 2;

              ctx.save();
              ctx.translate(pxX, centerY);
              ctx.scale(facing, 1);

              // High-speed sonic wake trails
              if (Math.abs(velVal) > 0.1) {
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-bulletW * 0.5, -bulletH * 0.3);
                ctx.lineTo(-bulletW * 1.5, -bulletH * 0.8);
                ctx.moveTo(-bulletW * 0.5, bulletH * 0.3);
                ctx.lineTo(-bulletW * 1.5, bulletH * 0.8);
                ctx.moveTo(-bulletW * 0.6, 0);
                ctx.lineTo(-bulletW * 1.8, 0);
                ctx.stroke();
              }

              // Gradient brass bullet
              const grad = ctx.createLinearGradient(0, -bulletH / 2, 0, bulletH / 2);
              grad.addColorStop(0, '#fef08a');
              grad.addColorStop(0.4, '#f59e0b');
              grad.addColorStop(1, '#9a3412');
              ctx.fillStyle = grad;
              ctx.strokeStyle = '#78350f';
              ctx.lineWidth = 1.5;

              ctx.beginPath();
              ctx.moveTo(-bulletW * 0.5, -bulletH * 0.5);
              ctx.lineTo(bulletW * 0.1, -bulletH * 0.5);
              ctx.quadraticCurveTo(bulletW * 0.58, 0, bulletW * 0.5, 0);
              ctx.quadraticCurveTo(bulletW * 0.58, 0, bulletW * 0.1, bulletH * 0.5);
              ctx.lineTo(-bulletW * 0.5, bulletH * 0.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Cannelure groove
              ctx.fillStyle = '#78350f';
              ctx.fillRect(-bulletW * 0.2, -bulletH * 0.5, 2.5, bulletH);

              ctx.restore();

            } else {
              // 🛒 TROLI LAB FISIKA (PHYSICS CART)
              const bodyWidth = Math.min(2.4, Math.max(1.0, 0.8 + Math.cbrt(massVal) * 0.45)) * scaleX;
              const bodyHeight = 36 + Math.cbrt(massVal) * 6;
              bodyTop = trackY - bodyHeight - 8;

              // Cart Body Box
              ctx.fillStyle = colorTheme.body;
              ctx.strokeStyle = colorTheme.border;
              ctx.lineWidth = 2.5;

              const r = 8;
              ctx.beginPath();
              ctx.roundRect(pxX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight, [r, r, 2, 2]);
              ctx.fill();
              ctx.stroke();

              // Bumpers on left and right sides
              ctx.fillStyle = '#334155';
              ctx.fillRect(pxX - bodyWidth / 2 - 5, bodyTop + bodyHeight / 2 - 6, 5, 12);
              ctx.fillRect(pxX + bodyWidth / 2, bodyTop + bodyHeight / 2 - 6, 5, 12);

              // Wheels
              const wheelRadius = 7;
              const wheelY = trackY - wheelRadius + 1;
              const wheelOffset = bodyWidth * 0.3;

              [pxX - wheelOffset, pxX + wheelOffset].forEach((wx) => {
                ctx.beginPath();
                ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#1e293b';
                ctx.fill();
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(wx, wheelY, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#f8fafc';
                ctx.fill();
              });
            }

            // Labels inside/above object
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255,255,255,0.9)';
            ctx.shadowBlur = 4;
            ctx.fillText(labelTitle, pxX, bodyTop - 6);
            ctx.fillText(`${massVal} kg`, pxX, bodyTop + 14);
            ctx.shadowBlur = 0;

            // 6. Draw Vector Arrows above object
            const currentP = massVal * velVal;
            const arrowBaseY = bodyTop - 22;

            // Vector Velocity Arrow (Cyan/Blue)
            if (showVelocityVector && Math.abs(velVal) > 0.05) {
              const vArrowLen = velVal * 9;
              drawArrow(
                ctx,
                pxX,
                arrowBaseY - 14,
                pxX + vArrowLen,
                arrowBaseY - 14,
                '#0284c7',
                `v = ${velVal.toFixed(1)} m/s`
              );
            }

            // Vector Momentum Arrow (Emerald/Green)
            if (showMomentumVector && Math.abs(currentP) > 0.1) {
              const pArrowLen = Math.max(-140, Math.min(140, currentP * 1.8));
              drawArrow(
                ctx,
                pxX,
                arrowBaseY,
                pxX + pArrowLen,
                arrowBaseY,
                '#059669',
                `p = ${currentP.toFixed(1)} kg·m/s`
              );
            }

            ctx.restore();
          };

          // Draw Object 1
          const label1 = `${objectVisual1 === 'ball' ? '⚽ Bola' : objectVisual1 === 'runner' ? '🏃 Pelari' : objectVisual1 === 'car' ? '🚗 Mobil' : objectVisual1 === 'truck' ? '🚛 Truk' : objectVisual1 === 'bullet' ? '🔫 Peluru' : '🛒 Troli'} 1 (A)`;
          drawBody(
            pos1Ref.current,
            m1,
            vel1Ref.current,
            { body: '#4f46e5', border: '#3730a3', accent: '#818cf8' },
            label1,
            objectVisual1
          );

          // Draw Object 2 (if Two Carts mode)
          if (mode === 'two_carts') {
            const label2 = `${objectVisual2 === 'ball' ? '⚽ Bola' : objectVisual2 === 'runner' ? '🏃 Pelari' : objectVisual2 === 'car' ? '🚗 Mobil' : objectVisual2 === 'truck' ? '🚛 Truk' : objectVisual2 === 'bullet' ? '🔫 Peluru' : '🛒 Troli'} 2 (B)`;
            drawBody(
              pos2Ref.current,
              m2,
              vel2Ref.current,
              { body: '#0284c7', border: '#0369a1', accent: '#38bdf8' },
              label2,
              objectVisual2
            );
          }

          // 7. Draw Impact Rings (Shockwaves)
          for (let i = impactRingsRef.current.length - 1; i >= 0; i--) {
            const ring = impactRingsRef.current[i];
            const pxX = meterToPx(ring.x);
            const centerY = trackY - 25;

            ctx.save();
            ctx.beginPath();
            ctx.arc(pxX, centerY, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = ring.alpha;
            ctx.stroke();
            ctx.restore();

            ring.radius += 2.5;
            ring.alpha -= 0.04;
            if (ring.alpha <= 0) {
              impactRingsRef.current.splice(i, 1);
            }
          }

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPlaying,
    simSpeed,
    stepFrame,
    m1,
    m2,
    mode,
    showMomentumVector,
    showVelocityVector,
    showGridRuler,
    showTrail,
    objectVisual1,
    objectVisual2,
    wallBounce,
  ]);

  // Helper Arrow Renderer
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string
  ) => {
    const headLen = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    // Line body
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Text Label
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, (fromX + toX) / 2, fromY - 5);
    ctx.restore();
  };

  return (
    <div className={`space-y-5 ${isPresentationMode ? 'text-base' : 'text-sm'}`}>
      {/* Top Presets Toolbar for Microteaching Demonstrations */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Preset Demonstrasi Cepat:
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/80 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Presentation Viewport */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Canvas Top Bar */}
        <div className="bg-slate-900 text-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>1. Analisis 1 Benda (Vektor</span>
              <MathView math="\vec{p}" />
              <span>)</span>
            </button>
            <button
              onClick={() => setMode('two_carts')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mode === 'two_carts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2. Tumbukan 2 Benda (Hukum Kekekalan)
            </button>
          </div>

          {/* Quick visual toggles */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowMomentumVector((prev) => !prev)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                showMomentumVector
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Vektor</span>
              <MathView math="\vec{p}" />
              <span>(Hijau)</span>
            </button>
            <button
              onClick={() => setShowVelocityVector((prev) => !prev)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                showVelocityVector
                  ? 'bg-sky-600/90 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Vektor</span>
              <MathView math="\vec{v}" />
              <span>(Biru)</span>
            </button>
            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md text-xs text-slate-300">
              <span className="text-[11px] text-slate-400">Bentuk:</span>
              <select
                aria-label="Pilih Bentuk Visual Objek 1"
                value={objectVisual1}
                onChange={(e) => setObjectVisual1(e.target.value as ObjectVisualType)}
                className="bg-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="cart">🛒 Troli Lab</option>
                <option value="ball">⚽ Bola Sepak</option>
                <option value="runner">🏃 Pelari</option>
                <option value="car">🚗 Mobil</option>
                <option value="truck">🚛 Truk</option>
                <option value="bullet">🔫 Peluru</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2D Canvas Element */}
        <div className="relative w-full h-[280px] sm:h-[340px] bg-slate-50">
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

          {/* Floating Live Telemetry HUD */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200/90 shadow-sm text-xs font-mono space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
              Telemetri Real-Time (LaTeX)
            </div>
            <div className="flex items-center gap-3">
              <span className="text-indigo-700 font-bold">
                <MathView math={`p_1 = ${telemetry.p1.toFixed(1)}\\text{ kg}\\cdot\\text{m/s}`} />
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-700">
                <MathView math={`E_{k1} = ${telemetry.ek1.toFixed(1)}\\text{ J}`} />
              </span>
            </div>
            {mode === 'two_carts' && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sky-700 font-bold">
                    <MathView math={`p_2 = ${telemetry.p2.toFixed(1)}\\text{ kg}\\cdot\\text{m/s}`} />
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-700">
                    <MathView math={`E_{k2} = ${telemetry.ek2.toFixed(1)}\\text{ J}`} />
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-slate-900 font-bold gap-3">
                  <span>
                    <MathView math="\sum p_{\text{total}}:" />
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <MathView math={`${telemetry.pTotal.toFixed(1)}\\text{ kg}\\cdot\\text{m/s}`} />
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Canvas Bottom Control Bar */}
        <div className="bg-slate-100/90 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Simulation Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className={`p-2 rounded-xl text-white shadow-xs transition-colors flex items-center gap-1.5 px-3 font-semibold text-xs ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              title="Play/Pause (Spasi)"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Jeda' : 'Jalankan'}</span>
            </button>

            <button
              onClick={() => stepFrame(0.05)}
              className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs text-xs font-medium flex items-center gap-1"
              title="Maju 1 Frame (+0.05s)"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Langkah</span>
            </button>

            <button
              onClick={resetSimulation}
              className="p-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs text-xs font-medium flex items-center gap-1"
              title="Reset Posisi Benda"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Speed Multiplier Segmented */}
            <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-xs font-mono">
              {[0.25, 0.5, 1, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    simSpeed === speed
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Environmental toggles */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={wallBounce}
                onChange={(e) => setWallBounce(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              <span>Pantulan Dinding</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={showTrail}
                onChange={(e) => setShowTrail(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              <span>Jejak Gerak</span>
            </label>
          </div>
        </div>
      </div>

      {/* Physics Parameters Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card Object 1 (A) */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <h4 className="font-bold text-slate-900 text-sm">
                Parameter Benda 1 (Ungu / A)
              </h4>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              <MathView math={`p_1 = ${(m1 * v1).toFixed(1)}\\text{ kg}\\cdot\\text{m/s}`} />
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <span>Massa</span>
                  <span className="font-bold text-indigo-600">(<MathView math="m_1" />)</span>:
                </span>
                <span className="font-mono font-bold text-slate-900">{m1} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                value={m1}
                onChange={(e) => setM1(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <span>Kecepatan Awal</span>
                  <span className="font-bold text-indigo-600">(<MathView math="v_1" />)</span>:
                </span>
                <span className="font-mono font-bold text-slate-900">{v1} m/s</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={v1}
                onChange={(e) => setV1(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>← -15 m/s (Ke Kiri)</span>
                <span>0 m/s (Diam)</span>
                <span>+15 m/s (Ke Kanan) →</span>
              </div>
            </div>

            {/* Visual Object Selector for Object 1 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Bentuk Visual Benda 1:
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {objectVisual1 === 'ball' && '⚽ Bola Sepak'}
                  {objectVisual1 === 'runner' && '🏃 Pelari Cepat'}
                  {objectVisual1 === 'car' && '🚗 Mobil Sedan'}
                  {objectVisual1 === 'truck' && '🚛 Truk Gandeng'}
                  {objectVisual1 === 'bullet' && '🔫 Peluru Cepat'}
                  {objectVisual1 === 'cart' && '🛒 Troli Lab'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'cart', label: '🛒 Troli' },
                  { id: 'ball', label: '⚽ Bola' },
                  { id: 'runner', label: '🏃 Pelari' },
                  { id: 'car', label: '🚗 Mobil' },
                  { id: 'truck', label: '🚛 Truk' },
                  { id: 'bullet', label: '🔫 Peluru' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setObjectVisual1(item.id as ObjectVisualType)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      objectVisual1 === item.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card Object 2 (B) or Single Object Inspection */}
        {mode === 'two_carts' ? (
          <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sky-50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-600"></div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Parameter Benda 2 (Biru / B)
                </h4>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                <MathView math={`p_2 = ${(m2 * v2).toFixed(1)}\\text{ kg}\\cdot\\text{m/s}`} />
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <span>Massa</span>
                    <span className="font-bold text-sky-600">(<MathView math="m_2" />)</span>:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{m2} kg</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={m2}
                  onChange={(e) => setM2(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <span>Kecepatan Awal</span>
                    <span className="font-bold text-sky-600">(<MathView math="v_2" />)</span>:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{v2} m/s</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={v2}
                  onChange={(e) => setV2(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>← -15 m/s (Ke Kiri)</span>
                  <span>0 m/s (Diam)</span>
                  <span>+15 m/s (Ke Kanan) →</span>
                </div>
              </div>

              {/* Visual Object Selector for Object 2 */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Bentuk Visual Benda 2:
                  </span>
                  <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                    {objectVisual2 === 'ball' && '⚽ Bola Sepak'}
                    {objectVisual2 === 'runner' && '🏃 Pelari Cepat'}
                    {objectVisual2 === 'car' && '🚗 Mobil Sedan'}
                    {objectVisual2 === 'truck' && '🚛 Truk Gandeng'}
                    {objectVisual2 === 'bullet' && '🔫 Peluru Cepat'}
                    {objectVisual2 === 'cart' && '🛒 Troli Lab'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'cart', label: '🛒 Troli' },
                    { id: 'ball', label: '⚽ Bola' },
                    { id: 'runner', label: '🏃 Pelari' },
                    { id: 'car', label: '🚗 Mobil' },
                    { id: 'truck', label: '🚛 Truk' },
                    { id: 'bullet', label: '🔫 Peluru' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setObjectVisual2(item.id as ObjectVisualType)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        objectVisual2 === item.id
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold ring-1 ring-sky-500 shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collision Type Selector */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Jenis Tumbukan (Koefisien Restitusi <MathView math="e" />):
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setCollisionType('elastic')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors flex items-center justify-center gap-1 ${
                      collisionType === 'elastic'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Lenting Sempurna</span>
                    <span className="text-[11px] font-mono">(<MathView math="e = 1" />)</span>
                  </button>
                  <button
                    onClick={() => setCollisionType('inelastic')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors flex items-center justify-center gap-1 ${
                      collisionType === 'inelastic'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Sebagian</span>
                    <span className="text-[11px] font-mono">(<MathView math="e = 0{,}5" />)</span>
                  </button>
                  <button
                    onClick={() => setCollisionType('sticky')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors flex items-center justify-center gap-1 ${
                      collisionType === 'sticky'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Menempel</span>
                    <span className="text-[11px] font-mono">(<MathView math="e = 0" />)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">
                Analisis Vektor Tunggal (1 Benda)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pada mode 1 benda ini, Anda dapat mengamati secara langsung hubungan antara panjang panah vektor momentum (hijau) dengan vektor kecepatan (biru). Cobalah ubah kecepatan menjadi negatif untuk mengamati pembalikan arah panah vektor secara instan!
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="text-slate-500 font-sans font-semibold">Rumus Aktif (LaTeX):</div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <MathView
                  block
                  math={`\\vec{p} = m_1 \\cdot \\vec{v}_1 = ${m1}\\text{ kg} \\cdot (${v1}\\text{ m/s}) = ${(m1 * v1).toFixed(1)}\\text{ kg}\\cdot\\text{m/s}`}
                />
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <MathView
                  block
                  math={`E_k = \\frac{1}{2} m_1 v_1^2 = \\frac{1}{2}(${m1})(${v1})^2 = ${(0.5 * m1 * v1 * v1).toFixed(1)}\\text{ Joule}`}
                />
              </div>
            </div>

            <button
              onClick={() => setMode('two_carts')}
              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors text-center"
            >
              Aktifkan Mode Tumbukan 2 Benda →
            </button>
          </div>
        )}
      </div>

      {/* Conservation of Momentum Verifier Bar */}
      {mode === 'two_carts' && (
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-emerald-950">
                Verifikasi Hukum Kekekalan Momentum Linier:
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-900 bg-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <MathView math="\sum p_{\text{awal}} = \sum p_{\text{akhir}}" />
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 font-sans text-[11px] block mb-1">Momentum Total Sistem Awal:</span>
              <span className="text-sm font-bold text-slate-800">
                <MathView math={`\\sum p_{\\text{awal}} = ${telemetry.initialPTotal.toFixed(2)}\\text{ kg}\\cdot\\text{m/s}`} />
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
              <span className="text-slate-500 font-sans text-[11px] block mb-1">Momentum Total Sistem Saat Ini:</span>
              <span className="text-sm font-bold text-emerald-700">
                <MathView math={`\\sum p_{\\text{akhir}} = ${telemetry.pTotal.toFixed(2)}\\text{ kg}\\cdot\\text{m/s}`} />
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 italic">
            *Perhatikan bahwa total momentum sistem selalu konstan sebelum dan sesudah tumbukan, membuktikan Hukum III Newton (Aksi-Reaksi)!
          </p>
        </div>
      )}
    </div>
  );
};
