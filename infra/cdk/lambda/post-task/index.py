import json
import os
import uuid
import boto3
from datetime import datetime

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    # CognitoからユーザーIDを取得
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    body = json.loads(event.get('body', '{}'))
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + 'Z'
    
    status = body.get('status', 'open')
    due_date = body.get('dueDate', '') # YYYY-MM-DD
    
    # 属性の構築
    item = {
        'userId': user_id,
        'taskId': task_id,
        'title': body.get('title', ''),
        'memo': body.get('memo', ''),
        'status': status,
        'location': body.get('location', ''),
        'photos': body.get('photos', []),
        'status_dueDate': f"{status}#{due_date}",
        'createdAt': now,
        'updatedAt': now,
    }

    if due_date:
        item['dueDate'] = due_date

    table.put_item(Item=item)

    # フロントエンド向けにtaskIdをidとして返す
    response_body = {**item}
    response_body['id'] = response_body.pop('taskId')

    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }
