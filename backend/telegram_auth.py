import hashlib
import hmac
import time
from typing import Dict, Optional
from fastapi import HTTPException, status


def verify_telegram_auth(auth_data: Dict[str, str], bot_token: str) -> bool:
    """
    Проверяет подлинность данных от Telegram WebApp.
    
    Telegram отправляет данные в формате:
    - query_id=<query_id>
    - user=<user_json>
    - auth_date=<auth_date>
    - hash=<hash>
    
    Алгоритм проверки:
    1. Собрать все параметры кроме hash
    2. Отсортировать по алфавиту
    3. Сформировать строку в формате key=value
    4. Создать HMAC-SHA256 с bot_token (используя WebAppData как ключ)
    5. Сравнить с полученным hash
    """
    
    # Получаем hash из данных
    received_hash = auth_data.get('hash')
    auth_date = auth_data.get('auth_date')
    
    if not received_hash or not auth_date:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing hash or auth_date in auth data"
        )
    
    # Проверка актуальности данных (не старше 24 часов)
    try:
        if time.time() - int(auth_date) > 86400:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Auth data is outdated"
            )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid auth_date format"
        )
    
    # Создаем словарь данных без hash
    data_check = {k: v for k, v in auth_data.items() if k != 'hash'}
    
    # Сортируем ключи по алфавиту
    data_check_sorted = sorted(data_check.items())
    
    # Формируем строку для проверки
    data_check_string = '\n'.join([f"{k}={v}" for k, v in data_check_sorted])
    
    # 1. Сначала получаем секретный ключ (HMAC-SHA256 от bot_token с ключом "WebAppData")
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode(),
        hashlib.sha256
    ).digest()
    
    # 2. Затем вычисляем финальный HMAC-SHA256 от data_check_string
    hash_calc = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Сравниваем хеши (защита от timing attacks)
    return hmac.compare_digest(hash_calc, received_hash)


def parse_telegram_user(user_data: str) -> Dict:
    """
    Парсит JSON строку с данными пользователя из Telegram.
    """
    import json
    try:
        return json.loads(user_data)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user data format"
        )


def validate_and_extract_user(auth_data: Dict[str, str], bot_token: str) -> Dict:
    """
    Полная валидация и извлечение данных пользователя.
    
    Возвращает словарь с полями:
    - telegram_id: int
    - first_name: str
    - last_name: Optional[str]
    - username: Optional[str]
    """
    
    # Проверяем подпись
    if not verify_telegram_auth(auth_data, bot_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram auth signature"
        )
    
    # Извлекаем данные пользователя
    user_str = auth_data.get('user')
    if not user_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing user data"
        )
    
    user = parse_telegram_user(user_str)
    
    # Проверяем обязательные поля
    if 'id' not in user or 'first_name' not in user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required user fields"
        )
    
    return {
        'telegram_id': user['id'],
        'first_name': user['first_name'],
        'last_name': user.get('last_name'),
        'username': user.get('username')
    }