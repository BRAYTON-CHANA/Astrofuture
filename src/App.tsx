import React, { useEffect, useState } from "react";
import "./App.css";

interface Asteroid {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    meters: { estimated_diameter_min: number; estimated_diameter_max: number };
  };
  close_approach_data: {
    close_approach_date: string;
    miss_distance: { kilometers: string; lunar: string };
    relative_velocity: { kilometers_per_hour: string };
    orbiting_body: string;
  }[];
  absolute_magnitude_h: number;
  nasa_jpl_url: string;
}

function App() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string>("");
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);

  useEffect(() => {
    const fetchAsteroids = async () => {
      try {
        const apiKey = "xghAdby4Xp7dld7HfZ8jKgwaI07EUocyYuvClcGt";
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=2025-09-29&end_date=2025-10-02&api_key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        const asteroidsArray: Asteroid[] = Object.values(data.near_earth_objects)
          .flat()
          .map((a: any) => a);
        setAsteroids(asteroidsArray);
        if (asteroidsArray.length > 0) {
          setSelectedAsteroidId(asteroidsArray[0].id);
          setSelectedAsteroid(asteroidsArray[0]);
        }
      } catch (error) {
        console.error("Error obteniendo datos:", error);
      }
    };

    fetchAsteroids();
  }, []);

  // Cambiar navbar al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (window.scrollY > 50) {
        navbar?.classList.add("scrolled");
      } else {
        navbar?.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAsteroidId(id);
    const asteroid = asteroids.find(a => a.id === id) || null;
    setSelectedAsteroid(asteroid);
  };

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">Astro Future</div>
        <ul className="nav-links">
          <li><a href="#">Inicio</a></li>
          <li><a href="#">Explorar</a></li>
          <li><a href="#">Misión</a></li>
          <li><a href="#">Contacto</a></li>
        </ul>
      </nav>

      {/* CONTENIDO CENTRAL */}
      <div className="overlay">
        <h1 className="title">Explora el Universo</h1>
        <p className="subtitle">Descubre los misterios del espacio con Astro Future</p>
        <button className="btn">Comenzar</button>
      </div>

      {/* SELECCIÓN DE ASTEROIDE */}
      <section className="selector-section">
        <label htmlFor="asteroidSelect">Selecciona un asteroide:</label>
        <select id="asteroidSelect" value={selectedAsteroidId} onChange={handleSelectChange}>
          {asteroids.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </section>

      {/* SECCIÓN DE INFORMACIÓN DEL ASTEROIDE */}
      {selectedAsteroid && (
        <section className="info-section">
          <div className="info-container">
            <div className="info-left">
              <div className="info-card">
                <h3>🪐 Nombre</h3>
                <p>{selectedAsteroid.name}</p>
              </div>
              <div className="info-card">
                <h3>📏 Diámetro</h3>
                <p>
                  {selectedAsteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(2)}m -{" "}
                  {selectedAsteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(2)}m
                </p>
              </div>
              <div className="info-card">
                <h3>⚡ Potencialmente peligroso</h3>
                <p>{selectedAsteroid.is_potentially_hazardous_asteroid ? "Sí" : "No"}</p>
              </div>
              <div className="info-card">
                <h3>📅 Fecha de aproximación</h3>
                <p>{selectedAsteroid.close_approach_data[0].close_approach_date}</p>
              </div>
              <div className="info-card">
                <h3>🌕 Distancia a la Tierra</h3>
                <p>
                  {parseFloat(selectedAsteroid.close_approach_data[0].miss_distance.kilometers).toFixed(2)} km /{" "}
                  {parseFloat(selectedAsteroid.close_approach_data[0].miss_distance.lunar).toFixed(2)} LD
                </p>
              </div>
              <div className="info-card">
                <h3>💨 Velocidad relativa</h3>
                <p>
                  {parseFloat(selectedAsteroid.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2)} km/h
                </p>
              </div>
              <div className="info-card">
                <h3>🔗 Más información</h3>
                <a href={selectedAsteroid.nasa_jpl_url} target="_blank" rel="noopener noreferrer">
                  Sitio NASA JPL
                </a>
              </div>
            </div>

            <div className="info-right">
              <div className="planet"></div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
