import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import {
    Users,
    Shield,
    Plus,
    Search,
    Edit2,
    Trash2,
    Lock,
    KeyRound,
    CheckCircle2,
    XCircle,
    X,
    Save,
    AlertCircle,
    UserCheck,
    Store,
    Info,
} from 'lucide-react';

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    role_name: string;
    outlet_id: string | null;
    outlet_name: string;
    is_active: boolean;
    has_pin: boolean;
    created_at: string;
}

interface RoleItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    permissions: string[];
    is_system: boolean;
    users_count: number;
}

interface OutletItem {
    id: string;
    name: string;
}

interface PermissionGroup {
    domain: string;
    permissions: {
        key: string;
        label: string;
        description: string;
    }[];
}

interface UsersPageProps {
    users: UserItem[];
    roles: RoleItem[];
    outlets: OutletItem[];
    available_permissions: PermissionGroup[];
    filters: {
        search?: string;
        role?: string;
    };
}

export default function UsersIndex({
    users,
    roles,
    outlets,
    available_permissions,
    filters,
}: UsersPageProps) {
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState(filters.role || '');

    // User Modal state
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    // Role Edit / Modal state
    const [selectedRole, setSelectedRole] = useState<RoleItem>(roles[0] || null);
    const [rolePermissions, setRolePermissions] = useState<string[]>(
        roles[0]?.permissions || []
    );
    const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);

    // User Form
    const userForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        pin: '',
        outlet_id: '',
        is_active: true,
    });

    // New Role Form
    const roleForm = useForm({
        name: '',
        description: '',
        permissions: [] as string[],
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/backoffice/users',
            { search, role: selectedRoleFilter },
            { preserveState: true }
        );
    };

    const openCreateUserModal = () => {
        setEditingUser(null);
        userForm.reset();
        userForm.setData({
            name: '',
            email: '',
            password: '',
            role: 'cashier',
            pin: '',
            outlet_id: outlets[0]?.id || '',
            is_active: true,
        });
        setIsUserModalOpen(true);
    };

    const openEditUserModal = (u: UserItem) => {
        setEditingUser(u);
        userForm.reset();
        userForm.setData({
            name: u.name,
            email: u.email,
            password: '', // Blank unless changing
            role: u.role,
            pin: '', // Blank unless changing
            outlet_id: u.outlet_id || '',
            is_active: u.is_active,
        });
        setIsUserModalOpen(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            userForm.put(`/backoffice/users/${editingUser.id}`, {
                onSuccess: () => setIsUserModalOpen(false),
            });
        } else {
            userForm.post('/backoffice/users', {
                onSuccess: () => setIsUserModalOpen(false),
            });
        }
    };

    const handleDeleteUser = (u: UserItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${u.name}"?`)) {
            router.delete(`/backoffice/users/${u.id}`);
        }
    };

    const handleSelectRoleToEdit = (role: RoleItem) => {
        setSelectedRole(role);
        setRolePermissions(role.permissions || []);
    };

    const handleTogglePermission = (permKey: string) => {
        if (selectedRole?.slug === 'admin') return; // Admin always full
        setRolePermissions((prev) =>
            prev.includes(permKey)
                ? prev.filter((p) => p !== permKey)
                : [...prev, permKey]
        );
    };

    const handleSaveRolePermissions = () => {
        if (!selectedRole) return;
        router.put(
            `/backoffice/roles/${selectedRole.id}`,
            {
                name: selectedRole.name,
                description: selectedRole.description,
                permissions: rolePermissions,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        roleForm.post('/backoffice/roles', {
            onSuccess: () => {
                setIsNewRoleModalOpen(false);
                roleForm.reset();
            },
        });
    };

    const handleDeleteRole = (role: RoleItem) => {
        if (role.is_system) {
            alert('Role bawaan sistem tidak dapat dihapus.');
            return;
        }
        if (confirm(`Hapus role "${role.name}"?`)) {
            router.delete(`/backoffice/roles/${role.id}`);
        }
    };

    // Quick Stats
    const totalUsers = users.length;
    const activeCashiers = users.filter((u) => u.is_active && u.role === 'cashier').length;
    const adminsCount = users.filter((u) => u.role === 'admin' || u.role === 'manager').length;
    const usersWithPin = users.filter((u) => u.has_pin).length;

    return (
        <BackofficeLayout currentTab="users">
            <Head title="Backoffice - Pengguna & Hak Akses" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Pengguna & Hak Akses
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola akun operator kasir, manajer, PIN keamanan, serta matriks Role Permission
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'users' ? (
                        <button
                            onClick={openCreateUserModal}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Tambah Pengguna</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsNewRoleModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Buat Role Baru</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs (Pengguna vs Roles) */}
            <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                        activeTab === 'users'
                            ? 'border-slate-900 text-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Daftar Pengguna & Kasir</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                        {users.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('roles')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                        activeTab === 'roles'
                            ? 'border-slate-900 text-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Shield className="w-4 h-4" />
                    <span>Role & Hak Akses (Permissions)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                        {roles.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: USERS LIST */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase">
                                Total Pengguna
                            </span>
                            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                                {totalUsers}
                            </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase">
                                Kasir Aktif
                            </span>
                            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                                {activeCashiers}
                            </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase">
                                Admin & Manajer
                            </span>
                            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">
                                {adminsCount}
                            </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase">
                                PIN Kasir Aktif
                            </span>
                            <span className="text-2xl font-extrabold text-purple-600 mt-1 block">
                                {usersWithPin}
                            </span>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3"
                    >
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau email pengguna..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-slate-900"
                            />
                        </div>

                        <select
                            value={selectedRoleFilter}
                            onChange={(e) => setSelectedRoleFilter(e.target.value)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="">Semua Role</option>
                            {roles.map((r) => (
                                <option key={r.slug} value={r.slug}>
                                    {r.name}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                        >
                            Terapkan
                        </button>
                    </form>

                    {/* Users Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4">Pengguna</th>
                                        <th className="py-3 px-4">Role</th>
                                        <th className="py-3 px-4">PIN Kasir</th>
                                        <th className="py-3 px-4">Cabang Outlet</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <span>Tidak ada data pengguna ditemukan</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((u) => {
                                            const roleColors: Record<string, string> = {
                                                admin: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                manager: 'bg-blue-50 text-blue-700 border-blue-200',
                                                cashier: 'bg-purple-50 text-purple-700 border-purple-200',
                                                kitchen: 'bg-amber-50 text-amber-700 border-amber-200',
                                            };
                                            const badgeColor =
                                                roleColors[u.role] ||
                                                'bg-slate-100 text-slate-700 border-slate-200';

                                            return (
                                                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-xs shadow-xs">
                                                                {u.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block">
                                                                    {u.name}
                                                                </span>
                                                                <span className="text-slate-400 text-[11px]">
                                                                    {u.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badgeColor}`}
                                                        >
                                                            {u.role_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {u.has_pin ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                                                                <KeyRound className="w-3 h-3" />
                                                                PIN Terpasang
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[11px]">
                                                                <Lock className="w-3 h-3" />
                                                                Belum Diatur
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <Store className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{u.outlet_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {u.is_active ? (
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                Nonaktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right space-x-1">
                                                        <button
                                                            onClick={() => openEditUserModal(u)}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                                            title="Edit Pengguna"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                            title="Hapus Pengguna"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Role Selector Sidebar */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 px-1">
                            Daftar Role Jabatan
                        </span>

                        {roles.map((r) => {
                            const isSelected = selectedRole?.id === r.id;
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => handleSelectRoleToEdit(r)}
                                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs">{r.name}</span>
                                            {r.is_system && (
                                                <span
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                                                        isSelected
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    Sistem
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`text-[11px] line-clamp-1 mt-0.5 ${
                                                isSelected ? 'text-slate-400' : 'text-slate-500'
                                            }`}
                                        >
                                            {r.description || 'Tidak ada deskripsi'}
                                        </p>
                                    </div>

                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-slate-800 text-emerald-400'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {r.users_count} staf
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Permissions Matrix Detail */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
                        {selectedRole ? (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold text-slate-900">
                                                Hak Akses: {selectedRole.name}
                                            </h2>
                                            {selectedRole.slug === 'admin' && (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                                    Semua Izin Aktif
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {selectedRole.description ||
                                                'Sesuaikan izin hak akses modul untuk role ini.'}
                                        </p>
                                    </div>

                                    {!selectedRole.is_system && (
                                        <button
                                            onClick={() => handleDeleteRole(selectedRole)}
                                            className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 self-start sm:self-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Hapus Role</span>
                                        </button>
                                    )}
                                </div>

                                {/* Permission Groups List */}
                                <div className="space-y-6 mt-6">
                                    {available_permissions.map((group) => (
                                        <div key={group.domain} className="space-y-3">
                                            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                {group.domain}
                                            </h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {group.permissions.map((perm) => {
                                                    const isChecked =
                                                        selectedRole.slug === 'admin' ||
                                                        rolePermissions.includes(perm.key);
                                                    const isDisabled = selectedRole.slug === 'admin';

                                                    return (
                                                        <label
                                                            key={perm.key}
                                                            className={`p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer select-none ${
                                                                isChecked
                                                                    ? 'bg-slate-50/80 border-emerald-300'
                                                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                                            } ${isDisabled ? 'opacity-85 cursor-not-allowed' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                disabled={isDisabled}
                                                                onChange={() =>
                                                                    handleTogglePermission(perm.key)
                                                                }
                                                                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                                            />
                                                            <div className="text-xs">
                                                                <span className="font-bold text-slate-900 block">
                                                                    {perm.label}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                                                                    {perm.description}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Save Button */}
                                {selectedRole.slug !== 'admin' && (
                                    <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                                        <button
                                            onClick={handleSaveRolePermissions}
                                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                                        >
                                            <Save className="w-4 h-4 text-emerald-400" />
                                            <span>Simpan Perubahan Hak Akses</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-400">
                                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <span>Pilih role di sebelah kiri untuk melihat hak akses</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: CREATE / EDIT USER */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">
                                    {editingUser ? 'Edit Pengguna Kasir' : 'Tambah Pengguna Baru'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {editingUser
                                        ? `Perbarui profil dan akses untuk ${editingUser.name}`
                                        : 'Tambahkan operator kasir atau manajer toko baru'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsUserModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 text-xs">
                            {/* Nama */}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Nama Lengkap Staf / Kasir *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.data.name}
                                    onChange={(e) => userForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Maya Anggraini"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                />
                                {userForm.errors.name && (
                                    <p className="text-rose-600 mt-1 text-[11px]">
                                        {userForm.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Alamat Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={userForm.data.email}
                                    onChange={(e) => userForm.setData('email', e.target.value)}
                                    placeholder="maya@expos.test"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                />
                                {userForm.errors.email && (
                                    <p className="text-rose-600 mt-1 text-[11px]">
                                        {userForm.errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password & PIN Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        {editingUser ? 'Password (Kosongkan jika tidak ubah)' : 'Password Akun *'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={userForm.data.password}
                                        onChange={(e) => userForm.setData('password', e.target.value)}
                                        placeholder="Min. 6 karakter"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                    />
                                    {userForm.errors.password && (
                                        <p className="text-rose-600 mt-1 text-[11px]">
                                            {userForm.errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        4 Digit PIN Kasir POS
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={userForm.data.pin}
                                        onChange={(e) => userForm.setData('pin', e.target.value)}
                                        placeholder="Contoh: 1234"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono tracking-widest"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        Digunakan untuk login cepat di layar tablet POS
                                    </span>
                                </div>
                            </div>

                            {/* Role & Outlet Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        Role / Jabatan *
                                    </label>
                                    <select
                                        value={userForm.data.role}
                                        onChange={(e) => userForm.setData('role', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900"
                                    >
                                        {roles.map((r) => (
                                            <option key={r.slug} value={r.slug}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        Cabang Outlet
                                    </label>
                                    <select
                                        value={userForm.data.outlet_id}
                                        onChange={(e) => userForm.setData('outlet_id', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900"
                                    >
                                        <option value="">Semua Cabang</option>
                                        {outlets.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Switch */}
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={userForm.data.is_active}
                                        onChange={(e) => userForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800">
                                            Status Pengguna Aktif
                                        </span>
                                        <span className="text-[11px] text-slate-500 block">
                                            Pengguna yang dinonaktifkan tidak dapat login ke sistem maupun terminal kasir
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={userForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs"
                                >
                                    <UserCheck className="w-4 h-4 text-emerald-400" />
                                    <span>{editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE NEW ROLE */}
            {isNewRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">Buat Role Jabatan Baru</h3>
                                <p className="text-xs text-slate-400">
                                    Tentukan nama role dan deskripsi tugasnya
                                </p>
                            </div>
                            <button
                                onClick={() => setIsNewRoleModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRole} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Nama Role *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={roleForm.data.name}
                                    onChange={(e) => roleForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Barista Senior / Supervisor"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Deskripsi Tugas
                                </label>
                                <textarea
                                    rows={3}
                                    value={roleForm.data.description}
                                    onChange={(e) => roleForm.setData('description', e.target.value)}
                                    placeholder="Penjelasan wewenang dan cakupan pekerjaan role ini..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewRoleModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={roleForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs"
                                >
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <span>Simpan Role</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
