import type { Chart, Plugin } from "chart.js";

type Formatter = (value: number, index: number, chart: Chart) => string;
interface ValueLabelOptions {
  formatter?: Formatter;
  color?: string;
  strokeColor?: string;
  backgroundColor?: string;
  font?: string;
}

const getOptions = (chart: Chart): ValueLabelOptions =>
  ((chart.options.plugins as { valueLabels?: ValueLabelOptions } | undefined)?.valueLabels ?? {});

export const chartValueLabels: Plugin = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    try {
      const { ctx } = chart;
      const options = getOptions(chart);
      const formatter = options.formatter ?? ((value) => String(value));

      ctx.save();
      ctx.font = options.font ?? "700 11px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = options.color ?? "#ffffff";
      ctx.strokeStyle = options.strokeColor ?? "rgba(0,0,0,.72)";
      ctx.lineWidth = 3;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element, index) => {
          const raw = dataset.data[index];
          const value = typeof raw === "number" ? raw : Number(raw);
          if (!Number.isFinite(value) || value === 0) return;

          const label = formatter(value, index, chart);
          const lines = label.split("\n");
          const position = element.tooltipPosition(true);
          if (typeof position.x !== "number" || typeof position.y !== "number") return;
          const isHorizontal = chart.options.indexAxis === "y";
          const x = isHorizontal ? Math.min(position.x + 34, chart.chartArea.right - 18) : position.x;
          const y = isHorizontal ? position.y : Math.max(position.y - 12, chart.chartArea.top + 12);
          const maxTextWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
          const boxHeight = lines.length * 13 + 5;

          if (options.backgroundColor) {
            ctx.save();
            ctx.fillStyle = options.backgroundColor;
            ctx.beginPath();
            ctx.roundRect(x - maxTextWidth / 2 - 5, y - boxHeight / 2, maxTextWidth + 10, boxHeight, 5);
            ctx.fill();
            ctx.restore();
          }

          lines.forEach((line, lineIndex) => {
            const lineY = y + lineIndex * 13;
            if (!options.backgroundColor) ctx.strokeText(line, x, lineY);
            ctx.fillText(line, x, lineY);
          });
        });
      });

      ctx.restore();
    } catch (error) {
      console.warn("Falha ao desenhar rótulos do gráfico", error);
    }
  },
};
