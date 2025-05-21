// Let's only update the JiraGenerationResponse interface to include testScripts
// The rest of the file should be kept intact

export interface JiraGenerationResponse {
  lld?: string;
  lldContent?: string;
  code?: string;
  codeContent?: string;
  tests?: string;
  testContent?: string;
  testCasesContent?: string;
  testScriptsContent?: string;
}

export interface JiraGenerationRequest {
  type: 'lld' | 'code' | 'tests' | 'testcases' | 'testScripts';
  jiraTicket: JiraTicket;
  projectContext?: string;
  selectedDocuments?: string[];
  additionalContext?: any;
}
