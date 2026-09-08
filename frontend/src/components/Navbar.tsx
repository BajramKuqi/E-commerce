import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
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

const BRAND_NAME = 'Vatra'
const BRAND_TAGLINE = 'Pazarit'

function Navbar() {
    const { user, logout } = useAuth()
    const { cart } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
    const isAdmin = user?.roles.includes('Admin')
    const isCartActive = location.pathname === '/cart'

    function navLinkClass({ isActive }: { isActive: boolean }) {
        return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
                ? 'bg-[#1F5C50]/10 text-[#1F5C50]'
                : 'text-[#756B5A] hover:bg-[#FBF8F2] hover:text-[#262019]'
        }`
    }

    function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
        return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            isActive
                ? 'bg-[#1F5C50]/10 text-[#1F5C50]'
                : 'text-[#756B5A] hover:bg-[#FBF8F2]'
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
        <nav className="bg-white border-b border-[#E6DCC8] sticky top-0 z-40" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                .heading-font { font-family: 'Space Grotesk', sans-serif; }
            `}</style>
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="lg:hidden text-[#756B5A]"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <NavLink to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#1F5C50] flex items-center justify-center shrink-0">
                                <Store size={16} className="text-white" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-[#262019] text-lg font-bold whitespace-nowrap heading-font">
                                    {BRAND_NAME}
                                </span>
                                <span className="text-[#A79B85] text-[10px] font-medium whitespace-nowrap tracking-wide uppercase -mt-1">
                                    {BRAND_TAGLINE}
                                </span>
                            </div>
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
                                Admin products
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin/orders" className={navLinkClass}>
                                <ClipboardList size={16} />
                                Admin orders
                            </NavLink>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        {user && (
                            <NavLink
                                to="/cart"
                                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                                    isCartActive
                                        ? 'bg-[#1F5C50]/10 text-[#1F5C50]'
                                        : 'text-[#756B5A] hover:bg-[#FBF8F2] hover:text-[#262019]'
                                }`}
                            >
                                <ShoppingCart size={20} fill={isCartActive ? 'currentColor' : 'none'} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#B5402E] text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
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
                                    <div className="w-8 h-8 rounded-full bg-[#FBF8F2] text-[#1F5C50] border border-[#E6DCC8] text-xs font-semibold flex items-center justify-center">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-[#262019] whitespace-nowrap">
                                        {user.fullName}
                                    </span>
                                    <ChevronDown size={14} className="text-[#A79B85] hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E6DCC8] rounded-xl shadow-lg shadow-black/10 py-1 z-20">
                                            <div className="px-3 py-2 border-b border-[#E6DCC8] sm:hidden">
                                                <p className="text-sm font-medium text-[#262019]">{user.fullName}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 text-sm text-[#756B5A] hover:bg-[#FBF8F2] hover:text-[#262019] flex items-center gap-2 rounded-lg"
                                            >
                                                <LogOut size={14} />
                                                Log out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <NavLink
                                    to="/login"
                                    className="text-sm font-semibold bg-[#1F5C50] hover:bg-[#164941] text-white px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                                >
                                    Log in
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="text-sm font-semibold bg-[#B5402E] hover:bg-[#8F2F21] text-white px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
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
                                Admin products
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin/orders" onClick={() => setMobileOpen(false)} className={mobileNavLinkClass}>
                                <ClipboardList size={16} />
                                Admin orders
                            </NavLink>
                        )}
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar