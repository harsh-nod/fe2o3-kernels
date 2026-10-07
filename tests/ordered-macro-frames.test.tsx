import { webcrypto } from 'node:crypto';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OrderedMacroFrames } from '../src/components/OrderedMacroFrames';
import * as adapter from '../src/content/ordered-macro-frames.mjs';
import retained from '../examples/ordered_macro_frames_v1.json';

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('shows unavailable input without invented macro frames', async () => {
  render(<OrderedMacroFrames input={null} />);
  expect(await screen.findByText('Retained macro-frame capture pending.')).toHaveAttribute('data-state', 'unavailable');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
it('shows exact actual frames, source excerpts and unavailable physical claims', async () => {
  const user = userEvent.setup(), fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<OrderedMacroFrames input={retained} />);
  await user.selectOptions(await screen.findByRole('combobox', { name: 'Expansion frame' }), '1');
  expect(screen.getByRole('heading', { name: 'ordered_program_wrapper' })).toBeInTheDocument();
  expect(screen.getByText('ordered_program_wrapper!(a, b, c)')).toBeInTheDocument();
  expect(screen.getByText(/not an LLVM inline stack/u)).toBeInTheDocument();
  expect(screen.getByText(/physical register values and allocation lifetimes: unavailable/u)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it('stale selected canonical identity exposes no old source', async () => {
  render(<OrderedMacroFrames input={{ ...retained, selection: { ...retained.selection, canonicalSha256: '1'.repeat(64) } }} />);
  expect(await screen.findByText('Stale canonical selection.')).toHaveAttribute('data-state', 'invalid');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
it('clears prior frames immediately and ignores late results after selection changes', async () => {
  const ready = await adapter.projectOrderedMacroFrames(retained);
  let resolve!: (value: adapter.MacroFramesProjection) => void;
  vi.spyOn(adapter, 'projectOrderedMacroFrames').mockResolvedValueOnce(ready).mockReturnValueOnce(new Promise(done => { resolve = done; })).mockResolvedValueOnce({ status: 'invalid', detail: 'New exact selection refused.' });
  const { rerender } = render(<OrderedMacroFrames input={retained} />);
  expect(await screen.findByRole('combobox')).toBeInTheDocument();
  rerender(<OrderedMacroFrames input={{ ...retained }} />);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  rerender(<OrderedMacroFrames input={{ ...retained }} />);
  expect(await screen.findByText('New exact selection refused.')).toBeInTheDocument();
  await act(async () => { resolve(ready); });
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
it('never fetches a missing definition source', async () => {
  const capture = JSON.parse(retained.captureUtf8); capture.sources.definition = null;
  const captureUtf8 = JSON.stringify(capture);
  const hash = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(captureUtf8));
  const expectedCaptureSha256 = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<OrderedMacroFrames input={{ ...retained, captureUtf8, expectedCaptureSha256 }} />);
  expect(await screen.findAllByText('Source bytes unavailable; no file name or source text inferred.')).toHaveLength(2);
  expect(fetch).not.toHaveBeenCalled();
});
