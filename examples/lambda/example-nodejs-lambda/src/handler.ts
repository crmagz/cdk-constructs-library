import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';

/**
 * Example Lambda handler demonstrating API Gateway proxy integration.
 *
 * This handler:
 * - Logs incoming event and context
 * - Returns a JSON response with request details
 * - Includes proper CORS headers
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));

    const response: APIGatewayProxyResult = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: JSON.stringify({
            message: 'Hello from Lambda!',
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId,
            path: event.path,
            method: event.httpMethod,
            queryParams: event.queryStringParameters,
        }),
    };

    return response;
};
