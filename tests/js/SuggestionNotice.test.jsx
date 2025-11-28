import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionNotice } from '../../src/admin/components/SuggestionNotice.jsx';

vi.mock('@wordpress/i18n', () => ({
	__: (text) => text,
	sprintf: (format, ...args) => {
		let result = format;
		args.forEach((arg) => {
			result = result.replace('%s', arg);
		});
		return result;
	},
}));

vi.mock('@wordpress/components', () => ({
	Button: (props) => <button {...props} />,
	Notice: ({ children }) => <div>{children}</div>,
}));

describe('SuggestionNotice', () => {
	it('renders nothing when there are no suggestions', () => {
		const { container } = render(<SuggestionNotice attachmentId={1} suggestions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders suggestions and triggers callbacks', () => {
		const onApply = vi.fn();
		const onDismiss = vi.fn();

		render(
			<SuggestionNotice
				attachmentId={42}
				suggestions={['Images', '2025/11']}
				onApply={onApply}
				onDismiss={onDismiss}
			/>
		);

		expect(screen.getByText('Suggested folders: Images, 2025/11')).toBeInTheDocument();

		fireEvent.click(screen.getByText('Apply'));
		expect(onApply).toHaveBeenCalledWith(42, ['Images', '2025/11']);

		fireEvent.click(screen.getByText('Dismiss'));
		expect(onDismiss).toHaveBeenCalledWith(42);
	});
});
