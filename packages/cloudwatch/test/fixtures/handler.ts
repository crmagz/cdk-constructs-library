/**
 * Sample Lambda handler for testing.
 */
export const handler = async (event: unknown) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    return {
        statusCode: 200,
        body: JSON.stringify({message: 'OK'}),
    };
};
