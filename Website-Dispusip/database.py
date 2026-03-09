from sqlalchemy import create_engine
DATABASE_URL = "postgresql://postgres:aul@localhost:5432/Dispusip"
engine = create_engine(DATABASE_URL)