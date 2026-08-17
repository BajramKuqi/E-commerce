import { Routes, Route, Link } from 'react-router-dom'
import ProductsPage from './pages/ProductsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useAuth } from './context/AuthContext'

function App() {
    const { user, logout } = useAuth()

    return (
        <div>
            <nav className="bg-gray-800 text-white p-4 flex gap-4 items-center">
                <Link to="/">Products</Link>
                {user ? (
                    <>
                        <span className="ml-auto">Hi, {user.fullName}</span>
                        <button onClick={logout} className="text-sm underline">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="ml-auto">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </nav>

            <Routes>
                <Route path="/" element={<ProductsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </div>
    )
}

export default App