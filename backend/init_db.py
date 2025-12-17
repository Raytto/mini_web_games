from passlib.context import CryptContext
from backend.database import SessionLocal, engine
from backend.models import Base, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "pp").first()
        if not user:
            print("Creating default user 'pp'")
            hashed_password = pwd_context.hash("1994188")
            user = User(username="pp", password_hash=hashed_password)
            db.add(user)
            db.commit()
            print("User 'pp' created successfully.")
        else:
            print("User 'pp' already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
