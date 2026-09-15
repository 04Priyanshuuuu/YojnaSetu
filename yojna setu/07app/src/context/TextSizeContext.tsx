import React, { createContext, useContext, useEffect, useState } from "react";
import { getItem, setItem } from "../utils/storage";

export type TextSize = "small" | "default" | "large";
interface TextSizeContextValue {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  decreaseText: () => void;
  resetText: () => void;
  increaseText: () => void;
}
const STORAGE_KEY = "yojnasetu_text_size";
const TextSizeContext = createContext<TextSizeContextValue | undefined>(
  undefined,
);

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>("default");
  useEffect(() => {
    getItem(STORAGE_KEY).then((value) => {
      if (value === "small" || value === "large" || value === "default")
        setTextSize(value);
    });
  }, []);
  useEffect(() => {
    void setItem(STORAGE_KEY, textSize);
  }, [textSize]);
  return (
    <TextSizeContext.Provider
      value={{
        textSize,
        setTextSize,
        decreaseText: () =>
          setTextSize((current) => (current === "large" ? "default" : "small")),
        resetText: () => setTextSize("default"),
        increaseText: () =>
          setTextSize((current) => (current === "small" ? "default" : "large")),
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
}
export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (!context)
    throw new Error("useTextSize must be used within a TextSizeProvider");
  return context;
}
