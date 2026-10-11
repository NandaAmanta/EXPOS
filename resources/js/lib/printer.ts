import type { PosOrderPayload } from '@/types/pos';

export function formatRupiah(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num || 0);
}

export function generateReceiptText(
    order: PosOrderPayload,
    outletName = 'EXPOS STORE',
    outletAddress = 'Cabang Utama'
): string {
    const line = '--------------------------------';
    const dateStr = new Date(order.created_at).toLocaleString('id-ID');

    let text = `${outletName}\n`;
    text += `${outletAddress}\n`;
    text += `${line}\n`;
    text += `No. Struk : ${order.order_number}\n`;
    text += `Waktu     : ${dateStr}\n`;
    if (order.customer_name) {
        text += `Pelanggan : ${order.customer_name}\n`;
    }
    text += `${line}\n`;

    for (const item of order.items) {
        const itemLine = `${item.product_name}\n`;
        const qtyPrice = `  ${item.qty}x ${formatRupiah(item.unit_price)}`;
        const subtotalStr = formatRupiah(item.subtotal);
        const padding = Math.max(1, 32 - qtyPrice.length - subtotalStr.length);
        text += `${itemLine}${qtyPrice}${' '.repeat(padding)}${subtotalStr}\n`;
    }

    text += `${line}\n`;
    const subtotalLabel = 'Subtotal';
    const subtotalVal = formatRupiah(order.subtotal);
    text += `${subtotalLabel}${' '.repeat(Math.max(1, 32 - subtotalLabel.length - subtotalVal.length))}${subtotalVal}\n`;

    if (order.discount_amount > 0) {
        const discLabel = 'Diskon';
        const discVal = `-${formatRupiah(order.discount_amount)}`;
        text += `${discLabel}${' '.repeat(Math.max(1, 32 - discLabel.length - discVal.length))}${discVal}\n`;
    }

    if (order.tax_amount > 0) {
        const taxLabel = 'Pajak';
        const taxVal = formatRupiah(order.tax_amount);
        text += `${taxLabel}${' '.repeat(Math.max(1, 32 - taxLabel.length - taxVal.length))}${taxVal}\n`;
    }

    const totalLabel = 'TOTAL';
    const totalVal = formatRupiah(order.total_amount);
    text += `${totalLabel}${' '.repeat(Math.max(1, 32 - totalLabel.length - totalVal.length))}${totalVal}\n`;
    text += `${line}\n`;

    for (const payment of order.payments) {
        const payLabel = `Bayar (${payment.method})`;
        const payVal = formatRupiah(payment.amount);
        text += `${payLabel}${' '.repeat(Math.max(1, 32 - payLabel.length - payVal.length))}${payVal}\n`;

        if (payment.change_amount && payment.change_amount > 0) {
            const changeLabel = 'Kembali';
            const changeVal = formatRupiah(payment.change_amount);
            text += `${changeLabel}${' '.repeat(Math.max(1, 32 - changeLabel.length - changeVal.length))}${changeVal}\n`;
        }
    }

    text += `${line}\n`;
    text += ' Terima kasih atas kunjungan Anda \n';
    text += '  Simpan struk ini sebagai bukti  \n\n\n';

    return text;
}

/**
 * Triggers native thermal printing dialog formatted strictly for 58mm/80mm receipt
 */
export async function printThermalReceipt(
    order: PosOrderPayload,
    outletName = 'EXPOS STORE',
    outletAddress = 'Cabang Utama'
): Promise<void> {
    const receiptText = generateReceiptText(order, outletName, outletAddress);

    // Create a hidden print iframe or window
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
        console.warn('Popup blocked, fallback to standard print');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk ${order.order_number}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    line-height: 1.3;
                    margin: 0;
                    padding: 8px;
                    white-space: pre-wrap;
                    color: #000;
                    background: #fff;
                    width: 72mm;
                }
            </style>
        </head>
        <body>${receiptText}</body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}
