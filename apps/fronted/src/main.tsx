import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CatalogProvider } from './features/gallery/CatalogProvider';
import './index.css';
import { ThemeProvider } from './theme/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CatalogProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CatalogProvider>
    </ThemeProvider>
  </StrictMode>,
);
