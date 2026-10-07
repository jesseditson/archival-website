interface IsotopeOptions {
  itemSelector?: string;
  layoutMode?: string;
  percentPosition?: boolean;
  transitionDuration?: string | number;
  hiddenStyle?: Record<string, string | number>;
  visibleStyle?: Record<string, string | number>;
  masonry?: {
    columnWidth?: string | number | Element;
    gutter?: string | number | Element;
  };
  filter?: string;
}

declare class Isotope {
  constructor(element: Element | string, options?: IsotopeOptions);
  options: IsotopeOptions;
  layout(): void;
  arrange(options?: IsotopeOptions): void;
}

interface ImagesLoaded {
  on(event: "always" | "done" | "fail" | "progress", listener: (instance: ImagesLoaded) => void): this;
}

declare function imagesLoaded(element: Element | NodeList | string): ImagesLoaded;

declare var Prism: {
  highlightAllUnder(container: ParentNode): void;
};

interface Window {
  webkitAudioContext?: typeof AudioContext;
  codeBlockStore?: Record<string, string>;
}
