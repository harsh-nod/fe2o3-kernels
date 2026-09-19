import { webcrypto } from 'node:crypto';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthoringNavigation } from '../src/components/AuthoringNavigation';
import * as adapter from '../src/content/authoring-navigation.mjs';
import { syntheticNavigationInput } from '../scripts/tests/fixtures/authoring-navigation-fixture.mjs';
import { AUTHORING_NAVIGATION_RETAINED_INPUT } from '../src/content/authoring-navigation-retained-input';

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('navigates actual source attribution without collapsing constant and OR occurrences', async () => {
  const user = userEvent.setup();
  render(<AuthoringNavigation input={AUTHORING_NAVIGATION_RETAINED_INPUT} />);
  await user.click(await screen.findByRole('button', { name: 'Bytes 325–334: low | 256' }));
  const candidates = screen.getByRole('region', { name: 'Source attribution candidates' });
  expect(within(candidates).getAllByRole('button')).toHaveLength(2);
  await user.click(within(candidates).getByRole('button', { name: '0:0:3 U32(256)' }));
  expect(screen.getByText(/Boundary unavailable for this occurrence/u)).toBeInTheDocument();
  await user.click(within(candidates).getByRole('button', { name: '0:0:4 BitOr' }));
  expect(screen.getByRole('region', { name: 'Retained structural boundary' })).toHaveTextContent('%16: Scalar(U32)');
  expect(screen.getByText(/Retained ordinary-source navigation; diagnostic/u)).toBeInTheDocument();
});
it('keeps missing retained input unavailable, without synthetic source or operations', async () => {
  render(<AuthoringNavigation input={null} />);
  expect(await screen.findByText(/Retained source-navigation capture pending/u)).toHaveAttribute('data-state', 'unavailable');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
it('lists ambiguous same-span occurrences and shows only the explicitly retained boundary', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const user = userEvent.setup(); render(<AuthoringNavigation input={await syntheticNavigationInput()} />);
  await user.click(await screen.findByRole('button', { name: /Bytes.*low \| 256/u }));
  expect(screen.getByText(/Ambiguous attribution: 2 distinct/u)).toBeInTheDocument();
  const candidates = screen.getByRole('region', { name: 'Source attribution candidates' });
  expect(within(candidates).getAllByRole('button')).toHaveLength(2);
  expect(screen.queryByRole('region', { name: 'Retained structural boundary' })).not.toBeInTheDocument();
  await user.click(within(candidates).getByRole('button', { name: '0:0:0 U32(256)' }));
  expect(screen.getByText(/Boundary unavailable for this occurrence/u)).toBeInTheDocument();
  await user.click(within(candidates).getByRole('button', { name: '0:0:1 BitOr' }));
  const boundary = screen.getByRole('region', { name: 'Retained structural boundary' });
  expect(boundary).toHaveTextContent('%14: Scalar(U32), %15: Scalar(U32)');
  expect(boundary).toHaveTextContent('%16: Scalar(U32)');
  expect(screen.getByLabelText('Retained ordinary Rust source').querySelector('mark')).toHaveTextContent('low | 256');
  expect(screen.getByText('Unavailable: compiler-handoff text not retained.')).toBeInTheDocument();
  expect(screen.getByText('Unavailable: this export precedes the final artifact.')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it('discards an old snapshot immediately and ignores a late completed projection', async () => {
  const input = await syntheticNavigationInput(), ready = await adapter.projectAuthoringNavigation(input);
  let finish!: (value: adapter.NavigationProjection) => void;
  vi.spyOn(adapter, 'projectAuthoringNavigation').mockReturnValueOnce(new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce({ status: 'invalid', detail: 'New snapshot rejected.' });
  const { rerender } = render(<AuthoringNavigation input={input} />);
  rerender(<AuthoringNavigation input={{ ...input }} />);
  expect(await screen.findByText('New snapshot rejected.')).toBeInTheDocument();
  await act(async () => { finish(ready); });
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
