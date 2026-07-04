<?php

namespace App\Policies\Auto;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Auto-generated policy for Pembelian
 * Mirrors Delphi CekOtoritasMenu flags.
 */
class PembelianPolicy
{
    use HandlesAuthorization;

    public function before(User $user) { if ($user->is_admin) return true; }

    public function viewAny(User $user) { return true; }
    public function view(User $user, $model) { return true; }
    public function create(User $user) { return $user->hasMenuPermission('Pembelian', 'ISTAMBAH'); }
    public function update(User $user, $model) { return $user->hasMenuPermission('Pembelian', 'ISKOREKSI'); }
    public function delete(User $user, $model) { return $user->hasMenuPermission('Pembelian', 'ISHAPUS'); }
    public function print(User $user, $model) { return $user->hasMenuPermission('Pembelian', 'ISCETAK'); }
    public function export(User $user, $model) { return $user->hasMenuPermission('Pembelian', 'ISEXPORT'); }
    public function post(User $user, $model) { return $user->hasMenuPermission('Pembelian', 'ISPOSTING'); }
    public function cancel(User $user, $model) { return $user->hasMenuPermission('Pembelian', 'ISPEMBATALAN'); }
}
