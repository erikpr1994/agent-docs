export interface DependencyInfo {
  name: string;
}

export interface DocSource {
  type: "llms-txt" | "context7" | "mcp" | "docs-url" | "skill";
  url?: string;
  identifier?: string; // Context7 library ID like "/facebook/react"
  command?: string; // MCP install command
  endpoint?: string; // MCP endpoint URL
}

export interface ResolvedDependency {
  info: DependencyInfo;
  sources: DocSource[];
  homepage?: string;
  repository?: string;
}

export interface ManualResource {
  name: string;
  type: "skill" | "docs" | "file";
  url?: string;
  path?: string;
}

export interface RegistryMetadata {
  homepage?: string;
  repository?: string;
  description?: string;
}

export interface Config {
  resolvers?: {
    llmsTxt?: boolean;
    context7?: boolean;
    mcp?: boolean;
  };
  concurrency?: number;
  exclude?: string[];
  resources?: ManualResource[];
  context7ApiKey?: string;
}
