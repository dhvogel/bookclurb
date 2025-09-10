import React from 'react';

const About = () => {
    const members = [
        { name: "Dan", img: "https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=ffffff" },
        { name: "Grant", img: "https://api.dicebear.com/7.x/bottts/png?seed=Grant&backgroundColor=ffffff" },
        { name: "Dhru", img: "https://api.dicebear.com/7.x/bottts/png?seed=Dhru&backgroundColor=ffffff" },
        { name: "Alden", img: "https://api.dicebear.com/7.x/bottts/png?seed=Alden&backgroundColor=ffffff" },
        { name: "David", img: "https://api.dicebear.com/7.x/bottts/png?seed=David&backgroundColor=ffffff" },
        { name: "Charles", img: "https://api.dicebear.com/7.x/bottts/png?seed=Charles&backgroundColor=ffffff" },
        { name: "Margaret", img: "https://api.dicebear.com/7.x/bottts/png?seed=Margaret&backgroundColor=ffffff" },
        { name: "Paul", img: "https://api.dicebear.com/7.x/bottts/png?seed=Paul&backgroundColor=ffffff" },
        { name: "Sam", img: "https://api.dicebear.com/7.x/bottts/png?seed=Sam&backgroundColor=ffffff" },
    ];

    return (
        <div>
            <h1>People</h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '20px',
                marginTop: '2rem'
            }}>
                {members.map(member => {
                    const checkMembers = ["Charles", "Grant", "Dan", "Alden"];
                    const hasRead = checkMembers.includes(member.name);
                    // Calculate books read
                    const books = [
                        { title: "Tale of Two Cities", read: ["Charles", "Grant", "Dan", "Alden"].includes(member.name) },
                        { title: "Grapes of Wrath", read: ["Grant", "Dan", "Alden", "Charles"].includes(member.name) },
                        { title: "Socialism", read: ["Dan", "Grant", "Alden"].includes(member.name) },
                        { title: "Bomber Mafia", read: ["Dan", "Grant", "Alden"].includes(member.name) },
                        { title: "The Secret Agent", read: ["Dan", "Grant", "Dhru"].includes(member.name) },
                        { title: "Catch-22", read: ["Dan", "Grant", "Dhru", "David"].includes(member.name) },
                        { title: "Valiant Ambition", read: ["Dan", "Grant", "Dhru", "David"].includes(member.name) },
                        { title: "Poor Economics", read: ["Dan", "Grant", "Dhru", "David", "Margaret", "Paul"].includes(member.name) },
                        { title: "The Fourth Turning", read: ["Dan", "Grant", "Dhru"].includes(member.name) }
                    ];
                    const booksRead = books.filter(b => b.read).length;
                    const totalBooks = books.length;

                    return (
                        <div key={member.name} style={{ textAlign: 'center' }}>
                            <img
                                src={member.img}
                                alt={member.name}
                                style={{ borderRadius: '50%', width: 100, height: 100, objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                                referrerPolicy="no-referrer"
                            />
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.1em', letterSpacing: '1px' }}>{member.name}</div>
                            <table style={{
                                width: '100%',
                                marginTop: '1rem',
                                borderCollapse: 'separate',
                                borderSpacing: '0 6px',
                                background: 'linear-gradient(135deg, #f8fafc 70%, #e0e7ff 100%)',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(60,60,120,0.07)'
                            }}>
                                <tbody>
                                    {books.map((book, idx) => (
                                        <tr key={book.title} style={{
                                            background: book.read ? 'rgba(220,255,220,0.6)' : 'rgba(255,230,230,0.5)',
                                            borderRadius: '8px',
                                            transition: 'background 0.2s'
                                        }}>
                                            <td style={{
                                                fontWeight: 'bold',
                                                padding: '6px 8px',
                                                border: 'none',
                                                borderRadius: '8px 0 0 8px',
                                                fontFamily: 'cursive',
                                                fontSize: '0.98em'
                                            }}>
                                                {book.title}
                                            </td>
                                            <td style={{
                                                padding: '6px 8px',
                                                border: 'none',
                                                borderRadius: '0 8px 8px 0',
                                                color: book.read ? '#22c55e' : '#ef4444',
                                                fontSize: '1.3em',
                                                textAlign: 'center'
                                            }}>
                                                {book.read ? '🎉' : '💤'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td style={{
                                            fontWeight: 'bold',
                                            padding: '6px 8px',
                                            border: 'none',
                                            borderRadius: '8px 0 0 8px',
                                            background: '#facc15',
                                            color: '#3b3b3b',
                                            fontFamily: 'cursive'
                                        }}>Participation</td>
                                        <td style={{
                                            padding: '6px 8px',
                                            border: 'none',
                                            borderRadius: '0 8px 8px 0',
                                            background: '#fde68a',
                                            color: '#92400e',
                                            fontWeight: 'bold',
                                            fontSize: '1.1em',
                                            textAlign: 'center'
                                        }}>
                                            {booksRead}/{totalBooks} 📚
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default About;