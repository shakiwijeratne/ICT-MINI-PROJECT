import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for auto-saving and restoring form drafts in localStorage.
 * 
 * @param key Unique key for localStorage (e.g., diary_draft_${userId})
 * @param initialValues Default structure/data when no draft exists
 */
export function useFormDraft<T extends Record<string, any>>(key: string, initialValues: T) {
  // 1. Initialize state: Read existing draft and MERGE with defaults
  const [formData, setFormData] = useState<T>(() => {
    if (!key) return initialValues;
    try {
      const savedDraft = localStorage.getItem(key);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft) as Partial<T>;
        // CRITICAL FIX: Merge initialValues with the parsed draft.
        // This guarantees newly added fields (like aiEnhanced) exist!
        return { ...initialValues, ...parsedDraft };
      }
    } catch (error) {
      console.error(`Error loading draft for key "${key}":`, error);
    }
    return initialValues;
  });

  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    return !!localStorage.getItem(key);
  });

  // 2. Auto-save to localStorage whenever formData or key updates
  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(formData));
      setHasDraft(true);
    } catch (error) {
      console.error(`Error saving draft for key "${key}":`, error);
    }
  }, [key, formData]);

  // 3. Helper function to update individual fields cleanly
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // 4. Clears draft after successful Firestore form submission
  const clearDraft = useCallback(() => {
    if (!key) return;
    try {
      localStorage.removeItem(key);
      setFormData(initialValues);
      setHasDraft(false);
    } catch (error) {
      console.error(`Error clearing draft for key "${key}":`, error);
    }
  }, [key, initialValues]);

  return {
    formData,
    setFormData,
    updateField,
    clearDraft,
    hasDraft,
  };
}