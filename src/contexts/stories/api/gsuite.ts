import { supabase } from '@/lib/supabase';
import { ContentType } from '@/types/jira';

/**
 * Exports content to Google Docs using the Supabase Edge Function
 * 
 * @param storyId - The ID of the Jira story
 * @param storyKey - The key of the Jira story (e.g., "PROJ-123")
 * @param content - The content to export
 * @param contentType - The type of content being exported (lld, code, tests, etc.)
 * @returns Promise that resolves when the export is complete
 */
export const exportToGoogleDocs = async (
  storyId: string,
  storyKey: string,
  content: string,
  contentType: ContentType
): Promise<{documentId: string, documentUrl: string}> => {
  try {
    console.log(`Exporting ${contentType} content for ${storyKey} to Google Docs`);
    
    // Format document name based on story key and content type
    const documentName = `${storyKey} - ${contentType.toUpperCase()}`;
    
    // Call the Supabase function to export to GSuite
    const { data, error } = await supabase.functions.invoke('export-to-gsuite', {
      body: {
        documentName,
        content,
        artifactType: contentType,
        storyId
      }
    });
    
    if (error) {
      console.error('Error exporting to Google Docs:', error);
      throw new Error(error.message || 'Failed to export content to Google Docs');
    }
    
    if (!data || !data.documentId) {
      throw new Error('No document ID received from export service');
    }
    
    console.log('Successfully exported to Google Docs:', data);
    
    return {
      documentId: data.documentId,
      documentUrl: data.documentUrl || `https://docs.google.com/document/d/${data.documentId}/edit`
    };
  } catch (err: any) {
    console.error('Error in exportToGoogleDocs:', err);
    throw err;
  }
};
