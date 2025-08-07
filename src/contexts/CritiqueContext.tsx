"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { UploadedImage, CritiqueData } from "@/types/upload";

interface CritiqueContextType {
  // 現在の講評データ
  currentCritique: {
    image: UploadedImage;
    critique: CritiqueData;
    timestamp: number;
  } | null;

  // 講評データを設定する関数
  setCritiqueData: (data: {
    image: UploadedImage;
    critique: CritiqueData;
  }) => void;

  // 講評データをクリアする関数
  clearCritiqueData: () => void;

  // 講評データが存在するかチェック
  hasCritiqueData: boolean;
}

const CritiqueContext = createContext<CritiqueContextType | undefined>(
  undefined,
);

export function CritiqueProvider({ children }: { children: ReactNode }) {
  const [currentCritique, setCurrentCritique] = useState<{
    image: UploadedImage;
    critique: CritiqueData;
    timestamp: number;
  } | null>(null);

  const setCritiqueData = (data: {
    image: UploadedImage;
    critique: CritiqueData;
  }) => {
    setCurrentCritique({
      ...data,
      timestamp: Date.now(),
    });
  };

  const clearCritiqueData = () => {
    setCurrentCritique(null);
  };

  const hasCritiqueData = currentCritique !== null;

  const value: CritiqueContextType = {
    currentCritique,
    setCritiqueData,
    clearCritiqueData,
    hasCritiqueData,
  };

  return (
    <CritiqueContext.Provider value={value}>
      {children}
    </CritiqueContext.Provider>
  );
}

export function useCritique() {
  const context = useContext(CritiqueContext);
  if (context === undefined) {
    throw new Error("useCritique must be used within a CritiqueProvider");
  }
  return context;
}
