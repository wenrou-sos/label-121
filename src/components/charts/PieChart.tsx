import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

interface PieChartProps {
  data: {
    labels: string[];
    values: number[];
    colors?: string[];
  };
  title?: string;
  height?: number;
}

export default function PieChart({ data, title, height = 400 }: PieChartProps) {
  const colors = data.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const trace: Partial<Plotly.PlotData> = {
    type: 'pie',
    labels: data.labels,
    values: data.values,
    hole: 0.5,
    marker: {
      colors: colors,
      line: { color: '#0f172a', width: 2 }
    },
    textinfo: 'label+percent',
    textfont: { color: '#e2e8f0', size: 12 },
    hovertemplate: '<b>%{label}</b><br>金额: ¥%{value:,.0f}<br>占比: %{percent}<extra></extra>'
  };

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      color: '#94a3b8',
      family: 'Inter, sans-serif'
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.1,
      x: 0.5,
      xanchor: 'center',
      font: { size: 11 }
    },
    margin: { l: 20, r: 20, t: title ? 50 : 20, b: 60 },
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
    <div className="w-full">
      <Plot
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height }}
      />
    </div>
  );
}
