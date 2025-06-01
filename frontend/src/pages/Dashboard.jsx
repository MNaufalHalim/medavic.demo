import React from 'react';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div>
      <div>
        <h1>Dashboard</h1>
        <p>Welcome back, {user.full_name}</p>
      </div>

      <div>
        <div>
          <h2>Quick Stats</h2>
        </div>

        <div>
          <h2>Recent Activities</h2>
        </div>

        <div>
          <h2>Notifications</h2>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;