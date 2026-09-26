export type TargetVariable = 'p' | 'm' | 'v';

export interface CalculationStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  insight: string;
}

export interface ImpulseCalculation {
  force: number; // N
  deltaTime: number; // s
  mass: number; // kg
  initialVelocity: number; // m/s
  finalVelocity: number; // m/s
}

export type CollisionMode = 'single' | 'two_carts';
export type CollisionType = 'elastic' | 'inelastic' | 'sticky'; // e=1, e=0.5, e=0
export type ObjectVisualType = 'cart' | 'ball' | 'runner' | 'car' | 'truck' | 'bullet';

export interface CartState {
  id: number;
  x: number; // position on track (0 to trackWidth)
  mass: number; // kg
  velocity: number; // m/s
  initialVelocity: number;
  color: string;
  label: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  scenario?: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
  explanation: {
    concept: string;
    calculation?: string;
    misconception: string;
  };
}

export interface PresetScenario {
  id: string;
  title: string;
  description: string;
  mode: CollisionMode;
  collisionType?: CollisionType;
  m1: number;
  v1: number;
  m2?: number;
  v2?: number;
  object1?: ObjectVisualType;
  object2?: ObjectVisualType;
  teachingNote: string;
}
