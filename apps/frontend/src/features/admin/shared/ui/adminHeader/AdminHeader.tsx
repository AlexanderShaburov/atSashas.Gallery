import { useAuth } from '@/features/auth/authContext';
import { NavLink, useNavigate } from 'react-router-dom';
import './adminHeader.css';

export function AdminHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/admin/login');
    }

    return (
        <header className="admin-header">
            <div className="admin-header__inner">
                <div className="admin-header__brand">
                    <span className="admin-header__title">Admin</span>
                    <span className="admin-header__subtitle">AtSasH</span>
                </div>

                <nav className="admin-nav">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/admin/upload"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Upload
                    </NavLink>
                    <NavLink
                        to="/admin/catalog"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Catalog
                    </NavLink>
                    <NavLink
                        to="/admin/blocks"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Blocks
                    </NavLink>
                    <NavLink
                        to="/admin/streams"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Streams
                    </NavLink>
                    <NavLink
                        to="/admin/events"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Events
                    </NavLink>
                    <NavLink
                        to="/admin/public-stream"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Public
                    </NavLink>
                </nav>

                <div className="admin-header__user">
                    <span className="admin-header__username">
                        {user?.full_name || user?.username}
                    </span>
                    <button className="admin-header__logout" onClick={handleLogout} title="Logout">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
