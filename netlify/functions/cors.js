exports.handler = async (event) => {
  // 允许的域名列表（安全白名单）
  const allowedOrigins = [
    "https://pic.re"
  ];
  
  const origin = event.headers.origin;
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // 动态设置允许的 Origin
  const headers = {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };

  // 处理预检请求
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" }; // 204 No Content
  }

  // 处理真实请求
  return {
    statusCode: 200,
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ data: "Authenticated CORS success!" })
  };
};