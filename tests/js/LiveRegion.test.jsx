/**
 * LiveRegion component tests.
 *
 * Tests ARIA live region for screen reader announcements.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveRegion from '../../src/shared/components/LiveRegion.jsx';

// Mock WordPress i18n
vi.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

describe('LiveRegion', () => {
	it('renders without crashing', () => {
		render(<LiveRegion announcement="" />);
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('has aria-live polite attribute', () => {
		render(<LiveRegion announcement="" />);
		const region = screen.getByRole('status');
		expect(region).toHaveAttribute('aria-live', 'polite');
	});

	it('has aria-atomic true attribute', () => {
		render(<LiveRegion announcement="" />);
		const region = screen.getByRole('status');
		expect(region).toHaveAttribute('aria-atomic', 'true');
	});

	it('displays the announcement message', () => {
		render(<LiveRegion announcement="File moved successfully" />);
		const region = screen.getByRole('status');
		expect(region).toHaveTextContent('File moved successfully');
	});

	it('updates when announcement changes', () => {
		const { rerender } = render(<LiveRegion announcement="First message" />);
		const region = screen.getByRole('status');
		expect(region).toHaveTextContent('First message');

		rerender(<LiveRegion announcement="Second message" />);
		expect(region).toHaveTextContent('Second message');
	});

	it('renders empty when no announcement provided', () => {
		render(<LiveRegion announcement="" />);
		const region = screen.getByRole('status');
		expect(region.textContent).toBe('');
	});

	it('is visually hidden with sr-only class', () => {
		render(<LiveRegion announcement="Hidden message" />);
		const region = screen.getByRole('status');
		expect(region).toHaveClass('vmf-sr-only');
	});

	it('includes drag instructions element', () => {
		render(<LiveRegion announcement="" />);
		const instructions = document.getElementById('vmf-drag-instructions');
		expect(instructions).toBeInTheDocument();
	});

	it('drag instructions are visually hidden', () => {
		render(<LiveRegion announcement="" />);
		const instructions = document.getElementById('vmf-drag-instructions');
		expect(instructions).toHaveClass('vmf-sr-only');
	});

	it('renders with undefined announcement as empty', () => {
		const { container } = render(<LiveRegion />);
		const region = container.querySelector('[aria-live="polite"]');
		expect(region).toBeInTheDocument();
		expect(region.textContent).toBe('');
	});
});
