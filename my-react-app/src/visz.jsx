import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, ComposedChart } from 'recharts';
import Papa from 'papaparse';

const CPAHealthDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetch('/combined_data.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = results.data.map(d => ({
              ...d,
              CPA_HOUS_PC: d.CPA_HOUS / d.population_count,
              CPA_OS_PC: d.CPA_OS / d.population_count,
              CPA_REC_PC: d.CPA_REC / d.population_count,
              CPA_HIST_PC: d.CPA_HIST / d.population_count,
              CPA_TOT_PC: d.CPA_TOT / d.population_count,
            }));
            setData(processedData);
            setLoading(false);
          }
        });
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error: Could not load data</p>
          <p className="text-slate-600 mt-2">Make sure combined_data.csv is in the public folder</p>
        </div>
      </div>
    );
  }

  const townColors = {
    'Cambridge': '#8b5cf6',
    'Fall River': '#ec4899',
    'Newton': '#f59e0b',
    'Quincy': '#10b981',
    'Somerville': '#3b82f6'
  };

  const healthMetrics = [
    { 
      key: 'MHLTH_CrudePrev', 
      label: 'Mental Health Issues', 
      fullLabel: 'Poor Mental Health ≥14 Days',
      description: 'Percentage of adults reporting their mental health was not good for 14 or more days in the past month',
      unit: '%', 
      color: '#8b5cf6',
      icon: '🧠'
    },
    { 
      key: 'LPA_CrudePrev', 
      label: 'Physical Inactivity', 
      fullLabel: 'No Leisure Physical Activity',
      description: 'Percentage of adults who report doing no physical activity or exercise (other than their job) in the past month',
      unit: '%', 
      color: '#ec4899',
      icon: '🏃'
    },
    { 
      key: 'PHLTH_CrudePrev', 
      label: 'Poor Physical Health', 
      fullLabel: 'Poor Physical Health ≥14 Days',
      description: 'Percentage of adults reporting their physical health was not good for 14 or more days in the past month',
      unit: '%', 
      color: '#f59e0b',
      icon: '💪'
    }
  ];

  const fundingMetrics = [
    { 
      key: 'CPA_HOUS', 
      label: 'Housing', 
      description: 'Community Preservation Act funding allocated to affordable housing projects and initiatives',
      color: '#8b5cf6',
      icon: '🏠'
    },
    { 
      key: 'CPA_OS', 
      label: 'Open Space', 
      description: 'Funding for parks, conservation land, and outdoor recreational spaces',
      color: '#10b981',
      icon: '🌳'
    },
    { 
      key: 'CPA_REC', 
      label: 'Recreation', 
      description: 'Investment in recreational facilities, playgrounds, sports fields, and community centers',
      color: '#3b82f6',
      icon: '⚽'
    },
    { 
      key: 'CPA_HIST', 
      label: 'Historical', 
      description: 'Preservation and restoration of historic buildings, sites, and cultural landmarks',
      color: '#f59e0b',
      icon: '🏛️'
    }
  ];

  // Calculate correlation coefficient
  const calculateCorrelation = (x, y) => {
    const n = x.length;
    const sum_x = x.reduce((a, b) => a + b, 0);
    const sum_y = y.reduce((a, b) => a + b, 0);
    const sum_xy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sum_x2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sum_y2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Generate correlation matrix
  const generateCorrelationMatrix = () => {
    const matrix = [];
    
    healthMetrics.forEach(health => {
      const row = { metric: health.label };
      fundingMetrics.forEach(funding => {
        const xValues = data.map(d => d[funding.key]);
        const yValues = data.map(d => d[health.key]);
        const corr = calculateCorrelation(xValues, yValues);
        row[funding.label] = corr;
      });
      matrix.push(row);
    });
    
    return matrix;
  };

  // Correlation Heatmap Component
  const CorrelationHeatmap = () => {
    const matrix = generateCorrelationMatrix();
    
    const getColor = (value) => {
      // Coolwarm colormap
      if (value > 0) {
        const intensity = Math.abs(value);
        return `rgba(220, 38, 38, ${intensity})`; // Red for positive
      } else {
        const intensity = Math.abs(value);
        return `rgba(59, 130, 246, ${intensity})`; // Blue for negative
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          📊 Correlation Heatmap: CPA Spending vs Health Metrics
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Shows the correlation coefficient between each funding type and health outcome. 
          Red = positive correlation (more funding, worse health), Blue = negative correlation (more funding, better health).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-300 p-3 bg-slate-100"></th>
                {fundingMetrics.map(funding => (
                  <th key={funding.key} className="border border-slate-300 p-3 bg-slate-100 text-sm font-semibold">
                    {funding.icon} {funding.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-3 bg-slate-100 font-semibold text-sm">
                    {healthMetrics[i].icon} {row.metric}
                  </td>
                  {fundingMetrics.map(funding => {
                    const value = row[funding.label];
                    return (
                      <td 
                        key={funding.key}
                        className="border border-slate-300 p-3 text-center font-mono text-sm"
                        style={{ backgroundColor: getColor(value) }}
                      >
                        <span className={Math.abs(value) > 0.3 ? 'text-white font-bold' : 'text-slate-800'}>
                          {value.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-4" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 1), rgba(59, 130, 246, 0))' }}></div>
            <span className="text-slate-600">-1.0 (Strong Negative)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 bg-slate-200"></div>
            <span className="text-slate-600">0.0 (No Correlation)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-4" style={{ background: 'linear-gradient(to right, rgba(220, 38, 38, 0), rgba(220, 38, 38, 1))' }}></div>
            <span className="text-slate-600">+1.0 (Strong Positive)</span>
          </div>
        </div>
      </div>
    );
  };

  // Scatter Plot Grid (like Python script)
  const ScatterPlotGrid = () => {
    return (
      <div className="space-y-8">
        {healthMetrics.map(healthMetric => (
          <div key={healthMetric.key}>
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {healthMetric.icon} {healthMetric.fullLabel} - Scatter Analysis
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fundingMetrics.map(funding => {
                const scatterData = data.map(d => ({
                  town: d.TOWN,
                  x: d[funding.key],
                  y: d[healthMetric.key],
                  population: d.population_count
                }));

                const xValues = data.map(d => d[funding.key]);
                const yValues = data.map(d => d[healthMetric.key]);
                const correlation = calculateCorrelation(xValues, yValues);

                return (
                  <div key={funding.key} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-slate-700">
                        {healthMetric.label} vs {funding.label}
                      </h4>
                      <span 
                        className={`text-xs font-mono px-2 py-1 rounded ${
                          Math.abs(correlation) > 0.5 ? 'bg-red-100 text-red-800' :
                          Math.abs(correlation) > 0.3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        r = {correlation.toFixed(3)}
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name={funding.label}
                          label={{ value: `${funding.label} Funding ($)`, position: 'bottom', offset: 20, style: { fontSize: 11 } }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name={healthMetric.label}
                          label={{ value: `${healthMetric.label} (%)`, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg text-xs">
                                  <p className="font-bold text-slate-800">{d.town}</p>
                                  <p className="text-slate-600">
                                    {funding.label}: ${d.x.toLocaleString()}
                                  </p>
                                  <p className="text-slate-600">
                                    {healthMetric.label}: {d.y.toFixed(2)}%
                                  </p>
                                  <p className="text-slate-500 text-xs mt-1">
                                    Pop: {d.population.toLocaleString()}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter data={scatterData} fill={funding.color}>
                          {scatterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={townColors[entry.town] || funding.color} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const CorrelationGrid = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {healthMetrics.map(healthMetric => (
          <div key={healthMetric.key} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {healthMetric.fullLabel} vs All Funding Types
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="TOWN" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: healthMetric.label + ' (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  label={{ value: 'Funding per Capita ($)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey={healthMetric.key} fill={healthMetric.color} name={healthMetric.fullLabel} />
                {fundingMetrics.map(funding => (
                  <Line 
                    key={funding.key}
                    yAxisId="right"
                    type="monotone" 
                    dataKey={`${funding.key}_PC`}
                    stroke={funding.color}
                    name={funding.label}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    );
  };

  const OverviewView = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            Health Outcomes by Town
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="TOWN" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Prevalence (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {healthMetrics.map(metric => (
                <Bar key={metric.key} dataKey={metric.key} fill={metric.color} name={metric.fullLabel} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            CPA Funding per Capita by Category
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="TOWN" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Per Capita Funding ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              {fundingMetrics.map(metric => (
                <Bar key={metric.key} dataKey={`${metric.key}_PC`} fill={metric.color} name={metric.label} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Key Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {healthMetrics.map(metric => {
              const values = data.map(d => d[metric.key]);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const min = Math.min(...values);
              const max = Math.max(...values);
              const bestTown = data.find(d => d[metric.key] === min)?.TOWN;
              const worstTown = data.find(d => d[metric.key] === max)?.TOWN;

              return (
                <div key={metric.key} className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold mb-2" style={{ color: metric.color }}>
                    {metric.icon} {metric.label}
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="text-slate-700">Average: <strong>{avg.toFixed(2)}%</strong></p>
                    <p className="text-green-700">Best: <strong>{bestTown}</strong> ({min.toFixed(2)}%)</p>
                    <p className="text-red-700">Worst: <strong>{worstTown}</strong> ({max.toFixed(2)}%)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Community Preservation Act Funding & Health Outcomes
          </h1>
          <p className="text-slate-600">
            Analyzing {data.length} towns - Data from combined_data.csv
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">📊 Understanding the Data</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🏥</span> Health Outcome Metrics
              </h3>
              <div className="space-y-3">
                {healthMetrics.map(metric => (
                  <div key={metric.key} className="bg-white rounded-lg p-3 border-l-4" style={{ borderColor: metric.color }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{metric.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-800">{metric.fullLabel}</h4>
                        <p className="text-sm text-slate-600 mt-1">{metric.description}</p>
                        <p className="text-xs text-slate-500 mt-1 italic">
                          Lower percentages = Better health outcomes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">💰</span> CPA Funding Categories
              </h3>
              <div className="space-y-3">
                {fundingMetrics.map(metric => (
                  <div key={metric.key} className="bg-white rounded-lg p-3 border-l-4" style={{ borderColor: metric.color }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{metric.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-800">{metric.label} Funding</h4>
                        <p className="text-sm text-slate-600 mt-1">{metric.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">What We're Analyzing</h4>
                <p className="text-sm text-slate-700 mb-2">
                  This dashboard explores whether towns that invest more in community infrastructure (housing, parks, recreation, historic preservation) 
                  see better health outcomes among their residents.
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Key Question:</strong> Does higher per-capita CPA funding correlate with lower rates of mental health issues, 
                  physical inactivity, and poor physical health?
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === 'overview'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📈 Overview
            </button>
            <button
              onClick={() => setSelectedView('heatmap')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === 'heatmap'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🔥 Correlation Heatmap
            </button>
            <button
              onClick={() => setSelectedView('scatterplots')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === 'scatterplots'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📊 Scatter Plots
            </button>
            <button
              onClick={() => setSelectedView('correlations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === 'correlations'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🔗 Combined View
            </button>
          </div>
        </div>

        {selectedView === 'overview' && <OverviewView />}
        {selectedView === 'heatmap' && <CorrelationHeatmap />}
        {selectedView === 'scatterplots' && <ScatterPlotGrid />}
        {selectedView === 'correlations' && <CorrelationGrid />}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-3">Town Legend</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(townColors).map(([town, color]) => (
              <div key={town} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-sm text-slate-600">{town}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPAHealthDashboard;