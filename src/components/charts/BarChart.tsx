import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

interface BarChartProps {
  data: {
    x: string[];
    y: number[];
    name: string;
    color?: string;
  }[];
  title?: string;
  height?: number;
  yAxisTitle?: string;
  orientation?: 'v' | 'h';
  className?: string;
}

export default function BarChart({ data, title, height = 400, yAxisTitle, orientation = 'v', className }: BarChartProps) {
  const traces: Partial<Plotly.PlotData>[] = data.map((series) => ({
    type: 'bar',
    x: orientation === 'v' ? series.x : series.y,
    y: orientation === 'v' ? series.y : series.x,
    name: series.name,
    marker: {
      color: series.color || '#3b82f6',
      line: { color: '#1e293b', width: 1 }
    },
    orientation,
    hovertemplate: '<b>%{x}</b><br>爆冷率: %{y:.1%}<extra></extra>'
  }));

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      color: '#94a3b8',
      family: 'Inter, sans-serif'
    },
    xaxis: {
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      zerolinecolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { size: 11 }
    },
    yaxis: {
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      zerolinecolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { size: 11 },
      tickformat: '.0%',
      title: yAxisTitle ? {
        text: yAxisTitle,
        font: { size: 12 }
      } : undefined
    },
    barmode: 'group',
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
      x: 0.5,
      xanchor: 'center',
      font: { size: 11 }
    },
    margin: { l: 120, r: 20, t: title ? 50 : 20, b: 60 },
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
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height }}
      />
    </div>
  );
}
