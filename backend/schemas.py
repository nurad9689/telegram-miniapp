from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class EventStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"

class LocationBase(BaseModel):
    address: str
    rate: float = 0.0
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int

    class Config:
        from_attributes = True

class ParticipantBase(BaseModel):
    telegram_id: int
    name: str
    fullname: Optional[str] = None
    username: Optional[str] = None
    rate: float = 0.0
    positions: Optional[str] = None
    goals: int = 0
    passes: int = 0
    wins: int = 0
    draws: int = 0
    loses: int = 0

class ParticipantCreate(ParticipantBase):
    pass

class Participant(ParticipantBase):
    id: int

    class Config:
        from_attributes = True

class TelegramUserCreate(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None

class TelegramUserResponse(BaseModel):
    id: int
    telegram_id: int
    name: str
    fullname: Optional[str] = None
    username: Optional[str] = None
    rate: float = 0.0

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    date: datetime
    time: str
    status: EventStatus = EventStatus.WAITING
    max_participants: int = 10
    format_teams: int = 2
    format_players_per_team: int = 5
    game_end_condition: str
    rotation_rule: str
    location_id: int
    creator_id: int

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    participants: List[Participant] = []

    class Config:
        from_attributes = True