import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { generateSlug } from '@/lib/utils';
import type { Business } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's first business
  let { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Create a default business if none exists
  if (!business) {
    const defaultName = 'My Business';
    const slug = generateSlug(defaultName);
    const { data: newBusiness, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: defaultName,
        slug,
      })
      .select()
      .maybeSingle();

    if (error || !newBusiness) {
      console.warn('Could not persist default business to DB, using local fallback:', error);
      business = {
        id: 'default',
        owner_id: user.id,
        name: defaultName,
        slug,
        description: 'Customer feedback portal',
        website: null,
        industry: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      business = newBusiness;
    }
  }

  return (
    <DashboardShell
      user={{ id: user.id, email: user.email || 'user@example.com' }}
      business={business as Business}
    >
      {children}
    </DashboardShell>
  );
}
