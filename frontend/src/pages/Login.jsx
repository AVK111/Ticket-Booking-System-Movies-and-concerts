import React from "react";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>Welcome back</h1>

            <form onSubmit={handleSubmit} className="card">
                <div className="field">
                    <label className="label">Email</label>
                    <input
                        className="input"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </div>

                <div className="field">
                    <label className="label">Password</label>
                    <input
                        className="input"
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Logging in…' : 'Log in'}
                </button>
            </form>

            <p style={{ color: 'var(--text-dim)', marginTop: 16, fontSize: '0.9rem' }}>
                No account? <Link to="/register">Sign up</Link>
            </p>
        </div>
    );
};

export default Login;