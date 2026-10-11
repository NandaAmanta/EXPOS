# Blueprint Arsitektur Sistem POS (PWA + Laravel Inertia)
*Solusi Standalone (Mandiri) & Ready-to-Integrate (Bundling) dengan EXP ERP Core*

---

## 1. Ringkasan Eksekutif & Karakteristik Solusi

Sistem ini dikembangkan sebagai **1 Project Laravel Terpadu** yang melayani dua fungsi utama sekaligus:
1. **Frontoffice Kasir (PWA Local-First):** Dirancang untuk antarmuka layar sentuh tablet/PC kasir, mendukung mode offline tanpa gangguan koneksi internet, serta memiliki latensi transaksi sub-detik (<100ms) menggunakan penyimpanan lokal browser (IndexedDB).
2. **Backoffice Admin (Web Dashboard):** Modul manajemen katalog produk, stok gerai, audit pergantian shift kasir, dan laporan omzet harian.
3. **Integration Connector (ERP Bridge):** Modul jembatan opsional berbasis *Outbox Pattern*. Jika klien berlangganan paket komplit (Bundled), transaksi POS otomatis terkonversi menjadi dokumen faktur penjualan, mutasi inventaris, dan jurnal akuntansi di EXP ERP Core.

---

## 2. Diagram Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│ BROWSER KASIR (PWA Client - Local-First Engine)                         │
│                                                                        │
│  [ UI Layer: Vue 3 / React + Tailwind CSS (Inertia View) ]              │
│        │                                                               │
│        ├── Service Worker (Cache App Shell via vite-plugin-pwa)        │
│        │                                                               │
│        ├── Local Database: Dexie.js (IndexedDB)                        │
│        │     ├── products_cache (Katalog, harga, barcode)              │
│        │     ├── active_shifts  (Status shift & modal kasir)           │
│        │     └── orders_outbox  (Antrean transaksi lokal / offline)    │
│        │                                                               │
│        ├── Hardware Bridge (Cetak Struk ESC/POS via Bluetooth / USB)   │
│        │                                                               │
│        └── Sync Worker (Background Axios Loop via navigator.onLine)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                      HTTPS / JSON Batch Sync API
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ LARAVEL BACKEND POS (Single Project Hub)                               │
│                                                                        │
│  ├── Ingestion Controller (Batch validation & UUID Idempotency Guard)  │
│  ├── Database POS (MySQL / PostgreSQL: orders, shifts, outlets)        │
│  ├── Mini-Backoffice (Inertia Dashboard untuk Owner/Admin)             │
│  └── Integration Outbox Dispatcher (Laravel Redis Queue)               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                 Mode Bundled Aktif? (Webhook / Internal Event)
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ EXP ERP CORE (Sistem ERP Eksisting)                                    │
│                                                                        │
│  ├── Penjualan   ──> Terbit Faktur Penjualan (Sales Invoice) Otomatis  │
│  ├── Inventaris  ──> Pemotongan Stok Gudang Cabang Terkait             │
│  ├── Kas & Bank  ──> Mutasi Penerimaan Kas / Rekonsiliasi QRIS         │
│  └── Buku Besar  ──> Jurnal Finansial Otomatis                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Struktur Direktori 1 Project Laravel (POS + Backoffice + PWA)

```text
pos-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Backoffice/
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── ProductController.php
│   │   │   │   ├── ShiftReportController.php
│   │   │   │   └── SalesReportController.php
│   │   │   └── Api/
│   │   │       ├── PosSyncController.php       <-- Batch Ingestion Endpoint
│   │   │       └── PosCatalogController.php    <-- Feed Master Data Kasir
│   │   └── Middleware/
│   └── Jobs/
│       ├── ProcessPosOrderSync.php             <-- Simpan order & potong stok POS
│       └── DispatchOrderToErpJob.php           <-- Kirim ke modul ERP jika Bundled
├── database/
│   └── migrations/
│       ├── create_pos_outlets_table.php
│       ├── create_pos_products_table.php
│       ├── create_pos_shifts_table.php
│       ├── create_pos_orders_table.php
│       ├── create_pos_order_items_table.php
│       └── create_pos_payments_table.php
├── resources/
│   └── js/
│       ├── Pages/
│       │   ├── Backoffice/                     <-- Dashboard Pemilik/Admin
│       │   │   ├── Products/Index.vue
│       │   │   └── Reports/DailySales.vue
│       │   └── Pos/                            <-- Terminal Kasir PWA
│       │       ├── Terminal.vue                <-- UI Grid Produk, Keranjang, Bayar
│       │       ├── ShiftModal.vue              <-- Buka/Tutup Kasir
│       │       ├── db.js                       <-- Dexie.js (IndexedDB Engine)
│       │       ├── printer.js                  <-- Driver ESC/POS Thermal Print
│       │       └── syncWorker.js               <-- Background sync loop
│       ├── sw.js                               <-- Service Worker Workbox
│       └── manifest.json                       <-- PWA Manifest Configuration
└── routes/
    ├── web.php                                 <-- Inertia Routes (Backoffice & POS UI)
    └── api.php                                 <-- High-throughput Sync Endpoints
```

---

## 4. Mekanisme Offline-First Kasir (Client-Side)

### A. Skema IndexedDB Browser (`resources/js/Pages/Pos/db.js`)
```javascript
import Dexie from 'dexie';

export const posDb = new Dexie('ExpPosLocalDb');

posDb.version(1).stores({
  products: 'id, sku, name, barcode, category_id, price',
  shifts: 'id, user_id, status, opened_at',
  orders: 'id, order_number, is_synced, created_at'
});
```

### B. Alur Checkout Kasir (Sub-detik & Bebas Network Lag)
```javascript
import { posDb } from './db';
import { printThermalReceipt } from './printer';

export async function processCheckout(cartState, paymentDetails, cashierId) {
  // 1. Generate UUID di browser untuk mencegah bentrok ID
  const orderId = crypto.randomUUID();
  const orderNumber = `POS-${Date.now().toString().slice(-6)}`;

  const orderPayload = {
    id: orderId,
    order_number: orderNumber,
    cashier_id: cashierId,
    subtotal: cartState.subtotal,
    tax_amount: cartState.tax,
    discount_amount: cartState.discount,
    total_amount: cartState.total,
    items: cartState.items,
    payments: paymentDetails,
    is_synced: 0, // Flag: Belum terkirim ke server Laravel
    created_at: new Date().toISOString()
  };

  // 2. Simpan seketika ke database browser IndexedDB
  await posDb.orders.add(orderPayload);

  // 3. Langsung cetak struk via ESC/POS (Bluetooth/Web Print)
  await printThermalReceipt(orderPayload);

  // 4. Trigger sinkronisasi latar belakang jika internet aktif
  if (navigator.onLine) {
    triggerBackgroundSync();
  }

  return orderPayload;
}
```

### C. Background Sync Worker (`resources/js/Pages/Pos/syncWorker.js`)
```javascript
import axios from 'axios';
import { posDb } from './db';

export async function triggerBackgroundSync() {
  const pendingOrders = await posDb.orders.where('is_synced').equals(0).toArray();
  if (pendingOrders.length === 0) return;

  try {
    const response = await axios.post('/api/pos/orders/batch-sync', {
      orders: pendingOrders
    });

    if (response.data.synced_ids?.length > 0) {
      // Perbarui flag transaksi yang sudah berhasil diterima server
      await posDb.orders
        .where('id')
        .anyOf(response.data.synced_ids)
        .modify({ is_synced: 1 });
    }
  } catch (error) {
    console.warn('Sync tertunda: jaringan server sedang tidak terjangkau.');
  }
}

// Pantau event koneksi kembali aktif
window.addEventListener('online', () => {
  triggerBackgroundSync();
});
```

---

## 5. Skema Database Inti Backend POS (Laravel Migration)

```php
// Tabel Header Transaksi Kasir
Schema::create('pos_orders', function (Blueprint $table) {
    $table->uuid('id')->primary(); // UUID dari kasir
    $table->foreignUuid('tenant_id')->index();
    $table->foreignUuid('outlet_id')->index();
    $table->foreignUuid('user_id'); // ID Kasir
    $table->string('order_number')->unique();
    $table->decimal('subtotal', 15, 2);
    $table->decimal('tax_amount', 15, 2)->default(0);
    $table->decimal('discount_amount', 15, 2)->default(0);
    $table->decimal('total_amount', 15, 2);
    $table->string('payment_status')->default('paid');
    $table->timestamp('transacted_at');
    
    // Status Sinkronisasi ERP (Outbox Tracking)
    $table->enum('erp_sync_status', ['standalone', 'pending', 'synced', 'failed'])->default('standalone');
    $table->string('erp_reference_id')->nullable(); // Nomor Faktur Penjualan ERP
    $table->timestamps();
});

// Tabel Rincian Barang
Schema::create('pos_order_items', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('order_id')->constrained('pos_orders')->cascadeOnDelete();
    $table->uuid('product_id');
    $table->string('sku');
    $table->string('product_name');
    $table->integer('qty');
    $table->decimal('unit_price', 15, 2);
    $table->decimal('subtotal', 15, 2);
    $table->timestamps();
});

// Tabel Rincian Pembayaran
Schema::create('pos_payments', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('order_id')->constrained('pos_orders')->cascadeOnDelete();
    $table->string('payment_method'); // CASH, QRIS, DEBIT, CREDIT
    $table->decimal('amount', 15, 2);
    $table->string('reference_number')->nullable();
    $table->timestamps();
});
```

---

## 6. Controller Batch Ingestion di Laravel (`PosSyncController.php`)

```php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessPosOrderSync;

class PosSyncController extends Controller
{
    public function batchSync(Request $request)
    {
        $validated = $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|uuid',
            'orders.*.order_number' => 'required|string',
            'orders.*.total_amount' => 'required|numeric',
            'orders.*.items' => 'required|array',
            'orders.*.payments' => 'required|array',
            'orders.*.created_at' => 'required|date',
        ]);

        $syncedIds = [];

        foreach ($validated['orders'] as $orderData) {
            // Idempotency Check: Pastikan order UUID belum pernah diproses
            $alreadyExists = DB::table('pos_orders')->where('id', $orderData['id'])->exists();

            if (! $alreadyExists) {
                // Dispatch ke antrean Redis agar HTTP request kasir tetap instan
                ProcessPosOrderSync::dispatch($orderData, $request->user()->tenant_id);
            }

            $syncedIds[] = $orderData['id'];
        }

        return response()->json([
            'status' => 'success',
            'synced_ids' => $syncedIds,
        ]);
    }
}
```

---

## 7. Logika Operasional: Standalone vs Bundled ERP

| Aspek Operasional | Mode Standalone (POS Saja) | Mode Bundled (POS + EXP ERP) |
|---|---|---|
| **Master Item & Harga** | Diinput lewat menu Backoffice bawaan POS. | Diambil dari modul **Inventaris** ERP secara otomatis. |
| **Pencatatan Penjualan** | Tersimpan di tabel `pos_orders` untuk laporan kasir harian. | Di-push ke modul **Penjualan** ERP menjadi Faktur Penjualan resmi. |
| **Pengurangan Stok** | Memotong stok outlet di tabel `pos_products`. | Memicu mutasi pengeluaran barang di modul **Inventaris** ERP. |
| **Arus Kas & Setoran** | Dicatat di laporan shift kasir POS. | Masuk ke modul **Kas & Bank** dan otomatis membentuk jurnal di **Buku Besar** ERP. |

---

## 8. Payload Kontrak Integrasi ke EXP ERP

Jika tenant terdaftar dalam mode **Bundled ERP**, job worker backend POS akan mengirim payload JSON terstandardisasi berikut ke ERP:

```json
{
  "event": "pos.order.completed",
  "tenant_id": "tenant-uuid-001",
  "outlet_warehouse_id": "WH-CABANG-01",
  "data": {
    "pos_order_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "order_number": "POS-882910",
    "transacted_at": "2026-10-11T12:00:00Z",
    "items": [
      {
        "sku": "TSHIRT-BLK-L",
        "qty": 2,
        "unit_price": 75000,
        "subtotal": 150000
      }
    ],
    "payments": [
      {
        "method": "QRIS",
        "account_code": "1102-BANK-BCA",
        "amount": 150000,
        "reference_no": "QRIS-TRX-55123"
      }
    ],
    "subtotal": 150000,
    "tax_amount": 0,
    "discount_amount": 0,
    "total_amount": 150000
  }
}
```

---

## 9. Tahapan Rencana Kerja (Implementation Milestones)

* **Milestone 1 (Frontend Kasir PWA):** Setup `vite-plugin-pwa`, integrasi Dexie.js, keranjang belanja lokal, driver print ESC/POS (Bluetooth/Web Print), dan pengujian mode offline total.
* **Milestone 2 (Backend POS & Backoffice):** Setup controller batch sync, verifikasi idempotency UUID, dashboard backoffice admin (katalog produk, riwayat transaksi, rekap shift kasir).
* **Milestone 3 (Connector Adapter EXP ERP):** Pembuatan endpoint penerima webhook di modul Penjualan & Inventaris ERP, serta queue dispatcher di POS untuk integrasi otomatis.