"use client";
import { useTransition } from "react";
import { updateUserRole } from "@/app/dashboard/team/actions";

interface RoleSelectProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
  /** Opsiyonel: Admin panelinde farklı aksiyon tetiklemek için */
  onUpdate?: (newRole: string) => Promise<void>;
}

export default function RoleSelect({ userId, currentRole, isSelf, onUpdate }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition();

  const roles = ["Yönetici", "Yetkili", "Mühendis", "Depocu", "Personel"];

  const handleChange = (newRole: string) => {
    startTransition(async () => {
      if (onUpdate) {
        await onUpdate(newRole);
      } else {
        await updateUserRole(userId, newRole);
      }
    });
  };

  return (
    <select
      value={currentRole}
      disabled={isPending || isSelf}
      onChange={(e) => handleChange(e.target.value)}
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
