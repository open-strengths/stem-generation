import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import { StemItem } from '../types';

interface StemListProps {
  stems: StemItem[];
}

const StemList: React.FC<StemListProps> = ({ stems }) => {
  if (stems.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" color="textSecondary" align="center">
          No stems generated yet. Use the form above to generate some!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Generated Stems
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Facet</TableCell>
              <TableCell>Anchor</TableCell>
              <TableCell>Stem Text</TableCell>
              <TableCell align="right">Similarity</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stems.map((stem, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  '&:hover': { backgroundColor: 'action.selected' }
                }}
              >
                <TableCell>{stem.facet}</TableCell>
                <TableCell>{stem.anchor}</TableCell>
                <TableCell>{stem.stem_text}</TableCell>
                <TableCell align="right">
                  {stem.cosine_similarity.toFixed(3)}
                </TableCell>
                <TableCell>
                  {stem.drift_flag ? 'Needs Review' : 'Valid'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default StemList;
