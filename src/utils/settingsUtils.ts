
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
  clientSecret?: string
): Promise<boolean> => {
  try {
    if (!apiKey.trim()) {
      throw new Error("API key cannot be empty");
    }

    // Store the API key securely using Supabase edge function
    const { data, error } = await supabase.functions.invoke('store-api-keys', {
      body: { 
        provider,
        apiKey,
        ...(clientSecret && { clientSecret })
      }
    });

    if (error) {
      throw new Error(error.message || `Failed to save ${provider} API key`);
    }

    toast({
      title: "API Key Saved",
      description: `Your ${provider} API key has been securely saved`,
      variant: "success",
    });
    
    return true;
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || `Failed to save ${provider} API key`,
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
