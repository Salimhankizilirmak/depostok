import { redirect } from "next/navigation";

// Bu sayfa, middleware'in herhangi bir nedenle (/), (/admin), (/dashboard) 
// gibi kök rotaları yakalayamadığı durumlarda devreye girerek
// varsayılan dil olan /tr'ye yönlendirme yapar.
export default function RootPage() {
  redirect("/tr");
}
