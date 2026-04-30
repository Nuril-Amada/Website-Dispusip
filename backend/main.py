from fastapi import FastAPI, Query
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.middleware.cors import CORSMiddleware

DATABASE_URL = "postgresql://postgres:aul@localhost:5432/Dispusip"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/perpustakaan/lokasi/{year}")
def visitors_per_library(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT lokasi, COUNT(*) as total
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            AND (
                UPPER(lokasi) = 'PERPUSTAKAAN BALAI PEMUDA'
                OR
                UPPER(lokasi) = 'PERPUSTAKAAN RUNGKUT'
            )
            GROUP BY lokasi
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/perpustakaan/pengunjung/{year}")
def visitors_monthly(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                EXTRACT(MONTH FROM tanggal_entri) as bulan,
                COUNT(*) as total
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            GROUP BY bulan
            ORDER BY bulan
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/perpustakaan/summary/{year}")
def dashboard_summary(year: int):
    with engine.connect() as conn:

        total_pengunjung = conn.execute(text("""
            SELECT COUNT(*)
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            AND UPPER(lokasi) IN (
                'PERPUSTAKAAN BALAI PEMUDA',
                'PERPUSTAKAAN RUNGKUT'
            )
        """), {"year": year}).scalar()

        total_peminjaman = conn.execute(text("""
            SELECT COUNT(*)
            FROM peminjaman
            WHERE EXTRACT(YEAR FROM tanggal_pinjam) = :year
        """), {"year": year}).scalar()

        total_anggota = conn.execute(text("""
            SELECT COUNT(*)
            FROM anggota
            WHERE EXTRACT(YEAR FROM tanggal_input) = :year
        """), {"year": year}).scalar()

        return {
            "pengunjung": total_pengunjung,
            "peminjaman": total_peminjaman,
            "anggota": total_anggota,
        }
    
@app.get("/perpustakaan/top-books/{year}")
def top_books(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                judul_buku,
                COUNT(*) as total_pinjam
            FROM peminjaman
            WHERE EXTRACT(YEAR FROM tanggal_pinjam) = :year
            GROUP BY judul_buku
            ORDER BY total_pinjam DESC
            LIMIT 5
        """), {"year": year})

        return result.mappings().all()

@app.get("/perpustakaan/latest-books/{year}")
def latest_books(year: int):
    with engine.connect() as conn:
        query = text("""
            SELECT 
                judul,
                tahun_terbit,
                tahun_distribusi
            FROM koleksi_buku
            WHERE tahun_distribusi IS NOT NULL
            AND tahun_distribusi = :year
            ORDER BY tahun_distribusi DESC
            LIMIT 5
        """)

        result = conn.execute(query, {"year": year})
        return result.mappings().all()
    
@app.get("/arsip/summary/{year}")
def arsip_summary(year: int):
    with engine.connect() as conn:

        result = conn.execute(text("""
            WITH totals AS (
                SELECT 
                    tahun,
                    SUM(jumlah) FILTER (WHERE sumber = 'sikn') AS total_sikn,
                    SUM(jumlah) FILTER (WHERE sumber = 'jikn') AS total_jikn
                FROM (
                    SELECT tahun, jumlah, 'sikn' AS sumber FROM item_sikn
                    UNION ALL
                    SELECT tahun, jumlah, 'jikn' AS sumber FROM kunjungan_jikn
                ) x
                GROUP BY tahun
            )
            SELECT 
                curr.total_sikn AS total_sikn_now,
                curr.total_jikn AS total_jikn_now,
                prev.total_sikn AS total_sikn_prev,
                prev.total_jikn AS total_jikn_prev
            FROM totals curr
            LEFT JOIN totals prev
                ON prev.tahun = curr.tahun - 1
            WHERE curr.tahun = :year
        """), {"year": year}).mappings().first()

        if not result:
            return {
                "total_item_sikn": 0,
                "total_kunjungan_jikn": 0,
                "growth_sikn_percent": None,
                "growth_jikn_percent": None
            }

        total_sikn_now = result["total_sikn_now"] or 0
        total_jikn_now = result["total_jikn_now"] or 0
        total_sikn_prev = result["total_sikn_prev"] or 0
        total_jikn_prev = result["total_jikn_prev"] or 0

        # Growth dihitung hanya jika tahun sebelumnya ada dan > 0
        growth_sikn = None
        if total_sikn_prev > 0:
            growth_sikn = round(((total_sikn_now - total_sikn_prev) / total_sikn_prev) * 100, 2)

        growth_jikn = None
        if total_jikn_prev > 0:
            growth_jikn = round(((total_jikn_now - total_jikn_prev) / total_jikn_prev) * 100, 2)

        return {
            "total_item_sikn": total_sikn_now,
            "total_kunjungan_jikn": total_jikn_now,
            "growth_sikn_percent": growth_sikn,
            "growth_jikn_percent": growth_jikn
        }

@app.get("/arsip/jikn-sikn/{year}")
def get_jikn_sikn(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                m.bulan,
                CASE m.bulan
                    WHEN 1 THEN 'Jan'
                    WHEN 2 THEN 'Feb'
                    WHEN 3 THEN 'Mar'
                    WHEN 4 THEN 'Apr'
                    WHEN 5 THEN 'Mei'
                    WHEN 6 THEN 'Jun'
                    WHEN 7 THEN 'Jul'
                    WHEN 8 THEN 'Agu'
                    WHEN 9 THEN 'Sep'
                    WHEN 10 THEN 'Okt'
                    WHEN 11 THEN 'Nov'
                    WHEN 12 THEN 'Des'
                END AS nama_bulan,
                COALESCE(j.jumlah, 0) AS jumlah_jikn,
                COALESCE(s.jumlah, 0) AS jumlah_sikn
            FROM generate_series(1,12) AS m(bulan)
            LEFT JOIN kunjungan_jikn j
                ON j.bulan = m.bulan AND j.tahun = :year
            LEFT JOIN item_sikn s
                ON s.bulan = m.bulan AND s.tahun = :year
            ORDER BY m.bulan
        """), {"year": year})

        return result.mappings().all()
    
# @app.get("/arsip/periode-detail")
# def arsip_periode_detail(year: int, periode: str):
#     with engine.connect() as conn:
#         result = conn.execute(text("""
#             SELECT 
#                 jenis,
#                 SUM(jumlah) as total,
#                 satuan
#             FROM arsip
#             WHERE tahun = :year
#             AND LOWER(periode) = LOWER(:periode)
#             GROUP BY jenis, satuan
#             ORDER BY total DESC
#         """), {"year": year, "periode": periode})

#         return result.mappings().all()

@app.get("/arsip/jenis-tren")
def arsip_jenis_tren(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                LOWER(periode) as bulan,
                jenis,
                SUM(jumlah) as total
            FROM arsip
            WHERE tahun = :year
            AND jenis IN ('Tekstual Statis', 'Tekstual Inaktif')
            GROUP BY bulan, jenis
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/arsip/jenis-summary")
def arsip_jenis_summary(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                jenis,
                SUM(jumlah) as total
            FROM arsip
            WHERE tahun = :year
            AND jenis IN ('Peta', 'Foto', 'Video')
            GROUP BY jenis
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/")
def root():
    return {"message": "API berjalan"}