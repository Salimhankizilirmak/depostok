import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="flex flex-col items-center gap-6">
        <SignUp />
        <p className="text-sm font-medium text-slate-400 bg-slate-900 px-4 py-2 border border-slate-800 rounded-lg">
          Sisteme size verilen <strong className="text-white">Kullanıcı Adı</strong> ve <strong className="text-white">Şifre</strong> ile kayıt olabilirsiniz.
        </p>
      </div>
    </div>
  );
}
