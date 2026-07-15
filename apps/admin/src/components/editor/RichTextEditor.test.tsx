import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { RichTextEditor } from './RichTextEditor';

beforeAll(() => {
  // ProseMirror relies on layout APIs that jsdom does not implement.
  if (!document.elementFromPoint) {
    document.elementFromPoint = () => null;
  }
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () =>
      ({
        item: () => null,
        length: 0,
        [Symbol.iterator]: function* () {},
      }) as unknown as DOMRectList;
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      }) as DOMRect;
  }
});

describe('RichTextEditor', () => {
  it('mounts a contenteditable surface and emits HTML from setContent path', async () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <RichTextEditor
        value=""
        onChange={onChange}
        aria-label={i18n.t('products.form.description')}
      />,
    );

    const editor = await screen.findByLabelText(i18n.t('products.form.description'));
    expect(editor).toHaveAttribute('contenteditable', 'true');

    // Controlled sync: parent drives value; editor must accept HTML without throwing.
    rerender(
      <RichTextEditor
        value="<p>Hello product</p>"
        onChange={onChange}
        aria-label={i18n.t('products.form.description')}
      />,
    );

    await waitFor(() => {
      expect(editor.innerHTML).toMatch(/Hello product/);
    });
  });

  it('toggles bold without throwing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<RichTextEditor value="<p>text</p>" onChange={onChange} />);

    const bold = await screen.findByRole('button', { name: i18n.t('editor.bold') });
    await user.click(bold);
    expect(bold).toHaveAttribute('aria-pressed');
  });
});
