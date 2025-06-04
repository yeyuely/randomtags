export async function handler(event) {
    // 1. 允许的域名列表（扩展列表）
    const allowedDomains = [
        'konachan.com',
        'pic.re',
        'cdn.pic.re',  // 添加这个
        'i.pixiv.cat',
        'i.pximg.net',
        'venerable-moonbeam-0ba3bf.netlify.app' // 允许本地测试
    ];
    
    // 2. CORS 响应头配置
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
        'Access-Control-Max-Age': '86400' // 24小时缓存
    };
    
    // 3. 处理 OPTIONS 预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }
    
    // 4. 只允许 GET 请求
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    // 5. 获取并验证 URL 参数
    const targetUrl = event.queryStringParameters.url;
    if (!targetUrl) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing URL parameter' })
        };
    }
    
    // 6. 解码 URL 并添加协议（如果缺少）
    let decodedUrl;
    try {
        decodedUrl = decodeURIComponent(targetUrl);
        
        // 如果URL没有协议，添加https://
        if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
            decodedUrl = 'https://' + decodedUrl;
        }
    } catch (e) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Invalid URL encoding',
                details: e.message 
            })
        };
    }
    
    console.log('Processing URL:', decodedUrl); // 添加日志
    
    // 7. 验证请求的域名是否在允许列表中
    try {
        const urlObj = new URL(decodedUrl);
        const hostname = urlObj.hostname;
        
        const isAllowedDomain = allowedDomains.some(domain => 
            hostname === domain || hostname.endsWith(`.${domain}`)
        );
        
        if (!isAllowedDomain) {
            console.log('Domain not allowed:', hostname);
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Domain not allowed',
                    domain: hostname
                })
            };
        }
    } catch (e) {
        console.error('URL parsing error:', e);
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Invalid URL format',
                details: e.message 
            })
        };
    }
    
    try {
        // 8. 设置必要的请求头
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.pixiv.net/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        };
        
        console.log('Fetching image from:', decodedUrl);
        
        // 9. 获取图片（增加超时设置）
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(decodedUrl, { 
            headers,
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.error('Image fetch failed:', response.status, response.statusText);
            return {
                statusCode: response.status,
                headers: corsHeaders,
                body: `Failed to fetch image: ${response.statusText}`
            };
        }
        
        // 10. 获取图片数据
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 11. 获取内容类型
        let contentType = response.headers.get('content-type') || 'image/jpeg';
        
        // 修正无效的内容类型
        if (!contentType.startsWith('image/')) {
            // 尝试从URL扩展名推断类型
            const extension = decodedUrl.split('.').pop()?.toLowerCase();
            const mimeTypes = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp'
            };
            
            contentType = mimeTypes[extension] || 'image/jpeg';
        }
        
        console.log('Image fetched successfully. Content-Type:', contentType);
        
        // 12. 返回图片响应
        return {
            statusCode: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400' // 缓存24小时
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                message: error.message,
                url: decodedUrl
            })
        };
    }
}