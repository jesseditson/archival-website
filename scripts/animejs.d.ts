declare module "https://cdn.jsdelivr.net/npm/animejs@4/+esm" {
  export interface JSAnimation {
    pause(): JSAnimation;
  }

  type AnimatableValue = number | string;
  type AnimationCallback = (animation: JSAnimation) => void;

  export interface AnimationParams {
    duration?: number;
    delay?: number;
    ease?: string;
    onComplete?: AnimationCallback;
    [property: string]: AnimatableValue | AnimatableValue[] | AnimationCallback | undefined;
  }

  export function animate(targets: string | Element, parameters: AnimationParams): JSAnimation;
}
