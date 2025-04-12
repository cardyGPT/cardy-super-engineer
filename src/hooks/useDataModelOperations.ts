
import { useCallback } from "react";
import { ProjectDocument, DataModel } from "@/types";

export const useDataModelOperations = (documents: ProjectDocument[]) => {
  const getDocumentDataModel = useCallback((documentId: string): DataModel | null => {
    const document = documents.find(doc => doc.id === documentId);
    if (document && document.type === "data-model" && document.content) {
      return document.content;
    }
    return null;
  }, [documents]);

  return {
    getDocumentDataModel
  };
};
