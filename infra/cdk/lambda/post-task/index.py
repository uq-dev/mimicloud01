import json
import os
import uuid
import boto3

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    item = {
        'taskId': str(uuid.uuid4()),
        'title': body.get('title', ''),
        'done': False,
    }
    table.put_item(Item=item)

    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(item)
    }