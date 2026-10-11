<?php

namespace App\Jobs;

use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\PosOutlet;
use App\Models\PosPayment;
use App\Models\PosProduct;
use App\Models\PosShift;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcessPosOrderSync implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $orderData;
    public ?string $tenantId;

    /**
     * Create a new job instance.
     */
    public function __construct(array $orderData, ?string $tenantId = null)
    {
        $this->orderData = $orderData;
        $this->tenantId = $tenantId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $data = $this->orderData;
        $orderId = $data['id'];

        // Idempotency check: don't duplicate order
        if (PosOrder::where('id', $orderId)->exists()) {
            return;
        }

        DB::transaction(function () use ($data, $orderId) {
            $defaultOutletId = PosOutlet::query()->value('id');

            // 1. Validate & calculate authentic item prices from server catalog
            $verifiedItems = [];
            $calculatedSubtotal = 0;

            if (!empty($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $sku = $item['sku'] ?? 'GEN-ITEM';
                    $qty = max(1, (int) ($item['qty'] ?? 1));
                    $product = PosProduct::where('sku', $sku)->first();

                    // Security Guard: enforce official catalog price if product exists
                    $unitPrice = $product ? (float) $product->price : (float) ($item['unit_price'] ?? $item['price'] ?? 0);
                    $lineSubtotal = $qty * $unitPrice;
                    $calculatedSubtotal += $lineSubtotal;

                    $verifiedItems[] = [
                        'id' => Str::uuid()->toString(),
                        'order_id' => $orderId,
                        'product_id' => $item['product_id'] ?? $product?->id,
                        'sku' => $sku,
                        'product_name' => $product ? $product->name : ($item['product_name'] ?? $item['name'] ?? 'Product'),
                        'qty' => $qty,
                        'unit_price' => $unitPrice,
                        'subtotal' => $lineSubtotal,
                        'product_model' => $product,
                    ];
                }
            }

            $discountAmount = (float) ($data['discount_amount'] ?? 0);
            $taxAmount = (float) ($data['tax_amount'] ?? 0);
            $calculatedTotal = max(0, $calculatedSubtotal - $discountAmount + $taxAmount);

            // Automatic Shift Resolution:
            $orderOutletId = $data['outlet_id'] ?? $defaultOutletId;
            $shiftId = $data['shift_id'] ?? null;
            $transactedAt = $data['created_at'] ?? now();

            if (!$shiftId) {
                // 1. Try finding currently open shift
                $shiftId = PosShift::where('status', 'open')
                    ->where('outlet_id', $orderOutletId)
                    ->latest('opened_at')
                    ->value('id');

                // 2. If no open shift, match shift by transaction time window
                if (!$shiftId) {
                    $shiftId = PosShift::where('outlet_id', $orderOutletId)
                        ->where('opened_at', '<=', $transactedAt)
                        ->where(function ($q) use ($transactedAt) {
                            $q->whereNull('closed_at')->orWhere('closed_at', '>=', $transactedAt);
                        })
                        ->latest('opened_at')
                        ->value('id');
                }
            }

            // 2. Create Order
            $order = PosOrder::create([
                'id' => $orderId,
                'tenant_id' => $data['tenant_id'] ?? $this->tenantId ?? 'tenant-uuid-001',
                'outlet_id' => $orderOutletId,
                'user_id' => $data['cashier_id'] ?? $data['user_id'] ?? null,
                'shift_id' => $shiftId,
                'order_number' => $data['order_number'],
                'customer_name' => $data['customer_name'] ?? null,
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $calculatedTotal,
                'payment_status' => $data['payment_status'] ?? 'paid',
                'transacted_at' => $transactedAt,
                'erp_sync_status' => 'standalone',
            ]);

            // 3. Save items & decrement stock
            foreach ($verifiedItems as $itemData) {
                $productModel = $itemData['product_model'];
                unset($itemData['product_model']);

                PosOrderItem::create($itemData);

                if ($productModel) {
                    $productModel->decrement('stock', $itemData['qty']);
                }
            }

            // 4. Save payments
            if (!empty($data['payments'])) {
                $payments = is_array($data['payments']) && isset($data['payments'][0])
                    ? $data['payments']
                    : [$data['payments']];

                foreach ($payments as $payment) {
                    if (is_array($payment)) {
                        PosPayment::create([
                            'id' => Str::uuid()->toString(),
                            'order_id' => $order->id,
                            'payment_method' => strtoupper($payment['method'] ?? $payment['payment_method'] ?? 'CASH'),
                            'amount' => (float) ($payment['amount'] ?? $calculatedTotal),
                            'change_amount' => (float) ($payment['change_amount'] ?? 0),
                            'reference_number' => $payment['reference_no'] ?? $payment['reference_number'] ?? null,
                        ]);
                    }
                }
            }
        });
    }
}
