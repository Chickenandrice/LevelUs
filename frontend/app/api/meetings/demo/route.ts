import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Next.js API route: Proxying to backend...');

    // Get the form data from the request
    const formData = await request.formData();

    // Forward to backend
    const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000/meetings/demo" : "http://levelus-backend:8000/meetings/demo";

    console.log('📤 Forwarding to backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - let fetch handle it for FormData
    });

    console.log('📥 Backend response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Get response text
    const text = await response.text();
    console.log('Response text length:', text.length);

    // Return the response with proper headers
    return new NextResponse(text, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error: any) {
    console.error('❌ Next.js API route error:', error);
    return NextResponse.json(
      {
        error: 'Proxy error',
        message: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}
