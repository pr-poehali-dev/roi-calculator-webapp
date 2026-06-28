import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''
    Business: Сохраняет заявки калькулятора ROI автоматизации в базу данных.
    Args: event - dict с httpMethod, body (имя, телефон, email, данные расчёта)
          context - объект с request_id
    Returns: HTTP-ответ со статусом сохранения заявки
    '''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    body = json.loads(event.get('body') or '{}')

    name = str(body.get('name', '')).strip()
    phone = str(body.get('phone', '')).strip()
    email = str(body.get('email', '')).strip()

    if not name or not phone or not email:
        return {
            'statusCode': 400,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Заполните имя, телефон и email'}),
        }

    industry = str(body.get('industry', ''))[:64]
    employees = str(body.get('employees', ''))[:32]
    salary = int(body.get('salary') or 0)
    routine_hours = float(body.get('routineHours') or 0)
    savings = int(body.get('savings') or 0)

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO roi_leads (name, phone, email, industry, employees, salary, routine_hours, savings) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (name, phone, email, industry, employees, salary, routine_hours, savings),
    )
    lead_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors_headers, 'Content-Type': 'application/json'},
        'body': json.dumps({'success': True, 'id': lead_id}),
    }
