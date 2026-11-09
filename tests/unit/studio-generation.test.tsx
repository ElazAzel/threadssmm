import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { StudioPage } from '../../src/pages/ContentPages';
import { IntentInput } from '../../src/components/IntentInput';
import { PRESETS } from '../../src/lib/intent-engine';
const mocks = vi.hoisted(() => ({ demo: true, api: vi.fn(), refresh: vi.fn(), create: vi.fn(), approve: vi.fn() }));
vi.mock('../../src/contexts/AuthContext', () => ({ useAuth: () => ({ demo: mocks.demo, getAccessToken: vi.fn() }) }));
vi.mock('../../src/contexts/WorkspaceContext', () => ({ useWorkspace: () => ({ workspace: { id: 'test', name: 'Test' }, brands: [], drafts: [], refresh: mocks.refresh, createQuickDraft: mocks.create, requestApproval: mocks.approve }) }));
vi.mock('../../src/lib/api', () => ({ authenticatedJson: mocks.api }));
vi.mock('../../src/components/AppShell', () => ({ AppShell: ({ children }: {
        children: ReactNode;
    }) => <main>{children}</main> }));
vi.mock('../../src/components/ModelSelector', () => ({ ModelSelector: () => <span>Model</span> }));
vi.mock('../../src/components/ResultManager', () => ({ ResultManager: ({ variants, onSave }: {
        variants: {
            id: string;
            text: string;
        }[];
        onSave: (id: string) => void;
    }) => <section aria-label="Варианты">{variants.map(v => <article key={v.id}>{v.text}<button onClick={() => onSave(v.id)}>Сохранить вариант</button></article>)}</section> }));
const mount = () => render(<MemoryRouter><StudioPage /></MemoryRouter>);
const typePrompt = (value: string) => fireEvent.change(screen.getByLabelText('Ваш запрос'), { target: { value } });
const result = { variants: [{ id: 'A', tone: 'test', text: 'Новый ответ для проверки.', hookScore: 1, complianceScore: 80, complianceNote: 'проверить' }] };
beforeEach(() => { mocks.demo = true; vi.clearAllMocks(); mocks.api.mockResolvedValue(result); mocks.refresh.mockResolvedValue(undefined); mocks.create.mockResolvedValue({ id: 'saved' }); });
afterEach(cleanup);
describe('Studio generation regressions', () => {
    it('starts empty and creates explicit demo variants without cloud API', () => { mount(); expect(screen.getByText('Варианты ещё не созданы')).toBeVisible(); typePrompt('сделай пост об образовании'); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); expect(screen.getAllByRole('article')).toHaveLength(3); expect(screen.getAllByText(/Демонстрационный пример:/)).toHaveLength(3); expect(mocks.api).not.toHaveBeenCalled(); });
    it('persists preset input and passes current pipeline result', () => { const ready = vi.fn(); render(<IntentInput onPromptReady={ready}/>); fireEvent.click(screen.getAllByRole('button', { name: new RegExp(PRESETS[0].label) })[0]); expect(screen.getByLabelText('Ваш запрос')).toHaveValue(PRESETS[0].description); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); expect(ready).toHaveBeenCalledTimes(1); expect(ready.mock.calls[0][0]).toBe(ready.mock.calls[0][1].hiddenPrompt); });
    it.each([['напиши тред про образование', 'thread'], ['напиши ответ на комментарий про образование', 'reply']])('uses current first-request format: %s', async (prompt, format) => { mocks.demo = false; mount(); typePrompt(prompt); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(1)); expect(mocks.api.mock.calls[0][2].format).toBe(format); await screen.findByRole('article'); });
    it('preserves manual override, consistent prompt, and generated format on save', async () => { mocks.demo = false; mount(); typePrompt('напиши пост про образование'); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); await screen.findByRole('article'); fireEvent.click(screen.getByRole('button', { name: 'Тред', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(2)); expect(mocks.api.mock.calls[1][2].format).toBe('thread'); expect(mocks.api.mock.calls[1][2].prompt).toContain('Создай тред (серию постов)'); expect(mocks.api.mock.calls[1][2].prompt).toContain('Формат: thread.'); expect(mocks.api.mock.calls[1][2].prompt).not.toContain('Создай пост на русском языке.'); await waitFor(() => expect(screen.getByRole('button', { name: 'Сгенерировать' })).toBeEnabled()); fireEvent.click(screen.getByRole('button', { name: 'Ответ', exact: true })); fireEvent.click(screen.getByRole('button', { name: 'Сохранить вариант' })); expect(mocks.create.mock.calls[0][1]).toBe('thread'); typePrompt('напиши пост про другое образование'); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); await waitFor(() => expect(mocks.api).toHaveBeenCalledTimes(3)); expect(mocks.api.mock.calls[2][2].format).toBe('post'); await waitFor(() => expect(screen.getByRole('button', { name: 'Сгенерировать' })).toBeEnabled()); });
    it('guards repeated paid calls and releases lock after error', async () => { mocks.demo = false; let reject!: (error: Error) => void; const pending = new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }); mocks.api.mockReturnValueOnce(pending); mount(); typePrompt('напиши пост про образование'); const button = screen.getByRole('button', { name: 'Сгенерировать' }); act(() => { fireEvent.click(button); fireEvent.click(button); }); expect(mocks.api).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Генерация…' })).toBeDisabled(); await act(async () => { reject(new Error('Ошибка модели')); await pending.catch(() => undefined); }); expect(screen.getByText('Ошибка модели')).toBeVisible(); fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать' })); await screen.findByRole('article'); expect(mocks.api).toHaveBeenCalledTimes(2); });
});
