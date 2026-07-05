import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

// Already signed in? Skip the form and go straight to the dashboard. This used
// to be handled by the /admin proxy (middleware), which was removed because
// Next 16's Node-runtime Proxy isn't supported by the Cloudflare adapter.
export default async function LoginPage() {
  const profile = await getSessionProfile();
  if (profile) redirect("/admin");

  return <LoginForm />;
}
