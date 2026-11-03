import React, { useState } from 'react';
import { predictPrice } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

const PricePrediction = () => {
  const [formData, setFormData] = useState({
    crop_name: 'Wheat',
    mandi_location: 'Delhi',
    quantity_kg: 500,
    number_of_days: 7
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictPrice(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({ error: "Prediction failed. Is backend running?" });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp color="var(--primary-color)" /> Prediction Parameters
        </h2>
        <form onSubmit={handlePredict}>
          <div className="form-group">
            <label>Crop Type</label>
            <select name="crop_name" value={formData.crop_name} onChange={handleChange}>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Corn">Corn</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mandi Location</label>
            <input type="text" name="mandi_location" value={formData.mandi_location} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Quantity (kg)</label>
            <input type="number" name="quantity_kg" value={formData.quantity_kg} onChange={handleChange} required min="1" />
          </div>
          <div className="form-group">
            <label>Number of Days</label>
            <input type="number" name="number_of_days" value={formData.number_of_days} onChange={handleChange} required min="1" max="60" />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Analyzing Data...' : 'Forecast Price'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {result && !result.error && (
          <>
            <div className="card" style={{ borderTop: `4px solid ${result.trend === 'Falling' ? '#ef4444' : result.trend === 'Rising' ? '#22c55e' : '#3b82f6'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Market Insight ({formData.crop_name} - {formData.mandi_location})</h3>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: result.trend === 'Falling' ? '#ef4444' : result.trend === 'Rising' ? '#22c55e' : '#3b82f6', fontWeight: 'bold' }}>
                     Trend: {result.trend}
                  </p>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.25rem' }}>Action: {result.action}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
                <div>
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>Today:</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{result.day_1_price}/kg</p>
                </div>
                <div>
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>After {result.target_day} days:</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{result.target_day_price}/kg</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                    {result.profit_loss_per_kg < 0 ? 'Loss if delayed:' : 'Gain if delayed:'}
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: result.profit_loss_per_kg < 0 ? '#ef4444' : '#22c55e' }}>
                    ₹{Math.abs(result.profit_loss_per_kg)}/kg
                  </p>
                </div>
                <div>
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>Best Day to Sell:</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{result.best_day}</p>
                  
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem', marginTop: '0.5rem' }}>Worst Day:</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{result.worst_day}</p>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: result.trend === 'Falling' ? '#fef2f2' : result.trend === 'Rising' ? '#f0fdf4' : '#eff6ff', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Recommendation: {result.recommendation}</p>
                <p style={{ color: '#4b5563' }}>Reason: {result.reason}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                <p>Confidence: <span style={{ fontWeight: 'bold' }}>{result.confidence}</span></p>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Price Trend Visualization
                <span className="badge" style={{ fontSize: '0.8rem', backgroundColor: result.trend === 'Falling' ? '#fee2e2' : result.trend === 'Rising' ? '#dcfce7' : '#dbeafe', color: result.trend === 'Falling' ? '#991b1b' : result.trend === 'Rising' ? '#166534' : '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>
                  Line color → {result.trend} trend
                </span>
              </h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.graph_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={['dataMin - 50', 'dataMax + 50']} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      formatter={(value) => [`₹${value}/kg`, 'Predicted Price']} 
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={result.trend === 'Falling' ? '#ef4444' : result.trend === 'Rising' ? '#22c55e' : '#3b82f6'} 
                      strokeWidth={3} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 8 }} 
                      name={`${formData.crop_name} Price Trend`} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {result && result.error && (
          <div className="card" style={{ backgroundColor: '#FFF5F5', border: '1px solid var(--error)', color: 'var(--error)' }}>
            Error: {result.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricePrediction;
