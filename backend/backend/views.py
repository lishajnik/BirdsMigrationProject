from datetime import datetime
from flask import render_template, request, jsonify
from backend import app

import requests
import sqlite3
import pandas as pd
import time
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "birds_migration.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS BirdSpecies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species_code TEXT UNIQUE NOT NULL,
        common_name TEXT NOT NULL,
        scientific_name TEXT NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Sighting (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        bird_count INTEGER NOT NULL,
        observation_date TEXT NOT NULL,
        FOREIGN KEY (species_id) REFERENCES BirdSpecies(id) ON DELETE CASCADE
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS WeatherContext (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sighting_id INTEGER UNIQUE NOT NULL,
        temperature REAL,
        wind_speed REAL,
        FOREIGN KEY (sighting_id) REFERENCES Sighting(id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    conn.close()

init_db()

@app.route('/')
@app.route('/home')
def home():
    return render_template('index.html', title='Home Page', year=datetime.now().year)

@app.route('/api/sync-and-calculate', methods=['POST'])
def sync_and_calculate():
    data = request.json or {}
    user_token = data.get("api_token")
    
    if not user_token:
        return jsonify({"status": "error", "message": "Пожалуйста, введите API-ключ eBird"}), 400

    url = "https://api.ebird.org/v2/data/obs/US/recent"
    headers = {"X-eBirdApiToken": user_token}
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code != 200:
            return jsonify({"status": "error", "message": f"eBird API вернул ошибку: {response.status_code}"}), 400
        sightings_data = response.json()
    except Exception as e:
        return jsonify({"status": "error", "message": f"Ошибка сети: {str(e)}"}), 500

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    saved_counter = 0
    weather_cache = {}

    for obs in sightings_data:
        if saved_counter >= 40:
            break

        species_code = obs.get('speciesCode')
        com_name = obs.get('comName', 'Unknown')
        sci_name = obs.get('sciName', 'Unknown')
        lat = obs.get('lat')
        lng = obs.get('lng')
        count = obs.get('howMany', 1) 
        obs_date = obs.get('obsDt', '')

        if not lat or not lng:
            continue

        try:
            cursor.execute("INSERT OR IGNORE INTO BirdSpecies (species_code, common_name, scientific_name) VALUES (?, ?, ?)", 
                           (species_code, com_name, sci_name))
            cursor.execute("SELECT id FROM BirdSpecies WHERE species_code = ?", (species_code,))
            species_id = cursor.fetchone()[0]

            cursor.execute("INSERT INTO Sighting (species_id, latitude, longitude, bird_count, observation_date) VALUES (?, ?, ?, ?, ?)", 
                           (species_id, lat, lng, count, obs_date))
            sighting_id = cursor.lastrowid

            clean_date = obs_date.split()[0] if " " in obs_date else obs_date[:10]
            cache_key = f"{round(lat, 1)}_{round(lng, 1)}_{clean_date}"

            if cache_key in weather_cache:
                temp, wind = weather_cache[cache_key]
            else:
                weather_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lng}&start_date={clean_date}&end_date={clean_date}&daily=temperature_2m_max,wind_speed_10m_max&timezone=auto"
                w_res = requests.get(weather_url).json()
                temp = w_res.get('daily', {}).get('temperature_2m_max', [15.0])[0]
                wind = w_res.get('daily', {}).get('wind_speed_10m_max', [12.0])[0]
                weather_cache[cache_key] = (temp, wind)
                time.sleep(0.05)

            cursor.execute("INSERT OR IGNORE INTO WeatherContext (sighting_id, temperature, wind_speed) VALUES (?, ?, ?)", 
                           (sighting_id, temp, wind))
            saved_counter += 1
        except Exception:
            continue

    conn.commit()

    query = """
        SELECT b.common_name AS bird_name, s.bird_count, s.latitude, s.longitude, w.temperature, w.wind_speed
        FROM Sighting s
        JOIN BirdSpecies b ON s.species_id = b.id
        LEFT JOIN WeatherContext w ON s.id = w.sighting_id
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    if df.empty:
        return jsonify({"status": "error", "message": "Нет данных для анализа"}), 500

    analytics = df.groupby('bird_name').agg(
        total_spotted=('bird_count', 'sum'),
        avg_temp=('temperature', 'mean'),
        avg_wind=('wind_speed', 'mean'),
        center_lat=('latitude', 'mean'),
        center_lng=('longitude', 'mean')
    ).reset_index().round({"avg_temp": 1, "avg_wind": 1, "center_lat": 3, "center_lng": 3})

    return jsonify({
        "status": "success",
        "message": f"Синхронизировано наблюдений: {saved_counter}.",
        "data": analytics.to_dict(orient='records')
    })
