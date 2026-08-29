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

const BRAND_NAME = 'Store'

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
        return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isActive
                ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/40'
                : 'text-[#8C857A] border-transparent hover:bg-[#242019] hover:text-[#F5F1EA]'
        }`
    }

    function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
        return `flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium border ${
            isActive
                ? 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/40'
                : 'text-[#8C857A] border-transparent hover:bg-[#242019]'
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
        <nav className="bg-[#1C1A17] border-b border-[#2E2A24] sticky top-0 z-40">
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="lg:hidden text-[#8C857A]"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <NavLink to="/" className="flex items-center gap-2">
                            <div
                                className="relative w-8 h-8 bg-[#F97316] flex items-center justify-center shrink-0"
                                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
                            >
                                <Store size={16} className="text-[#161513]" />
                            </div>
                            <span className="text-[#F5F1EA] text-lg font-bold whitespace-nowrap">
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
                            <NavLink
                                to="/cart"
                                className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                                    isCartActive
                                        ? 'bg-[#F97316]/10 text-[#F97316]'
                                        : 'text-[#8C857A] hover:bg-[#242019] hover:text-[#F5F1EA]'
                                }`}
                            >
                                <ShoppingCart size={20} fill={isCartActive ? 'currentColor' : 'none'} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#F97316] text-[#161513] text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#1C1A17]">
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
                                    <div className="w-8 h-8 rounded-full bg-[#161513] text-[#F97316] border border-[#2E2A24] text-xs font-semibold flex items-center justify-center">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-[#F5F1EA] whitespace-nowrap">
                                        {user.fullName}
                                    </span>
                                    <ChevronDown size={14} className="text-[#5C574E] hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-44 bg-[#1C1A17] border border-[#2E2A24] rounded-lg shadow-lg shadow-black/40 py-1 z-20">
                                            <div className="px-3 py-2 border-b border-[#2E2A24] sm:hidden">
                                                <p className="text-sm font-medium text-[#F5F1EA]">{user.fullName}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-3 py-2 text-sm text-[#8C857A] hover:bg-[#242019] hover:text-[#F5F1EA] flex items-center gap-2"
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
                                <NavLink to="/login" className="text-sm font-medium text-[#8C857A] hover:text-[#F5F1EA] whitespace-nowrap">
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="text-sm font-semibold bg-[#F97316] hover:bg-[#EA580C] text-[#161513] px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
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