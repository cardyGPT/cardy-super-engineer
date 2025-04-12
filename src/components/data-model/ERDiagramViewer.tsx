
import { useState, useRef, useEffect } from "react";
import { DataModel, Entity, Relationship } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ZoomIn, ZoomOut, Filter, Download, Share2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ERDiagramViewerProps {
  dataModel: DataModel;
}

const ERDiagramViewer = ({ dataModel }: ERDiagramViewerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [zoom, setZoom] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [layoutMode, setLayoutMode] = useState<"grid" | "flow">("grid");
  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Reset selected entity when data model changes
  useEffect(() => {
    setSelectedEntity(null);
  }, [dataModel]);
  
  const filteredEntities = dataModel.entities.filter((entity) => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = entityTypeFilter === "all" || entity.type === entityTypeFilter;
    return matchesSearch && matchesType;
  });
  
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 1.5));
  };
  
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };
  
  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity === selectedEntity ? null : entity);
  };
  
  // Find relationships for the selected entity
  const getEntityRelationships = (entityId: string) => {
    return dataModel.relationships.filter(
      (rel) => rel.sourceEntityId === entityId || rel.targetEntityId === entityId
    );
  };
  
  // Get related entities for an entity
  const getRelatedEntities = (entityId: string) => {
    const relationships = getEntityRelationships(entityId);
    const relatedEntityIds = relationships.flatMap((rel) => [
      rel.sourceEntityId,
      rel.targetEntityId,
    ]);
    return dataModel.entities.filter(
      (entity) => relatedEntityIds.includes(entity.id) && entity.id !== entityId
    );
  };
  
  // Generate exportable diagram data
  const exportDiagram = () => {
    const diagramData = {
      entities: dataModel.entities,
      relationships: dataModel.relationships,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalEntities: dataModel.entities.length,
        totalRelationships: dataModel.relationships.length,
      }
    };
    
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `er-diagram-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white sticky top-0 z-10 p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="text-sm font-medium mb-1 block">
              Search Entities
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search entities..."
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="entity-type" className="text-sm font-medium mb-1 block">
              Entity Type
            </label>
            <Select
              value={entityTypeFilter}
              onValueChange={setEntityTypeFilter}
            >
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="entity">Entities</SelectItem>
                <SelectItem value="sub-entity">Sub-Entities</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLayoutMode(layoutMode === "grid" ? "flow" : "grid")}
              title={`Switch to ${layoutMode === "grid" ? "flow" : "grid"} layout`}
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={exportDiagram}
              title="Export diagram"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowHelp(!showHelp)}
              title="Help"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showHelp && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Format Help</AlertTitle>
            <AlertDescription>
              To upload data models, use a JSON file with <code>entities</code> and <code>relationships</code> arrays. 
              Each entity should have an id, name, definition, type, and attributes array. Each relationship should have 
              source and target entity IDs and cardinality. Download a <a href="/sample-data-model.json" target="_blank" className="text-blue-500 underline">sample file</a>.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div 
        className="flex-1 overflow-auto p-4 bg-slate-50"
        ref={canvasRef}
      >
        <div 
          className={`${layoutMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "flex flex-wrap gap-4"}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          {filteredEntities.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">
              No entities match your search criteria.
            </div>
          ) : (
            filteredEntities.map((entity) => (
              <Card 
                key={entity.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedEntity?.id === entity.id
                    ? "border-blue-500 shadow-md"
                    : selectedEntity && getRelatedEntities(selectedEntity.id).some(e => e.id === entity.id)
                    ? "border-green-500"
                    : "border-transparent"
                } ${layoutMode === "flow" ? "w-80" : ""}`}
                onClick={() => handleEntityClick(entity)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">
                      {entity.name}
                    </CardTitle>
                    <Badge variant={entity.type === "entity" ? "default" : "outline"}>
                      {entity.type === "entity" ? "Entity" : "Sub-Entity"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{entity.definition}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted text-muted-foreground">
                          <th className="font-medium text-left p-1">Attribute</th>
                          <th className="font-medium text-left p-1">Type</th>
                          <th className="font-medium text-center p-1">Req</th>
                          <th className="font-medium text-center p-1">Key</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entity.attributes.map((attr) => (
                          <tr key={attr.id} className="border-t">
                            <td className="p-1 text-left font-medium">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">{attr.name}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{attr.description || "No description"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="p-1 text-left">{attr.type}</td>
                            <td className="p-1 text-center">
                              {attr.required ? "✓" : ""}
                            </td>
                            <td className="p-1 text-center">
                              {attr.isPrimaryKey ? "PK" : ""}
                              {attr.isForeignKey ? "FK" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {selectedEntity && (
        <div className="bg-white p-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold mb-2">Relationships for {selectedEntity.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEntity(null)}
              className="h-8 px-2"
            >
              Close
            </Button>
          </div>
          {getEntityRelationships(selectedEntity.id).length > 0 ? (
            <div className="space-y-2">
              {getEntityRelationships(selectedEntity.id).map((rel) => {
                const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId);
                const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId);
                return (
                  <div key={rel.id} className="text-sm p-2 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{rel.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {rel.sourceCardinality} : {rel.targetCardinality}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rel.description}</p>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span>{sourceEntity?.name} → {targetEntity?.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No relationships found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ERDiagramViewer;
