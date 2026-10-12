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
                    $unitPrice = (float) ($item['unit_price'] ?? $item['price'] ?? 0);
                    if ($product) {
                        $unitPrice = (float) $product->price;
                        if (!empty($item['selected_variant']) && !empty($product->variants) && is_array($product->variants)) {
                            foreach ($product->variants as $variant) {
                                if (is_array($variant) && isset($variant['name']) && $variant['name'] === $item['selected_variant']) {
                                    if (isset($variant['price']) && is_numeric($variant['price'])) {
                                        $unitPrice = (float) $variant['price'];
                                    } elseif (isset($variant['additional_price']) && is_numeric($variant['additional_price'])) {
                                        $unitPrice = (float) $product->price + (float) $variant['additional_price'];
                                    }
                                    break;
                                }
                            }
                        }
                    }

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
                        'selected_variant' => $item['selected_variant'] ?? null,
                        'notes' => $item['notes'] ?? $item['item_notes'] ?? null,
                        'subtotal' => $lineSubtotal,
                        'product_model' => $product,
                    ];
                }
            }

            $discountAmount = (float) ($data['discount_amount'] ?? 0);
            $taxAmount = (float) ($data['tax_amount'] ?? 0);
            $chargesAmount = (float) ($data['charges_amount'] ?? 0);
            $chargesDetail = $data['charges_detail'] ?? null;
            $taxRate = isset($data['tax_rate']) ? (float) $data['tax_rate'] : null;
            $taxName = $data['tax_name'] ?? null;
            $calculatedTotal = max(0, $calculatedSubtotal - $discountAmount + $chargesAmount + $taxAmount);

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
            $cashierId = $data['cashier_id'] ?? $data['user_id'] ?? null;
            if (!$cashierId && $shiftId) {
                $cashierId = PosShift::where('id', $shiftId)->value('user_id');
            }

            $order = PosOrder::create([
                'id' => $orderId,
                'tenant_id' => $data['tenant_id'] ?? $this->tenantId ?? 'tenant-uuid-001',
                'outlet_id' => $orderOutletId,
                'user_id' => $cashierId,
                'shift_id' => $shiftId,
                'order_number' => $data['order_number'],
                'order_type' => $data['order_type'] ?? 'dine_in',
                'table_number' => $data['table_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'subtotal' => $calculatedSubtotal,
                'tax_rate' => $taxRate,
                'tax_name' => $taxName,
                'tax_amount' => $taxAmount,
                'charges_amount' => $chargesAmount,
                'charges_detail' => $chargesDetail,
                'discount_amount' => $discountAmount,
                'total_amount' => $calculatedTotal,
                'payment_status' => $data['payment_status'] ?? 'paid',
                'transacted_at' => $transactedAt,
                'erp_sync_status' => 'standalone',
            ]);

            // 3. Save items & decrement stock (Supports BOM Recipe Deduction & Multi-Branch Stock Ledger)
            foreach ($verifiedItems as $itemData) {
                $productModel = $itemData['product_model'];
                unset($itemData['product_model']);

                PosOrderItem::create($itemData);

                if ($productModel) {
                    $selectedVariant = $itemData['selected_variant'] ?? null;

                    // Cek apakah produk memiliki formula resep (BOM)
                    $recipes = $productModel->recipes()
                        ->when($selectedVariant, function ($query, $variant) {
                            $query->where(function ($q) use ($variant) {
                                $q->whereNull('variant_name')->orWhere('variant_name', $variant);
                            });
                        })
                        ->get();

                    if ($recipes->isNotEmpty()) {
                        // PRODUK OLAHAN / RECIPE ITEM: Kurangi stok bahan baku cabang
                        foreach ($recipes as $recipe) {
                            $qtyNeeded = (float) $recipe->quantity * (int) $itemData['qty'];

                            $ingStock = \App\Models\PosIngredientStock::firstOrCreate(
                                [
                                    'outlet_id' => $orderOutletId,
                                    'ingredient_id' => $recipe->ingredient_id,
                                ],
                                [
                                    'current_stock' => 0,
                                    'min_stock_alert' => 100,
                                ]
                            );

                            $balanceBefore = (float) $ingStock->current_stock;
                            $balanceAfter = $balanceBefore - $qtyNeeded;

                            $ingStock->update(['current_stock' => $balanceAfter]);

                            // Catat mutasi kartu stok bahan baku
                            \App\Models\PosStockMovement::create([
                                'id' => Str::uuid()->toString(),
                                'tenant_id' => $data['tenant_id'] ?? $this->tenantId ?? 'default-tenant',
                                'outlet_id' => $orderOutletId,
                                'item_type' => 'ingredient',
                                'item_id' => $recipe->ingredient_id,
                                'type' => 'sale',
                                'quantity' => -$qtyNeeded,
                                'balance_before' => $balanceBefore,
                                'balance_after' => $balanceAfter,
                                'reference_id' => $order->id,
                                'reference_type' => 'pos_order',
                                'notes' => "Terjual {$itemData['qty']}x {$productModel->name}" . ($selectedVariant ? " ({$selectedVariant})" : ""),
                                'user_id' => $cashierId,
                            ]);
                        }
                    } else {
                        // PRODUK RETAIL LANGSUNG: Kurangi stok barang jadi cabang & umum
                        $prodStock = \App\Models\PosProductStock::firstOrCreate(
                            [
                                'outlet_id' => $orderOutletId,
                                'product_id' => $productModel->id,
                            ],
                            [
                                'current_stock' => (int) $productModel->stock,
                                'min_stock_alert' => 5,
                            ]
                        );

                        $balanceBefore = (float) $prodStock->current_stock;
                        $balanceAfter = $balanceBefore - (int) $itemData['qty'];

                        $prodStock->update(['current_stock' => $balanceAfter]);
                        $productModel->decrement('stock', $itemData['qty']);

                        // Catat mutasi kartu stok barang jadi
                        \App\Models\PosStockMovement::create([
                            'id' => Str::uuid()->toString(),
                            'tenant_id' => $data['tenant_id'] ?? $this->tenantId ?? 'default-tenant',
                            'outlet_id' => $orderOutletId,
                            'item_type' => 'product',
                            'item_id' => $productModel->id,
                            'type' => 'sale',
                            'quantity' => -$itemData['qty'],
                            'balance_before' => $balanceBefore,
                            'balance_after' => $balanceAfter,
                            'reference_id' => $order->id,
                            'reference_type' => 'pos_order',
                            'notes' => "Terjual {$itemData['qty']}x {$productModel->name}" . ($selectedVariant ? " ({$selectedVariant})" : ""),
                            'user_id' => $cashierId,
                        ]);
                    }
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
