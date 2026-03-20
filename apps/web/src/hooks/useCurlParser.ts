'use client';

import { useState, useCallback } from 'react';
import { parseCurl, type ParsedCurl } from '@/utils/curl.parser';

export function useCurlParser() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedCurl | null>(null);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const updateCurlInput = useCallback((value: string) => {
    setCurlInput(value);

    // Live preview for inputs longer than 10 characters
    if (value.length > 10) {
      try {
        const parsed = parseCurl(value);
        setParsedPreview(parsed);
        setParseError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Invalid curl command';
        setParseError(errorMessage);
        setParsedPreview(null);
      }
    } else {
      setParsedPreview(null);
      setParseError(null);
    }
  }, []);

  const parseAndLoad = useCallback((): ParsedCurl | null => {
    try {
      const parsed = parseCurl(curlInput);
      setParseError(null);
      return parsed;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid curl command';
      setParseError(errorMessage);
      setParsedPreview(null);
      return null;
    }
  }, [curlInput]);

  return {
    isModalOpen,
    openModal,
    closeModal,
    curlInput,
    setCurlInput: updateCurlInput,
    parseError,
    parsedPreview,
    parseAndLoad,
  };
}
