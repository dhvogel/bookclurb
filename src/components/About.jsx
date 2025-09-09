import React from 'react';

const About = () => {
    const members = [
        { name: "Alden", img: "https://randomuser.me/api/portraits/men/32.jpg" },
        { name: "Charles", img: "https://randomuser.me/api/portraits/men/45.jpg" },
        { name: "David", img: "https://randomuser.me/api/portraits/men/54.jpg" },
        { name: "Dhru", img: "https://randomuser.me/api/portraits/women/76.jpg" },
        { name: "Grant", img: "https://randomuser.me/api/portraits/men/85.jpg" },
        { name: "Margaret", img: "https://randomuser.me/api/portraits/women/68.jpg" },
        { name: "Sam", img: "https://randomuser.me/api/portraits/women/23.jpg" },
        { name: "Paul", img: "https://randomuser.me/api/portraits/men/12.jpg" },
        { name: "Dan", img: "https://randomuser.me/api/portraits/men/34.jpg" },
    ];

    return (
        <div>
            <h1>About</h1>
            <p>This is the About page of the application.</p>
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
                        { title: "Tale of Two Cities", read: hasRead },
                        { title: "Grapes of Wrath", read: ['Grant', 'Dan', 'Alden'].includes(member.name) }
                    ];
                    const booksRead = books.filter(b => b.read).length;
                    const totalBooks = books.length;

                    return (
                        <div key={member.name} style={{ textAlign: 'center' }}>
                            <img
                                src={member.img}
                                alt={member.name}
                                style={{ borderRadius: '50%', width: 100, height: 100, objectFit: 'cover' }}
                            />
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{member.name}</div>
                            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', border: '1px solid #ddd', padding: '4px' }}>Tale of Two Cities</td>
                                        <td style={{ border: '1px solid #ddd', padding: '4px', color: hasRead ? 'green' : 'red', fontSize: '1.2em' }}>
                                            {hasRead ? '✔️' : '❌'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', border: '1px solid #ddd', padding: '4px' }}>Grapes of Wrath</td>
                                        <td style={{ border: '1px solid #ddd', padding: '4px', color: ['Grant', 'Dan', 'Alden'].includes(member.name) ? 'green' : 'red', fontSize: '1.2em' }}>
                                            {['Grant', 'Dan', 'Alden'].includes(member.name) ? '✔️' : '❌'}
                                        </td>
                                    </tr>
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