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
import { Search, ZoomIn, ZoomOut, Filter, Download, Share2, Info, GitBranch, Database } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

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
  const [relationshipLines, setRelationshipLines] = useState<JSX.Element[]>([]);
  const [drawAttempts, setDrawAttempts] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setSelectedEntity(null);
  }, [dataModel]);

  useEffect(() => {
    if (!showRelationshipLines) {
      setRelationshipLines([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (selectedEntity) {
        drawRelationshipLines();
      } else {
        drawAllRelationshipLines();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [showRelationshipLines, selectedEntity, layoutMode, searchTerm, entityTypeFilter, zoom, drawAttempts]);

  useEffect(() => {
    const handleResize = () => {
      if (showRelationshipLines) {
        setDrawAttempts(prev => prev + 1);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showRelationshipLines]);

  const drawAllRelationshipLines = () => {
    if (!canvasRef.current || !diagramRef.current) {
      console.log("Canvas or diagram ref not available");
      return;
    }
    
    const filteredEntities = dataModel.entities.filter((entity) => {
      const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = entityTypeFilter === "all" || 
                          (entityTypeFilter === "entity" && entity.type === "entity") ||
                          (entityTypeFilter === "sub-entity" && entity.type === "sub-entity");
      return matchesSearch && matchesType;
    });
    
    const filteredEntityIds = filteredEntities.map(e => e.id);
    
    const svgElements: JSX.Element[] = [];
    const drawnRelationships = new Set<string>();
    
    dataModel.relationships.forEach((rel) => {
      if (!filteredEntityIds.includes(rel.sourceEntityId) || !filteredEntityIds.includes(rel.targetEntityId)) {
        return;
      }
      
      const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId);
      const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId);
      
      if (!sourceEntity || !targetEntity) {
        console.log("Source or target entity not found", rel);
        return;
      }
      
      const sourceEl = document.getElementById(`entity-${sourceEntity.id}`);
      const targetEl = document.getElementById(`entity-${targetEntity.id}`);
      
      if (!sourceEl || !targetEl) {
        console.log("Source or target DOM element not found", sourceEntity.id, targetEntity.id);
        return;
      }

      const relationshipKey = `${rel.id}`;
      if (drawnRelationships.has(relationshipKey)) {
        return;
      }
      drawnRelationships.add(relationshipKey);
      
      try {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const sourceX = (sourceRect.left + sourceRect.width / 2) - canvasRect.left;
        const sourceY = (sourceRect.top + sourceRect.height / 2) - canvasRect.top;
        const targetX = (targetRect.left + targetRect.width / 2) - canvasRect.left;
        const targetY = (targetRect.top + targetRect.height /2) - canvasRect.top;
        
        const scaledSourceX = sourceX / zoom;
        const scaledSourceY = sourceY / zoom;
        const scaledTargetX = targetX / zoom;
        const scaledTargetY = targetY / zoom;
        
        const lineColor = getRelationshipLineColor(rel);
        const lineStyle = getRelationshipLineStyle(sourceEntity.type, targetEntity.type);
        
        const angle = Math.atan2(scaledTargetY - scaledSourceY, scaledTargetX - scaledSourceX);
        const arrowLength = 10;
        
        const arrowDist = 20;
        const arrowX = scaledTargetX - arrowDist * Math.cos(angle);
        const arrowY = scaledTargetY - arrowDist * Math.sin(angle);
        
        const arrowPoints = [
          [arrowX, arrowY],
          [arrowX - arrowLength * Math.cos(angle - Math.PI/6), arrowY - arrowLength * Math.sin(angle - Math.PI/6)],
          [arrowX - arrowLength * Math.cos(angle + Math.PI/6), arrowY - arrowLength * Math.sin(angle + Math.PI/6)]
        ];
        
        svgElements.push(
          <g key={rel.id}>
            <line 
              x1={scaledSourceX} 
              y1={scaledSourceY} 
              x2={scaledTargetX} 
              y2={scaledTargetY}
              stroke={lineColor}
              strokeWidth={lineStyle.strokeWidth}
              strokeDasharray={lineStyle.strokeDasharray}
            />
            
            <polygon 
              points={arrowPoints.map(p => p.join(',')).join(' ')}
              fill={lineColor}
            />
            
            <foreignObject
              x={(scaledSourceX + scaledTargetX) / 2 - 60} 
              y={(scaledSourceY + scaledTargetY) / 2 - 15}
              width="120"
              height="30"
              style={{ overflow: 'visible' }}
            >
              <div 
                className="bg-white px-2 py-0.5 rounded border shadow-sm text-center text-xs whitespace-nowrap"
                style={{ display: 'inline-block', maxWidth: '100%', margin: '0 auto' }}
              >
                {rel.name || getRelationshipTypeDisplay(rel)}
              </div>
            </foreignObject>
          </g>
        );
      } catch (err) {
        console.error("Error drawing relationship line:", err);
      }
    });
    
    if (svgElements.length === 0) {
      console.log("No relationship lines to draw");
    } else {
      console.log(`Drew ${svgElements.length} relationship lines`);
    }
    
    setRelationshipLines(svgElements);
  };

  const drawRelationshipLines = () => {
    if (!selectedEntity || !canvasRef.current || !diagramRef.current) {
      console.log("Selected entity or canvas ref not available");
      return;
    }
    
    const relationships = getEntityRelationships(selectedEntity.id);
    console.log(`Drawing ${relationships.length} relationship lines for entity ${selectedEntity.name}`);
    
    const svgElements: JSX.Element[] = [];
    
    relationships.forEach((rel) => {
      const sourceEntity = selectedEntity.id === rel.sourceEntityId ? 
        selectedEntity : 
        dataModel.entities.find(e => e.id === rel.sourceEntityId);
      const targetEntity = selectedEntity.id === rel.targetEntityId ? 
        selectedEntity : 
        dataModel.entities.find(e => e.id === rel.targetEntityId);
      
      if (!sourceEntity || !targetEntity) {
        console.log("Source or target entity not found", rel);
        return;
      }
      
      const sourceEl = document.getElementById(`entity-${sourceEntity.id}`);
      const targetEl = document.getElementById(`entity-${targetEntity.id}`);
      
      if (!sourceEl || !targetEl) {
        console.log("Source or target DOM element not found", sourceEntity.id, targetEntity.id);
        return;
      }

      try {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        const sourceX = (sourceRect.left + sourceRect.width / 2) - canvasRect.left;
        const sourceY = (sourceRect.top + sourceRect.height / 2) - canvasRect.top;
        const targetX = (targetRect.left + targetRect.width / 2) - canvasRect.left;
        const targetY = (targetRect.top + targetRect.height / 2) - canvasRect.top;
        
        const scaledSourceX = sourceX / zoom;
        const scaledSourceY = sourceY / zoom;
        const scaledTargetX = targetX / zoom;
        const scaledTargetY = targetY / zoom;
        
        const lineColor = getRelationshipLineColor(rel, selectedEntity.id);
        const lineStyle = getRelationshipLineStyle(sourceEntity.type, targetEntity.type);
        
        const angle = Math.atan2(scaledTargetY - scaledSourceY, scaledTargetX - scaledSourceX);
        const arrowLength = 10;
        
        const arrowDist = 20;
        const arrowX = scaledTargetX - arrowDist * Math.cos(angle);
        const arrowY = scaledTargetY - arrowDist * Math.sin(angle);
        
        const arrowPoints = [
          [arrowX, arrowY],
          [arrowX - arrowLength * Math.cos(angle - Math.PI/6), arrowY - arrowLength * Math.sin(angle - Math.PI/6)],
          [arrowX - arrowLength * Math.cos(angle + Math.PI/6), arrowY - arrowLength * Math.sin(angle + Math.PI/6)]
        ];
        
        svgElements.push(
          <g key={rel.id}>
            <line 
              x1={scaledSourceX} 
              y1={scaledSourceY} 
              x2={scaledTargetX} 
              y2={scaledTargetY}
              stroke={lineColor}
              strokeWidth={lineStyle.strokeWidth}
              strokeDasharray={lineStyle.strokeDasharray}
            />
            
            <polygon 
              points={arrowPoints.map(p => p.join(',')).join(' ')}
              fill={lineColor}
            />
            
            <foreignObject
              x={(scaledSourceX + scaledTargetX) / 2 - 60} 
              y={(scaledSourceY + scaledTargetY) / 2 - 15}
              width="120"
              height="30"
              style={{ overflow: 'visible' }}
            >
              <div 
                className="bg-white px-2 py-0.5 rounded border shadow-sm text-center text-xs whitespace-nowrap"
                style={{ display: 'inline-block', maxWidth: '100%', margin: '0 auto' }}
              >
                {rel.name || getRelationshipTypeDisplay(rel)}
              </div>
            </foreignObject>
          </g>
        );
      } catch (err) {
        console.error("Error drawing relationship line:", err);
      }
    });
    
    setRelationshipLines(svgElements);
  };

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
  
  const getEntityRelationships = (entityId: string) => {
    return dataModel.relationships.filter(
      (rel) => rel.sourceEntityId === entityId || rel.targetEntityId === entityId
    );
  };
  
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
    
    toast({
      title: "Diagram Exported",
      description: `Your diagram has been exported as ${exportFileDefaultName}`
    });
  };

  const getEntityTypeColor = (type: string): string => {
    switch (type) {
      case 'entity':
        return 'border-blue-500';
      case 'sub-entity':
        return 'border-green-500';
      case 'core':
        return 'border-purple-500';
      case 'lookup':
        return 'border-amber-500';
      case 'reference':
        return 'border-teal-500';
      case 'compliance':
        return 'border-red-500';
      default:
        return 'border-gray-400';
    }
  };

  const getEntityTypeBadgeVariant = (type: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (type) {
      case 'entity':
        return 'default';
      case 'sub-entity':
        return 'secondary';
      case 'core':
        return 'default';
      case 'reference':
        return 'outline';
      case 'compliance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRelationshipLineColor = (rel: Relationship, selectedEntityId?: string) => {
    const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId);
    const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId);
    
    const isCrossTypeRelationship = sourceEntity && targetEntity && sourceEntity.type !== targetEntity.type;
    
    if (selectedEntityId && rel.sourceEntityId === selectedEntityId) {
      if (isCrossTypeRelationship) {
        return sourceEntity?.type === 'entity' && targetEntity?.type === 'sub-entity' 
          ? '#10b981' // green for entity -> sub-entity
          : '#8b5cf6'; // purple for entity -> other type
      }
      return '#3b82f6'; // blue for normal entity -> entity
    }
    
    if (selectedEntityId && rel.targetEntityId === selectedEntityId) {
      if (isCrossTypeRelationship) {
        return sourceEntity?.type === 'sub-entity' && targetEntity?.type === 'entity'
          ? '#8b5cf6' // purple for sub-entity -> entity
          : '#10b981'; // green for other type -> entity
      }
      return '#f59e0b'; // amber for normal entity -> entity
    }
    
    if (isCrossTypeRelationship) {
      return '#8b5cf6'; // purple for cross-type
    }
    return '#3b82f6'; // blue default
  };

  const getRelationshipLineStyle = (sourceType: string | undefined, targetType: string | undefined) => {
    if (sourceType !== targetType) {
      return {
        strokeDasharray: "5,5", 
        strokeWidth: 2.5
      };
    }
    
    return {
      strokeDasharray: "", 
      strokeWidth: 2
    };
  };

  const isCrossTypeRelationship = (sourceEntityId: string, targetEntityId: string) => {
    const sourceEntity = dataModel.entities.find(e => e.id === sourceEntityId);
    const targetEntity = dataModel.entities.find(e => e.id === targetEntityId);
    return sourceEntity && targetEntity && sourceEntity.type !== targetEntity.type;
  };

  const forceRedraw = () => {
    setDrawAttempts(prev => prev + 1);
    toast({
      title: "Redrawing relationships",
      description: "The relationship lines have been redrawn."
    });
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
                onCheckedChange={(checked) => {
                  setShowRelationshipLines(checked);
                  if (checked) {
                    setTimeout(() => forceRedraw(), 100);
                  }
                }}
              />
              <label htmlFor="show-relationships" className="text-xs">
                Show Relationships
              </label>
            </div>
            
            {showRelationshipLines && (
              <Button
                variant="outline"
                size="sm"
                onClick={forceRedraw}
                className="ml-1"
                title="Force redraw relationships"
              >
                Redraw
              </Button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportDiagram}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export diagram</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowHelp(!showHelp)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Help</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          ref={diagramRef}
        >
          {filteredEntities.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">
              No entities match your search criteria.
            </div>
          ) : (
            <>
              {showRelationshipLines && (
                <svg 
                  ref={svgRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                  style={{ zIndex: 1 }}
                >
                  {relationshipLines}
                </svg>
              )}
              
              {filteredEntities.map((entity) => {
                const entityTypeColor = getEntityTypeColor(entity.type);
                const isRelated = selectedEntity && getRelatedEntities(selectedEntity.id).some(e => e.id === entity.id);
                
                return (
                  <Card 
                    key={entity.id}
                    id={`entity-${entity.id}`}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedEntity?.id === entity.id
                        ? "border-blue-500 shadow-md"
                        : isRelated
                        ? entityTypeColor
                        : "border-transparent"
                    } ${layoutMode === "flow" ? "w-80" : ""} relative`}
                    onClick={() => handleEntityClick(entity)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold">
                          {entity.name}
                        </CardTitle>
                        <Badge variant={getEntityTypeBadgeVariant(entity.type)}>
                          {entity.type}
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
                              <tr key={attr.id || attr.name} className="border-t">
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
                              const otherEntityId = rel.sourceEntityId === entity.id ? 
                                rel.targetEntityId : 
                                rel.sourceEntityId;
                              const otherEntity = dataModel.entities.find(e => e.id === otherEntityId);
                              const isSource = rel.sourceEntityId === entity.id;
                              const crossTypeRelationship = isCrossTypeRelationship(rel.sourceEntityId, rel.targetEntityId);
                              
                              return (
                                <div 
                                  key={rel.id}
                                  className={`flex items-center gap-1 text-xs p-1 rounded hover:bg-slate-100 ${
                                    crossTypeRelationship ? "bg-blue-50" : ""
                                  }`}
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
                );
              })}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getEntityRelationships(selectedEntity.id).length > 0 ? (
              getEntityRelationships(selectedEntity.id).map((rel) => {
                const sourceEntity = dataModel.entities.find(e => e.id === rel.sourceEntityId);
                const targetEntity = dataModel.entities.find(e => e.id === rel.targetEntityId);
                const isSource = rel.sourceEntityId === selectedEntity.id;
                const crossTypeRelationship = isCrossTypeRelationship(rel.sourceEntityId, rel.targetEntityId);
                
                return (
                  <div 
                    key={rel.id} 
                    className={`text-sm p-2 rounded-md ${
                      crossTypeRelationship 
                        ? "bg-blue-50 border border-blue-200" 
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{rel.name || `Relation to ${isSource ? targetEntity?.name : sourceEntity?.name}`}</span>
                      <Badge variant="outline" className="ml-2">
                        {getRelationshipTypeDisplay(rel)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rel.description || "No description"}</p>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span>
                        {sourceEntity?.name} 
                        <span className="mx-1">
                          {isSource ? "→" : "←"}
                        </span>
                        {targetEntity?.name}
                      </span>
                      <span className="text-gray-500">
                        {rel.sourceCardinality || "1"} : {rel.targetCardinality || "1"}
                      </span>
                    </div>
                    
                    {crossTypeRelationship && (
                      <div className="mt-1 text-xs text-blue-600 font-medium">
                        Cross-type: {sourceEntity?.type} → {targetEntity?.type}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No relationships found for this entity.</p>
            )}
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground border-t pt-2">
            <div className="mb-1">Relationship visualization:</div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span> Entity to Entity
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span> Entity to Sub-entity
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span> Sub-entity to Entity
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 border border-gray-400 rounded-full mr-1"></span> 
                <span className="border-t border-dashed border-gray-400 w-4 mx-1"></span> 
                Cross-type Relationship
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERDiagramViewer;
