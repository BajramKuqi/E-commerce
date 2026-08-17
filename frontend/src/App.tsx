import { Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ShoppingCart, Package } from 'lucide-react'
import ProductsPage from './pages/ProductsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { useCart } from './context/CartContext'

function App() {
    const { user, logout } = useAuth()
    const { refreshCart } = useCart()

    useEffect(() => {
        refreshCart()
    }, [user, refreshCart])

    return (
        <div>
            <nav className="bg-gray-800 text-white p-4 flex gap-4 items-center">
                <Link to="/">Products</Link>
                {user && (
                    <Link to="/cart" className="flex items-center">
                        <ShoppingCart size={20} />
                    </Link>
                )}
                {user && (
                    <Link to="/orders" className="flex items-center">
                        <Package size={20} />
                    </Link>
                )}
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
                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute>
                            <CartPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute>
                            <CheckoutPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute>
                            <OrdersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders/:id"
                    element={
                        <ProtectedRoute>
                            <OrderDetailPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    )
}

export default App