import json
import os
import boto3

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    task_id = event['pathParameters']['taskId']
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    table.delete_item(Key={'taskId': task_id})

    return {
        'statusCode': 204,
        'headers': {'Content-Type': 'application/json'},
        'body': ''
    }