"use client";

import { useTransition } from "react";
import RoleSelect from "./RoleSelect";
import { useTranslations } from "next-intl";

interface TeamUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface TeamManagementProps {
  companyId: string;
  users: TeamUser[];
  currentUserEmail: string | null;
  addMemberAction: (companyId: string, formData: FormData) => Promise<void>;
  updateRoleAction: (companyId: string, userId: string, newRole: string) => Promise<void>;
  deleteMemberAction?: (companyId: string, userId: string) => Promise<void>;
  isAdminView?: boolean;
}

export default function TeamManagement({
  companyId,
  users,
  currentUserEmail,
  addMemberAction,
  updateRoleAction,
  deleteMemberAction,
  isAdminView = false,
}: TeamManagementProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Team");

  const handleAddMember = async (formData: FormData) => {
    startTransition(async () => {
       await addMemberAction(companyId, formData);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Form Bölümü */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30 sticky top-24">
          <h2 className="text-white font-semibold text-sm mb-6 flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg ${isAdminView ? "bg-emerald-500/20 border-emerald-500/30" : "bg-violet-500/20 border-violet-500/30"} border flex items-center justify-center`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isAdminView ? "#34d399" : "#a78bfa"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            </div>
            {t("addPerson")}
          </h2>
          <form action={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("personName")}</label>
              <input
                name="name"
                type="text"
                required
                placeholder={t("namePlaceholder")}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("username")}</label>
              <input
                name="username"
                type="text"
                required
                placeholder={t("username")}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("password")}</label>
              <input
                name="password"
                type="password"
                required
                placeholder="******"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("role")}</label>
              <select
                name="role"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-all cursor-pointer"
              >
                <option value="Personel">Personel</option>
                <option value="Depocu">Depocu</option>
                <option value="Mühendis">Mühendis</option>
                <option value="Yetkili">Yetkili</option>
                <option value="Yönetici">Yönetici</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className={`w-full bg-gradient-to-r ${isAdminView ? "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500" : "from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"} text-white font-semibold text-sm rounded-xl py-2.5 transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98] disabled:opacity-50`}
            >
              {isPending ? t("adding") : t("add")}
            </button>
          </form>
        </div>
      </div>

      {/* Liste Bölümü */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">{t("listTitle")}</h2>
            <span className="text-xs text-slate-500">{users.length} {t("userCount")}</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {users.map((uye) => (
                <div key={uye.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{uye.email.split('@')[0]}</p>
                      <div className="mt-1">
                        <RoleSelect
                          userId={uye.id}
                          currentRole={uye.role}
                          isSelf={uye.email === currentUserEmail}
                          onUpdate={(nr) => updateRoleAction(companyId, uye.id, nr)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-400 text-[10px] tabular-nums">
                        {new Date(uye.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                      <span className="text-slate-600 text-[10px]">{t("joined")}</span>
                    </div>
                    
                    {isAdminView && deleteMemberAction && (
                      <button
                        onClick={() => {
                          if (confirm(t("deleteConfirm"))) {
                            startTransition(() => deleteMemberAction(companyId, uye.id));
                          }
                        }}
                        className="text-slate-500 hover:text-red-400 p-2 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
