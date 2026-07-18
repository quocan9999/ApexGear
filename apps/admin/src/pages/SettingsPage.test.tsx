import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { SettingsPage } from './SettingsPage';

vi.mock('../services/settings.service', () => ({
  settingsService: {
    list: vi.fn(),
    update: vi.fn(),
  },
}));

import { settingsService } from '../services/settings.service';

function renderPage() {
  return render(<SettingsPage />);
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(settingsService.list).mockReset();
    vi.mocked(settingsService.update).mockReset();
    vi.mocked(settingsService.list).mockResolvedValue([
      { id: 's1', key: 'store_name', value: 'ApexGear' },
      { id: 's2', key: 'shipping_fee', value: '30000' },
    ]);
    vi.mocked(settingsService.update).mockResolvedValue({
      id: 's1',
      key: 'store_name',
      value: 'ApexGear Pro',
    });
  });

  it('renders settings with values', async () => {
    renderPage();
    expect(await screen.findByDisplayValue('ApexGear')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('pages.settings.group.general'))).toBeInTheDocument();
    expect(screen.queryByDisplayValue('30000')).not.toBeInTheDocument();
  });

  it('updates a setting on save', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByDisplayValue('ApexGear');
    const input = screen.getByLabelText(i18n.t('pages.settings.key.store_name'));
    await user.clear(input);
    await user.type(input, 'ApexGear Pro');

    const saveButtons = screen.getAllByRole('button', { name: i18n.t('pages.settings.save') });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(settingsService.update).toHaveBeenCalledWith('store_name', 'ApexGear Pro');
    });
  });
});
