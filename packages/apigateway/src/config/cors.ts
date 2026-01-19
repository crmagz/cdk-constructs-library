import {Cors, CorsOptions} from 'aws-cdk-lib/aws-apigateway';

/**
 * Default CORS preflight options for REST APIs.
 *
 * @remarks
 * Provides permissive CORS configuration suitable for most API use cases.
 * Allows all origins, methods, and common headers including authentication.
 *
 * For production APIs with stricter requirements, create a custom CorsOptions
 * object with specific allowed origins.
 *
 * @public
 */
export const DEFAULT_CORS_PREFLIGHT_OPTIONS: CorsOptions = {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Date',
        'X-Amz-Security-Token',
        'X-Amz-User-Agent',
        'X-Requested-With',
        'Accept',
        'Cache-Control',
    ],
    allowCredentials: true,
    maxAge: undefined,
};

/**
 * Creates CORS options with specific allowed origins.
 *
 * @remarks
 * Use this helper to create CORS configuration that restricts
 * which origins can access your API. More secure than allowing
 * all origins.
 *
 * @param allowedOrigins - List of allowed origin URLs
 * @returns CorsOptions configured for the specified origins
 *
 * @example
 * ```typescript
 * const cors = createCorsOptions([
 *   'https://app.example.com',
 *   'https://staging.example.com',
 * ]);
 * ```
 *
 * @public
 */
export const createCorsOptions = (allowedOrigins: string[]): CorsOptions => {
    return {
        allowOrigins: allowedOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
            'Content-Type',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Date',
            'X-Amz-Security-Token',
            'X-Amz-User-Agent',
            'X-Requested-With',
            'Accept',
            'Cache-Control',
        ],
        allowCredentials: true,
    };
};
