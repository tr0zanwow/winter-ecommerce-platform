import boto3
import json

client = boto3.client('logs', region_name='us-east-1')
try:
    streams = client.describe_log_streams(
        logGroupName='/aws/lambda/WinterServerlessStack-CatalogLambda6BE52E15-dDD5G15lfsJO',
        orderBy='LastEventTime',
        descending=True,
        limit=1
    )
    if not streams['logStreams']:
        print("No log streams found.")
    else:
        stream_name = streams['logStreams'][0]['logStreamName']
        print("Fetching logs for stream:", stream_name)
        response = client.get_log_events(
            logGroupName='/aws/lambda/WinterServerlessStack-CatalogLambda6BE52E15-dDD5G15lfsJO',
            logStreamName=stream_name,
            limit=100
        )
        messages = [e['message'] for e in response['events']]
        with open('catalog_logs2.json', 'w', encoding='utf-8') as f:
            json.dump(messages, f, indent=2)
        print("Success")
except Exception as e:
    print("Error:", e)
