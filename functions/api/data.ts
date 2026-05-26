interface Env {
  PAYROLL_DATA: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const data = await env.PAYROLL_DATA.get('payroll_data');
  return new Response(
    data || JSON.stringify({ projects: [], workers: [], payrollEntries: [] }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  await env.PAYROLL_DATA.put('payroll_data', body);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
