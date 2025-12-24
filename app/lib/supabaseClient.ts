import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
console.log(
  "SUPABASE URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);
console.log(
  "SUPABASE KEY PREFIX:",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15)
);


// sb_publishable_8NWHWvy9dR-sx_cD16nzhg_4CERgPPV