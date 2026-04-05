import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    result = table.scan()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(result['Items'])
    }