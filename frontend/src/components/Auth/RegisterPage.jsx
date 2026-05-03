// frontend/src/components/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'cashier' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Registered! Please confirm your email then log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo-shopdesk.svg" alt="ShopDesk logo" />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" required value={form.full_name} onChange={set('full_name')} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required minLength={6} value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={form.role} onChange={set('role')}>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}
