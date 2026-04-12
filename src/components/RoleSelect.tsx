"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/app/dashboard/team/actions";

interface RoleSelectProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export default function RoleSelect({ userId, currentRole, isSelf }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition();

  const roles = ["Yönetici", "Yetkili", "Mühendis", "Depocu", "Personel"];

  return (
    <select
      value={currentRole}
      disabled={isPending || isSelf}
      onChange={(e) => {
        const newRole = e.target.value;
        startTransition(async () => {
          await updateUserRole(userId, newRole);
        });
      }}
      className={`bg-slate-800 border ${
        isPending ? "border-violet-500/50 opacity-50" : "border-slate-700"
      } text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 outline-none focus:border-violet-500 transition-all cursor-pointer disabled:cursor-not-allowed`}
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
