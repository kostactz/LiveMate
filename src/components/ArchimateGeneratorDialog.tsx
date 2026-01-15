import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { parseArchimateXML } from '@/lib/archimate-parser';
import { generateMermaidFromArchimate } from '@/lib/mermaid-generator';
import type { ArchimateElement, ArchimateRelationship, ArchimateModel } from '@/lib/archimate-parser';
import { ScrollArea } from './ui/scroll-area';

interface ArchimateGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (script: string) => void;
}

export default function ArchimateGeneratorDialog({
  open,
  onOpenChange,
  onInsert,
}: ArchimateGeneratorDialogProps) {
  const [model, setModel] = useState<ArchimateModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const xmlContent = reader.result as string;
        const parsedModel = parseArchimateXML(xmlContent);
        setModel(parsedModel);
        setError(null);
      } catch (err) {
        console.error('Parsing error:', err);
        setError('Failed to parse the XML file. Please check the file content.');
      }
    };
    reader.onerror = () => {
      setError('Error reading the file.');
    };
    reader.readAsText(file);
  };

  const availableFilters = useMemo(() => {
    if (!model) return { entityTypes: [], relationshipTypes: [] };

    const entityTypes = new Set<string>();
    const relationshipTypes = new Set<string>();

    const viewElements = new Set<string>();

    if (selectedViews.length > 0) {
      selectedViews.forEach(viewId => {
        model.views.get(viewId)?.elementRefs.forEach(ref => viewElements.add(ref));
      });

      viewElements.forEach(elementId => {
        const element = model.elements.get(elementId);
        if (element) {
          entityTypes.add(element.type);
        }
      });

      model.relationships.forEach(rel => {
        if (viewElements.has(rel.source) && viewElements.has(rel.target)) {
          relationshipTypes.add(rel.type);
        }
      });
    } else {
      model.elements.forEach(el => entityTypes.add(el.type));
      model.relationships.forEach(rel => relationshipTypes.add(rel.type));
    }

    return {
      entityTypes: Array.from(entityTypes).sort(),
      relationshipTypes: Array.from(relationshipTypes).sort(),
    };
  }, [model, selectedViews]);

  // Update selected types when available filters change
  React.useEffect(() => {
    setSelectedEntityTypes(prev => prev.filter(t => availableFilters.entityTypes.includes(t)));
    setSelectedRelationshipTypes(prev => prev.filter(t => availableFilters.relationshipTypes.includes(t)));
  }, [availableFilters]);


  // Memoize the final filtered results for the preview
  const filteredResult = useMemo(() => {
    if (!model) return { entities: [], relationships: [], entityCounts: {}, relationshipCounts: {} };

    // 1. Get all entities from selected views (or all entities if no view is selected)
    let entitiesInViews: ArchimateElement[] = [];
    if (selectedViews.length > 0) {
      const elementIdsInViews = new Set<string>();
      selectedViews.forEach(viewId => {
        model.views.get(viewId)?.elementRefs.forEach(id => elementIdsInViews.add(id));
      });
      entitiesInViews = Array.from(elementIdsInViews)
        .map(id => model.elements.get(id))
        .filter((el): el is ArchimateElement => !!el);
    } else {
      entitiesInViews = Array.from(model.elements.values());
    }

    // 2. Filter those entities by the selected entity types
    const filteredEntities = entitiesInViews.filter(entity =>
      selectedEntityTypes.includes(entity.type)
    );
    const filteredEntityIds = new Set(filteredEntities.map(e => e.identifier));

    // 3. Filter relationships where both source and target are in the filtered entities list
    const relationshipsInScope = model.relationships.filter(
      rel => filteredEntityIds.has(rel.source) && filteredEntityIds.has(rel.target)
    );

    // 4. Further filter relationships by selected relationship types
    const filteredRelationships = relationshipsInScope.filter(rel =>
      selectedRelationshipTypes.includes(rel.type)
    );
    
    // 5. Calculate counts for the summary
    const entityCounts = filteredEntities.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const relationshipCounts = filteredRelationships.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);


    return { entities: filteredEntities, relationships: filteredRelationships, entityCounts, relationshipCounts };
  }, [model, selectedViews, selectedEntityTypes, selectedRelationshipTypes]);


  const handleCheckboxChange = (
    state: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    checked: boolean
  ) => {
    if (checked) {
      setter([...state, value]);
    } else {
      setter(state.filter(item => item !== value));
    }
  };
  
  const handleInsert = () => {
    if (!model) return;

    const { entities, relationships } = filteredResult;
    if (entities.length === 0) return;

    const mermaidScript = generateMermaidFromArchimate(entities, relationships);
    onInsert('```mermaid\n' + mermaidScript + '\n```');
  };
  
  const allViews = model ? Array.from(model.views.values()).sort((a,b) => a.name.localeCompare(b.name)) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Mermaid Diagram from Archimate Model</DialogTitle>
          <DialogDescription>
            Upload an Archimate XML file to generate a diagram.
          </DialogDescription>
        </DialogHeader>

        {!model && (
          <div className="flex flex-col items-center justify-center flex-grow border-2 border-dashed border-border rounded-lg p-6 bg-muted">
            <UploadCloud className="w-12 h-12 text-primary mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Drag and drop your XML file here, or</p>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                Browse Files
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(event) => {
                console.log('File upload triggered'); // Debugging log
                handleFileUpload(event);
              }}
            />
            {error && (
              <div className="mt-4 p-3 border border-destructive rounded bg-red-50 text-destructive">
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setError(null); // Clear the error
                    document.getElementById('file-upload')?.click(); // Trigger file upload again
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {model && (
          <div className="flex items-center justify-between p-4 border rounded bg-muted">
            <p className="text-sm text-muted-foreground">You can now generate a diagram.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModel(null); // Clear the current model
                setSelectedViews([]); // Reset selected views
                setSelectedEntityTypes([]); // Reset selected entity types
                setSelectedRelationshipTypes([]); // Reset selected relationship types
              }}
            >
              Replace File
            </Button>
          </div>
        )}

        {model && (
          <ScrollArea className="flex-grow min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-6">
              {/* Views Column */}
              <div className="flex flex-col gap-4 border-r pr-6">
                <h3 className="font-semibold text-lg">1. Select Views</h3>
                <p className="text-sm text-muted-foreground">Select one or more views to narrow down the available elements. If no view is selected, all elements will be available.</p>
                <div className="space-y-2">
                  {Array.from(model.views.values()).map(view => (
                    <div key={view.identifier} className="flex items-center space-x-2">
                      <Checkbox
                        id={`view-${view.identifier}`}
                        checked={selectedViews.includes(view.identifier)}
                        onCheckedChange={checked =>
                          handleCheckboxChange(
                            selectedViews,
                            setSelectedViews,
                            view.identifier,
                            !!checked
                          )
                        }
                      />
                      <Label htmlFor={`view-${view.identifier}`} className="font-normal cursor-pointer">{view.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters Column */}
              <div className="flex flex-col gap-4 border-r pr-6">
                <h3 className="font-semibold text-lg">2. Apply Filters</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium">Entity Types</h4>
                    <div className="space-y-2">
                      {availableFilters.entityTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`entity-${type}`}
                            checked={selectedEntityTypes.includes(type)}
                            onCheckedChange={checked =>
                              handleCheckboxChange(
                                selectedEntityTypes,
                                setSelectedEntityTypes,
                                type,
                                !!checked
                              )
                            }
                          />
                          <Label htmlFor={`entity-${type}`} className="font-normal cursor-pointer">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium">Relationship Types</h4>
                    <div className="space-y-2">
                      {availableFilters.relationshipTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rel-${type}`}
                            checked={selectedRelationshipTypes.includes(type)}
                            onCheckedChange={checked =>
                              handleCheckboxChange(
                                selectedRelationshipTypes,
                                setSelectedRelationshipTypes,
                                type,
                                !!checked
                              )
                            }
                          />
                          <Label htmlFor={`rel-${type}`} className="font-normal cursor-pointer">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Column */}
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">3. Preview Summary</h3>
                <div className="p-4 bg-muted rounded-lg text-sm space-y-4">
                  <div>
                    <h4 className="font-medium">Total Entities: {filteredResult.entities.length}</h4>
                    <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                      {Object.entries(filteredResult.entityCounts).map(([type, count]) => (
                        <li key={type}>{type}: {count}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Total Relationships: {filteredResult.relationships.length}</h4>
                    <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                      {Object.entries(filteredResult.relationshipCounts).map(([type, count]) => (
                        <li key={type}>{type}: {count}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!model}>
            Insert to Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
