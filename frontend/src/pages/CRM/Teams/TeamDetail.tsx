import React from 'react';
import { useParams } from 'react-router-dom';

const TeamDetail: React.FC = () => {
    const { id } = useParams();

    return (
        <div className="crm-card">
            <h2>تفاصيل الفريق</h2>
            <p>قيد التطوير - Team ID: {id}</p>
        </div>
    );
};

export default TeamDetail;
