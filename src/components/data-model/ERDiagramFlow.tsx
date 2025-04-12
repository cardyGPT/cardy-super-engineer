
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  NodeTypes,
  ConnectionLineType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DataModel, Entity, Relationship } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, ZoomIn, ZoomOut, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Custom node component for entity visualization
const EntityNode = ({ data }: { data: any }) => {
  const [expanded, setExpanded] = useState(false);
  const displayAttributes = expanded ? data.entity.attributes : data.entity.attributes.slice(0, 4);
  const hiddenCount = data.entity.attributes.length - 4;
  
  return (
    <Card className={`w-64 shadow-md ${data.selected ? 'border-2 border-blue-500' : 'border border-gray-200'} ${data.type === 'sub-entity' ? 'bg-blue-50' : 'bg-white'}`}>
      <CardHeader className="py-2 px-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-semibold">{data.label}</CardTitle>
          <Badge variant={data.entity.type === "sub-entity" ? "secondary" : "default"}>
            {data.entity.type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{data.entity.definition}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-1 text-left">Attribute</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-center">Req</th>
                <th className="px-2 py-1 text-center">Key</th>
              </tr>
            </thead>
            <tbody>
              {displayAttributes.map((attr: any) => (
                <tr key={attr.id || attr.name} className="border-t border-gray-100">
                  <td className="px-2 py-1 font-medium">{attr.name}</td>
                  <td className="px-2 py-1">{attr.type}</td>
                  <td className="px-2 py-1 text-center">{attr.required ? "✓" : ""}</td>
                  <td className="px-2 py-1 text-center">
                    {attr.isPrimaryKey || attr.key ? "PK" : ""}
                    {attr.isForeignKey ? "FK" : ""}
                  </td>
                </tr>
              ))}
              {!expanded && hiddenCount > 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-1 text-center">
                    <button 
                      onClick={() => setExpanded(true)} 
                      className="text-blue-500 hover:underline text-xs flex items-center justify-center w-full"
                    >
                      + {hiddenCount} more attributes <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                  </td>
                </tr>
              )}
              {expanded && (
                <tr>
                  <td colSpan={4} className="px-2 py-1 text-center">
                    <button 
                      onClick={() => setExpanded(false)}
                      className="text-blue-500 hover:underline text-xs flex items-center justify-center w-full"
                    >
                      Show less <ChevronUp className="h-3 w-3 ml-1" />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

interface ERDiagramFlowProps {
  dataModel: DataModel;
  onEntitySelect?: (entity: Entity | null) => void;
}

const nodeTypes: NodeTypes = {
  entity: EntityNode,
};

const ERDiagramFlow = ({ dataModel, onEntitySelect }: ERDiagramFlowProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const flowRef = useRef(null);
  
  // Generate nodes from entities
  const initialNodes = useMemo(() => {
    return dataModel.entities.map((entity, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      return {
        id: entity.id,
        type: 'entity',
        position: { x: col * 300, y: row * 250 },
        data: { 
          label: entity.name,
          entity: entity,
          selected: false
        },
        dragHandle: '.drag-handle',
      };
    });
  }, [dataModel]);

  // Generate edges from relationships
  const initialEdges = useMemo(() => {
    return dataModel.relationships.map((relationship, index) => {
      // Extract source and target IDs from relationship
      let sourceId = relationship.sourceEntityId;
      let targetId = relationship.targetEntityId;
      
      // Determine relationship type for styling
      const sourceEntity = dataModel.entities.find(e => e.id === sourceId);
      const targetEntity = dataModel.entities.find(e => e.id === targetId);
      const isCrossType = sourceEntity?.type !== targetEntity?.type;
      
      return {
        id: relationship.id || `edge-${index}`,
        source: sourceId,
        target: targetId,
        label: relationship.name || `${relationship.sourceCardinality || '1'}:${relationship.targetCardinality || '1'}`,
        labelStyle: { fill: '#333', fontWeight: 500 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
        type: 'smoothstep',
        style: { 
          stroke: isCrossType ? '#8b5cf6' : '#3b82f6',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCrossType ? '#8b5cf6' : '#3b82f6',
        },
      };
    });
  }, [dataModel]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Apply filters to nodes
  useEffect(() => {
    const filteredNodes = initialNodes
      .filter((node) => {
        const matchesSearch = node.data.entity.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesType =
          entityTypeFilter === "all" ||
          node.data.entity.type === entityTypeFilter;
        return matchesSearch && matchesType;
      })
      .map(node => ({
        ...node,
        hidden: false
      }));
    
    // Hide nodes that don't match filter
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    
    const updatedNodes = initialNodes.map(node => ({
      ...node,
      hidden: !visibleNodeIds.has(node.id)
    }));
    
    // Only show edges connected to visible nodes
    const updatedEdges = initialEdges.map(edge => ({
      ...edge,
      hidden: !visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)
    }));
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [initialNodes, initialEdges, searchTerm, entityTypeFilter, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback(
    (_, node) => {
      // Update selected state for nodes
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            selected: n.id === node.id ? !n.data.selected : false,
          },
        }))
      );

      // Find the entity and trigger callback
      const selectedEntity = node.data.selected 
        ? null 
        : dataModel.entities.find(e => e.id === node.id);
      
      if (onEntitySelect) {
        onEntitySelect(selectedEntity);
      }
    },
    [dataModel.entities, onEntitySelect, setNodes]
  );

  // Auto-layout nodes in a grid
  const resetLayout = useCallback(() => {
    const newNodes = [...nodes].map((node, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...node,
        position: { x: col * 300, y: row * 250 }
      };
    });
    setNodes(newNodes);
  }, [nodes, setNodes]);

  // Initialize the layout when first loading
  useEffect(() => {
    if (!isInitialized && nodes.length > 0) {
      resetLayout();
      setIsInitialized(true);
    }
  }, [nodes, isInitialized, resetLayout]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' },
      animated: true
    }, eds)),
    [setEdges]
  );

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
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="lookup">Lookup</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetLayout}
              className="whitespace-nowrap"
            >
              Reset Layout
            </Button>
            
            <div className="flex items-center space-x-2 ml-2">
              <Switch 
                id="show-minimap" 
                checked={showMiniMap}
                onCheckedChange={setShowMiniMap}
              />
              <label htmlFor="show-minimap" className="text-xs">
                Mini Map
              </label>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              <Switch 
                id="show-grid" 
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
              <label htmlFor="show-grid" className="text-xs">
                Grid
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-grow h-[calc(100%-80px)]">
        {dataModel.entities.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Alert className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertTitle>No Entities Found</AlertTitle>
              <AlertDescription>
                This data model doesn't contain any entities. Please upload a valid data model with entities and relationships.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <ReactFlow
            ref={flowRef}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' }
            }}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' }}
            fitView
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable={true}
            elementsSelectable={true}
            proOptions={{ hideAttribution: true }}
          >
            {showGrid && <Background />}
            <Controls />
            {showMiniMap && (
              <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
              />
            )}
            <Panel position="top-right" className="bg-white p-2 rounded shadow-sm">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500">Entity</Badge>
                <Badge variant="secondary">Sub-Entity</Badge>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>
    </div>
  );
};

export default ERDiagramFlow;
