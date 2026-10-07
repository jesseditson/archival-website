declare module "https://cdn.jsdelivr.net/npm/animejs@4/+esm" {
  type Target = Element | Record<string, unknown>;
  type TargetSelector = Target | NodeList | string;
  type TweenValue = number | string;
  type TweenParam = TweenValue | TweenValue[];
  type StaggerFunction = (target?: Target, index?: number, targets?: Target[]) => number;

  interface JSAnimation {
    targets: Target[];
  }

  interface AnimationParams {
    opacity?: TweenParam;
    translateX?: TweenParam;
    translateY?: TweenParam;
    scale?: TweenParam;
    rotate?: TweenParam;
    backgroundColor?: TweenParam;
    value?: TweenParam;
    delay?: number | StaggerFunction;
    duration?: number;
    ease?: string;
    loop?: boolean | number;
    modifier?: (value: number) => number | string;
    onUpdate?: (self: JSAnimation) => void;
    onComplete?: (self: JSAnimation) => void;
  }

  export function animate(targets: TargetSelector | TargetSelector[], parameters: AnimationParams): JSAnimation;

  export function stagger(value: number, params?: { start?: number }): StaggerFunction;

  export const utils: {
    round(decimalLength: number): (value: number) => number;
  };
}
