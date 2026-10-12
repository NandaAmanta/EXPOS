import React, { useState, useRef, useEffect } from 'react';
import type { PosCategory } from '@/types/pos';
import { Search, Plus, Check, ChevronDown, Tag, Loader2 } from 'lucide-react';

interface CategorySearchableSelectProps {
    value: string;
    onChange: (categoryName: string) => void;
    categories: (PosCategory | string)[];
    onCategoryCreated?: (newCategory: PosCategory) => void;
}

export default function CategorySearchableSelect({
    value,
    onChange,
    categories,
    onCategoryCreated,
}: CategorySearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const getCatName = (c: PosCategory | string): string => {
        return typeof c === 'string' ? c : c.name;
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const normalizedList = categories.map((c) => ({
        id: typeof c === 'string' ? c : c.id,
        name: getCatName(c),
    }));

    const filtered = normalizedList.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    const trimmedSearch = searchTerm.trim();
    const hasExactMatch = normalizedList.some(
        (c) => c.name.toLowerCase() === trimmedSearch.toLowerCase()
    );

    const handleSelect = (categoryName: string) => {
        onChange(categoryName);
        setIsOpen(false);
    };

    const handleCreateNew = async () => {
        if (!trimmedSearch) return;

        setIsCreating(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/backoffice/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ name: trimmedSearch }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.category && onCategoryCreated) {
                    onCategoryCreated(data.category);
                }
            }
            // Select the newly created category
            onChange(trimmedSearch);
            setIsOpen(false);
        } catch {
            // Fallback: select locally anyway, backend firstOrCreate will persist it
            onChange(trimmedSearch);
            setIsOpen(false);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3.5 py-2 rounded-xl border text-left flex items-center justify-between text-xs transition active:scale-99 ${
                    isOpen
                        ? 'border-slate-900 ring-1 ring-slate-900 bg-white'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className={`truncate ${value ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                        {value || 'Pilih atau buat kategori...'}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (!hasExactMatch && trimmedSearch) {
                                            handleCreateNew();
                                        } else if (filtered.length > 0) {
                                            handleSelect(filtered[0].name);
                                        }
                                    }
                                }}
                                placeholder="Cari atau ketik kategori baru..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-slate-900"
                            />
                        </div>
                    </div>

                    {/* Option List */}
                    <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                        {/* Option: Create New Category */}
                        {trimmedSearch && !hasExactMatch && (
                            <button
                                type="button"
                                onClick={handleCreateNew}
                                disabled={isCreating}
                                className="w-full p-2.5 rounded-lg text-left text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-between transition"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {isCreating ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                                    ) : (
                                        <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                    <span className="truncate">
                                        Buat kategori <strong>"{trimmedSearch}"</strong>
                                    </span>
                                </div>
                                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                                    Baru
                                </span>
                            </button>
                        )}

                        {filtered.length === 0 && !trimmedSearch ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                                Belum ada kategori tersedia
                            </div>
                        ) : filtered.length === 0 && trimmedSearch && hasExactMatch ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                                Tidak ada kategori cocok
                            </div>
                        ) : (
                            filtered.map((cat) => {
                                const isSelected = value.toLowerCase() === cat.name.toLowerCase();
                                return (
                                    <button
                                        key={cat.id || cat.name}
                                        type="button"
                                        onClick={() => handleSelect(cat.name)}
                                        className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between transition ${
                                            isSelected
                                                ? 'bg-slate-900 text-white font-bold'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
