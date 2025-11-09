"use client";

import { EditToolsDialog } from './EditToolsDialog';
import { ViewToolsDialog } from './ViewToolsDialog';

interface ToolsActionsProps {
  tool: {
    tool: string;
    cmd: string;
    descr: string;
    tooltype: string;
    cmdarg: string;
    page: string;
    mode: string;
    output: string;
  };
}

export function ToolsActions({ tool }: ToolsActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewToolsDialog tool={tool.tool} toolName={tool.tool} />
      <EditToolsDialog tool={tool} />
    </div>
  );
}

