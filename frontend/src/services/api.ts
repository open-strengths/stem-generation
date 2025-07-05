import axios from 'axios';
import { StemItem, GenerationFormData } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateStems = async (data: Partial<GenerationFormData>): Promise<StemItem[]> => {
  const response = await api.post('/generate-sample', data);
  return response.data;
};


