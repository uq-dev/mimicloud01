import json
import os
import boto3
from boto3.dynamodb.conditions import Attr

dynamo = boto3.resource('dynamodb')

def handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    table = dynamo.Table(os.environ['TASKS_TABLE_NAME'])

    query_params = event.get('queryStringParameters') or {}
    status = query_params.get('status')
    location = query_params.get('location')

    filter_expression = Attr('userId').eq(user_id)

    if status:
        # テーブルが taskId 単一キーのため、userId での取得は scan + FilterExpression で対応
        filter_expression = filter_expression & Attr('status_dueDate').begins_with(f"{status}#")

    if location:
        filter_expression = filter_expression & Attr('location').eq(location)

    result = table.scan(
        FilterExpression=filter_expression
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
