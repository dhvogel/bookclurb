import React from 'react';

const About = () => {
    const members = [
        { name: "Alden", img: "https://api.dicebear.com/7.x/bottts/png?seed=Alden&backgroundColor=ffffff" },
        { name: "Charles", img: "https://api.dicebear.com/7.x/bottts/png?seed=Charles&backgroundColor=ffffff" },
        { name: "David", img: "https://api.dicebear.com/7.x/bottts/png?seed=David&backgroundColor=ffffff" },
        { name: "Dhru", img: "https://api.dicebear.com/7.x/bottts/png?seed=Dhru&backgroundColor=ffffff" },
        { name: "Grant", img: "https://api.dicebear.com/7.x/bottts/png?seed=Grant&backgroundColor=ffffff" },
        { name: "Margaret", img: "https://api.dicebear.com/7.x/bottts/png?seed=Margaret&backgroundColor=ffffff" },
        { name: "Sam", img: "https://api.dicebear.com/7.x/bottts/png?seed=Sam&backgroundColor=ffffff" },
        { name: "Paul", img: "https://api.dicebear.com/7.x/bottts/png?seed=Paul&backgroundColor=ffffff" },
        { name: "Dan", img: "https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=ffffff" },
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
                        { title: "Tale of Two Cities", read: ["Charles", "Grant", "Dan", "Alden"].includes(member.name) ? true : false },
                        { title: "Grapes of Wrath", read: ["Grant", "Dan", "Alden"].includes(member.name) ? true : false },
                        { title: "Socialism", read: false },
                        { title: "Bomber Mafia", read: false },
                        { title: "The Secret Agent", read: false },
                        { title: "Catch-22", read: false },
                        { title: "Valiant Ambition", read: false },
                        { title: "Poor Economics", read: false },
                        { title: "The Fourth Turning", read: false }
                    ];
                    const booksRead = books.filter(b => b.read).length;
                    const totalBooks = books.length;

                    return (
                        <div key={member.name} style={{ textAlign: 'center' }}>
                            <img
                                src={member.img}
                                alt={member.name}
                                style={{ borderRadius: '50%', width: 100, height: 100, objectFit: 'cover' }}
                                referrerPolicy="no-referrer"
                            />
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{member.name}</div>
                            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {books.map((book, idx) => (
                                        <tr key={book.title}>
                                            <td style={{ fontWeight: 'bold', border: '1px solid #ddd', padding: '4px' }}>
                                                {book.title}
                                            </td>
                                            <td style={{
                                                border: '1px solid #ddd',
                                                padding: '4px',
                                                color: book.read ? 'green' : 'red',
                                                fontSize: '1.2em'
                                            }}>
                                                {book.read ? '✔️' : '❌'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td style={{ fontWeight: 'bold', border: '1px solid #ddd', padding: '4px' }}>Participation</td>
                                        <td style={{ border: '1px solid #ddd', padding: '4px' }}>
                                            {booksRead}/{totalBooks}
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