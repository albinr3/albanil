/**
 * Format a number as Dominican Peso currency string.
 * formatMoney(1500)   → "RD$ 1,500"
 * formatMoney(0)      → "RD$ 0"
 * formatMoney(1500.5) → "RD$ 1,501"
 */
export function formatMoney(amount: number): string {
    const rounded = Math.round(amount);
    const formatted = rounded.toLocaleString('en-US'); // uses comma separator
    return `RD$ ${formatted}`;
}

/**
 * Format money with sign prefix for extras/advances display.
 * formatMoneyWithSign(500, '+')  → "+ RD$ 500"
 * formatMoneyWithSign(1000, '-') → "- RD$ 1,000"
 */
export function formatMoneyWithSign(amount: number, sign: '+' | '-'): string {
    const rounded = Math.round(Math.abs(amount));
    const formatted = rounded.toLocaleString('en-US');
    return `${sign} RD$ ${formatted}`;
}
