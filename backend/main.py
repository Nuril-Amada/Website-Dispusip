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
            SELECT
                lokasi,
                COUNT(*) AS total
            FROM (
                SELECT
                    CASE
                        WHEN UPPER(lokasi) = 'PERPUSTAKAAN BALAI PEMUDA'
                            THEN 'Balai Pemuda'

                        WHEN UPPER(lokasi) = 'PERPUSTAKAAN RUNGKUT'
                            THEN 'Rungkut'

                        WHEN UPPER(lokasi) LIKE 'TBM%'
                            THEN 'TBM'
                    END AS lokasi
                FROM pengunjung
                WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
                AND (
                    UPPER(lokasi) IN (
                        'PERPUSTAKAAN BALAI PEMUDA',
                        'PERPUSTAKAAN RUNGKUT'
                    )
                    OR UPPER(lokasi) LIKE 'TBM%'
                )
            ) x
            GROUP BY lokasi
            ORDER BY lokasi
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/perpustakaan/pengunjung/{year}")
def visitors_monthly(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                EXTRACT(MONTH FROM tanggal_entri) AS bulan,
                COUNT(*) AS total
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            AND (
                UPPER(lokasi) IN (
                    'PERPUSTAKAAN BALAI PEMUDA',
                    'PERPUSTAKAAN RUNGKUT'
                )
                OR lokasi ILIKE 'TBM%'
            )
            GROUP BY bulan
            ORDER BY bulan
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/perpustakaan/pekerjaan/{year}")
def pekerjaan_distribution(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                pekerjaan,
                COUNT(*) as total
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            AND pekerjaan IS NOT NULL
            GROUP BY pekerjaan
            ORDER BY total DESC
            LIMIT 10
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/perpustakaan/summary/{year}")
def dashboard_summary(year: int):
    with engine.connect() as conn:

        total_pengunjung = conn.execute(text("""
            SELECT COUNT(*)
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            AND (
                UPPER(lokasi) IN (
                    'PERPUSTAKAAN BALAI PEMUDA',
                    'PERPUSTAKAAN RUNGKUT'
                )
                OR lokasi ILIKE 'TBM%'
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

        jumlah_bulan = conn.execute(text("""
            SELECT COUNT(DISTINCT EXTRACT(MONTH FROM tanggal_entri))
            FROM pengunjung
            WHERE EXTRACT(YEAR FROM tanggal_entri) = :year
            AND (
                UPPER(lokasi) IN (
                    'PERPUSTAKAAN BALAI PEMUDA',
                    'PERPUSTAKAAN RUNGKUT'
                )
                OR lokasi ILIKE 'TBM%'
            )
        """), {"year": year}).scalar()

        avg_pengunjung = round(
            (total_pengunjung or 0) /
            (jumlah_bulan or 1)
        )

        return {
            "pengunjung": total_pengunjung,
            "peminjaman": total_peminjaman,
            "anggota": total_anggota,
            "avgPengunjung": avg_pengunjung
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
            AND TRIM(UPPER(lokasi)) IN (
                'PERPUSTAKAAN RUNGKUT',
                'PERPUSTAKAAN BALAI PEMUDA'
            )
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
                distribusi,
                jenis_buku,
                lokasi
            FROM koleksi_buku
            WHERE EXTRACT(YEAR FROM distribusi) = :year
            AND lokasi IN (
                'PERPUSTAKAAN RUNGKUT',
                'PERPUSTAKAAN BALAI PEMUDA'
            )
            ORDER BY distribusi DESC
            LIMIT 5
        """)

        result = conn.execute(query, {"year": year})
        return result.mappings().all()
    
@app.get("/arsip/summary/{year}")
def arsip_summary(year: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                /* ===== SIKN & JIKN ===== */
                COALESCE((
                    SELECT SUM(jumlah)
                    FROM item_sikn
                    WHERE tahun = :year
                ), 0) AS total_sikn_now,

                COALESCE((
                    SELECT SUM(jumlah)
                    FROM kunjungan_jikn
                    WHERE tahun = :year
                ), 0) AS total_jikn_now,

                COALESCE((
                    SELECT SUM(jumlah)
                    FROM item_sikn
                    WHERE tahun = :year - 1
                ), 0) AS total_sikn_prev,

                COALESCE((
                    SELECT SUM(jumlah)
                    FROM kunjungan_jikn
                    WHERE tahun = :year - 1
                ), 0) AS total_jikn_prev,

                /* ===== ARSIP BERDASARKAN SATUAN ===== */
                COALESCE((
                    SELECT SUM(jumlah)
                    FROM arsip
                    WHERE tahun = :year
                    AND LOWER(satuan) = 'item'
                ), 0) AS total_arsip_item,

                COALESCE((
                    SELECT SUM(jumlah)
                    FROM arsip
                    WHERE tahun = :year
                    AND LOWER(satuan) = 'cd'
                ), 0) AS total_arsip_cd

        """), {"year": year}).mappings().first()

        total_sikn_now = result["total_sikn_now"]
        total_jikn_now = result["total_jikn_now"]
        total_sikn_prev = result["total_sikn_prev"]
        total_jikn_prev = result["total_jikn_prev"]

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
            "growth_jikn_percent": growth_jikn,
            "total_arsip_item": result["total_arsip_item"],
            "total_arsip_cd": result["total_arsip_cd"]
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

@app.get("/arsip/komposisi-bulanan")
def arsip_komposisi_bulanan(year: int):

    with engine.connect() as conn:

        result = conn.execute(text("""
            SELECT
                LOWER(periode) AS bulan,
                jenis,
                SUM(jumlah) AS total
            FROM arsip
            WHERE tahun = :year
            GROUP BY bulan, jenis
            ORDER BY bulan
        """), {"year": year})

        return result.mappings().all()

@app.get("/arsip/treemap-tekstual")
def arsip_treemap_tekstual(year: int):

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                jenis,
                SUM(jumlah) AS total
            FROM arsip
            WHERE tahun = :year
            AND jenis IN (
                'Tekstual Statis',
                'Tekstual Inaktif'
            )
            GROUP BY jenis
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/arsip/treemap-media")
def arsip_treemap_media(year: int):

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                jenis,
                SUM(jumlah) AS total
            FROM arsip
            WHERE tahun = :year
            AND jenis IN (
                'Peta',
                'Foto',
                'Video'
            )
            GROUP BY jenis
        """), {"year": year})

        return result.mappings().all()
    
@app.get("/perpustakaan/forecast")
def get_forecast():

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                CASE EXTRACT(MONTH FROM ds)

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

                ROUND(
                    yhat::numeric,
                    0
                ) AS prediksi

            FROM pengunjung_2026

            WHERE EXTRACT(YEAR FROM ds) = 2026

            ORDER BY ds
        """))

        return result.mappings().all()  

@app.get("/")
def root():
    return {"message": "API berjalan"}