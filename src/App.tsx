import React, { useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

// ------------------- Interfaces -------------------
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

interface Comet {
  object_name: string;
  e: string;
  i_deg: string;
  w_deg: string;
  node_deg: string;
  q_au_1: string;
  q_au_2: string;
}

// ------------------- 3D Orbit Component -------------------
function Orbit3D({ comet }: { comet: Comet }) {
  const cometRef = useRef<any>();
  const angleRef = useRef(0);

  if (!comet) return null;

  const e = parseFloat(comet.e);
  const q1 = parseFloat(comet.q_au_1);
  const q2 = parseFloat(comet.q_au_2);
  const i = (parseFloat(comet.i_deg) * Math.PI) / 180;
  const w = (parseFloat(comet.w_deg) * Math.PI) / 180;
  const Omega = (parseFloat(comet.node_deg) * Math.PI) / 180;

  const a = (q1 + q2) / 2;
  const b = a * Math.sqrt(1 - e ** 2);
  const cval = a * e;

  const rotate3D = (x: number, y: number, z: number) => {
    const x1 = x * Math.cos(w) - y * Math.sin(w);
    const y1 = x * Math.sin(w) + y * Math.cos(w);
    const z1 = z;

    const x2 = x1;
    const y2 = y1 * Math.cos(i) - z1 * Math.sin(i);
    const z2 = y1 * Math.sin(i) + z1 * Math.cos(i);

    const x3 = x2 * Math.cos(Omega) - y2 * Math.sin(Omega);
    const y3 = x2 * Math.sin(Omega) + y2 * Math.cos(Omega);
    const z3 = z2;

    return [x3, y3, z3];
  };

  const orbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 200;
    for (let t = 0; t <= steps; t++) {
      const theta = (2 * Math.PI * t) / steps;
      let x = a * Math.cos(theta) - cval;
      let y = b * Math.sin(theta);
      let z = 0;
      const [xr, yr, zr] = rotate3D(x, y, z);
      pts.push(new THREE.Vector3(xr, yr, zr));
    }
    return pts;
  }, [a, b, cval, w, i, Omega]);

  useFrame(() => {
    const angle = angleRef.current;
    const x = a * Math.cos(angle) - cval;
    const y = b * Math.sin(angle);
    const z = 0;
    const [xr, yr, zr] = rotate3D(x, y, z);
    if (cometRef.current) {
      cometRef.current.position.set(xr, yr, zr);
    }
    angleRef.current += 0.01;
  });

  return (
    <>
      <mesh position={[-cval, 0, 0]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color="yellow" emissive="yellow" />
      </mesh>

      <Line points={orbitPoints} color="white" lineWidth={3} />

      <mesh ref={cometRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="cyan" />
      </mesh>
    </>
  );
}

// ------------------- Main App Component -------------------
function App() {
  // Estados para asteroides
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string>("");
  const [selectedAsteroid, setSelectedAsteroid] = useState<Asteroid | null>(null);

  // Estados para cometas
  const [comets, setComets] = useState<Comet[]>([]);
  const [selectedComet, setSelectedComet] = useState<Comet | null>(null);

  // Estado para la sección activa
  const [activeSection, setActiveSection] = useState<"asteroids" | "comets">("asteroids");

  // Fetch de asteroides
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
        console.error("Error obteniendo datos de asteroides:", error);
      }
    };

    fetchAsteroids();
  }, []);

  // Fetch de cometas
  useEffect(() => {
    fetch("/comets.json")
      .then((res) => res.json())
      .then((json: Comet[]) => {
        setComets(json);
        if (json.length > 0) setSelectedComet(json[0]);
      })
      .catch(error => console.error("Error obteniendo datos de cometas:", error));
  }, []);

  // Efecto para navbar al hacer scroll
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

  const handleAsteroidSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAsteroidId(id);
    const asteroid = asteroids.find(a => a.id === id) || null;
    setSelectedAsteroid(asteroid);
  };

  const handleCometSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const comet = comets.find(c => c.object_name === e.target.value) || null;
    setSelectedComet(comet);
  };

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">Astro Future</div>
        <ul className="nav-links">
          <li>
            <a 
              href="#asteroids" 
              className={activeSection === "asteroids" ? "active" : ""}
              onClick={(e) => { e.preventDefault(); setActiveSection("asteroids"); }}
            >
              Asteroides
            </a>
          </li>
          <li>
            <a 
              href="#comets" 
              className={activeSection === "comets" ? "active" : ""}
              onClick={(e) => { e.preventDefault(); setActiveSection("comets"); }}
            >
              Cometas
            </a>
          </li>
        </ul>
      </nav>

      {/* CONTENIDO CENTRAL */}
      <div className="overlay">
        <h1 className="title">Explora el Universo</h1>
        <p className="subtitle">
          {activeSection === "asteroids" 
            ? "Descubre asteroides cercanos a la Tierra" 
            : "Explora las órbitas de cometas del sistema solar"}
        </p>
        <button className="btn" onClick={() => document.querySelector(`.${activeSection}-section`)?.scrollIntoView({ behavior: 'smooth' })}>
          Explorar {activeSection === "asteroids" ? "Asteroides" : "Cometas"}
        </button>
      </div>

      {/* SECCIÓN DE ASTEROIDES */}
      <section className="asteroids-section">
        <div className="section-header">
          <h2>🌍 Asteroides Cercanos</h2>
          <p>Información en tiempo real sobre asteroides cercanos a la Tierra</p>
        </div>

        <div className="selector-section">
          <label htmlFor="asteroidSelect">Selecciona un asteroide:</label>
          <select id="asteroidSelect" value={selectedAsteroidId} onChange={handleAsteroidSelect}>
            {asteroids.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {selectedAsteroid && (
          <div className="info-section">
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
          </div>
        )}
      </section>

      {/* SECCIÓN DE COMETAS */}
      <section className="comets-section">
        <div className="section-header">
          <h2>🌠 Cometas del Sistema Solar</h2>
          <p>Visualiza las órbitas de cometas en 3D</p>
        </div>

        <div className="selector-section">
          <label htmlFor="cometSelect">Selecciona un cometa: </label>
          <select
            id="cometSelect"
            onChange={handleCometSelect}
            value={selectedComet?.object_name || ""}
          >
            {comets.map((c, i) => (
              <option key={i} value={c.object_name}>{c.object_name}</option>
            ))}
          </select>
        </div>

        {selectedComet && (
          <div className="comet-content">
            <div className="comet-info">
              <h3>📌 Datos del Cometa</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Nombre:</strong> {selectedComet.object_name}
                </div>
                <div className="info-item">
                  <strong>Excentricidad (e):</strong> {selectedComet.e}
                </div>
                <div className="info-item">
                  <strong>Inclinación (i°):</strong> {selectedComet.i_deg}
                </div>
                <div className="info-item">
                  <strong>Arg. Perihelio (ω°):</strong> {selectedComet.w_deg}
                </div>
                <div className="info-item">
                  <strong>Nodo Ascendente (Ω°):</strong> {selectedComet.node_deg}
                </div>
                <div className="info-item">
                  <strong>Perihelio:</strong> {selectedComet.q_au_1} AU
                </div>
                <div className="info-item">
                  <strong>Afelio:</strong> {selectedComet.q_au_2} AU
                </div>
              </div>
            </div>

            <div className="orbit-visualization">
              <h3>🌌 Órbita 3D</h3>
              <div className="canvas-container">
                <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                  <ambientLight intensity={0.3} />
                  <pointLight position={[10, 10, 10]} />
                  <Orbit3D comet={selectedComet} />
                  <OrbitControls />
                </Canvas>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;