import {
  Box,
  Container,
  CssBaseline,
  Paper,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import StemList from './components/StemList';
import StemSimilarityVisualization from './components/StemSimilarityVisualization';
import StemGenerationForm from './components/StemGenerationForm';
import { StemItem } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const initialStems: StemItem[] = [
  {
    facet: 'facet_1',
    anchor: 'anchor_1',
    stem: 'stem_text_1',
    cosine_similarity: 0.8,
    drift_flag: false,
    length_flag: false,
  },
  {
    facet: 'facet_2',
    anchor: 'anchor_2',
    stem: 'stem_text_2',
    cosine_similarity: 0.9,
    drift_flag: false,
    length_flag: false,
  },
  {
    facet: 'facet_2',
    anchor: 'anchor_2',
    stem: 'stem_text_3',
    cosine_similarity: 0.7,
    drift_flag: true,
    length_flag: false,
  },
];

const App: React.FC = () => {
  const [stems, setStems] = useState<StemItem[]>(initialStems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateStems = async (generatedStems: StemItem[]) => {
    setStems(generatedStems);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Stem Generation Tool
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Generate and validate questionnaire stems for all facets in bulk.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <StemGenerationForm
            onGenerate={handleGenerateStems}
            isLoading={isGenerating}
            setIsLoading={setIsGenerating}
          />
        </Box>

        {stems.length > 0 && (
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Stem List" />
              <Tab label="Similarity Analysis" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <StemList stems={stems} />
              )}
              {tabValue === 1 && (
                <StemSimilarityVisualization stems={stems} />
              )}
            </Box>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
