import { webcrypto } from 'node:crypto';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OrderedProgramObservation } from '../src/components/OrderedProgramObservation';
import { syntheticProgramInput } from '../scripts/tests/fixtures/ordered-program-observation-fixture.mjs';
import * as adapter from '../src/content/ordered-program-observation.mjs';
import { ORDERED_PROGRAM_RETAINED_INPUT } from '../src/content/ordered-program-retained-input';

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('defaults to pending capture without fabricated values', async () => {
  render(<OrderedProgramObservation input={null} />);
  expect(await screen.findByText(/Retained V17 capture pending/u)).toHaveAttribute('data-state', 'unavailable');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
it('renders retained real observations and keeps unused logical results separate from output memory', async () => {
  const user = userEvent.setup();
  render(<OrderedProgramObservation input={ORDERED_PROGRAM_RETAINED_INPUT} />);
  const variant = await screen.findByRole('combobox', { name: 'Recorded program variant' });
  expect(screen.getByText('Retained public diagnostic CPU observations; not a qualified compiler release.')).toBeInTheDocument();
  expect(screen.queryByText(/Synthetic test-only input/u)).not.toBeInTheDocument();
  await user.selectOptions(variant, '3');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Recorded program request case' }), '5');
  const phase = screen.getByRole('combobox', { name: 'Recorded whole-program checkpoint' });
  const values = screen.getByRole('table', { name: 'Recorded program logical values' });
  expect(values).toHaveTextContent('0x00000013 (19)');
  await user.selectOptions(phase, '1');
  expect(values).toHaveTextContent('0x00000017 (23)');
  expect(values).not.toHaveTextContent('0x00000013 (19)');
  await user.selectOptions(phase, '2');
  expect(values).toHaveTextContent('0x00000013 (19)');
  expect(screen.getByText(/Physical VGPR\/SGPR\/AGPR values.*unavailable/u)).toBeInTheDocument();
});
it('separates declared text from fixed-lane observed zero and absent/unqueried values', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const user = userEvent.setup(); render(<OrderedProgramObservation input={await syntheticProgramInput()} />);
  const plan = await screen.findByRole('table', { name: 'Declared program register roles' });
  expect(within(plan).getAllByRole('row')).toHaveLength(6);
  expect(screen.getByText(/Synthetic test-only input/u)).toBeInTheDocument();
  const values = screen.getByRole('table', { name: 'Recorded program logical values' });
  expect(values).toHaveTextContent('0x00000000 (0)'); expect(values).toHaveTextContent('Unavailable: not_in_scope');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Recorded whole-program checkpoint' }), '1');
  expect(within(values).getAllByText('Not queried at this checkpoint')).toHaveLength(3);
  expect(screen.queryByRole('combobox', { name: /lane/iu })).not.toBeInTheDocument();
  expect(screen.getByText('18446744073709551615')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it('resets phase on case/variant changes and retains sixteen declared steps', async () => {
  const user = userEvent.setup(); render(<OrderedProgramObservation input={await syntheticProgramInput()} />);
  await user.selectOptions(await screen.findByRole('combobox', { name: 'Recorded program variant' }), '4');
  expect(within(screen.getByRole('list', { name: 'Declared instruction sequence' })).getAllByRole('listitem')).toHaveLength(16);
  await user.selectOptions(screen.getByRole('combobox', { name: 'Recorded whole-program checkpoint' }), '3');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Recorded program request case' }), '5');
  expect(screen.getByRole('combobox', { name: 'Recorded whole-program checkpoint' })).toHaveValue('0');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Recorded program variant' }), '1');
  expect(screen.getByRole('combobox', { name: 'Recorded program request case' })).toHaveValue('0');
});
it('clears stale values immediately and ignores late asynchronous projections', async () => {
  const input = await syntheticProgramInput(), ready = await adapter.projectOrderedProgramObservation(input);
  let finish!: (value: adapter.ProgramProjection) => void;
  vi.spyOn(adapter, 'projectOrderedProgramObservation').mockReturnValueOnce(new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce({ status: 'invalid', detail: 'New capture rejected.' });
  const { rerender } = render(<OrderedProgramObservation input={input} />);
  rerender(<OrderedProgramObservation input={{ ...input }} />);
  expect(await screen.findByText('New capture rejected.')).toBeInTheDocument();
  await act(async () => { finish(ready); });
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
