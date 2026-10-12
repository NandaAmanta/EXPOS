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

    const orderTypeLabels: Record<string, string> = {
        dine_in: 'Dine In',
        takeaway: 'Takeaway',
        delivery: 'Delivery',
    };
    if (order.order_type) {
        let typeStr = orderTypeLabels[order.order_type] || order.order_type;
        if (order.order_type === 'dine_in' && order.table_number) {
            typeStr += ` (Meja: ${order.table_number})`;
        }
        text += `Tipe      : ${typeStr}\n`;
    }

    if (order.customer_name) {
        text += `Pelanggan : ${order.customer_name}\n`;
    }
    if (order.notes) {
        text += `Catatan   : ${order.notes}\n`;
    }
    text += `${line}\n`;

    for (const item of order.items) {
        let itemLine = item.product_name;
        if (item.selected_variant) {
            itemLine += ` (${item.selected_variant})`;
        }
        itemLine += '\n';

        if (item.notes) {
            itemLine += `  * ${item.notes}\n`;
        }

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

    if (order.charges_detail && order.charges_detail.length > 0) {
        for (const charge of order.charges_detail) {
            const chargeLabel = charge.name.substring(0, 18);
            const chargeVal = `+${formatRupiah(charge.amount)}`;
            text += `${chargeLabel}${' '.repeat(Math.max(1, 32 - chargeLabel.length - chargeVal.length))}${chargeVal}\n`;
        }
    } else if (order.charges_amount && order.charges_amount > 0) {
        const chargeLabel = 'Biaya Layanan';
        const chargeVal = `+${formatRupiah(order.charges_amount)}`;
        text += `${chargeLabel}${' '.repeat(Math.max(1, 32 - chargeLabel.length - chargeVal.length))}${chargeVal}\n`;
    }

    if (order.tax_amount > 0) {
        const taxLabel = (order.tax_name || 'Pajak (PB1)').substring(0, 18);
        const taxVal = `+${formatRupiah(order.tax_amount)}`;
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

/**
 * Generate formatted text for Kitchen Order Ticket / SPK Dapur (58mm / 80mm)
 */
export function generateKitchenSpkText(
    order: PosOrderPayload,
    outletName = 'EXPOS STORE'
): string {
    const doubleLine = '================================';
    const singleLine = '--------------------------------';
    const dateStr = new Date(order.created_at).toLocaleString('id-ID');

    let text = `${doubleLine}\n`;
    text += `       *** SPK DAPUR ***        \n`;
    text += `        (KITCHEN TICKET)        \n`;
    text += `${doubleLine}\n`;
    text += `No. Order : ${order.order_number}\n`;
    text += `Waktu     : ${dateStr}\n`;

    const orderTypeLabels: Record<string, string> = {
        dine_in: 'DINE IN',
        takeaway: 'TAKEAWAY',
        delivery: 'DELIVERY',
    };
    if (order.order_type) {
        let typeStr = orderTypeLabels[order.order_type] || order.order_type.toUpperCase();
        if (order.order_type === 'dine_in' && order.table_number) {
            typeStr += ` (MEJA: ${order.table_number})`;
        }
        text += `TIPE      : ${typeStr}\n`;
    }

    if (order.customer_name) {
        text += `Pelanggan : ${order.customer_name}\n`;
    }

    text += `${doubleLine}\n`;
    text += `QTY  NAMA MENU & INSTRUKSI      \n`;
    text += `${singleLine}\n`;

    let totalQty = 0;
    for (const item of order.items) {
        totalQty += item.qty;
        text += `[ ${item.qty}x ] ${item.product_name.toUpperCase()}\n`;
        if (item.selected_variant) {
            text += `       > VARIAN : ${item.selected_variant}\n`;
        }
        if (item.notes) {
            text += `       * NOTE   : ${item.notes}\n`;
        }
        text += `${singleLine}\n`;
    }

    text += `Total Item Pesanan: ${totalQty} pcs\n`;

    if (order.notes) {
        text += `${doubleLine}\n`;
        text += `CATATAN KHUSUS ORDER:\n`;
        text += `${order.notes}\n`;
    }

    text += `${doubleLine}\n`;
    text += `   Waktu Cetak: ${new Date().toLocaleTimeString('id-ID')}\n`;
    text += `     Status: SUDAH DIBAYAR      \n\n\n`;

    return text;
}

/**
 * Triggers native thermal printing for Kitchen SPK
 */
export async function printKitchenSpk(
    order: PosOrderPayload,
    outletName = 'EXPOS STORE'
): Promise<void> {
    const spkText = generateKitchenSpkText(order, outletName);

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
        console.warn('Popup blocked, fallback to standard print');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SPK Dapur ${order.order_number}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.35;
                    margin: 0;
                    padding: 8px;
                    white-space: pre-wrap;
                    color: #000;
                    background: #fff;
                    width: 72mm;
                }
            </style>
        </head>
        <body>${spkText}</body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

/**
 * Print both customer receipt and kitchen ticket in sequence
 */
export async function printBothReceiptAndSpk(
    order: PosOrderPayload,
    outletName = 'EXPOS STORE',
    outletAddress = 'Cabang Utama'
): Promise<void> {
    await printThermalReceipt(order, outletName, outletAddress);
    setTimeout(() => {
        printKitchenSpk(order, outletName);
    }, 600);
}
