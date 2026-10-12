<?php

namespace Database\Seeders;

use App\Models\PosCategory;
use App\Models\PosCharge;
use App\Models\PosIngredient;
use App\Models\PosIngredientStock;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\PosOutlet;
use App\Models\PosPayment;
use App\Models\PosProduct;
use App\Models\PosProductStock;
use App\Models\PosRecipe;
use App\Models\PosRole;
use App\Models\PosShift;
use App\Models\PosStockMovement;
use App\Models\PosTax;
use App\Models\User;
use App\Models\UserOutlet;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PosSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 'tenant-uuid-001';

        // -------------------------------------------------------------
        // 1. Roles & Permissions
        // -------------------------------------------------------------
        $roles = [
            [
                'name' => 'Owner / Admin',
                'slug' => 'admin',
                'description' => 'Akses penuh ke semua cabang, laporan keuangan, dan konfigurasi master data',
                'permissions' => [
                    'pos_access' => true,
                    'view_reports' => true,
                    'manage_products' => true,
                    'manage_inventory' => true,
                    'manage_outlets' => true,
                    'manage_users' => true,
                    'manage_settings' => true,
                    'apply_discounts' => true,
                    'void_transactions' => true,
                ],
                'is_system' => true,
            ],
            [
                'name' => 'Supervisor Gerai',
                'slug' => 'supervisor',
                'description' => 'Manajemen operasional cabang, audit shift, stok opname, dan persetujuan diskon/void',
                'permissions' => [
                    'pos_access' => true,
                    'view_reports' => true,
                    'manage_products' => false,
                    'manage_inventory' => true,
                    'manage_outlets' => false,
                    'manage_users' => false,
                    'manage_settings' => false,
                    'apply_discounts' => true,
                    'void_transactions' => true,
                ],
                'is_system' => false,
            ],
            [
                'name' => 'Kasir / Barista',
                'slug' => 'cashier',
                'description' => 'Operasional kasir harian, buka/tutup kas, terima pembayaran, dan cetak struk',
                'permissions' => [
                    'pos_access' => true,
                    'view_reports' => false,
                    'manage_products' => false,
                    'manage_inventory' => false,
                    'manage_outlets' => false,
                    'manage_users' => false,
                    'manage_settings' => false,
                    'apply_discounts' => false,
                    'void_transactions' => false,
                ],
                'is_system' => true,
            ],
        ];

        foreach ($roles as $r) {
            PosRole::updateOrCreate(
                ['slug' => $r['slug']],
                [
                    'name' => $r['name'],
                    'description' => $r['description'],
                    'permissions' => $r['permissions'],
                    'is_system' => $r['is_system'],
                ]
            );
        }

        // -------------------------------------------------------------
        // 2. Multi-Branch Outlets
        // -------------------------------------------------------------
        $outletJkt = PosOutlet::updateOrCreate(
            ['code' => 'OUT-JKT'],
            [
                'tenant_id' => $tenantId,
                'name' => 'EXPOS Central - Sudirman Jakarta',
                'address' => 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
                'phone' => '021-5550199',
                'receipt_header' => "EXPOS COFFEE & EATERY\nSudirman Central, Jakarta",
                'receipt_footer' => "Terima kasih atas kunjungan Anda!\nFollow IG: @expos.coffee",
                'is_active' => true,
            ]
        );

        $outletBdg = PosOutlet::updateOrCreate(
            ['code' => 'OUT-BDG'],
            [
                'tenant_id' => $tenantId,
                'name' => 'EXPOS Dago - Bandung',
                'address' => 'Jl. Ir. H. Juanda No. 128, Dago, Bandung',
                'phone' => '022-4208899',
                'receipt_header' => "EXPOS COFFEE & EATERY\nDago Heritage, Bandung",
                'receipt_footer' => "Hatur Nuhun! Sampurasun.\nFollow IG: @expos.coffee",
                'is_active' => true,
            ]
        );

        // -------------------------------------------------------------
        // 3. Users & Outlet Assignments
        // -------------------------------------------------------------
        $admin = User::updateOrCreate(
            ['email' => 'admin@expos.test'],
            [
                'name' => 'Owner / Admin',
                'role' => 'admin',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('1234'),
                'outlet_id' => $outletJkt->id,
                'is_active' => true,
            ]
        );

        $spvJkt = User::updateOrCreate(
            ['email' => 'spv.jkt@expos.test'],
            [
                'name' => 'SPV Dimas (Jakarta)',
                'role' => 'supervisor',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('1111'),
                'outlet_id' => $outletJkt->id,
                'is_active' => true,
            ]
        );

        $kasirJkt = User::updateOrCreate(
            ['email' => 'kasir@expos.test'],
            [
                'name' => 'Kasir Maya (Jakarta)',
                'role' => 'cashier',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('1234'),
                'outlet_id' => $outletJkt->id,
                'is_active' => true,
            ]
        );

        $kasirBdg = User::updateOrCreate(
            ['email' => 'kasir2@expos.test'],
            [
                'name' => 'Kasir Budi (Bandung)',
                'role' => 'cashier',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('5678'),
                'outlet_id' => $outletBdg->id,
                'is_active' => true,
            ]
        );

        // Assign to UserOutlet pivot
        UserOutlet::updateOrCreate(['user_id' => $admin->id, 'outlet_id' => $outletJkt->id], ['is_primary' => true]);
        UserOutlet::updateOrCreate(['user_id' => $admin->id, 'outlet_id' => $outletBdg->id], ['is_primary' => false]);
        UserOutlet::updateOrCreate(['user_id' => $spvJkt->id, 'outlet_id' => $outletJkt->id], ['is_primary' => true]);
        UserOutlet::updateOrCreate(['user_id' => $kasirJkt->id, 'outlet_id' => $outletJkt->id], ['is_primary' => true]);
        UserOutlet::updateOrCreate(['user_id' => $kasirBdg->id, 'outlet_id' => $outletBdg->id], ['is_primary' => true]);

        // -------------------------------------------------------------
        // 4. Master Taxes & Additional Charges
        // -------------------------------------------------------------
        PosTax::updateOrCreate(
            ['name' => 'PB1 (Pajak Restoran)'],
            [
                'code' => 'PB1',
                'rate' => 10.00,
                'type' => 'exclusive',
                'is_auto_apply' => true,
                'is_active' => true,
            ]
        );

        PosCharge::updateOrCreate(
            ['name' => 'Biaya Layanan (Service Charge)'],
            [
                'type' => 'percent',
                'rate' => 5.00,
                'is_taxable' => true,
                'applies_to' => 'all',
                'is_auto_apply' => true,
                'is_active' => true,
            ]
        );

        // -------------------------------------------------------------
        // 5. Master Categories
        // -------------------------------------------------------------
        $categoriesData = [
            ['name' => 'Coffee', 'description' => 'Aneka racikan kopi espresso & brew'],
            ['name' => 'Tea', 'description' => 'Artisan tea dan matcha latte pilihan'],
            ['name' => 'Bakery', 'description' => 'Croissant dan pastry fresh oven'],
            ['name' => 'Food', 'description' => 'Burger wagyu dan aneka camilan gurih'],
        ];

        $categoryMap = [];
        foreach ($categoriesData as $cat) {
            $categoryModel = PosCategory::updateOrCreate(
                ['name' => $cat['name']],
                [
                    'tenant_id' => $tenantId,
                    'slug' => Str::slug($cat['name']),
                    'description' => $cat['description'],
                    'is_active' => true,
                ]
            );
            $categoryMap[$cat['name']] = $categoryModel->id;
        }

        // -------------------------------------------------------------
        // 6. Master Ingredients / Bahan Baku
        // -------------------------------------------------------------
        $ingredientsData = [
            // Coffee & Dairy
            ['sku' => 'ING-COF-01', 'name' => 'Biji Kopi Arabica Gayo', 'category' => 'Coffee Beans', 'unit' => 'gram', 'cost_per_unit' => 280], // Rp 280/g
            ['sku' => 'ING-COF-02', 'name' => 'Biji Kopi Robusta Blend', 'category' => 'Coffee Beans', 'unit' => 'gram', 'cost_per_unit' => 160],
            ['sku' => 'ING-MLK-01', 'name' => 'Fresh Milk Greenfields', 'category' => 'Dairy', 'unit' => 'ml', 'cost_per_unit' => 26], // Rp 26/ml (~Rp 26.000/L)
            ['sku' => 'ING-MLK-02', 'name' => 'Oat Milk Barista Edition', 'category' => 'Dairy', 'unit' => 'ml', 'cost_per_unit' => 45], // Rp 45/ml (~Rp 45.000/L)
            ['sku' => 'ING-SYR-01', 'name' => 'Sirup Karamel Monin', 'category' => 'Syrup', 'unit' => 'ml', 'cost_per_unit' => 130],
            ['sku' => 'ING-SYR-02', 'name' => 'Sirup Vanilla Monin', 'category' => 'Syrup', 'unit' => 'ml', 'cost_per_unit' => 130],
            ['sku' => 'ING-SYR-03', 'name' => 'Gula Aren Organik Cair', 'category' => 'Syrup', 'unit' => 'ml', 'cost_per_unit' => 35],
            // Tea & Flavors
            ['sku' => 'ING-TEA-01', 'name' => 'Matcha Uji Pure Powder', 'category' => 'Tea Powder', 'unit' => 'gram', 'cost_per_unit' => 850],
            ['sku' => 'ING-TEA-02', 'name' => 'Artisan Earl Grey Leaves', 'category' => 'Tea Leaves', 'unit' => 'gram', 'cost_per_unit' => 450],
            // Food & Kitchen
            ['sku' => 'ING-FD-01', 'name' => 'Australian Wagyu Patty 150g', 'category' => 'Food Ingredients', 'unit' => 'pcs', 'cost_per_unit' => 26000],
            ['sku' => 'ING-FD-02', 'name' => 'Brioche Burger Bun', 'category' => 'Food Ingredients', 'unit' => 'pcs', 'cost_per_unit' => 4500],
            ['sku' => 'ING-FD-03', 'name' => 'Shoestring Potato Fries', 'category' => 'Food Ingredients', 'unit' => 'gram', 'cost_per_unit' => 48], // Rp 48/g (~Rp 48.000/kg)
            ['sku' => 'ING-FD-04', 'name' => 'White Truffle Oil Infusion', 'category' => 'Condiments', 'unit' => 'ml', 'cost_per_unit' => 350],
            // Packaging
            ['sku' => 'ING-PKG-01', 'name' => 'Cold Cup 16oz + Lid + Straw', 'category' => 'Packaging', 'unit' => 'pcs', 'cost_per_unit' => 1500],
            ['sku' => 'ING-PKG-02', 'name' => 'Hot Paper Cup 8oz + Lid', 'category' => 'Packaging', 'unit' => 'pcs', 'cost_per_unit' => 1200],
        ];

        $ingredientMap = [];
        foreach ($ingredientsData as $ing) {
            $ingModel = PosIngredient::updateOrCreate(
                ['sku' => $ing['sku']],
                [
                    'tenant_id' => $tenantId,
                    'name' => $ing['name'],
                    'category' => $ing['category'],
                    'unit' => $ing['unit'],
                    'cost_per_unit' => $ing['cost_per_unit'],
                    'is_active' => true,
                ]
            );
            $ingredientMap[$ing['sku']] = $ingModel;
        }

        // -------------------------------------------------------------
        // 7. Branch Ingredient Stocks (Stok Bahan Baku Awal di Cabang)
        // -------------------------------------------------------------
        $initialStocks = [
            'OUT-JKT' => [
                'ING-COF-01' => ['stock' => 15000, 'min' => 2000], // 15 kg
                'ING-COF-02' => ['stock' => 8000, 'min' => 1500],  // 8 kg
                'ING-MLK-01' => ['stock' => 30000, 'min' => 5000], // 30 Liter
                'ING-MLK-02' => ['stock' => 12000, 'min' => 2000], // 12 Liter
                'ING-SYR-01' => ['stock' => 2500, 'min' => 500],   // 2.5 L
                'ING-SYR-02' => ['stock' => 2500, 'min' => 500],
                'ING-SYR-03' => ['stock' => 5000, 'min' => 1000],
                'ING-TEA-01' => ['stock' => 1500, 'min' => 300],   // 1.5 kg
                'ING-TEA-02' => ['stock' => 1000, 'min' => 200],   // 1 kg
                'ING-FD-01'  => ['stock' => 60, 'min' => 15],      // 60 pcs
                'ING-FD-02'  => ['stock' => 70, 'min' => 15],
                'ING-FD-03'  => ['stock' => 10000, 'min' => 2000], // 10 kg
                'ING-FD-04'  => ['stock' => 1000, 'min' => 200],   // 1 L
                'ING-PKG-01' => ['stock' => 800, 'min' => 150],    // 800 cup
                'ING-PKG-02' => ['stock' => 400, 'min' => 80],     // 400 cup
            ],
            'OUT-BDG' => [
                'ING-COF-01' => ['stock' => 10000, 'min' => 1500], // 10 kg
                'ING-COF-02' => ['stock' => 5000, 'min' => 1000],  // 5 kg
                'ING-MLK-01' => ['stock' => 20000, 'min' => 4000], // 20 Liter
                'ING-MLK-02' => ['stock' => 8000, 'min' => 1500],  // 8 Liter
                'ING-SYR-01' => ['stock' => 1500, 'min' => 300],
                'ING-SYR-02' => ['stock' => 1500, 'min' => 300],
                'ING-SYR-03' => ['stock' => 3500, 'min' => 800],
                'ING-TEA-01' => ['stock' => 1000, 'min' => 200],
                'ING-TEA-02' => ['stock' => 800, 'min' => 150],
                'ING-FD-01'  => ['stock' => 40, 'min' => 10],
                'ING-FD-02'  => ['stock' => 45, 'min' => 10],
                'ING-FD-03'  => ['stock' => 7000, 'min' => 1500],
                'ING-FD-04'  => ['stock' => 750, 'min' => 150],
                'ING-PKG-01' => ['stock' => 500, 'min' => 100],
                'ING-PKG-02' => ['stock' => 250, 'min' => 50],
            ],
        ];

        foreach ($initialStocks as $outletCode => $stocks) {
            $outlet = $outletCode === 'OUT-JKT' ? $outletJkt : $outletBdg;
            foreach ($stocks as $sku => $stockInfo) {
                $ing = $ingredientMap[$sku];
                PosIngredientStock::updateOrCreate(
                    [
                        'outlet_id' => $outlet->id,
                        'ingredient_id' => $ing->id,
                    ],
                    [
                        'current_stock' => $stockInfo['stock'],
                        'min_stock_alert' => $stockInfo['min'],
                    ]
                );
            }
        }

        // -------------------------------------------------------------
        // 8. Master Products & Variants
        // -------------------------------------------------------------
        $productsData = [
            [
                'sku' => 'CF-AMR-04',
                'barcode' => '899100100004',
                'name' => 'Iced Americano',
                'category' => 'Coffee',
                'price' => 25000,
                'cost_price' => 6540, // Dihitung dari formula BOM: (18g x 280) + 1500 pkg = 6540
                'stock' => 999,
                'variants' => [
                    ['name' => 'Regular', 'price' => 25000],
                    ['name' => 'Double Shot', 'price' => 30000],
                ],
            ],
            [
                'sku' => 'CF-LAT-02',
                'barcode' => '899100100002',
                'name' => 'Caffe Latte 250ml',
                'category' => 'Coffee',
                'price' => 32000,
                'cost_price' => 11740, // (18g x 280) + (200ml x 26) + 1500 pkg = 11740
                'stock' => 999,
                'variants' => [
                    ['name' => 'Regular Milk', 'price' => 32000],
                    ['name' => 'Oat Milk Sub', 'price' => 38000],
                ],
            ],
            [
                'sku' => 'CF-CAP-03',
                'barcode' => '899100100003',
                'name' => 'Cappuccino Brulee',
                'category' => 'Coffee',
                'price' => 35000,
                'cost_price' => 12500,
                'stock' => 999,
                'variants' => null,
            ],
            [
                'sku' => 'CF-ESP-01',
                'barcode' => '899100100001',
                'name' => 'Espresso Single Shot',
                'category' => 'Coffee',
                'price' => 22000,
                'cost_price' => 2800, // (10g x 280) = 2800
                'stock' => 999,
                'variants' => null,
            ],
            [
                'sku' => 'TE-MAT-01',
                'barcode' => '899100200001',
                'name' => 'Matcha Latte Oat',
                'category' => 'Tea',
                'price' => 38000,
                'cost_price' => 24150, // (15g x 850) + (220ml x 45) + 1500 pkg = 24150
                'stock' => 999,
                'variants' => null,
            ],
            [
                'sku' => 'TE-EAR-02',
                'barcode' => '899100200002',
                'name' => 'Earl Grey Artisan Tea',
                'category' => 'Tea',
                'price' => 28000,
                'cost_price' => 3900, // (6g x 450) + 1200 hot cup = 3900
                'stock' => 999,
                'variants' => null,
            ],
            [
                'sku' => 'FD-BRG-01',
                'barcode' => '899100400001',
                'name' => 'Wagyu Smash Burger',
                'category' => 'Food',
                'price' => 65000,
                'cost_price' => 30500, // (1x Wagyu Patty 26000) + (1x Bun 4500) = 30500
                'stock' => 999,
                'variants' => null,
            ],
            [
                'sku' => 'FD-FRY-02',
                'barcode' => '899100400002',
                'name' => 'Truffle French Fries',
                'category' => 'Food',
                'price' => 35000,
                'cost_price' => 10700, // (150g x 48) + (10ml x 350) = 10700
                'stock' => 999,
                'variants' => null,
            ],
            // Direct Retail Goods (No Recipe - Finished Products)
            [
                'sku' => 'BK-CRS-01',
                'barcode' => '899100300001',
                'name' => 'Butter Croissant',
                'category' => 'Bakery',
                'price' => 27000,
                'cost_price' => 12000,
                'stock' => 85,
                'variants' => null,
            ],
            [
                'sku' => 'BK-CIN-02',
                'barcode' => '899100300002',
                'name' => 'Cinnamon Roll Glaze',
                'category' => 'Bakery',
                'price' => 30000,
                'cost_price' => 13500,
                'stock' => 65,
                'variants' => null,
            ],
        ];

        $productModelMap = [];
        foreach ($productsData as $prod) {
            $productModel = PosProduct::updateOrCreate(
                ['sku' => $prod['sku']],
                [
                    'tenant_id' => $tenantId,
                    'outlet_id' => $outletJkt->id,
                    'barcode' => $prod['barcode'],
                    'name' => $prod['name'],
                    'category' => $prod['category'],
                    'category_id' => $categoryMap[$prod['category']] ?? null,
                    'price' => $prod['price'],
                    'cost_price' => $prod['cost_price'],
                    'stock' => $prod['stock'],
                    'variants' => $prod['variants'],
                    'is_active' => true,
                ]
            );
            $productModelMap[$prod['sku']] = $productModel;
        }

        // Branch Retail Product Stocks
        PosProductStock::updateOrCreate(
            ['outlet_id' => $outletJkt->id, 'product_id' => $productModelMap['BK-CRS-01']->id],
            ['current_stock' => 50, 'min_stock_alert' => 10]
        );
        PosProductStock::updateOrCreate(
            ['outlet_id' => $outletBdg->id, 'product_id' => $productModelMap['BK-CRS-01']->id],
            ['current_stock' => 35, 'min_stock_alert' => 8]
        );
        PosProductStock::updateOrCreate(
            ['outlet_id' => $outletJkt->id, 'product_id' => $productModelMap['BK-CIN-02']->id],
            ['current_stock' => 40, 'min_stock_alert' => 10]
        );
        PosProductStock::updateOrCreate(
            ['outlet_id' => $outletBdg->id, 'product_id' => $productModelMap['BK-CIN-02']->id],
            ['current_stock' => 25, 'min_stock_alert' => 8]
        );

        // -------------------------------------------------------------
        // 9. Recipes / Bill of Materials (BOM)
        // -------------------------------------------------------------
        // Clear previous recipe definitions for idempotent fresh run
        PosRecipe::query()->delete();

        $recipesToCreate = [
            // Iced Americano (Regular)
            [
                'product' => 'CF-AMR-04',
                'variant' => 'Regular',
                'ingredient' => 'ING-COF-01', // Arabica
                'quantity' => 18,
                'unit' => 'gram',
            ],
            [
                'product' => 'CF-AMR-04',
                'variant' => 'Regular',
                'ingredient' => 'ING-PKG-01', // Cup 16oz
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Iced Americano (Double Shot)
            [
                'product' => 'CF-AMR-04',
                'variant' => 'Double Shot',
                'ingredient' => 'ING-COF-01',
                'quantity' => 36,
                'unit' => 'gram',
            ],
            [
                'product' => 'CF-AMR-04',
                'variant' => 'Double Shot',
                'ingredient' => 'ING-PKG-01',
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Caffe Latte (Regular Milk)
            [
                'product' => 'CF-LAT-02',
                'variant' => 'Regular Milk',
                'ingredient' => 'ING-COF-01',
                'quantity' => 18,
                'unit' => 'gram',
            ],
            [
                'product' => 'CF-LAT-02',
                'variant' => 'Regular Milk',
                'ingredient' => 'ING-MLK-01', // Fresh Milk
                'quantity' => 200,
                'unit' => 'ml',
            ],
            [
                'product' => 'CF-LAT-02',
                'variant' => 'Regular Milk',
                'ingredient' => 'ING-PKG-01',
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Caffe Latte (Oat Milk Sub)
            [
                'product' => 'CF-LAT-02',
                'variant' => 'Oat Milk Sub',
                'ingredient' => 'ING-COF-01',
                'quantity' => 18,
                'unit' => 'gram',
            ],
            [
                'product' => 'CF-LAT-02',
                'variant' => 'Oat Milk Sub',
                'ingredient' => 'ING-MLK-02', // Oat Milk
                'quantity' => 200,
                'unit' => 'ml',
            ],
            [
                'product' => 'CF-LAT-02',
                'variant' => 'Oat Milk Sub',
                'ingredient' => 'ING-PKG-01',
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Cappuccino Brulee
            [
                'product' => 'CF-CAP-03',
                'variant' => null,
                'ingredient' => 'ING-COF-01',
                'quantity' => 18,
                'unit' => 'gram',
            ],
            [
                'product' => 'CF-CAP-03',
                'variant' => null,
                'ingredient' => 'ING-MLK-01',
                'quantity' => 180,
                'unit' => 'ml',
            ],
            [
                'product' => 'CF-CAP-03',
                'variant' => null,
                'ingredient' => 'ING-PKG-01',
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Espresso Single Shot
            [
                'product' => 'CF-ESP-01',
                'variant' => null,
                'ingredient' => 'ING-COF-01',
                'quantity' => 10,
                'unit' => 'gram',
            ],
            // Matcha Latte Oat
            [
                'product' => 'TE-MAT-01',
                'variant' => null,
                'ingredient' => 'ING-TEA-01', // Matcha powder
                'quantity' => 15,
                'unit' => 'gram',
            ],
            [
                'product' => 'TE-MAT-01',
                'variant' => null,
                'ingredient' => 'ING-MLK-02', // Oat milk
                'quantity' => 220,
                'unit' => 'ml',
            ],
            [
                'product' => 'TE-MAT-01',
                'variant' => null,
                'ingredient' => 'ING-PKG-01',
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Earl Grey Artisan Tea
            [
                'product' => 'TE-EAR-02',
                'variant' => null,
                'ingredient' => 'ING-TEA-02', // Leaves
                'quantity' => 6,
                'unit' => 'gram',
            ],
            [
                'product' => 'TE-EAR-02',
                'variant' => null,
                'ingredient' => 'ING-PKG-02', // Hot cup
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Wagyu Smash Burger
            [
                'product' => 'FD-BRG-01',
                'variant' => null,
                'ingredient' => 'ING-FD-01', // Wagyu Patty
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            [
                'product' => 'FD-BRG-01',
                'variant' => null,
                'ingredient' => 'ING-FD-02', // Burger bun
                'quantity' => 1,
                'unit' => 'pcs',
            ],
            // Truffle French Fries
            [
                'product' => 'FD-FRY-02',
                'variant' => null,
                'ingredient' => 'ING-FD-03', // Fries
                'quantity' => 150,
                'unit' => 'gram',
            ],
            [
                'product' => 'FD-FRY-02',
                'variant' => null,
                'ingredient' => 'ING-FD-04', // Truffle oil
                'quantity' => 10,
                'unit' => 'ml',
            ],
        ];

        foreach ($recipesToCreate as $rcp) {
            $prod = $productModelMap[$rcp['product']] ?? null;
            $ing = $ingredientMap[$rcp['ingredient']] ?? null;
            if ($prod && $ing) {
                PosRecipe::create([
                    'product_id' => $prod->id,
                    'variant_name' => $rcp['variant'],
                    'ingredient_id' => $ing->id,
                    'quantity' => $rcp['quantity'],
                    'unit' => $rcp['unit'],
                    'notes' => "Standar racikan {$prod->name}",
                ]);
            }
        }

        // -------------------------------------------------------------
        // 10. Sample Historical Shifts & Multi-Branch Orders
        // -------------------------------------------------------------
        // We create completed shifts and orders across the last 7 days for both Jakarta and Bandung
        $now = Carbon::now();

        $outletsConfig = [
            [
                'outlet' => $outletJkt,
                'user' => $kasirJkt,
                'prefix' => 'JKT',
                'daily_order_counts' => [8, 12, 10, 15, 14, 18, 16],
            ],
            [
                'outlet' => $outletBdg,
                'user' => $kasirBdg,
                'prefix' => 'BDG',
                'daily_order_counts' => [5, 8, 7, 10, 9, 14, 12],
            ],
        ];

        foreach ($outletsConfig as $cfg) {
            $currOutlet = $cfg['outlet'];
            $currUser = $cfg['user'];
            $prefix = $cfg['prefix'];

            for ($dayOffset = 6; $dayOffset >= 0; $dayOffset--) {
                $orderDate = $now->copy()->subDays($dayOffset)->setTime(9, 0, 0);
                $shiftCloseDate = $orderDate->copy()->setTime(21, 30, 0);

                // Create Shift for this day
                $shift = PosShift::create([
                    'id' => Str::uuid()->toString(),
                    'tenant_id' => $tenantId,
                    'outlet_id' => $currOutlet->id,
                    'user_id' => $currUser->id,
                    'opened_at' => $orderDate,
                    'closed_at' => $dayOffset === 0 ? null : $shiftCloseDate,
                    'starting_cash' => 200000,
                    'expected_cash' => $dayOffset === 0 ? 200000 : 1850000,
                    'actual_cash' => $dayOffset === 0 ? null : 1850000,
                    'difference' => $dayOffset === 0 ? null : 0,
                    'status' => $dayOffset === 0 ? 'open' : 'closed',
                ]);

                $orderCount = $cfg['daily_order_counts'][6 - $dayOffset] ?? 10;

                for ($i = 1; $i <= $orderCount; $i++) {
                    $transactedAt = $orderDate->copy()->addMinutes(rand(30, 680));
                    $orderNum = sprintf('%s-%s-%04d', $prefix, $transactedAt->format('Ymd'), $i);

                    // Pick 1-3 random items
                    $sampleSkus = ['CF-AMR-04', 'CF-LAT-02', 'TE-MAT-01', 'BK-CRS-01', 'FD-BRG-01', 'FD-FRY-02'];
                    $numItems = rand(1, 3);
                    $pickedSkus = (array) array_rand(array_flip($sampleSkus), $numItems);

                    $subtotal = 0;
                    $itemsToInsert = [];

                    foreach ($pickedSkus as $sku) {
                        $p = $productModelMap[$sku];
                        $qty = rand(1, 2);
                        $variant = null;
                        $price = (float) $p->price;

                        if (!empty($p->variants) && is_array($p->variants)) {
                            $varObj = $p->variants[array_rand($p->variants)];
                            $variant = $varObj['name'] ?? null;
                            $price = (float) ($varObj['price'] ?? $price);
                        }

                        $itemTotal = $price * $qty;
                        $subtotal += $itemTotal;

                        $itemsToInsert[] = [
                            'product' => $p,
                            'sku' => $sku,
                            'name' => $p->name,
                            'variant' => $variant,
                            'qty' => $qty,
                            'unit_price' => $price,
                            'subtotal' => $itemTotal,
                        ];
                    }

                    $tax = round($subtotal * 0.10, 2);
                    $service = round($subtotal * 0.05, 2);
                    $total = $subtotal + $tax + $service;

                    $order = PosOrder::create([
                        'id' => Str::uuid()->toString(),
                        'tenant_id' => $tenantId,
                        'outlet_id' => $currOutlet->id,
                        'user_id' => $currUser->id,
                        'shift_id' => $shift->id,
                        'order_number' => $orderNum,
                        'order_type' => rand(0, 1) ? 'dine_in' : 'takeaway',
                        'table_number' => rand(0, 1) ? (string) rand(1, 15) : null,
                        'customer_name' => rand(0, 1) ? 'Pelanggan ' . rand(10, 99) : null,
                        'subtotal' => $subtotal,
                        'tax_name' => 'PB1 10%',
                        'tax_rate' => 10.00,
                        'tax_amount' => $tax,
                        'charges_amount' => $service,
                        'charges_detail' => [['name' => 'Service Charge 5%', 'amount' => $service]],
                        'discount_amount' => 0,
                        'total_amount' => $total,
                        'payment_status' => 'paid',
                        'transacted_at' => $transactedAt,
                        'erp_sync_status' => 'standalone',
                        'created_at' => $transactedAt,
                        'updated_at' => $transactedAt,
                    ]);

                    foreach ($itemsToInsert as $itm) {
                        PosOrderItem::create([
                            'id' => Str::uuid()->toString(),
                            'order_id' => $order->id,
                            'product_id' => $itm['product']->id,
                            'sku' => $itm['sku'],
                            'product_name' => $itm['name'],
                            'selected_variant' => $itm['variant'],
                            'qty' => $itm['qty'],
                            'unit_price' => $itm['unit_price'],
                            'subtotal' => $itm['subtotal'],
                        ]);
                    }

                    // Payment record
                    $paymentMethod = rand(0, 1) ? 'QRIS' : 'CASH';
                    PosPayment::create([
                        'id' => Str::uuid()->toString(),
                        'order_id' => $order->id,
                        'payment_method' => $paymentMethod,
                        'amount' => $total,
                        'change_amount' => 0,
                        'reference_number' => $paymentMethod === 'QRIS' ? 'QRIS-' . rand(100000, 999999) : null,
                        'created_at' => $transactedAt,
                        'updated_at' => $transactedAt,
                    ]);
                }
            }
        }
    }
}
