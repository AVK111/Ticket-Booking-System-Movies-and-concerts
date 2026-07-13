import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ShowDetail from './pages/ShowDetail';
import MyBookings from './pages/MyBookings';
import MyWaitlist from './pages/MyWaitlist';
import OrganiserDashboard from './pages/OrganiserDashboard';
import AdminVenues from './pages/AdminVenues';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster position="top-right" />
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Built in upcoming steps */}
                    <Route path="/shows/:id" element={<ShowDetail />} />
                    <Route
                        path="/my-bookings"
                        element={
                            <ProtectedRoute roles={['customer']}>
                                <MyBookings />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-waitlist"
                        element={
                            <ProtectedRoute roles={['customer']}>
                                <MyWaitlist />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/organiser"
                        element={
                            <ProtectedRoute roles={['organiser']}>
                                <OrganiserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/venues"
                        element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminVenues />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;