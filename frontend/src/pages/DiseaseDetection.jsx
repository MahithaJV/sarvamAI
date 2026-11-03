import React, { useState } from 'react';
import { detectDisease } from '../api';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

const DiseaseDetection = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await detectDisease(file);
      setResult(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Upload Crop Image</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Take a clear picture of the leaf or crop to detect potential diseases.
        </p>

        {!preview ? (
          <label className="upload-area" style={{ display: 'block' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <UploadCloud size={48} color="var(--primary-color)" />
            <p>Click or drag and drop image here</p>
          </label>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img src={preview} alt="Crop Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.5rem', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={handleScan} disabled={loading}>
                {loading ? 'Scanning via AI...' : 'Analyze Image'}
              </button>
              <button className="btn" style={{ backgroundColor: 'var(--text-secondary)' }} onClick={() => setPreview(null)} disabled={loading}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="card" style={{ borderLeft: result.disease === 'Healthy' ? '4px solid var(--success)' : '4px solid var(--error)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: result.disease === 'Healthy' ? 'var(--success)' : 'var(--error)' }}>
            {result.disease === 'Healthy' ? <CheckCircle /> : <AlertCircle />} 
            Detection Result
          </h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Predicted Condition:</strong> {result.disease}</p>
            <p><strong>AI Confidence:</strong> {result.confidence}%</p>
            <p style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#F7FAFC', borderRadius: '0.5rem' }}>
              <strong>Recommended Action:</strong><br/>
              {result.action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
