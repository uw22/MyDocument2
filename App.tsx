import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardScreen from './pages/DashboardScreen';
import CategoriesScreen from './pages/CategoriesScreen';
import SettingsScreen from './pages/SettingsScreen';
import DetailsScreen from './pages/DetailsScreen';
import ScanScreen from './pages/ScanScreen';
import CategoryDetailsScreen from './pages/CategoryDetailsScreen';
import SecureFolderScreen from './pages/SecureFolderScreen';
import FavoritesScreen from './pages/FavoritesScreen';
import WelcomeScreen from './pages/WelcomeScreen';

const App: React.FC = () => {
    return (
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<DashboardScreen />} />
                <Route path="/welcome" element={<WelcomeScreen />} />
                <Route path="/categories" element={<CategoriesScreen />} />
                <Route path="/category/:title" element={<CategoryDetailsScreen />} />
                <Route path="/secure" element={<SecureFolderScreen />} />
                <Route path="/favorites" element={<FavoritesScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/details/:id" element={<DetailsScreen />} />
                <Route path="/scan" element={<ScanScreen />} />
            </Routes>
        </MemoryRouter>
    );
};

export default App;