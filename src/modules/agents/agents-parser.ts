// src/modules/agents/agents-parser.ts

/**
 * Agents File Parser
 *
 * Handles parsing of AGENTS.md and agent definition files.
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { Logger } from '../../core/logger.js';
import {
  ParsedAgentsFile,
  ParsedAgentSection,
  AgentDefinitionFile,
} from './agents.types.js';

/**
 * AgentsParser - Parses agent definition files
 */
export class AgentsParser {
  constructor(
    private projectRoot: string,
    private agentsFilePath: string,
    private agentsDir: string,
    private logger: Logger
  ) {}

  /**
   * Load and parse AGENTS.md file
   */
  async loadAgentsFile(): Promise<ParsedAgentsFile | null> {
    const agentsPath = join(this.projectRoot, this.agentsFilePath);

    try {
      await stat(agentsPath);
    } catch {
      this.logger.debug(`AGENTS.md not found at ${agentsPath}`);
      return null;
    }

    try {
      const content = await readFile(agentsPath, 'utf-8');
      return this.parseAgentsMarkdown(content, agentsPath);
    } catch (error) {
      this.logger.error('Failed to load AGENTS.md:', error);
      return null;
    }
  }

  /**
   * Parse AGENTS.md markdown content
   */
  parseAgentsMarkdown(content: string, path: string): ParsedAgentsFile {
    const lines = content.split('\n');
    const agents: ParsedAgentSection[] = [];
    const errors: string[] = [];

    let currentAgent: Partial<ParsedAgentSection> | null = null;
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Agent header (## Agent Name)
      const agentMatch = line.match(/^##\s+(.+?)\s*(?:Agent)?$/i);
      if (agentMatch) {
        if (currentAgent && currentAgent.name) {
          currentAgent.endLine = lineNum - 1;
          agents.push(currentAgent as ParsedAgentSection);
        }

        const name = agentMatch[1].trim();
        currentAgent = {
          name,
          id: this.nameToId(name),
          responsibilities: [],
          delegationRules: [],
          startLine: lineNum,
        };
        currentSection = '';
        continue;
      }

      // Section headers within agent
      if (line.match(/^-\s*Name:/i)) {
        const nameMatch = line.match(/^-\s*Name:\s*`?([^`]+)`?/i);
        if (nameMatch && currentAgent) {
          currentAgent.id = nameMatch[1].trim();
        }
        continue;
      }

      if (line.match(/^-\s*Responsibilities:/i)) {
        currentSection = 'responsibilities';
        continue;
      }

      if (line.match(/^-\s*When to delegate:/i)) {
        currentSection = 'delegation';
        continue;
      }

      // List items
      const listMatch = line.match(/^\s+-\s+(.+)/);
      if (listMatch && currentAgent) {
        const item = listMatch[1].trim();
        if (currentSection === 'responsibilities') {
          currentAgent.responsibilities?.push(item);
        } else if (currentSection === 'delegation') {
          currentAgent.delegationRules?.push(item);
        }
      }
    }

    // Save last agent
    if (currentAgent && currentAgent.name) {
      currentAgent.endLine = lines.length;
      agents.push(currentAgent as ParsedAgentSection);
    }

    return {
      path,
      agents,
      errors,
      parsedAt: new Date(),
    };
  }

  /**
   * Load agent definition files from .claude/agents/
   */
  async loadAgentDefinitions(): Promise<AgentDefinitionFile[]> {
    const agentsDir = join(this.projectRoot, this.agentsDir);
    const definitions: AgentDefinitionFile[] = [];

    try {
      await stat(agentsDir);
    } catch {
      this.logger.debug(`Agents directory not found: ${agentsDir}`);
      return definitions;
    }

    try {
      const files = await readdir(agentsDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        try {
          const filePath = join(agentsDir, file);
          const content = await readFile(filePath, 'utf-8');
          const agentId = basename(file, '.md');
          definitions.push(this.parseAgentDefinition(content, filePath, agentId));
        } catch (error) {
          this.logger.warn(`Failed to parse agent definition: ${file}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load agent definitions:', error);
    }

    return definitions;
  }

  /**
   * Parse agent definition file
   */
  parseAgentDefinition(content: string, path: string, agentId: string): AgentDefinitionFile {
    const lines = content.split('\n');
    const result: AgentDefinitionFile = {
      path,
      agentId,
      content: {},
      rawContent: content,
    };

    let currentSection = '';
    const sections: Record<string, string[]> = {};

    for (const line of lines) {
      const roleMatch = line.match(/^Role:\s*(.+)/i);
      if (roleMatch) {
        result.content.role = roleMatch[1].trim();
        continue;
      }

      if (line.match(/^(Core principles|Guidelines|You specialize in):/i)) {
        currentSection = line.toLowerCase().includes('principle') ? 'principles' :
          line.toLowerCase().includes('specialize') ? 'specializations' : 'guidelines';
        sections[currentSection] = [];
        continue;
      }

      const listMatch = line.match(/^-\s+(.+)/);
      if (listMatch && currentSection) {
        sections[currentSection]?.push(listMatch[1].trim());
      }
    }

    result.content.principles = sections['principles'];
    result.content.specializations = sections['specializations'];
    result.content.guidelines = sections['guidelines'];

    return result;
  }

  // Utility methods
  nameToId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  idToName(id: string): string {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
