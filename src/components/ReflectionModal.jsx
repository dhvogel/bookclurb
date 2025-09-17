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