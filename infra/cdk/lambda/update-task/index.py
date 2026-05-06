import json
import os
import boto3
from datetime import datetime

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    task_id = event['pathParameters']['taskId']
    
    body = json.loads(event.get('body', '{}'))
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    # 現在のアイテムを取得して更新用に保持
    current_item = table.get_item(Key={'userId': user_id, 'taskId': task_id}).get('Item')
    if not current_item:
        return {
            'statusCode': 404, 
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Task not found'})
        }

    now = datetime.utcnow().isoformat() + 'Z'
    
    # 更新対象の属性を抽出（送られてきたもののみ更新、それ以外は現在値を維持）
    title = body.get('title', current_item.get('title'))
    memo = body.get('memo', current_item.get('memo'))
    due_date = body.get('dueDate', current_item.get('dueDate'))
    status = body.get('status', current_item.get('status'))
    location = body.get('location', current_item.get('location'))
    photos = body.get('photos', current_item.get('photos'))

    update_fields = {
        'title': title,
        'memo': memo,
        'dueDate': due_date,
        'status': status,
        'location': location,
        'photos': photos,
        'status_dueDate': f"{status}#{due_date}",
        'updatedAt': now,
    }

    # UpdateExpressionの構築
    update_expr = "SET " + ", ".join([f"#{k} = :{k}" for k in update_fields.keys()])
    attr_names = {f"#{k}": k for k in update_fields.keys()}
    attr_values = {f":{k}": v for k, v in update_fields.items()}

    table.update_item(
        Key={'userId': user_id, 'taskId': task_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=attr_names,
        ExpressionAttributeValues=attr_values
    )

    response_body = {**current_item, **update_fields}
    response_body['id'] = response_body.pop('taskId')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }
