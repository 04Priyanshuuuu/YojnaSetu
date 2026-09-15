import React, { createContext, useContext, useEffect, useState } from "react";
import { getItem, setItem } from "../utils/storage";

interface ComparisonContextValue {
  selectedSchemeIds: string[];
  addSchemeToCompare: (schemeId: string) => boolean;
  removeSchemeFromCompare: (schemeId: string) => void;
  clearComparison: () => void;
  isInComparison: (schemeId: string) => boolean;
  toggleComparison: (schemeId: string) => void;
  warningMessage: string | null;
  setWarningMessage: (message: string | null) => void;
}

const STORAGE_KEY = "yojnasetu_compare_ids";
const ComparisonContext = createContext<ComparisonContextValue | undefined>(
  undefined,
);

export function ComparisonProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedSchemeIds, setSelectedSchemeIds] = useState<string[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) setSelectedSchemeIds(parsed.slice(0, 4));
      } catch {
        // Ignore malformed persisted state.
      }
    });
  }, []);

  useEffect(() => {
    void setItem(STORAGE_KEY, JSON.stringify(selectedSchemeIds));
  }, [selectedSchemeIds]);

  const addSchemeToCompare = (schemeId: string) => {
    if (!schemeId || selectedSchemeIds.includes(schemeId))
      return Boolean(schemeId);
    if (selectedSchemeIds.length >= 4) {
      setWarningMessage("You can compare a maximum of 4 schemes at a time.");
      return false;
    }
    setSelectedSchemeIds((current) => [...current, schemeId]);
    setWarningMessage(null);
    return true;
  };

  const removeSchemeFromCompare = (schemeId: string) => {
    setSelectedSchemeIds((current) => current.filter((id) => id !== schemeId));
    setWarningMessage(null);
  };

  const clearComparison = () => {
    setSelectedSchemeIds([]);
    setWarningMessage(null);
  };

  const isInComparison = (schemeId: string) =>
    selectedSchemeIds.includes(schemeId);
  const toggleComparison = (schemeId: string) =>
    isInComparison(schemeId)
      ? removeSchemeFromCompare(schemeId)
      : addSchemeToCompare(schemeId);

  return (
    <ComparisonContext.Provider
      value={{
        selectedSchemeIds,
        addSchemeToCompare,
        removeSchemeFromCompare,
        clearComparison,
        isInComparison,
        toggleComparison,
        warningMessage,
        setWarningMessage,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context)
    throw new Error("useComparison must be used within a ComparisonProvider");
  return context;
}
