package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
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

const (
	hardcoverAPIURL = "https://api.hardcover.app/v1/graphql"
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

	// Get Firebase project ID (required to match the project that issued the tokens)
	// Default to extracting from database URL if not provided
	firebaseProjectID := getEnv("FIREBASE_PROJECT_ID", "")
	if firebaseProjectID == "" {
		// Extract project ID from database URL (format: https://PROJECT_ID-default-rtdb.firebaseio.com)
		if matches := regexp.MustCompile(`https://([^-]+)-.*\.firebaseio\.com`).FindStringSubmatch(databaseURL); len(matches) > 1 {
			firebaseProjectID = matches[1]
			log.Printf("Auto-detected Firebase project ID from database URL: %s", firebaseProjectID)
		} else {
			log.Fatal("FIREBASE_PROJECT_ID environment variable is required (or set FIREBASE_DATABASE_URL in correct format)")
		}
	}

	// Build Firebase config with explicit project ID
	firebaseConfig := &firebase.Config{
		ProjectID:   firebaseProjectID,
		DatabaseURL: databaseURL,
	}

	// Option 1: Use service account key file (for local development)
	if _, exists := os.LookupEnv("GOOGLE_APPLICATION_CREDENTIALS"); exists {
		opt := option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"))
		firebaseApp, err = firebase.NewApp(ctx, firebaseConfig, opt)
	} else {
		// Option 2: Use default credentials (for Cloud Run deployment)
		firebaseApp, err = firebase.NewApp(ctx, firebaseConfig)
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

// Hardcover API types
type HardcoverGraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

type HardcoverGraphQLResponse struct {
	Data   map[string]interface{} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors,omitempty"`
}

type HardcoverMeData struct {
	Me interface{} `json:"me"`
}

type HardcoverUser struct {
	ID            interface{} `json:"id"`
	Username      string      `json:"username"`
	CachedImage   interface{} `json:"cached_image"`
	CachedImageURL string     `json:"cachedImageUrl,omitempty"`
}

type HardcoverEdition struct {
	ID   int `json:"id"`
	Book struct {
		ID int `json:"id"`
	} `json:"book"`
}

type UserData struct {
	HardcoverApiToken string `json:"hardcoverApiToken"`
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
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Printf("Authentication failed: Missing Authorization header")
		http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
		return
	}

	// Extract token (assuming format: "Bearer <token>")
	token := authHeader
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token = authHeader[7:]
	}

	if token == "" || token == authHeader {
		log.Printf("Authentication failed: Invalid Authorization header format (length: %d)", len(authHeader))
		http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
		return
	}

	log.Printf("Verifying Firebase token (token length: %d)", len(token))

	// Verify the token and get user info
	verifiedToken, err := firebaseAuth.VerifyIDToken(ctx, token)
	if err != nil {
		log.Printf("Firebase token verification failed: %v", err)
		http.Error(w, fmt.Sprintf("Unauthorized: %v", err), http.StatusUnauthorized)
		return
	}

	log.Printf("Firebase token verified successfully for user: %s", verifiedToken.UID)

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
	log.Printf("Checking if user %s is admin of club %s", userID, req.ClubID)
	clubRef := firebaseDB.NewRef(fmt.Sprintf("clubs/%s", req.ClubID))
	var club Club
	if err := clubRef.Get(ctx, &club); err != nil {
		log.Printf("Failed to access club data: %v", err)
		// Check if it's an auth error
		if strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "Unauthorized") {
			http.Error(w, fmt.Sprintf("Database access denied. Service account may not have permission to read Firebase Realtime Database. Error: %v", err), http.StatusInternalServerError)
		} else {
			http.Error(w, fmt.Sprintf("Club not found: %v", err), http.StatusNotFound)
		}
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

	// Require inviteId to generate the signup link
	if req.InviteID == "" {
		http.Error(w, "InviteID is required", http.StatusBadRequest)
		return
	}

	// Generate signup link with unique invite ID
	signupLink := fmt.Sprintf("%s/signup?inviteId=%s&clubId=%s&email=%s",
		baseURL, req.InviteID, req.ClubID, url.QueryEscape(req.Email))

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
	updateInviteStatus(ctx, req.ClubID, req.InviteID, "sent", "")
	log.Printf("Updated invite %s status to sent", req.InviteID)

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

// Invite represents an invite record from Firebase
type Invite struct {
	Email       string `json:"email"`
	ClubID      string `json:"clubId"`
	ClubName    string `json:"clubName"`
	InvitedBy   string `json:"invitedBy"`
	InviterName string `json:"inviterName"`
	CreatedAt   int64  `json:"createdAt"`
	Status      string `json:"status"`
	SentAt      int64  `json:"sentAt,omitempty"`
	UpdatedAt   int64  `json:"updatedAt,omitempty"`
	Error       string `json:"error,omitempty"`
}

// ValidateInviteRequest represents the request to validate an invite
type ValidateInviteRequest struct {
	InviteID string `json:"inviteId"`
	ClubID   string `json:"clubId"`
}

// ValidateInviteResponse represents the response from validation
type ValidateInviteResponse struct {
	Valid     bool   `json:"valid"`
	Message   string `json:"message,omitempty"`
	ClubID    string `json:"clubId,omitempty"`
	ClubName  string `json:"clubName,omitempty"`
	InviterName string `json:"inviterName,omitempty"`
	Email     string `json:"email,omitempty"`
}

// Helper function to extract Firebase token from Authorization header
func extractFirebaseToken(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("missing Authorization header")
	}

	token := authHeader
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		token = authHeader[7:]
	}

	if token == "" || token == authHeader {
		return "", fmt.Errorf("invalid Authorization header format")
	}

	return token, nil
}

// Helper function to verify Firebase token and get user ID
func verifyFirebaseToken(ctx context.Context, token string) (string, error) {
	verifiedToken, err := firebaseAuth.VerifyIDToken(ctx, token)
	if err != nil {
		return "", fmt.Errorf("token verification failed: %v", err)
	}
	return verifiedToken.UID, nil
}

// Helper function to get Hardcover token from Firebase for a user
func getHardcoverToken(ctx context.Context, userID string) (string, error) {
	userRef := firebaseDB.NewRef(fmt.Sprintf("users/%s", userID))
	var userData UserData
	if err := userRef.Get(ctx, &userData); err != nil {
		return "", fmt.Errorf("failed to get user data: %v", err)
	}
	if userData.HardcoverApiToken == "" {
		return "", fmt.Errorf("hardcover token not found for user")
	}
	return userData.HardcoverApiToken, nil
}

// Helper function to clean a token by removing "Bearer " prefix if present
func cleanHardcoverToken(token string) string {
	return strings.TrimPrefix(strings.TrimSpace(token), "Bearer ")
}

// Make a GraphQL request to the Hardcover API
func makeHardcoverRequest(ctx context.Context, token string, query string, variables map[string]interface{}) (*HardcoverGraphQLResponse, error) {
	cleanToken := cleanHardcoverToken(token)

	reqBody := HardcoverGraphQLRequest{
		Query:     query,
		Variables: variables,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", hardcoverAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", cleanToken))

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var result HardcoverGraphQLResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	if len(result.Errors) > 0 {
		errorMessages := make([]string, len(result.Errors))
		for i, e := range result.Errors {
			errorMessages[i] = e.Message
		}
		return nil, fmt.Errorf("graphql errors: %s", strings.Join(errorMessages, ", "))
	}

	return &result, nil
}

// Test if a Hardcover API token is valid and get user info
func testHardcoverToken(ctx context.Context, token string) (map[string]interface{}, error) {
	query := `
		query {
			me {
				id
				username
				cached_image
			}
		}
	`

	result, err := makeHardcoverRequest(ctx, token, query, nil)
	if err != nil {
		return nil, err
	}

	meData, ok := result.Data["me"]
	if !ok {
		return nil, fmt.Errorf("unexpected response format: no 'me' field")
	}

	// Handle both array and object formats
	var userInfo map[string]interface{}
	if meArray, ok := meData.([]interface{}); ok && len(meArray) > 0 {
		if userMap, ok := meArray[0].(map[string]interface{}); ok {
			userInfo = userMap
		}
	} else if userMap, ok := meData.(map[string]interface{}); ok {
		userInfo = userMap
	}

	if userInfo == nil {
		return nil, fmt.Errorf("unexpected response format")
	}

	// Extract cached_image URL if present
	cachedImageURL := ""
	if cachedImage, ok := userInfo["cached_image"]; ok {
		if imgMap, ok := cachedImage.(map[string]interface{}); ok {
			if url, ok := imgMap["url"].(string); ok {
				cachedImageURL = url
			}
		}
	}

	response := map[string]interface{}{
		"valid": true,
		"user": map[string]interface{}{
			"id":            fmt.Sprintf("%v", userInfo["id"]),
			"username":      userInfo["username"],
			"cachedImageUrl": cachedImageURL,
		},
	}

	return response, nil
}

// Lookup book by ISBN to get Hardcover book ID
func lookupBookByIsbn(ctx context.Context, token string, isbn string) (int, error) {
	// Normalize ISBN: remove hyphens and spaces
	normalizedIsbn := regexp.MustCompile(`[-\s]`).ReplaceAllString(isbn, "")
	isbnLength := len(normalizedIsbn)

	// Determine which field(s) to try based on ISBN length
	var isbnFields []string
	if isbnLength == 10 {
		isbnFields = []string{"isbn_10"}
	} else if isbnLength == 13 {
		isbnFields = []string{"isbn_13"}
	} else {
		isbnFields = []string{"isbn_13", "isbn_10"}
	}

	// Try the appropriate ISBN field(s)
	for _, isbnField := range isbnFields {
		query := fmt.Sprintf(`
			query LookupBook($isbn: String!) {
				editions(where: {%s: {_eq: $isbn}}) {
					id
					book {
						id
					}
				}
			}
		`, isbnField)

		result, err := makeHardcoverRequest(ctx, token, query, map[string]interface{}{
			"isbn": normalizedIsbn,
		})

		if err != nil {
			log.Printf("Error with %s field: %v", isbnField, err)
			continue
		}

		editionsData, ok := result.Data["editions"]
		if !ok {
			continue
		}

		var editions []HardcoverEdition
		if editionsArray, ok := editionsData.([]interface{}); ok {
			for _, ed := range editionsArray {
				if edMap, ok := ed.(map[string]interface{}); ok {
					var edition HardcoverEdition
					if id, ok := edMap["id"].(float64); ok {
						edition.ID = int(id)
					}
					if book, ok := edMap["book"].(map[string]interface{}); ok {
						if bookID, ok := book["id"].(float64); ok {
							edition.Book.ID = int(bookID)
						}
					}
					if edition.Book.ID > 0 {
						editions = append(editions, edition)
					}
				}
			}
		}

		if len(editions) > 0 && editions[0].Book.ID > 0 {
			return editions[0].Book.ID, nil
		}
	}

	// Try _or query as fallback
	query := `
		query LookupBook($isbn: String!) {
			editions(where: {_or: [{isbn_13: {_eq: $isbn}}, {isbn_10: {_eq: $isbn}}]}) {
				id
				book {
					id
				}
			}
		}
	`

	result, err := makeHardcoverRequest(ctx, token, query, map[string]interface{}{
		"isbn": normalizedIsbn,
	})

	if err == nil {
		if editionsData, ok := result.Data["editions"]; ok {
			if editionsArray, ok := editionsData.([]interface{}); ok && len(editionsArray) > 0 {
				if edMap, ok := editionsArray[0].(map[string]interface{}); ok {
					if book, ok := edMap["book"].(map[string]interface{}); ok {
						if bookID, ok := book["id"].(float64); ok {
							return int(bookID), nil
						}
					}
				}
			}
		}
	}

	return 0, fmt.Errorf("book not found in Hardcover by ISBN")
}

// Sync rating and review to Hardcover
func syncRatingToHardcover(ctx context.Context, token string, isbn string, rating float64, reviewText string) error {
	// Step 1: Lookup book by ISBN
	bookID, err := lookupBookByIsbn(ctx, token, isbn)
	if err != nil {
		return fmt.Errorf("book lookup failed: %v", err)
	}

	// Step 2: Create user_book relationship with rating, review (if provided), status_id: 3, and read_count: 1
	var query string
	var variables map[string]interface{}

	if reviewText != "" {
		query = `
			mutation CreateUserBook($bookId: Int!, $rating: numeric!, $review: String!) {
				insert_user_book(object: {book_id: $bookId, rating: $rating, review: $review, status_id: 3, read_count: 1}) {
					id
				}
			}
		`
		variables = map[string]interface{}{
			"bookId": bookID,
			"rating": rating,
			"review": reviewText,
		}
	} else {
		query = `
			mutation CreateUserBook($bookId: Int!, $rating: numeric!) {
				insert_user_book(object: {book_id: $bookId, rating: $rating, status_id: 3, read_count: 1}) {
					id
				}
			}
		`
		variables = map[string]interface{}{
			"bookId": bookID,
			"rating": rating,
		}
	}

	result, err := makeHardcoverRequest(ctx, token, query, variables)
	if err != nil {
		// If error is about duplicate/unique constraint, that's okay
		errStr := err.Error()
		if strings.Contains(errStr, "already exists") || strings.Contains(errStr, "duplicate") || strings.Contains(errStr, "unique") {
			return nil
		}
		return err
	}

	// Check if creation was successful
	if insertData, ok := result.Data["insert_user_book"]; ok {
		var userBookID interface{}
		if insertArray, ok := insertData.([]interface{}); ok && len(insertArray) > 0 {
			if userBookMap, ok := insertArray[0].(map[string]interface{}); ok {
				userBookID = userBookMap["id"]
			}
		} else if userBookMap, ok := insertData.(map[string]interface{}); ok {
			userBookID = userBookMap["id"]
		}

		if userBookID != nil {
			return nil
		}
	}

	return fmt.Errorf("failed to create user_book relationship")
}

// TestHardcoverTokenRequest represents the request to test a Hardcover token
type TestHardcoverTokenRequest struct {
	Token string `json:"token"`
}

// TestHardcoverTokenResponse represents the response from testing a token
type TestHardcoverTokenResponse struct {
	Valid bool                   `json:"valid"`
	User  map[string]interface{} `json:"user,omitempty"`
	Error string                 `json:"error,omitempty"`
}

// testHardcoverTokenHandler handles the HTTP request to test a Hardcover token
func testHardcoverTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TestHardcoverTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.Token == "" {
		http.Error(w, "Token is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	result, err := testHardcoverToken(ctx, req.Token)
	if err != nil {
		response := TestHardcoverTokenResponse{
			Valid: false,
			Error: err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// SyncRatingRequest represents the request to sync a rating to Hardcover
type SyncRatingRequest struct {
	ISBN      string  `json:"isbn"`
	Rating    float64 `json:"rating"`
	ReviewText string `json:"reviewText,omitempty"`
}

// SyncRatingResponse represents the response from syncing a rating
type SyncRatingResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// syncRatingToHardcoverHandler handles the HTTP request to sync a rating to Hardcover
func syncRatingToHardcoverHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()

	// Verify Firebase token
	firebaseToken, err := extractFirebaseToken(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	userID, err := verifyFirebaseToken(ctx, firebaseToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Get Hardcover token from Firebase
	hardcoverToken, err := getHardcoverToken(ctx, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Hardcover token not found: %v", err), http.StatusBadRequest)
		return
	}

	var req SyncRatingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.ISBN == "" {
		http.Error(w, "ISBN is required", http.StatusBadRequest)
		return
	}

	if req.Rating < 0 || req.Rating > 5 {
		http.Error(w, "Rating must be between 0 and 5", http.StatusBadRequest)
		return
	}

	err = syncRatingToHardcover(ctx, hardcoverToken, req.ISBN, req.Rating, req.ReviewText)
	if err != nil {
		response := SyncRatingResponse{
			Success: false,
			Error:   err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := SyncRatingResponse{
		Success: true,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// SyncReviewRequest represents the request to sync a review to Hardcover
type SyncReviewRequest struct {
	ISBN      string  `json:"isbn"`
	ReviewText string `json:"reviewText"`
	Rating    float64 `json:"rating"`
}

// SyncReviewResponse represents the response from syncing a review
type SyncReviewResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// syncReviewToHardcoverHandler handles the HTTP request to sync a review to Hardcover
func syncReviewToHardcoverHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()

	// Verify Firebase token
	firebaseToken, err := extractFirebaseToken(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	userID, err := verifyFirebaseToken(ctx, firebaseToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Get Hardcover token from Firebase
	hardcoverToken, err := getHardcoverToken(ctx, userID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Hardcover token not found: %v", err), http.StatusBadRequest)
		return
	}

	var req SyncReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.ISBN == "" {
		http.Error(w, "ISBN is required", http.StatusBadRequest)
		return
	}

	if req.ReviewText == "" {
		http.Error(w, "Review text is required", http.StatusBadRequest)
		return
	}

	if req.Rating < 0 || req.Rating > 5 {
		http.Error(w, "Rating must be between 0 and 5", http.StatusBadRequest)
		return
	}

	err = syncRatingToHardcover(ctx, hardcoverToken, req.ISBN, req.Rating, req.ReviewText)
	if err != nil {
		response := SyncReviewResponse{
			Success: false,
			Error:   err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := SyncReviewResponse{
		Success: true,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// validateInvite handles the HTTP request to validate an invite ID
func validateInvite(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the request body
	var req ValidateInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Validate input
	if req.InviteID == "" || req.ClubID == "" {
		http.Error(w, "Missing required fields: inviteId or clubId", http.StatusBadRequest)
		return
	}

	// Look up the invite in Firebase
	inviteRef := firebaseDB.NewRef(fmt.Sprintf("club_invites/%s/%s", req.ClubID, req.InviteID))
	var invite Invite
	if err := inviteRef.Get(ctx, &invite); err != nil {
		log.Printf("Invite not found: %v", err)
		response := ValidateInviteResponse{
			Valid:   false,
			Message: "Invite not found",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Check if invite is active (status must be "sent")
	if invite.Status != "sent" {
		response := ValidateInviteResponse{
			Valid:   false,
			Message: fmt.Sprintf("Invite is not active. Status: %s", invite.Status),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Invite is valid and active
	response := ValidateInviteResponse{
		Valid:       true,
		Message:     "Invite is valid and active",
		ClubID:      invite.ClubID,
		ClubName:    invite.ClubName,
		InviterName: invite.InviterName,
		Email:       invite.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Use PORT environment variable, or default to 8080
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}

	// Setup HTTP routes with CORS protection
	http.HandleFunc("/SendClubInvite", corsHandler(sendClubInvite))
	http.HandleFunc("/ValidateInvite", corsHandler(validateInvite))
	
	// TODO: Move Hardcover integration to its own dedicated service with API gateway
	// This will improve separation of concerns, allow independent scaling, and provide
	// better rate limiting and monitoring capabilities for the Hardcover API integration.
	http.HandleFunc("/TestHardcoverToken", corsHandler(testHardcoverTokenHandler))
	http.HandleFunc("/SyncRatingToHardcover", corsHandler(syncRatingToHardcoverHandler))
	http.HandleFunc("/SyncReviewToHardcover", corsHandler(syncReviewToHardcoverHandler))
	
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
