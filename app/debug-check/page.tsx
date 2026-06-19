import { createAdminClient } from '@/lib/supabase/admin';

export default async function DebugCheckPage() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null
  };

  let databaseCheck: any = null;

  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    databaseCheck = {
      success: !error,
      profiles_count: count,
      error: error?.message || null
    };
  } catch (error: any) {
    databaseCheck = {
      success: false,
      error: error?.message || String(error)
    };
  }

  return (
    <main style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Debug Check</h1>
      <pre>{JSON.stringify({ env, databaseCheck }, null, 2)}</pre>
    </main>
  );
}
