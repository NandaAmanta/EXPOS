<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosCharge;
use App\Models\PosTax;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxChargeController extends Controller
{
    public function index(): RedirectResponse
    {
        return redirect()->route('backoffice.taxes.index');
    }

    public function indexTaxes(): Response
    {
        $taxes = PosTax::orderBy('is_active', 'desc')->orderBy('name')->get();

        return Inertia::render('backoffice/taxes/index', [
            'taxes' => $taxes,
        ]);
    }

    public function indexCharges(): Response
    {
        $charges = PosCharge::orderBy('is_active', 'desc')->orderBy('name')->get();

        return Inertia::render('backoffice/charges/index', [
            'charges' => $charges,
        ]);
    }

    public function storeTax(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'rate' => 'required|numeric|min:0|max:100',
            'type' => 'required|in:exclusive,inclusive',
            'is_auto_apply' => 'boolean',
            'is_active' => 'boolean',
        ]);

        PosTax::create($validated);

        return redirect()->route('backoffice.taxes.index')
            ->with('success', "Pajak {$validated['name']} berhasil ditambahkan.");
    }

    public function updateTax(Request $request, int $id): RedirectResponse
    {
        $tax = PosTax::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'rate' => 'required|numeric|min:0|max:100',
            'type' => 'required|in:exclusive,inclusive',
            'is_auto_apply' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $tax->update($validated);

        return redirect()->route('backoffice.taxes.index')
            ->with('success', "Pajak {$tax->name} berhasil diperbarui.");
    }

    public function destroyTax(int $id): RedirectResponse
    {
        $tax = PosTax::findOrFail($id);
        $taxName = $tax->name;
        $tax->delete();

        return redirect()->route('backoffice.taxes.index')
            ->with('success', "Pajak {$taxName} berhasil dihapus.");
    }

    public function storeCharge(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:percent,fixed',
            'rate' => 'required|numeric|min:0',
            'is_taxable' => 'boolean',
            'applies_to' => 'required|in:all,dine_in,takeaway,delivery',
            'is_auto_apply' => 'boolean',
            'is_active' => 'boolean',
        ]);

        PosCharge::create($validated);

        return redirect()->route('backoffice.charges.index')
            ->with('success', "Biaya tambahan {$validated['name']} berhasil ditambahkan.");
    }

    public function updateCharge(Request $request, int $id): RedirectResponse
    {
        $charge = PosCharge::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:percent,fixed',
            'rate' => 'required|numeric|min:0',
            'is_taxable' => 'boolean',
            'applies_to' => 'required|in:all,dine_in,takeaway,delivery',
            'is_auto_apply' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $charge->update($validated);

        return redirect()->route('backoffice.charges.index')
            ->with('success', "Biaya tambahan {$charge->name} berhasil diperbarui.");
    }

    public function destroyCharge(int $id): RedirectResponse
    {
        $charge = PosCharge::findOrFail($id);
        $chargeName = $charge->name;
        $charge->delete();

        return redirect()->route('backoffice.charges.index')
            ->with('success', "Biaya tambahan {$chargeName} berhasil dihapus.");
    }
}
