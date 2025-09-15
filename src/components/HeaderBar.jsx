import React from 'react';
import { useLocation } from 'react-router-dom';

const HeaderBar = ({ user }) => {
    const location = useLocation();
    const isPeople = location.pathname === '/people';

    // Map emails to member info
    const emailToMember = {
        'dhvogel2468@gmail.com': { name: 'Dan', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=ffffff' },
        'alden@sombookclub.com': { name: 'Alden', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Alden&backgroundColor=ffffff' },
        'charles@sombookclub.com': { name: 'Charles', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Charles&backgroundColor=ffffff' },
        'david@sombookclub.com': { name: 'David', img: 'https://api.dicebear.com/7.x/bottts/png?seed=David&backgroundColor=ffffff' },
        'dhru@sombookclub.com': { name: 'Dhru', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Dhru&backgroundColor=ffffff' },
        'grant@sombookclub.com': { name: 'Grant', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Grant&backgroundColor=ffffff' },
        'margaret@sombookclub.com': { name: 'Margaret', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Margaret&backgroundColor=ffffff' },
        'sam@sombookclub.com': { name: 'Sam', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Sam&backgroundColor=ffffff' },
        'paul@sombookclub.com': { name: 'Paul', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Paul&backgroundColor=ffffff' },
        'dan@sombookclub.com': { name: 'Dan', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=ffffff' }
    };
    // Determine member info based on user email
    const member = user && emailToMember[user.email];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            background: 'linear-gradient(90deg, #00356B 0%, #00509E 100%)',
            color: 'white',
            padding: '1rem 0',
            boxShadow: '0 2px 8px rgba(60,60,120,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000
        }}>
            <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '2px' }}>
                <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>SOM Book Club</a>
            </h1>
            <nav style={{ display: 'flex', gap: '1rem' }}>
                <a
                    href="/people"
                    style={{
                        color: isPeople ? '#FFD700' : 'white',
                        background: isPeople ? 'rgba(255,255,255,0.08)' : 'transparent',
                        padding: '0.5rem 1.2rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: isPeople ? 'bold' : 'normal',
                        fontSize: '1.1rem',
                        letterSpacing: '1px',
                        transition: 'background 0.2s, color 0.2s'
                    }}
                >
                    People
                </a>
                {user && (
                    <a
                        href="/meetings"
                        style={{
                            color: location.pathname === '/meetings' ? '#FFD700' : 'white',
                            background: location.pathname === '/meetings' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            padding: '0.5rem 1.2rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: location.pathname === '/meetings' ? 'bold' : 'normal',
                            fontSize: '1.1rem',
                            letterSpacing: '1px',
                            transition: 'background 0.2s, color 0.2s'
                        }}
                    >
                        Meetings
                    </a>
                )}
                {user ? (
                    <a
                        href="/profile"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '50%',
                            background: location.pathname === '/profile' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            border: '2px solid #FFD700',
                            transition: 'background 0.2s, border 0.2s'
                        }}
                        title={user.displayName || user.email}
                    >
                        <img
                            src={member ? member.img : user.photoURL || 'https://via.placeholder.com/40'}
                            alt="Profile"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid white'
                            }}
                        />
                    </a>
                ) : (
                    <a
                        href="/login"
                        style={{
                            color: location.pathname === '/login' ? '#FFD700' : 'white',
                            background: location.pathname === '/login' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            padding: '0.5rem 1.2rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: location.pathname === '/login' ? 'bold' : 'normal',
                            fontSize: '1.1rem',
                            letterSpacing: '1px',
                            transition: 'background 0.2s, color 0.2s'
                        }}
                    >
                        Login
                    </a>
                )}
            </nav>
        </div>
    );
};

export default HeaderBar;