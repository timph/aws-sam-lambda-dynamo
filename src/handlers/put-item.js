// Create clients and set shared const values outside of the handler.
const tableName = process.env.SAMPLE_TABLE;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');

// Get the DynamoDB table name from environment variables
const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;
const docClient = new dynamodb.DocumentClient({
    endpoint: DYNAMO_ENDPOINT,
  });

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const isArrayBody = Array.isArray(body);

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    let response = {};

    try {
        const params = {
            TableName : tableName,
        };
 
        if (isArrayBody) {
            console.log('Put in array of items', body);
            const putItems = body.map(async ({id, name}) => {
                return docClient.put({...params, Item: { id, name }}).promise();
            });
            await Promise.allSettled(putItems);
        } else {
            console.log('Put in body', body);
            const { id, name } = body;
            const result = await docClient.put({...params, Item: { id, name }}).promise();
        }
    
        response = {
            statusCode: 200,
            body: JSON.stringify(body)
        };
    } catch (ResourceNotFoundException) {
        response = {
            statusCode: 404,
            body: "Unable to call DynamoDB. Table resource not found."
        };
    }

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
