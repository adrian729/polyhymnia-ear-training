/// <reference types="vite/client" />

// vite-imagetools imports (see vite.config.ts): one generated image, or a srcset of several.
declare module '*&format=webp' {
  const src: string;
  export default src;
}

declare module '*&as=srcset' {
  const srcset: string;
  export default srcset;
}

declare module '*&as=metadata:src;width;height' {
  const images: readonly { src: string; width: number; height: number }[] | { src: string; width: number; height: number };
  export default images;
}
