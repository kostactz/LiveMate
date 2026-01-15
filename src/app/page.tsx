
"use client";

import { useState, useRef, useTransition, useCallback, useEffect, type ElementRef } from 'react';
import { FileDown, Network } from 'lucide-react';

async function geminiCallCloudflare(prompt: string): Promise<string> {
  console.log('[Gemini] Sending prompt to /api/gemini-call:', prompt);
  try {
    const response = await fetch('/api/gemini-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    console.log('[Gemini] Response status:', response.status);
    const responseText = await response.text();
    console.log('[Gemini] Raw response text:', responseText);
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('[Gemini] Failed to parse JSON:', jsonError);
      throw new Error('Invalid JSON response from Gemini function.');
    }
    if (data.error) {
      console.error('[Gemini] Error in response:', data.error);
      // Extract user-friendly message from nested error structure
      // Handle both: { error: string } and { error: { message: string, ... } }
      let errorMessage = 'An error occurred.';
      if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (typeof data.error === 'object' && data.error !== null) {
        // Try to extract message from nested error object
        errorMessage = data.error.message || JSON.stringify(data.error);
      }
      const error = new Error(errorMessage);
      (error as any).originalError = data.error; // Preserve full error for logging
      throw error;
    }
    console.log('[Gemini] Parsed response data:', data);
    return data.result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('[Gemini] Fetch error:', error);
    throw error;
  }
}

async function enhanceTextCloudflare(markdownContent: string): Promise<string> {
  const response = await fetch('/api/enhance-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdownContent }),
  });
  if (!response.ok) {
    throw new Error('Failed to enhance text with AI.');
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.enhancedText;
}

async function describeMermaidCloudflare(mermaidScript: string): Promise<string> {
  const response = await fetch('/api/describe-mermaid-diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mermaidScript }),
  });
  if (!response.ok) {
    throw new Error('Failed to describe Mermaid diagram with AI.');
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.description;
}

import { Button } from '@/components/ui/button';
import CodeMirrorEditor, { type CodeMirrorEditorRef } from '@/components/CodeMirrorEditor';
import MarkdownPreview from '@/components/MarkdownPreview';
import InsertMenuPopover from '@/components/InsertMenuPopover';
import AIProcessingDialog from '@/components/AIProcessingDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMermaidValidator } from '@/hooks/use-mermaid-validator';
import ArchimateGeneratorDialog from '@/components/ArchimateGeneratorDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const defaultMarkdown = `


# Project Name

Solution Architecture Document

| | | 
|-|-|
| **Project Name:** | *Insert the official name of the project* | 
| **Solution Architect(s):** | *List the name(s) of the primary architect(s)* | 
| **Status:** | *Draft, In Review, Approved, Rejected* | 
| **Date:** | *YYYY-MM-DD* | 
| **Version:** | *e.g., 1.0* | 

## Document Control

### Version History

| **Version** | **Date** | **Author(s)** | **Summary of Changes** | 
|-|-|-|-|
| 0.1 | YYYY-MM-DD |  | Initial Draft | 
|||||

### Approvers

| **Role** | **Name** | **Signature** | **Date** | 
|-|-|-|-|
| Lead Solution Architect |  |  |  | 
| Head of Security |  |  |  | 
| Head of Infrastructure |  |  |  | 
| Business Sponsor |  |  |  | 

## 1. Introduction and Executive Summary

> **Architect's Note:** This section is the "elevator pitch" for the entire solution. It should be concise, clear, and understandable by both technical and non-technical stakeholders. Assume the reader is a busy executive or a member of the Architecture Review Board (ARB).

### 1.1. Executive Summary

- **Problem Statement:** What is the business problem or opportunity this solution addresses?
- **Proposed Solution:** In one or two sentences, what is the proposed solution at a high level?
- **Business Value & Outcomes:** What are the key benefits and measurable outcomes for the business (e.g., increased revenue by X%, reduced operational cost by Y%, achieved compliance with Z)?
- **Architectural Approach:** Briefly describe the chosen architectural style (e.g., Microservices, Serverless, Monolithic App) and the key technologies involved.
- **Estimated Costs:** Provide a rough order of magnitude (ROM) for implementation and operational costs, if available.

### 1.2. Scope

> **Architect's Note:** Be ruthlessly clear about the boundaries of the solution. This prevents scope creep and manages stakeholder expectations.

#### 1.2.1. In Scope

*List the key features, functionalities, and user groups that are included in this solution.*

- *e.g., User registration and authentication.*
- *e.g., Product catalog browsing and search.*
- *e.g., Integration with the corporate payment gateway.*

#### 1.2.2. Out of Scope

*Explicitly list what this solution will **not** do. This is as important as defining what is in scope.*

- *e.g., User-to-user messaging.*
- *e.g., Back-office administrative functions (to be handled by a separate system).*
- *e.g., Mobile application (this SAD covers the web application only).*

### 1.3. Glossary of Terms

| **Term** | **Definition** | 
|-|-|
| *e.g., CRM* | *Customer Relationship Management* | 
| *e.g., API* | *Application Programming Interface* | 

## 2. Architecture Drivers and Constraints

> **Architect's Note:** This section explains the "why" behind your design decisions. It sets the context for all subsequent architectural choices.

### 2.1. Business Drivers

*What are the primary business goals that are shaping this architecture?*

| **Driver ID** | **Business Goal** | **Description** | **How It Influences Architecture** | 
|-|-|-|-|
| BD-01 | *e.g., Faster Time-to-Market* | *Launch new features quarterly.* | *Requires a modular architecture and automated CI/CD pipeline.* | 
| BD-02 | *e.g., Reduce Operational Costs* | *Lower infrastructure spend by 20%.* | *Favors serverless or PaaS solutions over IaaS.* | 

### 2.2. Architectural Requirements (Non-Functional Requirements)

> **Architect's Note:** NFRs are the most critical inputs for architecture. Make them specific, measurable, achievable, relevant, and time-bound (SMART).

| **Category** | **Requirement ID** | **Requirement Description** | **Metric / Target** | 
|-|-|-|-|
| **Performance** | PERF-01 | *e.g., API response time for 95% of requests.* | *< 200ms* | 
| **Scalability** | SCAL-01 | *e.g., System must handle peak user load.* | *10,000 concurrent users* | 
| **Availability** | AVAIL-01 | *e.g., System uptime.* | *99.95% (max 4.38 hours downtime/year)* | 
| **Reliability** | REL-01 | *e.g., System should process transactions without error.* | *< 0.01% error rate* | 
| **Security** | SEC-01 | *e.g., Compliance with data protection regulations.* | *Full GDPR compliance* | 
| **Maintainability** | MAINT-01 | *e.g., Time for a new developer to become productive.* | *< 2 weeks* | 
| **Operability** | OPS-01 | *e.g., System health must be easily observable.* | *Centralized logging and monitoring dashboards.* | 

### 2.3. Constraints

> **Architect's Note:** These are the non-negotiable limitations you must work within.


- **Technical Constraints:** *e.g., Must use the corporate-approved Azure cloud platform; must integrate with the legacy Oracle ERP system.*
- **Business Constraints:** *e.g., Project budget cannot exceed €XXX,XXX; solution must be live by YYYY-DD.*
- **Regulatory Constraints:** *e.g., Must adhere to PCI DSS for payment processing; must comply with regional data sovereignty laws.*

## 3. Business Architecture

> **Architect's Note:** This section connects the technical solution back to the business context. It demonstrates your understanding of the business domain.

### 3.1. Stakeholder Analysis

*Who are the key stakeholders, and what are their interests or concerns? A RACI matrix can be useful here.*

### 3.2. Business Capabilities

*What are the core business capabilities this solution supports or enables?*

- *e.g., Customer Management*
- *e.g., Order Processing*
- *e.g., Digital Marketing Campaign Management*

### 3.3. Business Process Analysis (As-Is vs. To-Be)

> **Architect's Note:** Use diagrams (like BPMN) to illustrate the business processes. You can embed them here or link to them in a central repository.

#### 3.3.1. As-Is Process

*Describe the current state. What are the pain points?*

#### 3.3.2. To-Be Process

*Describe the future state with the new solution in place. How does it resolve the pain points?*

## 4. Application Architecture

> **Architect's Note:** This is the core of the technical design. Use diagrams extensively. The C4 model (Context, Containers, Components) is an excellent framework to follow.

### 4.1. System Context Diagram (C4 Level 1)

*A high-level diagram showing your system as a black box, its key users (actors), and its interactions with other systems.*

### 4.2. Container Diagram (C4 Level 2)

*A diagram that zooms into the system boundary to show the high-level technical containers (applications, data stores, microservices, etc.) and the interactions between them.*

### 4.3. Key Workflows / Sequence Diagrams

> **Architect's Note:** Pick 2-3 of the most critical or complex scenarios (e.g., user checkout, trade execution) and detail the interactions between containers/components using sequence diagrams.

*Diagram and explain the step-by-step flow for a key process.*

### 4.4. Technology Stack

*List the key technologies chosen for the solution and provide a brief justification for each choice.*

| **Layer** | **Technology** | **Version** | **Rationale** | 
|-|-|-|-|
| **Frontend** | *e.g., React* | *18.x* | *Corporate standard, rich ecosystem.* | 
| **Backend API** | *e.g., .NET 8* | *8.0* | *High performance, strong typing, developer skillset.* | 
| **Database** | *e.g., PostgreSQL* | *15* | *Open-source, robust, supports JSONB for flexibility.* | 
| **Cache** | *e.g., Redis* | *7.x* | *Industry standard for high-performance caching.* | 
| **Messaging** | *e.g., RabbitMQ* | *3.x* | *Supports reliable asynchronous processing.* | 

### 4.5. Design Patterns and Principles

*What key architectural patterns and software design principles will be followed?*

- **Architectural Patterns:** *e.g., Microservices, Event-Driven Architecture, CQRS.*
- **Design Principles:** *e.g., SOLID, DRY, Hexagonal Architecture (Ports and Adapters).*

## 5. Data Architecture

> **Architect's Note:** This section details how data is modeled, stored, managed, and moved through the system.

### 5.1. Logical Data Model

*Provide an Entity-Relationship Diagram (ERD) or similar diagram showing the main data entities, their attributes, and their relationships.*

### 5.2. Data Flow Diagram (DFD)

*Show how data moves through the system. Where does it originate, how is it transformed, and where is it stored?*

### 5.3. Data Storage Strategy

*Describe the databases and storage solutions chosen.*

- **Relational Data:** *e.g., Customer profiles and orders will be stored in PostgreSQL for transactional integrity.*
- **Unstructured Data:** *e.g., Product images will be stored in Azure Blob Storage.*
- **Cached Data:** *e.g., User sessions will be stored in Redis.*

### 5.4. Data Migration Strategy

*If this solution is replacing a legacy system, how will data be migrated?*

- **Approach:** *e.g., Big-bang vs. phased migration.*
- **Tools:** *e.g., Custom scripts, ETL tools.*
- **Downtime:** *Expected downtime during migration.*

### 5.5. Data Lifecycle Management

*How will data be managed over its lifetime?*

- **Data Retention Policies:** *e.g., User data will be retained for 7 years as per regulatory requirements.*
- **Archiving Strategy:** *e.g., Orders older than 2 years will be archived to cold storage.*
- **Data Masking:** *How will sensitive data be protected in non-production environments?*

## 6. Security Architecture

> **Architect's Note:** Security must be designed in, not bolted on. This section should be reviewed carefully by the security team.

### 6.1. Authentication

*How will users and systems prove their identity?*

- **Users:** *e.g., OpenID Connect (OIDC) using Azure AD as the Identity Provider.*
- **Systems:** *e.g., OAuth 2.0 Client Credentials flow for service-to-service communication.*

### 6.2. Authorization

*Once authenticated, what is a user/system allowed to do?*

- **Model:** *e.g., Role-Based Access Control (RBAC).*
- **Implementation:** *e.g., Roles and permissions will be defined in a database and associated with JWT claims.*

### 6.3. Data Protection

- **In Transit:** *All communication will be encrypted using TLS 1.2 or higher.*
- **At Rest:** *Sensitive data in the database will be encrypted using Transparent Data Encryption (TDE). All object storage will be encrypted by default.*

### 6.4. Threat Model

*What are the key security threats, and how will they be mitigated? (Consider using a framework like STRIDE).*

| **Threat Category** | **Example Threat** | **Mitigation Strategy** | 
|-|-|-|
| **Spoofing** | *API Key theft* | *Use short-lived JWTs; implement key rotation.* | 
| **Tampering** | *SQL Injection* | *Use parameterized queries/ORMs; input validation.* | 
| **Information Disclosure** | *Sensitive data in logs* | *Implement log data masking.* | 

### 6.5. Compliance

*How does this solution meet regulatory and compliance requirements (e.g., GDPR, HIPAA, PCI DSS)?*

## 7. Infrastructure and Operations Architecture

> **Architect's Note:** This section describes where the solution will run and how it will be managed in production. Collaborate closely with the infrastructure and DevOps teams.

### 7.1. Deployment Diagram

*A diagram showing the physical or cloud infrastructure. Include regions, availability zones, virtual networks, subnets, load balancers, firewalls, etc.*

### 7.2. Environments

*Describe the different environments for the solution lifecycle.*

- **Development:** *Local developer machines using Docker Compose.*
- **Testing/QA:** *A dedicated environment in the cloud for automated and manual testing.*
- **Staging/UAT:** *A production-like environment for user acceptance testing and pre-release validation.*
- **Production:** *The live environment.*

### 7.3. High Availability and Disaster Recovery (HA/DR)

- **High Availability:** *e.g., The solution will be deployed across multiple Availability Zones with auto-scaling and load balancing to handle node failures.*
- **Disaster Recovery:** *e.g., In case of a regional failure, the system will be restored from backups in a secondary region. Define the Recovery Time Objective (RTO) and Recovery Point Objective (RPO).*

### 7.4. Monitoring, Logging, and Alerting

- **Monitoring:** *Key metrics (CPU, memory, response time) will be collected using Prometheus.*
- **Logging:** *All application and system logs will be aggregated in an ELK stack (Elasticsearch, Logstash, Kibana).*
- **Alerting:** *Alerts for critical errors or performance degradation will be sent via PagerDuty to the on-call team.*

### 7.5. CI/CD (Continuous Integration / Continuous Deployment)

*Describe the automated pipeline for building, testing, and deploying the solution.*

## 8. Integration Architecture

> **Architect's Note:** Detail how your solution interacts with all external systems. This is often a high-risk area.

### 8.1. Integration Points

| **System Name** | **Direction** | **Synchronicity** | **Protocol** | **Data Format** | 
|-|-|-|-|-|
| *e.g., Corporate ERP* | *Outbound* | *Asynchronous* | *Message Queue* | *JSON* | 
| *e.g., Payment Gateway* | *Outbound* | *Synchronous* | *REST API* | *JSON* | 
| *e.g., CRM* | *Inbound* | *Asynchronous (Batch)* | *SFTP* | *CSV* | 

### 8.2. Integration Patterns

*Describe the patterns used for integration (e.g., API Gateway, Message Broker, Event Bus, Point-to-Point).*

## 9. Architectural Decisions

> **Architect's Note:** This is one of the most valuable sections over time. It records significant decisions, the alternatives considered, and the rationale. This prevents future debates and helps onboard new team members. Use a format like an Architecture Decision Record (ADR).

| **Decision ID** | **Decision** | **Alternatives Considered** | **Rationale** | 
|-|-|-|-|
| ADR-001 | *Use PostgreSQL as the primary database.* | *MySQL, SQL Server.* | *PostgreSQL has strong JSON support, is open-source, and aligns with team expertise.* | 
| ADR-002 | *Adopt a microservices architecture.* | *Modular monolith.* | *The need for independent team deployment and technology diversity outweighed the complexity overhead.* | 

## 10. Appendices

### 10.1. Assumptions

*List any assumptions made during the design process (e.g., "Assumed that the legacy ERP system can handle 50 API calls per second").*

### 10.2. Risks

*List any technical risks and their mitigation plans (e.g., "Risk: The chosen payment gateway may have high latency. Mitigation: Conduct performance testing early in the project").*

### 10.3. Referenced Documents

*Provide links to other relevant documents (e.g., Business Requirements Document, Project Plan, API Specifications).*


`;

export default function Home() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [editorWidth, setEditorWidth] = useState(50);
  const [isArchimateDialogOpen, setIsArchimateDialogOpen] = useState(false);
  const [isGutterMenuOpen, setGutterMenuOpen] = useState(false);
  const [gutterMenuPosition, setGutterMenuPosition] = useState({ x: 0, y: 0 });
  const [gutterLineContent, setGutterLineContent] = useState('');
  const [isPreviewScrolling, setIsPreviewScrolling] = useState(false);

  const previewScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editorRef = useRef<CodeMirrorEditorRef>(null);
  const previewWrapperRef = useRef<ElementRef<'div'>>(null);
  const mainContainerRef = useRef<ElementRef<'main'>>(null);

  const { mermaidError } = useMermaidValidator(markdown);
  const [isDescribeProcessing, setIsDescribeProcessing] = useState(false);
  
  // Track scroll positions and which pane is being actively scrolled
  const lastEditorScrollRef = useRef(0);
  const lastPreviewScrollRef = useRef(0);
  const userScrollSourceRef = useRef<'editor' | 'preview' | null>(null);
  const scrollMonitorRef = useRef<number | null>(null);
  
  // Lock semantics: if syncing FROM editor TO preview, lock = 'editor'
  // This prevents preview scroll events from being interpreted as new user input
  const isSyncingRef = useRef<'editor' | 'preview' | null>(null);
  const syncLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDownOnResizer = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (mainContainerRef.current) {
      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 10 && newWidth < 90) {
        setEditorWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Describe with AI processing state is handled in handleDescribeMermaid

  const handleDescribeMermaid = (script: string, startIndex: number) => {
    // Prevent re-entrancy while processing
    if (isDescribeProcessing) {
      toast({
        variant: 'destructive',
        title: 'AI Busy',
        description: 'An AI request is already in progress. Please wait a moment and try again.',
      });
      return;
    }

    // Set processing state immediately (synchronously) so dialog appears right away
    setIsDescribeProcessing(true);
    console.log('[AI] DescribeMermaid called with script:', script);

    // Then run the async work inside a transition for non-blocking updates
    startTransition(async () => {
      try {
        const prompt = `You are an expert technical writer. Analyze the following Mermaid diagram script and generate a clear, concise, and accurate description of what it represents. Explain the components and their relationships in plain English. Do not wrap your response in markdown. Here is the script: ${script}`;
        const description = await geminiCallCloudflare(prompt);
        console.log('[AI] DescribeMermaid response:', description);
        const newMarkdown =
          markdown.substring(0, startIndex) +
          description +
          '\n\n' +
          markdown.substring(startIndex);
        setMarkdown(newMarkdown);
        toast({
          title: "✅ Success!",
          description: "Description added above the diagram.",
        });
      } catch (error: any) {
        console.error('[AI] DescribeMermaid error:', error);
        // Show a friendly message that the model might be busy
        toast({
          variant: "destructive",
          title: "❌ AI Error",
          description: error?.message || 'The model is busy or unavailable. Please try again slightly later.',
        });
      } finally {
        setIsDescribeProcessing(false);
      }
    });
  };

  const handleInsertMermaidTemplate = (template?: string) => {
    if (template) {
      editorRef.current?.insertText(template);
    } else {
      setIsArchimateDialogOpen(true);
    }
    setGutterMenuOpen(false);
  };

  const handleGutterPlusClick = (cursorInfo: {
    x: number;
    y: number;
    lineContent: string;
  }) => {
    setGutterMenuPosition({ x: cursorInfo.x, y: cursorInfo.y });
    setGutterLineContent(cursorInfo.lineContent);
    setGutterMenuOpen(true);
  };

  const handleInsertMenuContent = (content: string) => {
    editorRef.current?.insertText(content);
  };

  const handlePrint = () => {
    window.print();
  };

  // Continuous scroll synchronization monitor
  const monitorScrollSync = useCallback(() => {
    const editorView = editorRef.current?.getView();
    const previewEl = previewWrapperRef.current;
    
    if (!editorView || !previewEl) {
      if (scrollMonitorRef.current !== null) {
        cancelAnimationFrame(scrollMonitorRef.current);
        scrollMonitorRef.current = null;
      }
      return;
    }

    const editorScrollEl = editorView.scrollDOM;
    const currentEditorScroll = editorScrollEl.scrollTop;
    const currentPreviewScroll = previewEl.scrollTop;
    
    const editorDelta = currentEditorScroll - lastEditorScrollRef.current;
    const previewDelta = currentPreviewScroll - lastPreviewScrollRef.current;
    
    // Update positions
    lastEditorScrollRef.current = currentEditorScroll;
    lastPreviewScrollRef.current = currentPreviewScroll;
    
    // CRITICAL: Sync whenever user source is set, AS LONG AS we're not in the opposite sync direction
    // This allows continuous scrolling to keep syncing
    
    // Case 1: User is scrolling editor
    // Only prevent sync if we're currently syncing FROM preview TO editor
    if (userScrollSourceRef.current === 'editor' && editorDelta !== 0 && isSyncingRef.current !== 'preview') {
      const scrollPercentage = currentEditorScroll / (editorScrollEl.scrollHeight - editorScrollEl.clientHeight);
      const targetPreviewScroll = scrollPercentage * (previewEl.scrollHeight - previewEl.clientHeight);
      
      // Mark that we're syncing FROM editor TO preview
      isSyncingRef.current = 'editor';
      if (syncLockTimeoutRef.current) clearTimeout(syncLockTimeoutRef.current);
      syncLockTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = null;
        userScrollSourceRef.current = null;
      }, 600);
      
      previewEl.scrollTo({
        top: targetPreviewScroll,
        behavior: 'smooth'
      });
    }
    // Case 2: User is scrolling preview
    // Only prevent sync if we're currently syncing FROM editor TO preview
    else if (userScrollSourceRef.current === 'preview' && previewDelta !== 0 && isSyncingRef.current !== 'editor') {
      const scrollPercentage = currentPreviewScroll / (previewEl.scrollHeight - previewEl.clientHeight);
      const targetEditorScroll = scrollPercentage * (editorScrollEl.scrollHeight - editorScrollEl.clientHeight);
      
      // Mark that we're syncing FROM preview TO editor
      isSyncingRef.current = 'preview';
      if (syncLockTimeoutRef.current) clearTimeout(syncLockTimeoutRef.current);
      syncLockTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = null;
        userScrollSourceRef.current = null;
      }, 600);
      
      editorScrollEl.scrollTo({
        top: targetEditorScroll,
        behavior: 'smooth'
      });
    }
    
    // Continue monitoring
    scrollMonitorRef.current = requestAnimationFrame(monitorScrollSync);
  }, []);

  // Start monitoring on mount
  useEffect(() => {
    scrollMonitorRef.current = requestAnimationFrame(monitorScrollSync);
    return () => {
      if (scrollMonitorRef.current !== null) {
        cancelAnimationFrame(scrollMonitorRef.current);
      }
      if (syncLockTimeoutRef.current) {
        clearTimeout(syncLockTimeoutRef.current);
      }
      if (previewScrollTimeoutRef.current) {
        clearTimeout(previewScrollTimeoutRef.current);
      }
    };
  }, [monitorScrollSync]);

  const handleEditorScroll = () => {
    // Only set source if we're not currently syncing FROM preview TO editor
    // If isSyncingRef === 'preview', that means preview was scrolled and triggered editor sync
    if (isSyncingRef.current !== 'preview') {
      userScrollSourceRef.current = 'editor';
    }
  };

  const handlePreviewScroll = () => {
    // Only set source if we're not currently syncing FROM editor TO preview
    // If isSyncingRef === 'editor', that means editor was scrolled and triggered preview sync
    if (isSyncingRef.current !== 'editor') {
      userScrollSourceRef.current = 'preview';
    }
    
    // Hide formatting island when preview is scrolled
    setIsPreviewScrolling(true);
    if (previewScrollTimeoutRef.current) {
      clearTimeout(previewScrollTimeoutRef.current);
    }
    previewScrollTimeoutRef.current = setTimeout(() => {
      setIsPreviewScrolling(false);
    }, 300);
  }


  return (
    <>
      {/* AI Processing Dialog - visible while request in-flight */}
      <AIProcessingDialog 
        isOpen={isDescribeProcessing}
        message="Analyzing your Mermaid diagram with AI..."
      />

      {/* Fixed container for popups rendered above everything */}
      <div style={{ position: 'relative', zIndex: 9999 }}>
        {/* Insert Menu Popover - Using portal-like approach */}
        <InsertMenuPopover
          open={isGutterMenuOpen}
          onOpenChange={setGutterMenuOpen}
          onInsert={handleInsertMenuContent}
          currentLineContent={gutterLineContent}
          position={gutterMenuPosition}
          onInsertMermaid={() => handleInsertMermaidTemplate()}
          onInsertArchimate={() => {
            setIsArchimateDialogOpen(true);
            setGutterMenuOpen(false);
          }}
        />
      </div>

      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center justify-between px-4 py-2 border-b border-border shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <svg role="img" className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><title>LiveMate</title><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-headline">LiveMate</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Network className="mr-2 h-4 w-4" />
                  Insert Mermaid
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleInsertMermaidTemplate()}>
                  Generate from Archimate...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleInsertMermaidTemplate('```mermaid\ngraph TD\n    A[Start] --> B{Decision?};\n    B -- Yes --> C[Do This];\n    B -- No --> D[Do That];\n```')}>
                  Flowchart
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleInsertMermaidTemplate('```mermaid\nsequenceDiagram\n    participant A\n    participant B\n    A->>B: Hello B, how are you?\n    B-->>A: Great, and you?\n```')}>
                  Sequence Diagram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 'Enhance with AI' removed — only Describe with AI for Mermaid is supported now */}
            <Button onClick={handlePrint} variant="ghost" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        </header>
        <main ref={mainContainerRef} className="flex flex-row flex-grow overflow-hidden">
          <div
            className="h-full flex flex-col overflow-auto relative shrink-0"
            style={{ width: `${editorWidth}%`}}
          >
            <CodeMirrorEditor
              ref={editorRef}
              value={markdown}
              onChange={setMarkdown}
              mermaidError={mermaidError}
              onPlusClick={handleGutterPlusClick}
              onDescribeMermaid={handleDescribeMermaid}
              onScroll={handleEditorScroll}
              isExternalScrolling={isPreviewScrolling}
              isDescribeProcessing={isDescribeProcessing}
            />
          </div>

          <div
            onMouseDown={handleMouseDownOnResizer}
            className="w-1 cursor-col-resize bg-border hover:bg-primary transition-colors"
          />
          <div 
              ref={previewWrapperRef}
              className="h-full overflow-y-auto bg-card flex-grow"
              onScroll={handlePreviewScroll}
          >
            <MarkdownPreview markdown={markdown} />
          </div>
        </main>
      </div>

      

      <ArchimateGeneratorDialog
        open={isArchimateDialogOpen}
        onOpenChange={setIsArchimateDialogOpen}
        onInsert={(script) => {
          editorRef.current?.insertText(script);
          setIsArchimateDialogOpen(false);
        }}
      />
    </>
  );
}
