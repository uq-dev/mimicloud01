import json
import os
import boto3

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    task_id = event['pathParameters']['taskId']
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    table.delete_item(Key={'userId': user_id, 'taskId': task_id})

    return {
        'statusCode': 204,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': ''
    }
