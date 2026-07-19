export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  
  // Extract the target path after /paddleocr-api
  const targetPath = url.pathname.replace(/^\/paddleocr-api/, '');
  const targetUrl = `https://paddleocr.aistudio-app.com${targetPath}${url.search}`;

  // Clone request headers
  const headers = new Headers(context.request.headers);
  headers.delete("host"); // Avoid target host mismatch errors

  try {
    const response = await fetch(targetUrl, {
      method: context.request.method,
      headers: headers,
      body: context.request.method !== "GET" && context.request.method !== "HEAD" 
        ? await context.request.blob() 
        : null,
      redirect: "follow"
    });

    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
