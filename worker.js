export default {
  async fetch(request, env) {
    try {
      const response = await env.ASSETS.fetch(request);
      // If asset exists and is not 404, return it
      if (response.status !== 404) {
        return response;
      }
    } catch (err) {
      // Fall through to SPA fallback
    }

    // SPA Fallback: Serve index.html for all client-side routes
    const url = new URL(request.url);
    const indexRequest = new Request(new URL('/index.html', url.origin), request);
    return env.ASSETS.fetch(indexRequest);
  },
};
