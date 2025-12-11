/**
 * useAnnounce hook tests.
 *
 * Tests screen reader announcement functionality.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnnounce } from '../../src/shared/hooks/useAnnounce.js';

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

describe('useAnnounce', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns empty announcement initially', () => {
		const { result } = renderHook(() => useAnnounce());
		expect(result.current.announcement).toBe('');
	});

	it('sets announcement after announce is called', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announce('Test message');
		});

		// Wait for the setTimeout
		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Test message');
	});

	it('announceMove formats message correctly', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceMove('Photo.jpg', 'Events');
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Moved Photo.jpg to Events');
	});

	it('announceBulkMove formats message with count', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceBulkMove(5, 'Documents');
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Moved 5 files to Documents');
	});

	it('announceReorder formats message correctly', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceReorder('Photos', 3);
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Photos moved to position 3');
	});

	it('announceFolderSelected formats message with count', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceFolderSelected('Events', 12);
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Events folder selected, 12 items');
	});

	it('announceFolderCreated formats message', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceFolderCreated('New Folder');
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Folder New Folder created');
	});

	it('announceFolderDeleted formats message', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceFolderDeleted('Old Folder');
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Folder Old Folder deleted');
	});

	it('announceDragStart formats message', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceDragStart('Image.png');
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Dragging Image.png. Drop on a folder to move.');
	});

	it('announceDragCancelled announces cancellation', async () => {
		const { result } = renderHook(() => useAnnounce());

		act(() => {
			result.current.announceDragCancelled();
		});

		act(() => {
			vi.advanceTimersByTime(150);
		});

		expect(result.current.announcement).toBe('Drag cancelled');
	});

	it('clears announcement before setting new one', async () => {
		const { result } = renderHook(() => useAnnounce());

		// First announcement
		act(() => {
			result.current.announce('First');
		});
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(result.current.announcement).toBe('First');

		// Second announcement - should clear and re-set
		act(() => {
			result.current.announce('Second');
		});
		
		// Immediately after calling, it should be empty (cleared)
		expect(result.current.announcement).toBe('');
		
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(result.current.announcement).toBe('Second');
	});
});
