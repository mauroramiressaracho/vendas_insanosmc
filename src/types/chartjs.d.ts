import type { Chart, ChartType } from "chart.js";

declare module "chart.js" {
  interface PluginOptionsByType<TType extends ChartType> {
    valueLabels?: {
      formatter?: (value: number, index: number, chart: Chart<TType>) => string;
      color?: string;
      strokeColor?: string;
      backgroundColor?: string;
      font?: string;
    };
  }
}
