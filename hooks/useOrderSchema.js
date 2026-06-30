/**
 * useOrderSchema.js
 *
 * Custom React hook that manages the full lifecycle of an order schema:
 * fetching from the AI agent, holding state, and exposing dispatch.
 */

import { useCallback, useRef, useState } from 'react';
import schemaReducer from '../lib/schemaReducer';
import { getCachedSchema, saveCachedSchema, saveRequest } from '../lib/recentRequests';

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
  const [history, setHistory] = useState([]);

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
  const submitRequest = useCallback(async (userRequestString, currentSchema = null) => {
    if (!userRequestString || !userRequestString.trim()) {
      setError('Request cannot be empty');
      return;
    }

    // Skip duplicate requests (only for initial requests without previousSchema)
    if (!currentSchema && lastRequestRef.current === userRequestString) {
      return;
    }

    lastRequestRef.current = userRequestString;

    // For refinements (when previousSchema is provided), skip cache entirely
    // since results depend on context
    if (!currentSchema) {
      const cached = getCachedSchema(userRequestString);
      if (cached) {
        setSchema(cached);
        setError(null);
        // Still update history for completeness
        setHistory((prev) => [
          { request: userRequestString, schema: cached, timestamp: new Date() },
          ...prev,
        ]);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: userRequestString,
          previousSchema: currentSchema,
        }),
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

      if (!data.schema || !Array.isArray(data.schema.slots)) {
        throw new Error('Invalid schema returned');
      }

      // Update state
      setSchema(data.schema);
      setHistory((prev) => [
        { request: userRequestString, schema: data.schema, timestamp: new Date() },
        ...prev,
      ]);

      // Only save to localStorage on the first submit (not refinements)
      if (!currentSchema) {
        saveRequest(userRequestString);
        saveCachedSchema(userRequestString, data.schema);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  //
  // reset — clear schema and history
  //
  const reset = useCallback(() => {
    setSchema(null);
    setError(null);
    setIsLoading(false);
    setHistory([]);
    lastRequestRef.current = null;
  }, []);

  return {
    schema,
    history,
    isLoading,
    error,
    submitRequest,
    dispatch,
    reset,
  };
}
