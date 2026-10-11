<?php

namespace Database\Seeders;

use App\Models\PosOutlet;
use App\Models\PosProduct;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PosSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or get admin & kasir users
        $admin = User::updateOrCreate(
            ['email' => 'admin@expos.test'],
            [
                'name' => 'Owner / Admin',
                'role' => 'admin',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('1234'),
            ]
        );

        $kasir1 = User::updateOrCreate(
            ['email' => 'kasir@expos.test'],
            [
                'name' => 'Kasir Maya',
                'role' => 'cashier',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('1234'),
            ]
        );

        $kasir2 = User::updateOrCreate(
            ['email' => 'kasir2@expos.test'],
            [
                'name' => 'Kasir Budi',
                'role' => 'cashier',
                'password' => bcrypt('password123'),
                'pin' => bcrypt('5678'),
            ]
        );

        // 2. Create default outlet
        $outlet = PosOutlet::firstOrCreate(
            ['code' => 'OUT-01'],
            [
                'id' => Str::uuid()->toString(),
                'tenant_id' => 'tenant-uuid-001',
                'name' => 'EXPOS Store Central',
                'address' => 'Jl. Sudirman No. 88, Jakarta Selatan',
                'phone' => '081234567890',
                'is_active' => true,
            ]
        );

        // 3. Sample Products
        $products = [
            [
                'sku' => 'CF-ESP-01',
                'barcode' => '899100100001',
                'name' => 'Espresso Single Shot',
                'category' => 'Coffee',
                'price' => 22000,
                'cost_price' => 8000,
                'stock' => 150,
            ],
            [
                'sku' => 'CF-LAT-02',
                'barcode' => '899100100002',
                'name' => 'Caffe Latte 250ml',
                'category' => 'Coffee',
                'price' => 32000,
                'cost_price' => 12000,
                'stock' => 120,
            ],
            [
                'sku' => 'CF-CAP-03',
                'barcode' => '899100100003',
                'name' => 'Cappuccino Brulee',
                'category' => 'Coffee',
                'price' => 35000,
                'cost_price' => 14000,
                'stock' => 90,
            ],
            [
                'sku' => 'CF-AMR-04',
                'barcode' => '899100100004',
                'name' => 'Iced Americano',
                'category' => 'Coffee',
                'price' => 25000,
                'cost_price' => 7000,
                'stock' => 200,
            ],
            [
                'sku' => 'TE-MAT-01',
                'barcode' => '899100200001',
                'name' => 'Matcha Latte Oat',
                'category' => 'Tea',
                'price' => 38000,
                'cost_price' => 16000,
                'stock' => 75,
            ],
            [
                'sku' => 'TE-EAR-02',
                'barcode' => '899100200002',
                'name' => 'Earl Grey Artisan Tea',
                'category' => 'Tea',
                'price' => 28000,
                'cost_price' => 9000,
                'stock' => 100,
            ],
            [
                'sku' => 'BK-CRS-01',
                'barcode' => '899100300001',
                'name' => 'Butter Croissant',
                'category' => 'Bakery',
                'price' => 27000,
                'cost_price' => 11000,
                'stock' => 45,
            ],
            [
                'sku' => 'BK-CIN-02',
                'barcode' => '899100300002',
                'name' => 'Cinnamon Roll Glaze',
                'category' => 'Bakery',
                'price' => 30000,
                'cost_price' => 12000,
                'stock' => 40,
            ],
            [
                'sku' => 'FD-BRG-01',
                'barcode' => '899100400001',
                'name' => 'Wagyu Smash Burger',
                'category' => 'Food',
                'price' => 65000,
                'cost_price' => 32000,
                'stock' => 30,
            ],
            [
                'sku' => 'FD-FRY-02',
                'barcode' => '899100400002',
                'name' => 'Truffle French Fries',
                'category' => 'Food',
                'price' => 35000,
                'cost_price' => 14000,
                'stock' => 80,
            ],
        ];

        foreach ($products as $prod) {
            PosProduct::firstOrCreate(
                ['sku' => $prod['sku']],
                [
                    'id' => Str::uuid()->toString(),
                    'tenant_id' => $outlet->tenant_id,
                    'outlet_id' => $outlet->id,
                    'barcode' => $prod['barcode'],
                    'name' => $prod['name'],
                    'category' => $prod['category'],
                    'price' => $prod['price'],
                    'cost_price' => $prod['cost_price'],
                    'stock' => $prod['stock'],
                    'is_active' => true,
                ]
            );
        }
    }
}
