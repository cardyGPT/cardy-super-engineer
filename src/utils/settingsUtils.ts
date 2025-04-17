
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const validateApiKey = async (
  provider: string,
  validationEndpoint: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke(validationEndpoint, {});
    
    if (error) {
      console.error(`Error validating ${provider} API key:`, error);
      toast({
        title: "Validation Error",
        description: `Could not validate ${provider} connection: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
    
    return !!data?.valid;
  } catch (err: any) {
    console.error(`Error in ${provider} validation:`, err);
    toast({
      title: "Error",
      description: err.message || `Failed to validate ${provider} settings`,
      variant: "destructive",
    });
    return false;
  }
};

export const saveApiKey = async (
  provider: string,
  apiKey: string,
  clientId?: string,
  clientSecret?: string
): Promise<boolean> => {
  try {
    // Validate input
    if (!apiKey && !clientId && !clientSecret) {
      throw new Error("At least one credential must be provided");
    }
    
    if (apiKey && apiKey.trim() === "") {
      apiKey = ""; // Allow empty string to clear the API key
    }

    const payload: any = { provider };
    
    if (apiKey) payload.apiKey = apiKey;
    if (clientId) payload.clientId = clientId;
    if (clientSecret) payload.clientSecret = clientSecret;

    // Store the API key securely using Supabase edge function
    const { data, error } = await supabase.functions.invoke('store-api-keys', {
      body: payload
    });

    if (error) {
      throw new Error(error.message || `Failed to save ${provider} credentials`);
    }

    toast({
      title: "Credentials Saved",
      description: `Your ${provider} credentials have been securely saved`,
      variant: "success",
    });
    
    return true;
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || `Failed to save ${provider} credentials`,
      variant: "destructive",
    });
    return false;
  }
};

export const removeApiKey = async (provider: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('delete-api-key', {
      body: { provider }
    });

    if (error) {
      throw new Error(error.message || `Failed to remove ${provider} API key`);
    }

    toast({
      title: "API Key Removed",
      description: `Your ${provider} API key has been removed`,
      variant: "default",
    });
    
    return true;
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || `Failed to remove ${provider} API key`,
      variant: "destructive",
    });
    return false;
  }
};
