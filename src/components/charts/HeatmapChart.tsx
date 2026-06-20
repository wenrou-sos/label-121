import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

interface HeatmapChartProps {
  z: number[][];
  x: string[];
  y: string[];
  title?: string;
  height?: number;
  className?: string;
}

export default function HeatmapChart({ z, x, y, title, height = 400, className }: HeatmapChartProps) {
  const trace: Partial<Plotly.PlotData> = {
    type: 'heatmap',
    z: z,
    x: x,
    y: y,
    colorscale: [
      [0, '#1e293b'],
      [0.3, '#1e40af'],
      [0.6, '#3b82f6'],
      [1, '#f59e0b']
    ],
    hoverongaps: false,
    hovertemplate: '<b>%{y}</b><br>玩法: %{x}<br>金额: ¥%{z:,.0f}<extra></extra>',
    showscale: true,
    colorbar: {
      tickfont: { size: 10, color: '#94a3b8' },
      title: {
        text: '投注金额',
        font: { size: 11, color: '#94a3b8' },
        side: 'right'
      }
    }
  };

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      color: '#94a3b8',
      family: 'Inter, sans-serif'
    },
    xaxis: {
      tickfont: { size: 11 },
      gridcolor: 'rgba(148, 163, 184, 0.1)'
    },
    yaxis: {
      tickfont: { size: 11 },
      gridcolor: 'rgba(148, 163, 184, 0.1)'
    },
    margin: { l: 120, r: 80, t: title ? 50 : 20, b: 60 },
    title: title ? {
      text: title,
      font: { size: 14, color: '#e2e8f0', family: 'Orbitron, sans-serif' },
      x: 0.5,
      xanchor: 'center'
    } : undefined
  };

  const config: Partial<Plotly.Config> = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <div className={className || "w-full"}>
      <Plot
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height }}
      />
    </div>
  );
}
