from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict

import models, schemas, database
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

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
def auth_telegram(user_data: schemas.TelegramUserCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли пользователь с таким telegram_id
    participant = db.query(models.Participant).filter(
        models.Participant.telegram_id == user_data.telegram_id
    ).first()
    
    if participant:
        # Обновляем данные пользователя, если они изменились
        participant.first_name = user_data.first_name
        participant.last_name = user_data.last_name
        participant.username = user_data.username
        db.commit()
        db.refresh(participant)
        return participant
    else:
        # Создаем нового пользователя
        new_participant = models.Participant(
            telegram_id=user_data.telegram_id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            username=user_data.username
        )
        db.add(new_participant)
        db.commit()
        db.refresh(new_participant)
        return new_participant

@app.get("/participants/me", response_model=schemas.TelegramUserResponse)
def get_current_user(telegram_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(
        models.Participant.telegram_id == telegram_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="User not found")
    
    return participant

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
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not event.participants:
        raise HTTPException(status_code=400, detail="No participants in this event")
        
    balanced_teams = balance_teams(event.participants, event.format_teams)
    
    result = {}
    for i, team in enumerate(balanced_teams):
        result[f"Team {i+1}"] = team
        
    return result

# Locations
@app.post("/locations/", response_model=schemas.Location)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_location = models.Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@app.get("/locations/", response_model=List[schemas.Location])
def read_locations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    locations = db.query(models.Location).offset(skip).limit(limit).all()
    return locations

# Participants
@app.post("/participants/", response_model=schemas.Participant)
def create_participant(participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    db_participant = models.Participant(**participant.dict())
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

@app.get("/participants/", response_model=List[schemas.Participant])
def read_participants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    participants = db.query(models.Participant).offset(skip).limit(limit).all()
    return participants

# Events
@app.post("/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events/", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(models.Event).offset(skip).limit(limit).all()
    return events

# Регистрация участника на мероприятие
@app.post("/events/{event_id}/join/{participant_id}")
def join_event(event_id: int, participant_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    
    if not event or not participant:
        raise HTTPException(status_code=404, detail="Event or Participant not found")
    
    if participant in event.participants:
        raise HTTPException(status_code=400, detail="Already joined")
        
    if len(event.participants) >= event.max_participants:
        # Здесь можно реализовать логику резерва, но пока просто ошибка
        raise HTTPException(status_code=400, detail="Event is full")
        
    event.participants.append(participant)
    db.commit()
    return {"message": "Successfully joined"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)