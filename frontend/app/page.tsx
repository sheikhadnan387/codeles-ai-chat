import { redirect } from "next/navigation";

// Auth state lives client-side (in-memory access token + httpOnly refresh
// cookie), so the real "am I logged in" check happens in the (dashboard)
// layout once we land on /chat — it redirects to /login when unauthenticated.
export default function RootPage() {
  redirect("/chat");
}
