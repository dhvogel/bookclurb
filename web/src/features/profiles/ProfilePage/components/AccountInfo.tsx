import React from 'react';
import { User } from 'firebase/auth';

interface AccountInfoProps {
  user: User;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ user }) => {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ 
        margin: "0 0 0.75rem 0", 
        fontSize: "1.1rem", 
        fontWeight: "600",
        color: "#495057"
      }}>
        Account Information
      </h3>
      <div style={{
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        padding: "1rem",
        border: "1px solid #e9ecef"
      }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ 
            display: "block", 
            fontSize: "0.875rem", 
            fontWeight: "500",
            color: "#6c757d",
            marginBottom: "0.25rem"
          }}>
            Email Address
          </label>
          <div style={{ 
            fontSize: "1rem", 
            color: "#212529",
            fontWeight: "500"
          }}>
            {user.email}
          </div>
        </div>
        {user.displayName && (
          <div>
            <label style={{ 
              display: "block", 
              fontSize: "0.875rem", 
              fontWeight: "500",
              color: "#6c757d",
              marginBottom: "0.25rem"
            }}>
              Display Name
            </label>
            <div style={{ 
              fontSize: "1rem", 
              color: "#212529",
              fontWeight: "500"
            }}>
              {user.displayName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInfo;
