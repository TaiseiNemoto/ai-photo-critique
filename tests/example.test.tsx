import { render, screen } from "@testing-library/react";
import Page from "@/app/page";
import { expect, test, vi } from "vitest";
import { CritiqueProvider } from "@/contexts/CritiqueContext";

// Next.js navigation hooks をモック
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Sonner toast をモック
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

test("Page component renders correctly", () => {
  render(
    <CritiqueProvider>
      <Page />
    </CritiqueProvider>,
  );
  expect(screen.getByText(/Photo-Critique/)).toBeInTheDocument();
  expect(screen.getByText(/あなたの写真を数秒でAI講評/)).toBeInTheDocument();
});
