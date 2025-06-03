const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. 从查询参数获取图片URL
  const imageUrl = decodeURIComponent(event.queryStringParameters.url);
  
  // 2. 安全验证 - 只允许 Konachan 域名
  if (!imageUrl.startsWith('https://konachan.com')) {
    return {
      statusCode: 403,
      body: 'Forbidden: Only Konachan images are allowed'
    };
  }

  try {
    // 3. 获取原始图片
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // 4. 获取图片数据
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 5. 返回图片数据
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type'),
        'Cache-Control': 'public, max-age=86400' // 缓存1天
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};