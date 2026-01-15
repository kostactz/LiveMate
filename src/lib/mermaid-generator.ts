
import type {
  ArchimateElement,
  ArchimateRelationship,
} from './archimate-parser';

// Helper to sanitize names for Mermaid node labels
function sanitizeName(name: string): string {
  // Mermaid labels need to be in quotes if they contain special characters
  // Replacing double quotes inside the name to avoid breaking the label
  return `"${name.replace(/"/g, '#quot;')}"`;
}

export function generateMermaidFromArchimate(
  entities: ArchimateElement[],
  relationships: ArchimateRelationship[]
): string {
  if (entities.length === 0) {
    return 'graph TD;\n  subgraph "Empty Diagram"\n    A["No elements selected"];\n  end';
  }

  let script = 'graph TD;\n';

  // Add entities (nodes)
  script += '\n  %% Entities\n';
  entities.forEach(entity => {
    // Mermaid node IDs should be unique. The original identifier is perfect for this.
    // Modern Mermaid handles hyphens in IDs without issue.
    const safeId = entity.identifier;
    script += `  ${safeId}["${sanitizeName(entity.name)}"];\n`;
  });

  // Add relationships (links)
  script += '\n  %% Relationships\n';
  relationships.forEach(rel => {
    const sourceSafeId = rel.source;
    const targetSafeId = rel.target;
    const label = rel.type;

    script += `  ${sourceSafeId} -->|"${label}"| ${targetSafeId};\n`;
  });

  return script;
}
