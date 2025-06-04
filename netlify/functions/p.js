export async function handler(event, context) {
    // 请将此处修改为你允许的域名，例如 'https://example.com'
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://api.lolicon.app',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, User-Agent'
    };

    const requestOrigin = event.headers?.origin || event.headers?.Origin;
    // 请将此处修改为你允许的域名，例如 'https://example.com'
    if (requestOrigin && requestOrigin!== 'https://api.lolicon.app') {
        return {
            statusCode: 403,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'Forbidden - Origin not allowed'
        };
    }

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }

    if (event.httpMethod!== 'GET') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: 'Method not allowed'
        };
    }

    const targetUrl = event.queryStringParameters.url;
    if (!targetUrl) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: 'Missing URL parameter'
        };
    }

    try {
        const headers = {
            'User-Agent': event.headers['user-agent'] || ''
        };
        const response = await fetch(targetUrl, { headers });
        const data = await response.text();
        return {
            statusCode: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': response.headers.get('Content-Type') || 'text/plain'
            },
            body: data
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message })
        };
    }
}