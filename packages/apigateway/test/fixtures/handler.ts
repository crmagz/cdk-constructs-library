export const handler = async (event: unknown): Promise<{statusCode: number; body: string}> => {
    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Hello from API Gateway Lambda!', event}),
    };
};
