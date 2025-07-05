import { yupResolver } from '@hookform/resolvers/yup';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as yup from 'yup';
import { generateStems } from '../services/api';
import { StemItem } from '../types';

interface GenerationFormData {
  temperature: number;
  max_tokens: number;
  model: string;
  additional_constraints: string;
  constraints?: string;
  bulk?: boolean;
}

const DEFAULT_CONSTRAINTS = [
  'Be written in the first person',
  'Be present-tense, affirmative (no negation)',
  'Be ≤15 words',
  'Use neutral, CEFR-B1 language',
  'Vary in context or wording but keep the core meaning'
].join('\n');

const schema = yup.object().shape({
  temperature: yup
    .number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .required('Temperature is required'),
  max_tokens: yup
    .number()
    .min(100, 'Max tokens must be at least 100')
    .max(4000, 'Max tokens must be at most 4000')
    .required('Max tokens is required'),
  model: yup.string().required('Model is required'),
  additional_constraints: yup.string()
});

interface StemGenerationFormProps {
  onGenerate: (stems: StemItem[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const StemGenerationForm: React.FC<StemGenerationFormProps> = ({
  onGenerate,
  isLoading,
  setIsLoading,
}) => {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerationFormData>({
    resolver: yupResolver(schema) as any, // Type assertion to handle yup resolver type mismatch
    defaultValues: {
      temperature: 0.7,
      max_tokens: 800,
      model: 'gpt-4o',
      additional_constraints: '',
    },
  });

  const onSubmit: SubmitHandler<GenerationFormData> = async (formData) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Combine default constraints with additional ones
      const constraints = [
        'Default Constraints:',
        ...DEFAULT_CONSTRAINTS.split('\n'),
        '',
        'Additional Constraints:',
        formData.additional_constraints || 'None'
      ].join('\n');

      // Create the request data with proper types
      const requestData = {
        ...formData,
        constraints,
        bulk: true as const
      };

      const generatedStems = await generateStems(requestData);
      
      onGenerate(generatedStems);
    } catch (err) {
      setError('Failed to generate stems. Please try again.');
      console.error('Error generating stems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Generate Questionnaire Stems
      </Typography>
      <Typography color="textSecondary" paragraph>
        This will generate stems for all facets in bulk.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Default Constraints (applied to all generations):
        </Typography>
        <Box 
          component="pre" 
          sx={{
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
          }}
        >
          {DEFAULT_CONSTRAINTS}
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Box>
            <TextField
              fullWidth
              label="Additional Constraints (optional)"
              {...register('additional_constraints')}
              error={!!errors.additional_constraints}
              helperText="Add any additional constraints or instructions here"
              disabled={isLoading}
              multiline
              rows={4}
              placeholder="Example:\n- Use specific terminology\n- Focus on workplace context"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <Box>
              <TextField
                fullWidth
                label="Temperature"
                type="number"
                inputProps={{
                  min: 0,
                  max: 2,
                  step: 0.1,
                }}
                {...register('temperature', { valueAsNumber: true })}
                error={!!errors.temperature}
                helperText={errors.temperature?.message || 'Controls randomness (0 = deterministic, 2 = most random)'}
                disabled={isLoading}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Max Tokens"
                type="number"
                inputProps={{
                  min: 100,
                  max: 4000,
                  step: 100,
                }}
                {...register('max_tokens', { valueAsNumber: true })}
                error={!!errors.max_tokens}
                helperText={errors.max_tokens?.message || 'Maximum number of tokens to generate'}
                disabled={isLoading}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                select
                label="Model"
                {...register('model')}
                error={!!errors.model}
                helperText={errors.model?.message}
                disabled={isLoading}
                SelectProps={{
                  native: true
                }}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </TextField>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              size="large"
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 200 }}
            >
              {isLoading ? 'Generating...' : 'Generate All Stems'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default StemGenerationForm;
