import { useState } from 'react';
import NavbarShop from './components/NavbarShop';
import Footer from './components/Footer';
import ListManager from './components/ListManager/ListManager';
import PriceCalculator from './components/PriceCalculator/PriceCalculator';
import './index.css';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('lists');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <NavbarShop
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="flex-grow-1 container mt-4">
        {activeTab === 'lists'
          ? <ListManager searchTerm={searchTerm} />
          : <PriceCalculator />}
      </div>

      <Footer />
    </div>
  );
}
