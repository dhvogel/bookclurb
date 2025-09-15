import React from 'react';
import HeaderBar from './HeaderBar';
import { getAuth, signOut } from "firebase/auth";

const Profile = ({ user }) => {
    const handleLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <>
            <HeaderBar user={user} />
            <h1>Profile</h1>
            <div style={{ marginTop: '5%' }}>
                {user ? (
                    <>
                        User logged in: {user.email}
                        <br />
                        <button onClick={handleLogout} style={{ marginTop: '1em' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    "no user logged in"
                )}
            </div>
        </>
    );
};

export default Profile;