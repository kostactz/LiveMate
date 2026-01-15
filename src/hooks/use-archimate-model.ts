
import { useState, useEffect } from 'react';
import {
  parseArchimateXML,
  type ArchimateModel,
} from '@/lib/archimate-parser';

interface UseArchimateModelReturn {
  model: ArchimateModel | null;
  isLoading: boolean;
  error: Error | null;
}

export function useArchimateModel(): UseArchimateModelReturn {
  const [model, setModel] = useState<ArchimateModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAndParseModel = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/archimate.xml');
        if (!response.ok) {
          throw new Error(`Failed to fetch archimate.xml: ${response.statusText}`);
        }
        const xmlString = await response.text();
        const parsedModel = parseArchimateXML(xmlString);
        setModel(parsedModel);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred during parsing'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndParseModel();
  }, []); 

  return { model, isLoading, error };
}

    