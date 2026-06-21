import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

interface LineChartProps {
  data: {
    x: string[];
    y: number[];
    name: string;
    color?: string;
  }[];
  title?: string;
  height?: number;
  yAxisTitle?: string;
  anomalies?: { x: string; y: number; color: string }[];
  highlightRanges?: { startIndex: number; endIndex: number; color?: string; label?: string }[];
  className?: string;
  onPointClick?: (point: { x: string; y: number; seriesName: string; xIndex: number }) => void;
}

export default function LineChart({ data, title, height = 400, yAxisTitle, anomalies, highlightRanges, className, onPointClick }: LineChartProps) {
  const traces: Partial<Plotly.PlotData>[] = data.map((series) => ({
    type: 'scatter',
    mode: 'lines+markers',
    x: series.x,
    y: series.y,
    name: series.name,
    line: {
      color: series.color || '#3b82f6',
      width: 3,
      shape: 'spline'
    },
    marker: {
      size: 6,
      color: series.color || '#3b82f6'
    },
    hovertemplate: '<b>%{x}</b><br>赔率: %{y:.2f}<extra></extra>'
  }));

  if (anomalies && anomalies.length > 0) {
    traces.push({
      type: 'scatter',
      mode: 'markers',
      x: anomalies.map(a => a.x),
      y: anomalies.map(a => a.y),
      name: '异常变动',
      marker: {
        size: 12,
        color: anomalies.map(a => a.color),
        symbol: 'circle',
        line: { color: '#ffffff', width: 2 }
      },
      hovertemplate: '<b>异常变动</b><br>时间: %{x}<br>赔率: %{y:.2f}<extra></extra>'
    });
  }

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
      title: yAxisTitle ? {
        text: yAxisTitle,
        font: { size: 12 }
      } : undefined
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
      x: 0.5,
      xanchor: 'center',
      font: { size: 11 }
    },
    margin: { l: 50, r: 20, t: title ? 50 : 20, b: 60 },
    title: title ? {
      text: title,
      font: { size: 14, color: '#e2e8f0', family: 'Orbitron, sans-serif' },
      x: 0.5,
      xanchor: 'center'
    } : undefined,
    hovermode: 'x unified',
    shapes: highlightRanges && highlightRanges.length > 0 ? highlightRanges.map((r, i) => {
      const xs = data[0]?.x || [];
      return {
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: xs[r.startIndex],
        x1: xs[r.endIndex],
        y0: 0,
        y1: 1,
        fillcolor: r.color || 'rgba(239, 68, 68, 0.12)',
        line: { width: 0 },
        label: r.label ? {
          text: r.label,
          textposition: 'top center',
          font: { size: 11, color: '#fca5a5' },
          showbackground: false
        } : undefined,
        name: `highlight-${i}`
      } as Partial<Plotly.Shape>;
    }) : undefined
  };

  const config: Partial<Plotly.Config> = {
    displayModeBar: false,
    responsive: true
  };

  const handleClick = (event: Readonly<Plotly.PlotMouseEvent>) => {
    if (!onPointClick || !event.points || event.points.length === 0) return;
    const pt = event.points[0];
    onPointClick({
      x: pt.x as string,
      y: pt.y as number,
      seriesName: (pt.data as Plotly.PlotData).name as string || '',
      xIndex: typeof pt.pointIndex === 'number' ? pt.pointIndex : 0
    });
  };

  return (
    <div className={className || "w-full"}>
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height }}
        onClick={onPointClick ? handleClick : undefined}
      />
    </div>
  );
}
