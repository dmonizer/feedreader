import { IStaticMethods } from "flyonui/flyonui";

declare global {
  interface Window {
    // Optional third-party libraries
    _: any;
    $: typeof import("jquery");
    jQuery: typeof import("jquery");
    DataTable: any;
    Dropzone: any;
    HSStaticMethods: IStaticMethods;
    HSAccordion?: {
      autoInit: () => void;
    };
  }
}

export {};