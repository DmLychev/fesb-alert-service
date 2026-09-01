from sqlalchemy import (Column, String, VARCHAR, TEXT, BOOLEAN, BIGINT, SMALLINT, DATETIME, ForeignKey,
                        UniqueConstraint, CheckConstraint)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class SystemSettings(Base):
    __tablename__ = 'alert_service_settings'
    id = Column(BIGINT, primary_key=True)
    fesb_timezone = Column(VARCHAR(128), default='Europe/Moscow')
    fesb_requests_check_interval = Column(SMALLINT, default=15)
    fesb_request_timeout = Column(SMALLINT, default=60)
    fesb_request_errors_threshold = Column(SMALLINT, default=5)
    fesb_messages_get_interval = Column(SMALLINT, default=15)
    fesb_messages_update_interval = Column(SMALLINT, default=120)
    fesb_messages_log_limit = Column(SMALLINT, default=10)
    fesb_messages_log_interval = Column(SMALLINT, default=2)
    fesb_single_route_errors_threshold = Column(SMALLINT, default=3)
    fesb_routes_errors_threshold = Column(SMALLINT, default=2)
    fesb_domain_errors_threshold = Column(SMALLINT, default=2)
    fesb_status_update_attempts = Column(SMALLINT, default=3)
    db_timeout = Column(SMALLINT, default=30)
    messages_check_warning_interval = Column(SMALLINT, default=30)
    auto_track_new_routes = Column(BOOLEAN, default=True)
    issues_check_interval = Column(SMALLINT, default=15)
    admin_email = Column(VARCHAR(128))
    inform_admin_if_no_receivers = Column(BOOLEAN, default=False)
    smtp_delay = Column(SMALLINT, default=3)
    created_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp())
    updated_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    __table_args__ = (CheckConstraint("id = 1", name="only_one_settings_row"),)


class Route(Base):
    __tablename__ = 'alert_service_routes'
    id = Column(VARCHAR(128), primary_key=True)
    message = relationship("Message", back_populates="route")
    notification_receiver = relationship("NotificationReceiver", back_populates="route")
    name = Column(VARCHAR(256))
    description = Column(TEXT)
    domain_name = Column(VARCHAR(128))
    is_active = Column(BOOLEAN, default=True)
    is_tracked = Column(BOOLEAN, default=False)
    created_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp())
    updated_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    def to_dict(self):
        """Converts ORM object to a dictionary."""
        return {field.name: getattr(self, field.name) for field in self.__table__.c}


class Message(Base):
    __tablename__ = 'alert_service_messages'
    id = Column(BIGINT, primary_key=True)
    exchange_id = Column(VARCHAR(128))
    request_id = Column(VARCHAR(128), nullable=True)
    route_id = Column(VARCHAR(128), ForeignKey('alert_service_routes.id'))
    route = relationship("Route", back_populates="message")
    error_message = Column(TEXT, nullable=True, default="")
    status = Column(VARCHAR(16), nullable=True)
    update_status_attempts = Column(SMALLINT, default=0)
    start_date = Column(DATETIME(timezone=True))
    end_date = Column(DATETIME(timezone=True), nullable=True)
    warning_level = Column(SMALLINT)
    created_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp())
    updated_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    __table_args__ = (UniqueConstraint('exchange_id', 'route_id'),)

    def to_dict(self):
        """Converts ORM object to a dictionary."""
        return {field.name: getattr(self, field.name) for field in self.__table__.c}


class Issue(Base):
    __tablename__ = 'alert_service_issues'
    id = Column(BIGINT, primary_key=True)
    type_id = Column(SMALLINT)
    text = Column(TEXT)
    route_id = Column(VARCHAR(128), nullable=True)
    domain_name = Column(VARCHAR(128), nullable=True)
    is_notified = Column(BOOLEAN, default=False, nullable=True)
    is_solved = Column(BOOLEAN, default=False)
    created_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp())
    updated_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    def to_dict(self):
        """Converts ORM object to a dictionary."""
        return {field.name: getattr(self, field.name) for field in self.__table__.c}


class NotificationReceiver(Base):
    __tablename__ = 'alert_service_notification_receivers'
    id = Column(BIGINT, primary_key=True)
    issue_type_id = Column(SMALLINT, nullable=True)
    route_id = Column(VARCHAR(128), ForeignKey('alert_service_routes.id'))
    route = relationship("Route", back_populates="notification_receiver")
    domain_name = Column(VARCHAR(128), nullable=True)
    email = Column(String(120))
    created_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp())
    updated_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    def to_dict(self):
        """Converts ORM object to a dictionary."""
        return {field.name: getattr(self, field.name) for field in self.__table__.c}


class FesbRequest(Base):
    __tablename__ = 'alert_service_fesb_requests'
    id = Column(BIGINT, primary_key=True)
    type_id = Column(SMALLINT)
    is_successful = Column(BOOLEAN, default=True)
    warning_level = Column(SMALLINT)
    details = Column(TEXT, nullable=True)
    created_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp())
    updated_at = Column(DATETIME(timezone=True), nullable=False, default=func.current_timestamp(),
                        onupdate=func.current_timestamp())

    def to_dict(self):
        """Converts ORM object to a dictionary."""
        return {field.name: getattr(self, field.name) for field in self.__table__.c}
