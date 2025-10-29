package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"time"

	"firebase.google.com/go"
	"firebase.google.com/go/auth"
	"firebase.google.com/go/db"
	"google.golang.org/api/option"
	gomail "gopkg.in/gomail.v2"
)

var (
	firebaseApp  *firebase.App
	firebaseAuth *auth.Client
	firebaseDB   *db.Client
	mailer       *gomail.Dialer
	baseURL      string
	emailUser    string
)

func init() {
	ctx := context.Background()

	// Initialize Firebase Admin SDK
	var err error
	// Get Firebase database URL from environment variable
	databaseURL := getEnv("FIREBASE_DATABASE_URL", "")
	if databaseURL == "" {
		log.Fatal("FIREBASE_DATABASE_URL environment variable is required")
	}

	// Option 1: Use service account key file (for local development)
	if _, exists := os.LookupEnv("GOOGLE_APPLICATION_CREDENTIALS"); exists {
		opt := option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"))
		firebaseApp, err = firebase.NewApp(ctx, &firebase.Config{
			DatabaseURL: databaseURL,
		}, opt)
	} else {
		// Option 2: Use default credentials (for Cloud Run deployment)
		firebaseApp, err = firebase.NewApp(ctx, &firebase.Config{
			DatabaseURL: databaseURL,
		})
	}

	if err != nil {
		log.Fatalf("Error initializing Firebase app: %v", err)
	}

	// Initialize Firebase Auth
	firebaseAuth, err = firebaseApp.Auth(ctx)
	if err != nil {
		log.Fatalf("Error initializing Firebase Auth: %v", err)
	}

	// Initialize Firebase Realtime Database
	firebaseDB, err = firebaseApp.Database(ctx)
	if err != nil {
		log.Fatalf("Error initializing Firebase Database: %v", err)
	}

	// Get email configuration from environment variables
	emailUser = getEnv("EMAIL_USER", "")
	emailPassword := getEnv("EMAIL_PASSWORD", "")
	baseURL = getEnv("BASE_URL", "")
	if baseURL == "" {
		log.Fatal("BASE_URL environment variable is required")
	}

	// Initialize email sender
	if emailUser != "" && emailPassword != "" {
		mailer = gomail.NewDialer("smtp.gmail.com", 587, emailUser, emailPassword)
	} else {
		log.Println("Warning: Email credentials not set. Email sending will fail.")
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// InviteRequest represents the incoming request data
type InviteRequest struct {
	Email       string `json:"email"`
	ClubID      string `json:"clubId"`
	ClubName    string `json:"clubName"`
	InviterName string `json:"inviterName"`
	InviteID    string `json:"inviteId"` // Optional: ID from frontend to update status
}

// InviteResponse represents the response
type InviteResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

// Member represents a club member
type Member struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

// Club represents club data from Firebase
type Club struct {
	Members []Member `json:"members"`
}

// corsHandler handles CORS for browser requests (minimal, Cloud Run IAM handles auth)
func corsHandler(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		// Handle OPTIONS preflight request
		if r.Method == http.MethodOptions {
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Max-Age", "3600")
			}
			w.WriteHeader(http.StatusOK)
			return
		}

		// Set CORS headers if origin is present (browser request)
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		handler(w, r)
	}
}

// sendClubInvite handles the HTTP request to send club invites
func sendClubInvite(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the request body
	var req InviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Require Firebase ID token for authentication
	// Cloud Run IAM handles service-level access, Firebase handles user-level auth
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
		return
	}

	// Extract token (assuming format: "Bearer <token>")
	token := authHeader
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token = authHeader[7:]
	}

	// Verify the token and get user info
	verifiedToken, err := firebaseAuth.VerifyIDToken(ctx, token)
	if err != nil {
		http.Error(w, fmt.Sprintf("Unauthorized: %v", err), http.StatusUnauthorized)
		return
	}

	userID := verifiedToken.UID

	// Validate input
	if req.Email == "" || req.ClubID == "" || req.ClubName == "" {
		http.Error(w, "Missing required fields: email, clubId, or clubName", http.StatusBadRequest)
		return
	}

	// Validate email format
	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	if !emailRegex.MatchString(req.Email) {
		http.Error(w, "Invalid email address format", http.StatusBadRequest)
		return
	}

	// Check if user is admin of the club
	clubRef := firebaseDB.NewRef(fmt.Sprintf("clubs/%s", req.ClubID))
	var club Club
	if err := clubRef.Get(ctx, &club); err != nil {
		http.Error(w, fmt.Sprintf("Club not found: %v", err), http.StatusNotFound)
		return
	}

	// Check if user is admin
	isAdmin := false
	for _, member := range club.Members {
		if member.ID == userID && member.Role == "admin" {
			isAdmin = true
			break
		}
	}

	if !isAdmin {
		http.Error(w, "Only admins can send invites", http.StatusForbidden)
		return
	}

	// Generate signup link
	signupLink := fmt.Sprintf("%s/signup?invite=%s&email=%s",
		baseURL, req.ClubID, url.QueryEscape(req.Email))

	// Create email
	if mailer == nil {
		http.Error(w, "Email service not configured", http.StatusInternalServerError)
		return
	}

	emailHTML := generateEmailHTML(req.ClubName, req.InviterName, signupLink)
	emailText := generateEmailText(req.ClubName, req.InviterName, signupLink)

	msg := gomail.NewMessage()
	msg.SetHeader("From", fmt.Sprintf("Book Clurb <%s>", emailUser))
	msg.SetHeader("To", req.Email)
	msg.SetHeader("Subject", fmt.Sprintf("You're invited to join %s on Book Clurb!", req.ClubName))
	msg.SetBody("text/html", emailHTML)
	msg.AddAlternative("text/plain", emailText)

	// Send email
	if err := mailer.DialAndSend(msg); err != nil {
		log.Printf("Error sending email: %v", err)
		
		// Update invite status to 'failed' if inviteId was provided
		if req.InviteID != "" {
			updateInviteStatus(ctx, req.ClubID, req.InviteID, "failed", err.Error())
		}
		
		http.Error(w, fmt.Sprintf("Failed to send invite email: %v", err), http.StatusInternalServerError)
		return
	}

	// Update invite status to 'sent' (invite was already created by frontend)
	if req.InviteID != "" {
		updateInviteStatus(ctx, req.ClubID, req.InviteID, "sent", "")
		log.Printf("Updated invite %s status to sent", req.InviteID)
	} else {
		// Fallback: create invite record if frontend didn't provide inviteId
		inviteRef := firebaseDB.NewRef(fmt.Sprintf("club_invites/%s", req.ClubID))
		inviteData := map[string]interface{}{
			"email":     req.Email,
			"invitedBy": userID,
			"invitedAt": time.Now().Unix(),
			"status":    "sent",
		}
		if newRef, err := inviteRef.Push(ctx, inviteData); err != nil {
			log.Printf("Warning: Failed to store invite record: %v", err)
		} else {
			_ = newRef // Reference created successfully
		}
	}

	// Return success response
	response := InviteResponse{
		Success: true,
		Message: "Invite sent successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// generateEmailHTML generates the HTML email template
func generateEmailHTML(clubName, inviterName, signupLink string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        background: #f8f9fa;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
        font-weight: bold;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #dee2e6;
        color: #6b7280;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📚 Book Clurb</h1>
    </div>
    <div class="content">
      <h2>You're Invited!</h2>
      <p>Hi there,</p>
      <p><strong>%s</strong> has invited you to join <strong>%s</strong> on Book Clurb!</p>
      <p>Book Clurb is a platform for managing book clubs, tracking reading progress, and sharing reflections with your fellow readers.</p>
      <p style="text-align: center;">
        <a href="%s" class="button">Join %s</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">%s</p>
      <div class="footer">
        <p>If you didn't expect this invite, you can safely ignore this email.</p>
        <p>Happy reading! 📖</p>
      </div>
    </div>
  </body>
</html>`, inviterName, clubName, signupLink, clubName, signupLink)
}

// generateEmailText generates the plain text email template
func generateEmailText(clubName, inviterName, signupLink string) string {
	return fmt.Sprintf(`You're invited to join %s on Book Clurb!

%s has invited you to join %s on Book Clurb, a platform for managing book clubs and sharing reading reflections.

Join the club by clicking this link: %s

If you didn't expect this invite, you can safely ignore this email.

Happy reading!`, clubName, inviterName, clubName, signupLink)
}

// updateInviteStatus updates the status of an invite in Firebase
func updateInviteStatus(ctx context.Context, clubID, inviteID, status, errorMsg string) {
	inviteRef := firebaseDB.NewRef(fmt.Sprintf("club_invites/%s/%s", clubID, inviteID))
	updates := map[string]interface{}{
		"status":    status,
		"updatedAt": time.Now().Unix(),
	}
	if status == "sent" {
		updates["sentAt"] = time.Now().Unix()
	}
	if errorMsg != "" {
		updates["error"] = errorMsg
	}
	if err := inviteRef.Update(ctx, updates); err != nil {
		log.Printf("Warning: Failed to update invite status: %v", err)
	}
}

func main() {
	// Use PORT environment variable, or default to 8080
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	// Setup HTTP routes with CORS protection
	http.HandleFunc("/SendClubInvite", corsHandler(sendClubInvite))
	
	// Health check endpoint for Cloud Run
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
			return
		}
		http.NotFound(w, r)
	})

	// Start HTTP server
	log.Printf("Starting server on port %s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v\n", err)
	}
}
