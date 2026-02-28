import { describe, it, expect } from 'vitest';
import { calcFitScale } from './pdf-viewer.js';

describe('calcFitScale', () => {
	it('scales viewport to container width', () => {
		expect(calcFitScale(612, 800)).toBeCloseTo(800 / 612);
	});

	it('returns 1 for zero viewport width', () => {
		expect(calcFitScale(0, 800)).toBe(1);
	});

	it('handles narrow container', () => {
		expect(calcFitScale(612, 300)).toBeCloseTo(300 / 612);
	});

	it('returns exact 1 when viewport equals container', () => {
		expect(calcFitScale(500, 500)).toBe(1);
	});
});
