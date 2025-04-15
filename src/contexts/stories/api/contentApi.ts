
import { JiraTicket, JiraGenerationRequest, JiraGenerationResponse } from '@/types/jira';
import { DEV_MODE, callJiraApi, saveGeneratedContent, sanitizeContentForReact } from './apiUtils';
import { supabase } from '@/lib/supabase';

/**
 * Generates content based on Jira ticket
 */
export const generateJiraContent = async (
  ticket: JiraTicket,
  request: JiraGenerationRequest
): Promise<JiraGenerationResponse> => {
  try {
    // If in dev mode, return mock data
    if (DEV_MODE) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = getMockContent(request.type);
      
      // Save the generated content to the database
      await saveToTicketArtifacts(ticket.key, request.type, mockContent);
      
      return {
        [request.type === 'lld' ? 'lldContent' : 
          request.type === 'code' ? 'codeContent' : 
          request.type === 'tests' ? 'testContent' : 'testCasesContent']: mockContent
      } as JiraGenerationResponse;
    }
    
    // Make API call to generate content
    const response = await callJiraApi('/generate-content', {
      method: 'POST',
      body: JSON.stringify({
        ticketId: ticket.id,
        ticketKey: ticket.key,
        ticketTitle: ticket.title,
        ticketDescription: ticket.description,
        contentType: request.type,
        projectContext: request.projectContext,
        selectedDocuments: request.selectedDocuments,
        additionalContext: request.additionalContext || {}
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate content: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.content) {
      throw new Error('No content was generated');
    }
    
    // Format content for React
    const sanitizedContent = sanitizeContentForReact(data.content);
    
    // Save the generated content to the database
    await saveToTicketArtifacts(ticket.key, request.type, sanitizedContent);
    
    // Return the content based on type
    return {
      [request.type === 'lld' ? 'lldContent' : 
       request.type === 'code' ? 'codeContent' : 
       request.type === 'tests' ? 'testContent' : 'testCasesContent']: sanitizedContent
    } as JiraGenerationResponse;
  } catch (error: any) {
    console.error('Error generating content:', error);
    throw error;
  }
};

/**
 * Pushes content to Jira as a comment
 */
export const pushContentToJira = async (
  credentials: any,
  ticketId: string,
  content: string
): Promise<boolean> => {
  try {
    // Make API call to push content to Jira
    const response = await callJiraApi(`/jira-api/issue/${ticketId}/comment`, {
      method: 'POST',
      body: JSON.stringify({
        body: content
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to push content to Jira: ${errorText}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error pushing content to Jira:', error);
    throw error;
  }
};

/**
 * Save generated content to ticket_artifacts table
 */
const saveToTicketArtifacts = async (
  ticketKey: string,
  contentType: string,
  content: string
): Promise<void> => {
  try {
    // Determine which column to update based on content type
    const contentColumn = contentType === 'lld' ? 'lld_content' : 
                         contentType === 'code' ? 'code_content' : 
                         contentType === 'tests' ? 'test_content' : 'testcases_content';

    // Check if an entry already exists for this ticket
    const { data: existingArtifact, error: fetchError } = await supabase
      .from('ticket_artifacts')
      .select('id')
      .eq('story_id', ticketKey)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing artifact:', fetchError);
      throw fetchError;
    }

    // If entry exists, update it; otherwise, create a new one
    if (existingArtifact) {
      const { error: updateError } = await supabase
        .from('ticket_artifacts')
        .update({ [contentColumn]: content, updated_at: new Date().toISOString() })
        .eq('id', existingArtifact.id);

      if (updateError) {
        console.error('Error updating artifact:', updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('ticket_artifacts')
        .insert({ 
          story_id: ticketKey, 
          [contentColumn]: content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating artifact:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully saved ${contentType} content for ticket ${ticketKey}`);
  } catch (error) {
    console.error('Error saving to ticket_artifacts:', error);
    throw error;
  }
};

/**
 * Get mock content for development mode
 */
const getMockContent = (type: string): string => {
  if (type === 'lld') {
    return `# Low-Level Design
    
## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Components](#components)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Sequence Diagrams](#sequence-diagrams)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Performance Optimizations](#performance-optimizations)
10. [Testing Strategy](#testing-strategy)

## Introduction
This LLD provides a detailed design for implementing the feature...

## Architecture Overview
The system follows a layered architecture pattern with...

## Components
1. **UserAuthService**
   - Responsible for user authentication
   - Methods: login(), logout(), verifyToken()

2. **DataProcessor**
   - Handles data transformation and validation
   - Methods: processInput(), validateData()

## Data Models
\`\`\`typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
\`\`\`

## API Endpoints
| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| /api/users | GET | Get all users | N/A | User[] |
| /api/users/:id | GET | Get user by ID | N/A | User |
| /api/users | POST | Create new user | User | User |

## Sequence Diagrams
For the user authentication flow:
1. Client sends login request
2. Server validates credentials
3. If valid, server generates JWT
4. Server returns JWT to client
5. Client stores JWT for future requests

## Error Handling
The system will use a centralized error handling mechanism...

## Security Considerations
1. All API endpoints will be secured with JWT authentication
2. Passwords will be hashed using bcrypt
3. Input validation will be performed on all user inputs

## Performance Optimizations
1. Database indexing for frequently queried fields
2. Caching for expensive operations
3. Pagination for large data sets

## Testing Strategy
1. Unit tests for each component
2. Integration tests for API endpoints
3. End-to-end tests for critical user flows
`;
  } else if (type === 'code') {
    return `# Implementation Code

\`\`\`typescript
// UserService.ts
import { User, UserRole } from './types';
import { hashPassword, verifyPassword } from './utils/security';
import { generateToken, verifyToken } from './utils/jwt';
import { db } from './database';

export class UserService {
  /**
   * Create a new user
   * @param username - The user's username
   * @param email - The user's email
   * @param password - The user's plain text password
   * @param role - The user's role
   * @returns The created user without password
   */
  async createUser(username: string, email: string, password: string, role: UserRole = UserRole.USER): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await db.users.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      throw new Error('User with this username or email already exists');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await db.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role
      }
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticate a user
   * @param usernameOrEmail - The username or email
   * @param password - The plain text password
   * @returns A JWT token and user data if authentication is successful
   */
  async login(usernameOrEmail: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> {
    // Find the user
    const user = await db.users.findFirst({
      where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify the password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate a JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    // Return token and user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Get a user by ID
   * @param id - The user ID
   * @returns The user without password
   */
  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await db.users.findUnique({
      where: { id }
    });

    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users
   * @param page - The page number
   * @param limit - The number of users per page
   * @returns A paginated list of users without passwords
   */
  async getUsers(page = 1, limit = 10): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    const skip = (page - 1) * limit;

    // Get users
    const users = await db.users.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count
    const total = await db.users.count();

    // Remove passwords
    const usersWithoutPasswords = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users: usersWithoutPasswords,
      total
    };
  }
}
\`\`\`

\`\`\`typescript
// utils/security.ts
import * as bcrypt from 'bcrypt';

/**
 * Hash a password
 * @param password - The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password
 * @param plainPassword - The plain text password
 * @param hashedPassword - The hashed password
 * @returns Whether the password is valid
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
\`\`\`
`;
  } else if (type === 'testcases') {
    return `# Test Cases

## Table of Contents
1. [User Registration](#user-registration)
2. [User Authentication](#user-authentication)
3. [User Profile Management](#user-profile-management)
4. [Admin User Management](#admin-user-management)

## User Registration

### TC-1: Successful User Registration
**Description**: Verify that a user can successfully register with valid information.

**Preconditions**:
- Application is accessible
- User is not logged in

**Test Steps**:
1. Navigate to registration page
2. Enter valid username: "testuser123"
3. Enter valid email: "testuser@example.com"
4. Enter valid password: "Test@123"
5. Confirm password: "Test@123"
6. Click "Register" button

**Expected Results**:
- User account is created successfully
- User receives a success message
- User is redirected to login page or automatically logged in

**Post-conditions**:
- User exists in the database
- User can log in with created credentials

### TC-2: Registration with Existing Username
**Description**: Verify that the system prevents registration with an existing username.

**Preconditions**:
- Application is accessible
- A user with username "existinguser" already exists

**Test Steps**:
1. Navigate to registration page
2. Enter existing username: "existinguser"
3. Enter valid email: "new@example.com"
4. Enter valid password: "Test@123"
5. Confirm password: "Test@123"
6. Click "Register" button

**Expected Results**:
- Registration fails
- Error message: "Username already exists" is displayed
- User remains on registration page

**Post-conditions**:
- No new user is created in the database

### TC-3: Registration with Invalid Email Format
**Description**: Verify that the system validates email format during registration.

**Preconditions**:
- Application is accessible

**Test Steps**:
1. Navigate to registration page
2. Enter valid username: "newuser123"
3. Enter invalid email: "invalidemail"
4. Enter valid password: "Test@123"
5. Confirm password: "Test@123"
6. Click "Register" button

**Expected Results**:
- Registration fails
- Error message: "Please enter a valid email address" is displayed
- User remains on registration page

**Post-conditions**:
- No user is created in the database

## User Authentication

### TC-4: Successful Login
**Description**: Verify that a registered user can successfully log in.

**Preconditions**:
- Application is accessible
- User with username "testuser" and password "Test@123" exists

**Test Steps**:
1. Navigate to login page
2. Enter username: "testuser"
3. Enter password: "Test@123"
4. Click "Login" button

**Expected Results**:
- User is successfully logged in
- User is redirected to the dashboard or home page
- User's session is created

**Post-conditions**:
- User has access to protected areas of the application

### TC-5: Failed Login - Incorrect Password
**Description**: Verify that login fails with incorrect password.

**Preconditions**:
- Application is accessible
- User with username "testuser" exists

**Test Steps**:
1. Navigate to login page
2. Enter username: "testuser"
3. Enter incorrect password: "wrongpassword"
4. Click "Login" button

**Expected Results**:
- Login fails
- Error message: "Invalid credentials" is displayed
- User remains on login page

**Post-conditions**:
- User session is not created
- User cannot access protected areas

## User Profile Management

### TC-6: View User Profile
**Description**: Verify that a logged-in user can view their profile information.

**Preconditions**:
- User is logged in

**Test Steps**:
1. Navigate to profile page
2. Observe displayed profile information

**Expected Results**:
- User's profile information is correctly displayed
- Username, email, and other profile details are visible

**Post-conditions**:
- No changes to user data

### TC-7: Update User Profile
**Description**: Verify that a logged-in user can update their profile information.

**Preconditions**:
- User is logged in

**Test Steps**:
1. Navigate to profile page
2. Click "Edit Profile" button
3. Change name to "Updated Name"
4. Click "Save Changes" button

**Expected Results**:
- Profile is successfully updated
- Success message is displayed
- Updated information is visible in the profile

**Post-conditions**:
- User data is updated in the database

## Admin User Management

### TC-8: Admin Can View All Users
**Description**: Verify that an admin user can view a list of all users.

**Preconditions**:
- User with admin role is logged in

**Test Steps**:
1. Navigate to admin dashboard
2. Click on "User Management" section
3. Observe list of users

**Expected Results**:
- List of all users is displayed
- User information including username, email, and role is visible

**Post-conditions**:
- No changes to user data

### TC-9: Admin Can Delete User
**Description**: Verify that an admin user can delete another user.

**Preconditions**:
- User with admin role is logged in
- Regular user "testdelete" exists

**Test Steps**:
1. Navigate to admin dashboard
2. Click on "User Management" section
3. Find user "testdelete" in the list
4. Click "Delete" button for this user
5. Confirm deletion in the confirmation dialog

**Expected Results**:
- User is successfully deleted
- Success message is displayed
- User no longer appears in the user list

**Post-conditions**:
- User "testdelete" is removed from the database
`;
  } else if (type === 'tests') {
    return `# Automated Tests

## Table of Contents
1. [User Registration Tests](#user-registration-tests)
2. [User Authentication Tests](#user-authentication-tests)
3. [User Profile Tests](#user-profile-tests)
4. [Admin Management Tests](#admin-management-tests)

## User Registration Tests

\`\`\`typescript
// tests/registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page before each test
    await page.goto('/register');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Generate a unique username and email using timestamp
    const timestamp = new Date().getTime();
    const username = `testuser${timestamp}`;
    const email = `testuser${timestamp}@example.com`;
    
    // Fill registration form
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'Test@123');
    await page.fill('[data-testid="confirm-password-input"]', 'Test@123');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify registration success
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
  });

  test('should show error when registering with existing username', async ({ page, request }) => {
    // Create a user first via API
    const apiContext = await request.post('/api/users', {
      data: {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Test@123'
      }
    });
    
    expect(apiContext.ok()).toBeTruthy();
    
    // Try to register with the same username
    await page.fill('[data-testid="username-input"]', 'existinguser');
    await page.fill('[data-testid="email-input"]', 'new@example.com');
    await page.fill('[data-testid="password-input"]', 'Test@123');
    await page.fill('[data-testid="confirm-password-input"]', 'Test@123');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Username already exists');
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.fill('[data-testid="username-input"]', 'newuser123');
    await page.fill('[data-testid="email-input"]', 'invalidemail');
    await page.fill('[data-testid="password-input"]', 'Test@123');
    await page.fill('[data-testid="confirm-password-input"]', 'Test@123');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify validation message
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
  });

  test('should validate password strength', async ({ page }) => {
    // Fill form with weak password
    await page.fill('[data-testid="username-input"]', 'newuser123');
    await page.fill('[data-testid="email-input"]', 'valid@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.fill('[data-testid="confirm-password-input"]', '123');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify validation message
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
  });

  test('should validate password confirmation', async ({ page }) => {
    // Fill form with mismatched passwords
    await page.fill('[data-testid="username-input"]', 'newuser123');
    await page.fill('[data-testid="email-input"]', 'valid@example.com');
    await page.fill('[data-testid="password-input"]', 'Test@123');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword');
    
    // Submit form
    await page.click('[data-testid="register-button"]');
    
    // Verify validation message
    await expect(page.locator('[data-testid="confirm-password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Passwords do not match');
  });
});
\`\`\`

## User Authentication Tests

\`\`\`typescript
// tests/authentication.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page, request }) => {
    // Create a test user via API before each test
    const timestamp = new Date().getTime();
    const username = `testuser${timestamp}`;
    const email = `testuser${timestamp}@example.com`;
    const password = 'Test@123';
    
    const response = await request.post('/api/users', {
      data: {
        username,
        email,
        password
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    // Store user credentials in test context
    test.info().annotations.push({
      type: 'credentials',
      description: JSON.stringify({ username, email, password })
    });
    
    // Navigate to login page
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Get stored credentials
    const credentialsAnnotation = test.info().annotations.find(a => a.type === 'credentials');
    const { username, password } = JSON.parse(credentialsAnnotation?.description || '{}');
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', password);
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-greeting"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-greeting"]')).toContainText(username);
  });

  test('should show error with incorrect password', async ({ page }) => {
    // Get stored credentials
    const credentialsAnnotation = test.info().annotations.find(a => a.type === 'credentials');
    const { username } = JSON.parse(credentialsAnnotation?.description || '{}');
    
    // Fill login form with incorrect password
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Verify user remains on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error with non-existent username', async ({ page }) => {
    // Fill login form with non-existent username
    await page.fill('[data-testid="username-input"]', 'nonexistentuser');
    await page.fill('[data-testid="password-input"]', 'anypassword');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Verify user remains on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to requested page after login', async ({ page, context }) => {
    // Get stored credentials
    const credentialsAnnotation = test.info().annotations.find(a => a.type === 'credentials');
    const { username, password } = JSON.parse(credentialsAnnotation?.description || '{}');
    
    // Navigate to a protected page first, which should redirect to login
    await page.goto('/profile');
    
    // Verify redirect to login page with return URL
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fprofile/);
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', password);
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Verify redirect to originally requested page
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    const credentialsAnnotation = test.info().annotations.find(a => a.type === 'credentials');
    const { username, password } = JSON.parse(credentialsAnnotation?.description || '{}');
    
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    
    // Verify login successful
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verify logout successful
    await expect(page).toHaveURL(/\/login/);
    
    // Verify cannot access protected page anymore
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
\`\`\`

## User Profile Tests

\`\`\`typescript
// tests/profile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Profile', () => {
  // Create test user and login before each test
  test.beforeEach(async ({ page, request }) => {
    // Create a test user via API
    const timestamp = new Date().getTime();
    const username = `testuser${timestamp}`;
    const email = `testuser${timestamp}@example.com`;
    const password = 'Test@123';
    
    const response = await request.post('/api/users', {
      data: {
        username,
        email,
        password
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    // Store user data in test context
    const userData = await response.json();
    test.info().annotations.push({
      type: 'user',
      description: JSON.stringify({ 
        id: userData.id,
        username, 
        email, 
        password 
      })
    });
    
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    
    // Verify login successful
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display user profile information correctly', async ({ page }) => {
    // Get user data
    const userAnnotation = test.info().annotations.find(a => a.type === 'user');
    const { username, email } = JSON.parse(userAnnotation?.description || '{}');
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify profile information is displayed correctly
    await expect(page.locator('[data-testid="profile-username"]')).toContainText(username);
    await expect(page.locator('[data-testid="profile-email"]')).toContainText(email);
  });

  test('should update user profile successfully', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Click edit profile button
    await page.click('[data-testid="edit-profile-button"]');
    
    // Update profile information
    const newName = 'Updated Name';
    await page.fill('[data-testid="name-input"]', newName);
    
    // Save changes
    await page.click('[data-testid="save-profile-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify profile updated
    await expect(page.locator('[data-testid="profile-name"]')).toContainText(newName);
  });

  test('should change password successfully', async ({ page }) => {
    // Get user data
    const userAnnotation = test.info().annotations.find(a => a.type === 'user');
    const { password } = JSON.parse(userAnnotation?.description || '{}');
    const newPassword = 'NewTest@456';
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Click change password button
    await page.click('[data-testid="change-password-button"]');
    
    // Fill password change form
    await page.fill('[data-testid="current-password-input"]', password);
    await page.fill('[data-testid="new-password-input"]', newPassword);
    await page.fill('[data-testid="confirm-password-input"]', newPassword);
    
    // Submit form
    await page.click('[data-testid="update-password-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password updated');
  });

  test('should require current password for password change', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    
    // Click change password button
    await page.click('[data-testid="change-password-button"]');
    
    // Fill password change form with incorrect current password
    await page.fill('[data-testid="current-password-input"]', 'wrongpassword');
    await page.fill('[data-testid="new-password-input"]', 'NewTest@456');
    await page.fill('[data-testid="confirm-password-input"]', 'NewTest@456');
    
    // Submit form
    await page.click('[data-testid="update-password-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Current password is incorrect');
  });
});
\`\`\`

## Admin Management Tests

\`\`\`typescript
// tests/admin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  // Create admin user and regular user, then login as admin before each test
  test.beforeEach(async ({ page, request }) => {
    // Create admin user
    const adminResponse = await request.post('/api/users', {
      data: {
        username: 'admin_user',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'ADMIN'
      }
    });
    
    expect(adminResponse.ok()).toBeTruthy();
    
    // Create regular test user
    const timestamp = new Date().getTime();
    const testUsername = `testuser${timestamp}`;
    const testResponse = await request.post('/api/users', {
      data: {
        username: testUsername,
        email: `testuser${timestamp}@example.com`,
        password: 'Test@123',
        role: 'USER'
      }
    });
    
    expect(testResponse.ok()).toBeTruthy();
    const testUser = await testResponse.json();
    
    // Store test user ID
    test.info().annotations.push({
      type: 'testUser',
      description: JSON.stringify({ 
        id: testUser.id,
        username: testUsername
      })
    });
    
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'admin_user');
    await page.fill('[data-testid="password-input"]', 'Admin@123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to admin dashboard
    await page.goto('/admin');
  });

  test('should display list of users', async ({ page }) => {
    // Navigate to user management section
    await page.click('[data-testid="user-management-link"]');
    
    // Verify user list is displayed
    await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
    
    // Verify that the created test user is in the list
    const testUserAnnotation = test.info().annotations.find(a => a.type === 'testUser');
    const { username } = JSON.parse(testUserAnnotation?.description || '{}');
    
    await expect(page.locator(\`[data-testid="user-row"]:has-text("${username}")\`)).toBeVisible();
  });

  test('should be able to view user details', async ({ page }) => {
    // Get test user data
    const testUserAnnotation = test.info().annotations.find(a => a.type === 'testUser');
    const { id, username } = JSON.parse(testUserAnnotation?.description || '{}');
    
    // Navigate to user management section
    await page.click('[data-testid="user-management-link"]');
    
    // Click view button for test user
    await page.click(\`[data-testid="view-user-\${id}"]\`);
    
    // Verify user details are displayed
    await expect(page.locator('[data-testid="user-details-title"]')).toContainText(username);
    await expect(page.locator('[data-testid="user-details-username"]')).toContainText(username);
    await expect(page.locator('[data-testid="user-details-role"]')).toContainText('USER');
  });

  test('should be able to disable and enable a user', async ({ page }) => {
    // Get test user data
    const testUserAnnotation = test.info().annotations.find(a => a.type === 'testUser');
    const { id, username } = JSON.parse(testUserAnnotation?.description || '{}');
    
    // Navigate to user management section
    await page.click('[data-testid="user-management-link"]');
    
    // Disable the test user
    await page.click(\`[data-testid="disable-user-\${id}"]\`);
    
    // Confirm action in dialog
    await page.click('[data-testid="confirm-action-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('User disabled');
    
    // Verify user status changed
    await expect(page.locator(\`[data-testid="user-status-\${id}"]\`)).toContainText('Disabled');
    
    // Enable the user again
    await page.click(\`[data-testid="enable-user-\${id}"]\`);
    
    // Confirm action in dialog
    await page.click('[data-testid="confirm-action-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('User enabled');
    
    // Verify user status changed
    await expect(page.locator(\`[data-testid="user-status-\${id}"]\`)).toContainText('Active');
  });

  test('should be able to change user role', async ({ page }) => {
    // Get test user data
    const testUserAnnotation = test.info().annotations.find(a => a.type === 'testUser');
    const { id, username } = JSON.parse(testUserAnnotation?.description || '{}');
    
    // Navigate to user management section
    await page.click('[data-testid="user-management-link"]');
    
    // Click edit button for test user
    await page.click(\`[data-testid="edit-user-\${id}"]\`);
    
    // Change role to ADMIN
    await page.selectOption('[data-testid="role-select"]', 'ADMIN');
    
    // Save changes
    await page.click('[data-testid="save-user-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('User updated');
    
    // Verify role changed
    await expect(page.locator(\`[data-testid="user-role-\${id}"]\`)).toContainText('ADMIN');
  });

  test('should be able to delete a user', async ({ page }) => {
    // Get test user data
    const testUserAnnotation = test.info().annotations.find(a => a.type === 'testUser');
    const { id, username } = JSON.parse(testUserAnnotation?.description || '{}');
    
    // Navigate to user management section
    await page.click('[data-testid="user-management-link"]');
    
    // Click delete button for test user
    await page.click(\`[data-testid="delete-user-\${id}"]\`);
    
    // Confirm deletion in dialog
    await page.click('[data-testid="confirm-action-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('User deleted');
    
    // Verify user no longer in list
    await expect(page.locator(\`[data-testid="user-row"]:has-text("${username}")\`)).not.toBeVisible();
  });
});
\`\`\`
`;
  }
  
  return 'No content available for this type';
};
