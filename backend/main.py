from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict
import os

import models, schemas, database
from database import engine, get_db
from telegram_auth import validate_and_extract_user
from exceptions import DatabaseError, NotFoundError, ConflictError, ValidationError
from logger import logger


app = FastAPI(title="Telegram MiniApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Sports Events API"}

# Telegram Auth
@app.post("/auth/telegram", response_model=schemas.TelegramUserResponse)
def auth_telegram(auth_data: Dict[str, str], db: Session = Depends(get_db)):
    """
    Аутентификация через Telegram WebApp.
    
    Ожидает данные в формате:
    {
        "query_id": "...",
        "user": "{\"id\":123,\"first_name\":\"John\",...}",
        "auth_date": "1234567890",
        "hash": "..."
    }
    """
    try:
        logger.info(f"Telegram auth attempt for data: {auth_data.get('user', 'unknown')}")
        
        # Получаем токен бота из переменных окружения
        bot_token = os.getenv("BOT_TOKEN")
        if not bot_token:
            logger.error("BOT_TOKEN not configured")
            raise DatabaseError("BOT_TOKEN not configured")
        
        # Валидируем и извлекаем данные пользователя
        user_data = validate_and_extract_user(auth_data, bot_token)
        logger.info(f"Validated user: {user_data['telegram_id']}")
        
        # Проверяем, существует ли пользователь с таким telegram_id
        participant = db.query(models.Participant).filter(
            models.Participant.telegram_id == user_data['telegram_id']
        ).first()
        
        if participant:
            # Обновляем данные пользователя, если они изменились
            participant.first_name = user_data['first_name']
            participant.last_name = user_data['last_name']
            participant.username = user_data['username']
            db.commit()
            db.refresh(participant)
            logger.info(f"Updated existing participant: {participant.id}")
            return participant
        else:
            # Создаем нового пользователя
            new_participant = models.Participant(
                telegram_id=user_data['telegram_id'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                username=user_data['username']
            )
            db.add(new_participant)
            db.commit()
            db.refresh(new_participant)
            logger.info(f"Created new participant: {new_participant.id}")
            return new_participant
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}", exc_info=True)
        raise DatabaseError(f"Authentication error: {str(e)}")

@app.get("/participants/me", response_model=schemas.TelegramUserResponse)
def get_current_user(telegram_id: int, db: Session = Depends(get_db)):
    try:
        participant = db.query(models.Participant).filter(
            models.Participant.telegram_id == telegram_id
        ).first()
        
        if not participant:
            logger.warning(f"User not found: telegram_id={telegram_id}")
            raise NotFoundError("User")
        
        return participant
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch user: {str(e)}")

# Алгоритм распределения по командам
def balance_teams(participants: List[models.Participant], num_teams: int) -> List[List[models.Participant]]:
    # Сортируем игроков по рейтингу (от высокого к низкому)
    sorted_players = sorted(participants, key=lambda x: x.rate, reverse=True)
    
    teams = [[] for _ in range(num_teams)]
    team_ratings = [0.0 for _ in range(num_teams)]
    
    # Используем "змеиный" метод (Snake Draft) для распределения
    for i, player in enumerate(sorted_players):
        # Определяем, в какую команду добавить игрока
        # На каждом шаге ищем команду с наименьшим суммарным рейтингом
        # Или просто идем по кругу (змеиный метод более честный)
        round_num = i // num_teams
        if round_num % 2 == 0:
            idx = i % num_teams
        else:
            idx = num_teams - 1 - (i % num_teams)
            
        teams[idx].append(player)
        team_ratings[idx] += player.rate
        
    return teams

@app.get("/events/{event_id}/balance", response_model=Dict[str, List[schemas.Participant]])
def get_event_balance(event_id: int, db: Session = Depends(get_db)):
    try:
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not event:
            logger.warning(f"Event not found: {event_id}")
            raise NotFoundError("Event")
        
        if not event.participants:
            logger.warning(f"No participants in event: {event_id}")
            raise ValidationError("No participants in this event")
            
        balanced_teams = balance_teams(event.participants, event.format_teams)
        
        result = {}
        for i, team in enumerate(balanced_teams):
            result[f"Team {i+1}"] = team
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error balancing teams: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to balance teams: {str(e)}")

# Locations
@app.post("/locations/", response_model=schemas.Location)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating location: {location.address}")
        db_location = models.Location(**location.dict())
        db.add(db_location)
        db.commit()
        db.refresh(db_location)
        logger.info(f"Created location: {db_location.id}")
        return db_location
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create location: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to create location: {str(e)}")

@app.get("/locations/", response_model=List[schemas.Location])
def read_locations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        locations = db.query(models.Location).offset(skip).limit(limit).all()
        return locations
    except Exception as e:
        logger.error(f"Failed to fetch locations: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch locations: {str(e)}")

@app.get("/locations/{location_id}", response_model=schemas.Location)
def read_location(location_id: int, db: Session = Depends(get_db)):
    try:
        location = db.query(models.Location).filter(models.Location.id == location_id).first()
        if not location:
            raise NotFoundError("Location")
        return location
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch location: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch location: {str(e)}")

@app.put("/locations/{location_id}", response_model=schemas.Location)
def update_location(location_id: int, location: schemas.LocationUpdate, db: Session = Depends(get_db)):
    try:
        db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
        if not db_location:
            raise NotFoundError("Location")
        
        update_data = location.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_location, key, value)
        
        db.commit()
        db.refresh(db_location)
        logger.info(f"Updated location: {location_id}")
        return db_location
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update location: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to update location: {str(e)}")

@app.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    try:
        db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
        if not db_location:
            raise NotFoundError("Location")
        
        db.delete(db_location)
        db.commit()
        logger.info(f"Deleted location: {location_id}")
        return {"message": "Location deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete location: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to delete location: {str(e)}")

# Participants
@app.post("/participants/", response_model=schemas.Participant)
def create_participant(participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating participant: telegram_id={participant.telegram_id}")
        db_participant = models.Participant(**participant.dict())
        db.add(db_participant)
        db.commit()
        db.refresh(db_participant)
        logger.info(f"Created participant: {db_participant.id}")
        return db_participant
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create participant: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to create participant: {str(e)}")

@app.get("/participants/", response_model=List[schemas.Participant])
def read_participants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        participants = db.query(models.Participant).offset(skip).limit(limit).all()
        return participants
    except Exception as e:
        logger.error(f"Failed to fetch participants: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch participants: {str(e)}")

@app.get("/participants/{participant_id}", response_model=schemas.Participant)
def read_participant(participant_id: int, db: Session = Depends(get_db)):
    try:
        participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        if not participant:
            raise NotFoundError("Participant")
        return participant
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch participant: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch participant: {str(e)}")

@app.put("/participants/{participant_id}", response_model=schemas.Participant)
def update_participant(participant_id: int, participant: schemas.ParticipantUpdate, db: Session = Depends(get_db)):
    try:
        db_participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        if not db_participant:
            raise NotFoundError("Participant")
        
        update_data = participant.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_participant, key, value)
        
        db.commit()
        db.refresh(db_participant)
        logger.info(f"Updated participant: {participant_id}")
        return db_participant
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update participant: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to update participant: {str(e)}")

@app.delete("/participants/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    try:
        db_participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        if not db_participant:
            raise NotFoundError("Participant")
        
        db.delete(db_participant)
        db.commit()
        logger.info(f"Deleted participant: {participant_id}")
        return {"message": "Participant deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete participant: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to delete participant: {str(e)}")

# Events
@app.post("/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating event by creator: {event.creator_id}")
        db_event = models.Event(**event.dict())
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        logger.info(f"Created event: {db_event.id}")
        return db_event
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create event: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to create event: {str(e)}")

@app.get("/events/", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        events = db.query(models.Event).offset(skip).limit(limit).all()
        return events
    except Exception as e:
        logger.error(f"Failed to fetch events: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch events: {str(e)}")

@app.get("/events/{event_id}", response_model=schemas.Event)
def read_event(event_id: int, db: Session = Depends(get_db)):
    try:
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not event:
            raise NotFoundError("Event")
        return event
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch event: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to fetch event: {str(e)}")

@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event: schemas.EventUpdate, db: Session = Depends(get_db)):
    try:
        db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not db_event:
            raise NotFoundError("Event")
        
        update_data = event.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_event, key, value)
        
        db.commit()
        db.refresh(db_event)
        logger.info(f"Updated event: {event_id}")
        return db_event
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update event: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to update event: {str(e)}")

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    try:
        db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not db_event:
            raise NotFoundError("Event")
        
        db.delete(db_event)
        db.commit()
        logger.info(f"Deleted event: {event_id}")
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete event: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to delete event: {str(e)}")

# Регистрация участника на мероприятие
@app.post("/events/{event_id}/join/{participant_id}")
def join_event(event_id: int, participant_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Participant {participant_id} joining event {event_id}")
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        
        if not event or not participant:
            logger.warning(f"Event or Participant not found: event={event_id}, participant={participant_id}")
            raise NotFoundError("Event or Participant")
        
        if participant in event.participants:
            logger.warning(f"Participant {participant_id} already joined event {event_id}")
            raise ConflictError("Already joined")
            
        if len(event.participants) >= event.max_participants:
            logger.warning(f"Event {event_id} is full")
            raise ValidationError("Event is full")
            
        event.participants.append(participant)
        db.commit()
        logger.info(f"Participant {participant_id} successfully joined event {event_id}")
        return {"message": "Successfully joined"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to join event: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to join event: {str(e)}")

# Выход участника из мероприятия
@app.delete("/events/{event_id}/join/{participant_id}")
def leave_event(event_id: int, participant_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Participant {participant_id} leaving event {event_id}")
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
        
        if not event or not participant:
            logger.warning(f"Event or Participant not found: event={event_id}, participant={participant_id}")
            raise NotFoundError("Event or Participant")
        
        if participant not in event.participants:
            logger.warning(f"Participant {participant_id} not in event {event_id}")
            raise ValidationError("Participant not in event")
            
        event.participants.remove(participant)
        db.commit()
        logger.info(f"Participant {participant_id} successfully left event {event_id}")
        return {"message": "Successfully left event"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to leave event: {str(e)}", exc_info=True)
        raise DatabaseError(f"Failed to leave event: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
