import type { Chart, Plugin } from "chart.js";

type Formatter = (value: number, index: number, chart: Chart) => string;

const getFormatter = (chart: Chart): Formatter => {
  const plugins = chart.options.plugins as { valueLabels?: { formatter?: Formatter } } | undefined;
  return plugins?.valueLabels?.formatter ?? ((value) => String(value));
};

export const chartValueLabels: Plugin = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    try {
      const { ctx } = chart;
      const formatter = getFormatter(chart);

      ctx.save();
      ctx.font = "700 11px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,.72)";
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

          lines.forEach((line, lineIndex) => {
            const lineY = y + lineIndex * 13;
            ctx.strokeText(line, x, lineY);
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
