export interface Env {
  PAYROLL_DATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (url.pathname === '/api/data') {
      if (request.method === 'GET') {
        const data = await env.PAYROLL_DATA.get('payroll_data');
        return new Response(
          data || JSON.stringify({ projects: [], workers: [], payrollEntries: [] }),
          { headers }
        );
      }
      if (request.method === 'POST') {
        const body = await request.text();
        await env.PAYROLL_DATA.put('payroll_data', body);
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }
    return new Response('Not found', { status: 404 });
  },
};
