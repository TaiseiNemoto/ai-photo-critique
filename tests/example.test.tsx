
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';
import { expect, test } from 'vitest';

test('Page component renders correctly', () => {
  render(<Page />);
  expect(screen.getByText(/Get started by editing/)).toBeInTheDocument();
});
