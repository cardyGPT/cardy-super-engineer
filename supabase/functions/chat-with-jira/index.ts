
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { jiraTicket, dataModel, documentsContext, request, projectContext, selectedDocuments, additionalContext } = await req.json();
    
    if (!jiraTicket) {
      return new Response(
        JSON.stringify({ error: 'Jira ticket information is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Helper function to safely convert any content to string
    const safeStringify = (content: any): string => {
      if (content === null || content === undefined) {
        return "";
      }
      
      if (typeof content === 'string') {
        return content;
      }
      
      // Handle Jira document format or any object
      if (typeof content === 'object') {
        try {
          return JSON.stringify(content, null, 2);
        } catch (e) {
          console.error("Error stringifying content:", e);
          return "[Content conversion error]";
        }
      }
      
      return String(content);
    };

    // Prepare context for the model
    let ticketContext = `
Jira Ticket: ${jiraTicket.key || 'Unknown'}
Summary: ${jiraTicket.summary || 'No summary provided'}
Description: ${safeStringify(jiraTicket.description) || 'No description provided'}
Status: ${jiraTicket.status || 'Unknown'}
Priority: ${jiraTicket.priority || 'Unknown'}
Type: ${jiraTicket.issuetype?.name || 'Unknown'}
`;

    // Add any additional contexts
    if (dataModel) {
      ticketContext += `\nData Model Context:\n${safeStringify(dataModel)}`;
    }

    if (documentsContext) {
      ticketContext += `\nDocuments Context:\n${safeStringify(documentsContext)}`;
    }

    // Include sprint and epic information if available
    if (additionalContext?.sprint) {
      ticketContext += `\nSprint Information:\n${safeStringify(additionalContext.sprint)}`;
    }
    
    if (additionalContext?.epic) {
      ticketContext += `\nEpic Information:\n${safeStringify(additionalContext.epic)}`;
    }

    // If projectContext is provided, fetch the project and documents info
    if (projectContext) {
      try {
        // Get project info
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name, type')
          .eq('id', projectContext)
          .single();
        
        if (projectError) throw projectError;
        
        ticketContext += `\nProject Context:\nProject: ${projectData.name} (${projectData.type})`;
        
        // Get document info if selectedDocuments is provided
        if (selectedDocuments && selectedDocuments.length > 0) {
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('id, name, type')
            .in('id', selectedDocuments);
          
          if (documentsError) throw documentsError;
          
          if (documentsData && documentsData.length > 0) {
            ticketContext += `\n\nReference Documents:`;
            documentsData.forEach(doc => {
              ticketContext += `\n- ${doc.name} (${doc.type})`;
            });
          }
        }
      } catch (contextError) {
        console.error("Error fetching context:", contextError);
        // Continue even if context fetch fails
      }
    }

    // Create a mock response since we're not actually calling OpenAI
    const mockPrompt = request || 'Generate content';
    let responseContent = '';
    
    // Generate different content based on the request type
    if (mockPrompt.includes('Low-Level Design') || mockPrompt.includes('LLD')) {
      responseContent = `# Low Level Design for ${jiraTicket.key}: ${jiraTicket.summary}

## Overview
This document outlines the low-level design for implementing the feature described in ${jiraTicket.key}.

## Component Breakdown
- Frontend Components
- Backend Services
- Database Schema

## Data Models
\`\`\`json
{
  "model": "example",
  "properties": {
    "id": "string",
    "name": "string",
    "created_at": "timestamp"
  }
}
\`\`\`

## API Endpoints
\`\`\`
GET /api/resource
POST /api/resource
PUT /api/resource/:id
DELETE /api/resource/:id
\`\`\`

## Sequence Diagrams
1. User initiates action
2. Frontend validates input
3. Backend processes request
4. Database is updated
5. Response is returned to user

## Error Handling
- Input validation errors
- Server errors
- Database transaction errors

## Security Considerations
- Authentication
- Authorization
- Input sanitization
- Rate limiting

*Document created based on ticket ${jiraTicket.key}*
`;
    } else if (mockPrompt.includes('Implementation Code') || mockPrompt.includes('code')) {
      responseContent = `# Implementation Code for ${jiraTicket.key}: ${jiraTicket.summary}

## Frontend Code (Angular)

\`\`\`typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css']
})
export class ExampleComponent implements OnInit {
  form: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    
    this.loading = true;
    this.http.post('/api/example', this.form.value)
      .subscribe(
        data => {
          console.log('Success', data);
          this.loading = false;
        },
        error => {
          console.error('Error', error);
          this.loading = false;
        }
      );
  }
}
\`\`\`

## Backend Code (Node.js)

\`\`\`javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all items
router.get('/api/example', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM examples ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new item
router.post('/api/example', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  try {
    const { rows } = await db.query(
      'INSERT INTO examples(name, email) VALUES($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
\`\`\`

## Database Schema (PostgreSQL)

\`\`\`sql
CREATE TABLE examples (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_examples_email ON examples(email);
\`\`\`

*Code generated based on ticket ${jiraTicket.key}*
`;
    } else if (mockPrompt.includes('Test Cases') || mockPrompt.includes('tests')) {
      responseContent = `# Test Cases for ${jiraTicket.key}: ${jiraTicket.summary}

## Unit Tests

\`\`\`javascript
// Example.test.js
describe('Example Component', () => {
  let component;
  
  beforeEach(() => {
    component = new ExampleComponent();
  });
  
  test('should initialize with default values', () => {
    expect(component.loading).toBe(false);
    expect(component.submitted).toBe(false);
  });
  
  test('should validate required fields', () => {
    component.ngOnInit();
    component.onSubmit();
    expect(component.submitted).toBe(true);
    expect(component.form.invalid).toBe(true);
  });
  
  test('should call API when form is valid', () => {
    // Mock http service
    const httpMock = { post: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };
    component.http = httpMock;
    
    // Set valid form values
    component.ngOnInit();
    component.form.setValue({ name: 'Test User', email: 'test@example.com' });
    
    component.onSubmit();
    
    expect(component.loading).toBe(true);
    expect(httpMock.post).toHaveBeenCalledWith('/api/example', { 
      name: 'Test User', 
      email: 'test@example.com' 
    });
  });
});
\`\`\`

## Integration Tests

\`\`\`javascript
// api.integration.test.js
const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeAll(async () => {
  // Setup test database
  await db.query('CREATE TABLE IF NOT EXISTS examples (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW())');
});

afterAll(async () => {
  // Clean up
  await db.query('DROP TABLE examples');
  await db.end();
});

describe('Example API', () => {
  beforeEach(async () => {
    // Clear data between tests
    await db.query('TRUNCATE examples');
  });
  
  test('GET /api/example should return empty array initially', async () => {
    const res = await request(app).get('/api/example');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });
  
  test('POST /api/example should create new record', async () => {
    const res = await request(app)
      .post('/api/example')
      .send({ name: 'Test User', email: 'test@example.com' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Test User');
    expect(res.body.email).toEqual('test@example.com');
    expect(res.body.id).toBeDefined();
  });
  
  test('POST /api/example should validate input', async () => {
    const res = await request(app)
      .post('/api/example')
      .send({ name: 'Test User' }); // Missing email
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBeDefined();
  });
});
\`\`\`

## End-to-End Tests

\`\`\`javascript
// example.e2e.js
describe('Example Feature', () => {
  beforeEach(() => {
    cy.visit('/example');
  });
  
  it('should display form errors when submitted empty', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.form-error').should('be.visible');
  });
  
  it('should submit form with valid data', () => {
    cy.intercept('POST', '/api/example', { id: 1, name: 'Test User', email: 'test@example.com' });
    
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    
    cy.get('.success-message').should('be.visible');
  });
});
\`\`\`

## Edge Cases

1. **Empty input handling** - All required fields should be validated
2. **Invalid email format** - Email validation should reject invalid formats
3. **Duplicate entries** - System should handle duplicate record attempts
4. **Long text inputs** - System should handle or truncate excessively long inputs
5. **Special characters** - Input should be properly sanitized

## Performance Test Considerations

1. **Load testing** - System should handle up to 100 concurrent users
2. **Response time** - API endpoints should respond within 200ms under normal load
3. **Database performance** - Queries should complete within 50ms
4. **Memory usage** - Application should not experience memory leaks during extended use

*Test cases generated based on ticket ${jiraTicket.key}*
`;
    } else {
      responseContent = `Generated content for ${jiraTicket.key}: ${jiraTicket.summary}\n\n${ticketContext}`;
    }

    return new Response(
      JSON.stringify({ response: responseContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in chat-with-jira function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred processing the request" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
