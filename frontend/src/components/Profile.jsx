import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('loggedInUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="position-absolute top-50 start-50 translate-middle border shadow-lg p-5 rounded bg-white" style={{ width: '600px' }}>
      <h2 className="display-6 mb-4 text-center"><b>User Profile</b></h2>
      <div className="fs-4">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Username:</strong> {user.username || 'N/A'}</p>
        <p><strong>Age:</strong> {user.age || 'N/A'}</p>
        <p><strong>Phone No.</strong> {user.phone || 'N/A'}</p>
      </div>
    </div>
  );
}

export default Profile;