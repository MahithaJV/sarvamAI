import React, { useState, useEffect } from 'react';
import { getSchemes } from '../api';
import { BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';

const GovtSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchemes()
      .then(data => {
        setSchemes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Government Schemes & Subsidies</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Explore financial aid and programs available for farmers.</p>
      </div>

      {loading ? (
        <div>Loading schemes...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {schemes.map(scheme => (
            <div key={scheme.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#E6FFFA', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <ShieldCheck color="var(--primary-color)" size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{scheme.name}</h3>
                  <span style={{ display: 'inline-block', backgroundColor: '#EDF2F7', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Benefit: {scheme.amount}
                  </span>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1, marginBottom: '1.5rem' }}>
                {scheme.description}
              </p>
              
              <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="btn" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#EDF2F7', color: 'var(--text-primary)', textDecoration: 'none', boxSizing: 'border-box' }}>
                View details <ExternalLink size={16} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovtSchemes;
