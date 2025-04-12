
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
import { Search, ZoomIn, ZoomOut, Filter, Download, Share2, Info, GitBranch } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";

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
  const [showRelationshipLines, setShowRelationshipLines] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Reset selected entity when data model changes
  useEffect(() => {
    setSelectedEntity(null);
  }, [dataModel]);
  
  const filteredEntities = dataModel.entities.filter((entity) => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = entityTypeFilter === "all" || 
                        (entityTypeFilter === "entity" && entity.type === "entity") ||
                        (entityTypeFilter === "sub-entity" && entity.type === "sub-entity");
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
  
  // Get relationship type display
  const getRelationshipTypeDisplay = (relationship: Relationship) => {
    const sourceCardinality = relationship.sourceCardinality || "1";
    const targetCardinality = relationship.targetCardinality || "1";
    
    if (sourceCardinality === "1" && targetCardinality === "1") {
      return "One-to-One";
    } else if (sourceCardinality === "1" && targetCardinality === "*") {
      return "One-to-Many";
    } else if (sourceCardinality === "*" && targetCardinality === "1") {
      return "Many-to-One";
    } else if (sourceCardinality === "*" && targetCardinality === "*") {
      return "Many-to-Many";
    }
    
    return `${sourceCardinality}:${targetCardinality}`;
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
            
            <ToggleGroup type="single" value={layoutMode} onValueChange={(value) => value && setLayoutMode(value as "grid" | "flow")}>
              <ToggleGroupItem value="grid" aria-label="Grid Layout">
                Grid
              </ToggleGroupItem>
              <ToggleGroupItem value="flow" aria-label="Flow Layout">
                Flow
              </ToggleGroupItem>
            </ToggleGroup>
            
            <div className="flex items-center space-x-2 ml-2">
              <Switch 
                id="show-relationships" 
                checked={showRelationshipLines}
                onCheckedChange={setShowRelationshipLines}
              />
              <label htmlFor="show-relationships" className="text-xs">
                Show Relationships
              </label>
            </div>
            
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
          className={`relative ${layoutMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "flex flex-wrap gap-4"}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          {filteredEntities.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">
              No entities match your search criteria.
            </div>
          ) : (
            <>
              {showRelationshipLines && selectedEntity && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  {getEntityRelationships(selectedEntity.id).map((rel) => {
                    const sourceEntity = selectedEntity.id === rel.sourceEntityId ? 
                      selectedEntity : 
                      dataModel.entities.find(e => e.id === rel.sourceEntityId);
                    const targetEntity = selectedEntity.id === rel.targetEntityId ? 
                      selectedEntity : 
                      dataModel.entities.find(e => e.id === rel.targetEntityId);
                    
                    if (!sourceEntity || !targetEntity) return null;
                    
                    // Find the DOM elements for source and target
                    const sourceEl = document.getElementById(`entity-${sourceEntity.id}`);
                    const targetEl = document.getElementById(`entity-${targetEntity.id}`);
                    
                    if (!sourceEl || !targetEl) return null;
                    
                    const sourceRect = sourceEl.getBoundingClientRect();
                    const targetRect = targetEl.getBoundingClientRect();
                    const containerRect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                    
                    // Calculate center points relative to the container
                    const sourceX = (sourceRect.left + sourceRect.width / 2) - containerRect.left;
                    const sourceY = (sourceRect.top + sourceRect.height / 2) - containerRect.top;
                    const targetX = (targetRect.left + targetRect.width / 2) - containerRect.left;
                    const targetY = (targetRect.top + targetRect.height / 2) - containerRect.top;
                    
                    // Apply zoom scaling
                    const scaledSourceX = sourceX / zoom;
                    const scaledSourceY = sourceY / zoom;
                    const scaledTargetX = targetX / zoom;
                    const scaledTargetY = targetY / zoom;
                    
                    return (
                      <g key={rel.id}>
                        <line 
                          x1={scaledSourceX} 
                          y1={scaledSourceY} 
                          x2={scaledTargetX} 
                          y2={scaledTargetY}
                          stroke={rel.sourceEntityId === selectedEntity.id ? "#3b82f6" : "#10b981"}
                          strokeWidth="2"
                          strokeDasharray={rel.targetEntityId === selectedEntity.id ? "5,5" : ""}
                        />
                        <text 
                          x={(scaledSourceX + scaledTargetX) / 2} 
                          y={(scaledSourceY + scaledTargetY) / 2 - 10}
                          textAnchor="middle" 
                          fill="#4b5563" 
                          fontSize="10"
                          className="bg-white px-1"
                        >
                          <tspan className="bg-white px-1">
                            {rel.name || getRelationshipTypeDisplay(rel)}
                          </tspan>
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
              
              {filteredEntities.map((entity) => (
                <Card 
                  key={entity.id}
                  id={`entity-${entity.id}`}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedEntity?.id === entity.id
                      ? "border-blue-500 shadow-md"
                      : selectedEntity && getRelatedEntities(selectedEntity.id).some(e => e.id === entity.id)
                      ? "border-green-500"
                      : "border-transparent"
                  } ${layoutMode === "flow" ? "w-80" : ""} relative`}
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
                    
                    {selectedEntity?.id === entity.id && getEntityRelationships(entity.id).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold mb-2">Relationships:</h4>
                        <div className="space-y-1">
                          {getEntityRelationships(entity.id).map((rel) => {
                            const otherEntityId = rel.sourceEntityId === entity.id ? rel.targetEntityId : rel.sourceEntityId;
                            const otherEntity = dataModel.entities.find(e => e.id === otherEntityId);
                            const isSource = rel.sourceEntityId === entity.id;
                            
                            return (
                              <div 
                                key={rel.id}
                                className="flex items-center gap-1 text-xs p-1 rounded hover:bg-slate-100"
                              >
                                <GitBranch className="h-3 w-3 flex-shrink-0" />
                                <span className="flex-1 truncate">
                                  {isSource ? 'To' : 'From'} <b>{otherEntity?.name || otherEntityId}</b>
                                  {rel.name ? ` (${rel.name})` : ''}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {getRelationshipTypeDisplay(rel)}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
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
                const isSource = rel.sourceEntityId === selectedEntity.id;
                
                return (
                  <div key={rel.id} className="text-sm p-2 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{rel.name || `Relation to ${isSource ? targetEntity?.name : sourceEntity?.name}`}</span>
                      <Badge variant="outline" className="ml-2">
                        {getRelationshipTypeDisplay(rel)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rel.description || "No description"}</p>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span>{sourceEntity?.name} {isSource ? "→" : "←"} {targetEntity?.name}</span>
                      <span className="text-gray-500">
                        {rel.sourceCardinality || "1"} : {rel.targetCardinality || "1"}
                      </span>
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
