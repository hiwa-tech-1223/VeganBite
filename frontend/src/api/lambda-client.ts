import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const BACKEND_FUNCTION_NAME = process.env.BACKEND_FUNCTION_NAME || 'veganbite-dev-backend';
const AWS_REGION = process.env.AWS_REGION_NAME || process.env.AWS_REGION || 'ap-northeast-1';

const lambdaClient = new LambdaClient({ region: AWS_REGION });

// Go LambdaをAWS SDK経由で呼び出す（IAM認証を自動処理）
export async function invokeBackendApi(
  method: string,
  path: string,
  options?: {
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  // API Gateway V2形式のイベントを組み立てる
  const event = {
    version: '2.0',
    requestContext: {
      http: {
        method,
        path,
      },
    },
    rawPath: path,
    headers: options?.headers || {},
    body: options?.body || null,
    isBase64Encoded: false,
  };

  const command = new InvokeCommand({
    FunctionName: BACKEND_FUNCTION_NAME,
    Payload: JSON.stringify(event),
  });

  const result = await lambdaClient.send(command);
  const responsePayload = JSON.parse(new TextDecoder().decode(result.Payload));

  return new Response(responsePayload.body, {
    status: responsePayload.statusCode,
    headers: responsePayload.headers,
  });
}
