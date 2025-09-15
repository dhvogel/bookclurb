import React from 'react';
import HeaderBar from './HeaderBar';

const Meetings = ({ user }) => {
    return (
        <div>
            <HeaderBar user={user} />
            <div className="p-4" style={{marginTop: '100px'}}>
                <h2 className="text-2xl font-bold mb-4">Upcoming Meetings</h2>
                {/* Improved table styling */}
                <style>
                    {`
                        .meetings-table {
                            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                            border-radius: 12px;
                            overflow: hidden;
                            background: #fff;
                        }
                        .meetings-table th, .meetings-table td {
                            transition: background 0.2s;
                            padding-left: 24px !important;
                            padding-right: 24px !important;
                        }
                        .meetings-table tbody tr:hover {
                            background: #f3f4f6;
                        }
                        .meetings-table th {
                            background: #f9fafb;
                            font-weight: 600;
                            color: #374151;
                        }
                        .meetings-table textarea {
                            background: #f9fafb;
                            border: 1px solid #e5e7eb;
                            transition: border 0.2s;
                        }
                        .meetings-table textarea:focus {
                            border: 1.5px solid #6366f1;
                            outline: none;
                            background: #fff;
                        }
                    `}
                </style>
                <table className="meetings-table w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Meeting Time</th>
                            <th className="border border-gray-300 p-2 text-left">Reading</th>
                            <th className="border border-gray-300 p-2 text-left">Reflection</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-2">Thu, 9/18, 6:00 PM EDT</td>
                            <td className="border border-gray-300 p-2">Empire of Pain, Ch 1-3</td>
                            <td className="border border-gray-300 p-2">
                                <textarea
                                    className="border rounded p-2"
                                    style={{ width: '100%', minWidth: '400px' }}
                                    rows={6}
                                    placeholder="Enter your reflection..."
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Meetings;