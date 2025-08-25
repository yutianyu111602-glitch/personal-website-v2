/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module '*.tsx' {
  const content: any;
  export default content;
}

declare module '*.ts' {
  const content: any;
  export default content;
}
