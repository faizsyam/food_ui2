/**
 * useOrderSchema.js
 *
 * Custom React hook that manages the full lifecycle of an order schema:
 * fetching from the AI agent, holding state, and exposing dispatch.
 */

import { useCallback, useRef, useState } from 'react';
import schemaReducer from '../lib/schemaReducer';
import { getCachedSchema, saveCachedSchema } from '../lib/recentRequests';

/**
 * @param {Array} restaurants — full restaurants array (for potential future use)
 * @param {Array} menus      — full menus array (for potential future use)
 * @returns {object}
 */
export default function useOrderSchema(restaurants, menus) {
  // Schema state
  const [schema, setSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track the last request to avoid duplicate submissions
  const lastRequestRef = useRef(null);

  //
  // dispatch — wraps schemaReducer to produce immutable updates
  //
  const dispatch = useCallback((action) => {
    setSchema((prev) => schemaReducer(prev, action));
  }, []);

  //
  // submitRequest — POST to AI agent (or load from cache) and set the returned schema
  //
  const submitRequest = useCallback(async (userRequestString) => {
    if (!userRequestString || !userRequestString.trim()) {
      setError('Request cannot be empty');
      return;
    }

    // Skip duplicate requests
    if (lastRequestRef.current === userRequestString) {
      return;
    }

    lastRequestRef.current = userRequestString;

    // Check local cache before hitting the AI
    const cached = getCachedSchema(userRequestString);
    if (cached) {
      setSchema(cached);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: userRequestString }),
      });

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If error body is not JSON, keep the status-based message
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }

      if (!data.schema || !Array.isArray(data.schema.slots) || typeof data.schema.layout !== 'object') {
        throw new Error('Invalid schema returned');
      }

      setSchema(data.schema);
      saveCachedSchema(userRequestString, data.schema);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  //
  // reset — clear schema back to null
  //
  const reset = useCallback(() => {
    setSchema(null);
    setError(null);
    setIsLoading(false);
    lastRequestRef.current = null;
  }, []);

  return {
    schema,
    isLoading,
    error,
    submitRequest,
    dispatch,
    reset,
  };
}
