import React from 'react';
import HeaderBar from './HeaderBar';

const Profile = ({ user }) => (
    <>
        <HeaderBar user={user} />
        <h1>Profile</h1>
        <div style={{ marginTop: '5%' }}>
            {user ? `User logged in: ${user.email}` : "no user logged in"}
        </div>
    </>
);

export default Profile;