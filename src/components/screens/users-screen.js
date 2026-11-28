import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { UsersTable } from "../data-tables";
import { InputField, PasswordField, TableSearch } from "../form-controls";
import { itemVariants } from "../motion-presets";
import { MIN_PASSWORD_LENGTH } from "../../lib/user-validation";

export function UsersScreen({
  user,
  createUser,
  busy,
  showCreatePassword,
  setShowCreatePassword,
  userEditor,
  saveCashier,
  showEditorPassword,
  setShowEditorPassword,
  setUserEditor,
  filtered,
  query,
  setQuery,
  openCashierEditor,
  toggleCashier,
  deleteCashier,
}) {
  return (
    <div className="space-y-6">
      {/* Create Cashier Form */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Tambah Akun Kasir Baru</h2>
          <p className="text-xs text-slate-500">
            Buat akun login kasir untuk melayani transaksi di kasir Apotek Risa.
          </p>
        </div>
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField name="nama" label="Nama Lengkap Kasir" required />
            <InputField
              name="username"
              label="Username"
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9._-]+"
              required
            />
            <PasswordField
              name="password"
              label={`Kata Sandi (min. ${MIN_PASSWORD_LENGTH} karakter)`}
              minLength={MIN_PASSWORD_LENGTH}
              required
              show={showCreatePassword}
              onToggle={() => setShowCreatePassword((v) => !v)}
            />
            <input type="hidden" name="role" value="KASIR" />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Buat Akun Kasir</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* User Editor Modal */}
      {userEditor && (
        <motion.div
          variants={itemVariants}
          className="bg-purple-50/70 border border-purple-200 rounded-2xl p-6 shadow-xs space-y-4"
        >
          <div className="border-b border-purple-100 pb-3">
            <h2 className="text-sm font-bold text-purple-900">
              {userEditor.mode === "edit"
                ? "Edit Profil Kasir"
                : userEditor.mode === "owner-name"
                ? "Ubah Nama Pemilik"
                : "Ubah Kata Sandi"}
            </h2>
          </div>
          <form onSubmit={saveCashier} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userEditor.mode === "edit" ? (
                <>
                  <InputField name="nama" label="Nama Lengkap" defaultValue={userEditor.nama} required />
                  <InputField
                    name="username"
                    label="Username"
                    defaultValue={userEditor.username}
                    minLength={3}
                    maxLength={50}
                    pattern="[a-zA-Z0-9._-]+"
                    required
                  />
                </>
              ) : userEditor.mode === "owner-name" ? (
                <InputField name="nama" label="Nama Pemilik" defaultValue={userEditor.nama} required />
              ) : (
                <PasswordField
                  name="password"
                  label={`Kata Sandi Baru (min. ${MIN_PASSWORD_LENGTH} karakter)`}
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                  show={showEditorPassword}
                  onToggle={() => setShowEditorPassword((v) => !v)}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserEditor(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 bg-[#5936A8] hover:bg-[#472985] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar Pengguna Sistem</h2>
            <p className="text-xs text-slate-500">{filtered.length} pengguna terdaftar.</p>
          </div>
          <div className="w-full sm:w-60">
            <TableSearch value={query} onChange={setQuery} placeholder="Cari nama atau username..." />
          </div>
        </div>
        <UsersTable
          users={filtered}
          ownerId={user.id}
          onEdit={openCashierEditor}
          onToggle={toggleCashier}
          onDelete={deleteCashier}
        />
      </motion.div>
    </div>
  );
}
