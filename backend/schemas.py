from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class EventStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"

class ParticipantPostion(str, Enum):
    GOALKEEPER = "goalkeeper"
    DEFENDER = "defender"
    MIDFIELDER = "midfielder"
    FORWARD = "forward"
    FREEDRAWER = "free_drawer"
    NOPOSITION = "no_position"

class LocationBase(BaseModel):
    address: str
    rate: Optional[float] = 0.0
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    address: Optional[str] = None
    rate: Optional[float] = None
    description: Optional[str] = None

class Location(LocationBase):
    id: int

    class Config:
        from_attributes = True

class ParticipantBase(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    rate: Optional[float] = 0.0
    positions: ParticipantPostion = ParticipantPostion.NOPOSITION
    goals: int = 0
    passes: int = 0
    wins: int = 0
    draws: int = 0
    loses: int = 0

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    rate: Optional[float] = None
    positions: Optional[ParticipantPostion] = None
    goals: Optional[int] = None
    passes: Optional[int] = None
    wins: Optional[int] = None
    draws: Optional[int] = None
    loses: Optional[int] = None

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
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    rate: Optional[float] = 0.0

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

class EventUpdate(BaseModel):
    date: Optional[datetime] = None
    time: Optional[str] = None
    status: Optional[EventStatus] = None
    max_participants: Optional[int] = None
    format_teams: Optional[int] = None
    format_players_per_team: Optional[int] = None
    game_end_condition: Optional[str] = None
    rotation_rule: Optional[str] = None
    location_id: Optional[int] = None

class Event(EventBase):
    id: int
    participants: List[Participant] = []

    class Config:
        from_attributes = True
