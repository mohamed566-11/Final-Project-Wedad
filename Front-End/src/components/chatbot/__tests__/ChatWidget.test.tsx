import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatWidget from '../ChatWidget';
import '@testing-library/jest-dom';

// Setup IntersectionObserver mock for framer-motion AnimatePresence
beforeAll(() => {
 const IntersectionObserverMock = vi.fn(() => ({
 disconnect: vi.fn(),
 observe: vi.fn(),
 takeRecords: vi.fn(),
 unobserve: vi.fn(),
 }));
 vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
});

describe('ChatWidget', () => {
 it('T12-01 widget is closed by default', () => {
 render(<ChatWidget />);
 // The chat toggle button should be present
 expect(screen.getByRole('button', { name: /تحدث مع وداد/i })).toBeInTheDocument();
 // The chat window should not be present initially (might render hidden via AnimatePresence)
 expect(screen.queryByPlaceholderText(/اسأل وداد/i)).not.toBeInTheDocument();
 });

 it('T12-02 clicking toggle button opens the widget (renders ChatWindow)', () => {
 render(<ChatWidget />);
 
 // Find the toggle button
 const toggleButton = screen.getByRole('button', { name: /تحدث مع وداد/i });
 
 // Click it
 fireEvent.click(toggleButton);
 
 // Chat window should render
 expect(screen.getByText(/وداد - مساعدتك الشخصية/i)).toBeInTheDocument();
 });

 it('T12-03 pressing Escape closes the widget and returns focus', () => {
 render(<ChatWidget />);
 
 const toggleButton = screen.getByRole('button', { name: /تحدث مع وداد/i });
 
 // 1. Open
 fireEvent.click(toggleButton);
 expect(screen.getByText(/وداد - مساعدتك الشخصية/i)).toBeInTheDocument();
 
 // 2. Press Escape
 fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });
 
 // 3. Confirm focus returned to button
 expect(document.activeElement).toBe(toggleButton);
 
 // 4. Optionally toggle state changes
 expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
 });

 it('T12-05 toggle button has correct aria-expanded attribute', () => {
 render(<ChatWidget />);
 const toggleButton = screen.getByRole('button', { name: /تحدث مع وداد/i });
 
 // initial state
 expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
 
 // Open
 fireEvent.click(toggleButton);
 expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
 });

 it('T12-06 widget renders with dir=rtl', () => {
 render(<ChatWidget />);
 const container = screen.getByRole('button', { name: /تحدث مع وداد/i }).parentElement;
 
 // Assuming rtl dir is on a main wrapper component
 expect(container).toHaveAttribute('dir', 'rtl');
 });
});
