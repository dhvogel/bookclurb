import React from 'react';
import PropTypes from 'prop-types';



function ReflectionModal({ allReflections, setShowModal }) {
    return (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2">Other Members' Reflections</h3>
                <div className="reflection-list">
                    {Object.keys(allReflections).length === 0 ? (
                        <p className="text-gray-500">No reflections yet.</p>
                    ) : (
                        Object.entries(allReflections).map(([uid, { name, reflection }]) => (
                            <div key={uid} className="reflection-item">
                                <span className="reflection-uid">{name}</span>
                                <div className="reflection-text">{reflection}</div>
                                {/* Comment icon below reflection */}
                                <div className="reflection-comment-icon" style={{ marginTop: '8px' }}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button
                    className="modal-close-btn"
                    type="button"
                    onClick={() => setShowModal(false)}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

ReflectionModal.propTypes = {
    allReflections: PropTypes.object.isRequired,
    setShowModal: PropTypes.func.isRequired,
};

export default ReflectionModal;