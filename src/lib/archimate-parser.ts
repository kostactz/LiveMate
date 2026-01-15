
export interface ArchimateElement {
  identifier: string;
  type: string;
  name: string;
}

export interface ArchimateRelationship {
  identifier: string;
  type: string;
  source: string;
  target: string;
  name: string | null;
}

export interface ArchimateView {
  identifier: string;
  name: string;
  elementRefs: string[];
}

export interface ArchimateModel {
  elements: Map<string, ArchimateElement>;
  relationships: ArchimateRelationship[];
  views: Map<string, ArchimateView>;
}

export function parseArchimateXML(xmlString: string): ArchimateModel {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Failed to parse XML');
    }

    const elements = new Map<string, ArchimateElement>();
    const relationships: ArchimateRelationship[] = [];
    const views = new Map<string, ArchimateView>();

    // Parse elements
    const elementNodes = xmlDoc.getElementsByTagName('element');
    for (const node of Array.from(elementNodes)) {
      const identifier = node.getAttribute('identifier');
      const type = node.getAttribute('xsi:type');
      const name = node.getElementsByTagName('name')[0]?.textContent;
      if (identifier && type && name) {
        elements.set(identifier, { identifier, type, name });
      }
    }

    // Parse relationships
    const relationshipNodes = xmlDoc.getElementsByTagName('relationship');
    for (const node of Array.from(relationshipNodes)) {
      const identifier = node.getAttribute('identifier');
      const type = node.getAttribute('xsi:type');
      const source = node.getAttribute('source');
      const target = node.getAttribute('target');
      const name = node.getElementsByTagName('name')[0]?.textContent || null;
      if (identifier && type && source && target) {
        relationships.push({ identifier, type, source, target, name });
      }
    }

    // Parse views
    const viewNodes = xmlDoc.getElementsByTagName('view');
    for (const node of Array.from(viewNodes)) {
      const identifier = node.getAttribute('identifier');
      const name = node.getElementsByTagName('name')[0]?.textContent;
      if (identifier && name) {
        const elementRefs: string[] = [];
        const nodeRefs = node.getElementsByTagName('node');
        for (const refNode of Array.from(nodeRefs)) {
          const elementRef = refNode.getAttribute('elementRef');
          if (elementRef) {
            elementRefs.push(elementRef);
          }
        }
        views.set(identifier, { identifier, name, elementRefs });
      }
    }

    return { elements, relationships, views };
  } catch (error) {
    console.error('Error parsing Archimate XML:', error);
    throw error;
  }
}

    