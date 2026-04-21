import { useAuth } from '@/features/auth/authContext';
import { useGuardedNavigate } from '@/features/admin/shared/hooks/useGuardedNavigate';
import { GuardedNavLink } from './GuardedNavLink';
import './adminHeader.css';

export function AdminHeader() {
    const { user, logout } = useAuth();
    const guardedNavigate = useGuardedNavigate();

    async function handleLogout() {
        await logout();
        guardedNavigate('/admin/login');
    }

    return (
        <header className="admin-header">
            <div className="admin-header__inner">
                <div className="admin-header__brand">
                    <span className="admin-header__title">Admin</span>
                    <span className="admin-header__subtitle">AtSasH</span>
                </div>

                <nav className="admin-nav">
                    <GuardedNavLink
                        to="/admin"
                        end
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Dashboard
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/upload"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Upload
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/catalog"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Catalog
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/blocks"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Blocks
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/streams"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Streams
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/event-pages"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Events
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/media"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Media
                    </GuardedNavLink>
                    <GuardedNavLink
                        to="/admin/home"
                        className={({ isActive }) =>
                            'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                        }
                    >
                        Homepage
                    </GuardedNavLink>
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
