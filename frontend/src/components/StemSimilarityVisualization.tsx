import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, Box } from '@mui/material';
import { StemItem } from '../types';
import { PlotData, Layout } from 'plotly.js';

interface StemSimilarityVisualizationProps {
  stems: StemItem[];
  similarityThreshold?: number;
}

const StemSimilarityVisualization: React.FC<StemSimilarityVisualizationProps> = ({
  stems,
  similarityThreshold = 0.75,
}) => {
  // Group stems by facet
  const facetGroups = useMemo(() => {
    const groups: Record<string, StemItem[]> = {};
    stems.forEach(stem => {
      if (!groups[stem.facet]) {
        groups[stem.facet] = [];
      }
      groups[stem.facet].push(stem);
    });
    return groups;
  }, [stems]);

  // Calculate statistics for each facet
  const facetStats = useMemo(() => {
    return Object.entries(facetGroups).map(([facet, items]) => {
      const similarities = items.map(item => item.cosine_similarity);
      const sorted = [...similarities].sort((a, b) => a - b);
      const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const variance = similarities.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / similarities.length;
      const stddev = Math.sqrt(variance);
      
      // Calculate mode
      const frequency: Record<number, number> = {};
      let maxFreq = 0;
      let mode = 0;
      
      similarities.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFreq) {
          maxFreq = frequency[num];
          mode = num;
        }
      });

      return {
        facet,
        count: similarities.length,
        min: Math.min(...similarities),
        max: Math.max(...similarities),
        median: sorted[Math.floor(sorted.length / 2)],
        mean,
        stddev,
        mode,
        belowThreshold: similarities.filter(s => s < similarityThreshold).length,
        aboveThreshold: similarities.filter(s => s >= similarityThreshold).length,
        similarities
      };
    });
  }, [facetGroups, similarityThreshold]);

  // Generate histogram data
  const histogramData = useMemo<Partial<PlotData>[]>(() => {
    return [{
      x: stems.map(s => s.cosine_similarity),
      type: 'histogram',
      name: 'Similarity Distribution',
      marker: {
        color: 'rgba(100, 200, 102, 0.7)',
      },
      xbins: {
        start: 0,
        end: 1,
        size: 0.05
      },
    }];
  }, [stems]);

  // Generate violin plot data
  const violinData = useMemo<Partial<PlotData>[]>(() => {
    return facetStats.map(stat => ({
      y: stat.similarities,
      type: 'violin',
      name: stat.facet,
      box: { visible: true },
      meanline: { visible: true },
      points: 'all',
      pointpos: 0,
      jitter: 0.05,
      scalemode: 'count',
      side: 'positive',
      width: 4,
      line: { color: 'rgba(100, 200, 102, 0.7)' },
    }));
  }, [facetStats]);

  // Generate statistics line plot data
  const statsData = useMemo<Partial<PlotData>[]>(() => {
    const stats = ['min', 'mean', 'median', 'max', 'stddev'] as const;
    return stats.map(stat => ({
      x: facetStats.map(s => s.facet),
      y: facetStats.map(s => s[stat]),
      type: 'scatter',
      mode: 'lines+markers',
      name: stat.charAt(0).toUpperCase() + stat.slice(1),
    }));
  }, [facetStats]);

  // Generate threshold compliance data
  const thresholdData = useMemo<Partial<PlotData>[]>(() => {
    return [{
      x: facetStats.map(s => s.facet),
      y: facetStats.map(s => (s.aboveThreshold / s.count) * 100),
      type: 'bar',
      name: 'Above Threshold %',
      marker: {
        color: 'rgba(55, 128, 191, 0.7)',
      },
    }];
  }, [facetStats]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Stem Similarity Analysis
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Violin Plot */}
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '50%' } }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Similarity Distribution by Facet
            </Typography>
            <Plot
              data={violinData}
              layout={{
                height: 400,
                title: '',
                yaxis: { title: 'Cosine Similarity', range: [0, 1] },
                showlegend: false,
                shapes: [{
                  type: 'line',
                  x0: similarityThreshold,
                  x1: similarityThreshold,
                  y0: 0,
                  y1: 1,
                  yref: 'paper',
                  line: { color: 'red', width: 2, dash: 'dash' },
                }],
                annotations: [{
                  x: similarityThreshold,
                  y: 0.5,
                  xref: 'paper',
                  yref: 'y',
                  text: `Threshold: ${similarityThreshold}`,
                  showarrow: true,
                  arrowhead: 2,
                  ax: 0,
                  ay: -30,
                  bgcolor: 'white',
                  bordercolor: 'red',
                  borderwidth: 1,
                  borderpad: 4,
                }],
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                autosize: true,
                separators: '.,',
              } as Partial<Layout>}
              config={{ responsive: true }}
            />
          </Paper>
        </Box>

        {/* Histogram */}
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '50%' } }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Similarity Distribution
            </Typography>
            <Plot
              data={histogramData}
              layout={{
                title: 'Stem Similarity Distribution',
                xaxis: { title: 'Cosine Similarity', range: [0, 1] },
                yaxis: { title: 'Count' },
                shapes: [{
                  type: 'line',
                  x0: similarityThreshold,
                  x1: similarityThreshold,
                  y0: 0,
                  y1: 1,
                  yref: 'paper',
                  line: { color: 'red', width: 2, dash: 'dash' },
                }],
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                autosize: true,
                separators: '.,',
              } as Partial<Layout>}
              config={{ responsive: true }}
            />
          </Paper>
        </Box>

        {/* Statistics Line Plot */}
        <Box sx={{ flex: 1, maxWidth: '100%' }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Similarity Statistics by Facet
            </Typography>
            <Plot
              data={statsData}
              layout={{
                height: 400,
                title: '',
                xaxis: { title: 'Facet' },
                yaxis: { title: 'Similarity Score', range: [0, 1] },
                shapes: [{
                  type: 'line' as const,
                  x0: -0.5,
                  x1: Object.keys(facetGroups).length - 0.5,
                  y0: similarityThreshold,
                  y1: similarityThreshold,
                  line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash' as const,
                  },
                }],
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                autosize: true,
                separators: '.,',
              } as Partial<Layout>}
              config={{ responsive: true }}
            />
          </Paper>
        </Box>

        {/* Threshold Compliance */}
        <Box sx={{ flex: 1, maxWidth: '100%' }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Percentage of Stems Above Similarity Threshold
            </Typography>
            <Plot
              data={thresholdData}
              layout={{
                height: 400,
                xaxis: { title: {text: 'Facet' }},
                yaxis: { 
                  title: {text: 'Percentage'},
                  range: [0, 105],
                  ticksuffix: '%',
                },
                shapes: [{
                  type: 'line',
                  x0: -0.5,
                  x1: Object.keys(facetGroups).length - 0.5,
                  y0: 100,
                  y1: 100,
                  line: {
                    color: 'green',
                    width: 2,
                    dash: 'dash',
                  },
                }],
              }}
              config={{ responsive: true }}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default StemSimilarityVisualization;
