import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    query_params = event.get('queryStringParameters') or {}
    status = query_params.get('status')

    if status:
        # GSI1を使用してステータス別に取得（期限順）
        result = table.query(
            IndexName='GSI_StatusDueDate',
            KeyConditionExpression=Key('userId').eq(user_id) & Key('status_dueDate').begins_with(f"{status}#")
        )
    else:
        # デフォルト：ユーザーの全タスクを取得
        result = table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )

    items = result.get('Items', [])
    
    # フロントエンド向けにtaskIdをidとして変換
    for item in items:
        item['id'] = item.pop('taskId')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(items)
    }
