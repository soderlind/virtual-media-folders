/**
 * useMoveMode hook tests.
 *
 * Tests keyboard-accessible move mode functionality.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMoveMode } from '../../src/shared/hooks/useMoveMode.js';

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

describe('useMoveMode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		delete window.vmfMoveMode;
	});

	afterEach(() => {
		vi.useRealTimers();
		delete window.vmfMoveMode;
	});

	it('initializes with inactive state', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));
		
		expect(result.current.isActive).toBe(false);
		expect(result.current.grabbedMedia).toBeNull();
		expect(result.current.announcement).toBe('');
	});

	it('pickUp activates move mode with single item', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.pickUp([{ id: 123, title: 'photo.jpg' }]);
		});

		expect(result.current.isActive).toBe(true);
		expect(result.current.grabbedMedia).toEqual([{ id: 123, title: 'photo.jpg' }]);
		
		// Advance timers for announcement
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(result.current.announcement).toContain('photo.jpg picked up');
	});

	it('pickUp activates move mode with multiple items', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		const items = [
			{ id: 1, title: 'a.jpg' },
			{ id: 2, title: 'b.jpg' },
			{ id: 3, title: 'c.jpg' },
		];

		act(() => {
			result.current.pickUp(items);
		});

		expect(result.current.isActive).toBe(true);
		expect(result.current.grabbedMedia).toHaveLength(3);
		
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(result.current.announcement).toContain('3 items picked up');
	});

	it('cancel deactivates move mode', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.pickUp([{ id: 123, title: 'test.jpg' }]);
		});
		expect(result.current.isActive).toBe(true);

		act(() => {
			result.current.cancel();
		});

		expect(result.current.isActive).toBe(false);
		expect(result.current.grabbedMedia).toBeNull();
		
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(result.current.announcement).toBe('Move cancelled');
	});

	it('drop calls onMove callback for each item and deactivates', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.pickUp([
				{ id: 1, title: 'a.jpg' },
				{ id: 2, title: 'b.jpg' },
			]);
		});

		act(() => {
			result.current.drop(456, 'Documents');
		});

		expect(onMove).toHaveBeenCalledTimes(2);
		expect(onMove).toHaveBeenCalledWith(1, 456);
		expect(onMove).toHaveBeenCalledWith(2, 456);
		expect(result.current.isActive).toBe(false);
		expect(result.current.grabbedMedia).toBeNull();
		
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(result.current.announcement).toContain('Documents');
	});

	it('drop does nothing when not active', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.drop(456, 'Documents');
		});

		expect(onMove).not.toHaveBeenCalled();
	});

	it('toggle picks up when inactive', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.toggle([{ id: 789, title: 'image.jpg' }]);
		});

		expect(result.current.isActive).toBe(true);
		expect(result.current.grabbedMedia).toEqual([{ id: 789, title: 'image.jpg' }]);
	});

	it('toggle cancels when active', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.pickUp([{ id: 789, title: 'image.jpg' }]);
		});
		expect(result.current.isActive).toBe(true);

		act(() => {
			result.current.toggle([{ id: 789, title: 'image.jpg' }]);
		});

		expect(result.current.isActive).toBe(false);
	});

	it('exposes global window.vmfMoveMode', () => {
		const onMove = vi.fn();
		renderHook(() => useMoveMode(onMove));

		expect(window.vmfMoveMode).toBeDefined();
		expect(typeof window.vmfMoveMode.pickUp).toBe('function');
		expect(typeof window.vmfMoveMode.cancel).toBe('function');
		expect(typeof window.vmfMoveMode.isActive).toBe('function');
	});

	it('window.vmfMoveMode.pickUp activates move mode', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			window.vmfMoveMode.pickUp([{ id: 42, title: 'test.png' }]);
		});

		expect(result.current.isActive).toBe(true);
	});

	it('window.vmfMoveMode.cancel deactivates move mode', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.pickUp([{ id: 42, title: 'test.png' }]);
		});
		expect(result.current.isActive).toBe(true);

		act(() => {
			window.vmfMoveMode.cancel();
		});

		expect(result.current.isActive).toBe(false);
	});

	it('window.vmfMoveMode.isActive returns current state', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		expect(window.vmfMoveMode.isActive()).toBe(false);

		act(() => {
			result.current.pickUp([{ id: 1, title: 'x.jpg' }]);
		});

		expect(window.vmfMoveMode.isActive()).toBe(true);
	});

	it('cleans up window.vmfMoveMode on unmount', () => {
		const onMove = vi.fn();
		const { unmount } = renderHook(() => useMoveMode(onMove));

		expect(window.vmfMoveMode).toBeDefined();

		unmount();

		expect(window.vmfMoveMode).toBeUndefined();
	});

	it('does not pick up empty array', () => {
		const onMove = vi.fn();
		const { result } = renderHook(() => useMoveMode(onMove));

		act(() => {
			result.current.pickUp([]);
		});

		expect(result.current.isActive).toBe(false);
		expect(result.current.grabbedMedia).toBeNull();
	});
});
