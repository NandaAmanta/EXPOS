<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosOutlet;
use App\Models\PosRole;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Standard POS Permission Definitions by Domain
     */
    public static function getAvailablePermissions(): array
    {
        return [
            [
                'domain' => 'Terminal Kasir (POS)',
                'permissions' => [
                    [
                        'key' => 'pos.access',
                        'label' => 'Akses Terminal POS',
                        'description' => 'Dapat memilih kasir dan membuka terminal kasir POS',
                    ],
                    [
                        'key' => 'pos.discount',
                        'label' => 'Berikan Diskon',
                        'description' => 'Dapat memberikan diskon persen (%) atau nominal (Rp) pada transaksi',
                    ],
                    [
                        'key' => 'pos.park_order',
                        'label' => 'Parkir / Tahan Pesanan',
                        'description' => 'Dapat menyimpan pesanan sementara (Hold Order) dan memanggilnya kembali',
                    ],
                    [
                        'key' => 'pos.shift_manage',
                        'label' => 'Kelola Shift & Kas',
                        'description' => 'Dapat membuka/menutup shift kasir dan mencatat kas masuk / keluar (Petty Cash)',
                    ],
                    [
                        'key' => 'pos.spk_print',
                        'label' => 'Cetak SPK Dapur (KOT)',
                        'description' => 'Dapat mencetak Surat Perintah Kerja pesanan untuk dapur / bar',
                    ],
                ],
            ],
            [
                'domain' => 'Katalog & Menu',
                'permissions' => [
                    [
                        'key' => 'catalog.view',
                        'label' => 'Lihat Katalog Produk',
                        'description' => 'Dapat melihat daftar produk, kategori, harga, dan varian',
                    ],
                    [
                        'key' => 'catalog.manage',
                        'label' => 'Kelola Produk & Kategori',
                        'description' => 'Dapat menambah, mengubah, dan menghapus produk serta varian',
                    ],
                ],
            ],
            [
                'domain' => 'Laporan & Audit',
                'permissions' => [
                    [
                        'key' => 'reports.sales',
                        'label' => 'Riwayat & Detail Penjualan',
                        'description' => 'Dapat melihat transaksi penjualan menyeluruh beserta kasir terkait',
                    ],
                    [
                        'key' => 'reports.shifts',
                        'label' => 'Audit Shift & Uang Kasir',
                        'description' => 'Dapat melihat audit rekonsiliasi kas shift dan selisih kas fisik',
                    ],
                    [
                        'key' => 'reports.export',
                        'label' => 'Cetak & Ekspor Laporan',
                        'description' => 'Dapat mencetak struk ulang dan mengunduh laporan keuangan',
                    ],
                ],
            ],
            [
                'domain' => 'Pengguna & Sistem',
                'permissions' => [
                    [
                        'key' => 'users.manage',
                        'label' => 'Kelola Pengguna & Hak Akses',
                        'description' => 'Dapat menambah staf/kasir baru, mereset PIN, dan mengatur Role Permission',
                    ],
                ],
            ],
        ];
    }

    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $roleFilter = $request->query('role');

        $users = User::query()
            ->with(['posRole', 'outlet'])
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($roleFilter, fn ($q) => $q->where('role', $roleFilter))
            ->orderBy('name')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'role_name' => $u->posRole?->name ?? ucfirst($u->role),
                    'outlet_id' => $u->outlet_id,
                    'outlet_name' => $u->outlet?->name ?? 'Semua Outlet',
                    'is_active' => (bool) $u->is_active,
                    'has_pin' => !empty($u->pin),
                    'created_at' => $u->created_at?->toISOString(),
                ];
            });

        $roles = PosRole::query()
            ->withCount('users')
            ->orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        $outlets = PosOutlet::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('backoffice/users/index', [
            'users' => $users,
            'roles' => $roles,
            'outlets' => $outlets,
            'available_permissions' => self::getAvailablePermissions(),
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|exists:pos_roles,slug',
            'pin' => 'nullable|string|min:4|max:6',
            'outlet_id' => 'nullable|uuid|exists:pos_outlets,id',
            'is_active' => 'boolean',
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'outlet_id' => $validated['outlet_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['pin'])) {
            $userData['pin'] = Hash::make($validated['pin']);
        }

        User::create($userData);

        return redirect()->route('backoffice.users.index')
            ->with('success', "Pengguna {$validated['name']} berhasil ditambahkan.");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|max:255|unique:users,email,{$id}",
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|exists:pos_roles,slug',
            'pin' => 'nullable|string|min:4|max:6',
            'outlet_id' => 'nullable|uuid|exists:pos_outlets,id',
            'is_active' => 'boolean',
        ]);

        // Safety Guard: Don't allow user to deactivate themselves
        if (auth()->id() === $user->id && isset($validated['is_active']) && !$validated['is_active']) {
            return redirect()->back()->withErrors([
                'is_active' => 'Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.',
            ]);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->outlet_id = $validated['outlet_id'] ?? null;
        $user->is_active = $validated['is_active'] ?? true;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if (array_key_exists('pin', $validated)) {
            if (!empty($validated['pin'])) {
                $user->pin = Hash::make($validated['pin']);
            } elseif ($validated['pin'] === '') {
                // Clear PIN if explicitly set to empty string
                $user->pin = null;
            }
        }

        $user->save();

        return redirect()->route('backoffice.users.index')
            ->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    public function destroy(int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if (auth()->id() === $user->id) {
            return redirect()->back()->withErrors([
                'error' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ]);
        }

        // Check if last admin
        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return redirect()->back()->withErrors([
                'error' => 'Tidak dapat menghapus Administrator terakhir di dalam sistem.',
            ]);
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->route('backoffice.users.index')
            ->with('success', "Pengguna {$userName} berhasil dihapus.");
    }

    public function storeRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
        ]);

        $slug = Str::slug($validated['name']);
        if (PosRole::where('slug', $slug)->exists()) {
            $slug .= '-' . Str::random(4);
        }

        PosRole::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'permissions' => $validated['permissions'],
            'is_system' => false,
        ]);

        return redirect()->route('backoffice.users.index')
            ->with('success', "Role {$validated['name']} berhasil dibuat.");
    }

    public function updateRole(Request $request, int $id): RedirectResponse
    {
        $role = PosRole::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
        ]);

        $role->name = $validated['name'];
        $role->description = $validated['description'] ?? null;

        // Admin role always keeps all permissions
        if ($role->slug === 'admin') {
            $allKeys = [];
            foreach (self::getAvailablePermissions() as $domain) {
                foreach ($domain['permissions'] as $p) {
                    $allKeys[] = $p['key'];
                }
            }
            $role->permissions = $allKeys;
        } else {
            $role->permissions = $validated['permissions'];
        }

        $role->save();

        return redirect()->route('backoffice.users.index')
            ->with('success', "Hak akses role {$role->name} berhasil diperbarui.");
    }

    public function destroyRole(int $id): RedirectResponse
    {
        $role = PosRole::findOrFail($id);

        if ($role->is_system) {
            return redirect()->back()->withErrors([
                'error' => 'Role sistem bawaan tidak dapat dihapus.',
            ]);
        }

        if ($role->users()->count() > 0) {
            return redirect()->back()->withErrors([
                'error' => "Role {$role->name} masih digunakan oleh {$role->users()->count()} pengguna.",
            ]);
        }

        $roleName = $role->name;
        $role->delete();

        return redirect()->route('backoffice.users.index')
            ->with('success', "Role {$roleName} berhasil dihapus.");
    }
}
