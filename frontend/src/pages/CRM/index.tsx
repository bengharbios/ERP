import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard/Dashboard';
import LeadsList from './Leads/LeadsList';
import LeadDetail from './Leads/LeadDetail';
import Pipeline from './Pipeline/Pipeline';
import ActivitiesList from './Activities/ActivitiesList';
import TeamsList from './Teams/TeamsList';
import TeamDetail from './Teams/TeamDetail';
import CRMNav from './Components/CRMNav';
import './CRM.css';

const CRM: React.FC = () => {
    return (
        <div>
            <CRMNav />
            <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="leads" element={<LeadsList />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="activities" element={<ActivitiesList />} />
                <Route path="teams" element={<TeamsList />} />
                <Route path="teams/:id" element={<TeamDetail />} />
            </Routes>
        </div>
    );
};

export default CRM;
