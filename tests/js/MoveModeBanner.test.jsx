/**
 * MoveModeBanner component tests.
 *
 * Tests the visual banner shown during keyboard move mode.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoveModeBanner from '../../src/admin/components/MoveModeBanner.jsx';

// Mock WordPress i18n
vi.mock('@wordpress/i18n', () => ({
	__: (text) => text,
	sprintf: (text, ...args) => {
		let result = text;
		args.forEach((arg, i) => {
			result = result.replace(`%${i + 1}$s`, arg).replace(`%${i + 1}$d`, arg).replace('%s', arg).replace('%d', arg);
		});
		return result;
	},
}));

// Mock WordPress components
vi.mock('@wordpress/components', () => ({
	Button: ({ children, onClick, ...props }) => (
		<button onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

describe('MoveModeBanner', () => {
	it('renders banner with item count', () => {
		render(
			<MoveModeBanner itemCount={3} onCancel={vi.fn()} />
		);
		expect(screen.getByText(/items ready to move/)).toBeInTheDocument();
	});

	it('displays correct item count for single item', () => {
		render(
			<MoveModeBanner itemCount={1} onCancel={vi.fn()} />
		);
		expect(screen.getByText('1 item ready to move')).toBeInTheDocument();
	});

	it('displays correct item count for multiple items', () => {
		render(
			<MoveModeBanner itemCount={5} onCancel={vi.fn()} />
		);
		expect(screen.getByText('5 items ready to move')).toBeInTheDocument();
	});

	it('displays instructions text', () => {
		render(
			<MoveModeBanner itemCount={1} onCancel={vi.fn()} />
		);
		expect(screen.getByText('Navigate to a folder and press Enter to drop')).toBeInTheDocument();
	});

	it('has a cancel button', () => {
		render(
			<MoveModeBanner itemCount={1} onCancel={vi.fn()} />
		);
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});

	it('calls onCancel when cancel button clicked', () => {
		const onCancel = vi.fn();
		render(
			<MoveModeBanner itemCount={1} onCancel={onCancel} />
		);

		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('has the correct CSS class', () => {
		render(
			<MoveModeBanner itemCount={1} onCancel={vi.fn()} />
		);
		expect(document.querySelector('.vmf-move-mode-banner')).toBeInTheDocument();
	});

	it('has role status for screen readers', () => {
		render(
			<MoveModeBanner itemCount={2} onCancel={vi.fn()} />
		);
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('has aria-live polite', () => {
		render(
			<MoveModeBanner itemCount={2} onCancel={vi.fn()} />
		);
		expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
	});

	it('updates item count dynamically', () => {
		const { rerender } = render(
			<MoveModeBanner itemCount={3} onCancel={vi.fn()} />
		);
		expect(screen.getByText('3 items ready to move')).toBeInTheDocument();

		rerender(
			<MoveModeBanner itemCount={10} onCancel={vi.fn()} />
		);
		expect(screen.getByText('10 items ready to move')).toBeInTheDocument();
	});

	it('handles itemCount of 0', () => {
		render(
			<MoveModeBanner itemCount={0} onCancel={vi.fn()} />
		);
		expect(screen.getByText('0 items ready to move')).toBeInTheDocument();
	});
});
