import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CitaMotivacional = () => {
    const [cita, setCita] = useState('');
    const [autor, setAutor] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Se aísla el llamado a la API externa dentro del contexto del componente
        const fetchCita = async () => {
            try {
                // DummyJSON cuenta con un endpoint habilitado (CORS Safe) altamente disponible.
                const response = await axios.get('https://dummyjson.com/quotes/random');
                setCita(response.data.quote);
                setAutor(response.data.author);
                setCargando(false);
            } catch (err) {
                console.error("Fallo al contactar orbe de citas motivacionales:", err);
                setError(true);
                setCargando(false);
            }
        };

        fetchCita();
    }, []);

    // En un Dashboard ejecutivo, los módulos auxiliares externos que fallen no deben truncar
    // la experiencia principal del usuario, por ende, fallamos silenciosamente.
    if (error) return null; 

    return (
        <div style={{
            padding: '16px 24px', 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
            color: '#f8fafc', 
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 12,color:'#38bdf8', textTransform:'uppercase' }}>💡 Dosis de Inspiración</h4>
            
            {cargando ? (
                <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: 14 }}>Sincronizando sabiduría global...</div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                    <div style={{ fontStyle: 'italic', fontSize: '16px', lineHeight: '1.4' }}>
                        "{cita}"
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', whiteSpace: 'nowrap', marginTop: 4 }}>
                        — {autor}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CitaMotivacional;
