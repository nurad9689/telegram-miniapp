from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
import enum

class EventStatus(enum.Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    FINISHED = "finished"

class ParticipantPostion(enum.Enum):
    GOALKEEPER = "goalkeeper"
    DEFENDER = "defender"
    MIDFIELDER = "midfielder"
    FORWARD = "forward"
    FREEDRAWER = "free_drawer"
    NOPOSITION = "no_position"

# Таблица связи для участников мероприятия
event_participants = Table(
    'event_participants',
    Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id')),
    Column('participant_id', Integer, ForeignKey('participants.id'))
)

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    rate = Column(Float, default=0.0)
    description = Column(String)

    events = relationship("Event", back_populates="location")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, nullable=False, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    username = Column(String)
    rate = Column(Float, default=0.0)
    positions = Column(String, default=ParticipantPostion.NOPOSITION)  # Можно хранить как строку через запятую
    goals = Column(Integer, default=0)
    passes = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    loses = Column(Integer, default=0)

    events = relationship("Event", secondary=event_participants, back_populates="participants")
    created_events = relationship("Event", back_populates="creator")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime)
    time = Column(String)
    status = Column(Enum(EventStatus), default=EventStatus.WAITING)
    
    max_participants = Column(Integer, default=10)
    format_teams = Column(Integer, default=2)
    format_players_per_team = Column(Integer, default=5)
    game_end_condition = Column(String) # "2 goals" or "7 minutes"
    rotation_rule = Column(String) # "on loss" or "every 2 games"

    location_id = Column(Integer, ForeignKey("locations.id"))
    creator_id = Column(Integer, ForeignKey("participants.id"))

    location = relationship("Location", back_populates="events")
    creator = relationship("Participant", back_populates="created_events")
    participants = relationship("Participant", secondary=event_participants, back_populates="events")