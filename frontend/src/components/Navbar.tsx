import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    ShoppingCart,
    Package,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Store,
    ShoppingBag,
    Boxes,
    ClipboardList,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const BRAND_NAME = 'Store'

function Navbar() {
    const { user, logout } = useAuth()
    const { cart } = useCart()
    const navigate = useNavigate()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
    const isAdmin = user?.roles.includes('Admin')

    function navLinkClass({ isActive }: { isActive: boolean }) {
        return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`
    }

    function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
        return `flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium ${
            isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
        }`
    }

    function handleLogout() {
        setUserMenuOpen(false)
        logout()
        navigate('/')
    }

    const initials = user?.fullName
        ? user.fullName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : ''

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="lg:hidden text-gray-500"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <NavLink to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                                <Store size={18} className="text-white" />
                            </div>
                            <span className="font-bold text-gray-900 text-lg whitespace-nowrap">{BRAND_NAME}</span>
                        </NavLink>
                    </div>

                    <div className="hidden lg:flex items-center justify-center gap-2">
                        <NavLink to="/" end className={navLinkClass}>
                            <ShoppingBag size={16} />
                            Products
                        </NavLink>
                        {user && (
                            <NavLink to="/orders" className={navLinkClass}>
                                <Package size={16} />
                                Orders
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin/products" className={navLinkClass}>
                                <Boxes size={16} />
                                Admin Products
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin/orders" className={navLinkClass}>
                                <ClipboardList size={16} />
                                Admin Orders
                            </NavLink>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        {user && (
                            <NavLink to="/cart" className="relative text-gray-500 hover:text-gray-900">
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                            </NavLink>
                        )}

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold flex items-center justify-center">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-700 whitespace-nowrap">
                                        {user.fullName}
                                    </span>
                                    <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                                            <div className="px-3 py-2 border-b border-gray-100 sm:hidden">
                                                <p className="text-sm font-medium text-gray-700">{user.fullName}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <LogOut size={14} />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <NavLink to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Register
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>

                {mobileOpen && (
                    <div className="lg:hidden flex flex-col gap-1 pb-4">
                        <NavLink to="/" end onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                            <ShoppingBag size={16} />
                            Products
                        </NavLink>
                        {user && (
                            <NavLink to="/orders" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                                <Package size={16} />
                                Orders
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin/products" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                                <Boxes size={16} />
                                Admin Products
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin/orders" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                                <ClipboardList size={16} />
                                Admin Orders
                            </NavLink>
                        )}
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar