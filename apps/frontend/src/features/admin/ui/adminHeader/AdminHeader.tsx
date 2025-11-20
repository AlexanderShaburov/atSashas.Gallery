import { NavLink } from 'react-router-dom';
import './adminHeader.css';

export function AdminHeader() {
    return (
        <header className="admin-header">
            <div className="admin-header__inner">
                <div className="admin-header__brand">
                    <span className="admin-header__title">Admin</span>
                    <span className="admin-header__subtitle">SashaGallery</span>
                </div>

                <nav className="admin-nav">
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
                            to="/admin/streams"
                            className={({ isActive }) =>
                                'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                            }
                        >
                            Streams
                        </NavLink>
                        <NavLink
                            to="/admin/blocks"
                            className={({ isActive }) =>
                                'admin-nav__link' + (isActive ? ' admin-nav__link--active' : '')
                            }
                        >
                            Blocks
                        </NavLink>
                    </nav>
                </nav>
            </div>
        </header>
    );
}
