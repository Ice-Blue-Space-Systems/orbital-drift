import React from 'react';
import { ToastContainer } from 'react-toastify';
import CesiumDashboard from './CesiumDashboard';

const App: React.FC = () => {
    return (
        <div>
            <ToastContainer />
            <CesiumDashboard />
        </div>
    );
};

export default App;