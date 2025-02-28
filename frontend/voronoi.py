import os
import numpy as np
import pandas as pd
from scipy.spatial import Voronoi
from shapely.geometry import Polygon, box
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path='../backend/.env')

# Constants
MILES_PER_DEGREE_LAT = 69  # 1° latitude ≈ 69 miles

# Database connection settings
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

def voronoi_finite_polygons_2d(vor, radius=None):
    """Reconstruct infinite Voronoi regions to finite regions."""
    if vor.points.shape[1] != 2:
        raise ValueError("Requires 2D input")

    new_regions = []
    new_vertices = vor.vertices.tolist()
    center = vor.points.mean(axis=0)
    if radius is None:
        radius = vor.points.ptp().max() * 2

    all_ridges = {}
    for (p1, p2), (v1, v2) in zip(vor.ridge_points, vor.ridge_vertices):
        all_ridges.setdefault(p1, []).append((p2, v1, v2))
        all_ridges.setdefault(p2, []).append((p1, v1, v2))

    for p1, region in enumerate(vor.point_region):
        vertices = vor.regions[region]
        if all(v >= 0 for v in vertices):
            new_regions.append(vertices)
            continue

        ridges = all_ridges.get(p1, [])
        new_region = [v for v in vertices if v >= 0]

        for p2, v1, v2 in ridges:
            if v2 < 0:
                v1, v2 = v2, v1
            if v1 >= 0:
                continue

            t = vor.points[p2] - vor.points[p1]
            t /= np.linalg.norm(t)
            n = np.array([-t[1], t[0]])

            midpoint = vor.points[[p1, p2]].mean(axis=0)
            direction = np.sign(np.dot(midpoint - center, n)) * n
            far_point = vor.vertices[v2] + direction * radius

            new_region.append(len(new_vertices))
            new_vertices.append(far_point.tolist())

        vs = np.asarray([new_vertices[v] for v in new_region])
        if len(vs) == 0:
            continue
        c = vs.mean(axis=0)
        angles = np.arctan2(vs[:,1] - c[1], vs[:,0] - c[0])
        new_region = np.array(new_region)[np.argsort(angles)]
        new_regions.append(new_region.tolist())

    return new_regions, np.asarray(new_vertices)

# Fetch data from database
try:
    conn = psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
    )
    df = pd.read_sql("SELECT username, latitude, longitude FROM square_ownership;", conn)
    conn.close()
except Exception as e:
    print("Error fetching data:", e)
    df = pd.DataFrame(columns=["username", "latitude", "longitude"])

if df.empty:
    print("No data found.")
else:
    points = df[["longitude", "latitude"]].values
    vor = Voronoi(points)
    regions, vertices = voronoi_finite_polygons_2d(vor, radius=360)
    world_bounds = box(-180, -90, 180, 90)
    user_areas = {}

    for idx, user in df.iterrows():
        if idx >= len(regions):
            print(f"Skipping user {user['username']} - no region")
            continue
            
        region = regions[idx]
        polygon_vertices = vertices[region]

        if len(polygon_vertices) < 3:
            continue

        try:
            voronoi_poly = Polygon(polygon_vertices)
            clipped_poly = voronoi_poly.intersection(world_bounds)
            if clipped_poly.is_empty:
                continue

            area_deg2 = clipped_poly.area
            centroid = clipped_poly.centroid
            avg_lat_rad = np.radians(centroid.y)
            conversion = (MILES_PER_DEGREE_LAT ** 2) * np.cos(avg_lat_rad)
            area_sq_miles = area_deg2 * conversion

            username = user["username"]
            user_areas[username] = user_areas.get(username, 0) + area_sq_miles
        except Exception as e:
            print(f"Error processing user {user['username']}: {e}")

    for user, area in sorted(user_areas.items(), key=lambda x: -x[1]):
        print(f"{user}: {area:,.0f} mi²")


if df.empty:
    print("No data found.")
else:
    # ... [keep existing Voronoi calculation code] ...

    # After calculating user_areas, update database
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
        )
        cur = conn.cursor()
        
        # Clear existing data
        cur.execute("DELETE FROM user_areas;")
        
        # Insert new data
        for user, area in user_areas.items():
            # Convert NumPy float to Python float
            area_float = float(area)
            cur.execute(
                "INSERT INTO user_areas (username, area) VALUES (%s, %s) ON CONFLICT (username) DO UPDATE SET area = EXCLUDED.area;",
                (user, area_float)
            )
        
        conn.commit()
        conn.close()
        print("Successfully updated user areas in database")
    except Exception as e:
        print("Error updating database:", e)       