import React from "react";

interface ReflectionModalProps {
  allReflections: Record<string, Record<string, { name: string; reflection: string }>>;
  meetingId: string;
  setShowModal: (show: boolean) => void;
}

function ReflectionModal({ allReflections, meetingId, setShowModal }: ReflectionModalProps) {
  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowModal(false)}
      style={{ minHeight: "100vh" }}
    >
      <div
        className="modal-content bg-white rounded-lg shadow-lg p-4 max-w-lg w-full mx-2 relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close button in upper right */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          type="button"
          onClick={() => setShowModal(false)}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h3 className="text-xl font-bold mb-2 text-center">
          Other Members' Reflections
        </h3>
        <div className="reflection-list space-y-4">
          {Object.keys(allReflections).length === 0 ? (
            <p className="text-gray-500 text-center">No reflections yet.</p>
          ) : (
            Object.entries(allReflections[meetingId]).map(
              ([uid, { name, reflection }]) => (
                <div
                  key={uid}
                  className="reflection-item bg-gray-100 rounded p-3"
                >
                  <span className="reflection-uid font-semibold block mb-1">
                    {name}
                  </span>
                  <div className="reflection-text text-sm mb-2">
                    {reflection}
                  </div>
                  <div
                    className="reflection-comment-icon flex justify-end"
                    style={{ marginTop: "8px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}



export default ReflectionModal;
