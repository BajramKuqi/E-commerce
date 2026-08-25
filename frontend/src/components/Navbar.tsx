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
        return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isActive
                ? 'bg-[#B5502E]/10 text-[#B5502E] border-[#B5502E]/40'
                : 'text-[#7A6A5A] border-transparent hover:bg-[#F6EEE2] hover:text-[#2B1D14]'
        }`
    }

    function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
        return `flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium border ${
            isActive
                ? 'bg-[#B5502E]/10 text-[#B5502E] border-[#B5502E]/40'
                : 'text-[#7A6A5A] border-transparent hover:bg-[#F6EEE2]'
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
        <nav className="bg-white border-b border-[#E4D5C1] sticky top-0 z-40">
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="lg:hidden text-[#7A6A5A]"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <NavLink to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#B5502E] flex items-center justify-center shrink-0">
                                <Store size={18} className="text-white" />
                            </div>
                            <span
                                className="text-[#2B1D14] text-lg whitespace-nowrap"
                                style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
                            >
                                {BRAND_NAME}
                            </span>
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
                            <NavLink to="/cart" className="relative text-[#7A6A5A] hover:text-[#B5502E] transition-colors">
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-[#B5502E] text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
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
                                    <div className="w-8 h-8 rounded-full bg-[#B5502E]/10 text-[#B5502E] border border-[#B5502E]/30 text-xs font-semibold flex items-center justify-center">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-[#2B1D14] whitespace-nowrap">
                                        {user.fullName}
                                    </span>
                                    <ChevronDown size={14} className="text-[#B8A896] hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E4D5C1] rounded-lg shadow-lg py-1 z-20">
                                            <div className="px-3 py-2 border-b border-[#F0E6D6] sm:hidden">
                                                <p className="text-sm font-medium text-[#2B1D14]">{user.fullName}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 text-sm text-[#7A6A5A] hover:bg-[#F6EEE2] flex items-center gap-2"
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
                                <NavLink to="/login" className="text-sm font-medium text-[#7A6A5A] hover:text-[#2B1D14] whitespace-nowrap">
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="text-sm font-medium bg-[#B5502E] hover:bg-[#9C4325] border border-[#8B3D1F] text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
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