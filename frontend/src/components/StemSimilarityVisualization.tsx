import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { StemItem } from '../types';

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

  // Generate violin plot data
  const violinData = useMemo(() => {
    return facetStats.map(stat => ({
      type: 'violin',
      y: stat.similarities,
      name: stat.facet,
      box: { visible: true },
      meanline: { visible: true },
      points: 'all',
      pointpos: 0,
      jitter: 0.1,
      scalemode: 'count',
      side: 'positive',
      width: 0.6,
      line: { width: 1 },
    }));
  }, [facetStats]);

  // Generate histogram data
  const histogramData = useMemo(() => {
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

  // Generate statistics line plot data
  const statsData = useMemo(() => {
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
  const thresholdData = useMemo(() => {
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
      
      <Grid container spacing={3}>
        {/* Violin Plot */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Similarity Distribution by Facet
            </Typography>
            <Plot
              data={violinData}
              layout={{
                height: 400,
                yaxis: { title: 'Cosine Similarity', range: [0, 1] },
                showlegend: false,
                shapes: [{
                  type: 'line',
                  x0: -0.5,
                  x1: Object.keys(facetGroups).length - 0.5,
                  y0: similarityThreshold,
                  y1: similarityThreshold,
                  line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash',
                  },
                }],
                annotations: [{
                  x: 0,
                  y: similarityThreshold,
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
              }}
              config={{ responsive: true }}
            />
          </Paper>
        </Grid>

        {/* Histogram */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Similarity Distribution
            </Typography>
            <Plot
              data={histogramData}
              layout={{
                height: 400,
                xaxis: { title: 'Cosine Similarity', range: [0, 1] },
                yaxis: { title: 'Count' },
                shapes: [{
                  type: 'line',
                  x0: similarityThreshold,
                  x1: similarityThreshold,
                  y0: 0,
                  y1: 1,
                  yref: 'paper',
                  line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash',
                  },
                }],
              }}
              config={{ responsive: true }}
            />
          </Paper>
        </Grid>

        {/* Statistics Line Plot */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Similarity Statistics by Facet
            </Typography>
            <Plot
              data={statsData}
              layout={{
                height: 400,
                xaxis: { title: 'Facet' },
                yaxis: { title: 'Similarity Score', range: [0, 1] },
                shapes: [{
                  type: 'line',
                  x0: -0.5,
                  x1: Object.keys(facetGroups).length - 0.5,
                  y0: similarityThreshold,
                  y1: similarityThreshold,
                  line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash',
                  },
                }],
              }}
              config={{ responsive: true }}
            />
          </Paper>
        </Grid>

        {/* Threshold Compliance */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Percentage of Stems Above Similarity Threshold
            </Typography>
            <Plot
              data={thresholdData}
              layout={{
                height: 400,
                xaxis: { title: 'Facet' },
                yaxis: { 
                  title: 'Percentage',
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default StemSimilarityVisualization;
