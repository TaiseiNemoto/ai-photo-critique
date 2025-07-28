import { render, screen } from "@testing-library/react";
import Page from "@/app/page";
import { expect, test } from "vitest";

test("Page component renders correctly", () => {
  render(<Page />);
  expect(screen.getByText(/Photo-Critique/)).toBeInTheDocument();
  expect(screen.getByText(/あなたの写真を数秒でAI講評/)).toBeInTheDocument();
});
